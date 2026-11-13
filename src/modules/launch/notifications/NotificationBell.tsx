import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, ClipboardList, MessageSquare, RefreshCw, Sparkles } from 'lucide-react';
import type { NotificationCategory, NotificationItem } from './useWorkspaceNotifications';

function formatRelativeTime(isoDate: string): string {
  if (!isoDate) return '';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  if (Number.isNaN(diffMs)) return '';
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(isoDate));
}

const categoryStyle: Record<
  NotificationCategory,
  { pill: string; dot: string; iconBg: string }
> = {
  discussion: {
    pill: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-600',
    iconBg: 'bg-indigo-100 text-indigo-700',
  },
  task: {
    pill: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: 'bg-rose-600',
    iconBg: 'bg-rose-100 text-rose-700',
  },
  update: {
    pill: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    iconBg: 'bg-amber-100 text-amber-700',
  },
};

export interface NotificationBellProps {
  items: NotificationItem[];
  countsByCategory: {
    all: number;
    discussion: number;
    task: number;
    update: number;
  };
  isUnread: (item: NotificationItem) => boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectNotification: (item: NotificationItem) => void;
  onRefresh?: () => void;
  buttonClassName?: string;
  compact?: boolean;
}

export function NotificationBell({
  items,
  countsByCategory,
  isUnread,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotification,
  onRefresh,
  buttonClassName,
  compact = false,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'all' | NotificationCategory>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const filteredItems = tab === 'all' ? items : items.filter(item => item.category === tab);

  const tabs: {
    id: 'all' | NotificationCategory;
    label: string;
    unread: number;
    total: number;
    badgeColor: string;
  }[] = [
    {
      id: 'all',
      label: 'Semua',
      unread: countsByCategory.all,
      total: items.length,
      badgeColor: 'bg-slate-800 text-white',
    },
    {
      id: 'discussion',
      label: 'Diskusi',
      unread: countsByCategory.discussion,
      total: items.filter(i => i.category === 'discussion').length,
      badgeColor: 'bg-indigo-600 text-white',
    },
    {
      id: 'task',
      label: 'Tugas',
      unread: countsByCategory.task,
      total: items.filter(i => i.category === 'task').length,
      badgeColor: 'bg-rose-600 text-white',
    },
    {
      id: 'update',
      label: 'Update',
      unread: countsByCategory.update,
      total: items.filter(i => i.category === 'update').length,
      badgeColor: 'bg-amber-600 text-white',
    },
  ];

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        aria-label="Pusat Notifikasi"
        aria-expanded={open}
        title="Notifikasi Diskusi, Tugas & Update"
        onClick={() => setOpen(prev => !prev)}
        className={
          buttonClassName ??
          'relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors'
        }
      >
        <span className="relative inline-flex items-center">
          <Bell className="h-4 w-4 text-slate-700" />
          {countsByCategory.all > 0 && (
            <span className="absolute -top-2 -right-2 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-mono font-extrabold text-white shadow-xs ring-2 ring-white">
              {countsByCategory.all > 99 ? '99+' : countsByCategory.all}
            </span>
          )}
        </span>
        {!compact && <span className="hidden sm:inline">Notifikasi</span>}
        {!compact && (countsByCategory.discussion > 0 || countsByCategory.task > 0 || countsByCategory.update > 0) && (
          <span className="hidden md:inline-flex items-center gap-1 ml-0.5">
            {countsByCategory.discussion > 0 && (
              <span
                title={`${countsByCategory.discussion} Diskusi baru`}
                className="inline-flex items-center gap-0.5 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800"
              >
                💬 {countsByCategory.discussion}
              </span>
            )}
            {countsByCategory.task > 0 && (
              <span
                title={`${countsByCategory.task} Tugas perlu perhatian`}
                className="inline-flex items-center gap-0.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800"
              >
                📋 {countsByCategory.task}
              </span>
            )}
            {countsByCategory.update > 0 && (
              <span
                title={`${countsByCategory.update} Review / Update`}
                className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900"
              >
                🔔 {countsByCategory.update}
              </span>
            )}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Daftar Notifikasi"
          className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-1.5rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>Pusat Notifikasi</span>
                {countsByCategory.all > 0 && (
                  <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-mono font-bold text-white">
                    {countsByCategory.all} baru
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500">
                Terpisah per kategori: Diskusi, Tugas, dan Update / Review
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {onRefresh && (
                <button
                  type="button"
                  onClick={() => onRefresh()}
                  title="Segarkan notifikasi"
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
              {countsByCategory.all > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2 py-1 text-[11px] font-bold text-teal-800 hover:bg-teal-100"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Tandai dibaca</span>
                </button>
              )}
            </div>
          </div>

          {/* Separated Category Tabs with Balloon Badges */}
          <div className="mt-2.5 grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
            {tabs.map(t => {
              const active = tab === t.id;
              const badgeVal = t.unread > 0 ? t.unread : t.total;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all ${
                    active
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{t.label}</span>
                  {badgeVal > 0 && (
                    <span
                      className={`inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full px-1 text-[10px] font-mono font-bold ${
                        t.unread > 0 ? t.badgeColor : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {badgeVal > 99 ? '99+' : badgeVal}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Notification Items List */}
          <div className="mt-2.5 max-h-80 space-y-1.5 overflow-y-auto pr-0.5">
            {filteredItems.length === 0 ? (
              <div className="rounded-xl bg-slate-50 py-8 text-center text-xs text-slate-500">
                Belum ada notifikasi pada kategori ini.
              </div>
            ) : (
              filteredItems.slice(0, 35).map(item => {
                const unread = isUnread(item);
                const style = categoryStyle[item.category];
                const Icon =
                  item.category === 'discussion'
                    ? MessageSquare
                    : item.category === 'task'
                      ? ClipboardList
                      : Sparkles;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onMarkAsRead(item.id);
                      setOpen(false);
                      onSelectNotification(item);
                    }}
                    className={`w-full rounded-xl border p-2.5 text-left transition-all flex items-start gap-2.5 ${
                      unread
                        ? 'border-teal-200 bg-teal-50/40 hover:bg-teal-50/80'
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${style.iconBg}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${style.pill}`}>
                          {item.badgeLabel}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs font-bold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-600">
                        {item.body}
                      </p>
                    </div>
                    {unread && (
                      <span
                        title="Belum dibaca"
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
