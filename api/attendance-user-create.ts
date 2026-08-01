import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Membuat pengguna SISTEM ATTENDANCE.
 *
 * Sengaja terpisah dari api/team-user-create.ts (Product Launch OS):
 * akun yang dibuat di sini HANYA memperoleh attendance_memberships dan
 * TIDAK pernah diberi user_roles, sehingga tidak bisa masuk Product Launch OS.
 * Pemeriksaan izin pemanggil pun memakai keanggotaan Attendance, bukan
 * permission launch.*.
 */

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Kru absen memakai nomor pegawai, sedangkan Auth tetap memerlukan alamat email.
// Domain dibedakan dari Product Launch agar dua kolam pengguna mudah dipisahkan.
const INTERNAL_DOMAIN = 'attendance.ggindoapparel.internal';
const EMPLOYEE_NO_PATTERN = /^[A-Za-z0-9-]{3,32}$/;
const PIN_PATTERN = /^\d{6}$/;
const ALLOWED_ROLES = new Set([
  'LOCATION_MANAGER',
  'SUPERVISOR',
  'EMPLOYEE',
  'AUDITOR',
]);
// Hanya peran ini yang boleh membuat pengguna Attendance.
const MANAGER_ROLES = new Set(['OWNER', 'BUSINESS_UNIT_ADMIN']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseUrl || !supabaseAnonKey) return res.status(500).json({ error: 'Konfigurasi Supabase belum lengkap' });
  if (!serviceRoleKey) return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY belum diset di server' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Sesi diperlukan' });

  const caller = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData.user) return res.status(401).json({ error: 'Sesi tidak valid' });

  // Izin dinilai dari keanggotaan Attendance milik pemanggil.
  const { data: callerMemberships, error: membershipError } = await caller
    .from('attendance_memberships')
    .select('role, organization_id, business_unit_id')
    .eq('user_id', userData.user.id)
    .eq('is_active', true);

  if (membershipError) return res.status(500).json({ error: 'Gagal memeriksa keanggotaan Attendance' });

  const managing = (callerMemberships ?? []).filter((m) => MANAGER_ROLES.has(String(m.role)));
  if (managing.length === 0) {
    return res.status(403).json({ error: 'Hanya owner atau admin unit Attendance yang dapat membuat pengguna' });
  }

  const employeeNo = String(req.body?.employee_no ?? '').trim().toUpperCase();
  const pin = String(req.body?.pin ?? '').trim();
  const fullName = String(req.body?.full_name ?? '').trim();
  const phone = String(req.body?.phone ?? '').trim();
  const role = String(req.body?.role ?? 'EMPLOYEE').trim().toUpperCase();
  const businessUnitId = String(req.body?.business_unit_id ?? '').trim();
  const locationId = String(req.body?.location_id ?? '').trim();
  const jobTitle = String(req.body?.job_title ?? '').trim();

  if (!EMPLOYEE_NO_PATTERN.test(employeeNo)) {
    return res.status(400).json({ error: 'Nomor pegawai 3-32 karakter, hanya huruf, angka, atau strip.' });
  }
  if (!PIN_PATTERN.test(pin)) {
    return res.status(400).json({ error: 'PIN kru harus tepat 6 digit.' });
  }
  if (!fullName) return res.status(400).json({ error: 'Nama lengkap wajib diisi.' });
  if (!ALLOWED_ROLES.has(role)) return res.status(400).json({ error: 'Peran tidak dikenal.' });
  if (!businessUnitId || !locationId) {
    return res.status(400).json({ error: 'Unit bisnis dan lokasi penempatan wajib dipilih.' });
  }

  // Admin unit hanya boleh membuat pengguna pada unit yang dikelolanya.
  const isOwner = managing.some((m) => m.role === 'OWNER');
  if (!isOwner && !managing.some((m) => m.business_unit_id === businessUnitId)) {
    return res.status(403).json({ error: 'Anda hanya dapat membuat pengguna pada unit yang Anda kelola.' });
  }

  const organizationId = managing[0].organization_id;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Nomor pegawai unik — cegah duplikasi sebelum akun Auth dibuat.
  const { data: existing } = await admin
    .from('attendance_employees')
    .select('id')
    .eq('employee_no', employeeNo)
    .maybeSingle();
  if (existing) return res.status(409).json({ error: `Nomor pegawai ${employeeNo} sudah dipakai.` });

  const email = `${employeeNo.toLowerCase()}@${INTERNAL_DOMAIN}`;
  // Kru tidak mengetahui password Auth-nya. Login harian memakai PIN kios yang
  // diverifikasi endpoint server, kemudian ditukar menjadi sesi Supabase.
  const authPassword = `${randomBytes(48).toString('base64url')}aA1!`;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: authPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      employee_no: employeeNo,
      system: 'attendance',
      login_method: 'attendance_pin',
    },
  });
  if (createError || !created.user) {
    return res.status(400).json({ error: createError?.message ?? 'Akun Auth gagal dibuat.' });
  }

  const newUserId = created.user.id;

  // Bila salah satu langkah gagal, akun Auth dibatalkan agar tidak menyisakan
  // pengguna yatim yang bisa login tanpa profil karyawan.
  const rollback = async (message: string) => {
    await admin.auth.admin.deleteUser(newUserId).catch(() => {});
    return res.status(400).json({ error: message });
  };

  const { data: employee, error: employeeError } = await admin
    .from('attendance_employees')
    .insert({
      organization_id: organizationId,
      user_id: newUserId,
      employee_no: employeeNo,
      full_name: fullName,
      email,
      phone: phone || null,
      is_active: true,
    })
    .select('id')
    .single();
  if (employeeError || !employee) return rollback(employeeError?.message ?? 'Data karyawan gagal dibuat.');

  const { error: assignmentError } = await admin
    .from('attendance_employee_assignments')
    .insert({
      employee_id: employee.id,
      business_unit_id: businessUnitId,
      location_id: locationId,
      job_title: jobTitle || null,
      is_primary: true,
      is_active: true,
    });
  if (assignmentError) {
    await admin.from('attendance_employees').delete().eq('id', employee.id);
    return rollback(assignmentError.message);
  }

  // Keanggotaan Attendance — TIDAK ada penulisan ke user_roles, sehingga akun
  // ini tidak memperoleh akses Product Launch OS.
  const { error: membershipInsertError } = await admin
    .from('attendance_memberships')
    .insert({
      user_id: newUserId,
      organization_id: organizationId,
      business_unit_id: businessUnitId,
      location_id: locationId,
      role,
      is_active: true,
    });
  if (membershipInsertError) {
    await admin.from('attendance_employee_assignments').delete().eq('employee_id', employee.id);
    await admin.from('attendance_employees').delete().eq('id', employee.id);
    return rollback(membershipInsertError.message);
  }

  const { error: pinError } = await admin.rpc('set_attendance_pin', {
    p_user_id: newUserId,
    p_pin: pin,
    p_label: employeeNo,
  });
  if (pinError) {
    await admin.from('attendance_memberships').delete().eq('user_id', newUserId);
    await admin.from('attendance_employee_assignments').delete().eq('employee_id', employee.id);
    await admin.from('attendance_employees').delete().eq('id', employee.id);
    return rollback(pinError.message);
  }

  await admin.from('attendance_audit_logs').insert({
    organization_id: organizationId,
    business_unit_id: businessUnitId,
    entity_type: 'EMPLOYEE',
    entity_id: employee.id,
    action: 'CREATE',
    actor_user_id: userData.user.id,
    after_data: { employee_no: employeeNo, full_name: fullName, role, login_method: 'PIN_KIOSK' },
  }).select('id').maybeSingle();

  return res.status(200).json({
    employee_id: employee.id,
    user_id: newUserId,
    employee_no: employeeNo,
    role,
    pin_configured: true,
  });
}
