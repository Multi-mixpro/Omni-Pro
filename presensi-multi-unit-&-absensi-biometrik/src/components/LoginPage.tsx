import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Building2,
  ArrowRight,
  LogIn,
  KeyRound,
  Sparkles,
  Smartphone,
  Eye,
  EyeOff,
  AlertCircle,
  Sun,
  Moon,
  CheckCircle2,
} from 'lucide-react';
import { Employee, BusinessUnit } from '../types';

interface LoginPageProps {
  employees: Employee[];
  businessUnits: BusinessUnit[];
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onLoginSuccess: (user: {
    role: 'ADMIN' | 'EMPLOYEE';
    employee?: Employee;
    adminName?: string;
  }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  employees,
  businessUnits,
  darkMode,
  setDarkMode,
  onLoginSuccess,
}) => {
  const [loginMode, setLoginMode] = useState<'EMPLOYEE' | 'ADMIN'>('EMPLOYEE');

  // Employee Form State
  const [empUsername, setEmpUsername] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empError, setEmpError] = useState('');

  // Admin Form State
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);

  // Handle Employee Login
  const handleEmployeeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setEmpError('');

    if (!empUsername.trim()) {
      setEmpError('Masukkan Username atau NIK Karyawan');
      return;
    }

    const cleanInput = empUsername.trim().toLowerCase();
    const foundEmp = employees.find(
      (emp) =>
        emp.username?.toLowerCase() === cleanInput ||
        emp.employeeCode.toLowerCase() === cleanInput ||
        emp.email.toLowerCase() === cleanInput
    );

    if (!foundEmp) {
      setEmpError('Username / NIK Karyawan tidak ditemukan');
      return;
    }

    // Optional password verification
    if (empPassword.trim() && foundEmp.password) {
      if (empPassword.trim() !== foundEmp.password && empPassword.trim() !== 'absen123') {
        setEmpError('Password salah. Silakan coba lagi.');
        return;
      }
    }

    onLoginSuccess({
      role: 'EMPLOYEE',
      employee: foundEmp,
    });
  };

  // Quick select employee from demo list
  const handleQuickEmployeeLogin = (emp: Employee) => {
    onLoginSuccess({
      role: 'EMPLOYEE',
      employee: emp,
    });
  };

  // Handle Admin Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    if (!adminUsername.trim()) {
      setAdminError('Masukkan username admin');
      return;
    }

    // Default admin creds check or allow demo admin
    if (
      (adminUsername.trim().toLowerCase() === 'admin' ||
        adminUsername.trim().toLowerCase() === 'manager') &&
      adminPassword.trim() &&
      adminPassword.trim() !== 'admin123'
    ) {
      setAdminError('Password Admin Salah (Gunakan: admin123)');
      return;
    }

    onLoginSuccess({
      role: 'ADMIN',
      adminName: 'Manager Admin HQ',
    });
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? 'dark bg-[#070e1b] text-slate-100'
          : 'bg-slate-50 text-slate-800'
      } font-sans flex flex-col justify-between w-full transition-colors duration-300`}
    >
      {/* Top Branding Header & Theme Switcher */}
      <header className="bg-white/90 dark:bg-[#0a1224]/90 border-b border-slate-200/80 dark:border-[#182847] px-6 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white font-black text-xl">
            U
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Unified Absensi{' '}
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-cyan-300 rounded-full border border-blue-200 dark:border-blue-500/30 uppercase">
                Enterprise
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Sistem Presensi Multi-Unit & Biometric Geofence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">System Ready</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-[#101d36] hover:bg-slate-200 dark:hover:bg-[#162747] text-slate-700 dark:text-amber-400 transition border border-slate-200 dark:border-[#1e325c]"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 sm:py-12">
          <div className="w-full max-w-md space-y-6">
            {/* Segmented Pill Login Switcher */}
            <div className="p-1 rounded-full bg-slate-100 dark:bg-[#071126] border border-slate-200/90 dark:border-[#1a2d54] flex gap-1 shadow-xs">
              <button
                type="button"
                onClick={() => setLoginMode('EMPLOYEE')}
                className={`flex-1 py-2 px-3 rounded-full text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 ${
                  loginMode === 'EMPLOYEE'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#0f1d3a]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Portal Absen Karyawan</span>
              </button>

              <button
                type="button"
                onClick={() => setLoginMode('ADMIN')}
                className={`flex-1 py-2 px-3 rounded-full text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 ${
                  loginMode === 'ADMIN'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#0f1d3a]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Dashboard Manager</span>
              </button>
            </div>

            {/* EMPLOYEE LOGIN FORM CARD */}
            {loginMode === 'EMPLOYEE' && (
              <div className="bg-slate-50/80 dark:bg-[#0b1528]/90 border border-slate-200/90 dark:border-[#1a2c52] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-sm">
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/30 text-blue-600 dark:text-cyan-400 mx-auto flex items-center justify-center">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Login Absen Karyawan
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Masukkan Username atau NIK untuk membuka portal presensi mandiri (clock-in/out).
                  </p>
                </div>

                {empError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                    <span>{empError}</span>
                  </div>
                )}

                <form onSubmit={handleEmployeeLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      Username / NIK Karyawan
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={empUsername}
                        onChange={(e) => setEmpUsername(e.target.value)}
                        placeholder="Contoh: eko.prasetyo atau GDS-201"
                        className="w-full bg-white dark:bg-[#070e1c] border border-slate-200 dark:border-[#1e325c] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium transition shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        Password Absen
                      </label>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Default:{' '}
                        <code className="text-blue-700 dark:text-cyan-300 bg-blue-50 dark:bg-cyan-950/60 px-1 py-0.5 rounded font-mono font-bold">
                          absen123
                        </code>
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={empPassword}
                        onChange={(e) => setEmpPassword(e.target.value)}
                        placeholder="Masukkan password"
                        className="w-full bg-white dark:bg-[#070e1c] border border-slate-200 dark:border-[#1e325c] rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium transition shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition active:scale-[0.99]"
                  >
                    <span>Masuk Portal Absensi Mandiri</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Quick Demo Employee Selector */}
                <div className="pt-4 border-t border-slate-200 dark:border-[#1a2c52] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Demo Cepat Login Karyawan:
                    </span>
                    <span className="text-[10px] text-slate-400">Pilih 1-Klik</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                    {employees.map((emp) => {
                      const unit = businessUnits.find((u) => u.id === emp.unitId);
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => handleQuickEmployeeLogin(emp)}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-[#070e1c] border border-slate-200/90 dark:border-[#182a4d] hover:border-blue-500/50 dark:hover:border-cyan-500/50 hover:bg-blue-50/50 dark:hover:bg-[#0f1d38] transition text-left group shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={emp.avatar}
                              alt={emp.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition">
                                {emp.name}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">
                                  {emp.employeeCode}
                                </span>
                                <span>•</span>
                                <span>{emp.role}</span>
                              </div>
                            </div>
                          </div>

                          <span
                            className="px-2 py-0.5 rounded-full text-[9px] font-extrabold text-white"
                            style={{ backgroundColor: unit?.color || '#3b82f6' }}
                          >
                            {unit?.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN MANAGER LOGIN FORM CARD */}
            {loginMode === 'ADMIN' && (
              <div className="bg-slate-50/80 dark:bg-[#0b1528]/90 border border-slate-200/90 dark:border-[#1a2c52] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-sm">
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Login Dashboard Manager
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Akses konsol manajemen absensi, kontrol shift, analitik performa & Payroll API.
                  </p>
                </div>

                {adminError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                    <span>{adminError}</span>
                  </div>
                )}

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      Username Admin
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="admin atau manager"
                        className="w-full bg-white dark:bg-[#070e1c] border border-slate-200 dark:border-[#1e325c] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium transition shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        Password Admin
                      </label>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Default:{' '}
                        <code className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1 py-0.5 rounded font-mono font-bold">
                          admin123
                        </code>
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Masukkan password admin"
                        className="w-full bg-white dark:bg-[#070e1c] border border-slate-200 dark:border-[#1e325c] rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium transition shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition active:scale-[0.99]"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Masuk Dashboard Executive HQ</span>
                  </button>
                </form>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#070e1c] border border-slate-200/90 dark:border-[#182a4d] flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                      Quick Demo Login:
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminUsername('admin');
                      setAdminPassword('admin123');
                      onLoginSuccess({
                        role: 'ADMIN',
                        adminName: 'Manager Admin HQ',
                      });
                    }}
                    className="px-3 py-1 bg-blue-50 dark:bg-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40 rounded-xl text-xs font-bold transition"
                  >
                    1-Klik Access Admin
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Credentials Info */}
        <footer className="border-t border-slate-200/80 dark:border-[#182847] px-6 py-4 text-center text-slate-500 dark:text-slate-400 text-xs font-medium space-y-1">
          <p>© 2026 Unified Absensi Multi-Unit & Biometric Geofence System</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            Enterprise Edition v4.2.1 • GitHub, Vercel & Supabase Ready
          </p>
        </footer>
    </div>
  );
};

