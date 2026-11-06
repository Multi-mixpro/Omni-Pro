import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, AtSign, BarChart3, Bell, CalendarDays, ClipboardCheck, Command, FileText, Images, LayoutDashboard, Lightbulb, ListTodo, Megaphone, Menu, Plus, RefreshCw, TrendingUp, Users, Wallet } from 'lucide-react';
import { Link, useLocation, useNavigate } from '@/app/router/simpleRouter';
import { signOut } from '@/core/auth/useAuth';
import { ProjectDiscussion } from '../discussion/ProjectDiscussion';
import { isProjectId } from '../discussion/repository';
import { unitSectors, useWorkspaceUnits } from '../data/businessWorkspace';
import { button, CampaignForm, errorText, field, Options, primary, TaskForm } from './CreativeForms';
import { IdeaBank, ReferenceLinks } from './IdeaBank';
import { CreativeOverview } from './CreativeOverview';
import { CreativeAgenda } from './CreativeAgenda';
import { SavedTaskViews } from './SavedTaskViews';
import { CreativeTeamPerformance, WeeklyProgress } from './CreativePerformance';
import { channelSummary, type CalendarEvent } from './channelRepository';
import { publicationTaskId } from './commandRepository';
import { focusLabels, jakartaToday, mondayWeek, type Focus } from './schedule';
import {
  advanceTask, boardTasks, BOARD_PAGE_SIZE, campaigns, campaignStatuses, PAGE_SIZE, platforms, priorities, safeOutputUrl, summary, tasks, taskStatuses, team, workload, workstreams,
  type Campaign, type Filters, type Idea, type Task,
} from './repository';
import './creativeWorkspace.css';

const ChannelHub = lazy(() => import('./ChannelHub').then(module => ({ default: module.ChannelHub })));
const CreativePlanner = lazy(() => import('./CreativePlanner').then(module => ({ default: module.CreativePlanner })));
const CreativeAccounts = lazy(() => import('./CreativeAccounts').then(module => ({ default: module.CreativeAccounts })));
const CreativeInbox = lazy(() => import('./CreativeActions').then(module => ({ default: module.CreativeInbox })));
const CreativeTaskDetail = lazy(() => import('./CreativeActions').then(module => ({ default: module.CreativeTaskDetail })));
const CreativeDecisionQueue = lazy(() => import('./CreativeActions').then(module => ({ default: module.CreativeDecisionQueue })));
const CreativeStudio = lazy(() => import('./CreativeStudio').then(module => ({ default: module.CreativeStudio })));
const CreativeManagement = lazy(() => import('./CreativeManagement').then(module => ({ default: module.CreativeManagement })));
const CreativeAssetLibrary = lazy(() => import('./CreativeAssetLibrary').then(module => ({ default: module.CreativeAssetLibrary })));
const sectionLoading = <p role="status" className="p-4 text-sm text-slate-600">Memuat bagian ini…</p>;

const panel = 'rounded-2xl border border-teal-100 bg-white p-4 shadow-sm';
const defaultFilters: Filters = { platform: '', status: '', assignee: '', workstream: '', order: 'due_on' };
const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'UTC' });
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const date = (value: string | null) => value ? dateFormat.format(new Date(value + 'T00:00:00Z')) : '—';
type Editor = { kind: 'campaign'; row?: Campaign } | { kind: 'task'; row?: Task; sourceIdea?: Idea };
type Section = 'overview' | 'work' | 'campaigns' | 'ideas' | 'ads' | 'calendar' | 'team' | 'accounts' | 'inbox' | 'decisions' | 'studio' | 'analytics' | 'budget' | 'assets';
const navigation = [
  { label: 'Ruang kerja', items: [
    { id: 'overview', label: 'Pusat Kerja', icon: LayoutDashboard },
    { id: 'work', label: 'Produksi & Publikasi', icon: ListTodo },
    { id: 'studio', label: 'Studio Brief & Copy', icon: FileText },
    { id: 'decisions', label: 'Review & Persetujuan', icon: ClipboardCheck },
    { id: 'campaigns', label: 'Campaign Hub', icon: Megaphone },
    { id: 'calendar', label: 'Kalender', icon: CalendarDays },
    { id: 'ideas', label: 'Bank Ide & Aset', icon: Lightbulb },
  ] },
  { label: 'Pengelolaan', items: [
    { id: 'accounts', label: 'Akun & Performa', icon: AtSign },
    { id: 'ads', label: 'Iklan & Evaluasi', icon: TrendingUp },
    { id: 'analytics', label: 'Analitik Creative', icon: BarChart3 },
    { id: 'budget', label: 'Anggaran Kanal', icon: Wallet },
    { id: 'assets', label: 'Pustaka Aset', icon: Images },
    { id: 'inbox', label: 'Kotak Tindakan', icon: Bell },
    { id: 'team', label: 'Tim & PIC', icon: Users },
  ] },
] as const;
const sectionColors: Record<Section, string> = {
  overview: 'blue', work: 'blue', studio: 'pink', decisions: 'green', campaigns: 'orange', calendar: 'red',
  ideas: 'orange', accounts: 'mint', ads: 'pink', inbox: 'red', team: 'blue', analytics: 'pink', budget: 'green', assets: 'mint',
};
const sectionDescriptions: Record<Section, string> = {
  overview: 'Lihat target, jadwal, dan pekerjaan yang perlu ditindak.',
  work: 'Kelola tugas dari brief dan produksi sampai bukti tayang.',
  studio: 'Siapkan brief dan kelola versi naskah dari tugas produksi konten.',
  decisions: 'Buka tugas yang menunggu review atau persetujuan Anda.',
  campaigns: 'Rencanakan kampanye dan pantau pekerjaan yang terkait.',
  calendar: 'Buka tugas dari jadwal deadline, publikasi, dan evaluasi.',
  ideas: 'Simpan ide dan referensi, lalu ubah ide terpilih menjadi tugas.',
  accounts: 'Kelola kanal dan catat data performa akun.',
  ads: 'Pantau aktivitas kanal dan tindak lanjuti hasil evaluasi.',
  inbox: 'Lihat hambatan, keterlambatan, dan permintaan tindak lanjut.',
  team: 'Lihat beban kerja tim dan buka daftar tugas per PIC.',
  analytics: 'Pantau hasil produksi, publikasi aktual, dan evaluasi kanal.',
  budget: 'Bandingkan rencana dan realisasi biaya aktivitas kanal.',
  assets: 'Temukan tautan hasil produksi dan buka tugas asalnya.',
};
const nextAction = {
  todo: { status: 'doing', label: 'Mulai' },
  doing: { status: 'review', label: 'Ajukan review' },
  review: { status: 'ready', label: 'Tandai siap' },
  ready: { status: 'done', label: 'Tandai selesai' },
} as const;
const statusColor: Record<Task['status'], string> = {
  todo: 'bg-slate-100 text-slate-700', doing: 'bg-sky-100 text-sky-800', review: 'bg-indigo-100 text-indigo-800',
  ready: 'bg-teal-100 text-teal-800', done: 'bg-emerald-100 text-emerald-800',
  blocked: 'bg-amber-100 text-amber-900', cancelled: 'bg-slate-100 text-slate-600',
};

