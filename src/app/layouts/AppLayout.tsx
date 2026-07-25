import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthProvider';
import {
  LayoutDashboard,
  Rocket,
  Eye,
  ShoppingBag,
  Truck,
  Calculator,
  Scissors,
  Ruler,
  FileSpreadsheet,
  Settings,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { currentUser, users, isOwner, switchUser, signOut } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between p-4 shrink-0 font-sans">
        <div>
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 px-2 py-3 mb-4 border-b border-slate-800/80">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-orange-500/20">
              GG
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">GG Workspace</h1>
              <p className="text-[10px] text-slate-400 font-medium">Product Launch OS</p>
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="space-y-4">
            {/* Section 1: Workspace */}
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Workspace
              </p>
              <nav className="space-y-0.5">
                <NavLink
                  to="/app/dashboard"
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`
                  }
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink>

                <NavLink
                  to="/app/launch/work-orders"
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`
                  }
                >
                  <Rocket className="w-4 h-4" />
                  <span>Perintah Kerja</span>
                </NavLink>

                {isOwner && (
                  <NavLink
                    to="/app/monitor"
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`
                    }
                  >
                    <Eye className="w-4 h-4" />
                    <span>Kelola & Pantau</span>
                  </NavLink>
                )}
              </nav>
            </div>

            {/* Section 2: Produksi */}
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Produksi
              </p>
              <nav className="space-y-0.5">
                <NavLink
                  to="/app/brands"
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`
                  }
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>GG Supply & GUDSKUY</span>
                </NavLink>

                <NavLink
                  to="/app/suppliers"
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`
                  }
                >
                  <Truck className="w-4 h-4" />
                  <span>Supplier & Bahan</span>
                </NavLink>

                <NavLink
                  to="/app/hpp-sheet"
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`
                  }
                >
                  <Calculator className="w-4 h-4" />
                  <span>Lembar HPP</span>
                </NavLink>

                <NavLink
                  to="/app/sampling"
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`
                  }
                >
                  <Scissors className="w-4 h-4" />
                  <span>Sampling</span>
                </NavLink>

                <NavLink
                  to="/app/size-chart"
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`
                  }
                >
                  <Ruler className="w-4 h-4" />
                  <span>Size Chart</span>
                </NavLink>
              </nav>
            </div>

            {/* Section 3: Administrasi */}
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Administrasi
              </p>
              <nav className="space-y-0.5">
                <NavLink
                  to="/app/reports"
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`
                  }
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Laporan & Evaluasi</span>
                </NavLink>

                {isOwner && (
                  <NavLink
                    to="/app/access-settings"
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`
                    }
                  >
                    <Settings className="w-4 h-4" />
                    <span>Pengaturan Akses</span>
                  </NavLink>
                )}
              </nav>
            </div>
          </div>
        </div>

        {/* Side Footer Progress Indicator */}
        <div className="border-t border-slate-800/80 pt-4 space-y-3">
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Kesiapan Launching
            </p>
            <div className="flex justify-between items-center text-xs font-bold text-slate-200">
              <span>65%</span>
              <span className="text-[10px] text-slate-400 font-normal">2 Brand Artikel</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-amber-400 h-full w-[65%]" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-slate-900 border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>GG Workspace</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-200 font-semibold">Operational Center</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 transition border border-slate-700/50"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Simulation User Switcher */}
            <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700/60 rounded-xl p-1 px-2">
              <div className="w-6 h-6 rounded-lg bg-purple-600 font-bold text-white text-[10px] flex items-center justify-center">
                {currentUser.ini}
              </div>
              <select
                value={currentUser.id}
                onChange={(e) => switchUser(e.target.value)}
                className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-900 text-slate-200">
                    {u.name} — {u.role}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={signOut}
              title="Keluar Sesi"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition border border-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Workspace Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
