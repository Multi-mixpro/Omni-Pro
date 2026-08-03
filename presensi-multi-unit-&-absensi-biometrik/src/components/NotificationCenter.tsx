import React, { useState } from 'react';
import {
  X,
  Bell,
  Mail,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  Info,
  Sparkles,
} from 'lucide-react';
import { NotificationItem, SuddenAbsenceAlert } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  alerts: SuddenAbsenceAlert[];
  onMarkAllRead: () => void;
  onTestTriggerPush: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  alerts,
  onMarkAllRead,
  onTestTriggerPush,
}) => {
  const [activeTab, setActiveTab] = useState<'PUSH' | 'EMAIL'>('PUSH');
  const [soundEnabled, setSoundEnabled] = useState(true);

  if (!isOpen) return null;

  const emailLogs = [
    {
      id: 'EML_01',
      recipient: 'hr.manager@ggsupply.co.id',
      subject: '⚠️ ALERT: Ketidakhadiran Mendadak - Rian Hidayat (GGS-104)',
      sentAt: '08:00 WIB',
      status: 'DELIVERED',
    },
    {
      id: 'EML_02',
      recipient: 'manager.gudskuy@gudskuy.id',
      subject: 'ℹ️ Pengajuan Surat Dokter Sakit - Maya Indah',
      sentAt: '08:15 WIB',
      status: 'DELIVERED',
    },
    {
      id: 'EML_03',
      recipient: 'gugun.hijrah@gmail.com',
      subject: '📊 Rekapitulasi Presensi Mingguan 3 Unit Usaha',
      sentAt: '07:00 WIB',
      status: 'DELIVERED',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-white/95 dark:bg-[#0c162c] h-full shadow-2xl border-l border-slate-200 dark:border-[#1a2847] flex flex-col justify-between">
        {/* Drawer Header */}
        <div>
          <div className="p-4 border-b border-slate-200 dark:border-[#1a2847] flex items-center justify-between bg-slate-50 dark:bg-[#0f1a30]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-600 text-white">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Pusat Notifikasi & Alert
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Push Notification & Email Otomatis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                title="Suara Notifikasi"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center border-b border-slate-200 dark:border-[#1a2847] bg-white dark:bg-[#0c162c] p-2 gap-2">
            <button
              onClick={() => setActiveTab('PUSH')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'PUSH'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Push Notifications
            </button>
            <button
              onClick={() => setActiveTab('EMAIL')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'EMAIL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Email Otomatis Log
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'PUSH' ? (
            <>
              {/* Trigger Simulator Action */}
              <button
                onClick={onTestTriggerPush}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Simulasi Trigger Push Alert Mendadak</span>
              </button>

              {/* Notifications list */}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl border text-xs transition-all ${
                    n.type === 'ALERT'
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/80'
                      : n.type === 'WARNING'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {n.title}
                    </span>
                    <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{n.message}</p>
                </div>
              ))}
            </>
          ) : (
            <>
              {/* Email Logs List */}
              <div className="space-y-3">
                {emailLogs.map((em) => (
                  <div
                    key={em.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        To: {em.recipient}
                      </span>
                      <span className="text-[10px] text-slate-400">{em.sentAt}</span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {em.subject}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Email Delivery Confirmed</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <button
            onClick={onMarkAllRead}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Tandai Semua Dibaca
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
