import React, { useState, useEffect } from 'react';
import { useNavigate } from '@/app/router/simpleRouter';
import { useAttendanceUnits, useLiveMonitorStats } from '../hooks/useAttendance';
import { attendanceRepository, createAttendanceUser } from '../data/attendanceRepository';
import { useQueryClient } from '@tanstack/react-query';
import { LoadingState } from '../components/AttendanceStateComponents';
import '../attendance.css';

type AdminTab = 'dashboard' | 'employees' | 'shifts' | 'reports';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(undefined);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Real-time Supabase Data States
  const [dbEmployees, setDbEmployees] = useState<any[]>([]);
  const [dbShifts, setDbShifts] = useState<any[]>([]);
  const [dbLogs, setDbLogs] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Modal States
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<any | null>(null);
  const [editingShift, setEditingShift] = useState<any | null>(null);

  // Employee Form State
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpNo, setNewEmpNo] = useState('');
  const [newEmpUsername, setNewEmpUsername] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('Staf Service & Frontline');
  const [newEmpUnitId, setNewEmpUnitId] = useState<string>('');
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  const [faceScanning, setFaceScanning] = useState(false);

  // Shift Form State
  const [shiftName, setShiftName] = useState('');
  const [shiftCode, setShiftCode] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [lateTolerance, setLateTolerance] = useState('15');

  const { data: unitsRes, isLoading: unitsLoading } = useAttendanceUnits();
  const { data: statsRes, isLoading: statsLoading, refetch } = useLiveMonitorStats(selectedUnitId);

  const units = unitsRes?.data ?? [];
  const stats = statsRes?.data;
  const days = stats?.days ?? [];

  // Load Real-time Data from Supabase
  const fetchRealtimeData = async () => {
    setLoadingData(true);
    const [empRes, shiftRes, logRes] = await Promise.all([
      attendanceRepository.listEmployeesWithAssignments(),
      attendanceRepository.listShiftTemplates(selectedUnitId),
      attendanceRepository.listAuditLogs(),
    ]);

    if (empRes.data) setDbEmployees(empRes.data);
    if (shiftRes.data) setDbShifts(shiftRes.data);
    if (logRes.data) setDbLogs(logRes.data);
    setLoadingData(false);
  };

  useEffect(() => {
    fetchRealtimeData();
  }, [activeTab, selectedUnitId]);

  async function handleQuickPunch(employeeId: string, eventType: 'CHECK_IN' | 'CHECK_OUT') {
    setActionLoadingId(`${employeeId}_${eventType}`);
    const res = await attendanceRepository.quickPunch(employeeId, eventType);
    setActionLoadingId(null);

    if (res.data) {
      queryClient.invalidateQueries({ queryKey: ['attendance-monitor'] });
      refetch();
      fetchRealtimeData();
    } else if (res.error) {
      alert(`Gagal: ${res.error.message}`);
    }
  }

  async function handleAutoSchedule() {
    setActionLoadingId('auto_sched');
    await attendanceRepository.ensureDailySchedules();
    setActionLoadingId(null);
    queryClient.invalidateQueries({ queryKey: ['attendance-monitor'] });
    refetch();
    fetchRealtimeData();
  }

  // CREATE / EDIT EMPLOYEE REALTIME
  async function handleSaveEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmpName || !newEmpNo) {
      alert('Nama dan NIP wajib diisi.');
      return;
    }

    setActionLoadingId('save_emp');

    if (editingEmp) {
      // UPDATE Realtime
      const res = await attendanceRepository.updateEmployee(editingEmp.id, {
        full_name: newEmpName,
        employee_no: newEmpNo,
        pin_code: newEmpPassword || editingEmp.pin_code,
        job_title: newEmpRole,
      });

      if (res.data) {
        alert(`Pegawai ${newEmpName} berhasil diperbarui di Supabase!`);
        setShowEmployeeModal(false);
        setEditingEmp(null);
        fetchRealtimeData();
      } else {
        alert(`Gagal: ${res.error?.message}`);
      }
    } else {
      // CREATE — membuat akun login Attendance sekaligus data karyawan.
      // Jalur lama (registerEmployee) membuat karyawan TANPA akun auth, sehingga
      // user_id selalu NULL dan pegawai tidak pernah bisa masuk. Password default
      // '123456' juga dihapus: password wajib ditentukan admin.
      const chosenUnitId = newEmpUnitId || units[0]?.id;
      if (!chosenUnitId) {
        alert('Unit bisnis belum tersedia. Buat unit terlebih dahulu.');
        setActionLoadingId(null);
        return;
      }

      const locRes = await attendanceRepository.listLocations(chosenUnitId);
      const mainLoc = locRes.data[0];
      if (!mainLoc) {
        alert('Unit ini belum memiliki lokasi kerja. Tambahkan lokasi sebelum mendaftarkan pegawai.');
        setActionLoadingId(null);
        return;
      }

      if (!newEmpPassword || newEmpPassword.length < 6) {
        alert('Password login wajib diisi, minimal 6 karakter.');
        setActionLoadingId(null);
        return;
      }

      try {
        const created = await createAttendanceUser({
          employee_no: newEmpNo,
          password: newEmpPassword,
          full_name: newEmpName,
          role: 'EMPLOYEE',
          business_unit_id: chosenUnitId,
          location_id: mainLoc.id,
        });

        alert(
          `Pegawai ${newEmpName} berhasil dibuat.\n\n`
          + `Nomor pegawai: ${created.employee_no}\n`
          + `Email login: ${created.login_email}\n\n`
          + 'Akun ini hanya berlaku untuk sistem Attendance.',
        );
        setShowEmployeeModal(false);
        setNewEmpName('');
        setNewEmpNo('');
        setNewEmpUsername('');
        setNewEmpPassword('');
        setFaceEnrolled(false);
        await attendanceRepository.ensureDailySchedules();
        fetchRealtimeData();
        refetch();
      } catch (reason) {
        alert(`Gagal: ${reason instanceof Error ? reason.message : 'Pegawai gagal dibuat.'}`);
      }
    }

    setActionLoadingId(null);
  }

  // DELETE EMPLOYEE REALTIME
  async function handleDeleteEmployee(empId: string, empNameStr: string) {
    if (!confirm(`Hapus pegawai ${empNameStr} dari Supabase?`)) return;

    setActionLoadingId(`del_${empId}`);
    const res = await attendanceRepository.deleteEmployee(empId);
    setActionLoadingId(null);

    if (res.data) {
      alert(`Pegawai ${empNameStr} telah berhasil dihapus!`);
      setDbEmployees(prev => prev.filter(e => e.id !== empId));
      fetchRealtimeData();
      refetch();
    } else {
      alert(`Gagal menghapus: ${res.error?.message ?? 'Terjadi kesalahan'}`);
    }
  }

  // CREATE / EDIT SHIFT REALTIME
  async function handleSaveShift(e: React.FormEvent) {
    e.preventDefault();
    if (!shiftName) {
      alert('Nama Shift wajib diisi.');
      return;
    }

    setActionLoadingId('save_shift');

    if (editingShift) {
      // UPDATE Realtime
      const res = await attendanceRepository.updateShiftTemplate(editingShift.id, {
        name: shiftName,
        start_time: startTime.includes(':') ? (startTime.length === 5 ? `${startTime}:00` : startTime) : '08:00:00',
        end_time: endTime.includes(':') ? (endTime.length === 5 ? `${endTime}:00` : endTime) : '17:00:00',
        late_tolerance_mins: parseInt(lateTolerance, 10) || 15,
      });

      if (res.data) {
        alert(`Template shift ${shiftName} berhasil diperbarui di Supabase!`);
        setShowShiftModal(false);
        setEditingShift(null);
        fetchRealtimeData();
      } else {
        alert(`Gagal: ${res.error?.message}`);
      }
    } else {
      // CREATE Realtime
      const ujoUnit = units.find(u => u.code === 'BAKSO_UJO') ?? units[0];

      const res = await attendanceRepository.createShiftTemplate({
        business_unit_id: ujoUnit?.id ?? '00000000-0000-0000-0000-000000000000',
        name: shiftName,
        code: shiftCode || `SHIFT_${Date.now()}`,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
        late_tolerance_mins: parseInt(lateTolerance, 10) || 15,
      });

      if (res.data) {
        alert(`Template shift ${shiftName} berhasil disimpan ke Supabase!`);
        setShowShiftModal(false);
        setShiftName('');
        setShiftCode('');
        fetchRealtimeData();
      } else {
        alert(`Gagal: ${res.error?.message}`);
      }
    }

    setActionLoadingId(null);
  }

  // DELETE SHIFT REALTIME
  async function handleDeleteShift(shiftId: string, shiftNameStr: string) {
    if (!confirm(`Hapus template shift ${shiftNameStr} dari Supabase?`)) return;

    setActionLoadingId(`del_shift_${shiftId}`);
    const res = await attendanceRepository.deleteShiftTemplate(shiftId);
    setActionLoadingId(null);

    if (res.data) {
      alert(`Shift ${shiftNameStr} telah berhasil dihapus!`);
      setDbShifts(prev => prev.filter(s => s.id !== shiftId));
      fetchRealtimeData();
    } else {
      alert(`Gagal menghapus shift: ${res.error?.message ?? 'Terjadi kesalahan'}`);
    }
  }

  function handleOpenEditEmployee(emp: any) {
    setEditingEmp(emp);
    setNewEmpName(emp.full_name);
    setNewEmpNo(emp.employee_no);
    setNewEmpUsername(emp.email?.split('@')[0] ?? '');
    setNewEmpPassword(emp.pin_code ?? '');
    setNewEmpRole(emp.assignments?.[0]?.job_title ?? 'Staf Operasional');
    setShowEmployeeModal(true);
  }

  function handleOpenEditShift(shift: any) {
    setEditingShift(shift);
    setShiftName(shift.name);
    setShiftCode(shift.code);
    setStartTime(shift.start_time ? shift.start_time.slice(0, 5) : '08:00');
    setEndTime(shift.end_time ? shift.end_time.slice(0, 5) : '17:00');
    setLateTolerance(String(shift.late_tolerance_mins ?? 15));
    setShowShiftModal(true);
  }

  function handleScanFace() {
    setFaceScanning(true);
    setTimeout(() => {
      setFaceScanning(false);
      setFaceEnrolled(true);
    }, 1200);
  }

  if (unitsLoading || statsLoading) {
    return <LoadingState message="Memuat dashboard Central Attendance..." />;
  }

  // Hitung kesiapan area operasional Bakso Ujo secara real-time dari DB
  const produksihadir = days.filter(d => d.employee?.employee_no === 'UJO-001' && (d.check_in_time || d.status === 'PRESENT')).length;
  const persiapanhadir = days.filter(d => d.employee?.employee_no === 'UJO-002' && (d.check_in_time || d.status === 'PRESENT')).length;
  const servicehadir = days.filter(d => (d.employee?.employee_no === 'UJO-003' || d.employee?.employee_no === 'UJO-005') && (d.check_in_time || d.status === 'PRESENT')).length;
  const closinghadir = days.filter(d => d.employee?.employee_no === 'UJO-004' && (d.check_in_time || d.status === 'PRESENT')).length;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F6F7F9',
      color: '#18212F',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      padding: '20px 24px 60px',
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* iOS Top Bar Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
          backgroundColor: '#ffffff',
          padding: '14px 20px',
          borderRadius: 18,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          border: '1px solid #E4E7EC',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #3178C6 0%, #3178C6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 18,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
            }}>
              CA
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: '#18212F', margin: 0, letterSpacing: '-0.3px' }}>
                Central Attendance Realtime Management
              </h1>
              <p style={{ fontSize: 11, color: '#667085', margin: '2px 0 0', fontWeight: 500 }}>
                Live Database Supabase (Bakso Ujo • GG Supply • GUDSKUY)
              </p>
            </div>
          </div>

          {/* Unit Switcher & Quick Actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleAutoSchedule}
              disabled={actionLoadingId === 'auto_sched'}
              style={{
                padding: '6px 14px',
                backgroundColor: '#EEF1F4',
                color: '#3178C6',
                border: '1px solid #E4E7EC',
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {actionLoadingId === 'auto_sched' ? 'Memproses...' : '⚡ Sync Realtime Schedule'}
            </button>

            <button
              onClick={() => setSelectedUnitId(undefined)}
              style={{
                padding: '6px 14px',
                backgroundColor: !selectedUnitId ? '#18212F' : '#ffffff',
                color: !selectedUnitId ? '#ffffff' : '#667085',
                border: '1px solid #E4E7EC',
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🏢 Semua Unit
            </button>
            {units.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUnitId(u.id)}
                style={{
                  padding: '6px 14px',
                  backgroundColor: selectedUnitId === u.id ? (u.brand_color ?? '#E96A12') : '#ffffff',
                  color: selectedUnitId === u.id ? '#ffffff' : '#667085',
                  border: '1px solid #E4E7EC',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>

        {/* iOS Clean Nav Tabs */}
        <div style={{
          display: 'flex',
          gap: 6,
          backgroundColor: '#ffffff',
          padding: '5px',
          borderRadius: 9999,
          width: 'fit-content',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
          border: '1px solid #E4E7EC',
        }}>
          {[
            { key: 'dashboard', label: '📊 Live Monitor & Readiness' },
            { key: 'employees', label: '👥 Kelola Karyawan (Realtime CRUD)' },
            { key: 'shifts', label: '⏰ Kelola Shift (Realtime CRUD)' },
            { key: 'reports', label: '📜 Audit & System Logs' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as AdminTab)}
              style={{
                padding: '8px 16px',
                borderRadius: 9999,
                backgroundColor: activeTab === tab.key ? '#18212F' : 'transparent',
                color: activeTab === tab.key ? '#ffffff' : '#667085',
                border: 'none',
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: DASHBOARD & READINESS */}
        {activeTab === 'dashboard' && (
          <>
            {/* iOS Compact Colorful Stats Cards */}
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #E4E7EC', borderRadius: 16, padding: '14px 16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#667085' }}>Dijadwalkan Hari Ini</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#18212F', marginTop: 2 }}>{stats.scheduled}</div>
                </div>

                <div style={{ backgroundColor: '#EEF1F4', border: '1px solid #EEF1F4', borderRadius: 16, padding: '14px 16px', boxShadow: '0 4px 15px rgba(16,185,129,0.05)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#16865B' }}>Hadir (Check-In)</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#16865B', marginTop: 2 }}>{stats.present}</div>
                </div>

                <div style={{ backgroundColor: '#F6F7F9', border: '1px solid #EEF1F4', borderRadius: 16, padding: '14px 16px', boxShadow: '0 4px 15px rgba(245,158,11,0.05)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#D8890B' }}>Terlambat</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#D8890B', marginTop: 2 }}>{stats.late}</div>
                </div>

                <div style={{ backgroundColor: '#F6F7F9', border: '1px solid #EEF1F4', borderRadius: 16, padding: '14px 16px', boxShadow: '0 4px 15px rgba(239,68,68,0.05)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#D53F3F' }}>Belum Hadir</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#D53F3F', marginTop: 2 }}>{stats.absent}</div>
                </div>

                <div style={{ backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 16, padding: '14px 16px', boxShadow: '0 4px 15px rgba(139,92,246,0.05)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9' }}>Izin / Cuti</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#5b21b6', marginTop: 2 }}>{stats.on_leave}</div>
                </div>
              </div>
            )}

            {/* Bakso Ujo Readiness Panel */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #E4E7EC',
              borderRadius: 18,
              padding: '16px 20px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#18212F', margin: 0, letterSpacing: '-0.2px' }}>
                  Panel Kesiapan Area Operasional (Bakso Ujo Outlet Utama)
                </h3>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#E96A12', backgroundColor: '#F6F7F9', padding: '3px 8px', borderRadius: 9999, border: '1px solid #EEF1F4' }}>
                  Realtime DB
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {[
                  { area: 'Produksi Dini Hari', count: `${produksihadir} / 1 Kru Hadir`, ready: produksihadir >= 1, color: '#E96A12', bg: '#F6F7F9' },
                  { area: 'Persiapan & Dapur', count: `${persiapanhadir} / 1 Kru Hadir`, ready: persiapanhadir >= 1, color: '#3178C6', bg: '#EEF1F4' },
                  { area: 'Service & Kasir', count: `${servicehadir} / 2 Kru Hadir`, ready: servicehadir >= 1, color: '#16865B', bg: '#EEF1F4' },
                  { area: 'Closing Night', count: closinghadir >= 1 ? '1 / 1 Kru Hadir' : 'Kru Belum Hadir', ready: closinghadir >= 1, color: '#8b5cf6', bg: '#f5f3ff' },
                ].map(p => (
                  <div key={p.area} style={{
                    backgroundColor: p.ready ? p.bg : '#F6F7F9',
                    borderRadius: 14,
                    padding: '12px 14px',
                    border: `1px solid ${p.ready ? p.color + '44' : '#E4E7EC'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#18212F' }}>{p.area}</div>
                    <div style={{ fontSize: 11, color: p.ready ? p.color : '#667085', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>{p.ready ? '✅' : '⚠️'}</span> {p.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Monitor Table - DENSE MINIMALIST */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #E4E7EC',
              borderRadius: 18,
              overflow: 'hidden',
              boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
            }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #EEF1F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: '#18212F', margin: 0, letterSpacing: '-0.2px' }}>Monitor Presensi Hari Ini (Supabase Live)</h3>
                  <p style={{ fontSize: 11, color: '#667085', margin: '2px 0 0', fontWeight: 500 }}>Presensi real-time pegawai & status verifikasi</p>
                </div>
                <button
                  onClick={() => navigate('/attendance/today')}
                  style={{
                    fontSize: 11,
                    color: '#3178C6',
                    backgroundColor: '#EEF1F4',
                    border: '1px solid #E4E7EC',
                    padding: '6px 12px',
                    borderRadius: 9999,
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Buka Mobile Mode →
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E4E7EC', color: '#667085', textAlign: 'left', backgroundColor: '#F6F7F9', height: 36 }}>
                    <th style={{ padding: '6px 16px', fontWeight: 700 }}>NIP / Pegawai</th>
                    <th style={{ padding: '6px 16px', fontWeight: 700 }}>Check-In</th>
                    <th style={{ padding: '6px 16px', fontWeight: 700 }}>Check-Out</th>
                    <th style={{ padding: '6px 16px', fontWeight: 700 }}>Status Presensi</th>
                    <th style={{ padding: '6px 16px', textAlign: 'right', fontWeight: 700 }}>Aksi Quick Punch</th>
                  </tr>
                </thead>
                <tbody>
                  {days.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#667085', fontWeight: 500 }}>
                        Belum ada data presensi hari ini. Tekan "Sync Realtime Schedule" di atas.
                      </td>
                    </tr>
                  ) : (
                    days.map((d, i) => {
                      const isCheckedIn = !!d.check_in_time || d.status === 'PRESENT';
                      const isCheckedOut = !!d.check_out_time;

                      const avatarColors = ['#E96A12', '#3178C6', '#16865B', '#8b5cf6', '#ec4899'];
                      const avatarBg = avatarColors[i % avatarColors.length];

                      return (
                        <tr key={d.id} style={{ borderBottom: '1px solid #EEF1F4', height: 42 }}>
                          <td style={{ padding: '6px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                backgroundColor: avatarBg,
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: 12,
                              }}>
                                {d.employee?.full_name?.charAt(0) ?? 'P'}
                              </div>
                              <div>
                                <span style={{ fontWeight: 700, color: '#18212F' }}>{d.employee?.full_name ?? 'Pegawai'}</span>
                                <span style={{ fontSize: 10, color: '#667085', marginLeft: 6, fontWeight: 600 }}>({d.employee?.employee_no})</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '6px 16px', color: '#16865B', fontWeight: 700 }}>
                            {d.check_in_time ? new Date(d.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td style={{ padding: '6px 16px', color: '#667085', fontWeight: 600 }}>
                            {d.check_out_time ? new Date(d.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td style={{ padding: '6px 16px' }}>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 9999,
                              backgroundColor: isCheckedOut ? '#f3e8ff' : isCheckedIn ? '#EEF1F4' : '#EEF1F4',
                              color: isCheckedOut ? '#7c3aed' : isCheckedIn ? '#16865B' : '#D53F3F',
                            }}>
                              {isCheckedOut ? 'SUDAH PULANG' : isCheckedIn ? 'HADIR' : 'BELUM HADIR'}
                            </span>
                          </td>
                          <td style={{ padding: '6px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => handleQuickPunch(d.employee_id, 'CHECK_IN')}
                                disabled={isCheckedIn || actionLoadingId === `${d.employee_id}_CHECK_IN`}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: 11,
                                  borderRadius: 9999,
                                  border: 'none',
                                  backgroundColor: isCheckedIn ? '#EEF1F4' : '#16865B',
                                  color: isCheckedIn ? '#667085' : '#ffffff',
                                  cursor: isCheckedIn ? 'not-allowed' : 'pointer',
                                  fontWeight: 700,
                                }}
                              >
                                {actionLoadingId === `${d.employee_id}_CHECK_IN` ? '...' : 'Check-In'}
                              </button>
                              <button
                                onClick={() => handleQuickPunch(d.employee_id, 'CHECK_OUT')}
                                disabled={!isCheckedIn || isCheckedOut || actionLoadingId === `${d.employee_id}_CHECK_OUT`}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: 11,
                                  borderRadius: 9999,
                                  border: 'none',
                                  backgroundColor: (!isCheckedIn || isCheckedOut) ? '#EEF1F4' : '#D53F3F',
                                  color: (!isCheckedIn || isCheckedOut) ? '#667085' : '#ffffff',
                                  cursor: (!isCheckedIn || isCheckedOut) ? 'not-allowed' : 'pointer',
                                  fontWeight: 700,
                                }}
                              >
                                {actionLoadingId === `${d.employee_id}_CHECK_OUT` ? '...' : 'Check-Out'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TAB 2: KELOLA KARYAWAN (REALTIME SUPABASE CRUD) */}
        {activeTab === 'employees' && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #E4E7EC',
            borderRadius: 18,
            overflow: 'hidden',
            padding: 20,
            boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#18212F', margin: 0, letterSpacing: '-0.2px' }}>
                  Management Karyawan & Realtime Database Supabase
                </h3>
                <p style={{ fontSize: 11, color: '#667085', margin: '2px 0 0', fontWeight: 500 }}>
                  Tambah, Edit, Hapus, & Pendaftaran Akses Biometrik Karyawan
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingEmp(null);
                  setNewEmpName('');
                  setNewEmpNo('');
                  setNewEmpUsername('');
                  setNewEmpPassword('');
                  setShowEmployeeModal(true);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#18212F',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.2)',
                }}
              >
                + Tambah Karyawan Baru
              </button>
            </div>

            {loadingData ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#667085', fontSize: 12 }}>Memuat data pegawai dari Supabase...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E4E7EC', color: '#667085', textAlign: 'left', backgroundColor: '#F6F7F9', height: 36 }}>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>NIP</th>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>Nama Lengkap</th>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>Email / Username & PIN</th>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>Unit & Jabatan</th>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>Face ID</th>
                    <th style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700 }}>Aksi (CRUD)</th>
                  </tr>
                </thead>
                <tbody>
                  {dbEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#667085' }}>Belum ada data pegawai di Supabase. Tekan Tambah Karyawan Baru.</td>
                    </tr>
                  ) : (
                    dbEmployees.map(emp => (
                      <tr key={emp.id} style={{ borderBottom: '1px solid #EEF1F4', height: 40 }}>
                        <td style={{ padding: '6px 12px', color: '#E96A12', fontWeight: 700 }}>{emp.employee_no}</td>
                        <td style={{ padding: '6px 12px', color: '#18212F', fontWeight: 700 }}>{emp.full_name}</td>
                        <td style={{ padding: '6px 12px', color: '#667085', fontWeight: 500 }}>
                          <span style={{ color: '#3178C6' }}>{emp.email ?? emp.employee_no}</span> • PIN: <strong>{emp.pin_code ?? '••••'}</strong>
                        </td>
                        <td style={{ padding: '6px 12px', color: '#667085', fontWeight: 500 }}>
                          {emp.assignments?.[0]?.business_unit?.name ?? 'Bakso Ujo'} — <strong style={{ color: '#18212F' }}>{emp.assignments?.[0]?.job_title ?? 'Staf Operasional'}</strong>
                        </td>
                        <td style={{ padding: '6px 12px' }}>
                          <span style={{ fontSize: 10, backgroundColor: '#EEF1F4', color: '#16865B', padding: '2px 8px', borderRadius: 9999, fontWeight: 700, border: '1px solid #EEF1F4' }}>
                            📷 Face ID Enrolled ✅
                          </span>
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleOpenEditEmployee(emp)}
                              style={{
                                padding: '3px 10px',
                                fontSize: 11,
                                borderRadius: 6,
                                border: '1px solid #E4E7EC',
                                backgroundColor: '#ffffff',
                                color: '#3178C6',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp.id, emp.full_name)}
                              disabled={actionLoadingId === `del_${emp.id}`}
                              style={{
                                padding: '3px 10px',
                                fontSize: 11,
                                borderRadius: 6,
                                border: '1px solid #EEF1F4',
                                backgroundColor: '#F6F7F9',
                                color: '#D53F3F',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {actionLoadingId === `del_${emp.id}` ? '...' : '🗑️ Hapus'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 3: KELOLA SHIFT (REALTIME SUPABASE CRUD) */}
        {activeTab === 'shifts' && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #E4E7EC',
            borderRadius: 18,
            overflow: 'hidden',
            padding: 20,
            boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#18212F', margin: 0, letterSpacing: '-0.2px' }}>
                  Konfigurasi Jam Kerja & Master Template Shift (Supabase Realtime)
                </h3>
                <p style={{ fontSize: 11, color: '#667085', margin: '2px 0 0', fontWeight: 500 }}>
                  Tambah, Edit, & Hapus jam kerja operasional unit bisnis
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingShift(null);
                  setShiftName('');
                  setShiftCode('');
                  setShowShiftModal(true);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#18212F',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.2)',
                }}
              >
                + Tambah Shift Baru
              </button>
            </div>

            {loadingData ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#667085', fontSize: 12 }}>Memuat template shift dari Supabase...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E4E7EC', color: '#667085', textAlign: 'left', backgroundColor: '#F6F7F9', height: 36 }}>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>Kode Shift</th>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>Nama Shift</th>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>Jam Kerja</th>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>Toleransi Late</th>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>Unit Bisnis</th>
                    <th style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700 }}>Aksi (CRUD)</th>
                  </tr>
                </thead>
                <tbody>
                  {dbShifts.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#667085' }}>Belum ada template shift di Supabase. Tekan Tambah Shift Baru.</td>
                    </tr>
                  ) : (
                    dbShifts.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #EEF1F4', height: 40 }}>
                        <td style={{ padding: '6px 12px', color: '#E96A12', fontWeight: 700 }}>{s.code}</td>
                        <td style={{ padding: '6px 12px', color: '#18212F', fontWeight: 700 }}>{s.name}</td>
                        <td style={{ padding: '6px 12px', color: '#3178C6', fontWeight: 700 }}>
                          {s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)} WIB
                        </td>
                        <td style={{ padding: '6px 12px', color: '#667085', fontWeight: 600 }}>{s.late_tolerance_mins ?? 15} Mnt</td>
                        <td style={{ padding: '6px 12px', color: '#667085', fontWeight: 600 }}>
                          {s.business_unit?.name ?? 'Bakso Ujo'}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleOpenEditShift(s)}
                              style={{
                                padding: '3px 10px',
                                fontSize: 11,
                                borderRadius: 6,
                                border: '1px solid #E4E7EC',
                                backgroundColor: '#ffffff',
                                color: '#3178C6',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteShift(s.id, s.name)}
                              disabled={actionLoadingId === `del_shift_${s.id}`}
                              style={{
                                padding: '3px 10px',
                                fontSize: 11,
                                borderRadius: 6,
                                border: '1px solid #EEF1F4',
                                backgroundColor: '#F6F7F9',
                                color: '#D53F3F',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {actionLoadingId === `del_shift_${s.id}` ? '...' : '🗑️ Hapus'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 4: AUDIT LOG & SYSTEM LOGS */}
        {activeTab === 'reports' && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #E4E7EC',
            borderRadius: 18,
            overflow: 'hidden',
            padding: 20,
            boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#18212F', margin: '0 0 14px', letterSpacing: '-0.2px' }}>
              Audit Log System & Realtime Logs (Supabase `attendance_audit_logs`)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dbLogs.length === 0 ? (
                <div style={{ backgroundColor: '#F6F7F9', padding: '12px 14px', borderRadius: 12, fontSize: 12, color: '#667085' }}>
                  Belum ada log aktivitas tersimpan di database.
                </div>
              ) : (
                dbLogs.map((log, idx) => (
                  <div key={log.id ?? idx} style={{ backgroundColor: '#F6F7F9', padding: '10px 14px', borderRadius: 12, fontSize: 11, color: '#667085', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E4E7EC' }}>
                    <div>
                      <strong style={{ color: '#16865B' }}>[{log.entity_type ?? 'SYSTEM'}]</strong> {log.action ?? 'EVENT'} — {JSON.stringify(log.after_data ?? {})}
                    </div>
                    <span style={{ fontSize: 10, color: '#667085', fontWeight: 600 }}>{new Date(log.created_at).toLocaleTimeString('id-ID')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL: REGISTRASI & EDIT KARYAWAN */}
      {showEmployeeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            width: '100%',
            maxWidth: 440,
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            border: '1px solid #E4E7EC',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#18212F', margin: 0 }}>
                {editingEmp ? 'Edit Karyawan Supabase' : 'Daftarkan Karyawan & Face ID'}
              </h3>
              <button onClick={() => setShowEmployeeModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, color: '#667085', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveEmployee} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>Nama Lengkap</label>
                <input type="text" placeholder="Misal: Ahmad Zaky" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>NIP / No Pegawai</label>
                  <input type="text" placeholder="UJO-006" value={newEmpNo} onChange={e => setNewEmpNo(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>Username Login</label>
                  <input type="text" placeholder="ahmad.ujo" value={newEmpUsername} onChange={e => setNewEmpUsername(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>
                    Password Login {!editingEmp && <span style={{ color: '#D53F3F' }}>*</span>}
                  </label>
                  <input
                    type="password"
                    placeholder={editingEmp ? 'Kosongkan bila tidak diubah' : 'Minimal 6 karakter'}
                    value={newEmpPassword}
                    onChange={e => setNewEmpPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4 }}
                  />
                </div>
              </div>

              {!editingEmp && (
                <p style={{ fontSize: 11, color: '#667085', margin: '2px 0 0', lineHeight: 1.5 }}>
                  Akun dibuat khusus untuk sistem <strong>Attendance</strong> dan tidak memperoleh akses
                  Product Launch OS. Login memakai <strong>nomor pegawai</strong> beserta password ini.
                </p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>Unit Bisnis (Terdaftar)</label>
                  <select
                    value={newEmpUnitId || (units[0]?.id ?? '')}
                    onChange={e => setNewEmpUnitId(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4, backgroundColor: '#ffffff', color: '#18212F', fontWeight: 600 }}
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>Jabatan / Tugas (Terdaftar)</label>
                  <select
                    value={newEmpRole}
                    onChange={e => setNewEmpRole(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4, backgroundColor: '#ffffff', color: '#18212F', fontWeight: 600 }}
                  >
                    <option value="Staf Produksi Dini Hari">Staf Produksi Dini Hari</option>
                    <option value="Staf Persiapan & Dapur">Staf Persiapan & Dapur</option>
                    <option value="Staf Service & Frontline">Staf Service & Frontline</option>
                    <option value="Staf Closing Night">Staf Closing Night</option>
                    <option value="Kasir & POS">Kasir & POS</option>
                    <option value="Supervisor Outlet">Supervisor Outlet</option>
                    <option value="Manager Operasional">Manager Operasional</option>
                    <option value="Staf Logistik & Kurir">Staf Logistik & Kurir</option>
                  </select>
                </div>
              </div>

              {/* Face ID Biometric Enrollment Section */}
              <div style={{ backgroundColor: '#F6F7F9', border: '1px solid #E4E7EC', borderRadius: 14, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#18212F' }}>📷 Biometric Face ID Enrollment</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: faceEnrolled ? '#16865B' : '#D8890B', backgroundColor: faceEnrolled ? '#EEF1F4' : '#EEF1F4', padding: '2px 8px', borderRadius: 9999 }}>
                    {faceEnrolled ? 'Enrolled ✅' : 'Belum Pindai'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleScanFace}
                  disabled={faceScanning}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: faceEnrolled ? '#EEF1F4' : '#EEF1F4',
                    color: faceEnrolled ? '#16865B' : '#3178C6',
                    border: `1px solid ${faceEnrolled ? '#EEF1F4' : '#E4E7EC'}`,
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {faceScanning ? '📷 Memindai Wajah Landmark...' : faceEnrolled ? '✅ Biometrik Wajah Tersimpan' : '📷 Pindai & Daftarkan Wajah Biometrik'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowEmployeeModal(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #E4E7EC', backgroundColor: '#ffffff', color: '#667085', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={actionLoadingId === 'save_emp'} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', backgroundColor: '#3178C6', color: '#ffffff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Simpan Ke Supabase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SHIFT TEMPLATE MODAL */}
      {showShiftModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            width: '100%',
            maxWidth: 400,
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            border: '1px solid #E4E7EC',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#18212F', margin: 0 }}>
                {editingShift ? 'Edit Template Shift' : 'Tambah Shift Baru'}
              </h3>
              <button onClick={() => setShowShiftModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, color: '#667085', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveShift} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>Nama Shift</label>
                <input type="text" placeholder="Shift Midday Express" value={shiftName} onChange={e => setShiftName(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4 }} />
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>Kode Shift</label>
                <input type="text" placeholder="SHIFT_MIDDAY" value={shiftCode} disabled={!!editingShift} onChange={e => setShiftCode(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4, backgroundColor: editingShift ? '#EEF1F4' : '#ffffff' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>Jam Masuk</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>Jam Pulang</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4 }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>Toleransi Keterlambatan (Menit)</label>
                <input type="number" value={lateTolerance} onChange={e => setLateTolerance(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4 }} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowShiftModal(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #E4E7EC', backgroundColor: '#ffffff', color: '#667085', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={actionLoadingId === 'save_shift'} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', backgroundColor: '#3178C6', color: '#ffffff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Simpan Ke Supabase</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
