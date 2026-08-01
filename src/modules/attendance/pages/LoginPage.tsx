import { useState, type FormEvent } from 'react';
import { CalendarCheck2, Eye, EyeOff, KeyRound, Loader2, ShieldCheck, UserRound } from 'lucide-react';
import { useNavigate } from '@/app/router/simpleRouter';
import { supabase } from '@/integrations/supabase/client';
import '../attendance.css';

type LoginMode = 'pin' | 'account';

type PinLoginResponse = {
  access_token?: string;
  refresh_token?: string;
  error?: string;
};

const INTERNAL_ATTENDANCE_DOMAIN = 'attendance.ggindoapparel.internal';
const INTERNAL_TEAM_DOMAIN = 'team.ggindoapparel.internal';
const DEVICE_STORAGE_KEY = 'central-attendance-device-id-v1';
let volatileDeviceId = '';

function getDeviceId(): string {
  try {
    const existing = window.localStorage.getItem(DEVICE_STORAGE_KEY);
    if (existing) return existing;

    const id = `att-${window.crypto.randomUUID()}`;
    window.localStorage.setItem(DEVICE_STORAGE_KEY, id);
    return id;
  } catch {
    if (!volatileDeviceId) volatileDeviceId = `att-${window.crypto.randomUUID()}`;
    return volatileDeviceId;
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<LoginMode>('pin');
  const [pin, setPin] = useState('');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  function switchMode(nextMode: LoginMode) {
    setMode(nextMode);
    setErrorMsg('');
  }

  async function handlePinLogin(event: FormEvent) {
    event.preventDefault();
    setErrorMsg('');

    if (!/^\d{6}$/.test(pin)) {
      setErrorMsg('Masukkan PIN kru tepat 6 digit.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/attendance-pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, device_id: getDeviceId() }),
      });
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Login PIN membutuhkan server aplikasi. Jalankan melalui deployment, bukan Vite localhost.');
      }
      const payload = await response.json().catch(() => ({})) as PinLoginResponse;

      if (!response.ok || !payload.access_token || !payload.refresh_token) {
        if (response.status === 404) {
          throw new Error('Login PIN membutuhkan server aplikasi. Jalankan melalui deployment, bukan Vite localhost.');
        }
        throw new Error(payload.error ?? 'PIN tidak dapat diverifikasi.');
      }

      const { error } = await supabase.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      });
      if (error) throw error;

      navigate('/attendance/today');
    } catch (reason) {
      setErrorMsg(reason instanceof Error ? reason.message : 'Login PIN gagal.');
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccountLogin(event: FormEvent) {
    event.preventDefault();
    setErrorMsg('');
    if (!identity.trim() || !password) {
      setErrorMsg('Nomor pegawai/email dan password wajib diisi.');
      return;
    }

    setLoading(true);
    const raw = identity.trim();
    const candidates = raw.includes('@')
      ? [raw]
      : [
        `${raw.toLowerCase()}@${INTERNAL_ATTENDANCE_DOMAIN}`,
        `${raw.toLowerCase()}@${INTERNAL_TEAM_DOMAIN}`,
      ];

    let signedInUserId: string | null = null;
    let lastError: { message: string } | null = null;

    for (const email of candidates) {
      const attempt = await supabase.auth.signInWithPassword({ email, password });
      if (!attempt.error && attempt.data.user) {
        signedInUserId = attempt.data.user.id;
        lastError = null;
        break;
      }
      lastError = attempt.error;
    }

    if (!signedInUserId) {
      setLoading(false);
      setErrorMsg(
        lastError?.message === 'Invalid login credentials'
          ? 'Identitas atau password salah.'
          : lastError?.message ?? 'Gagal masuk.',
      );
      return;
    }

    const { data: memberships, error: membershipError } = await supabase
      .from('attendance_memberships')
      .select('role')
      .eq('user_id', signedInUserId)
      .eq('is_active', true);
    const roles = memberships?.map((membership) => membership.role) ?? [];

    if (membershipError || roles.length === 0) {
      await supabase.auth.signOut();
      setLoading(false);
      setErrorMsg(
        membershipError
          ? 'Keanggotaan Attendance belum dapat diverifikasi.'
          : 'Akun ini tidak terdaftar pada sistem Attendance.',
      );
      return;
    }

    setLoading(false);
    navigate(
      roles.includes('OWNER') || roles.includes('BUSINESS_UNIT_ADMIN')
        ? '/attendance/admin/dashboard'
        : '/attendance/today',
    );
  }

  return (
    <main className="att-login-page">
      <section className="att-login-intro" aria-labelledby="attendance-login-title">
        <div className="att-login-brand">
          <span className="att-login-logo"><CalendarCheck2 size={27} /></span>
          <span>Central Attendance</span>
        </div>
        <div>
          <p className="att-login-eyebrow">Satu akses · seluruh unit bisnis</p>
          <h1 id="attendance-login-title">Masuk, absen, lalu kembali bekerja.</h1>
          <p>
            PIN kios mempercepat akses kru. Akun pengelola tetap dilindungi
            identitas dan password terpisah.
          </p>
        </div>
        <div className="att-login-trust">
          <span><ShieldCheck size={17} /> Sesi Supabase terverifikasi</span>
          <span><KeyRound size={17} /> PIN disimpan sebagai hash</span>
        </div>
      </section>

      <section className="att-login-panel" aria-label="Form login Attendance">
        <div className="att-login-card">
          <div className="att-login-mobile-brand">
            <span className="att-login-logo"><CalendarCheck2 size={24} /></span>
            <div><strong>Central Attendance</strong><small>Secure workspace</small></div>
          </div>

          <div className="att-login-heading">
            <span className="att-login-mode-icon">
              {mode === 'pin' ? <KeyRound size={20} /> : <UserRound size={20} />}
            </span>
            <div>
              <h2>{mode === 'pin' ? 'PIN kru' : 'Akun pengelola'}</h2>
              <p>
                {mode === 'pin'
                  ? 'Untuk absen cepat di perangkat pribadi atau kios.'
                  : 'Untuk owner dan admin dengan akses pengelolaan.'}
              </p>
            </div>
          </div>

          <div className="att-login-segment" role="tablist" aria-label="Metode login">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'pin'}
              className={mode === 'pin' ? 'is-active' : ''}
              onClick={() => switchMode('pin')}
            >
              PIN Kru
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'account'}
              className={mode === 'account' ? 'is-active' : ''}
              onClick={() => switchMode('account')}
            >
              Admin / Owner
            </button>
          </div>

          {errorMsg && <div className="att-login-error" role="alert">{errorMsg}</div>}

          {mode === 'pin' ? (
            <form onSubmit={handlePinLogin} className="att-login-form">
              <label htmlFor="attendance-pin">PIN 6 digit</label>
              <input
                id="attendance-pin"
                className="att-pin-input"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="••••••"
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFocus
              />
              <p className="att-login-hint">
                PIN owner/admin tidak diterima di mode ini. Lima percobaan gagal
                akan mengunci perangkat sementara.
              </p>
              <button className="att-login-submit" type="submit" disabled={loading || pin.length !== 6}>
                {loading ? <><Loader2 className="att-spin" size={18} /> Memverifikasi…</> : 'Masuk untuk Absen'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAccountLogin} className="att-login-form">
              <label htmlFor="attendance-identity">Nomor pegawai atau email</label>
              <input
                id="attendance-identity"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username"
                placeholder="Nomor pegawai atau email"
                value={identity}
                onChange={(event) => setIdentity(event.target.value)}
                autoFocus
              />

              <label htmlFor="attendance-password">Password</label>
              <div className="att-login-password">
                <input
                  id="attendance-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Masukkan password akun"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button className="att-login-submit" type="submit" disabled={loading}>
                {loading ? <><Loader2 className="att-spin" size={18} /> Memverifikasi…</> : 'Masuk ke Dashboard'}
              </button>
            </form>
          )}

          <p className="att-login-footer">Bakso Ujo · GG Supply · GUDSKUY</p>
        </div>
      </section>
    </main>
  );
}
