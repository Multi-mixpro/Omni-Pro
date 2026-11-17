import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle2, Plus, Repeat, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { PlatformIcon } from './AccountIdentity';
import { button, errorText, field, Options, primary, type TaskPresetSeed } from './CreativeForms';
import {
  advanceTask, platforms, priorities, recordRoutineExecution, removeTask,
  saveTask, taskRoutineModes, tasks, taskStatuses, workstreams,
  type Task,
} from './repository';

type HubTab = 'all' | 'pending_today' | 'done_today' | 'optimization' | 'social_text';
type QuickFrequency = 'daily' | 'weekly' | 'once';
type PlatformKey = Task['platform'];

const QUICK_PLATFORM_KEYS: PlatformKey[] = ['threads', 'x', 'instagram', 'facebook', 'tiktok', 'youtube', 'whatsapp', 'marketplace', 'website', 'other'];

const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'UTC' });
const formatDate = (value: string | null) => value ? dateFormat.format(new Date(value + 'T00:00:00Z')) : '—';

const statusBadge: Record<Task['status'], string> = {
  todo: 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300',
  doing: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  review: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  ready: 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
  done: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  blocked: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400',
};

const nextRoutineStep: Partial<Record<Task['status'], { status: Exclude<Task['status'], 'blocked'>; label: string }>> = {
  todo: { status: 'doing', label: 'Mulai' },
  doing: { status: 'done', label: 'Selesai' },
  review: { status: 'done', label: 'Selesai' },
  ready: { status: 'done', label: 'Selesai' },
};

function isOptimizationOrRoutine(task: Task): boolean {
  if (task.workstream !== 'creative') return true;
  if (task.routine_mode && task.routine_mode !== 'once') return true;
  if (task.output_type === 'other') return true;
  return (task.platform === 'threads' || task.platform === 'x') && /optimasi|profil|konsep|bio|audit|rutin|balas/i.test(task.title);
}

