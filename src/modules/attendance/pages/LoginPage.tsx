import React, { useState } from 'react';
import { useNavigate } from '@/app/router/simpleRouter';
import { supabase } from '@/integrations/supabase/client';
import '../attendance.css';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Email dan password wajib diisi.');
      return;
    }

    setLoading(true);

    // Kolom menerima email lengkap ATAU nomor pegawai/username. Supabase hanya
    // menerima email, jadi nilai tanpa "@" dicoba pada domain internal
    // Attendance lebih dulu, baru domain tim Product Launch.
    const raw = email.trim();
    const kandidat = raw.includes('@')
      ? [raw]
      : [
        `${raw.toLowerCase()}@attendance.ggindoapparel.internal`,
        `${raw.toLowerCase()}@team.ggindoapparel.internal`,
      ];

    let data: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data'] | null = null;
    let error: { message: string } | null = null;

    for (const kandidatEmail of kandidat) {
      const attempt = await supabase.auth.signInWithPassword({ email: kandidatEmail, password });
      if (!attempt.error) { data = attempt.data; error = null; break; }
      error = attempt.error;
    }

    setLoading(false);

    if (error || !data?.user) {
      setErrorMsg(
        error?.message === 'Invalid login credentials'
          ? 'Nomor pegawai/email atau password salah.'
          : error?.message ?? 'Gagal masuk.',
      );
      return;
    }

    const { data: mems } = await supabase
      .from('attendance_memberships')
      .select('role')
      .eq('user_id', data.user.id)
      .eq('is_active', true);

    const roles = mems?.map(m => m.role) ?? [];

    // Akun Product Launch tidak otomatis boleh masuk Attendance.
    if (roles.length === 0) {
      await supabase.auth.signOut();
      setErrorMsg(
        'Akun ini tidak terdaftar pada sistem Attendance. '
        + 'Akun Product Launch OS memakai kredensial terpisah. Hubungi admin unit untuk didaftarkan.',
      );
      return;
    }

    if (roles.includes('OWNER') || roles.includes('BUSINESS_UNIT_ADMIN')) {
      navigate('/attendance/admin/dashboard');
    } else {
      navigate('/attendance/today');
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F6F7F9',
        color: '#18212F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* iOS Clean Login Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: '#ffffff',
          border: '1px solid #E4E7EC',
          borderRadius: 24,
          padding: '36px 30px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #3178C6 0%, #3178C6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 800,
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
            }}
          >
            CA
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#18212F', margin: 0, letterSpacing: '-0.5px' }}>Central Attendance</h1>
            <p style={{ fontSize: 13, color: '#667085', margin: '4px 0 0', fontWeight: 500 }}>Satu Akses Seluruh Unit Bisnis</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {errorMsg && (
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#EEF1F4',
                border: '1px solid #EEF1F4',
                borderRadius: 12,
                fontSize: 12,
                color: '#D53F3F',
                fontWeight: 600,
              }}
            >
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#667085', fontWeight: 700 }}>Nomor Pegawai / Email</label>
            <input
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="UJO-001 atau email lengkap"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                padding: '12px 16px',
                backgroundColor: '#F6F7F9',
                border: '1px solid #E4E7EC',
                borderRadius: 14,
                color: '#18212F',
                fontSize: 14,
                fontWeight: 500,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#667085', fontWeight: 700 }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                padding: '12px 16px',
                backgroundColor: '#F6F7F9',
                border: '1px solid #E4E7EC',
                borderRadius: 14,
                color: '#18212F',
                fontSize: 14,
                fontWeight: 500,
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              padding: '14px',
              backgroundColor: loading ? '#667085' : '#3178C6',
              color: '#ffffff',
              border: 'none',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 25px rgba(37, 99, 235, 0.3)',
              letterSpacing: '0.3px',
            }}
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Attendance'}
          </button>
        </form>

        {/* Catatan: pintasan "Demo Quick Access" ke dashboard admin dihapus.
            Pintasan itu melompati proses login sehingga siapa pun dapat membuka
            dashboard tanpa kredensial. */}

        {/* Footer info */}
        <div style={{ fontSize: 11, color: '#667085', textAlign: 'center', fontWeight: 600 }}>
          Bakso Ujo • GG Supply • GUDSKUY
        </div>
      </div>
    </div>
  );
}
