/**
 * Login terpadu Presensi — satu pintu untuk karyawan dan pengelola.
 *
 * Menggantikan LoginPage lama yang memiliki dua masalah serius:
 *
 *  1. Tidak benar-benar mengautentikasi. PIN dibandingkan di browser dan
 *     '123456' serta '112233' selalu diterima untuk karyawan mana pun.
 *     Jalur admin bahkan punya fallback tanpa password: mengetik username apa
 *     pun langsung memberi akses Admin penuh.
 *  2. Pengguna harus memilih dulu mode "Karyawan" atau "Admin".
 *
 * Di sini verifikasi dilakukan di server, dan PERAN DITENTUKAN SISTEM:
 *  - Isi PIN     -> diverifikasi fungsi database, masuk sebagai karyawan.
 *  - Isi email   -> diverifikasi Supabase Auth, peran dibaca dari keanggotaan.
 * Pengguna tidak lagi memilih sendiri mau masuk sebagai apa.
 */

import React, { useState } from 'react';
import { Fingerprint, Loader2, LockKeyhole, Moon, Sun } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { presensiRepository } from '../data/presensiRepository';
import type { BusinessUnit, Employee } from '../types';

interface UnifiedLoginPageProps {
  businessUnits: BusinessUnit[];
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onLoginSuccess: (user: {
    role: 'ADMIN' | 'EMPLOYEE';
    employee?: Employee;
    adminName?: string;
  }) => void;
}

/** Identitas berupa angka saja dianggap PIN karyawan. */
function looksLikePin(value: string) {
  return /^\d{4,12}$/.test(value.trim());
}

export const UnifiedLoginPage: React.FC<UnifiedLoginPageProps> = ({
  businessUnits,
  darkMode,
  setDarkMode,
  onLoginSuccess,
}) => {
  const [identity, setIdentity] = useState('');
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isPinMode = looksLikePin(identity) && secret.trim() === '';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    const id = identity.trim();
    if (!id) {
      setError('Masukkan PIN karyawan atau email pengelola.');
      return;
    }

    setLoading(true);

    try {
      // Jalur karyawan: PIN saja, diverifikasi di server.
      if (looksLikePin(id) && !secret.trim()) {
        const result = await presensiRepository.verifyEmployeePin(id);
        if (!result.data) {
          setError(result.error ?? 'PIN tidak dikenali.');
          return;
        }
        onLoginSuccess({ role: 'EMPLOYEE', employee: result.data });
        return;
      }

      // Jalur pengelola: email + password lewat Supabase Auth.
      if (!secret) {
        setError('Masukkan password pengelola, atau isi PIN saja bila Anda karyawan.');
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: id,
        password: secret,
      });

      if (authError || !data.user) {
        setError(
          authError?.message === 'Invalid login credentials'
            ? 'Email atau password salah.'
            : authError?.message ?? 'Gagal masuk.',
        );
        return;
      }

      // Peran dibaca dari keanggotaan Presensi, bukan dipilih pengguna.
      const role = await presensiRepository.myManagerRole();
      if (!role.data) {
        await supabase.auth.signOut();
        setError(
          'Akun ini tidak terdaftar sebagai pengelola Presensi. '
          + 'Akun Product Launch OS memakai kredensial terpisah.',
        );
        return;
      }

      onLoginSuccess({
        role: 'ADMIN',
        adminName: data.user.email ?? 'Pengelola Presensi',
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal masuk.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-5 transition-colors ${
        darkMode ? 'bg-[#070e1b] text-slate-100' : 'bg-[#F6F7F9] text-slate-900'
      }`}
    >
      <div
        className={`w-full max-w-md rounded-3xl border p-8 shadow-sm ${
          darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
              <Fingerprint className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">Presensi Multi-Unit</h1>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Satu pintu untuk kru dan pengelola
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? 'Mode terang' : 'Mode gelap'}
            className={`rounded-xl p-2 ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="block">
            <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              PIN karyawan atau email pengelola
            </span>
            <input
              type="text"
              inputMode="text"
              autoCapitalize="none"
              autoCorrect="off"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="Contoh: 101112 atau nama@perusahaan.com"
              className={`mt-1.5 w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition ${
                darkMode
                  ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-emerald-500'
                  : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500 focus:bg-white'
              }`}
            />
          </label>

          {/* Password hanya relevan untuk pengelola; kru cukup PIN. */}
          <label className={`block transition-opacity ${isPinMode ? 'opacity-50' : 'opacity-100'}`}>
            <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Password pengelola
              <span className={`ml-1 font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                — kosongkan bila masuk dengan PIN
              </span>
            </span>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="••••••••"
              className={`mt-1.5 w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition ${
                darkMode
                  ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-emerald-500'
                  : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500 focus:bg-white'
              }`}
            />
          </label>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
            {loading ? 'Memverifikasi…' : isPinMode ? 'Masuk dengan PIN' : 'Masuk'}
          </button>

          <p className={`text-center text-[11px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Sistem menentukan sendiri Anda masuk sebagai kru atau pengelola.
          </p>
        </form>
      </div>

      {businessUnits.length > 0 && (
        <p className={`mt-6 text-[11px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          {businessUnits.map((u) => u.name).join(' · ')}
        </p>
      )}
    </div>
  );
};
