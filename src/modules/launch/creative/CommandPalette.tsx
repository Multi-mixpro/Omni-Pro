import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Moon, Plus, Repeat, Search, Sun } from 'lucide-react';
import type { Campaign, Task } from './repository';

export type CommandNavItem = {
  id: string;
  label: string;
  group: string;
};

export function CommandPalette({
  open,
  onClose,
  navItems,
  tasks,
  campaigns,
  isDarkMode,
  canEdit,
  onNavigate,
  onOpenTask,
  onCreateTask,
  onCreateRoutine,
  onToggleTheme,
}: {
  open: boolean;
  onClose: () => void;
  navItems: CommandNavItem[];
  tasks: Task[];
  campaigns: Campaign[];
  isDarkMode: boolean;
  canEdit: boolean;
  onNavigate: (sectionId: string) => void;
  onOpenTask: (taskId: string) => void;
  onCreateTask: () => void;
  onCreateRoutine: () => void;
  onToggleTheme: () => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 10);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  const q = query.trim().toLowerCase();

  const matchingNav = useMemo(
    () => navItems.filter(item => !q || `${item.label} ${item.group}`.toLowerCase().includes(q)),
    [navItems, q],
  );

  const matchingTasks = useMemo(
    () => (q ? tasks.filter(t => t.title.toLowerCase().includes(q)).slice(0, 6) : tasks.slice(0, 4)),
    [q, tasks],
  );

  const matchingCampaigns = useMemo(
    () => (q ? campaigns.filter(c => c.name.toLowerCase().includes(q)).slice(0, 4) : []),
    [campaigns, q],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/55 p-4 pt-[12vh] backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0f1624]"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 dark:border-white/[0.06]">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ketik nama menu, tugas, kampanye, atau aksi…"
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
          {(!q || 'buat tugas baru rutinitas tema'.includes(q)) && (
            <div className="space-y-1">
              <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Aksi Cepat</p>
              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={() => { onClose(); onCreateTask(); }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-300"
                  >
                    <span className="inline-flex items-center gap-2"><Plus size={14} /> Buat Tugas Produksi Baru</span>
                    <ArrowRight size={13} className="opacity-50" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { onClose(); onCreateRoutine(); }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-300"
                  >
                    <span className="inline-flex items-center gap-2"><Repeat size={14} /> Buat Task Rutinitas / Daily Activity</span>
                    <ArrowRight size={13} className="opacity-50" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => { onToggleTheme(); onClose(); }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.06]"
              >
                <span className="inline-flex items-center gap-2">
                  {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                  Ganti ke {isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
                </span>
              </button>
            </div>
          )}

          {matchingNav.length > 0 && (
            <div className="space-y-1">
              <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Menu Workspace</p>
              {matchingNav.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onNavigate(item.id); onClose(); }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.06]"
                >
                  <span>{item.label}</span>
                  <span className="text-[11px] text-slate-400">{item.group}</span>
                </button>
              ))}
            </div>
          )}

          {matchingTasks.length > 0 && (
            <div className="space-y-1">
              <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tugas Terbaru</p>
              {matchingTasks.map(task => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => { onOpenTask(task.id); onClose(); }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.06]"
                >
                  <span className="truncate pr-3">{task.title}</span>
                  <span className="shrink-0 text-[11px] text-slate-400">{task.platform}</span>
                </button>
              ))}
            </div>
          )}

          {matchingCampaigns.length > 0 && (
            <div className="space-y-1">
              <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Kampanye</p>
              {matchingCampaigns.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onNavigate('campaigns'); onClose(); }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.06]"
                >
                  <span className="truncate">{c.name}</span>
                  <ArrowRight size={13} className="opacity-50" />
                </button>
              ))}
            </div>
          )}

          {!matchingNav.length && !matchingTasks.length && !matchingCampaigns.length && (
            <p className="p-4 text-center text-xs text-slate-500">Tidak ditemukan hasil untuk “{query}”.</p>
          )}
        </div>
      </div>
    </div>
  );
}
