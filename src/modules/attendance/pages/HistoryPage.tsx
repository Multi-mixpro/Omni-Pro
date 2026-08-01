import { useState, useEffect } from 'react';
import { useNavigate } from '@/app/router/simpleRouter';
import { supabase } from '@/integrations/supabase/client';
import { attendanceRepository } from '../data/attendanceRepository';
import { useEmployeeHistory, useRequestLeave } from '../hooks/useAttendance';
import { LoadingState, EmptyState } from '../components/AttendanceStateComponents';
import type { Employee } from '../domain/types';
import '../attendance.css';

/** Employee id milik user yang sedang login. */
function useCurrentEmployeeId() {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user || !active) return;
      const { data: emp } = await supabase
        .from('attendance_employees')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle();
      if (emp && active) setEmployeeId(emp.id);
    })();
    return () => { active = false; };
  }, []);
  return employeeId;
}

function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <h1 className="att-h2">{title}</h1>
      <button
        type="button"
        className="att-btn att-btn-secondary"
        onClick={onBack}
        style={{ minHeight: 36, padding: '0 12px', fontSize: 13 }}
      >
        ← Hari Ini
      </button>
    </div>
  );
}

const DAY_LABEL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/** Tujuh hari ke depan mulai hari ini (format ISO). */
function weekRange() {
  const days: string[] = [];
  const base = new Date();
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function SchedulePage() {
  const navigate = useNavigate();
  const employeeId = useCurrentEmployeeId();
  const [rows, setRows] = useState<Array<{ date: string; shift?: string; time?: string; area?: string }> | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    let active = true;
    (async () => {
      const dates = weekRange();
      // Roster diambil dari database, bukan contoh statis, supaya yang tampil
      // benar-benar jadwal pegawai yang bersangkutan.
      const { data } = await supabase
        .from('attendance_schedules')
        .select('schedule_date, shift_template:attendance_shift_templates(name, start_time, end_time), work_area:attendance_work_areas(name)')
        .eq('employee_id', employeeId)
        .gte('schedule_date', dates[0])
        .lte('schedule_date', dates[dates.length - 1]);

      if (!active) return;

      const byDate = new Map<string, { name?: string; start_time?: string; end_time?: string; area?: string }>();
      (data ?? []).forEach((row: Record<string, unknown>) => {
        const tpl = row.shift_template as { name?: string; start_time?: string; end_time?: string } | null;
        const area = row.work_area as { name?: string } | null;
        byDate.set(String(row.schedule_date), {
          name: tpl?.name,
          start_time: tpl?.start_time,
          end_time: tpl?.end_time,
          area: area?.name,
        });
      });

      setRows(dates.map((date) => {
        const hit = byDate.get(date);
        return {
          date,
          shift: hit?.name,
          time: hit?.start_time && hit?.end_time
            ? `${hit.start_time.slice(0, 5)} – ${hit.end_time.slice(0, 5)}`
            : undefined,
          area: hit?.area,
        };
      }));
    })();
    return () => { active = false; };
  }, [employeeId]);

  return (
    <div className="att-app">
      <div className="att-shell" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <PageHeader title="Jadwal Kerja" onBack={() => navigate('/attendance/today')} />

        <div className="att-card">
          <div className="att-label" style={{ marginBottom: 12 }}>Tujuh hari ke depan</div>

          {rows === null ? (
            <p className="att-small">Memuat jadwal…</p>
          ) : (
            <div>
              {rows.map((row) => {
                const d = new Date(`${row.date}T00:00:00`);
                const kosong = !row.shift;
                return (
                  <div key={row.date} className="att-row">
                    <div style={{ minWidth: 58 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{DAY_LABEL[d.getDay()]}</div>
                      <div className="att-small">{row.date.slice(8, 10)}/{row.date.slice(5, 7)}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {row.shift ?? 'Tidak dijadwalkan'}
                      </div>
                      {row.time && <div className="att-small">{row.time} WIB</div>}
                    </div>
                    <span className={`att-chip ${kosong ? '' : 'att-chip-info'}`}>
                      {row.area ?? (kosong ? 'Libur' : 'Shift')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function HistoryPage() {
  const navigate = useNavigate();
  const employeeId = useCurrentEmployeeId();
  const { data: histRes, isLoading } = useEmployeeHistory(employeeId);
  const history = histRes?.data ?? [];

  if (isLoading) return <LoadingState message="Memuat histori presensi..." />;

  const chipFor = (status: string) =>
    status === 'PRESENT' ? 'att-chip att-chip-success'
      : status === 'LATE' ? 'att-chip att-chip-warning'
        : 'att-chip att-chip-danger';

  return (
    <div className="att-app">
      <div className="att-shell" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <PageHeader title="Histori Presensi" onBack={() => navigate('/attendance/today')} />

        {history.length === 0 ? (
          <EmptyState title="Belum ada histori presensi" icon="📜" message="Histori presensi Anda akan muncul di sini." />
        ) : (
          <div className="att-card">
            {history.map((day) => (
              <div key={day.id} className="att-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{day.work_date}</div>
                  <div className="att-small">
                    Masuk {day.check_in_time ? new Date(day.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    {' · '}
                    Pulang {day.check_out_time ? new Date(day.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </div>
                </div>
                <span className={chipFor(day.status)}>{day.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function LeavePage() {
  const navigate = useNavigate();
  const employeeId = useCurrentEmployeeId();
  const [leaveType, setLeaveType] = useState<'SICK' | 'ANNUAL_LEAVE' | 'PERMISSION' | 'BUSINESS_TRIP'>('SICK');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const requestLeaveMut = useRequestLeave();

  const invalidRange = Boolean(startDate && endDate && endDate < startDate);
  const canSubmit = Boolean(employeeId && startDate && endDate && reason.trim() && !invalidRange && !submitting);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId || !canSubmit) return;

    setSubmitting(true);
    setFeedback(null);

    // Scope diambil dari assignment nyata. Sebelumnya dipakai UUID nil sebagai
    // fallback, yang selalu ditolak foreign key dengan pesan membingungkan.
    const scope = await attendanceRepository.resolveEmployeeScope(employeeId);
    if (!scope.data) {
      setSubmitting(false);
      setFeedback({ tone: 'err', text: scope.error?.message ?? 'Unit penempatan tidak ditemukan.' });
      return;
    }

    const result = await requestLeaveMut.mutateAsync({
      organization_id: scope.data.organization_id,
      business_unit_id: scope.data.business_unit_id,
      employee_id: employeeId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason: reason.trim(),
    });
    setSubmitting(false);

    if (result.data) {
      setFeedback({ tone: 'ok', text: 'Pengajuan terkirim dan menunggu persetujuan.' });
      setStartDate(''); setEndDate(''); setReason('');
      setTimeout(() => navigate('/attendance/today'), 1200);
    } else {
      setFeedback({ tone: 'err', text: result.error?.message ?? 'Pengajuan gagal dikirim.' });
    }
  }

  return (
    <div className="att-app">
      <div className="att-shell" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <PageHeader title="Pengajuan Izin / Cuti" onBack={() => navigate('/attendance/today')} />

        <form onSubmit={handleSubmit} className="att-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="att-label">Tipe pengajuan</span>
            <select
              className="att-input"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as typeof leaveType)}
            >
              <option value="SICK">Sakit</option>
              <option value="ANNUAL_LEAVE">Cuti tahunan</option>
              <option value="PERMISSION">Izin keperluan</option>
              <option value="BUSINESS_TRIP">Dinas luar</option>
            </select>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="att-label">Mulai</span>
              <input className="att-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="att-label">Selesai</span>
              <input
                className="att-input"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
          </div>

          {invalidRange && (
            <p className="att-small" style={{ color: 'var(--att-danger)', fontWeight: 600 }}>
              Tanggal selesai tidak boleh lebih awal dari tanggal mulai.
            </p>
          )}

          <label style={{ display: 'grid', gap: 6 }}>
            <span className="att-label">Alasan / keterangan</span>
            <textarea
              className="att-input"
              style={{ minHeight: 90, padding: '10px 14px', resize: 'vertical', lineHeight: 1.5 }}
              placeholder="Jelaskan alasan pengajuan…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>

          {feedback && (
            <p
              className="att-small"
              style={{
                fontWeight: 600,
                color: feedback.tone === 'ok' ? 'var(--att-success)' : 'var(--att-danger)',
              }}
            >
              {feedback.text}
            </p>
          )}

          <button type="submit" className="att-btn att-btn-primary att-btn-action" disabled={!canSubmit}>
            {submitting ? 'Mengirim…' : 'Kirim pengajuan'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const [emp, setEmp] = useState<Employee | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user || !active) return;
      const { data: profile } = await supabase
        .from('attendance_employees')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();
      if (profile && active) setEmp(profile);
    })();
    return () => { active = false; };
  }, []);

  const initials = (emp?.full_name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="att-app">
      <div className="att-shell" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <PageHeader title="Profil Pegawai" onBack={() => navigate('/attendance/today')} />

        {!emp ? (
          <p className="att-small">Memuat profil…</p>
        ) : (
          <>
            <div className="att-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span
                aria-hidden
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background: 'var(--att-primary)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 18,
                  flex: '0 0 auto',
                }}
              >
                {initials}
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="att-h3" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {emp.full_name}
                </div>
                <div className="att-small">{emp.employee_no}</div>
                <span className={`att-chip ${emp.is_active ? 'att-chip-success' : ''}`} style={{ marginTop: 6 }}>
                  {emp.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>

            <div className="att-card">
              <div className="att-label" style={{ marginBottom: 4 }}>Kontak</div>
              <div className="att-row">
                <span className="att-small" style={{ flex: 1 }}>Email</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{emp.email || '—'}</span>
              </div>
              <div className="att-row">
                <span className="att-small" style={{ flex: 1 }}>Telepon</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{emp.phone || '—'}</span>
              </div>
            </div>

            <button
              type="button"
              className="att-btn att-btn-secondary"
              onClick={() => navigate('/attendance/leave')}
            >
              Ajukan izin / cuti
            </button>

            <button
              type="button"
              className="att-btn"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate('/attendance/login');
              }}
              style={{
                background: 'rgba(213, 63, 63, .10)',
                color: 'var(--att-danger)',
                border: '1px solid rgba(213, 63, 63, .28)',
              }}
            >
              Keluar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
