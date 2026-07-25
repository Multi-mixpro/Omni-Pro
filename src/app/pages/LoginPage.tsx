import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthProvider';
import { Layers, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { bypassAuthAsOwner } = useAuth();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Jalur login Username + PIN
      // Sementara jalur email di-bypass langsung menuju Dashboard
      bypassAuthAsOwner();
      navigate('/app/dashboard');
    } catch (err: any) {
      setError('Username atau PIN tidak sesuai.');
    } finally {
      setLoading(false);
    }
  };

  const handleBypass = () => {
    bypassAuthAsOwner();
    navigate('/app/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 selection:bg-blue-500 selection:text-white">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Logo */}
        <div className="text-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">GG Product OS</h1>
          <p className="text-slate-400 text-sm mt-1">Masuk dengan Username & PIN 4-6 Digit</p>
        </div>

        {/* Quick Access / Bypass Notice */}
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs text-blue-300">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Jalur autentikasi email dinonaktifkan sementara.</span>
          </div>
          <button
            onClick={handleBypass}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition"
          >
            Masuk Langsung
          </button>
        </div>

        {/* Username + PIN Login Form Card */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start space-x-3 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Username Pengguna
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="misal: owner / dodi / yadi"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                PIN Akses (4-6 Digit)
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono tracking-widest text-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <span>Masuk Aplikasi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
