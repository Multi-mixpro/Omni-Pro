import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@/app/router/simpleRouter';
import { supabase } from '@/integrations/supabase/client';
import { attendanceKeys, useTodaySchedule, useTodayAttendanceDay, useRecordAttendanceEvent } from '../hooks/useAttendance';
import { evaluateGeofence } from '../domain/geofenceCalculator';
import { attendanceDateInJakarta } from '../domain/attendanceDate';
import { LoadingState } from '../components/AttendanceStateComponents';
import { FaceCaptureModal, type FaceCaptureResult } from '../components/FaceCaptureModal';
import '../attendance.css';

const DEVICE_STORAGE_KEY = 'central-attendance-device-id-v1';

function attendanceDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_STORAGE_KEY);
  if (existing) return existing;
  const created = `att-${window.crypto.randomUUID()}`;
  window.localStorage.setItem(DEVICE_STORAGE_KEY, created);
  return created;
}

export function TodayPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [empName, setEmpName] = useState<string>('Pegawai');
  const [faceEnrolled, setFaceEnrolled] = useState(false);

  // Face verification state
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [pendingEventType, setPendingEventType] = useState<'CHECK_IN' | 'CHECK_OUT' | null>(null);
  const [attendanceNotice, setAttendanceNotice] = useState<string | null>(null);
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLon, setCurrentLon] = useState<number | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [scopeError, setScopeError] = useState<string | null>(null);

  const todayStr = attendanceDateInJakarta();

  useEffect(() => {
    async function initUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: emp } = await supabase
          .from('attendance_employees')
          .select('id, full_name, face_enrolled')
          .eq('user_id', data.user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (emp) {
          setEmployeeId(emp.id);
          setEmpName(emp.full_name);
          setFaceEnrolled(emp.face_enrolled === true);
        } else {
          setScopeError('Akun ini tidak terhubung ke profil karyawan aktif. Masuk menggunakan PIN kru yang sesuai.');
        }
      }
    }
    initUser();
  }, []);

  const { data: schedRes, isLoading: schedLoading } = useTodaySchedule(employeeId, todayStr);
  const { data: dayRes, isLoading: dayLoading } = useTodayAttendanceDay(employeeId, todayStr);
  const recordEventMut = useRecordAttendanceEvent();

  const sched = schedRes?.data;
  const day = dayRes?.data;

  useEffect(() => {
    if (!employeeId) return undefined;

    let refreshTimer: number | undefined;
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: attendanceKeys.todayDay(employeeId, todayStr) });
        void queryClient.invalidateQueries({ queryKey: attendanceKeys.todaySchedule(employeeId, todayStr) });
        void queryClient.invalidateQueries({ queryKey: attendanceKeys.history(employeeId) });
      }, 150);
    };

    const channel = supabase
      .channel(`attendance-employee-realtime-${employeeId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_days', filter: `employee_id=eq.${employeeId}` }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_events', filter: `employee_id=eq.${employeeId}` }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_schedules', filter: `employee_id=eq.${employeeId}` }, scheduleRefresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attendance_employees', filter: `id=eq.${employeeId}` }, payload => {
        const updated = payload.new as { face_enrolled?: boolean };
        setFaceEnrolled(updated.face_enrolled === true);
        scheduleRefresh();
      })
      .subscribe();

    return () => {
      window.clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [employeeId, queryClient, todayStr]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        pos => {
          setCurrentLat(pos.coords.latitude);
          setCurrentLon(pos.coords.longitude);
          setAccuracyM(pos.coords.accuracy);
          setGeoError('');
        },
        err => setGeoError(err.message),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
    setGeoError('Browser ini tidak mendukung lokasi GPS.');
    return undefined;
  }, []);

  if (schedLoading || dayLoading) {
    return <LoadingState message="Memuat jadwal & status presensi..." />;
  }

  // Geofence Evaluation
  const targetLat = sched?.location?.latitude ?? -6.9175;
  const targetLon = sched?.location?.longitude ?? 107.6191;
  const targetRadius = sched?.location?.geofence_radius_m ?? 150;

  const geoEval = currentLat !== null && currentLon !== null && accuracyM !== null
    ? evaluateGeofence(currentLat, currentLon, accuracyM, Number(targetLat), Number(targetLon), Number(targetRadius))
    : null;

  const hasCheckedIn = !!day?.check_in_time || day?.status === 'PRESENT';
  const hasCheckedOut = !!day?.check_out_time;

  function triggerPunchWithFaceScan(eventType: 'CHECK_IN' | 'CHECK_OUT') {
    if (!employeeId) {
      setScopeError('Profil karyawan belum tersedia. Masuk kembali memakai PIN kru.');
      return;
    }
    if (!faceEnrolled) {
      setScopeError('Wajah Anda belum didaftarkan. Hubungi admin untuk melakukan pendaftaran wajah terlebih dahulu.');
      return;
    }
    if (!geoEval || currentLat === null || currentLon === null || accuracyM === null) {
      setScopeError(geoError || 'Lokasi GPS belum siap. Izinkan lokasi lalu tunggu akurasi terkunci.');
      return;
    }
    if (geoEval.geofence_status !== 'WITHIN_GEOFENCE') {
      setScopeError(`Anda berada ${geoEval.distance_m} m dari lokasi kerja dan belum dapat melakukan absen.`);
      return;
    }
    setScopeError(null);
    setAttendanceNotice(null);
    setPendingEventType(eventType);
    setFaceModalOpen(true);
  }

  async function executePunch(eventType: 'CHECK_IN' | 'CHECK_OUT', capture: FaceCaptureResult) {
    if (!employeeId || currentLat === null || currentLon === null || accuracyM === null) return;
    setSubmitting(true);
    setScopeError(null);

    const result = await recordEventMut.mutateAsync({
      employee_id: employeeId,
      event_type: eventType,
      client_captured_at: new Date().toISOString(),
      latitude: currentLat,
      longitude: currentLon,
      accuracy_m: accuracyM,
      device_id: attendanceDeviceId(),
      idempotency_key: `${employeeId}:${eventType}:${window.crypto.randomUUID()}`,
      ...capture,
    });

    setSubmitting(false);
    setFaceModalOpen(false);
    setPendingEventType(null);

    if (result.data) {
      const time = new Date(result.data.occurred_at_server).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setAttendanceNotice(`Presensi ${eventType === 'CHECK_IN' ? 'masuk' : 'pulang'} ${empName} tercatat pada ${time} WIB.`);
    } else if (result.error) {
      setScopeError(result.error.message);
      throw new Error(result.error.message);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F6F7F9',
      color: '#18212F',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      padding: '16px',
    }}>
      <div style={{ maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* iOS Clean Employee Card */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #E4E7EC',
          borderRadius: 22,
          padding: '20px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#667085', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Hari Ini • {todayStr}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#18212F', marginTop: 2, letterSpacing: '-0.3px' }}>
              {empName}
            </div>
            <div style={{ fontSize: 12, color: '#E96A12', fontWeight: 700, marginTop: 2 }}>
              {sched?.business_unit?.name ?? 'Bakso Ujo'} — {sched?.location?.name ?? 'Outlet Utama'}
            </div>
          </div>
          <button
            onClick={() => navigate('/attendance/admin/dashboard')}
            style={{
              padding: '8px 14px',
              borderRadius: 9999,
              backgroundColor: '#EEF1F4',
              border: '1px solid #E4E7EC',
              color: '#3178C6',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Admin →
          </button>
        </div>

        {/* Shift Info Card */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #E4E7EC',
          borderRadius: 22,
          padding: '20px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{ fontSize: 12, color: '#667085', fontWeight: 700 }}>Jadwal Shift Hari Ini</div>
          {sched?.shift_template ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#18212F' }}>{sched.shift_template.name}</div>
                <div style={{ fontSize: 13, color: '#3178C6', fontWeight: 700, marginTop: 2 }}>
                  {sched.shift_template.start_time.slice(0, 5)} - {sched.shift_template.end_time.slice(0, 5)} WIB
                </div>
              </div>
              <span style={{ fontSize: 11, backgroundColor: '#EEF1F4', color: '#667085', padding: '4px 12px', borderRadius: 9999, fontWeight: 700 }}>
                Toleransi {sched.shift_template.late_tolerance_mins} mnt
              </span>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#667085', fontStyle: 'italic', fontWeight: 500 }}>Jadwal otomatis aktif untuk kru</div>
          )}
        </div>

        {/* GPS Geofence Status Card */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #E4E7EC',
          borderRadius: 22,
          padding: '16px 20px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#667085', fontWeight: 700 }}>Status GPS & Verifikasi Wajah</span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: geoEval?.geofence_status === 'WITHIN_GEOFENCE' ? '#16865B' : '#D53F3F',
              backgroundColor: '#EEF1F4',
              padding: '3px 10px',
              borderRadius: 9999,
            }}>
              {!geoEval ? '⌛ Mengunci GPS' : geoEval.geofence_status === 'WITHIN_GEOFENCE' ? '📍 Dalam Radius' : '⚠️ Di Luar Area'}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>
            {geoEval ? (
              <>Jarak: <strong style={{ color: '#18212F' }}>{geoEval.distance_m} m</strong> dari outlet (maks. {targetRadius} m) · akurasi {Math.round(accuracyM ?? 0)} m</>
            ) : (
              <>{geoError || 'Menunggu izin dan koordinat GPS asli. Koordinat outlet tidak dipakai sebagai fallback.'}</>
            )}
          </div>
          <div style={{ fontSize: 10, color: faceEnrolled ? '#16865B' : '#D8890B', fontWeight: 700 }}>
            {faceEnrolled ? '✓ Wajah telah terdaftar' : '⚠ Wajah belum didaftarkan admin'}
          </div>
        </div>

        {/* Main Punch Action Card */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #E4E7EC',
          borderRadius: 24,
          padding: '28px 24px',
          boxShadow: '0 10px 35px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 14, color: '#667085', fontWeight: 600 }}>
            Status Presensi:{' '}
            <strong style={{ color: hasCheckedOut ? '#7c3aed' : hasCheckedIn ? '#16865B' : '#D53F3F', fontWeight: 800 }}>
              {hasCheckedOut ? 'Sudah Pulang' : hasCheckedIn ? 'Sudah Masuk (Hadir)' : 'Belum Absen'}
            </strong>
          </div>

          {attendanceNotice && (
            <div role="status" style={{ width: '100%', padding: '10px 14px', borderRadius: 12, background: '#ECF8F3', border: '1px solid #A7D8C5', color: '#126B4B', fontSize: 12, fontWeight: 700 }}>
              {attendanceNotice}
            </div>
          )}
          {scopeError && (
            <div role="alert" style={{ width: '100%', padding: '10px 14px', borderRadius: 12, background: 'rgba(213, 63, 63, .10)', border: '1px solid rgba(213, 63, 63, .28)', color: '#D53F3F', fontSize: 12, fontWeight: 600 }}>
              {scopeError}
            </div>
          )}

          {!hasCheckedIn && (
            <button
              onClick={() => triggerPunchWithFaceScan('CHECK_IN')}
              disabled={submitting || !employeeId || !faceEnrolled || !geoEval}
              style={{
                width: '100%',
                padding: '18px',
                backgroundColor: (submitting || !employeeId || !faceEnrolled || !geoEval) ? '#98A2B3' : '#16865B',
                color: '#ffffff',
                border: 'none',
                borderRadius: 18,
                fontSize: 16,
                fontWeight: 800,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 25px rgba(16, 185, 129, 0.35)',
                letterSpacing: '0.5px',
              }}
            >
              {submitting ? 'Memproses...' : '📷 SCAN FACE & ABSEN MASUK'}
            </button>
          )}

          {hasCheckedIn && !hasCheckedOut && (
            <button
              onClick={() => triggerPunchWithFaceScan('CHECK_OUT')}
              disabled={submitting || !faceEnrolled || !geoEval}
              style={{
                width: '100%',
                padding: '18px',
                backgroundColor: submitting ? '#667085' : '#D53F3F',
                color: '#ffffff',
                border: 'none',
                borderRadius: 18,
                fontSize: 16,
                fontWeight: 800,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 25px rgba(239, 68, 68, 0.35)',
                letterSpacing: '0.5px',
              }}
            >
              {submitting ? 'Memproses...' : '📷 SCAN FACE & ABSEN PULANG'}
            </button>
          )}

          {hasCheckedOut && (
            <div style={{ padding: '14px 20px', backgroundColor: '#f3e8ff', borderRadius: 14, fontSize: 13, color: '#7c3aed', fontWeight: 700 }}>
              ✅ Presensi hari ini telah selesai!
            </div>
          )}
        </div>

        {/* Clean iOS Bottom Nav Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          backgroundColor: '#ffffff',
          border: '1px solid #E4E7EC',
          borderRadius: 9999,
          padding: '10px 6px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
        }}>
          <button onClick={() => navigate('/attendance/today')} style={{ background: 'none', border: 'none', color: '#3178C6', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>📅 Hari Ini</button>
          <button onClick={() => navigate('/attendance/schedule')} style={{ background: 'none', border: 'none', color: '#667085', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>⏰ Jadwal</button>
          <button onClick={() => navigate('/attendance/history')} style={{ background: 'none', border: 'none', color: '#667085', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>📜 Histori</button>
          <button onClick={() => navigate('/attendance/leave')} style={{ background: 'none', border: 'none', color: '#667085', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>📝 Izin</button>
          <button onClick={() => navigate('/attendance/profile')} style={{ background: 'none', border: 'none', color: '#667085', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>👤 Profil</button>
        </div>

      </div>

      <FaceCaptureModal
        open={faceModalOpen && pendingEventType !== null}
        title={pendingEventType === 'CHECK_OUT' ? 'Verifikasi Absen Pulang' : 'Verifikasi Absen Masuk'}
        instruction="Hadapkan wajah ke kamera, pastikan pencahayaan cukup, dan jangan gunakan foto atau layar lain."
        confirmLabel="Verifikasi & Catat Presensi"
        onCancel={() => {
          if (submitting) return;
          setFaceModalOpen(false);
          setPendingEventType(null);
        }}
        onCaptured={async capture => {
          if (!pendingEventType) return;
          await executePunch(pendingEventType, capture);
        }}
      />

    </div>
  );
}
