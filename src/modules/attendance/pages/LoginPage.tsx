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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message === 'Invalid login credentials' ? 'Email atau password salah.' : error.message);
      return;
    }

    if (data.user) {
      const { data: mems } = await supabase
        .from('attendance_memberships')
        .select('*')
        .eq('user_id', data.user.id)
        .eq('is_active', true);

      const roles = mems?.map(m => m.role) ?? [];
      if (roles.includes('OWNER') || roles.includes('BUSINESS_UNIT_ADMIN')) {
        navigate('/attendance/admin/dashboard');
      } else {
        navigate('/attendance/today');
      }
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
            <label style={{ fontSize: 12, color: '#667085', fontWeight: 700 }}>Email / Username</label>
            <input
              type="email"
              placeholder="nama@perusahaan.com"
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

        {/* Quick Demo Access Bar */}
        <div style={{ borderTop: '1px solid #EEF1F4', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>Demo Quick Access:</div>
          <button
            onClick={() => navigate('/attendance/admin/dashboard')}
            style={{
              padding: '10px 14px',
              backgroundColor: '#EEF1F4',
              border: '1px solid #E4E7EC',
              borderRadius: 12,
              color: '#3178C6',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Buka Dashboard Admin (Owner View) →
          </button>
        </div>

        {/* Footer info */}
        <div style={{ fontSize: 11, color: '#667085', textAlign: 'center', fontWeight: 600 }}>
          Bakso Ujo • GG Supply • GUDSKUY
        </div>
      </div>
    </div>
  );
}
