import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  ATTENDANCE_PRIVATE_BUCKET,
  attendanceBiometricEncryptionKey,
  attendanceServiceRoleKey,
  attendanceSupabaseAnonKey,
  attendanceSupabaseUrl,
  decryptFaceDescriptor,
  faceSimilarity,
  finiteNumber,
  haversineMeters,
  isSameOriginRequest,
  jakartaDate,
  parseFaceImage,
  validateFaceDescriptor,
} from './_attendanceBiometric.js';

const EVENT_TYPES = new Set(['CHECK_IN', 'CHECK_OUT']);
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:-]{16,160}$/;

function jakartaClockMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: 'hour' | 'minute') => Number(parts.find(part => part.type === type)?.value ?? 0);
  return value('hour') * 60 + value('minute');
}

function shiftMinutes(value: string | null | undefined): number {
  const [hours, minutes] = String(value ?? '00:00').split(':').map(Number);
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isSameOriginRequest(req)) return res.status(403).json({ error: 'Permintaan lintas origin ditolak.' });
  if (!attendanceSupabaseUrl || !attendanceSupabaseAnonKey || !attendanceServiceRoleKey || !attendanceBiometricEncryptionKey) {
    return res.status(500).json({ error: 'Konfigurasi server Attendance belum lengkap.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Sesi diperlukan.' });

  try {
    const employeeId = String(req.body?.employee_id ?? '').trim();
    const eventType = String(req.body?.event_type ?? '').trim().toUpperCase();
    const idempotencyKey = String(req.body?.idempotency_key ?? '').trim();
    const deviceId = String(req.body?.device_id ?? '').trim().slice(0, 128) || null;
    if (!employeeId || !EVENT_TYPES.has(eventType)) return res.status(400).json({ error: 'Data event presensi tidak valid.' });
    if (!IDEMPOTENCY_PATTERN.test(idempotencyKey)) return res.status(400).json({ error: 'Kunci idempotensi tidak valid.' });

    const caller = createClient(attendanceSupabaseUrl, attendanceSupabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: callerData, error: callerError } = await caller.auth.getUser();
    if (callerError || !callerData.user) return res.status(401).json({ error: 'Sesi tidak valid.' });

    const admin = createClient(attendanceSupabaseUrl, attendanceServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const workDate = jakartaDate();
    const [{ data: employee }, { data: schedule }, { data: biometricProfile }, { data: attendanceDay }, { data: existingEvent }] = await Promise.all([
      admin.from('attendance_employees')
        .select('id, user_id, organization_id, employee_no, full_name, face_enrolled, is_active')
        .eq('id', employeeId)
        .maybeSingle(),
      admin.from('attendance_schedules')
        .select('id, employee_id, assignment_id, business_unit_id, location_id, work_area_id, schedule_date, is_off, shift_template:attendance_shift_templates(start_time, end_time, late_tolerance_mins)')
        .eq('employee_id', employeeId)
        .eq('schedule_date', workDate)
        .maybeSingle(),
      admin.from('attendance_biometric_profiles')
        .select('id, employee_id, descriptor_ciphertext, descriptor_iv, descriptor_tag, match_threshold, status, verification_count')
        .eq('employee_id', employeeId)
        .eq('status', 'ACTIVE')
        .maybeSingle(),
      admin.from('attendance_days')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('work_date', workDate)
        .maybeSingle(),
      admin.from('attendance_events')
        .select('id, employee_id, event_type, occurred_at_server, geofence_status, risk_flags')
        .eq('employee_id', employeeId)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle(),
    ]);

    if (!employee?.is_active || employee.user_id !== callerData.user.id) {
      return res.status(403).json({ error: 'Anda hanya dapat mencatat presensi untuk akun karyawan sendiri.' });
    }
    if (existingEvent) return res.status(200).json({ event: existingEvent, idempotent_replay: true });
    if (!schedule || schedule.is_off) return res.status(409).json({ error: 'Jadwal kerja aktif hari ini belum tersedia.' });

    const { data: assignment } = await admin
      .from('attendance_employee_assignments')
      .select('id, business_unit_id, location_id, primary_work_area_id, is_active')
      .eq('id', schedule.assignment_id)
      .eq('employee_id', employeeId)
      .maybeSingle();
    if (!assignment?.is_active) return res.status(409).json({ error: 'Penempatan kerja aktif belum tersedia.' });
    if (!employee.face_enrolled || !biometricProfile) {
      return res.status(409).json({ error: 'Wajah belum didaftarkan oleh admin. Hubungi admin unit.' });
    }
    if (eventType === 'CHECK_IN' && attendanceDay?.check_in_time) {
      return res.status(409).json({ error: 'Absen masuk hari ini sudah tercatat.' });
    }
    if (eventType === 'CHECK_OUT' && !attendanceDay?.check_in_time) {
      return res.status(409).json({ error: 'Absen pulang memerlukan absen masuk terlebih dahulu.' });
    }
    if (eventType === 'CHECK_OUT' && attendanceDay?.check_out_time) {
      return res.status(409).json({ error: 'Absen pulang hari ini sudah tercatat.' });
    }

    const { count: recentFaceFailures } = await admin
      .from('attendance_audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('actor_employee_id', employeeId)
      .eq('action', 'FACE_MISMATCH')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());
    if ((recentFaceFailures ?? 0) >= 10) {
      return res.status(429).json({ error: 'Terlalu banyak verifikasi wajah gagal. Tunggu lima menit lalu coba kembali.' });
    }

    const image = parseFaceImage(req.body?.image_data_url);
    const candidateDescriptor = validateFaceDescriptor(req.body?.descriptor);
    const faceScore = finiteNumber(req.body?.face_score, 'Skor wajah');
    const antispoofScore = finiteNumber(req.body?.antispoof_score, 'Skor anti-spoof');
    const livenessScore = finiteNumber(req.body?.liveness_score, 'Skor liveness');
    if (
      faceScore < 0.6 || faceScore > 1
      || antispoofScore < 0.5 || antispoofScore > 1
      || livenessScore < 0.5 || livenessScore > 1
    ) {
      return res.status(422).json({ error: 'Verifikasi liveness wajah belum memenuhi batas keamanan.' });
    }

    const latitude = finiteNumber(req.body?.latitude, 'Latitude');
    const longitude = finiteNumber(req.body?.longitude, 'Longitude');
    const accuracy = finiteNumber(req.body?.accuracy_m, 'Akurasi GPS');
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || accuracy <= 0) {
      return res.status(400).json({ error: 'Koordinat GPS tidak valid.' });
    }

    const { data: location } = await admin
      .from('attendance_locations')
      .select('id, organization_id, business_unit_id, latitude, longitude, geofence_radius_m, max_allowed_accuracy_m, is_active')
      .eq('id', assignment.location_id)
      .maybeSingle();
    if (!location?.is_active) return res.status(409).json({ error: 'Lokasi kerja aktif tidak ditemukan.' });
    if (accuracy > Number(location.max_allowed_accuracy_m)) {
      return res.status(422).json({
        error: `Akurasi GPS ${Math.round(accuracy)} m belum cukup. Tunggu hingga maksimal ${Math.round(Number(location.max_allowed_accuracy_m))} m.`,
      });
    }

    const distance = haversineMeters(latitude, longitude, Number(location.latitude), Number(location.longitude));
    const radius = Number(location.geofence_radius_m);
    if (distance > radius) {
      return res.status(422).json({ error: `Anda berada ${distance} m dari lokasi kerja; batas absen ${Math.round(radius)} m.` });
    }

    const referenceDescriptor = decryptFaceDescriptor(biometricProfile);
    const similarity = faceSimilarity(referenceDescriptor, candidateDescriptor);
    const threshold = Number(biometricProfile.match_threshold ?? 0.55);
    if (similarity < threshold) {
      await admin.from('attendance_audit_logs').insert({
        organization_id: employee.organization_id,
        business_unit_id: assignment.business_unit_id,
        actor_user_id: callerData.user.id,
        actor_employee_id: employeeId,
        entity_type: 'ATTENDANCE_VERIFICATION',
        entity_id: employeeId,
        action: 'FACE_MISMATCH',
        after_data: { similarity, threshold, event_type: eventType },
      });
      return res.status(422).json({ error: `Wajah tidak cocok dengan data pendaftaran (${Math.round(similarity * 100)}%).` });
    }

    const now = new Date();
    const storagePath = `captures/${employee.organization_id}/${employeeId}/${workDate}/${now.getTime()}-${image.sha256.slice(0, 16)}.${image.extension}`;
    const { error: uploadError } = await admin.storage
      .from(ATTENDANCE_PRIVATE_BUCKET)
      .upload(storagePath, image.bytes, { contentType: image.contentType, cacheControl: '0', upsert: false });
    if (uploadError) return res.status(502).json({ error: `Bukti wajah gagal disimpan: ${uploadError.message}` });

    const riskFlags = {
      biometric_model: 'human-3.3.6',
      biometric_similarity: similarity,
      biometric_threshold: threshold,
      face_score: faceScore,
      antispoof_score: antispoofScore,
      liveness_score: livenessScore,
      client_assisted_embedding: true,
    };
    const { data: event, error: eventError } = await admin
      .from('attendance_events')
      .insert({
        organization_id: employee.organization_id,
        business_unit_id: assignment.business_unit_id,
        location_id: assignment.location_id,
        work_area_id: assignment.primary_work_area_id,
        employee_id: employeeId,
        assignment_id: assignment.id,
        schedule_id: schedule.id,
        event_type: eventType,
        client_captured_at: String(req.body?.client_captured_at ?? now.toISOString()),
        latitude,
        longitude,
        accuracy_m: accuracy,
        distance_m: distance,
        geofence_status: 'WITHIN_GEOFENCE',
        photo_url: `private://${ATTENDANCE_PRIVATE_BUCKET}/${storagePath}`,
        device_id: deviceId,
        source: 'MOBILE_FACE',
        risk_flags: riskFlags,
        idempotency_key: idempotencyKey,
      })
      .select('*')
      .single();
    if (eventError || !event) {
      await admin.storage.from(ATTENDANCE_PRIVATE_BUCKET).remove([storagePath]);
      return res.status(400).json({ error: eventError?.message ?? 'Event presensi gagal dibuat.' });
    }

    const shift = Array.isArray(schedule.shift_template) ? schedule.shift_template[0] : schedule.shift_template;
    const lateMinutes = eventType === 'CHECK_IN'
      ? Math.max(0, jakartaClockMinutes(new Date(event.occurred_at_server))
        - shiftMinutes(shift?.start_time)
        - Number(shift?.late_tolerance_mins ?? 0))
      : Number(attendanceDay?.late_mins ?? 0);
    const dayStatus = lateMinutes > 0 ? 'LATE' : 'PRESENT';
    let dayError: { message: string } | null = null;
    if (!attendanceDay) {
      const created = await admin.from('attendance_days').insert({
        organization_id: employee.organization_id,
        business_unit_id: assignment.business_unit_id,
        location_id: assignment.location_id,
        employee_id: employeeId,
        schedule_id: schedule.id,
        work_date: workDate,
        check_in_event_id: eventType === 'CHECK_IN' ? event.id : null,
        check_in_time: eventType === 'CHECK_IN' ? event.occurred_at_server : null,
        check_out_event_id: eventType === 'CHECK_OUT' ? event.id : null,
        check_out_time: eventType === 'CHECK_OUT' ? event.occurred_at_server : null,
        late_mins: lateMinutes,
        status: dayStatus,
      });
      dayError = created.error;
    } else {
      const payload: Record<string, unknown> = { status: dayStatus, late_mins: lateMinutes };
      if (eventType === 'CHECK_IN') {
        payload.check_in_event_id = event.id;
        payload.check_in_time = event.occurred_at_server;
      } else {
        payload.check_out_event_id = event.id;
        payload.check_out_time = event.occurred_at_server;
        payload.work_duration_mins = Math.max(0, Math.round(
          (new Date(event.occurred_at_server).getTime() - new Date(attendanceDay.check_in_time).getTime()) / 60000,
        ));
      }
      const updated = await admin.from('attendance_days').update(payload).eq('id', attendanceDay.id);
      dayError = updated.error;
    }

    if (dayError) {
      await admin.from('attendance_events').delete().eq('id', event.id);
      await admin.storage.from(ATTENDANCE_PRIVATE_BUCKET).remove([storagePath]);
      return res.status(500).json({ error: `Ringkasan presensi gagal diperbarui: ${dayError.message}` });
    }

    const retentionUntil = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
    await Promise.all([
      admin.from('attendance_media').insert({
        organization_id: employee.organization_id,
        employee_id: employeeId,
        attendance_event_id: event.id,
        media_kind: 'ATTENDANCE_CAPTURE',
        storage_path: storagePath,
        content_type: image.contentType,
        byte_size: image.bytes.length,
        content_sha256: image.sha256,
        capture_metadata: { ...riskFlags, distance_m: distance, accuracy_m: accuracy },
        retention_until: retentionUntil,
      }),
      admin.from('attendance_biometric_profiles').update({
        last_verified_at: event.occurred_at_server,
        verification_count: Number(biometricProfile.verification_count ?? 0) + 1,
        updated_at: now.toISOString(),
      }).eq('id', biometricProfile.id),
      admin.from('attendance_audit_logs').insert({
        organization_id: employee.organization_id,
        business_unit_id: assignment.business_unit_id,
        actor_user_id: callerData.user.id,
        actor_employee_id: employeeId,
        entity_type: 'ATTENDANCE_EVENT',
        entity_id: event.id,
        action: eventType,
        after_data: {
          employee_no: employee.employee_no,
          similarity,
          distance_m: distance,
          status: dayStatus,
        },
      }),
    ]);

    return res.status(201).json({
      event: {
        id: event.id,
        event_type: event.event_type,
        occurred_at_server: event.occurred_at_server,
        geofence_status: event.geofence_status,
        distance_m: event.distance_m,
        similarity,
        status: dayStatus,
      },
    });
  } catch (reason) {
    return res.status(400).json({ error: reason instanceof Error ? reason.message : 'Presensi gagal diproses.' });
  }
}
