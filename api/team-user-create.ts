import { authorizeTeamAdmin } from '../server/teamAdmin.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Team members sign in with a username, so Auth still needs an address.
const INTERNAL_DOMAIN = 'team.ggindoapparel.internal';
const USERNAME_PATTERN = /^[a-z0-9._-]{3,40}$/;
const PIN_PATTERN = /^\d{6,12}$/;

function cleanAuthErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') return '';
  const record = err as Record<string, unknown>;
  const raw = typeof record.message === 'string' ? record.message.trim() : '';
  if (!raw || raw === '{}' || raw === '[]' || raw === 'null' || raw === '[object Object]') {
    return '';
  }
  return raw;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authorized = await authorizeTeamAdmin(req, res);
  if (!authorized) return;
  const { admin, user: callerUser } = authorized;

  const username = String(req.body?.username ?? '').trim().toLowerCase();
  const pin = String(req.body?.pin ?? '').trim();
  const fullName = String(req.body?.full_name ?? '').trim();
  const jobTitle = String(req.body?.job_title ?? '').trim();
  const roleCode = String(req.body?.role_code ?? '').trim().toLowerCase();

  if (!USERNAME_PATTERN.test(username)) return res.status(400).json({ error: 'Username 3-40 karakter, hanya huruf kecil, angka, titik, garis bawah, atau strip.' });
  if (!PIN_PATTERN.test(pin)) return res.status(400).json({ error: 'PIN harus 6-12 digit angka.' });
  if (!fullName) return res.status(400).json({ error: 'Nama lengkap wajib diisi.' });
  if (!roleCode) return res.status(400).json({ error: 'Role wajib dipilih.' });

  const { data: roleRow, error: roleError } = await admin.from('roles').select('id, code').eq('code', roleCode).maybeSingle();
  if (roleError) return res.status(500).json({ error: 'Gagal memeriksa role.' });
  if (!roleRow) return res.status(400).json({ error: 'Role tidak dikenal.' });

  const email = `${username}@${INTERNAL_DOMAIN}`;

  const { data: existingProfile, error: lookupError } = await admin.from('profiles')
    .select('id').eq('username', username).maybeSingle();
  if (lookupError) return res.status(500).json({ error: 'Gagal memeriksa username.' });
  if (existingProfile) return res.status(409).json({ error: 'Username sudah digunakan. Pilih username lain atau edit akun yang ada.' });

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true,
    app_metadata: { app_role: roleRow.code },
    user_metadata: { full_name: fullName, username, job_title: jobTitle || null },
  });

  let userId = created?.user?.id ?? '';

  if (createError || !userId) {
    // Recovery path: check if an orphaned or previously deactivated/deleted Auth user can be reused
    if (
      typeof admin.auth.admin.listUsers === 'function' &&
      typeof admin.auth.admin.updateUserById === 'function'
    ) {
      try {
        const [{ data: usersList }, { data: allProfiles }] = await Promise.all([
          admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
          admin.from('profiles').select('id, is_active'),
        ]);
        const activeProfileIds = new Set(
          ((allProfiles ?? []) as Array<{ id: string; is_active?: boolean }>)
            .filter(p => p.is_active !== false)
            .map(p => p.id),
        );
        const authUsers = (usersList?.users ?? []) as Array<{ id: string; email?: string }>;
        const exactOrphan = authUsers.find(
          u => u.email?.toLowerCase() === email.toLowerCase() && !activeProfileIds.has(u.id) && u.id !== callerUser.id,
        );
        const recycledOrphan = authUsers.find(
          u => !activeProfileIds.has(u.id) && u.id !== callerUser.id && (
            u.email?.toLowerCase().endsWith('@deleted.ggindoapparel.internal') ||
            u.email?.toLowerCase().endsWith(`@${INTERNAL_DOMAIN}`)
          ),
        );
        const targetAuthUser = exactOrphan ?? recycledOrphan;
        if (targetAuthUser) {
          const { data: updatedAuth, error: updateErr } = await admin.auth.admin.updateUserById(targetAuthUser.id, {
            email,
            password: pin,
            email_confirm: true,
            app_metadata: { app_role: roleRow.code },
            user_metadata: { full_name: fullName, username, job_title: jobTitle || null },
          });
          if (!updateErr && updatedAuth?.user?.id) {
            userId = updatedAuth.user.id;
          }
        }
      } catch {
        // Ignore recovery errors and fall through to standard error reporting
      }
    }
  }

  if (!userId) {
    if (createError?.code === 'email_exists' || createError?.code === 'user_already_exists') {
      return res.status(409).json({ error: 'Username sudah terdaftar di autentikasi. Gunakan username lain.' });
    }
    const cleanMsg = cleanAuthErrorMessage(createError);
    const isTrigger500 = !cleanMsg || (createError as { status?: number } | null)?.status === 500 || cleanMsg.toLowerCase().includes('database error');
    const friendlyError = isTrigger500
      ? 'Database Supabase menolak pembuatan user baru karena izin fungsi trigger (handle_new_auth_user / provision_auth_user) tercabut saat hardening. Jalankan SQL perbaikan trigger di Supabase SQL Editor.'
      : cleanMsg;
    const sqlFixScript = [
      'GRANT USAGE ON SCHEMA public TO supabase_auth_admin, postgres, service_role;',
      'CREATE OR REPLACE FUNCTION public.handle_new_auth_user()',
      'RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$',
      'BEGIN',
      '  BEGIN',
      '    PERFORM public.provision_auth_user(new.id);',
      '  EXCEPTION WHEN OTHERS THEN',
      '    NULL;',
      '  END;',
      '  RETURN new;',
      'END; $$;',
      'GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO supabase_auth_admin, postgres, service_role, authenticated, anon;',
      'GRANT EXECUTE ON FUNCTION public.provision_auth_user(uuid) TO supabase_auth_admin, postgres, service_role, authenticated, anon;',
    ].join('\n');
    return res.status(400).json({
      error: friendlyError,
      sql_fix: isTrigger500 ? sqlFixScript : undefined,
    });
  }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: userId,
    username,
    full_name: fullName,
    job_title: jobTitle || null,
    is_active: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return res.status(500).json({ error: 'Gagal membuat profil pengguna.' });
  }

  const { error: assignmentError } = await admin.rpc('replace_workspace_user_role', { p_user: userId, p_role: roleRow.id });
  if (assignmentError) {
    await admin.from('profiles').update({ is_active: false }).eq('id', userId);
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return res.status(500).json({ error: 'Gagal menetapkan role pengguna. Akun baru tidak diaktifkan.' });
  }

  return res.status(201).json({ id: userId, username, email, full_name: fullName, role_code: roleCode });
}
