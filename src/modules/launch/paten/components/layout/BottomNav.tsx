/**
 * Product Launch OS 3.0 - Mobile Bottom Navigation
 */

import React, { useState } from 'react';
import {
  Home,
  Kanban,
  Plus,
  CheckSquare,
  MoreHorizontal,
  FileCheck2,
  Database,
  BarChart3,
  X,
  Layers,
  Rocket,
  Calendar,
  Settings,
  LogOut,
} from 'lucide-react';
import { BusinessUnit } from '../../types';
import { loadStoredBusinessUnits } from '../../services/businessUnits';

interface BottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenQuickCreate: () => void;
  pendingApprovalsCount: number;
  activeBusinessUnit: BusinessUnit;
  onSelectBusinessUnit: (bu: BusinessUnit) => void;
  onSignOut: () => void;
  canCreate?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenQuickCreate,
  pendingApprovalsCount,
  activeBusinessUnit,
  onSelectBusinessUnit,
  onSignOut,
  canCreate = false,
}) => {
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const storedUnits = loadStoredBusinessUnits();
  const businessUnits: BusinessUnit[] = [
    'Semua Unit Bisnis',
    ...Array.from(new Set(storedUnits.map((u) => u.name))),
  ];

  return (
    <>
      <nav className="paten-bottom-nav md:hidden fixed z-40 px-2 py-1 flex items-center justify-around pb-[env(safe-area-inset-bottom,8px)]">
        {/* Home / Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
            activeTab === 'dashboard'
              ? 'text-[#087E79] font-bold'
              : 'text-slate-400'
          }`}
        >
          <Home className="w-4 h-4 stroke-[2]" />
          <span className="text-[10px] font-mono mt-0.5">Home</span>
        </button>

        {/* Pipeline */}
        <button
          onClick={() => onSelectTab('pipeline')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
            activeTab === 'pipeline'
              ? 'text-[#087E79] font-bold'
              : 'text-slate-400'
          }`}
        >
          <Kanban className="w-4 h-4 stroke-[2]" />
          <span className="text-[10px] font-mono mt-0.5">Pipeline</span>
        </button>

        {/* Center Prominent Elevated Add Button */}
        {canCreate && (
          <div className="-mt-4">
            <button
              onClick={onOpenQuickCreate}
              className="w-11 h-11 rounded-full bg-slate-950 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform"
              title="Tambah Artikel"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        )}

        {/* Tasks */}
        <button
          onClick={() => onSelectTab('tasks')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
            activeTab === 'tasks'
              ? 'text-[#087E79] font-bold'
              : 'text-slate-400'
          }`}
        >
          <CheckSquare className="w-4 h-4 stroke-[2]" />
          <span className="text-[10px] font-mono mt-0.5">Tasks</span>
        </button>

        {/* More Sheet Trigger */}
        <button
          onClick={() => setShowMoreSheet(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors relative ${
            ['approvals', 'master', 'reports'].includes(activeTab)
              ? 'text-[#087E79] font-bold'
              : 'text-slate-400'
          }`}
        >
          <MoreHorizontal className="w-4 h-4 stroke-[2]" />
          <span className="text-[10px] font-mono mt-0.5">Lainnya</span>
          {pendingApprovalsCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>
      </nav>

      {/* More Sheet Modal */}
      {showMoreSheet && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl p-4 border-t border-slate-200 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-mono font-bold text-xs text-slate-900 uppercase">Menu & Business Unit</h3>
                <p className="text-[10px] text-slate-400">Akses modul dan ganti brand</p>
              </div>
              <button
                onClick={() => setShowMoreSheet(false)}
                className="p-1 rounded-full bg-slate-100 text-slate-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Business Unit Selector in More Sheet */}
            <div className="my-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-slate-700">
                <Layers className="w-3.5 h-3.5 text-[#087E79]" />
                <span>Unit Bisnis Aktif:</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {businessUnits.map((bu) => (
                  <button
                    key={bu}
                    onClick={() => {
                      onSelectBusinessUnit(bu);
                      setShowMoreSheet(false);
                    }}
                    className={`py-1.5 px-2 text-[10px] font-mono font-bold rounded-lg text-center border transition-all ${
                      activeBusinessUnit === bu
                        ? 'bg-[#087E79] text-white border-[#087E79] shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {bu}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Grid */}
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              <button
                onClick={() => {
                  onSelectTab('implementation');
                  setShowMoreSheet(false);
                }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#DDF4F1] border border-[#087E79]/30 text-left text-xs font-bold text-[#087E79]"
              >
                <Rocket className="w-4 h-4 text-[#087E79]" />
                <span>Implementasi Artikel</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('calendar');
                  setShowMoreSheet(false);
                }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-left text-xs font-bold text-[#087E79]"
              >
                <Calendar className="w-4 h-4 text-[#087E79]" />
                <span>Calendar & Jadwal</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('approvals');
                  setShowMoreSheet(false);
                }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs font-bold text-slate-900"
              >
                <FileCheck2 className="w-4 h-4 text-amber-500" />
                <div className="flex-1">
                  <span>Approvals Gate</span>
                  {pendingApprovalsCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded font-mono bg-amber-500 text-white text-[9px]">
                      {pendingApprovalsCount}
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => {
                  onSelectTab('master');
                  setShowMoreSheet(false);
                }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs font-bold text-slate-900"
              >
                <Database className="w-4 h-4 text-[#087E79]" />
                <span>Master Data</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('reports');
                  setShowMoreSheet(false);
                }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs font-bold text-slate-900"
              >
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span>Reports & KPI</span>
              </button>

              <a
                href="/launch/app/settings"
                onClick={() => setShowMoreSheet(false)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs font-bold text-slate-900"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Pengaturan & Akses</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setShowMoreSheet(false);
                  onSignOut();
                }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-left text-xs font-bold text-rose-700"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Keluar</span>
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
};
