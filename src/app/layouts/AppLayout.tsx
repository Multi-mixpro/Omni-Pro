import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthProvider';
import {
  Layers,
  LayoutDashboard,
  Rocket,
  ShoppingBag,
  Users,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { profile, roles, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="flex items-center space-x-3 px-2 py-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">GG Product OS</h1>
              <p className="text-[10px] text-slate-400">Standalone System</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <NavLink
              to="/app/dashboard"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/app/launch/work-orders"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <Rocket className="w-4 h-4" />
              <span>Perintah Kerja</span>
            </NavLink>

            <NavLink
              to="/app/catalog/products"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Katalog Artikel</span>
            </NavLink>

            {roles.includes('owner') && (
              <NavLink
                to="/app/settings/users"
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`
                }
              >
                <Users className="w-4 h-4" />
                <span>Pengaturan Tim</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center space-x-3 truncate">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{profile?.full_name || 'Pengguna'}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{roles[0] || 'Member'}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              title="Keluar Aplikasi"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-slate-950/60 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>GG Product OS</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-200 font-medium">Workspace</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Vercel & Supabase Connected
            </span>
          </div>
        </header>

        {/* Dynamic Page View */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
