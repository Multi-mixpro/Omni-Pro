import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MANAGER_ROLES = new Set(['OWNER', 'BUSINESS_UNIT_ADMIN']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return res.status(500).json({ error: 'Konfigurasi Supabase belum lengkap.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Sesi diperlukan.' });

  const caller = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: callerData, error: callerError } = await caller.auth.getUser();
  if (callerError || !callerData.user) return res.status(401).json({ error: 'Sesi tidak valid.' });

  const { data: callerMemberships, error: membershipError } = await caller
    .from('attendance_memberships')
    .select('role, organization_id, business_unit_id')
    .eq('user_id', callerData.user.id)
    .eq('is_active', true);
  if (membershipError) return res.status(500).json({ error: 'Keanggotaan gagal diperiksa.' });

  const managing = (callerMemberships ?? []).filter((membership) =>
    MANAGER_ROLES.has(String(membership.role)),
  );
  if (managing.length === 0) {
    return res.status(403).json({ error: 'Hanya owner atau admin unit yang dapat menghapus karyawan.' });
  }

  const employeeId = String(req.body?.employee_id ?? '').trim();
  if (!employeeId) return res.status(400).json({ error: 'ID karyawan wajib diisi.' });

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: target, error: targetError } = await admin
    .from('attendance_employees')
    .select('id, user_id, organization_id, employee_no, full_name, email, is_active')
    .eq('id', employeeId)
    .maybeSingle();
  if (targetError) return res.status(500).json({ error: 'Data karyawan gagal diperiksa.' });
  if (!target) return res.status(404).json({ error: 'Karyawan tidak ditemukan.' });
  if (!target.is_active) return res.status(200).json({ id: employeeId, deactivated: true });
  if (target.user_id === callerData.user.id) {
    return res.status(409).json({ error: 'Akun yang sedang digunakan tidak dapat menghapus dirinya sendiri.' });
  }

  const { data: assignments, error: assignmentReadError } = await admin
    .from('attendance_employee_assignments')
    .select('id, business_unit_id, location_id, job_title, is_active')
    .eq('employee_id', employeeId);
  if (assignmentReadError) return res.status(500).json({ error: 'Penempatan karyawan gagal diperiksa.' });

  const activeAssignment = (assignments ?? []).find((assignment) => assignment.is_active)
    ?? assignments?.[0]
    ?? null;
  const authorized = managing.some((membership) =>
    membership.organization_id === target.organization_id
    && (membership.role === 'OWNER'
      || !membership.business_unit_id
      || membership.business_unit_id === activeAssignment?.business_unit_id),
  );
  if (!authorized) return res.status(403).json({ error: 'Karyawan berada di luar unit yang Anda kelola.' });

  const { error: employeeError } = await admin
    .from('attendance_employees')
    .update({ is_active: false })
    .eq('id', employeeId);
  if (employeeError) return res.status(400).json({ error: employeeError.message });

  const { error: assignmentError } = await admin
    .from('attendance_employee_assignments')
    .update({ is_active: false, end_date: new Date().toISOString().slice(0, 10) })
    .eq('employee_id', employeeId);
  if (assignmentError) return res.status(400).json({ error: assignmentError.message });

  let authDisabled = false;
  if (target.user_id) {
    const { error: membershipDisableError } = await admin
      .from('attendance_memberships')
      .update({ is_active: false })
      .eq('user_id', target.user_id);
    if (membershipDisableError) return res.status(400).json({ error: membershipDisableError.message });

    const { error: pinDisableError } = await admin
      .from('attendance_login_pins')
      .update({ is_active: false })
      .eq('user_id', target.user_id);
    if (pinDisableError) return res.status(400).json({ error: pinDisableError.message });

    const authResult = await admin.auth.admin.updateUserById(target.user_id, {
      ban_duration: '876000h',
      user_metadata: {
        deactivated_at: new Date().toISOString(),
        deactivated_from_attendance: true,
      },
    });
    authDisabled = !authResult.error;
  }

  await admin.from('attendance_audit_logs').insert({
    organization_id: target.organization_id,
    business_unit_id: activeAssignment?.business_unit_id ?? null,
    entity_type: 'EMPLOYEE',
    entity_id: employeeId,
    action: 'DEACTIVATE',
    actor_user_id: callerData.user.id,
    before_data: {
      employee_no: target.employee_no,
      full_name: target.full_name,
      email: target.email,
      assignments,
    },
    after_data: { is_active: false, auth_disabled: authDisabled },
  });

  return res.status(200).json({
    id: employeeId,
    deactivated: true,
    auth_disabled: authDisabled,
  });
}
