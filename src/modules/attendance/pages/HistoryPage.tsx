import { useState, useEffect } from 'react';
import { useNavigate } from '@/app/router/simpleRouter';
import { supabase } from '@/integrations/supabase/client';
import { attendanceRepository } from '../data/attendanceRepository';
import { useEmployeeHistory, useRequestLeave } from '../hooks/useAttendance';
import { LoadingState, EmptyState } from '../components/AttendanceStateComponents';
import type { Employee } from '../domain/types';
import '../attendance.css';

export function SchedulePage() {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    async function initUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: emp } = await supabase.from('attendance_employees').select('id').eq('user_id', data.user.id).maybeSingle();
        if (emp) setEmployeeId(emp.id);
      }
    }
    initUser();
  }, []);

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#E4E7EC', margin: 0 }}>Jadwal Kerja Pegawai</h1>
        <button onClick={() => navigate('/attendance/today')} style={{ padding: '6px 12px', backgroundColor: '#18212F', border: '1px solid #18212F', borderRadius: 7, color: '#667085', fontSize: 12, cursor: 'pointer' }}>
          ← Hari Ini
        </button>
      </div>

      <div style={{ backgroundColor: '#18212F', border: '1px solid #18212F', borderRadius: 14, padding: '18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#3178C6' }}>📅 Jadwal Minggu Ini (Bakso Ujo)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { day: 'Senin', shift: 'Produksi Dini Hari (03:00 - 15:00)', area: 'Produksi' },
            { day: 'Selasa', shift: 'Produksi Dini Hari (03:00 - 15:00)', area: 'Produksi' },
            { day: 'Rabu', shift: 'Produksi Pagi A (05:00 - 17:00)', area: 'Service' },
            { day: 'Kamis', shift: 'Persiapan & Service (09:00 - 21:00)', area: 'Persiapan' },
            { day: 'Jumat', shift: 'Outlet & Closing (10:00 - 22:00)', area: 'Closing' },
            { day: 'Sabtu', shift: 'Outlet & Closing (10:00 - 22:00)', area: 'Closing' },
            { day: 'Minggu', shift: 'OFF / LIBUR', area: '—' },
          ].map(s => (
            <div key={s.day} style={{ backgroundColor: '#18212F', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#E4E7EC' }}>{s.day}</div>
                <div style={{ fontSize: 11, color: '#667085', marginTop: 2 }}>{s.shift}</div>
              </div>
              <span style={{ fontSize: 11, backgroundColor: s.area === '—' ? '#18212F' : '#3178C622', color: s.area === '—' ? '#667085' : '#3178C6', padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>
                {s.area}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HistoryPage() {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    async function initUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: emp } = await supabase
          .from('attendance_employees')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();
        if (emp) setEmployeeId(emp.id);
      }
    }
    initUser();
  }, []);

  const { data: histRes, isLoading } = useEmployeeHistory(employeeId);
  const history = histRes?.data ?? [];

  if (isLoading) return <LoadingState message="Memuat histori presensi..." />;

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#E4E7EC', margin: 0 }}>Histori Presensi</h1>
        <button onClick={() => navigate('/attendance/today')} style={{ padding: '6px 12px', backgroundColor: '#18212F', border: '1px solid #18212F', borderRadius: 7, color: '#667085', fontSize: 12, cursor: 'pointer' }}>
          ← Hari Ini
        </button>
      </div>

      {history.length === 0 ? (
        <EmptyState title="Belum ada histori presensi" icon="📜" message="Histori presensi Anda akan muncul di sini." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map(day => (
            <div key={day.id} style={{ backgroundColor: '#18212F', border: '1px solid #18212F', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#E4E7EC' }}>{day.work_date}</div>
                <div style={{ fontSize: 11, color: '#667085', marginTop: 2 }}>
                  Masuk: <strong style={{ color: '#667085' }}>{day.check_in_time ? new Date(day.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}</strong>
                  {' • '}
                  Pulang: <strong style={{ color: '#667085' }}>{day.check_out_time ? new Date(day.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}</strong>
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, backgroundColor: day.status === 'PRESENT' ? '#16865B22' : day.status === 'LATE' ? '#D8890B22' : '#D53F3F22', color: day.status === 'PRESENT' ? '#16865B' : day.status === 'LATE' ? '#D8890B' : '#D53F3F' }}>
                {day.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LeavePage() {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [leaveType, setLeaveType] = useState<'SICK' | 'ANNUAL_LEAVE' | 'PERMISSION' | 'BUSINESS_TRIP'>('SICK');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const requestLeaveMut = useRequestLeave();

  useEffect(() => {
    async function initUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: emp } = await supabase.from('attendance_employees').select('id').eq('user_id', data.user.id).maybeSingle();
        if (emp) setEmployeeId(emp.id);
      }
    }
    initUser();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId || !startDate || !endDate || !reason.trim()) return;

    setSubmitting(true);
    const result = await requestLeaveMut.mutateAsync({
      organization_id: '00000000-0000-0000-0000-000000000000',
      business_unit_id: '00000000-0000-0000-0000-000000000000',
      employee_id: employeeId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason: reason.trim(),
    });
    setSubmitting(false);

    if (result.data) {
      alert('Pengajuan izin berhasil dikirim!');
      navigate('/attendance/today');
    } else {
      alert(`Gagal: ${result.error?.message}`);
    }
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#E4E7EC', margin: 0 }}>Pengajuan Izin / Cuti</h1>
        <button onClick={() => navigate('/attendance/today')} style={{ padding: '6px 12px', backgroundColor: '#18212F', border: '1px solid #18212F', borderRadius: 7, color: '#667085', fontSize: 12, cursor: 'pointer' }}>
          ← Hari Ini
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ backgroundColor: '#18212F', border: '1px solid #18212F', borderRadius: 14, padding: '18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ fontSize: 12, color: '#667085' }}>Tipe Izin</label>
        <select value={leaveType} onChange={e => setLeaveType(e.target.value as any)} style={{ padding: '8px 12px', backgroundColor: '#18212F', border: '1px solid #18212F', borderRadius: 7, color: '#E4E7EC', fontSize: 13 }}>
          <option value="SICK">Sakit</option>
          <option value="ANNUAL_LEAVE">Cuti Tahunan</option>
          <option value="PERMISSION">Izin Keperluan</option>
          <option value="BUSINESS_TRIP">Dinas Luar</option>
        </select>

        <label style={{ fontSize: 12, color: '#667085' }}>Tanggal Mulai</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px 12px', backgroundColor: '#18212F', border: '1px solid #18212F', borderRadius: 7, color: '#E4E7EC', fontSize: 13 }} />

        <label style={{ fontSize: 12, color: '#667085' }}>Tanggal Selesai</label>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px 12px', backgroundColor: '#18212F', border: '1px solid #18212F', borderRadius: 7, color: '#E4E7EC', fontSize: 13 }} />

        <label style={{ fontSize: 12, color: '#667085' }}>Alasan / Keterangan</label>
        <textarea placeholder="Tuliskan alasan..." value={reason} onChange={e => setReason(e.target.value)} rows={3} style={{ padding: '8px 12px', backgroundColor: '#18212F', border: '1px solid #18212F', borderRadius: 7, color: '#E4E7EC', fontSize: 13 }} />

        <button type="submit" disabled={submitting} style={{ marginTop: 6, padding: '10px', backgroundColor: '#3178C6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {submitting ? 'Kirim...' : 'Kirim Pengajuan'}
        </button>
      </form>
    </div>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const [emp, setEmp] = useState<Employee | null>(null);

  useEffect(() => {
    async function initUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: profile } = await supabase.from('attendance_employees').select('*').eq('user_id', data.user.id).maybeSingle();
        if (profile) setEmp(profile);
      }
    }
    initUser();
  }, []);

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#E4E7EC', margin: 0 }}>Profil Pegawai</h1>
        <button onClick={() => navigate('/attendance/today')} style={{ padding: '6px 12px', backgroundColor: '#18212F', border: '1px solid #18212F', borderRadius: 7, color: '#667085', fontSize: 12, cursor: 'pointer' }}>
          ← Hari Ini
        </button>
      </div>

      <div style={{ backgroundColor: '#18212F', border: '1px solid #18212F', borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#E96A12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff' }}>
          {emp?.full_name?.charAt(0) ?? 'P'}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#E4E7EC' }}>{emp?.full_name ?? 'Kru Bakso Ujo'}</div>
          <div style={{ fontSize: 12, color: '#E96A12', fontWeight: 600, marginTop: 2 }}>{emp?.employee_no ?? 'UJO-001'}</div>
          <div style={{ fontSize: 12, color: '#667085', marginTop: 4 }}>Bakso Ujo • Outlet Utama</div>
        </div>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate('/attendance/login');
          }}
          style={{ width: '100%', marginTop: 12, padding: '12px', backgroundColor: '#D53F3F22', border: '1px solid #D53F3F66', borderRadius: 10, color: '#D53F3F', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          🚪 Keluar (Sign Out)
        </button>
      </div>
    </div>
  );
}