export function TaskRoutinesHub({
  unit,
  campaignId,
  canEdit,
  unitName,
  person,
  onOpen,
  onEdit,
  onCreateTask,
}: {
  unit: string;
  campaignId: string | 'all' | null;
  canEdit: boolean;
  unitName: (id: string | null | undefined) => string;
  person: (id: string | null) => string;
  onOpen: (id: string) => void;
  onEdit: (task: Task) => void;
  onCreateTask: (preset?: TaskPresetSeed) => void;
}) {
  const client = useQueryClient();
  const [tab, setTab] = useState<HubTab>('all');
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');

  // Quick-add daily activity / optimization state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPlatforms, setQuickPlatforms] = useState<PlatformKey[]>(['threads']);
  const [quickFreq, setQuickFreq] = useState<QuickFrequency>('daily');

  const toggleQuickPlatform = (key: PlatformKey) => {
    setQuickPlatforms(current => {
      if (current.includes(key)) {
        return current.length > 1 ? current.filter(item => item !== key) : current;
      }
      return [...current, key];
    });
  };

  const todayStamp = useMemo(() => new Date().toLocaleDateString('id-ID'), []);

  const listQuery = useQuery({
    queryKey: ['creative', 'routines-hub', unit, campaignId, platformFilter, statusFilter],
    queryFn: ({ signal }) => tasks(
      campaignId,
      { platform: platformFilter, status: statusFilter, assignee: '', workstream: '', order: 'due_on' },
      0,
      signal,
      'all',
      '',
      unit,
    ),
  });

  const invalidateAll = async () => {
    await client.invalidateQueries({ queryKey: ['creative'] });
  };

  const quickAddMutation = useMutation({
    mutationFn: async () => {
      const title = quickTitle.trim();
      if (!title) throw new Error('Tulis nama aktivitas atau task terlebih dahulu.');
      const isRecurring = quickFreq !== 'once';
      const [primaryPlatform = 'threads', ...extraPlatforms] = quickPlatforms;
      return saveTask({
        campaign_id: campaignId && campaignId !== 'all' ? campaignId : null,
        business_unit_id: unit !== 'all' && unit !== 'unassigned' ? unit : null,
        title,
        brief: '',
        creative_brief: {},
        deliverable: '',
        acceptance_criteria: '',
        completion_note: '',
        checklist: [],
        assignee_id: null,
        reviewer_id: null,
        approver_id: null,
        additional_assignee_ids: [],
        additional_platforms: primaryPlatform === 'internal' ? [] : extraPlatforms.filter(p => p !== 'internal' && p !== primaryPlatform),
        platform: primaryPlatform,
        output_type: 'other',
        routine_mode: isRecurring ? 'scheduled_recurring' : 'once',
        routine_category: quickFreq === 'daily' ? 'daily_weekly' : quickFreq === 'weekly' ? 'channel_audit' : 'platform_optimization',
        routine_trigger: quickFreq === 'daily' ? 'Aktivitas harian (Daily Activity)' : quickFreq === 'weekly' ? 'Rutinitas mingguan / berkala' : undefined,
        routine_target: quickFreq === 'daily' ? '1x eksekusi per hari' : undefined,
        format: '',
        status: 'todo',
        priority: 'normal',
        due_on: null,
        publish_on: null,
        output_url: '',
        blocker: '',
        workstream: 'operations',
      });
    },
    onSuccess: async () => {
      setQuickTitle('');
      setNotice('Aktivitas ditambahkan ke daftar Task & Rutinitas.');
      await invalidateAll();
    },
  });

  const advanceMutation = useMutation({
    mutationFn: ({ task, status }: { task: Task; status: Exclude<Task['status'], 'blocked'> }) => advanceTask(task, status),
    onSuccess: async () => {
      setNotice('Status aktivitas diperbarui.');
      await invalidateAll();
    },
  });

  const executeMutation = useMutation({
    mutationFn: (task: Task) => recordRoutineExecution(task, `Selesai dikerjakan (${todayStamp})`, true),
    onSuccess: async () => {
      setNotice('Eksekusi hari ini tercatat.');
      await invalidateAll();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (task: Task) => removeTask(task),
    onSuccess: async () => {
      setNotice('Aktivitas dihapus.');
      await invalidateAll();
    },
  });

  const allRelevant = useMemo(
    () => (listQuery.data ?? []).filter(isOptimizationOrRoutine),
    [listQuery.data],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRelevant.filter(task => {
      const isRecurring = Boolean(task.routine_mode && task.routine_mode !== 'once');
      const doneToday = Boolean(task.routine_last_note?.includes(todayStamp));
      if (tab === 'pending_today' && (!isRecurring || doneToday)) return false;
      if (tab === 'done_today' && (!isRecurring || !doneToday)) return false;
      if (tab === 'optimization' && isRecurring) return false;
      if (tab === 'social_text' && task.platform !== 'threads' && task.platform !== 'x' && !task.additional_platforms?.includes('threads') && !task.additional_platforms?.includes('x')) return false;
      if (!q) return true;
      const allPlatformNames = [task.platform, ...(task.additional_platforms ?? [])].map(p => platforms[p] ?? '').join(' ');
      const haystack = `${task.title} ${task.brief} ${task.deliverable} ${task.format} ${allPlatformNames}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [allRelevant, search, tab, todayStamp]);

  const counts = useMemo(() => {
    const dailyItems = allRelevant.filter(t => t.routine_mode && t.routine_mode !== 'once');
    const doneToday = dailyItems.filter(t => t.routine_last_note?.includes(todayStamp)).length;
    return {
      total: allRelevant.length,
      daily: dailyItems.length,
      doneToday,
      pendingToday: dailyItems.length - doneToday,
      optimization: allRelevant.filter(t => !t.routine_mode || t.routine_mode === 'once').length,
      socialText: allRelevant.filter(t => t.platform === 'threads' || t.platform === 'x' || t.additional_platforms?.includes('threads') || t.additional_platforms?.includes('x')).length,
    };
  }, [allRelevant, todayStamp]);

  const handleQuickSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canEdit || quickAddMutation.isPending) return;
    quickAddMutation.mutate();
  };

  const mutationError = quickAddMutation.error || advanceMutation.error || executeMutation.error || deleteMutation.error;

  return (
    <section className="space-y-4" aria-label="Task dan Rutinitas">
      {/* Compact Header & Daily Progress */}
      <div className="sa-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Repeat size={12} />
              <span>Daily Activity &amp; Non-Produksi</span>
            </div>
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-lg">
              Task &amp; Rutinitas Harian
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload harian (Threads, X, IG/FB Reels, TikTok), balas komentar/DM, optimasi profil, dan aktivitas rutin di luar alur produksi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {counts.daily > 0 && (
              <div className="rounded-xl bg-indigo-50/80 px-3 py-1.5 text-right dark:bg-indigo-500/10">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">Check-in Hari Ini</span>
                <span className="font-mono text-sm font-extrabold text-indigo-700 dark:text-indigo-200">{counts.doneToday}/{counts.daily}</span>
              </div>
            )}
            {canEdit && (
              <button
                type="button"
                className={`${button} inline-flex items-center gap-1.5 !h-9 !px-3 !text-xs`}
                onClick={() => onCreateTask({
                  workstream: 'operations',
                  platform: quickPlatforms[0] ?? 'threads',
                  output_type: 'other',
                  routine_mode: 'scheduled_recurring',
                })}
              >
                <SlidersHorizontal size={13} />
                <span>Form Lengkap</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Add Bar (1-click daily task + multi-platform chips) */}
        {canEdit && (
          <form onSubmit={handleQuickSubmit} className="mt-4 space-y-2.5 rounded-2xl bg-slate-50/80 p-3 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                maxLength={160}
                placeholder="Tambah cepat: mis. Upload Reels IG + FB sinkron, Posting Threads & X, Balas komen…"
                className={`${field} !h-9 flex-1 !border-0 !bg-white/95 !text-xs shadow-2xs dark:!bg-[#0d1320]`}
              />
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Frekuensi aktivitas"
                  value={quickFreq}
                  onChange={e => setQuickFreq(e.target.value as QuickFrequency)}
                  className={`${field} !h-9 w-auto !border-0 !bg-white/95 !py-1 !text-xs font-semibold shadow-2xs dark:!bg-[#0d1320]`}
                >
                  <option value="daily">Harian (Daily)</option>
                  <option value="weekly">Mingguan / Berkala</option>
                  <option value="once">Optimasi / Sekali</option>
                </select>
                <button
                  type="submit"
                  disabled={quickAddMutation.isPending || !quickTitle.trim()}
                  className={`${primary} inline-flex h-9 items-center gap-1.5 !px-4 !text-xs`}
                >
                  <Plus size={14} />
                  <span>{quickAddMutation.isPending ? 'Menambah…' : 'Tambah'}</span>
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">Platform (bisa pilih &gt;1):</span>
              {QUICK_PLATFORM_KEYS.map(key => {
                const active = quickPlatforms.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleQuickPlatform(key)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all ${
                      active
                        ? 'bg-indigo-600 text-white shadow-2xs dark:bg-indigo-500'
                        : 'bg-white/90 text-slate-600 hover:bg-slate-200/70 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.12]'
                    }`}
                  >
                    {platforms[key]}
                  </button>
                );
              })}
            </div>
          </form>
        )}
      </div>

      {/* Filter & Activity List */}
      <div className="sa-surface p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter kategori Task dan Rutinitas">
            {([
              { id: 'all', label: `Semua (${counts.total})` },
              { id: 'pending_today', label: `Belum Hari Ini (${counts.pendingToday})` },
              { id: 'done_today', label: `Selesai Hari Ini (${counts.doneToday})` },
              { id: 'optimization', label: `Optimasi & Setup (${counts.optimization})` },
              { id: 'social_text', label: `Threads & X (${counts.socialText})` },
            ] as const).map(item => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  tab === item.id
                    ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/[0.09]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari aktivitas…"
                className={`${field} !h-8 w-44 !py-1 !pl-8 !pr-3 !text-xs`}
              />
            </label>
            <select
              aria-label="Filter platform"
              value={platformFilter}
              onChange={e => setPlatformFilter(e.target.value)}
              className={`${field} !h-8 w-auto !py-1 !text-xs`}
            >
              <option value="">Semua platform</option>
              <Options values={platforms} />
            </select>
            <select
              aria-label="Filter status"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className={`${field} !h-8 w-auto !py-1 !text-xs`}
            >
              <option value="">Semua status</option>
              <Options values={taskStatuses} />
            </select>
          </div>
        </div>

        {notice && (
          <p role="status" className="rounded-xl bg-emerald-50/90 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            {notice}
          </p>
        )}
        {(listQuery.error || mutationError) && (
          <p role="alert" className="rounded-xl bg-rose-50/90 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            {errorText(listQuery.error || mutationError)}
          </p>
        )}

        {listQuery.isPending && <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Memuat aktivitas…</p>}

        {listQuery.isSuccess && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-white/10">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Belum ada task atau rutinitas pada filter ini.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Gunakan kolom tambah cepat di atas untuk mencatat aktivitas harian seperti upload Reels, posting Threads/X, atau balas komentar.
            </p>
          </div>
        )}

        <div className="grid gap-2.5 md:grid-cols-2">
          {filtered.map(task => {
            const checklistDone = task.checklist?.filter(item => item.done).length ?? 0;
            const checklistTotal = task.checklist?.length ?? 0;
            const step = nextRoutineStep[task.status];
            const isRecurring = Boolean(task.routine_mode && task.routine_mode !== 'once');
            const doneToday = Boolean(task.routine_last_note?.includes(todayStamp));

            return (
              <article
                key={task.id}
                className="group flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-3.5 transition-all hover:border-indigo-200 hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-indigo-500/30"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <PlatformIcon platform={task.platform === 'internal' ? 'other' : task.platform} />
                      <div className="min-w-0">
                        <h3 className="break-words text-sm font-bold leading-snug text-slate-900 dark:text-slate-100">{task.title}</h3>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {[platforms[task.platform], ...(task.additional_platforms ?? []).map(p => platforms[p])].filter(Boolean).join(' + ')}
                          </span>
                          <span>·</span>
                          <span>{workstreams[task.workstream ?? 'operations']}</span>
                          <span>·</span>
                          <span>{unitName(task.business_unit_id)}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge[task.status]}`}>
                      {taskStatuses[task.status]}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {isRecurring ? (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
                        doneToday
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                      }`}>
                        {doneToday ? <Check size={11} /> : <Repeat size={11} />}
                        {task.routine_trigger || taskRoutineModes[task.routine_mode!]}
                        {task.routine_runs ? ` · ${task.routine_runs}x` : ''}
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                        Optimasi · {priorities[task.priority]}
                      </span>
                    )}
                    {task.assignee_id && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                        PIC: {person(task.assignee_id)}
                      </span>
                    )}
                    {task.due_on && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                        {formatDate(task.due_on)}
                      </span>
                    )}
                    {checklistTotal > 0 && (
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 font-semibold text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                        Checklist {checklistDone}/{checklistTotal}
                      </span>
                    )}
                  </div>

                  {task.routine_last_note && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Terakhir: {task.routine_last_note}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 dark:border-white/[0.06]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {canEdit && isRecurring && (
                      <button
                        type="button"
                        disabled={executeMutation.isPending}
                        onClick={() => executeMutation.mutate(task)}
                        className={`inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold transition-colors ${
                          doneToday
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                        }`}
                      >
                        <CheckCircle2 size={12} />
                        {doneToday ? 'Catat Lagi (+1)' : 'Selesai Hari Ini'}
                      </button>
                    )}
                    {canEdit && !isRecurring && step && (
                      <button
                        type="button"
                        disabled={advanceMutation.isPending}
                        onClick={() => advanceMutation.mutate({ task, status: step.status })}
                        className="inline-flex h-7 items-center gap-1 rounded-lg bg-indigo-600 px-2.5 text-xs font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500"
                      >
                        {step.label}
                      </button>
                    )}
                    <button type="button" className={`${button} !h-7 !px-2.5 !py-0.5 !text-xs`} onClick={() => onOpen(task.id)}>
                      Detail
                    </button>
                    {canEdit && (
                      <button type="button" className={`${button} !h-7 !px-2.5 !py-0.5 !text-xs`} onClick={() => onEdit(task)}>
                        Edit
                      </button>
                    )}
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      aria-label={`Hapus ${task.title}`}
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (confirm(`Hapus aktivitas "${task.title}"?`)) deleteMutation.mutate(task);
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15 dark:hover:text-rose-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
