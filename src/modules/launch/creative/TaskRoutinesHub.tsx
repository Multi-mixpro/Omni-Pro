import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AtSign, CheckCircle2, Plus, Repeat, Search, Settings2, Sparkles, Trash2 } from 'lucide-react';
import { PlatformIcon } from './AccountIdentity';
import { button, errorText, field, Options, primary, type TaskPresetSeed } from './CreativeForms';
import {
  advanceTask, platforms, priorities, recordRoutineExecution, removeTask, ROUTINE_PRESETS,
  taskRoutineCategories, taskRoutineModes, tasks, taskStatuses, workstreams,
  type RoutinePreset, type Task,
} from './repository';

type HubTab = 'all' | 'optimization' | 'recurring' | 'threads';

const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'UTC' });
const formatDate = (value: string | null) => value ? dateFormat.format(new Date(value + 'T00:00:00Z')) : '—';

const statusBadge: Record<Task['status'], string> = {
  todo: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  doing: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  review: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  ready: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
  done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  blocked: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

const nextRoutineStep: Partial<Record<Task['status'], { status: Exclude<Task['status'], 'blocked'>; label: string }>> = {
  todo: { status: 'doing', label: 'Mulai kerjakan' },
  doing: { status: 'done', label: 'Tandai selesai' },
  review: { status: 'done', label: 'Selesaikan' },
  ready: { status: 'done', label: 'Tandai selesai' },
};

function isOptimizationOrRoutine(task: Task): boolean {
  if (task.workstream !== 'creative') return true;
  if (task.routine_mode && task.routine_mode !== 'once') return true;
  if (task.output_type === 'other') return true;
  return (task.platform === 'threads' || task.platform === 'x') && /optimasi|profil|konsep|bio|audit/i.test(task.title);
}

function presetToSeed(preset: RoutinePreset): TaskPresetSeed {
  return {
    title: preset.label,
    platform: preset.platform ?? 'internal',
    workstream: preset.workstream ?? 'operations',
    output_type: preset.output_type,
    routine_mode: preset.mode,
    routine_category: preset.category,
    routine_trigger: preset.trigger,
    routine_target: preset.target,
    format: preset.format,
    deliverable: preset.deliverable,
    acceptance_criteria: preset.acceptance_criteria,
    checklist: preset.checklist.join('\n'),
  };
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

  const advanceMutation = useMutation({
    mutationFn: ({ task, status }: { task: Task; status: Exclude<Task['status'], 'blocked'> }) => advanceTask(task, status),
    onSuccess: async () => {
      setNotice('Status task & rutinitas diperbarui.');
      await invalidateAll();
    },
  });

  const executeMutation = useMutation({
    mutationFn: (task: Task) => recordRoutineExecution(task, `Eksekusi rutin dicatat (${new Date().toLocaleDateString('id-ID')})`, true),
    onSuccess: async () => {
      setNotice('Eksekusi rutinitas (+1) berhasil dicatat.');
      await invalidateAll();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (task: Task) => removeTask(task),
    onSuccess: async () => {
      setNotice('Task & rutinitas dihapus.');
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
      if (tab === 'optimization' && task.workstream === 'creative' && task.output_type !== 'other') return false;
      if (tab === 'recurring' && (!task.routine_mode || task.routine_mode === 'once')) return false;
      if (tab === 'threads' && task.platform !== 'threads' && task.platform !== 'x' && !task.additional_platforms?.includes('threads') && !task.additional_platforms?.includes('x')) return false;
      if (!q) return true;
      const haystack = `${task.title} ${task.brief} ${task.deliverable} ${task.format} ${platforms[task.platform] ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [allRelevant, search, tab]);

  const counts = useMemo(() => ({
    total: allRelevant.length,
    optimization: allRelevant.filter(t => t.workstream !== 'creative' || t.output_type === 'other').length,
    recurring: allRelevant.filter(t => t.routine_mode && t.routine_mode !== 'once').length,
    threads: allRelevant.filter(t => t.platform === 'threads' || t.platform === 'x' || t.additional_platforms?.includes('threads') || t.additional_platforms?.includes('x')).length,
  }), [allRelevant]);

  const optimizationPresets = ROUTINE_PRESETS.filter(p =>
    ['platform_optimization', 'account_concept', 'channel_audit'].includes(p.category),
  );
  const routinePresets = ROUTINE_PRESETS.filter(p =>
    !['platform_optimization', 'account_concept', 'channel_audit'].includes(p.category),
  );

  const mutationError = advanceMutation.error || executeMutation.error || deleteMutation.error;

  return (
    <section className="space-y-4" aria-label="Task dan Rutinitas">
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 sm:p-5 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)] dark:border-slate-800/80 dark:bg-[#111622]/95">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
              <Repeat size={12} />
              <span>TASK NON-KONTEN &amp; RUTINITAS</span>
            </div>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Task &amp; Rutinitas Operasional Platform
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Kelola tugas optimasi akun (termasuk Threads), setup profil, konsep postingan, audit kanal, dan rutinitas berulang di luar produksi ide &amp; konten.
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              className={`${primary} inline-flex items-center gap-1.5`}
              onClick={() => onCreateTask({
                workstream: 'operations',
                platform: 'threads',
                output_type: 'other',
                routine_mode: 'once',
              })}
            >
              <Plus size={15} />
              <span>Task Optimasi / Rutinitas Baru</span>
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Task &amp; Rutinitas</span>
            <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{counts.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Optimasi &amp; Operasional</span>
            <p className="mt-1 text-xl font-extrabold text-indigo-700 dark:text-indigo-300">{counts.optimization}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Rutinitas Berulang</span>
            <p className="mt-1 text-xl font-extrabold text-teal-700 dark:text-teal-300">{counts.recurring}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Platform Threads &amp; X</span>
            <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{counts.threads}</p>
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 sm:p-5 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)] dark:border-slate-800/80 dark:bg-[#111622]/95 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-teal-600 dark:text-teal-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Template Cepat Optimasi Platform &amp; Rutinitas</h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Klik template untuk langsung membuat task dengan checklist standar</span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {optimizationPresets.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onCreateTask(presetToSeed(preset))}
                className="group flex flex-col items-start justify-between gap-2 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50/40 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-teal-600 dark:hover:bg-teal-950/30"
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700 shadow-2xs dark:bg-slate-800 dark:text-slate-200">
                    {preset.platform === 'threads' ? <AtSign size={11} /> : <Settings2 size={11} />}
                    {preset.badge}
                  </span>
                  <Plus size={14} className="text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{preset.label}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">{preset.trigger}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">Rutinitas Operasional:</span>
            {routinePresets.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onCreateTask(presetToSeed(preset))}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-teal-600 dark:hover:bg-teal-950/40"
              >
                + {preset.badge}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 sm:p-5 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)] dark:border-slate-800/80 dark:bg-[#111622]/95 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter kategori Task dan Rutinitas">
            {([
              { id: 'all', label: `Semua (${counts.total})` },
              { id: 'optimization', label: `Optimasi & Operasional (${counts.optimization})` },
              { id: 'recurring', label: `Rutinitas Berulang (${counts.recurring})` },
              { id: 'threads', label: `Threads & X (${counts.threads})` },
            ] as const).map(item => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  tab === item.id
                    ? 'bg-slate-900 text-white dark:bg-teal-600 dark:text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800'
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
                placeholder="Cari task optimasi / rutinitas…"
                className={`${field} !h-8 !py-1 !pl-8 !pr-3 !text-xs w-52`}
              />
            </label>
            <select
              aria-label="Filter platform"
              value={platformFilter}
              onChange={e => setPlatformFilter(e.target.value)}
              className={`${field} !h-8 !py-1 !text-xs w-auto`}
            >
              <option value="">Semua platform</option>
              <Options values={platforms} />
            </select>
            <select
              aria-label="Filter status"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className={`${field} !h-8 !py-1 !text-xs w-auto`}
            >
              <option value="">Semua status</option>
              <Options values={taskStatuses} />
            </select>
          </div>
        </div>

        {notice && <p role="status" className="rounded-xl bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 dark:bg-teal-950/50 dark:text-teal-300">{notice}</p>}
        {(listQuery.error || mutationError) && (
          <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
            {errorText(listQuery.error || mutationError)}
          </p>
        )}

        {listQuery.isPending && <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Memuat daftar task &amp; rutinitas…</p>}

        {listQuery.isSuccess && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Belum ada task optimasi atau rutinitas yang cocok.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Klik salah satu template cepat di atas (misalnya <strong>Optimasi Akun &amp; Profil Threads</strong>) atau tombol <strong>Task Optimasi / Rutinitas Baru</strong>.
            </p>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map(task => {
            const checklistDone = task.checklist?.filter(item => item.done).length ?? 0;
            const checklistTotal = task.checklist?.length ?? 0;
            const step = nextRoutineStep[task.status];
            const isRecurring = Boolean(task.routine_mode && task.routine_mode !== 'once');

            return (
              <article
                key={task.id}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-[#0b101b]"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <PlatformIcon platform={task.platform === 'internal' ? 'other' : task.platform} />
                      <div className="min-w-0">
                        <h3 className="break-words text-sm font-bold text-slate-900 dark:text-white">{task.title}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{platforms[task.platform]}</span>
                          <span>·</span>
                          <span>{workstreams[task.workstream ?? 'creative']}</span>
                          <span>·</span>
                          <span>{unitName(task.business_unit_id)}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusBadge[task.status]}`}>
                      {taskStatuses[task.status]}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Prioritas: {priorities[task.priority]}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      PIC: {person(task.assignee_id)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Deadline: {formatDate(task.due_on)}
                    </span>
                    {task.routine_mode && task.routine_mode !== 'once' && (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-bold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                        🔁 {task.routine_category ? taskRoutineCategories[task.routine_category] : taskRoutineModes[task.routine_mode]}
                        {task.routine_runs ? ` · ${task.routine_runs}x dijalankan` : ''}
                      </span>
                    )}
                    {checklistTotal > 0 && (
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 font-semibold text-teal-800 dark:bg-teal-950/50 dark:text-teal-300">
                        ✓ Checklist {checklistDone}/{checklistTotal}
                      </span>
                    )}
                  </div>

                  {(task.routine_trigger || task.deliverable || task.brief) && (
                    <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                      {task.routine_trigger ? `Pemicu: ${task.routine_trigger}` : task.deliverable || task.brief}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800/80">
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" className={`${button} !h-7 !px-2.5 !py-0.5 !text-xs`} onClick={() => onOpen(task.id)}>
                      Detail
                    </button>
                    {canEdit && (
                      <button type="button" className={`${button} !h-7 !px-2.5 !py-0.5 !text-xs`} onClick={() => onEdit(task)}>
                        Edit
                      </button>
                    )}
                    {canEdit && isRecurring && (
                      <button
                        type="button"
                        disabled={executeMutation.isPending}
                        onClick={() => executeMutation.mutate(task)}
                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 text-xs font-bold text-indigo-800 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200"
                      >
                        <CheckCircle2 size={12} />
                        Catat +1
                      </button>
                    )}
                    {canEdit && step && (
                      <button
                        type="button"
                        disabled={advanceMutation.isPending}
                        onClick={() => advanceMutation.mutate({ task, status: step.status })}
                        className="inline-flex h-7 items-center gap-1 rounded-lg bg-teal-700 px-2.5 text-xs font-bold text-white hover:bg-teal-800"
                      >
                        {step.label}
                      </button>
                    )}
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      aria-label={`Hapus ${task.title}`}
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (confirm(`Hapus task "${task.title}"?`)) deleteMutation.mutate(task);
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
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
