import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Smartphone,
  TrendingUp,
  ShieldCheck,
  Webhook,
  Building2,
  Bell,
  Sun,
  Moon,
  Clock,
  Lock,
  LogOut,
} from 'lucide-react';

interface TopbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  is2FAEnabled: boolean;
  onLogout?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  unreadCount,
  onOpenNotifications,
  is2FAEnabled,
  onLogout,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }) + ' WIB'
      );
      setDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Monitor', icon: LayoutDashboard },
    { id: 'karyawan', label: 'Kelola Karyawan', icon: Users, badge: '44 Team' },
    { id: 'shifts', label: 'Kelola Shift', icon: CalendarDays },
    { id: 'mobile_presensi', label: 'Presensi Mobile', icon: Smartphone, badge: 'Face ID' },
    { id: 'analytics', label: 'Analitik Performa', icon: TrendingUp },
    { id: 'security', label: 'Security & 2FA', icon: ShieldCheck },
    { id: 'payroll_api', label: 'Payroll API', icon: Webhook },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0c162c]/90 backdrop-blur-md border-b border-slate-200/90 dark:border-[#1a2847] transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between h-16 border-b border-slate-200/60 dark:border-[#1a2847]/70 py-2 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-blue-600 dark:bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                  Unified Absensi
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                  Enterprise
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Presensi Multi-Unit & Biometric Geofencing
              </p>
            </div>
          </div>

          {/* Status Indicators & Action Tools */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live Clock */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100/90 dark:bg-[#0f1a30] border border-slate-200/80 dark:border-[#1a2847] text-xs">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 animate-pulse" />
              <span className="font-bold text-slate-800 dark:text-slate-200">{timeStr}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">{dateStr}</span>
            </div>

            {/* 2FA Status */}
            <button
              onClick={() => setActiveTab('security')}
              title="Status Autentikasi Dua Faktor (2FA)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all ${
                is2FAEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">2FA {is2FAEnabled ? 'Active' : 'Off'}</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0f1a30] transition-colors"
              aria-label="Notifikasi Real-time"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-[#0c162c] animate-pulse" />
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0f1a30] transition-colors border border-transparent hover:border-slate-200 dark:hover:border-[#1a2847]"
              title={darkMode ? 'Switch to Light Theme (Eye-safe Periwinkle)' : 'Switch to Dark Theme (Midnight Navy)'}
            >
              {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />}
            </button>

            {/* User Profile Avatar & Logout Button */}
            <div className="flex items-center gap-2 border-l border-slate-200 dark:border-[#1a2847] pl-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Manager Admin</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">HQ Operator</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-[#0f1a30] rounded-2xl flex items-center justify-center font-extrabold text-xs text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-[#1a2847]">
                ADM
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800/80 transition-colors ml-1"
                  title="Keluar dari Dashboard Manager"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Segmented Pill Navigation Tab Links (Template 129 Style) */}
        <div className="py-2.5 overflow-x-auto no-scrollbar">
          <nav className="inline-flex items-center gap-1 p-1 rounded-full bg-slate-100/80 dark:bg-[#071126] border border-slate-200/80 dark:border-[#1a2d54]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#0f1d3a]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.2 rounded-full text-[9px] font-extrabold uppercase ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-cyan-400 border border-blue-200/60 dark:border-blue-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

