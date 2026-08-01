/**
 * Product Launch OS 3.0 - Sidebar Navigation (Desktop)
 */

import React from 'react';
import {
  LayoutDashboard,
  Kanban,
  Rocket,
  CheckSquare,
  FileCheck2,
  Calendar,
  Database,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  pendingApprovalsCount: number;
  blockedTasksCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  pendingApprovalsCount,
  blockedTasksCount,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, tint: 'text-sky-600', activeBg: 'bg-sky-50', activeBorder: 'border-sky-200' },
    { id: 'pipeline', label: 'Article Pipeline', icon: Kanban, tint: 'text-violet-600', activeBg: 'bg-violet-50', activeBorder: 'border-violet-200' },
    { id: 'implementation', label: 'Implementasi Artikel', icon: Rocket, tint: 'text-orange-600', activeBg: 'bg-orange-50', activeBorder: 'border-orange-200' },
    { id: 'tasks', label: 'Tasks & Updates', icon: CheckSquare, tint: 'text-rose-600', activeBg: 'bg-rose-50', activeBorder: 'border-rose-200', badge: blockedTasksCount > 0 ? `${blockedTasksCount}` : undefined, badgeColor: 'bg-[#C83B3B]' },
    { id: 'approvals', label: 'Approvals Gate', icon: FileCheck2, tint: 'text-amber-600', activeBg: 'bg-amber-50', activeBorder: 'border-amber-200', badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : undefined, badgeColor: 'bg-[#B86A05]' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, tint: 'text-indigo-600', activeBg: 'bg-indigo-50', activeBorder: 'border-indigo-200' },
    { id: 'master', label: 'Master Data', icon: Database, tint: 'text-teal-600', activeBg: 'bg-teal-50', activeBorder: 'border-teal-200' },
    { id: 'reports', label: 'Reports & KPI', icon: BarChart3, tint: 'text-emerald-600', activeBg: 'bg-emerald-50', activeBorder: 'border-emerald-200' },
  ];

  return (
    <aside
      className={`paten-sidebar hidden md:flex flex-col fixed z-20 transition-all duration-200 ${
        isCollapsed ? 'w-14' : 'w-52'
      }`}
    >
      {/* Menu List */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative ${
                isActive
                  ? `${item.activeBg} ${item.tint} border ${item.activeBorder} font-bold shadow-2xs`
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? item.tint : 'text-slate-400 group-hover:text-slate-600'}`} />

              {!isCollapsed && (
                <span className="truncate flex-1 text-left tracking-tight">{item.label}</span>
              )}

              {/* Badge */}
              {item.badge && (
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full text-white ${
                    item.badgeColor || 'bg-[#087E79]'
                  } ${isCollapsed ? 'absolute top-1 right-1' : ''}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Halaman tetap mengelola pembatasan hak akses; menu perlu selalu terlihat. */}
      <div className="px-2 pb-1">
        <a
          href="/launch/app/settings"
          title={isCollapsed ? 'Pengaturan & Hak Akses' : undefined}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent transition-all group"
        >
          <Settings className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-600" />
          {!isCollapsed && (
            <span className="truncate flex-1 text-left tracking-tight">Pengaturan & Akses</span>
          )}
        </a>
      </div>

      {/* Footer Collapse Toggle */}
      <div className="p-2 border-t border-slate-200">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
