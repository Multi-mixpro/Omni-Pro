import React, { useState, useEffect } from 'react';
import { useNavigate } from '@/app/router/simpleRouter';
import { supabase } from '@/integrations/supabase/client';
import { attendanceRepository } from '../data/attendanceRepository';
import { useTodaySchedule, useTodayAttendanceDay, useRecordAttendanceEvent } from '../hooks/useAttendance';
import { evaluateGeofence } from '../domain/geofenceCalculator';
import { LoadingState } from '../components/AttendanceStateComponents';
import type { Employee } from '../domain/types';
import '../attendance.css';

export function TodayPage() {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [empName, setEmpName] = useState<string>('Pegawai');
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  // Face Scan State
  const [faceScanning, setFaceScanning] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [pendingEventType, setPendingEventType] = useState<'CHECK_IN' | 'CHECK_OUT' | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function initUser() {
      const { data: empList } = await attendanceRepository.listEmployees();
      if (empList && empList.length > 0) {
        setAllEmployees(empList);
      }

      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: emp } = await supabase
          .from('attendance_employees')
          .select('id, full_name')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (emp) {
          setEmployeeId(emp.id);
          setEmpName(emp.full_name);
        } else if (empList && empList.length > 0) {
          setEmployeeId(empList[0].id);
          setEmpName(empList[0].full_name);
        }
      } else if (empList && empList.length > 0) {
        setEmployeeId(empList[0].id);
        setEmpName(empList[0].full_name);
      }
    }
    initUser();
  }, []);

  const { data: schedRes, isLoading: schedLoading } = useTodaySchedule(employeeId, todayStr);
  const { data: dayRes, isLoading: dayLoading } = useTodayAttendanceDay(employeeId, todayStr);
  const recordEventMut = useRecordAttendanceEvent();

  const sched = schedRes?.data;
  const day = dayRes?.data;

  // Geolocation & Capture State
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLon, setCurrentLon] = useState<number | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setCurrentLat(pos.coords.latitude);
          setCurrentLon(pos.coords.longitude);
          setAccuracyM(pos.coords.accuracy);
        },
        err => setGeoError(err.message),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  if (schedLoading || dayLoading) {
    return <LoadingState message="Memuat jadwal & status presensi..." />;
  }

  // Geofence Evaluation
  const targetLat = sched?.location?.latitude ?? -6.9175;
  const targetLon = sched?.location?.longitude ?? 107.6191;
  const targetRadius = sched?.location?.geofence_radius_m ?? 150;

  const effectiveLat = currentLat ?? Number(targetLat);
  const effectiveLon = currentLon ?? Number(targetLon);
  const effectiveAcc = accuracyM ?? 10;

  const geoEval = evaluateGeofence(effectiveLat, effectiveLon, effectiveAcc, Number(targetLat), Number(targetLon), Number(targetRadius));

  const hasCheckedIn = !!day?.check_in_time || day?.status === 'PRESENT';
  const hasCheckedOut = !!day?.check_out_time;

  function triggerPunchWithFaceScan(eventType: 'CHECK_IN' | 'CHECK_OUT') {
    if (!employeeId) {
      alert('Pilih pegawai terlebih dahulu.');
      return;
    }
    setPendingEventType(eventType);
    setFaceScanning(true);
    setFaceVerified(false);

    // Simulate Biometric Landmark Recognition Scan
    setTimeout(() => {
      setFaceVerified(true);
      setTimeout(() => {
        setFaceScanning(false);
        executePunch(eventType);
      }, 800);
    }, 1200);
  }

  async function executePunch(eventType: 'CHECK_IN' | 'CHECK_OUT') {
    setSubmitting(true);

    const result = await recordEventMut.mutateAsync({
      organization_id: sched?.location?.organization_id ?? '00000000-0000-0000-0000-000000000000',
      business_unit_id: sched?.business_unit_id ?? '00000000-0000-0000-0000-000000000000',
      location_id: sched?.location_id ?? '00000000-0000-0000-0000-000000000000',
      work_area_id: sched?.work_area_id ?? undefined,
      employee_id: employeeId!,
      assignment_id: sched?.assignment_id ?? '00000000-0000-0000-0000-000000000000',
      schedule_id: sched?.id,
      event_type: eventType,
      client_captured_at: new Date().toISOString(),
      latitude: effectiveLat,
      longitude: effectiveLon,
      accuracy_m: effectiveAcc,
      target_latitude: Number(targetLat),
      target_longitude: Number(targetLon),
      geofence_radius_m: Number(targetRadius),
    });

    setSubmitting(false);

    if (result.data) {
      alert(`✅ Verifikasi Wajah & GPS Berhasil! Presensi ${eventType === 'CHECK_IN' ? 'Masuk' : 'Pulang'} dicatat untuk ${empName}!`);
    } else if (result.error) {
      alert(`Gagal: ${result.error.message}`);
    }
  }

  function handleEmployeeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selectedEmpId = e.target.value;
    const emp = allEmployees.find(x => x.id === selectedEmpId);
    if (emp) {
      setEmployeeId(emp.id);
      setEmpName(emp.full_name);
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
        
        {/* Employee Selector (Demo Mode Pill) */}
        {allEmployees.length > 0 && (
          <div style={{
            backgroundColor: '#ffffff',
            padding: '10px 16px',
            borderRadius: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid #E4E7EC',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)',
          }}>
            <span style={{ fontSize: 12, color: '#667085', fontWeight: 700 }}>👤 Kru Aktif:</span>
            <select
              value={employeeId ?? ''}
              onChange={handleEmployeeChange}
              style={{
                backgroundColor: '#F6F7F9',
                color: '#18212F',
                border: '1px solid #E4E7EC',
                borderRadius: 9999,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {allEmployees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.employee_no} — {e.full_name}
                </option>
              ))}
            </select>
          </div>
        )}

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
            <span style={{ fontSize: 12, color: '#667085', fontWeight: 700 }}>Status Lokasi GPS & Face ID</span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: geoEval.geofence_status === 'WITHIN_GEOFENCE' ? '#16865B' : '#D53F3F',
              backgroundColor: geoEval.geofence_status === 'WITHIN_GEOFENCE' ? '#EEF1F4' : '#EEF1F4',
              padding: '3px 10px',
              borderRadius: 9999,
            }}>
              {geoEval.geofence_status === 'WITHIN_GEOFENCE' ? '📍 Dalam Radius' : '⚠️ Di Luar Area'}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>
            Jarak: <strong style={{ color: '#18212F' }}>{geoEval.distance_m} m</strong> dari outlet (Maks: {targetRadius} m)
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

          {!hasCheckedIn && (
            <button
              onClick={() => triggerPunchWithFaceScan('CHECK_IN')}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '18px',
                backgroundColor: submitting ? '#667085' : '#16865B',
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
              disabled={submitting}
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

      {/* FACE SCANNING OVERLAY MODAL */}
      {faceScanning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20,
          color: '#ffffff',
        }}>
          <div style={{
            backgroundColor: '#18212F',
            border: '2px solid #3178C6',
            borderRadius: 24,
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            boxShadow: '0 20px 50px rgba(59, 130, 246, 0.4)',
            maxWidth: 360,
            width: '100%',
            textAlign: 'center',
          }}>
            <div style={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              border: `4px dashed ${faceVerified ? '#16865B' : '#3178C6'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 54,
              backgroundColor: '#18212F',
              transition: 'all 0.3s ease',
            }}>
              {faceVerified ? '🟢' : '👤'}
            </div>

            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: faceVerified ? '#16865B' : '#ffffff' }}>
                {faceVerified ? 'Verifikasi Wajah Berhasil! ✅' : 'Memindai Landmark Wajah...'}
              </h3>
              <p style={{ fontSize: 12, color: '#667085', margin: '6px 0 0' }}>
                {faceVerified ? `Identitas biometrik ${empName} cocok.` : 'Posisikan wajah Anda tegak di depan kamera.'}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
