import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMPLOYEE_NO_PATTERN = /^[A-Za-z0-9-]{3,32}$/;
const PIN_PATTERN = /^\d{6}$/;
const MANAGER_ROLES = new Set(['OWNER', 'BUSINESS_UNIT_ADMIN']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return res.status(500).json({ error: 'Konfigurasi Supabase belum lengkap' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Sesi diperlukan' });

  const caller = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: callerData, error: callerError } = await caller.auth.getUser();
  if (callerError || !callerData.user) return res.status(401).json({ error: 'Sesi tidak valid' });

  const { data: callerMemberships, error: membershipError } = await caller
    .from('attendance_memberships')
    .select('role, organization_id, business_unit_id')
    .eq('user_id', callerData.user.id)
    .eq('is_active', true);
  if (membershipError) return res.status(500).json({ error: 'Keanggotaan gagal diperiksa' });

  const managing = (callerMemberships ?? []).filter((membership) =>
    MANAGER_ROLES.has(String(membership.role)),
  );
  if (managing.length === 0) {
    return res.status(403).json({ error: 'Hanya owner atau admin unit yang dapat memperbarui pengguna.' });
  }

  const employeeId = String(req.body?.employee_id ?? '').trim();
  const employeeNo = String(req.body?.employee_no ?? '').trim().toUpperCase();
  const fullName = String(req.body?.full_name ?? '').trim();
  const jobTitle = String(req.body?.job_title ?? '').trim();
  const pin = String(req.body?.pin ?? '').trim();

  if (!employeeId) return res.status(400).json({ error: 'ID karyawan wajib diisi.' });
  if (!EMPLOYEE_NO_PATTERN.test(employeeNo)) {
    return res.status(400).json({ error: 'Nomor pegawai 3-32 karakter, hanya huruf, angka, atau strip.' });
  }
  if (!fullName) return res.status(400).json({ error: 'Nama lengkap wajib diisi.' });
  if (pin && !PIN_PATTERN.test(pin)) {
    return res.status(400).json({ error: 'PIN baru harus tepat 6 digit.' });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: target, error: targetError } = await admin
    .from('attendance_employees')
    .select('id, user_id, organization_id, employee_no, full_name')
    .eq('id', employeeId)
    .maybeSingle();
  if (targetError || !target) return res.status(404).json({ error: 'Karyawan tidak ditemukan.' });

  const { data: assignment } = await admin
    .from('attendance_employee_assignments')
    .select('id, business_unit_id, job_title')
    .eq('employee_id', employeeId)
    .eq('is_active', true)
    .order('is_primary', { ascending: false })
    .limit(1)
    .maybeSingle();

  const authorized = managing.some((membership) =>
    membership.organization_id === target.organization_id
    && (membership.role === 'OWNER'
      || !membership.business_unit_id
      || membership.business_unit_id === assignment?.business_unit_id),
  );
  if (!authorized) return res.status(403).json({ error: 'Karyawan berada di luar unit yang Anda kelola.' });

  const { data: duplicate } = await admin
    .from('attendance_employees')
    .select('id')
    .eq('employee_no', employeeNo)
    .neq('id', employeeId)
    .maybeSingle();
  if (duplicate) return res.status(409).json({ error: `Nomor pegawai ${employeeNo} sudah dipakai.` });

  const { error: employeeError } = await admin
    .from('attendance_employees')
    .update({ employee_no: employeeNo, full_name: fullName })
    .eq('id', employeeId);
  if (employeeError) return res.status(400).json({ error: employeeError.message });

  if (assignment && jobTitle) {
    const { error: assignmentError } = await admin
      .from('attendance_employee_assignments')
      .update({ job_title: jobTitle })
      .eq('id', assignment.id);
    if (assignmentError) {
      await admin.from('attendance_employees').update({
        employee_no: target.employee_no,
        full_name: target.full_name,
      }).eq('id', employeeId);
      return res.status(400).json({ error: assignmentError.message });
    }
  }

  if (pin) {
    if (!target.user_id) {
      return res.status(400).json({ error: 'Karyawan belum memiliki akun Attendance.' });
    }
    const { error: pinError } = await admin.rpc('set_attendance_pin', {
      p_user_id: target.user_id,
      p_pin: pin,
      p_label: employeeNo,
    });
    if (pinError) {
      await admin.from('attendance_employees').update({
        employee_no: target.employee_no,
        full_name: target.full_name,
      }).eq('id', employeeId);
      if (assignment) {
        await admin.from('attendance_employee_assignments')
          .update({ job_title: assignment.job_title })
          .eq('id', assignment.id);
      }
      return res.status(400).json({ error: pinError.message });
    }
  }

  await admin.from('attendance_audit_logs').insert({
    organization_id: target.organization_id,
    business_unit_id: assignment?.business_unit_id ?? null,
    entity_type: 'EMPLOYEE',
    entity_id: employeeId,
    action: 'UPDATE',
    actor_user_id: callerData.user.id,
    before_data: {
      employee_no: target.employee_no,
      full_name: target.full_name,
      job_title: assignment?.job_title ?? null,
    },
    after_data: {
      employee_no: employeeNo,
      full_name: fullName,
      job_title: jobTitle || assignment?.job_title || null,
      pin_rotated: Boolean(pin),
    },
  });

  return res.status(200).json({ updated: true });
}