function EditorDialog({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} aria-label="Form pekerjaan kreatif" onCancel={event => {
    event.preventDefault();
    if (!ref.current?.querySelector('form[aria-busy="true"]')) onClose();
  }}
    className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-auto rounded-2xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/60">
    {children}
  </dialog>;
}

export default function CreativeWorkspace({ userId, canEdit, canSwitchWorkspace }: {
  userId: string; canEdit: boolean; canSwitchWorkspace: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const client = useQueryClient();
  const [section, setSection] = useState<Section>(() => new URLSearchParams(location.search).get('mine') === '1' ? 'work' : 'overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [taskView, setTaskView] = useState<'list' | 'board'>('board');
  const [adsReview, setAdsReview] = useState('');
  const [adsActivation, setAdsActivation] = useState<string>();
  const [calendarDay, setCalendarDay] = useState<string>();
  const [navigationError,setNavigationError] = useState('');
  const [scope, setScope] = useState('all');
  const [unit, setUnit] = useState(() => {
    const value = new URLSearchParams(location.search).get('unit');
    return value && (value === 'unassigned' || isProjectId(value)) ? value : 'all';
  });
  const [filters, setFilters] = useState(() => ({ ...defaultFilters,
    assignee: new URLSearchParams(location.search).get('mine') === '1' ? userId : '',
  }));
  const [focus, setFocus] = useState<Focus>('all');
  const [page, setPage] = useState(0);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [discussionCampaign, setDiscussionCampaign] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const prefix = ['creative', userId];
  const units = useWorkspaceUnits();
  const unitName = (id?: string | null) => id ? units.data?.find(row => row.id === id)?.name ?? 'Unit bisnis' : 'Belum ditetapkan';
  const defaultUnit = unit !== 'all' && unit !== 'unassigned' ? unit : undefined;
  const today = jakartaToday();
  const { monday, nextMonday } = mondayWeek(today);
  const sunday = new Date(Date.parse(nextMonday + 'T00:00:00Z') - 86_400_000).toISOString().slice(0, 10);
  const campaignQuery = useInfiniteQuery({
    enabled: !['ideas','accounts'].includes(section) || !!editor,
    queryKey: [...prefix, 'campaigns', unit], initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => campaigns(pageParam, signal, unit),
    getNextPageParam: (last, _, lastPage) => last.length > PAGE_SIZE ? lastPage + 1 : undefined,
  });
  const campaignList = campaignQuery.data?.pages.flatMap(rows => rows.slice(0, PAGE_SIZE)) ?? [];
  const currentCampaign = campaignList.find(campaign => campaign.id === scope);
  const campaignId = scope === 'standalone' ? null : scope;
  const teamQuery = useQuery({
    enabled: ['work', 'campaigns', 'ads', 'team', 'accounts'].includes(section) || !!editor,
    queryKey: [...prefix, 'team'], queryFn: ({ signal }) => team(signal), staleTime: 5 * 60_000,
  });
  const members = teamQuery.data ?? [];
  const names = new Map(members.map(member => [member.id, member.full_name]));
  const person = (id: string | null) => id ? names.get(id) ?? 'PIC tidak tersedia' : 'Belum ditugaskan';
  const taskQuery = useQuery({
    enabled: section === 'work' && taskView === 'list',
    queryKey: [...prefix, 'tasks', unit, campaignId, filters, page, focus, today],
    queryFn: ({ signal }) => tasks(campaignId, filters, page, signal, focus, today, unit),
  });
  const boardQuery = useQuery({
    enabled: section === 'work' && taskView === 'board',
    queryKey: [...prefix, 'tasks', 'board', unit, scope, filters, page, focus, today],
    queryFn: ({ signal }) => boardTasks(scope,unit,filters,focus,today,page,signal),
  });
  const visibleQuery = taskView === 'board' ? boardQuery : taskQuery;
  const summaryQuery = useQuery({
    enabled: section === 'overview' || section === 'inbox' || section === 'analytics',
    queryKey: [...prefix, 'summary', unit, campaignId, today], queryFn: ({ signal }) => summary(campaignId, today, signal, unit),
  });
  const counts = summaryQuery.data;
  const group = section === 'team' ? 'team' : 'campaign';
  const performanceScope = group === 'team' ? scope : 'all';
  const performance = useQuery({
    enabled: section === 'team' || section === 'campaigns',
    queryKey: [...prefix,'workload',group,unit,performanceScope,today],
    queryFn: ({ signal }) => workload(group,unit,performanceScope,today,signal),
  });
  const campaignStats = new Map(performance.data?.map(item => [item.subject_id,item]));
  const adsScope = scope === 'standalone' ? 'all' : scope;
  const channels = useQuery({
    enabled: section === 'ads' || (['overview','inbox','analytics','budget'].includes(section) && scope !== 'standalone'),
    queryKey: [...prefix, 'channel-summary', unit, adsScope, today],
    queryFn: ({ signal }) => channelSummary(unit, adsScope, today, signal),
  });
  const overdueEvaluations = channels.data?.reduce((sum, row) => sum + Number(row.overdue), 0) ?? 0;
  const pendingEvaluations = channels.data?.reduce((sum, row) => sum + Number(row.pending_review), 0) ?? 0;
  const loading = campaignQuery.isFetching || visibleQuery.isFetching || summaryQuery.isFetching || teamQuery.isFetching || performance.isFetching || channels.isFetching;
  const error = campaignQuery.error || (section === 'work' ? visibleQuery.error : null) || summaryQuery.error || teamQuery.error;
  const changeScope = (next: string) => { setScope(next); setPage(0); setEditor(null); setNotice(''); setDiscussionCampaign(null); };
  const changeFilter = (values: Partial<Filters>) => { setFilters(current => ({ ...current, ...values })); setPage(0); };
  const chooseFocus = (next: Focus, resetFilters = false) => {
    setFocus(next);
    setPage(0);
    setFilters(current => ({ ...(resetFilters ? defaultFilters : current), status: '', order: next === 'publish' ? 'publish_on' : 'due_on' }));
  };
  const openFocus = (next: Focus) => {
    chooseFocus(next, true);
    setSection('work');
  };
  const openSection = (next: Section, review = '') => {
    if (next === 'ads') {
      setAdsReview(review);
      setAdsActivation(undefined);
      if (scope === 'standalone') changeScope('all');
    }
    if (next === 'calendar') setCalendarDay(undefined);
    setSection(next);
    setMenuOpen(false);
    setNotice('');
    setNavigationError('');
  };
  const openCalendar = (day: string) => { openSection('calendar'); setCalendarDay(day); };
  const openCalendarEvent = async (event: CalendarEvent) => {
    setNavigationError('');
    if (event.kind === 'evaluation') { openSection('ads'); setAdsActivation(event.item_id); return; }
    try { setDetailId(event.kind === 'published' ? await publicationTaskId(event.item_id) : event.item_id); }
    catch (reason) { setNavigationError(errorText(reason)); }
  };
  const openEditor = (next: Editor) => { setEditor(next); setNotice(''); };
  const refresh = () => void client.invalidateQueries({ queryKey: prefix });
  const taskChanged = () => {
    for (const key of ['tasks','task-detail','task-events','publications','summary','calendar','ideas','workload']) {
      void client.invalidateQueries({ queryKey: [...prefix,key] });
    }
    void client.invalidateQueries({ queryKey: ['business-execution',userId] });
  };
  const saved = () => {
    setEditor(null);
    setNotice('Perubahan tersimpan.');
    void client.invalidateQueries({ queryKey: [...prefix, 'tasks'] });
    void client.invalidateQueries({ queryKey: [...prefix, 'summary'] });
    void client.invalidateQueries({ queryKey: [...prefix, 'workload'] });
    void client.invalidateQueries({ queryKey: [...prefix, 'calendar'] });
    if (editor?.kind === 'task') void client.invalidateQueries({ queryKey: [...prefix, 'ideas'] });
    if (editor?.kind === 'task') void client.invalidateQueries({ queryKey: [...prefix, 'task-events'] });
    if (editor?.kind === 'campaign') {
      void client.invalidateQueries({ queryKey: [...prefix, 'campaigns'] });
      void client.invalidateQueries({ queryKey: [...prefix, 'activations'] });
      void client.invalidateQueries({ queryKey: [...prefix, 'channel-summary'] });
    }
    void client.invalidateQueries({ queryKey: ['business-execution', userId] });
  };
  const quickUpdate = useMutation({
    mutationFn: ({ task, status }: { task: Task; status: Exclude<Task['status'], 'blocked'> }) => advanceTask(task, status),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: [...prefix, 'tasks'] }),
        client.invalidateQueries({ queryKey: [...prefix, 'summary'] }),
        client.invalidateQueries({ queryKey: [...prefix, 'workload'] }),
        client.invalidateQueries({ queryKey: [...prefix, 'calendar'] }),
        client.invalidateQueries({ queryKey: [...prefix, 'ideas'] }),
        client.invalidateQueries({ queryKey: [...prefix, 'task-events'] }),
        client.invalidateQueries({ queryKey: [...prefix, 'task-detail'] }),
        client.invalidateQueries({ queryKey: ['business-execution', userId] }),
      ]);
      setNotice('Progres tersimpan.');
    },
  });
  const tasksOnPage = taskQuery.data?.slice(0, PAGE_SIZE) ?? [];
  const boardStatuses: Task['status'][] = ['todo', 'doing', 'review', 'ready', 'blocked', 'done', 'cancelled'];
  const taskGroups = taskView === 'board'
    ? boardStatuses.map(status => {
      const lane = boardQuery.data?.find(row => row.stage === status);
      return { status, rows: lane?.items ?? [], total: Number(lane?.total ?? 0) };
    })
    : [{ status: null, rows: tasksOnPage, total: tasksOnPage.length }];
  const hasNextTasks = taskView === 'board' ? taskGroups.some(group => group.total > (page + 1)*BOARD_PAGE_SIZE) : (taskQuery.data?.length ?? 0) > PAGE_SIZE;
  const activeSection = navigation.flatMap(group => [...group.items]).find(item => item.id === section)?.label;
  const highlights = (currentCampaign ? [currentCampaign] : [...campaignList]
    .filter(item => item.status === 'active' || item.status === 'planned')
    .sort((a,b) => Number(b.status === 'active') - Number(a.status === 'active') ||
      (a.ends_on ?? '9999-12-31').localeCompare(b.ends_on ?? '9999-12-31'))).slice(0,3);

  return <main className="creative-shell min-h-screen px-3 py-4 text-slate-900 sm:px-6 sm:py-6">
    <div className="mx-auto grid max-w-[1536px] gap-4 lg:grid-cols-[228px_minmax(0,1fr)] xl:gap-5">
      <aside className="creative-sidebar self-start space-y-4 rounded-3xl p-3 lg:sticky lg:top-4">
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <div className="flex min-w-0 items-center gap-3"><span className="creative-mark grid h-10 w-10 shrink-0 place-items-center rounded-[13px] text-white"><Command size={19} /></span>
            <div><strong className="block text-slate-900">GG Workspace</strong><span className="creative-sidebar-caption block text-xs">Creative Hub</span></div></div>
          <button type="button" className={button + ' creative-menu-toggle inline-flex items-center gap-1.5 lg:hidden'} aria-expanded={menuOpen} aria-controls="creative-navigation"
            onClick={() => setMenuOpen(!menuOpen)}><Menu size={16} /> {menuOpen ? 'Tutup menu' : 'Menu'}</button>
        </div>
        <nav id="creative-navigation" aria-label="Bagian Creative Dashboard" className={(menuOpen ? 'block' : 'hidden') + ' space-y-3 lg:block'}>
          {navigation.map(group => <div key={group.label} className="space-y-1">
            <p className="creative-nav-label px-2 text-[10px] font-bold uppercase tracking-widest">{group.label}</p>
            {group.items.map(({ id,label,icon:Icon }) => <button key={id} aria-current={section === id ? 'page' : undefined}
              className="creative-nav-item flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold"
              onClick={() => openSection(id)}><span className="creative-color-icon" data-color={sectionColors[id]}><Icon size={15} /></span>{label}</button>)}
          </div>)}
        </nav>
      </aside>
      <div className="min-w-0 space-y-4">
      <header className="creative-toolbar flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-teal-100 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <p className="creative-eyebrow mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><span /> Creative Hub</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{activeSection}</h1>
          <p className="mt-1 text-sm text-slate-600">{sectionDescriptions[section]}</p>
        </div>
        <div className="creative-toolbar-actions flex flex-wrap gap-2">
          {canSwitchWorkspace && <Link to="/launch/app" className={button + ' inline-flex items-center gap-2'}><ArrowLeft size={16} /> Pilih ruang kerja</Link>}
          <button className={button} onClick={async () => { await signOut(); navigate('/launch/login'); }}>Keluar</button>
          <button className={button + ' inline-flex items-center gap-2'} disabled={loading} onClick={refresh}><RefreshCw size={15} /> Segarkan</button>
          {canEdit && section === 'campaigns' && <button className={primary + ' inline-flex items-center gap-2'} onClick={() => openEditor({ kind: 'campaign' })}><Plus size={16} /> Kampanye baru</button>}
          {canEdit && (section === 'overview' || section === 'work' || section === 'studio') && <button className={primary + ' inline-flex items-center gap-2'} disabled={currentCampaign?.status === 'archived'} onClick={() => openEditor({ kind: 'task' })}><Plus size={16} /> Tugas baru</button>}
        </div>
      </header>

      <div className={panel + ' creative-filter'} aria-label="Filter ruang kerja">
        <div className="creative-filter-heading"><strong>Lingkup ruang kerja</strong><span>Pilih unit bisnis dan kampanye yang ingin dilihat.</span></div>
        <div className="creative-filter-fields flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-[1_1_12rem] space-y-1 text-sm font-semibold">Unit bisnis
          <select className={field} value={unit} onChange={event => { setUnit(event.target.value); changeScope('all'); }}>
            <option value="all">Semua unit bisnis</option>
            <option value="unassigned">Unit belum ditetapkan</option>
            {defaultUnit && !units.data?.some(row => row.id === defaultUnit) && <option value={defaultUnit}>Unit terpilih</option>}
            {units.data?.map(row => <option key={row.id} value={row.id}>{row.name} · {unitSectors[row.sector]}{row.is_active ? '' : ' (arsip)'}</option>)}
          </select>
        </label>
        {!['campaigns','accounts','ideas'].includes(section) && <>
          <label className="min-w-0 flex-[1_1_14rem] space-y-1 text-sm font-semibold">Lingkup pekerjaan
            <select className={field} value={scope} onChange={event => changeScope(event.target.value)}>
              <option value="all">Semua pekerjaan</option>
              {section !== 'ads' && <option value="standalone">Tanpa kampanye</option>}
              {campaignList.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.name}{campaign.status === 'archived' ? ' (arsip)' : ''}</option>)}
            </select>
          </label>
          {campaignQuery.hasNextPage && <button className={button} disabled={campaignQuery.isFetchingNextPage} onClick={() => void campaignQuery.fetchNextPage()}>Muat kampanye lain</button>}
        </>}
        {units.isError && <p role="alert" className="w-full text-sm text-red-700">Daftar unit bisnis belum dapat dimuat.</p>}
        </div>
      </div>

      {!canEdit && <p className="text-sm text-slate-600">Akun Anda memiliki akses lihat.</p>}
      {(section === 'analytics' || section === 'budget') && <Suspense fallback={sectionLoading}>
        <CreativeManagement mode={section} counts={section === 'analytics' ? counts : undefined}
          channels={scope === 'standalone' ? undefined : channels.data} standalone={scope === 'standalone'}
          pending={(section === 'analytics' && summaryQuery.isPending) || (scope !== 'standalone' && channels.isPending)}
          error={(section === 'analytics' ? summaryQuery.error : null) ?? (scope === 'standalone' ? null : channels.error)}
          onFocus={openFocus} onAds={() => openSection('ads')} />
      </Suspense>}
      {section === 'assets' && <Suspense fallback={sectionLoading}>
        <CreativeAssetLibrary key={`${unit}:${scope}`} userId={userId} unit={unit} scope={scope} onTask={setDetailId} />
      </Suspense>}
      {section === 'decisions' && <Suspense fallback={sectionLoading}>
        <CreativeDecisionQueue key={`${unit}:${scope}`} userId={userId} unit={unit} scope={scope} onTask={setDetailId} />
      </Suspense>}
      {section === 'studio' && <Suspense fallback={sectionLoading}>
        <CreativeStudio key={`${unit}:${scope}`} userId={userId} unit={unit} campaign={campaignId} canEdit={canEdit}
          onOpen={setDetailId} onEdit={row => openEditor({ kind: 'task', row })} />
      </Suspense>}
      {section === 'ideas' ? <IdeaBank key={unit} unit={unit} userId={userId} canEdit={canEdit} onConvert={sourceIdea => {
        if (currentCampaign?.status === 'archived') changeScope('all');
        openEditor({ kind: 'task', sourceIdea });
        setSection('work');
        window.scrollTo({ top: 0 });
      }} /> : <>
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">Data belum dapat dimuat: {errorText(error)}</p>}
      {navigationError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{navigationError}</p>}
      {notice && <p className="text-sm font-medium text-teal-800" role="status">{notice}</p>}

      {section === 'campaigns' && <section className="space-y-3" aria-label="Daftar kampanye">
        <div><h2 className="text-lg font-bold">Portofolio kampanye</h2><p className="text-sm text-slate-600">Target tugas, PIC, anggaran, dan aksi berikutnya per kampanye.</p></div>
        {performance.isError && <p role="alert" className="text-sm text-rose-800">Target kampanye belum dapat dimuat. Informasi kampanye tetap tersedia.</p>}
        {campaignQuery.isPending && <p role="status" className={panel}>Memuat kampanye…</p>}
        {campaignQuery.isSuccess && !campaignList.length && <p className={panel + ' text-sm text-slate-600'}>Belum ada kampanye pada unit ini.</p>}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {campaignList.map(campaign => <article key={campaign.id} className={panel + ' min-w-0 space-y-3'}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="min-w-0 break-words font-bold">{campaign.name}</h3>
              <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800">{campaignStatuses[campaign.status]}</span>
            </div>
            <p className="text-sm text-slate-600">{unitName(campaign.business_unit_id)} · PIC: {person(campaign.owner_id)}</p>
            <p className="text-xs text-slate-600">{date(campaign.starts_on)} – {date(campaign.ends_on)}</p>
            {performance.data && <WeeklyProgress stats={campaignStats.get(campaign.id) ?? {
              subject_id:campaign.id,week_done:0,week_target:0,open_count:0,review_count:0,blocked_count:0,overdue_count:0,
            }} />}
            {!!campaignStats.get(campaign.id)?.overdue_count && <p className="text-xs font-semibold text-rose-800">{campaignStats.get(campaign.id)?.overdue_count} tugas lewat deadline</p>}
            {campaign.objective && <details className="text-sm"><summary className="cursor-pointer font-medium">Tujuan kampanye</summary><p className="mt-1 whitespace-pre-wrap break-words">{campaign.objective}</p></details>}
            <dl className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-xs">
              <div><dt>Anggaran</dt><dd className="font-semibold">{rupiah.format(campaign.budget_idr)}</dd></div>
              <div><dt>Realisasi</dt><dd className="font-semibold">{rupiah.format(campaign.spent_idr)}</dd></div>
              <div className="col-span-2"><dt>Sisa anggaran</dt><dd className={campaign.spent_idr > campaign.budget_idr ? 'font-semibold text-red-700' : 'font-semibold'}>{rupiah.format(campaign.budget_idr - campaign.spent_idr)}</dd></div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <button className={button + ' inline-flex items-center gap-2'} onClick={() => { changeScope(campaign.id); openFocus('all'); }}>Lihat tugas <ArrowRight size={14} /></button>
              <button className={button} onClick={() => { openSection('ads'); changeScope(campaign.id); }}>Iklan &amp; evaluasi</button>
              <button className={button} aria-expanded={discussionCampaign === campaign.id}
                onClick={() => setDiscussionCampaign(discussionCampaign === campaign.id ? null : campaign.id)}>Diskusi</button>
              {canEdit && <button className={button} onClick={() => openEditor({ kind: 'campaign', row: campaign })}>Edit</button>}
            </div>
            {discussionCampaign === campaign.id && <ProjectDiscussion scope="campaign" projectId={campaign.id} userId={userId} canPost={canEdit} />}
          </article>)}
        </div>
        {campaignQuery.hasNextPage && <button className={button} disabled={campaignQuery.isFetchingNextPage} onClick={() => void campaignQuery.fetchNextPage()}>Muat kampanye lain</button>}
      </section>}

      {canEdit && editor && <EditorDialog onClose={() => setEditor(null)}>
        {editor.kind === 'campaign' ? <CampaignForm key={editor.row?.id ?? 'new-campaign'} campaign={editor.row} defaultUnit={defaultUnit} members={members} onCancel={() => setEditor(null)} onSaved={saved} />
          : <TaskForm key={editor.row?.id ?? editor.sourceIdea?.id ?? 'new-task'} task={editor.row} sourceIdea={editor.sourceIdea}
            campaignId={campaignId === 'all' ? null : campaignId} campaignList={campaignList} defaultUnit={defaultUnit} members={members} onCancel={() => setEditor(null)} onSaved={saved} />}
      </EditorDialog>}

      {section === 'overview' && <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_350px]">
      <div className="min-w-0 space-y-3">
      {counts
        ? <CreativeOverview counts={counts} period={date(monday) + ' – ' + date(sunday)} onFocus={openFocus} />
        : <p role="status" className={panel + ' text-sm text-slate-600'}>{summaryQuery.isPending ? 'Memuat ringkasan…' : 'Ringkasan belum tersedia.'}</p>}
      <div className={panel + ' flex flex-wrap gap-2'} aria-label="Pintasan eksekusi">
        <button className={primary} onClick={() => { chooseFocus('all',true); changeFilter({ assignee:userId }); openSection('work'); }}>Tugas saya</button>
        <button className={button} onClick={() => openFocus('today')}>Deadline hari ini</button>
        <button type="button" className={button} onClick={() => openSection('decisions')}>Review saya</button>
        <button type="button" className={button} onClick={() => openSection('studio')}>Brief &amp; copy</button>
        <button className={button} onClick={() => openFocus('ready')}>Siap tayang</button>
        <button className={button + ' xl:hidden'} onClick={() => openCalendar(today)}>Agenda hari ini</button>
        <button className={button} onClick={() => openSection('inbox')}>Kotak tindakan</button>
      </div>
      {highlights.length > 0 && <section className={panel + ' space-y-2'} aria-label="Sorotan kampanye">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">Sorotan kampanye</h2>
          <button type="button" className="text-sm font-semibold text-teal-800 underline" onClick={() => openSection('campaigns')}>Lihat Campaign Hub</button></div>
        {highlights.map(campaign => <button type="button" key={campaign.id} onClick={() => { changeScope(campaign.id); openFocus('all'); }}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-teal-100 p-3 text-left hover:bg-teal-50">
          <span className="min-w-0"><span className="block break-words text-sm font-bold">{campaign.name}</span>
            <span className="text-xs text-slate-600">{unitName(campaign.business_unit_id)} · {campaignStatuses[campaign.status]} · {campaign.ends_on ? 'Sampai '+date(campaign.ends_on) : 'Tanpa tanggal akhir'}</span></span>
          <ArrowRight size={16} className="shrink-0 text-teal-800" />
        </button>)}
      </section>}

      {scope !== 'standalone' && <section className={panel + ' flex flex-wrap items-center justify-between gap-3'} aria-label="Pengingat evaluasi">
        <div><h2 className="flex items-center gap-2 font-bold"><Bell size={16} /> Pengingat evaluasi kanal</h2>
          <p className="text-sm text-slate-600">{channels.isPending ? 'Memuat pengingat…' : channels.isError ? 'Pengingat belum dapat dimuat.' : `${pendingEvaluations} perlu dievaluasi hingga 7 hari ke depan, termasuk ${overdueEvaluations} terlambat.`}</p></div>
        <button className={button} onClick={() => openSection('ads', overdueEvaluations ? 'overdue' : 'open')}>Buka evaluasi</button>
      </section>}
      </div>
      <CreativeAgenda userId={userId} unit={unit} scope={scope} today={today} onOpenCalendar={openCalendar} onEvent={openCalendarEvent} />
      </div>}

      {section === 'ads' && <Suspense fallback={sectionLoading}>
        {channels.isError && <p role="alert" className="text-sm text-red-700">Ringkasan kanal belum dapat dimuat.</p>}
        <ChannelHub key={unit + ':' + adsScope + ':' + adsReview + ':' + (adsActivation ?? '')} unit={unit} scope={adsScope} userId={userId} today={today}
          canEdit={canEdit} campaigns={campaignList} members={members} overview={channels.data} initialReview={adsReview} initialActivation={adsActivation} onTask={setDetailId} />
      </Suspense>}
      {section === 'calendar' && <Suspense fallback={sectionLoading}><CreativePlanner key={unit + ':' + scope + ':' + (calendarDay ?? '')}
        userId={userId} unit={unit} scope={scope} today={today} initialDay={calendarDay} onEvent={openCalendarEvent} /></Suspense>}
      {section === 'accounts' && <Suspense fallback={sectionLoading}><CreativeAccounts key={unit} userId={userId} unit={unit} today={today} members={members} canEdit={canEdit}
        onActivation={(id, campaignId) => { openSection('ads'); changeScope(campaignId); setAdsActivation(id); }} /></Suspense>}
      {section === 'inbox' && <Suspense fallback={sectionLoading}><CreativeInbox userId={userId} counts={counts}
        evaluations={scope === 'standalone' || !channels.data ? undefined : overdueEvaluations}
        onFocus={openFocus} onAds={() => openSection('ads','overdue')} onTask={setDetailId} onDecisions={() => openSection('decisions')} /></Suspense>}
      {detailId && <EditorDialog onClose={() => setDetailId(null)}><Suspense fallback={sectionLoading}><CreativeTaskDetail key={detailId} taskId={detailId} userId={userId} canEdit={canEdit}
        onClose={() => setDetailId(null)} onChanged={taskChanged} /></Suspense></EditorDialog>}
      {section === 'team' && <CreativeTeamPerformance members={members} stats={performance.data} userId={userId}
        loading={teamQuery.isPending || performance.isPending} failed={teamQuery.isError || performance.isError}
        onSelect={id => { chooseFocus('all',true); changeFilter({ assignee:id }); openSection('work'); }} />}

      {section === 'work' &&
      <section id="creative-task-list" className={panel + ' space-y-4'} aria-label="Daftar tugas kreatif">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="text-lg font-bold">Daftar tugas</h2><p className="text-sm text-slate-600">{focusLabels[focus]} · {filters.assignee === userId ? 'Tugas saya' : 'Lingkup terpilih'}</p></div>
          <div className="flex flex-wrap gap-2">
            <button className={button} aria-pressed={taskView === 'board'} onClick={() => { setTaskView('board'); setPage(0); }}>Kanban</button>
            <button className={button} aria-pressed={taskView === 'list'} onClick={() => { setTaskView('list'); setPage(0); }}>Daftar</button>
            <button className={button} aria-pressed={filters.assignee === userId} onClick={() => changeFilter({ assignee: filters.assignee === userId ? '' : userId })}>{filters.assignee === userId ? 'Tampilkan semua PIC' : 'Tugas saya'}</button>
            <button className={button} aria-expanded={showFilters} aria-controls="creative-task-filters" onClick={() => setShowFilters(!showFilters)}>{showFilters ? 'Tutup filter' : 'Filter lanjutan'}{filters.platform || filters.workstream || filters.status || (filters.assignee && filters.assignee !== userId) ? ' · aktif' : ''}</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Fokus pekerjaan">
          {(Object.keys(focusLabels) as Focus[]).map(option => <button key={option} aria-pressed={focus === option}
            className={focus === option ? primary : button} onClick={() => chooseFocus(option)}>{focusLabels[option]}</button>)}
        </div>
        <SavedTaskViews key={userId} userId={userId} view={{ filters, focus, mode: taskView }} onApply={view => {
          setFilters(view.filters); setFocus(view.focus); setTaskView(view.mode); setPage(0);
        }} />
        {showFilters && <div id="creative-task-filters" className="grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-5">
          <select className={field} aria-label="Filter pos kerja" value={filters.workstream} onChange={event => changeFilter({ workstream: event.target.value })}><option value="">Semua pos kerja</option><Options values={workstreams} /></select>
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
        </div>}
        {visibleQuery.isPending && <p role="status" className="text-sm text-slate-600">Memuat tugas…</p>}
        {visibleQuery.isSuccess && taskGroups.every(group => !group.total) && <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
          <p>Tidak ada tugas untuk pilihan ini.</p>
          <button className={button + ' mt-2'} onClick={() => chooseFocus('all', true)}>Tampilkan semua tugas pada lingkup ini</button>
        </div>}
        {taskView === 'board' && boardQuery.isSuccess && <p className="text-xs text-slate-600">Hitungan mencakup semua tugas pada filter ini. Setiap kolom menampilkan hingga {BOARD_PAGE_SIZE} kartu per halaman.</p>}
        <div className={taskView === 'board' ? 'flex gap-3 overflow-x-auto pb-2' : ''}>
          {taskGroups.map(group => <div key={group.status ?? 'list'} className={group.status ? 'w-72 shrink-0 rounded-xl bg-slate-100 p-2' : ''}>
            {group.status && <h3 className="mb-2 px-1 text-sm font-bold">{taskStatuses[group.status]} · {group.total}</h3>}
            <ul className="space-y-2">
          {group.rows.map(task => {
            const overdue = task.due_on && task.due_on < today && !['done', 'cancelled'].includes(task.status);
            const output = safeOutputUrl(task.output_url);
            const platformNames = [task.platform, ...(task.additional_platforms ?? [])].map(key => platforms[key]).join(', ');
            const assigneeIds = [...(task.assignee_id ? [task.assignee_id] : []), ...(task.additional_assignee_ids ?? [])];
            const publishable = task.platform !== 'internal' && task.workstream !== 'operations' && !task.source_activation_id;
            const waitingForReviewer = task.status === 'review' && task.reviewer_id && task.reviewer_id !== userId;
            const awaitingApproval = task.status === 'ready' && task.approver_id && !task.approved_at;
            const action = task.status in nextAction && !waitingForReviewer && !awaitingApproval && !(task.status === 'ready' && publishable) ? nextAction[task.status as keyof typeof nextAction] : null;
            const updating = quickUpdate.isPending && quickUpdate.variables?.task.id === task.id;
            return <li key={task.id} className={'flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 ' + (taskView === 'list' ? 'sm:flex-row sm:p-4' : '')}>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span className={'rounded-full px-2 py-0.5 text-xs font-semibold ' + statusColor[task.status]}>{taskStatuses[task.status]}</span>
                  {task.priority !== 'normal' && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-800">{priorities[task.priority]}</span>}
                </div>
                <h3 className="break-words font-semibold">{task.title}</h3>
                <p className="break-words text-sm text-slate-600">{workstreams[task.workstream ?? 'creative']} · {platformNames}{task.format ? ' · ' + task.format : ''} · {assigneeIds.length ? assigneeIds.map(person).join(', ') : person(null)}</p>
                {scope === 'all' && <p className="break-words text-sm text-slate-600">{unitName(task.business_unit_id)} · {task.campaign?.name ?? (task.campaign_id ? 'Kampanye terkait' : 'Tanpa kampanye')}</p>}
                <p className="text-sm"><span className={overdue ? 'font-semibold text-red-700' : ''}>Deadline {date(task.due_on)}{overdue ? ' (terlambat)' : ''}</span> · Tayang {date(task.publish_on)}</p>
                {task.reviewer_id && <p className="text-sm text-slate-600">Reviewer: {person(task.reviewer_id)}{task.reviewed_at ? ' · Disetujui' : ''}</p>}
                {awaitingApproval && <p className="text-sm text-amber-800">Menunggu persetujuan {person(task.approver_id ?? null)}</p>}
                {task.blocker && <p className="break-words text-sm text-amber-800">Hambatan: {task.blocker}</p>}
                {task.status === 'doing' && task.review_note && <p className="break-words text-sm text-amber-800">Revisi: {task.review_note}</p>}
                {task.brief && <details className="text-sm"><summary className="cursor-pointer text-slate-700">Lihat brief</summary><p className="whitespace-pre-wrap break-words pt-1">{task.brief}</p></details>}
                {task.source_idea && <details className="text-sm"><summary className="cursor-pointer text-slate-700">Ide sumber: {task.source_idea.title}</summary>
                  <ReferenceLinks urls={task.source_idea.reference_urls} />
                </details>}
                {output && <a className="inline-block text-sm font-semibold text-teal-800 underline" href={output} target="_blank" rel="noopener noreferrer">Buka hasil / aset</a>}
                {quickUpdate.isError && quickUpdate.variables?.task.id === task.id && <p role="alert" className="text-sm text-red-700">{errorText(quickUpdate.error)}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap items-start gap-2">
                {canEdit && action && <button className={primary} disabled={quickUpdate.isPending} aria-label={action.label + ': ' + task.title}
                  onClick={() => { setNotice(''); quickUpdate.mutate({ task, status: action.status }); }}>{updating ? 'Menyimpan…' : action.label}</button>}
                <button className={canEdit && publishable && task.status === 'ready' && !awaitingApproval ? primary : button} onClick={() => setDetailId(task.id)}>{canEdit && publishable && task.status === 'ready' && !awaitingApproval ? 'Catat tayang' : 'Detail'}</button>
                {canEdit && <button className={button} disabled={updating} aria-label={'Edit ' + task.title} onClick={() => openEditor({ kind: 'task', row: task })}>Edit</button>}
              </div>
            </li>;
          })}
            </ul>
            {group.status && !group.rows.length && <p className="px-1 py-2 text-xs text-slate-600">Tidak ada di halaman ini</p>}
          </div>)}
        </div>
        {(page > 0 || hasNextTasks) && <div className="flex flex-wrap items-center gap-2">
          <button className={button} disabled={page === 0} onClick={() => setPage(page - 1)}>Sebelumnya</button>
          <span className="text-sm">Halaman {page + 1}</span>
          <button className={button} disabled={!hasNextTasks} onClick={() => setPage(page + 1)}>Berikutnya</button>
        </div>}
      </section>}
      </>}
      </div>
    </div>
  </main>;
}
