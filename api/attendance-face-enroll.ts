import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  ATTENDANCE_PRIVATE_BUCKET,
  attendanceBiometricEncryptionKey,
  attendanceServiceRoleKey,
  attendanceSupabaseAnonKey,
  attendanceSupabaseUrl,
  encryptFaceDescriptor,
  finiteNumber,
  isSameOriginRequest,
  parseFaceImage,
  validateFaceDescriptor,
} from './_attendanceBiometric.js';

const MANAGER_ROLES = new Set(['OWNER', 'BUSINESS_UNIT_ADMIN']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isSameOriginRequest(req)) return res.status(403).json({ error: 'Permintaan lintas origin ditolak.' });
  if (!attendanceSupabaseUrl || !attendanceSupabaseAnonKey || !attendanceServiceRoleKey || !attendanceBiometricEncryptionKey) {
    return res.status(500).json({ error: 'Konfigurasi biometrik server belum lengkap.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Sesi diperlukan.' });

  try {
    const employeeId = String(req.body?.employee_id ?? '').trim();
    if (!employeeId) return res.status(400).json({ error: 'ID karyawan wajib diisi.' });
    if (req.body?.consent_confirmed !== true) {
      return res.status(400).json({ error: 'Persetujuan pendaftaran wajah wajib dikonfirmasi.' });
    }

    const caller = createClient(attendanceSupabaseUrl, attendanceSupabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: callerData, error: callerError } = await caller.auth.getUser();
    if (callerError || !callerData.user) return res.status(401).json({ error: 'Sesi tidak valid.' });

    const { data: memberships, error: membershipError } = await caller
      .from('attendance_memberships')
      .select('role, organization_id, business_unit_id')
      .eq('user_id', callerData.user.id)
      .eq('is_active', true);
    if (membershipError) return res.status(500).json({ error: 'Keanggotaan gagal diperiksa.' });

    const managing = (memberships ?? []).filter(membership => MANAGER_ROLES.has(String(membership.role)));
    if (managing.length === 0) {
      return res.status(403).json({ error: 'Hanya owner atau admin unit yang dapat mendaftarkan wajah.' });
    }

    const image = parseFaceImage(req.body?.image_data_url);
    const descriptor = validateFaceDescriptor(req.body?.descriptor);
    const faceScore = finiteNumber(req.body?.face_score, 'Skor wajah');
    const antispoofScore = finiteNumber(req.body?.antispoof_score, 'Skor anti-spoof');
    const livenessScore = finiteNumber(req.body?.liveness_score, 'Skor liveness');
    if (
      faceScore < 0.6 || faceScore > 1
      || antispoofScore < 0.5 || antispoofScore > 1
      || livenessScore < 0.5 || livenessScore > 1
    ) {
      return res.status(422).json({ error: 'Kualitas atau liveness wajah belum memenuhi batas pendaftaran.' });
    }

    const admin = createClient(attendanceSupabaseUrl, attendanceServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const [{ data: employee, error: employeeError }, { data: assignments, error: assignmentError }] = await Promise.all([
      admin.from('attendance_employees')
        .select('id, organization_id, employee_no, full_name, is_active')
        .eq('id', employeeId)
        .maybeSingle(),
      admin.from('attendance_employee_assignments')
        .select('id, business_unit_id, location_id, is_active')
        .eq('employee_id', employeeId),
    ]);
    if (employeeError || assignmentError) return res.status(500).json({ error: 'Data karyawan gagal diperiksa.' });
    if (!employee?.is_active) return res.status(404).json({ error: 'Karyawan aktif tidak ditemukan.' });

    const activeAssignment = (assignments ?? []).find(assignment => assignment.is_active);
    const authorized = managing.some(membership => (
      membership.organization_id === employee.organization_id
      && (membership.role === 'OWNER'
        || !membership.business_unit_id
        || membership.business_unit_id === activeAssignment?.business_unit_id)
    ));
    if (!authorized) return res.status(403).json({ error: 'Karyawan berada di luar unit yang Anda kelola.' });

    const { data: previousProfile } = await admin
      .from('attendance_biometric_profiles')
      .select('reference_object_path')
      .eq('employee_id', employeeId)
      .maybeSingle();

    const timestamp = Date.now();
    const storagePath = `enrollments/${employee.organization_id}/${employeeId}/${timestamp}-${image.sha256.slice(0, 16)}.${image.extension}`;
    const { error: uploadError } = await admin.storage
      .from(ATTENDANCE_PRIVATE_BUCKET)
      .upload(storagePath, image.bytes, {
        contentType: image.contentType,
        cacheControl: '0',
        upsert: false,
      });
    if (uploadError) return res.status(502).json({ error: `Foto wajah gagal disimpan: ${uploadError.message}` });

    const encrypted = encryptFaceDescriptor(descriptor);
    const now = new Date().toISOString();
    const { error: profileError } = await admin
      .from('attendance_biometric_profiles')
      .upsert({
        organization_id: employee.organization_id,
        employee_id: employeeId,
        reference_object_path: storagePath,
        reference_sha256: image.sha256,
        descriptor_ciphertext: encrypted.ciphertext,
        descriptor_iv: encrypted.iv,
        descriptor_tag: encrypted.tag,
        descriptor_length: descriptor.length,
        model_name: 'human-faceres',
        model_version: '3.3.6',
        match_threshold: 0.55,
        status: 'ACTIVE',
        consent_at: now,
        enrolled_by: callerData.user.id,
        updated_at: now,
      }, { onConflict: 'employee_id' });
    if (profileError) {
      await admin.storage.from(ATTENDANCE_PRIVATE_BUCKET).remove([storagePath]);
      return res.status(400).json({ error: profileError.message });
    }

    const { error: employeeUpdateError } = await admin
      .from('attendance_employees')
      .update({ face_enrolled: true, face_enrolled_at: now })
      .eq('id', employeeId);
    if (employeeUpdateError) return res.status(400).json({ error: employeeUpdateError.message });

    await admin.from('attendance_media').insert({
      organization_id: employee.organization_id,
      employee_id: employeeId,
      media_kind: 'FACE_ENROLLMENT',
      storage_path: storagePath,
      content_type: image.contentType,
      byte_size: image.bytes.length,
      content_sha256: image.sha256,
      capture_metadata: {
        face_score: faceScore,
        antispoof_score: antispoofScore,
        liveness_score: livenessScore,
        model: 'human-3.3.6',
      },
    });

    await admin.from('attendance_audit_logs').insert({
      organization_id: employee.organization_id,
      business_unit_id: activeAssignment?.business_unit_id ?? null,
      entity_type: 'BIOMETRIC_PROFILE',
      entity_id: employeeId,
      action: previousProfile ? 'REENROLL' : 'ENROLL',
      actor_user_id: callerData.user.id,
      after_data: {
        employee_no: employee.employee_no,
        model: 'human-3.3.6',
        descriptor_length: descriptor.length,
        consent_confirmed: true,
      },
    });

    if (previousProfile?.reference_object_path && previousProfile.reference_object_path !== storagePath) {
      await admin.storage.from(ATTENDANCE_PRIVATE_BUCKET).remove([previousProfile.reference_object_path]);
    }

    return res.status(200).json({
      employee_id: employeeId,
      face_enrolled: true,
      face_enrolled_at: now,
      model: 'human-3.3.6',
    });
  } catch (reason) {
    return res.status(400).json({ error: reason instanceof Error ? reason.message : 'Pendaftaran wajah gagal.' });
  }
}
