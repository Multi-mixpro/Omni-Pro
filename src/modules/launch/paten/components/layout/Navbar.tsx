/**
 * Product Launch OS 3.0 - Top Navigation Bar
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Plus,
  Layers,
  CheckCircle2,
  ChevronDown,
  Command,
  LogOut,
  Users,
  Circle,
} from 'lucide-react';
import { BusinessUnit, ApprovalGate } from '../../types';
import { loadStoredBusinessUnits } from '../../services/businessUnits';
import { useTeamActivity, TeamMemberActivity } from '../../hooks/useTeamActivity';

interface NavbarProps {
  activeBusinessUnit: BusinessUnit;
  onSelectBusinessUnit: (bu: BusinessUnit) => void;
  onOpenQuickCreate: () => void;
  pendingApprovals: ApprovalGate[];
  onOpenGlobalSearch: () => void;
  onSelectTab: (tab: string) => void;
  onSignOut: () => void;
  activeTab: string;
  currentUser?: {
    id?: string;
    name: string;
    jobTitle?: string | null;
    avatarUrl?: string | null;
  };
  canCreate?: boolean;
  syncHealthy?: boolean;
}

function formatLastSeen(dateStr: string | null): string {
  if (!dateStr) return 'Belum pernah';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

const TeamMemberRow: React.FC<{ member: TeamMemberActivity; isMe: boolean }> = ({ member, isMe }) => (
  <div className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors ${isMe ? 'bg-[#DDF4F1]/40' : 'hover:bg-slate-50'}`}>
    <div className="relative flex-shrink-0">
      {member.avatar_url ? (
        <img src={member.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-mono font-bold text-[10px] border border-slate-200">
          {(member.full_name || 'U').slice(0, 1).toUpperCase()}
        </div>
      )}
      <Circle
        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${member.is_online ? 'text-emerald-500 fill-emerald-500' : 'text-slate-300 fill-slate-300'}`}
      />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-bold text-slate-900 truncate">
        {member.full_name}{isMe ? ' (Anda)' : ''}
      </p>
      <p className="text-[10px] text-slate-400 truncate">
        {member.job_title || member.username}
      </p>
    </div>
    <div className="flex-shrink-0 text-right">
      {member.is_online ? (
        <span className="text-[10px] font-bold text-emerald-600">Online</span>
      ) : (
        <span className="text-[10px] text-slate-400">{formatLastSeen(member.last_seen_at)}</span>
      )}
    </div>
  </div>
);

export const Navbar: React.FC<NavbarProps> = ({
  activeBusinessUnit,
  onSelectBusinessUnit,
  onOpenQuickCreate,
  pendingApprovals,
  onOpenGlobalSearch,
  onSelectTab,
  onSignOut,
  activeTab: _activeTab,
  currentUser,
  canCreate = false,
  syncHealthy = true,
}) => {
  const [showBuDropdown, setShowBuDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);

  const { members: teamMembers, onlineCount } = useTeamActivity(currentUser?.id);

  const [buList, setBuList] = useState(() => loadStoredBusinessUnits());

  useEffect(() => {
    const handleUpdate = () => {
      setBuList(loadStoredBusinessUnits());
    };
    window.addEventListener('business-units-updated', handleUpdate);
    return () => {
      window.removeEventListener('business-units-updated', handleUpdate);
    };
  }, []);

  const businessUnits: BusinessUnit[] = [
    'Semua Unit Bisnis',
    ...Array.from(new Set(buList.map((u) => u.name))),
  ];

  return (
    <header className="paten-navbar fixed z-30 px-3.5 flex items-center justify-between transition-colors">
      {/* Left Area: Logo & Business Unit Switcher */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2 focus:outline-none group text-left"
        >
          <div className="w-7 h-7 rounded-lg bg-[#087E79] flex items-center justify-center text-white font-mono font-bold text-xs shadow-2xs group-hover:bg-[#066864] transition-colors">
            PL
          </div>
          <div className="hidden sm:block">
            <h1 className="font-extrabold text-xs tracking-tight text-slate-900 flex items-center gap-1">
              Product Launch <span className="text-[#087E79] font-mono">OS 3.0</span>
            </h1>
            <p className="text-[10px] text-slate-500 -mt-0.5 font-mono">STUDIO OPERATIONS</p>
          </div>
        </button>

        <div className="h-4 w-px bg-slate-200 hidden md:block" />

        {/* Business Unit Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowBuDropdown(!showBuDropdown);
              setShowTeamDropdown(false);
              setShowNotifications(false);
              setShowProfileMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors border border-slate-200"
          >
            <Layers className="w-3.5 h-3.5 text-[#087E79]" />
            <span className="truncate max-w-[120px]">{activeBusinessUnit}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showBuDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1">
              <div className="px-2.5 py-1 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Pilih Unit Bisnis
              </div>
              {businessUnits.map((bu) => (
                <button
                  key={bu}
                  onClick={() => {
                    onSelectBusinessUnit(bu);
                    setShowBuDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    activeBusinessUnit === bu
                      ? 'text-[#087E79] font-bold bg-[#DDF4F1]/50'
                      : 'text-slate-700'
                  }`}
                >
                  <span>{bu}</span>
                  {activeBusinessUnit === bu && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#087E79]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center Area: Search Bar (Desktop) */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
        <button
          onClick={onOpenGlobalSearch}
          className="w-full flex items-center justify-between px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 hover:border-[#087E79] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">Cari artikel, kode, supplier, material...</span>
          </div>
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white text-[10px] font-mono border border-slate-200 text-slate-400">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right Area: Actions & Profile */}
      <div className="flex items-center gap-2">
        {/* Quick Search Mobile */}
        <button
          onClick={onOpenGlobalSearch}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          title="Cari"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Sync Status Badge */}
        <div className={`hidden xl:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
          syncHealthy
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${syncHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span>{syncHealthy ? 'Realtime aktif' : 'Perlu sinkronisasi'}</span>
        </div>

        {/* Team Activity Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTeamDropdown(!showTeamDropdown);
              setShowNotifications(false);
              setShowProfileMenu(false);
            }}
            className="relative flex items-center gap-1.5 p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            title="Tim aktif"
          >
            <Users className="w-4 h-4" />
            {onlineCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                {onlineCount}
              </span>
            )}
          </button>

          {showTeamDropdown && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <h3 className="font-bold text-xs text-slate-900 font-mono">
                  TIM ({teamMembers.length})
                </h3>
                <span className="text-[10px] font-mono text-emerald-600 font-bold">
                  {onlineCount} online
                </span>
              </div>

              {teamMembers.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">Memuat data tim...</p>
              ) : (
                <div className="space-y-0.5 max-h-72 overflow-y-auto">
                  {teamMembers.map((member) => (
                    <TeamMemberRow key={member.id} member={member} isMe={member.id === currentUser?.id} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications Popup */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowTeamDropdown(false);
              setShowProfileMenu(false);
            }}
            className="relative p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            title="Notifikasi"
          >
            <Bell className="w-4 h-4" />
            {pendingApprovals.length > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-600 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                {pendingApprovals.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <h3 className="font-bold text-xs text-slate-900 font-mono">
                  APPROVAL PENDING ({pendingApprovals.length})
                </h3>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onSelectTab('approvals');
                  }}
                  className="text-[11px] font-bold text-[#087E79] hover:underline"
                >
                  Lihat Semua
                </button>
              </div>

              {pendingApprovals.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center font-sans">Tidak ada approval pending hari ini.</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {pendingApprovals.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => {
                        setShowNotifications(false);
                        onSelectTab('approvals');
                      }}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-[#087E79] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-900">
                        <span className="text-[#087E79]">{app.articleCode}</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                          {app.gateType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                        {app.summaryNote}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                        By {app.requestedBy}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Primary Action Button: + Tambah Artikel */}
        {canCreate && (
          <button
            onClick={onOpenQuickCreate}
            className="paten-primary-action flex items-center gap-1.5 px-3 py-1.5 text-white font-bold text-xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Tambah Artikel</span>
          </button>
        )}

        {/* User Profile Avatar */}
        <div className="relative flex items-center gap-2 pl-1 border-l border-slate-200 ml-0.5">
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(value => !value);
              setShowTeamDropdown(false);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-slate-100 transition-colors"
            title="Menu profil"
          >
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="" className="h-8 w-8 rounded-full border border-white object-cover shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#DDF4F1] text-[#087E79] flex items-center justify-center font-mono font-bold text-xs border border-[#087E79]/20">
                {(currentUser?.name || 'U').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="hidden 2xl:block max-w-32 text-left">
              <p className="truncate text-[11px] font-bold text-slate-900">{currentUser?.name || 'Pengguna'}</p>
              <p className="truncate text-[9px] text-slate-400">{currentUser?.jobTitle || 'Studio team'}</p>
            </div>
            <ChevronDown className="hidden 2xl:block w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute top-full right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50">
              <div className="px-2.5 py-2 border-b border-slate-100">
                <p className="truncate text-[11px] font-bold text-slate-900">{currentUser?.name || 'Pengguna'}</p>
                <p className="truncate text-[10px] text-slate-400">{currentUser?.jobTitle || 'Studio team'}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  onSignOut();
                }}
                className="mt-2 w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
