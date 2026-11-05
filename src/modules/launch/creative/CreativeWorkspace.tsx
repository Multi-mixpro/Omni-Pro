import { useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Megaphone, Plus, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from '@/app/router/simpleRouter';
import { signOut } from '@/core/auth/useAuth';
import { button, CampaignForm, errorText, field, Options, primary, TaskForm } from './CreativeForms';
import { IdeaBank, ReferenceLinks } from './IdeaBank';
import { focusLabels, jakartaToday, mondayWeek, type Focus } from './schedule';
import {
  campaigns, campaignStatuses, PAGE_SIZE, platforms, priorities, safeOutputUrl, summary, tasks, taskStatuses, team,
  type Campaign, type Filters, type Idea, type Task,
} from './repository';

const panel = 'rounded-xl border border-slate-200 bg-white p-4';
const defaultFilters: Filters = { platform: '', status: '', assignee: '', order: 'due_on' };
const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'UTC' });
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const date = (value: string | null) => value ? dateFormat.format(new Date(value + 'T00:00:00Z')) : '—';
type Editor = { kind: 'campaign'; row?: Campaign } | { kind: 'task'; row?: Task; sourceIdea?: Idea };

export default function CreativeWorkspace({ userId, canEdit }: { userId: string; canEdit: boolean }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [section, setSection] = useState<'work' | 'ideas'>('work');
  const [scope, setScope] = useState('all');
  const [filters, setFilters] = useState(defaultFilters);
  const [focus, setFocus] = useState<Focus>('all');
  const [page, setPage] = useState(0);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [notice, setNotice] = useState('');
  const prefix = ['creative', userId];
  const today = jakartaToday();
  const { monday, nextMonday } = mondayWeek(today);
  const sunday = new Date(Date.parse(nextMonday + 'T00:00:00Z') - 86_400_000).toISOString().slice(0, 10);
  const campaignQuery = useInfiniteQuery({
    enabled: section === 'work',
    queryKey: [...prefix, 'campaigns'], initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => campaigns(pageParam, signal),
    getNextPageParam: (last, _, lastPage) => last.length > PAGE_SIZE ? lastPage + 1 : undefined,
  });
  const campaignList = campaignQuery.data?.pages.flatMap(rows => rows.slice(0, PAGE_SIZE)) ?? [];
  const currentCampaign = campaignList.find(campaign => campaign.id === scope);
  const campaignId = scope === 'standalone' ? null : scope;
  const teamQuery = useQuery({
    enabled: section === 'work',
    queryKey: [...prefix, 'team'], queryFn: ({ signal }) => team(signal), staleTime: 5 * 60_000,
  });
  const members = teamQuery.data ?? [];
  const names = new Map(members.map(member => [member.id, member.full_name]));
  const person = (id: string | null) => id ? names.get(id) ?? 'PIC tidak tersedia' : 'Belum ditugaskan';
  const taskQuery = useQuery({
    enabled: section === 'work',
    queryKey: [...prefix, 'tasks', campaignId, filters, page, focus, today],
    queryFn: ({ signal }) => tasks(campaignId, filters, page, signal, focus, today),
  });
  const summaryQuery = useQuery({
    enabled: section === 'work',
    queryKey: [...prefix, 'summary', campaignId, today], queryFn: ({ signal }) => summary(campaignId, today, signal),
  });
  const counts = summaryQuery.data;
  const progress = counts?.total ? Math.round(counts.done * 100 / counts.total) : 0;
  const loading = campaignQuery.isFetching || taskQuery.isFetching || summaryQuery.isFetching || teamQuery.isFetching;
  const error = campaignQuery.error || taskQuery.error || summaryQuery.error || teamQuery.error;
  const changeScope = (next: string) => { setScope(next); setPage(0); setEditor(null); setNotice(''); };
  const changeFilter = (values: Partial<Filters>) => { setFilters(current => ({ ...current, ...values })); setPage(0); };
  const chooseFocus = (next: Focus, resetFilters = false) => {
    setFocus(next);
    setPage(0);
    setFilters(current => ({ ...(resetFilters ? defaultFilters : current), status: '', order: next === 'publish' ? 'publish_on' : 'due_on' }));
  };
  const openFocus = (next: Focus) => {
    chooseFocus(next, true);
    document.getElementById('creative-task-list')?.scrollIntoView({ block: 'start' });
  };
  const openEditor = (next: Editor) => { setEditor(next); setNotice(''); };
  const refresh = () => void client.invalidateQueries({ queryKey: prefix });
  const saved = () => {
    setEditor(null);
    setNotice('Perubahan tersimpan.');
    void client.invalidateQueries({ queryKey: [...prefix, 'tasks'] });
    void client.invalidateQueries({ queryKey: [...prefix, 'summary'] });
    if (editor?.kind === 'task') void client.invalidateQueries({ queryKey: [...prefix, 'ideas'] });
    if (editor?.kind === 'campaign') void client.invalidateQueries({ queryKey: [...prefix, 'campaigns'] });
  };
  const tasksOnPage = taskQuery.data?.slice(0, PAGE_SIZE) ?? [];

  return <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-900 sm:px-6">
    <div className="mx-auto max-w-6xl space-y-5">
      <nav aria-label="Ruang kerja" className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/launch/app" className={button + ' inline-flex items-center gap-2'}><ArrowLeft size={16} /> Pilih ruang kerja</Link>
        <button className={button} onClick={async () => { await signOut(); navigate('/launch/login'); }}>Keluar</button>
      </nav>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal-800"><Megaphone size={17} /> Ruang kerja tim kreatif</p>
          <h1 className="text-2xl font-bold sm:text-3xl">Creative Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Dari referensi ide ke tugas konten dan kampanye promo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={button + ' inline-flex items-center gap-2'} disabled={loading} onClick={refresh}><RefreshCw size={15} /> Segarkan</button>
          {canEdit && section === 'work' && <button className={button} onClick={() => openEditor({ kind: 'campaign' })}>Kampanye baru</button>}
          {canEdit && section === 'work' && <button className={primary + ' inline-flex items-center gap-2'} disabled={currentCampaign?.status === 'archived'} onClick={() => openEditor({ kind: 'task' })}><Plus size={16} /> Tugas baru</button>}
        </div>
      </header>

      <nav aria-label="Bagian Creative Dashboard" className="flex flex-wrap gap-2">
        <button className={section === 'work' ? primary : button} aria-pressed={section === 'work'} onClick={() => setSection('work')}>Tugas &amp; Kampanye</button>
        <button className={section === 'ideas' ? primary : button} aria-pressed={section === 'ideas'} onClick={() => setSection('ideas')}>Bank Ide &amp; Referensi</button>
      </nav>
      {!canEdit && <p className="text-sm text-slate-600">Akun Anda memiliki akses lihat.</p>}
      {section === 'ideas' ? <IdeaBank userId={userId} canEdit={canEdit} onConvert={sourceIdea => {
        if (currentCampaign?.status === 'archived') changeScope('all');
        openEditor({ kind: 'task', sourceIdea });
        setSection('work');
        window.scrollTo({ top: 0 });
      }} /> : <>
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">Data belum dapat dimuat: {errorText(error)}</p>}
      {notice && <p className="text-sm font-medium text-teal-800" role="status">{notice}</p>}

      <section className={panel + ' space-y-3'} aria-label="Kampanye">
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[14rem] flex-1 space-y-1 text-sm font-semibold">Lingkup pekerjaan
            <select className={field} value={scope} onChange={event => changeScope(event.target.value)}>
              <option value="all">Semua pekerjaan</option>
              <option value="standalone">Tanpa kampanye</option>
              {campaignList.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.name}{campaign.status === 'archived' ? ' (arsip)' : ''}</option>)}
            </select>
          </label>
          {campaignQuery.hasNextPage && <button className={button} disabled={campaignQuery.isFetchingNextPage} onClick={() => void campaignQuery.fetchNextPage()}>Muat kampanye lain</button>}
          {canEdit && currentCampaign && <button className={button} onClick={() => openEditor({ kind: 'campaign', row: currentCampaign })}>Edit kampanye</button>}
        </div>
        {currentCampaign && <div className="space-y-2 border-t border-slate-200 pt-3 text-sm">
          <p><strong>{campaignStatuses[currentCampaign.status]}</strong> · PIC: {person(currentCampaign.owner_id)} · {date(currentCampaign.starts_on)} – {date(currentCampaign.ends_on)}</p>
          {currentCampaign.objective && <p className="whitespace-pre-wrap break-words text-slate-600">{currentCampaign.objective}</p>}
          <dl className="grid gap-2 sm:grid-cols-3">
            <div><dt>Anggaran</dt><dd className="font-semibold">{rupiah.format(currentCampaign.budget_idr)}</dd></div>
            <div><dt>Realisasi manual</dt><dd className="font-semibold">{rupiah.format(currentCampaign.spent_idr)}</dd></div>
            <div><dt>Sisa anggaran</dt><dd className={currentCampaign.spent_idr > currentCampaign.budget_idr ? 'font-semibold text-red-700' : 'font-semibold'}>{rupiah.format(currentCampaign.budget_idr - currentCampaign.spent_idr)}</dd></div>
          </dl>
        </div>}
      </section>

      {canEdit && editor?.kind === 'campaign' && <CampaignForm key={editor.row?.id ?? 'new-campaign'} campaign={editor.row} members={members} onCancel={() => setEditor(null)} onSaved={saved} />}
      {canEdit && editor?.kind === 'task' && <TaskForm key={editor.row?.id ?? editor.sourceIdea?.id ?? 'new-task'} task={editor.row} sourceIdea={editor.sourceIdea}
        campaignId={campaignId === 'all' ? null : campaignId} campaignList={campaignList} members={members} onCancel={() => setEditor(null)} onSaved={saved} />}

      <section className={panel + ' space-y-3'} aria-label="Target mingguan">
        <div>
          <h2 className="font-bold">Target minggu ini</h2>
          <p className="text-sm text-slate-600">{date(monday)} – {date(sunday)} · WIB · dihitung dari deadline tugas pada lingkup terpilih</p>
        </div>
        {counts && <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="text-2xl font-bold text-teal-800">{counts.closed} / {counts.target} selesai</p>
            <p className="text-sm text-slate-700">{counts.on_time} tercatat tepat waktu · {counts.target - counts.closed} masih terbuka</p>
          </div>
          {counts.target === 0 && <p className="text-sm text-slate-600">Belum ada tugas dengan deadline minggu ini.</p>}
          <div className="flex flex-wrap gap-2">
            <button className={button} onClick={() => openFocus('week')}>Lihat target minggu ini</button>
            <button className={button} onClick={() => openFocus('overdue')}>{counts.overdue} terlambat</button>
            <button className={button} onClick={() => openFocus('review')}>{counts.review} menunggu review</button>
            <button className={button} onClick={() => openFocus('unplanned')}>{counts.unplanned} tanpa PIC / deadline</button>
          </div>
        </>}
        {!counts && <p className="text-sm text-slate-600">{summaryQuery.isPending ? 'Memuat target…' : 'Target belum tersedia.'}</p>}
      </section>

      <section className={panel + ' space-y-3'} aria-label="Monitoring progress">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-bold">Progress pekerjaan</h2>
          <span className="text-xs text-slate-600">Seluruh lingkup terpilih · tugas dibatalkan tidak dihitung</span>
        </div>
        {counts ? <>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div><dt>Tugas</dt><dd className="text-xl font-bold">{counts.total}</dd></div>
            <div><dt>Selesai</dt><dd className="text-xl font-bold text-teal-800">{counts.done}</dd></div>
            <div><dt>Terhambat</dt><dd className="text-xl font-bold text-amber-800">{counts.blocked}</dd></div>
            <div><dt>Terlambat</dt><dd className="text-xl font-bold text-red-700">{counts.overdue}</dd></div>
          </dl>
          <div className="flex items-center gap-3"><progress className="h-2 flex-1 accent-teal-800" aria-label="Persentase selesai" value={progress} max={100} /><span className="text-sm font-semibold">{progress}%</span></div>
        </> : <p className="text-sm text-slate-600">{summaryQuery.isPending ? 'Memuat progress…' : 'Progress belum tersedia.'}</p>}
      </section>

      <section id="creative-task-list" className={panel + ' space-y-4'} aria-label="Daftar tugas kreatif">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">Daftar tugas</h2>
          <button className={button} aria-pressed={filters.assignee === userId} onClick={() => changeFilter({ assignee: filters.assignee === userId ? '' : userId })}>{filters.assignee === userId ? 'Tampilkan semua PIC' : 'Tugas saya'}</button>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Fokus pekerjaan">
          {(Object.keys(focusLabels) as Focus[]).map(option => <button key={option} aria-pressed={focus === option}
            className={focus === option ? primary : button} onClick={() => chooseFocus(option)}>{focusLabels[option]}</button>)}
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <select className={field} aria-label="Filter platform" value={filters.platform} onChange={event => changeFilter({ platform: event.target.value })}><option value="">Semua platform</option><Options values={platforms} /></select>
          <select className={field} aria-label="Filter status" value={filters.status} onChange={event => changeFilter({ status: event.target.value })}><option value="">Semua status</option><Options values={taskStatuses} /></select>
          <select className={field} aria-label="Filter PIC" value={filters.assignee} onChange={event => changeFilter({ assignee: event.target.value })}>
            <option value="">Semua PIC</option><option value="unassigned">Belum ditugaskan</option>
            {!names.has(userId) && <option value={userId}>Saya</option>}
            {members.map(member => <option key={member.id} value={member.id}>{member.full_name}</option>)}
          </select>
          <select className={field} aria-label="Urutkan tugas" value={filters.order} onChange={event => changeFilter({ order: event.target.value as Filters['order'] })}>
            <option value="due_on">Urutkan deadline</option><option value="publish_on">Urutkan jadwal tayang</option>
          </select>
        </div>
        {taskQuery.isPending && <p role="status" className="text-sm text-slate-600">Memuat tugas…</p>}
        {taskQuery.isSuccess && tasksOnPage.length === 0 && <p className="text-sm text-slate-600">Tidak ada tugas pada halaman dan filter ini.</p>}
        <ul className="divide-y divide-slate-200">
          {tasksOnPage.map(task => {
            const overdue = task.due_on && task.due_on < today && !['done', 'cancelled'].includes(task.status);
            const output = safeOutputUrl(task.output_url);
            return <li key={task.id} className="flex flex-wrap justify-between gap-2 py-3">
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="break-words font-semibold">{task.title}</h3>
                <p className="break-words text-sm text-slate-600">{platforms[task.platform]}{task.format ? ' · ' + task.format : ''} · {person(task.assignee_id)} · {priorities[task.priority]}</p>
                {scope === 'all' && <p className="break-words text-sm text-slate-600">{task.campaign?.name ?? (task.campaign_id ? 'Kampanye terkait' : 'Tanpa kampanye')}</p>}
                <p className="text-sm"><strong>{taskStatuses[task.status]}</strong> · <span className={overdue ? 'font-semibold text-red-700' : ''}>Deadline {date(task.due_on)}{overdue ? ' (terlambat)' : ''}</span> · Tayang {date(task.publish_on)}</p>
                {task.blocker && <p className="break-words text-sm text-amber-800">Hambatan: {task.blocker}</p>}
                {task.brief && <details className="text-sm"><summary className="cursor-pointer text-slate-700">Lihat brief</summary><p className="whitespace-pre-wrap break-words pt-1">{task.brief}</p></details>}
                {task.source_idea && <details className="text-sm"><summary className="cursor-pointer text-slate-700">Ide sumber: {task.source_idea.title}</summary>
                  <ReferenceLinks urls={task.source_idea.reference_urls} />
                </details>}
                {output && <a className="inline-block text-sm font-semibold text-teal-800 underline" href={output} target="_blank" rel="noopener noreferrer">Buka hasil / aset</a>}
              </div>
              {canEdit && <button className={button + ' self-start'} aria-label={'Edit ' + task.title} onClick={() => {
                openEditor({ kind: 'task', row: task });
                requestAnimationFrame(() => document.querySelector('form')?.scrollIntoView({ block: 'center' }));
              }}>Edit</button>}
            </li>;
          })}
        </ul>
        {(page > 0 || (taskQuery.data?.length ?? 0) > PAGE_SIZE) && <div className="flex flex-wrap items-center gap-2">
          <button className={button} disabled={page === 0} onClick={() => setPage(page - 1)}>Sebelumnya</button>
          <span className="text-sm">Halaman {page + 1}</span>
          <button className={button} disabled={(taskQuery.data?.length ?? 0) <= PAGE_SIZE} onClick={() => setPage(page + 1)}>Berikutnya</button>
        </div>}
      </section>
      </>}
    </div>
  </main>;
}
