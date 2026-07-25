import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthProvider';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export const AuthGuard: React.FC = () => {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-200">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-sm font-medium">Memverifikasi sesi pengguna...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Profil inactive
  if (profile && !profile.is_active) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Akun Belum Aktif</h2>
          <p className="text-slate-400 text-sm mb-6">
            Akun Anda (<strong className="text-slate-200">{profile.email}</strong>) saat ini belum diaktifkan oleh Owner. Silakan hubungi Owner untuk meminta aktivasi profil.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl text-sm transition"
          >
            Cek Ulang Status Aktivasi
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
