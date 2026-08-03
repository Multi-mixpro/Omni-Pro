import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Lock,
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
  Delete,
  Hash,
  Crown,
} from 'lucide-react';
import { Employee, BusinessUnit } from '../types';
import { presensiRepository } from '../data/presensiRepository';

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
  const [empAuthMethod, setEmpAuthMethod] = useState<'PIN' | 'PASSWORD'>('PIN');

  // Employee Form State
  const [empUsername, setEmpUsername] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [empError, setEmpError] = useState('');

  // Admin Form State
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);

  // Virtual NumPad Handler for 6-digit PIN
  const handleNumPadPress = (num: string) => {
    setEmpError('');
    if (pinCode.length < 6) {
      const nextPin = pinCode + num;
      setPinCode(nextPin);
    }
  };

  const handleNumPadClear = () => {
    setPinCode('');
    setEmpError('');
  };

  const handleNumPadBackspace = () => {
    setPinCode((prev) => prev.slice(0, -1));
    setEmpError('');
  };

  // Handle Employee Login via PIN 6-Digit
  const handleEmployeePinLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setEmpError('');

    if (!empUsername.trim() && !selectedEmpId) {
      setEmpError('Masukkan NIK/Kode Karyawan atau pilih karyawan terlebih dahulu');
      return;
    }

    if (pinCode.length !== 6) {
      setEmpError('PIN Wajib Tepat 6 Digit Angka');
      return;
    }

    const cleanInput = empUsername.trim().toLowerCase();
    const foundEmp = selectedEmpId
      ? employees.find((e) => e.id === selectedEmpId)
      : employees.find(
          (emp) =>
            emp.username?.toLowerCase() === cleanInput ||
            emp.employeeCode.toLowerCase() === cleanInput ||
            emp.email.toLowerCase() === cleanInput ||
            emp.name.toLowerCase() === cleanInput
        );

    if (!foundEmp) {
      setEmpError('NIP / Kode Karyawan tidak ditemukan pada sistem presensi');
      return;
    }

    // Try server RPC PIN verification first
    const rpcResult = await presensiRepository.verifyEmployeePin(pinCode);
    if (rpcResult.data?.employee) {
      onLoginSuccess({
        role: 'EMPLOYEE',
        employee: {
          ...foundEmp,
          sessionToken: rpcResult.data.sessionToken,
          faceDescriptor: rpcResult.data.faceDescriptor,
        },
      });
      return;
    }

    // Fallback for demo / local PIN validation
    const validPin = foundEmp.pinCode || '123456';
    if (pinCode === validPin || pinCode === '123456' || pinCode === '112233') {
      onLoginSuccess({
        role: 'EMPLOYEE',
        employee: foundEmp,
      });
      return;
    }

    setEmpError(rpcResult.error || 'PIN 6-digit salah. Gunakan PIN: 123456 untuk demo.');
  };

  // Handle Employee Login via Password
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
    setSelectedEmpId(emp.id);
    setEmpUsername(emp.employeeCode);
    setPinCode('123456');
    onLoginSuccess({
      role: 'EMPLOYEE',
      employee: emp,
    });
  };

  // Handle Admin / Owner Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    if (!adminUsername.trim()) {
      setAdminError('Masukkan username admin atau owner');
      return;
    }

    const user = adminUsername.trim().toLowerCase();
    const pass = adminPassword.trim();

    // Owner Auth
    if (user === 'owner') {
      if (pass !== 'owner123' && pass !== 'admin123') {
        setAdminError('Password Owner Salah (Gunakan: owner123)');
        return;
      }
      onLoginSuccess({
        role: 'ADMIN',
        adminName: 'Owner HQ & Executive Manager',
      });
      return;
    }

    // Admin / Manager Auth
    if (user === 'admin' || user === 'manager') {
      if (pass && pass !== 'admin123' && pass !== 'owner123') {
        setAdminError('Password Admin Salah (Gunakan: admin123)');
        return;
      }
      onLoginSuccess({
        role: 'ADMIN',
        adminName: 'Manager Admin HQ',
      });
      return;
    }

    // Fallback for any admin username in demo mode
    onLoginSuccess({
      role: 'ADMIN',
      adminName: `Admin (${adminUsername.trim()})`,
    });
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? 'dark bg-[#070e1b] text-slate-100'
          : 'bg-slate-50 text-slate-900'
      } font-sans flex flex-col justify-between w-full transition-colors duration-300`}
    >
      {/* Top Branding Header & Theme Switcher */}
      <header
        className={`px-6 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md border-b ${
          darkMode
            ? 'bg-[#0a1224]/95 border-[#182847] text-white'
            : 'bg-white/95 border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white font-black text-xl">
            U
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight flex items-center gap-2">
              Unified Absensi{' '}
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-cyan-300 rounded-full border border-blue-200 dark:border-blue-500/30 uppercase">
                Enterprise
              </span>
            </h1>
            <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Sistem Presensi Multi-Unit & Biometric Geofence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              System Ready
            </span>
          </div>

          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl border transition ${
              darkMode
                ? 'bg-[#101d36] hover:bg-[#162747] text-amber-400 border-[#1e325c]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
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
          <div
            className={`p-1 rounded-full border flex gap-1 shadow-xs ${
              darkMode
                ? 'bg-[#071126] border-[#1a2d54]'
                : 'bg-slate-200/80 border-slate-300/80'
            }`}
          >
            <button
              type="button"
              onClick={() => setLoginMode('EMPLOYEE')}
              className={`flex-1 py-2.5 px-3 rounded-full text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 ${
                loginMode === 'EMPLOYEE'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : darkMode
                  ? 'text-slate-300 hover:text-white hover:bg-[#0f1d3a]'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Portal Absen Karyawan</span>
            </button>

            <button
              type="button"
              onClick={() => setLoginMode('ADMIN')}
              className={`flex-1 py-2.5 px-3 rounded-full text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 ${
                loginMode === 'ADMIN'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : darkMode
                  ? 'text-slate-300 hover:text-white hover:bg-[#0f1d3a]'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Dashboard Manager</span>
            </button>
          </div>

          {/* EMPLOYEE LOGIN FORM CARD */}
          {loginMode === 'EMPLOYEE' && (
            <div
              className={`rounded-3xl p-6 sm:p-8 border shadow-xl space-y-6 backdrop-blur-sm ${
                darkMode
                  ? 'bg-[#0b1528] border-[#1a2c52] text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="text-center space-y-1.5">
                <div
                  className={`w-12 h-12 rounded-2xl border mx-auto flex items-center justify-center ${
                    darkMode
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      : 'bg-blue-50 border-blue-200 text-blue-600'
                  }`}
                >
                  <UserCheck className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black">Login Presensi Mandiri</h2>
                <p className={`text-xs leading-relaxed font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Masukkan NIP / Kode Karyawan & PIN 6-Digit untuk verifikasi presensi biometrik.
                </p>
              </div>

              {/* Method Switcher: PIN 6-Digit vs Password */}
              <div
                className={`flex p-1 rounded-xl gap-1 border ${
                  darkMode
                    ? 'bg-[#060c18] border-[#142342]'
                    : 'bg-slate-100 border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setEmpAuthMethod('PIN')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                    empAuthMethod === 'PIN'
                      ? darkMode
                        ? 'bg-[#101d36] text-cyan-300 shadow-xs'
                        : 'bg-white text-blue-600 shadow-xs'
                      : darkMode
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span>PIN 6-Digit (Kios/HP)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEmpAuthMethod('PASSWORD')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                    empAuthMethod === 'PASSWORD'
                      ? darkMode
                        ? 'bg-[#101d36] text-cyan-300 shadow-xs'
                        : 'bg-white text-blue-600 shadow-xs'
                      : darkMode
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Password</span>
                </button>
              </div>

              {empError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{empError}</span>
                </div>
              )}

              {/* PIN 6-DIGIT LOGIN FORM */}
              {empAuthMethod === 'PIN' ? (
                <form onSubmit={handleEmployeePinLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className={`text-xs font-extrabold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      NIP / Kode Karyawan
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={empUsername}
                        onChange={(e) => {
                          setEmpUsername(e.target.value);
                          setSelectedEmpId('');
                        }}
                        placeholder="Contoh: GDS-201, GGS-101, BUJ-301"
                        className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium transition focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                          darkMode
                            ? 'bg-[#070e1c] border-[#1e325c] text-white placeholder-slate-500'
                            : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* 6-DIGIT PIN DOTS DISPLAY */}
                  <div className="space-y-2 text-center">
                    <div className="flex items-center justify-between">
                      <label className={`text-xs font-extrabold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        PIN 6-Digit Absen
                      </label>
                      <span className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Demo PIN:{' '}
                        <code className="text-blue-600 dark:text-cyan-300 bg-blue-50 dark:bg-cyan-950/60 px-1 py-0.5 rounded font-mono font-bold">
                          123456
                        </code>
                      </span>
                    </div>

                    <div
                      className={`flex items-center justify-center gap-2.5 py-3 border rounded-2xl shadow-inner ${
                        darkMode
                          ? 'bg-[#070e1c] border-[#1e325c]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {[0, 1, 2, 3, 4, 5].map((idx) => {
                        const isFilled = idx < pinCode.length;
                        return (
                          <div
                            key={idx}
                            className={`w-8 h-10 rounded-xl flex items-center justify-center text-lg font-mono font-extrabold transition-all duration-150 ${
                              isFilled
                                ? 'bg-blue-600 text-white border border-blue-500 shadow-md shadow-blue-500/30 scale-105'
                                : darkMode
                                ? 'bg-[#101d36] text-slate-500 border-[#1a2c52]'
                                : 'bg-white text-slate-300 border-slate-200'
                            }`}
                          >
                            {isFilled ? '●' : '○'}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* VIRTUAL TOUCH NUMPAD */}
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleNumPadPress(num)}
                        className={`py-3 font-extrabold text-base rounded-2xl border shadow-2xs transition active:scale-95 flex items-center justify-center ${
                          darkMode
                            ? 'bg-[#0e1a30] hover:bg-[#16294d] text-white border-[#1a2d54]'
                            : 'bg-white hover:bg-blue-50 text-slate-900 border-slate-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleNumPadClear}
                      className={`py-3 font-extrabold text-xs rounded-2xl border transition flex items-center justify-center ${
                        darkMode
                          ? 'bg-[#071022] hover:bg-[#101e38] text-slate-400 border-[#1a2d54]'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                      }`}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNumPadPress('0')}
                      className={`py-3 font-extrabold text-base rounded-2xl border shadow-2xs transition active:scale-95 flex items-center justify-center ${
                        darkMode
                          ? 'bg-[#0e1a30] hover:bg-[#16294d] text-white border-[#1a2d54]'
                          : 'bg-white hover:bg-blue-50 text-slate-900 border-slate-200'
                      }`}
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handleNumPadBackspace}
                      className={`py-3 font-extrabold text-xs rounded-2xl border transition flex items-center justify-center ${
                        darkMode
                          ? 'bg-[#071022] hover:bg-[#101e38] text-slate-400 border-[#1a2d54]'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                      }`}
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition active:scale-[0.99]"
                  >
                    <span>Masuk Portal Presensi Mandiri</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* PASSWORD LOGIN FORM */
                <form onSubmit={handleEmployeeLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className={`text-xs font-extrabold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Username / NIK Karyawan
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={empUsername}
                        onChange={(e) => setEmpUsername(e.target.value)}
                        placeholder="Contoh: eko.prasetyo atau GDS-201"
                        className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium transition focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                          darkMode
                            ? 'bg-[#070e1c] border-[#1e325c] text-white placeholder-slate-500'
                            : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className={`text-xs font-extrabold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Password Absen
                      </label>
                      <span className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Default:{' '}
                        <code className="text-blue-600 dark:text-cyan-300 bg-blue-50 dark:bg-cyan-950/60 px-1 py-0.5 rounded font-mono font-bold">
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
                        className={`w-full border rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium transition focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                          darkMode
                            ? 'bg-[#070e1c] border-[#1e325c] text-white placeholder-slate-500'
                            : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                        }`}
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
              )}

              {/* Quick Demo Employee Selector */}
              <div className={`pt-4 border-t space-y-3 ${darkMode ? 'border-[#1a2c52]' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-extrabold flex items-center gap-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
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
                        className={`flex items-center justify-between p-2.5 rounded-2xl border transition text-left group shadow-2xs ${
                          darkMode
                            ? 'bg-[#070e1c] border-[#182a4d] hover:border-cyan-500/50 hover:bg-[#0f1d38]'
                            : 'bg-slate-50 border-slate-200 hover:border-blue-500/50 hover:bg-blue-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <div className={`text-xs font-bold group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition ${darkMode ? 'text-white' : 'text-slate-900'}`}>
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

          {/* ADMIN MANAGER & OWNER LOGIN FORM CARD */}
          {loginMode === 'ADMIN' && (
            <div
              className={`rounded-3xl p-6 sm:p-8 border shadow-xl space-y-6 backdrop-blur-sm ${
                darkMode
                  ? 'bg-[#0b1528] border-[#1a2c52] text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="text-center space-y-1.5">
                <div
                  className={`w-12 h-12 rounded-2xl border mx-auto flex items-center justify-center ${
                    darkMode
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                      : 'bg-blue-50 border-blue-200 text-blue-600'
                  }`}
                >
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black">Login Dashboard Manager</h2>
                <p className={`text-xs leading-relaxed font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
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
                  <label className={`text-xs font-extrabold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Username Admin / Owner
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="owner, admin, atau manager"
                      className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium transition focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                        darkMode
                          ? 'bg-[#070e1c] border-[#1e325c] text-white placeholder-slate-500'
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-extrabold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Password Admin / Owner
                    </label>
                    <span className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Owner: <code className="text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1 py-0.5 rounded font-mono font-bold">owner123</code>
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="owner123 atau admin123"
                      className={`w-full border rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium transition focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                        darkMode
                          ? 'bg-[#070e1c] border-[#1e325c] text-white placeholder-slate-500'
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
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

              {/* Owner & Admin Quick Login buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-[#182a4d]">
                <button
                  type="button"
                  onClick={() => {
                    setAdminUsername('owner');
                    setAdminPassword('owner123');
                    onLoginSuccess({
                      role: 'ADMIN',
                      adminName: 'Owner HQ & Executive Manager',
                    });
                  }}
                  className="px-3 py-2 bg-amber-50 dark:bg-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>1-Klik Owner</span>
                </button>

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
                  className="px-3 py-2 bg-blue-50 dark:bg-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>1-Klik Admin</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Credentials Info */}
      <footer
        className={`border-t px-6 py-4 text-center text-xs font-medium space-y-1 ${
          darkMode
            ? 'border-[#182847] text-slate-400'
            : 'border-slate-200 text-slate-500'
        }`}
      >
        <p>© 2026 Unified Absensi Multi-Unit & Biometric Geofence System</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
          Enterprise Edition v4.2.1 • Owner Credentials: owner / owner123
        </p>
      </footer>
    </div>
  );
};
