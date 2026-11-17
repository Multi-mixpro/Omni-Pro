import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, AtSign, BarChart3, Bell, CalendarDays, ClipboardCheck, Command, FileText, Images, LayoutDashboard, Lightbulb, ListTodo, Megaphone, Menu, Moon, PanelLeftClose, PanelLeftOpen, Plus, RefreshCw, Repeat, Search, ShieldCheck, Sparkles, Sun, Trash2, TrendingUp, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from '@/app/router/simpleRouter';
import { AccountSignOut } from '@/core/auth/AccountSignOut';
import { supabase } from '@/integrations/supabase/client';
import { ProjectDiscussion } from '../discussion/ProjectDiscussion';
import { isProjectId } from '../discussion/repository';
import { NotificationBell } from '../notifications/NotificationBell';
import { useWorkspaceNotifications } from '../notifications/useWorkspaceNotifications';
import { unitSectors, useWorkspaceUnits } from '../data/businessWorkspace';
import { CommandPalette } from './CommandPalette';
import { button, CampaignForm, errorText, field, Options, primary, TaskForm, type TaskPresetSeed } from './CreativeForms';
import { IdeaBank, ReferenceLinks } from './IdeaBank';
import { CreativeOverview } from './CreativeOverview';
import { CreativeCalendar } from './CreativeCalendar';
import { SavedTaskViews } from './SavedTaskViews';
import { CreativeTeamPerformance, WeeklyProgress } from './CreativePerformance';
import { channelSummary, type CalendarEvent } from './channelRepository';
import { publicationTaskId } from './commandRepository';
import { focusLabels, jakartaToday, mondayWeek, type Focus } from './schedule';
import {
  advanceTask, boardTasks, BOARD_PAGE_SIZE, campaigns, campaignStatuses, isDemoText, outputTypes, PAGE_SIZE, platforms, priorities, purgeCreativeDemoData, removeTask, safeOutputUrl, summary, taskRoutineCategories, taskRoutineModes, tasks, taskStatuses, team, workload, workstreams,
  type Campaign, type Filters, type Idea, type Task,
} from './repository';
import './creativeWorkspace.css';
import './superapp.css';

const ChannelHub = lazy(() => import('./ChannelHub').then(module => ({ default: module.ChannelHub })));
const CreativeAccounts = lazy(() => import('./CreativeAccounts').then(module => ({ default: module.CreativeAccounts })));
const CreativeInbox = lazy(() => import('./CreativeActions').then(module => ({ default: module.CreativeInbox })));
const CreativeTaskDetail = lazy(() => import('./CreativeActions').then(module => ({ default: module.CreativeTaskDetail })));
const CreativeDecisionQueue = lazy(() => import('./CreativeActions').then(module => ({ default: module.CreativeDecisionQueue })));
const CreativeStudio = lazy(() => import('./CreativeStudio').then(module => ({ default: module.CreativeStudio })));
const CreativeManagement = lazy(() => import('./CreativeManagement').then(module => ({ default: module.CreativeManagement })));
const CreativeAssetLibrary = lazy(() => import('./CreativeAssetLibrary').then(module => ({ default: module.CreativeAssetLibrary })));
const CreativeAccess = lazy(() => import('./CreativeAccess').then(module => ({ default: module.CreativeAccess })));
const TaskRoutinesHub = lazy(() => import('./TaskRoutinesHub').then(module => ({ default: module.TaskRoutinesHub })));
const sectionLoading = <p role="status" className="p-4 text-sm text-slate-600">Memuat bagian ini…</p>;

const panel = 'rounded-3xl border border-slate-200/80 bg-white/95 p-4 sm:p-5 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)] backdrop-blur-xs dark:border-slate-800/80 dark:bg-[#111622]/95';
const defaultFilters: Filters = { platform: '', status: '', assignee: '', workstream: '', order: 'due_on' };
const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'UTC' });
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const date = (value: string | null) => value ? dateFormat.format(new Date(value + 'T00:00:00Z')) : '—';
type Editor = { kind: 'campaign'; row?: Campaign } | { kind: 'task'; row?: Task; sourceIdea?: Idea; initialPreset?: TaskPresetSeed };
type Section = 'overview' | 'work' | 'routines' | 'campaigns' | 'ideas' | 'ads' | 'calendar' | 'team' | 'accounts' | 'inbox' | 'decisions' | 'studio' | 'analytics' | 'assets' | 'access';
const navigation = [
  { label: 'Ruang kerja', items: [
    { id: 'overview', label: 'Pusat Kerja', icon: LayoutDashboard },
    { id: 'inbox', label: 'Kotak Tindakan', icon: Bell },
  ] },
  { label: 'Perencanaan', items: [
    { id: 'ideas', label: 'Bank Ide', icon: Lightbulb },
    { id: 'campaigns', label: 'Kampanye', icon: Megaphone },
  ] },
  { label: 'Eksekusi', items: [
    { id: 'work', label: 'Produksi & Publikasi', icon: ListTodo },
    { id: 'routines', label: 'Task & Rutinitas', icon: Repeat },
    { id: 'studio', label: 'Studio Brief & Copy', icon: FileText },
    { id: 'decisions', label: 'Review & Persetujuan', icon: ClipboardCheck },
    { id: 'calendar', label: 'Kalender', icon: CalendarDays },
    { id: 'assets', label: 'Pustaka Aset', icon: Images },
  ] },
  { label: 'Kanal & hasil', items: [
    { id: 'accounts', label: 'Akun & Performa', icon: AtSign },
    { id: 'ads', label: 'Iklan & Evaluasi', icon: TrendingUp },
    { id: 'analytics', label: 'Analitik & Anggaran', icon: BarChart3 },
  ] },
  { label: 'Administrasi', items: [
    { id: 'team', label: 'Tim & PIC', icon: Users },
    { id: 'access', label: 'Pengguna & Hak Akses', icon: ShieldCheck },
  ] },
] as const;
const sectionColors: Record<Section, string> = {
  overview: 'blue', work: 'blue', routines: 'mint', studio: 'pink', decisions: 'green', campaigns: 'orange', calendar: 'red',
  ideas: 'orange', accounts: 'mint', ads: 'pink', inbox: 'red', team: 'blue', analytics: 'pink', assets: 'mint', access: 'mint',
};
const sectionDescriptions: Record<Section, string> = {
  overview: 'Lihat target, jadwal, dan pekerjaan yang perlu ditindak.',
  work: 'Kelola tugas dari brief dan produksi sampai bukti tayang.',
  routines: 'Kelola tugas optimasi platform (Threads, X, IG, TikTok), setup profil, konsep postingan, dan rutinitas operasional di luar ide & konten.',
  studio: 'Siapkan brief dan kelola versi naskah dari tugas produksi konten.',
  decisions: 'Buka tugas yang menunggu review atau persetujuan Anda.',
  campaigns: 'Rencanakan kampanye dan pantau pekerjaan yang terkait.',
  calendar: 'Buka tugas dari jadwal deadline, publikasi, dan evaluasi.',
  ideas: 'Simpan ide dan referensi, lalu ubah ide terpilih menjadi tugas.',
  accounts: 'Kelola kanal dan catat data performa akun.',
  ads: 'Pantau aktivitas kanal dan tindak lanjuti hasil evaluasi.',
  inbox: 'Lihat hambatan, keterlambatan, dan permintaan tindak lanjut.',
  team: 'Lihat beban kerja tim dan buka daftar tugas per PIC.',
  analytics: 'Pantau hasil produksi, publikasi aktual, dan anggaran aktivitas kanal.',
  assets: 'Temukan tautan hasil produksi dan buka tugas asalnya.',
  access: 'Lihat izin akun dan aturan akses ruang kerja Creative.',
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

function EditorDialog({ children, onClose, wide, label = 'Form pekerjaan kreatif' }: { children: ReactNode; onClose: () => void; wide?: boolean; label?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} aria-label={label} onCancel={event => {
    event.preventDefault();
    if (!ref.current?.querySelector('form[aria-busy="true"]')) onClose();
  }}
    className={`m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] overflow-auto rounded-2xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/70 dark:border dark:border-white/10 dark:bg-[#0f1624] dark:text-slate-100 ${wide ? 'max-w-5xl' : 'max-w-2xl'}`}>
    {children}
  </dialog>;
}

export default function CreativeWorkspace({ userId, userName, canEdit, canRemove, canSwitchWorkspace, permissions }: {
  userId: string; userName: string; canEdit: boolean; canRemove: boolean; canSwitchWorkspace: boolean; permissions: string[];
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const isOwnerRole = permissions.includes('launch.admin');
  const visibleNavigation = navigation.map(group => ({
    ...group,
    items: group.items.filter(item => item.id !== 'access' || isOwnerRole),
  })).filter(group => group.items.length > 0);
  const search = new URLSearchParams(location.search);
  const requestedSection = search.get('section');
  const section: Section = visibleNavigation.flatMap(group => [...group.items]).some(item => item.id === requestedSection)
    ? requestedSection as Section : search.get('mine') === '1' ? 'work' : 'overview';
  const setSection = (next: Section) => {
    const params = new URLSearchParams(location.search);
    params.set('section', next);
    navigate(location.pathname + '?' + params.toString());
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCompact, setSidebarCompact] = useState(() => {
    try { return localStorage.getItem('creative-sidebar-compact') === 'true'; } catch { return false; }
  });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [taskView, setTaskView] = useState<'list' | 'board'>('board');
  const [taskSearch, setTaskSearch] = useState('');
  const [campaignSearch, setCampaignSearch] = useState('');
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  const [adsReview, setAdsReview] = useState('');
  const [adsActivation, setAdsActivation] = useState<string>();
  const [calendarDay, setCalendarDay] = useState(jakartaToday);
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
  const [routineFilter, setRoutineFilter] = useState<'all' | 'routine' | 'once'>('all');
  const [page, setPage] = useState(0);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [taskToRemove, setTaskToRemove] = useState<Task | null>(null);
  const [discussionCampaign, setDiscussionCampaign] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.dataset.theme === 'dark');
  useEffect(() => {
    const onThemeChange = (e: Event) => {
      const dark = (e as CustomEvent<{ dark?: boolean }>).detail?.dark;
      if (typeof dark === 'boolean') setIsDarkMode(dark);
    };
    window.addEventListener('gg-theme-change', onThemeChange);
    return () => window.removeEventListener('gg-theme-change', onThemeChange);
  }, []);
  const setAppTheme = (mode: 'light' | 'dark') => {
    window.dispatchEvent(new CustomEvent('gg-theme-request', { detail: { theme: mode } }));
  };
  const prefix = ['creative', userId];
  const notif = useWorkspaceNotifications(userId);
  const units = useWorkspaceUnits();
  const unitName = (id?: string | null) => id ? units.data?.find(row => row.id === id)?.name ?? 'Unit bisnis' : 'Belum ditetapkan';
  const defaultUnit = unit !== 'all' && unit !== 'unassigned' ? unit : undefined;
  const today = jakartaToday();
  const { monday, nextMonday } = mondayWeek(today);
  const sunday = new Date(Date.parse(nextMonday + 'T00:00:00Z') - 86_400_000).toISOString().slice(0, 10);
  const campaignQuery = useInfiniteQuery({
    enabled: !['ideas','accounts','access'].includes(section) || !!editor,
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
    enabled: section === 'ads' || (['overview','inbox','analytics'].includes(section) && scope !== 'standalone'),
    queryKey: [...prefix, 'channel-summary', unit, adsScope, today],
    queryFn: ({ signal }) => channelSummary(unit, adsScope, today, signal),
  });
  const overdueEvaluations = channels.data?.reduce((sum, row) => sum + Number(row.overdue), 0) ?? 0;
  const pendingEvaluations = channels.data?.reduce((sum, row) => sum + Number(row.pending_review), 0) ?? 0;
  const loading = campaignQuery.isFetching || visibleQuery.isFetching || summaryQuery.isFetching || teamQuery.isFetching || performance.isFetching || channels.isFetching;
  const error = (!['ideas','accounts','access'].includes(section) || editor ? campaignQuery.error : null)
    || (section === 'work' ? visibleQuery.error : null)
    || (['overview','inbox','analytics'].includes(section) ? summaryQuery.error : null)
    || (['work','campaigns','ads','team','accounts'].includes(section) || editor ? teamQuery.error : null);
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
    setSection(next);
    setMenuOpen(false);
    setNotice('');
    setNavigationError('');
  };
  const openCalendarEvent = async (event: CalendarEvent) => {
    setNavigationError('');
    if (event.kind === 'evaluation') { openSection('ads'); setAdsActivation(event.item_id); return; }
    try { setDetailId(event.kind === 'published' ? await publicationTaskId(event.item_id) : event.item_id); }
    catch (reason) { setNavigationError(errorText(reason)); }
  };
  const openEditor = (next: Editor) => { setEditor(next); setNotice(''); };
  const refresh = () => {
    void client.invalidateQueries({ queryKey: prefix });
    void client.invalidateQueries({ queryKey: ['creative-copy-library'] });
    void notif.refetch();
  };
  const sectionBadgeCount = (id: Section): { count: number; color: string } => {
    const b = notif.creativeBadges;
    if (!b) return { count: 0, color: 'bg-indigo-600' };
    switch (id) {
      case 'overview':
        return { count: (counts ? counts.overdue + counts.blocked : b.overview), color: 'bg-rose-600' };
      case 'inbox':
        return { count: b.inbox, color: 'bg-rose-600' };
      case 'ideas':
        return { count: b.ideas, color: 'bg-amber-600' };
      case 'campaigns':
        return { count: b.campaigns, color: 'bg-indigo-600' };
      case 'work':
        return { count: b.work, color: 'bg-indigo-600' };
      case 'studio':
        return { count: b.studio, color: 'bg-pink-600' };
      case 'decisions':
        return { count: counts?.review ?? b.decisions, color: 'bg-amber-600' };
      case 'calendar':
        return { count: b.calendar, color: 'bg-sky-600' };
      case 'ads':
        return { count: pendingEvaluations || b.ads, color: overdueEvaluations > 0 ? 'bg-rose-600' : 'bg-indigo-600' };
      default:
        return { count: 0, color: 'bg-teal-700' };
    }
  };
  const taskChanged = () => {
    for (const key of ['tasks','task-detail','task-events','publications','summary','calendar','ideas','workload']) {
      void client.invalidateQueries({ queryKey: [...prefix,key] });
    }
    void client.invalidateQueries({ queryKey: ['business-execution',userId] });
  };
  const saved = () => {
    setEditor(null);
    setNotice('Perubahan tersimpan.');
    taskChanged();
    if (editor?.kind === 'campaign') {
      void client.invalidateQueries({ queryKey: [...prefix, 'campaigns'] });
      void client.invalidateQueries({ queryKey: [...prefix, 'activations'] });
      void client.invalidateQueries({ queryKey: [...prefix, 'channel-summary'] });
    }
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
  const removal = useMutation({
    mutationFn: removeTask,
    onSuccess: () => {
      setTaskToRemove(null);
      setPage(0);
      setNotice('Tugas dihapus dari daftar.');
      refresh();
      void client.invalidateQueries({ queryKey: ['business-execution', userId] });
    },
  });
  const purgeDemo = useMutation({
    mutationFn: purgeCreativeDemoData,
    onSuccess: (res) => {
      setPage(0);
      setNotice(`Data demo/dummy dibersihkan (${res.removedTasks} tugas, ${res.removedIdeas} ide, ${res.removedCampaigns} kampanye).`);
      refresh();
      void client.invalidateQueries({ queryKey: ['business-execution', userId] });
    },
  });
  const autoPurgedRef = useRef(false);
  useEffect(() => {
    if (!canEdit || autoPurgedRef.current) return;
    autoPurgedRef.current = true;
    void purgeCreativeDemoData().then(res => {
      if (res.removedTasks + res.removedIdeas + res.removedCampaigns > 0) {
        void client.invalidateQueries({ queryKey: ['creative', userId] });
        void client.invalidateQueries({ queryKey: ['business-execution', userId] });
      }
    }).catch(() => {});
  }, [canEdit, client, userId]);

  useEffect(() => {
    if (!userId || typeof supabase.channel !== 'function') return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void client.invalidateQueries({ queryKey: ['creative', userId] });
        void client.invalidateQueries({ queryKey: ['business-execution', userId] });
        void client.invalidateQueries({ queryKey: ['creative-copy-library'] });
      }, 450);
    };
    const channel = supabase
      .channel(`creative-live-sync-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creative_tasks' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creative_ideas' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creative_campaigns' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creative_publications' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creative_channel_activations' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creative_copy_library' }, scheduleRefresh)
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [client, userId]);
  const matchTaskFilter = (row: Task) => {
    const isRoutine = Boolean(row.routine_mode && row.routine_mode !== 'once');
    if (routineFilter === 'routine' && !isRoutine) return false;
    if (routineFilter === 'once' && isRoutine) return false;
    const q = taskSearch.trim().toLowerCase();
    if (q) {
      const titleMatch = row.title.toLowerCase().includes(q);
      const briefMatch = (row.brief ?? '').toLowerCase().includes(q);
      const assigneeMatch = (row.assignee_id ? person(row.assignee_id).toLowerCase().includes(q) : false);
      if (!titleMatch && !briefMatch && !assigneeMatch) return false;
    }
    return true;
  };
  const tasksOnPage = (taskQuery.data?.slice(0, PAGE_SIZE) ?? []).filter(matchTaskFilter);
  const boardStatuses: Task['status'][] = ['todo', 'doing', 'review', 'ready', 'blocked', 'done', 'cancelled'];
  const taskGroups = taskView === 'board'
    ? boardStatuses.map(status => {
      const lane = boardQuery.data?.find(row => row.stage === status);
      const filteredRows = (lane?.items ?? []).filter(matchTaskFilter);
      return { status, rows: filteredRows, total: (routineFilter === 'all' && !taskSearch.trim()) ? Number(lane?.total ?? 0) : filteredRows.length };
    })
    : [{ status: null, rows: tasksOnPage, total: tasksOnPage.length }];
  const hasDemoItems = taskGroups.some(group => group.rows.some(row => isDemoText(row.title))) || campaignList.some(c => isDemoText(c.name));
  const hasNextTasks = taskView === 'board' ? taskGroups.some(group => group.total > (page + 1)*BOARD_PAGE_SIZE) : (taskQuery.data?.length ?? 0) > PAGE_SIZE;
  const activeSection = navigation.flatMap(group => [...group.items]).find(item => item.id === section)?.label;
  const highlights = (currentCampaign ? [currentCampaign] : [...campaignList]
    .filter(item => item.status === 'active' || item.status === 'planned')
    .sort((a,b) => Number(b.status === 'active') - Number(a.status === 'active') ||
      (a.ends_on ?? '9999-12-31').localeCompare(b.ends_on ?? '9999-12-31'))).slice(0,3);

  return <main className="creative-shell min-h-screen px-3 py-4 text-slate-900 sm:px-6 sm:py-6">
    <div className="creative-layout mx-auto grid max-w-[1536px] gap-4 xl:gap-5" data-compact={sidebarCompact}>
      <aside className="creative-sidebar self-start space-y-3 overflow-x-hidden rounded-3xl p-3.5 pb-5 lg:sticky lg:top-4" data-mobile-expanded={menuOpen}>
        <div className="creative-sidebar-head flex items-center justify-between gap-2 px-1 py-1">
          <div className="flex min-w-0 items-center gap-2.5"><span className="creative-mark grid h-9 w-9 shrink-0 place-items-center rounded-[12px] text-white"><Command size={17} /></span>
            <div className="creative-nav-label-text min-w-0"><strong className="block truncate text-sm font-bold text-slate-900">GG Workspace</strong><span className="creative-sidebar-caption block truncate text-[11px] font-medium">Creative Hub</span></div></div>
          <button type="button" className={button + ' creative-menu-toggle inline-flex shrink-0 items-center gap-1.5 lg:hidden'} aria-expanded={menuOpen} aria-controls="creative-navigation"
            onClick={() => setMenuOpen(!menuOpen)}><Menu size={16} /> {menuOpen ? 'Ciutkan' : 'Menu'}</button>
          <button type="button" className="creative-sidebar-toggle hidden shrink-0 lg:grid" aria-expanded={!sidebarCompact} aria-controls="creative-navigation"
            aria-label={sidebarCompact ? 'Perluas sidebar' : 'Ciutkan sidebar'} title={sidebarCompact ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            onClick={() => {
              setSidebarCompact(!sidebarCompact);
              try { localStorage.setItem('creative-sidebar-compact', String(!sidebarCompact)); } catch { /* Available for this page. */ }
            }}>{sidebarCompact ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>
        </div>
        <nav id="creative-navigation" aria-label="Bagian Creative Dashboard" className="creative-navigation">
          {visibleNavigation.map(group => <div key={group.label} className="creative-nav-group">
            <p className="creative-nav-label px-2.5 text-[10px] font-bold uppercase tracking-widest">{group.label}</p>
            {group.items.map(({ id,label,icon:Icon }) => {
              const badge = sectionBadgeCount(id);
              return <button key={id} aria-current={section === id ? 'page' : undefined} aria-label={label} title={label}
                className="creative-nav-item relative flex w-full min-w-0 items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left text-[13px] font-semibold"
                onClick={() => openSection(id)}>
                <span className="creative-color-icon shrink-0" data-color={sectionColors[id]}><Icon size={15} /></span>
                <span className="creative-nav-label-text min-w-0 flex-1 truncate">{label}</span>
                {badge.count > 0 && (
                  <span
                    className={`inline-flex shrink-0 min-w-[20px] h-5 items-center justify-center rounded-full px-1.5 text-[10px] font-mono font-extrabold text-white shadow-2xs ${badge.color} ${
                      sidebarCompact ? 'lg:absolute lg:top-0.5 lg:right-0.5 lg:min-w-[16px] lg:h-4 lg:px-1 lg:text-[9px]' : ''
                    }`}
                  >
                    {badge.count > 99 ? '99+' : badge.count}
                  </span>
                )}
              </button>;
            })}
          </div>)}
        </nav>
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
          <div className={`grid gap-1 rounded-full bg-slate-100 p-1 dark:bg-slate-800/80 ${sidebarCompact ? 'lg:grid-cols-1' : 'grid-cols-2'}`} role="group" aria-label="Mode tampilan">
            <button
              type="button"
              onClick={() => setAppTheme('light')}
              aria-pressed={!isDarkMode}
              title="Mode Terang"
              className={`inline-flex items-center justify-center gap-1.5 rounded-full py-1.5 px-2 text-xs font-bold transition-all ${
                !isDarkMode
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Sun size={14} className={!isDarkMode ? 'text-amber-500' : ''} />
              {!sidebarCompact && <span>Terang</span>}
            </button>
            <button
              type="button"
              onClick={() => setAppTheme('dark')}
              aria-pressed={isDarkMode}
              title="Mode Gelap"
              className={`inline-flex items-center justify-center gap-1.5 rounded-full py-1.5 px-2 text-xs font-bold transition-all ${
                isDarkMode
                  ? 'bg-[#1f6feb] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Moon size={14} />
              {!sidebarCompact && <span>Gelap</span>}
            </button>
          </div>
        </div>
      </aside>
      <div className="min-w-0 space-y-3.5">
      <header className="creative-toolbar rounded-2xl border border-slate-200/80 bg-white p-3 sm:px-4 sm:py-3 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-[#111622]">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="creative-eyebrow mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"><span /> Creative Hub</p>
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="text-lg font-extrabold tracking-tight sm:text-xl text-slate-900 dark:text-white">{activeSection}</h1>
              <span className="hidden text-xs text-slate-400 dark:text-slate-600 sm:inline">•</span>
              <p className="text-xs text-slate-600 dark:text-slate-400">{sectionDescriptions[section]}</p>
            </div>
          </div>
          <div className="creative-toolbar-actions flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className={`${button} inline-flex items-center gap-1.5 !py-1.5 !px-3 !text-xs`}
              title="Lompat cepat atau cari (Ctrl + K)"
            >
              <Command size={13} />
              <span className="hidden sm:inline">Cari / Lompat</span>
              <kbd className="hidden md:inline rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:bg-white/[0.08] dark:text-slate-300">Ctrl K</kbd>
            </button>
            <NotificationBell
              items={notif.items}
              countsByCategory={notif.countsByCategory}
              isUnread={notif.isUnread}
              onMarkAsRead={notif.markAsRead}
              onMarkAllAsRead={notif.markAllAsRead}
              onRefresh={() => void notif.refetch()}
              buttonClassName={button + ' relative inline-flex items-center gap-2 !py-1.5 !px-3 !text-xs'}
              onSelectNotification={item => {
                if (item.workspace === 'launch') {
                  if (item.articleId && item.targetSection === 'discussion') {
                    navigate(`/launch/app/projects/${encodeURIComponent(item.articleId)}?view=discussion`);
                  } else if (item.targetSection) {
                    navigate(`/launch/app/${item.targetSection}`);
                  } else {
                    navigate('/launch/app/today');
                  }
                  return;
                }
                if (item.taskId) {
                  setDetailId(item.taskId);
                  return;
                }
                if (item.campaignId) {
                  openSection('campaigns');
                  setDiscussionCampaign(item.campaignId);
                  return;
                }
                if (item.targetSection === 'ads' && item.targetId) {
                  openSection('ads');
                  setAdsActivation(item.targetId);
                  return;
                }
                if (item.targetSection) {
                  openSection(item.targetSection as Section);
                }
              }}
            />
            {canSwitchWorkspace && <Link to="/launch/app" className={button + ' inline-flex items-center gap-1.5 !py-1.5 !px-3 !text-xs'}><ArrowLeft size={14} /> <span className="hidden sm:inline">Pilih ruang kerja</span></Link>}
            <button className={button + ' inline-flex items-center gap-1.5 !py-1.5 !px-3 !text-xs'} disabled={loading} onClick={refresh} title="Segarkan data"><RefreshCw size={13} /> <span className="hidden sm:inline">Segarkan</span></button>
            {(canRemove || canEdit) && hasDemoItems && (
              <button
                type="button"
                className={button + ' !text-rose-700 hover:!bg-rose-50 inline-flex items-center gap-1.5 !py-1.5 !px-3 !text-xs dark:!text-rose-400 dark:hover:!bg-rose-950/40'}
                disabled={purgeDemo.isPending}
                onClick={() => {
                  if (confirm('Bersihkan seluruh tugas, ide, dan kampanye [DEMO] / dummy dari ruang kerja?')) {
                    purgeDemo.mutate();
                  }
                }}
              >
                <Sparkles size={13} />
                <span>{purgeDemo.isPending ? 'Membersihkan…' : 'Bersihkan Data Demo'}</span>
              </button>
            )}
            {canEdit && section === 'campaigns' && <button className={primary + ' inline-flex items-center gap-1.5 !py-1.5 !px-3.5 !text-xs'} onClick={() => openEditor({ kind: 'campaign' })}><Plus size={15} /> Kampanye baru</button>}
            {canEdit && (section === 'overview' || section === 'work') && <button className={primary + ' inline-flex items-center gap-1.5 !py-1.5 !px-3.5 !text-xs'} disabled={currentCampaign?.status === 'archived'} onClick={() => openEditor({ kind: 'task' })}><Plus size={15} /> Tugas baru</button>}
            <AccountSignOut name={userName} className={button + ' inline-flex items-center gap-1.5 !py-1.5 !px-3 !text-xs'} />
          </div>
        </div>

        {/* Sub-bar Filter Lingkup Ruang Kerja Terintegrasi (Tanpa card memanjang terpisah) */}
        {section !== 'access' && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-2.5 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Lingkup:
              </span>
              <label className="inline-flex items-center">
                <span className="sr-only">Unit bisnis</span>
                <select
                  className={`${field} !h-8 !py-1 !px-3 !text-xs !rounded-full bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200 max-w-xs font-semibold`}
                  aria-label="Unit bisnis"
                  value={unit}
                  onChange={event => { setUnit(event.target.value); changeScope('all'); }}
                >
                  <option value="all">Semua unit bisnis</option>
                  <option value="unassigned">Unit belum ditetapkan</option>
                  {defaultUnit && !units.data?.some(row => row.id === defaultUnit) && <option value={defaultUnit}>Unit terpilih</option>}
                  {units.data?.map(row => <option key={row.id} value={row.id}>{row.name} · {unitSectors[row.sector]}{row.is_active ? '' : ' (arsip)'}</option>)}
                </select>
              </label>

              {!['campaigns','accounts','ideas'].includes(section) && (
                <label className="inline-flex items-center">
                  <span className="sr-only">Lingkup pekerjaan</span>
                  <select
                    className={`${field} !h-8 !py-1 !px-3 !text-xs !rounded-full bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200 max-w-xs font-semibold`}
                    aria-label="Lingkup pekerjaan"
                    value={scope}
                    onChange={event => changeScope(event.target.value)}
                  >
                    <option value="all">Semua pekerjaan</option>
                    {section !== 'ads' && <option value="standalone">Tanpa kampanye</option>}
                    {campaignList.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.name}{campaign.status === 'archived' ? ' (arsip)' : ''}</option>)}
                  </select>
                </label>
              )}

              {campaignQuery.hasNextPage && !['campaigns','accounts','ideas'].includes(section) && (
                <button
                  className={`${button} !h-8 !py-1 !px-2.5 !text-xs !rounded-full`}
                  disabled={campaignQuery.isFetchingNextPage}
                  onClick={() => void campaignQuery.fetchNextPage()}
                >
                  + Lebih banyak
                </button>
              )}
            </div>

            {!canEdit && <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Mode lihat saja</span>}
          </div>
        )}
        {units.isError && <p role="alert" className="mt-2 text-xs text-red-700">Daftar unit bisnis belum dapat dimuat.</p>}
      </header>

      {!canEdit && section !== 'access' && <p className="text-sm text-slate-600">Akun Anda memiliki akses lihat.</p>}
      {section === 'access' && <Suspense fallback={sectionLoading}><CreativeAccess permissions={permissions} userName={userName} userId={userId} /></Suspense>}
      {section === 'analytics' && <Suspense fallback={sectionLoading}>
        <CreativeManagement mode="analytics" counts={counts}
          channels={scope === 'standalone' ? undefined : channels.data} standalone={scope === 'standalone'}
          pending={summaryQuery.isPending || (scope !== 'standalone' && channels.isPending)}
          error={summaryQuery.error ?? (scope === 'standalone' ? null : channels.error)}
          onFocus={openFocus} onAds={() => openSection('ads')} />
      </Suspense>}
      {section === 'assets' && <Suspense fallback={sectionLoading}>
        <CreativeAssetLibrary key={`${unit}:${scope}`} userId={userId} unit={unit} scope={scope} onTask={setDetailId} />
      </Suspense>}
      {section === 'decisions' && <Suspense fallback={sectionLoading}>
        <CreativeDecisionQueue key={`${unit}:${scope}`} userId={userId} unit={unit} scope={scope} onTask={setDetailId} />
      </Suspense>}
      {section === 'routines' && <Suspense fallback={sectionLoading}>
        <TaskRoutinesHub
          unit={unit}
          campaignId={campaignId}
          canEdit={canEdit}
          unitName={unitName}
          person={person}
          onOpen={setDetailId}
          onEdit={row => openEditor({ kind: 'task', row })}
          onCreateTask={initialPreset => openEditor({ kind: 'task', initialPreset })}
        />
      </Suspense>}
      {section === 'studio' && <Suspense fallback={sectionLoading}>
        <CreativeStudio key={`${unit}:${scope}`} userId={userId} unit={unit} campaign={campaignId} canEdit={canEdit}
          onOpen={setDetailId} onEdit={row => openEditor({ kind: 'task', row })} />
      </Suspense>}
      {section === 'ideas' ? <IdeaBank key={unit} unit={unit} userId={userId} canEdit={canEdit} onConvert={sourceIdea => {
        changeScope('standalone');
        openEditor({ kind: 'task', sourceIdea });
        setSection('work');
        window.scrollTo({ top: 0 });
      }} /> : <>
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300" role="alert">Data belum dapat dimuat: {errorText(error)}</p>}
      {navigationError && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-300" role="alert">{navigationError}</p>}
      {notice && <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300" role="status">{notice}</p>}

      {section === 'campaigns' && <section className="space-y-3" aria-label="Daftar kampanye">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Portofolio kampanye</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Target tugas, PIC, anggaran, dan aksi berikutnya per kampanye.</p>
          </div>
          <div className="relative min-w-[200px]">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={campaignSearch}
              onChange={e => setCampaignSearch(e.target.value)}
              placeholder="Cari kampanye…"
              aria-label="Cari kampanye"
              className={`${field} !h-8 !rounded-full !pl-8 !pr-3 !py-1 !text-xs`}
            />
          </div>
        </div>
        {performance.isError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">Target kampanye belum dapat dimuat. Informasi kampanye tetap tersedia.</p>}
        {campaignQuery.isPending && <p role="status" className={panel}>Memuat kampanye…</p>}
        {campaignQuery.isSuccess && !campaignList.length && <p className={panel + ' text-sm text-slate-500 dark:text-slate-400'}>Belum ada kampanye pada unit ini.</p>}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {campaignList.filter(c => !campaignSearch.trim() || `${c.name} ${c.objective}`.toLowerCase().includes(campaignSearch.trim().toLowerCase())).map(campaign => <article key={campaign.id} className={panel + ' min-w-0 space-y-3'}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="min-w-0 break-words font-bold text-slate-900 dark:text-slate-100">{campaign.name}</h3>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">{campaignStatuses[campaign.status]}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{unitName(campaign.business_unit_id)} · PIC: {person(campaign.owner_id)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{date(campaign.starts_on)} – {date(campaign.ends_on)}</p>
            {performance.data && <WeeklyProgress stats={campaignStats.get(campaign.id) ?? {
              subject_id:campaign.id,week_done:0,week_target:0,open_count:0,review_count:0,blocked_count:0,overdue_count:0,
            }} />}
            {!!campaignStats.get(campaign.id)?.overdue_count && <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">{campaignStats.get(campaign.id)?.overdue_count} tugas lewat deadline</p>}
            {campaign.objective && <details className="text-sm"><summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">Tujuan kampanye</summary><p className="mt-1 whitespace-pre-wrap break-words text-slate-600 dark:text-slate-400">{campaign.objective}</p></details>}
            <dl className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50/80 p-3 text-xs dark:bg-white/[0.04]">
              <div><dt className="text-slate-500 dark:text-slate-400">Anggaran</dt><dd className="font-semibold text-slate-900 dark:text-slate-100">{rupiah.format(campaign.budget_idr)}</dd></div>
              <div><dt className="text-slate-500 dark:text-slate-400">Realisasi</dt><dd className="font-semibold text-slate-900 dark:text-slate-100">{rupiah.format(campaign.spent_idr)}</dd></div>
              <div className="col-span-2"><dt className="text-slate-500 dark:text-slate-400">Sisa anggaran</dt><dd className={campaign.spent_idr > campaign.budget_idr ? 'font-semibold text-rose-600 dark:text-rose-400' : 'font-semibold text-slate-900 dark:text-slate-100'}>{rupiah.format(campaign.budget_idr - campaign.spent_idr)}</dd></div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <button className={button + ' inline-flex items-center gap-2'} onClick={() => { changeScope(campaign.id); openFocus('all'); }}>Lihat tugas <ArrowRight size={14} /></button>
              <button className={button} onClick={() => { openSection('ads'); changeScope(campaign.id); }}>Iklan &amp; evaluasi</button>
              <button className={button + ' inline-flex items-center gap-1.5'} aria-expanded={discussionCampaign === campaign.id}
                onClick={() => setDiscussionCampaign(discussionCampaign === campaign.id ? null : campaign.id)}>
                <span>Diskusi</span>
                {Boolean(notif.creativeBadges?.campaignDiscussions[campaign.id]) && (
                  <span className="inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-mono font-bold text-white">
                    {notif.creativeBadges?.campaignDiscussions[campaign.id]}
                  </span>
                )}
              </button>
              {canEdit && <button className={button} onClick={() => openEditor({ kind: 'campaign', row: campaign })}>Edit</button>}
            </div>
            {discussionCampaign === campaign.id && <ProjectDiscussion scope="campaign" projectId={campaign.id} userId={userId} canPost={canEdit} />}
          </article>)}
        </div>
        {campaignQuery.hasNextPage && <button className={button} disabled={campaignQuery.isFetchingNextPage} onClick={() => void campaignQuery.fetchNextPage()}>Muat kampanye lain</button>}
      </section>}

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        navItems={navigation.flatMap(group => group.items.map(item => ({ id: item.id, label: item.label, group: group.label })))}
        tasks={taskGroups.flatMap(group => group.rows)}
        campaigns={campaignList}
        isDarkMode={isDarkMode}
        canEdit={canEdit}
        onNavigate={id => openSection(id as Section)}
        onOpenTask={id => setDetailId(id)}
        onCreateTask={() => openEditor({ kind: 'task' })}
        onCreateRoutine={() => { openSection('routines'); openEditor({ kind: 'task', initialPreset: { workstream: 'operations', platform: 'threads', output_type: 'other', routine_mode: 'scheduled_recurring', routine_trigger: 'Setiap Hari (Daily)' } }); }}
        onToggleTheme={() => setAppTheme(isDarkMode ? 'light' : 'dark')}
      />
      {canEdit && editor && <EditorDialog wide={editor.kind === 'task'} onClose={() => setEditor(null)}>
        {editor.kind === 'campaign' ? <CampaignForm key={editor.row?.id ?? 'new-campaign'} campaign={editor.row} defaultUnit={defaultUnit} members={members} onCancel={() => setEditor(null)} onSaved={saved} />
          : <TaskForm key={editor.row?.id ?? editor.sourceIdea?.id ?? editor.initialPreset?.title ?? 'new-task'} task={editor.row} sourceIdea={editor.sourceIdea} initialPreset={editor.initialPreset}
            campaignId={campaignId === 'all' ? null : campaignId} campaignList={campaignList} defaultUnit={defaultUnit} members={members} onCancel={() => setEditor(null)} onSaved={saved} />}
      </EditorDialog>}

      {section === 'overview' && <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,.75fr)]">
      <div className="min-w-0 space-y-3">
      {counts
        ? <CreativeOverview counts={counts} period={date(monday) + ' – ' + date(sunday)} onFocus={openFocus} />
        : <p role="status" className={panel + ' text-sm text-slate-600'}>{summaryQuery.isPending ? 'Memuat ringkasan…' : 'Ringkasan belum tersedia.'}</p>}
      <div className={panel + ' flex flex-wrap gap-2'} aria-label="Pintasan eksekusi">
        <button className={primary} onClick={() => { chooseFocus('all',true); changeFilter({ assignee:userId }); openSection('work'); }}>Tugas saya</button>
        <button type="button" className={button} onClick={() => openSection('routines')}>Task &amp; Rutinitas</button>
        <button type="button" className={button} onClick={() => openSection('decisions')}>Review saya</button>
        <button className={button} onClick={() => openSection('inbox')}>Kotak tindakan</button>
      </div>
      {highlights.length > 0 && <section className={panel + ' space-y-2'} aria-label="Sorotan kampanye">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold text-slate-900 dark:text-slate-100">Sorotan kampanye</h2>
          <button type="button" className="text-xs sm:text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400" onClick={() => openSection('campaigns')}>Lihat kampanye</button></div>
        {highlights.map(campaign => <button type="button" key={campaign.id} onClick={() => { changeScope(campaign.id); openFocus('all'); }}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-indigo-100 p-3 text-left transition-colors hover:bg-indigo-50/70 dark:border-white/[0.07] dark:hover:bg-white/[0.04]">
          <span className="min-w-0"><span className="block break-words text-sm font-bold text-slate-900 dark:text-slate-100">{campaign.name}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{unitName(campaign.business_unit_id)} · {campaignStatuses[campaign.status]} · {campaign.ends_on ? 'Sampai '+date(campaign.ends_on) : 'Tanpa tanggal akhir'}</span></span>
          <ArrowRight size={16} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
        </button>)}
      </section>}

      {scope !== 'standalone' && <section className={panel + ' flex flex-wrap items-center justify-between gap-3'} aria-label="Pengingat evaluasi">
        <div><h2 className="flex items-center gap-2 font-bold"><Bell size={16} /> Pengingat evaluasi kanal</h2>
          <p className="text-sm text-slate-600">{channels.isPending ? 'Memuat pengingat…' : channels.isError ? 'Pengingat belum dapat dimuat.' : `${pendingEvaluations} perlu dievaluasi hingga 7 hari ke depan, termasuk ${overdueEvaluations} terlambat.`}</p></div>
        <button className={button} onClick={() => openSection('ads', overdueEvaluations ? 'overdue' : 'open')}>Buka evaluasi</button>
      </section>}
      </div>
      <CreativeCalendar userId={userId} unit={unit} scope={scope} today={today} selected={calendarDay}
        onSelect={setCalendarDay} onOpenCalendar={() => openSection('calendar')} onEvent={openCalendarEvent} />
      </div>}

      {section === 'ads' && <Suspense fallback={sectionLoading}>
        {channels.isError && <p role="alert" className="text-sm text-red-700">Ringkasan kanal belum dapat dimuat.</p>}
        <ChannelHub key={unit + ':' + adsScope + ':' + adsReview + ':' + (adsActivation ?? '')} unit={unit} scope={adsScope} userId={userId} today={today}
          canEdit={canEdit} campaigns={campaignList} members={members} overview={channels.data} initialReview={adsReview} initialActivation={adsActivation} onTask={setDetailId} />
      </Suspense>}
      {section === 'calendar' && <CreativeCalendar userId={userId} unit={unit} scope={scope} today={today} selected={calendarDay}
        onSelect={setCalendarDay} onEvent={openCalendarEvent} />}
      {section === 'accounts' && <Suspense fallback={sectionLoading}><CreativeAccounts key={unit} userId={userId} unit={unit} today={today} members={members} canEdit={canEdit}
        onActivation={(id, campaignId) => { openSection('ads'); changeScope(campaignId); setAdsActivation(id); }} /></Suspense>}
      {section === 'inbox' && <Suspense fallback={sectionLoading}><CreativeInbox userId={userId} counts={counts}
        evaluations={scope === 'standalone' || !channels.data ? undefined : overdueEvaluations}
        onFocus={openFocus} onAds={() => openSection('ads','overdue')} onTask={setDetailId} onDecisions={() => openSection('decisions')} /></Suspense>}
      {detailId && <EditorDialog onClose={() => setDetailId(null)}><Suspense fallback={sectionLoading}><CreativeTaskDetail key={detailId} taskId={detailId} userId={userId} canEdit={canEdit}
        onClose={() => setDetailId(null)} onChanged={taskChanged} /></Suspense></EditorDialog>}
      {(canRemove || canEdit) && taskToRemove && <EditorDialog label="Hapus tugas kreatif" onClose={() => setTaskToRemove(null)}>
        <form className="space-y-4 p-5 sm:p-6" aria-busy={removal.isPending} onSubmit={event => {
          event.preventDefault();
          if (!removal.isPending) removal.mutate(taskToRemove);
        }}>
          <h2 className="text-lg font-bold">Hapus tugas ini?</h2>
          <p className="break-words text-sm text-slate-700"><strong>{taskToRemove.title}</strong> akan keluar dari daftar aktif. Riwayat dan bukti tayang tetap tersimpan.</p>
          {removal.isError && <p role="alert" className="text-sm text-red-700">{errorText(removal.error)}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" autoFocus className={button} disabled={removal.isPending} onClick={() => {
              if (removal.isError) refresh();
              setTaskToRemove(null);
            }}>Batal</button>
            <button type="submit" className={button + ' !border-red-700 !bg-red-700 !text-white hover:!bg-red-800'} disabled={removal.isPending}>
              {removal.isPending ? 'Menghapus…' : 'Hapus tugas'}
            </button>
          </div>
        </form>
      </EditorDialog>}
      {section === 'team' && <CreativeTeamPerformance members={members} stats={performance.data} userId={userId}
        loading={teamQuery.isPending || performance.isPending} failed={teamQuery.isError || performance.isError}
        onSelect={id => { chooseFocus('all',true); changeFilter({ assignee:id }); openSection('work'); }} />}

      {section === 'work' &&
      <section id="creative-task-list" className={panel + ' space-y-4'} aria-label="Daftar tugas kreatif">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">Daftar tugas</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{focusLabels[focus]} · {filters.assignee === userId ? 'Tugas saya' : 'Lingkup terpilih'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={taskSearch}
                onChange={e => setTaskSearch(e.target.value)}
                placeholder="Cari judul atau PIC…"
                aria-label="Cari tugas"
                className={`${field} !h-8 !rounded-full !pl-8 !pr-3 !py-1 !text-xs`}
              />
            </div>
            <button className={button} aria-pressed={filters.workstream === 'creative'} onClick={() => changeFilter({ workstream: filters.workstream === 'creative' ? '' : 'creative' })}>
              {filters.workstream === 'creative' ? 'Fokus Produksi' : 'Semua Pos'}
            </button>
            <button className={button} aria-pressed={taskView === 'board'} onClick={() => { setTaskView('board'); setPage(0); }}>Kanban</button>
            <button className={button} aria-pressed={taskView === 'list'} onClick={() => { setTaskView('list'); setPage(0); }}>Daftar</button>
            <button className={button} aria-pressed={filters.assignee === userId} onClick={() => changeFilter({ assignee: filters.assignee === userId ? '' : userId })}>{filters.assignee === userId ? 'Semua PIC' : 'Tugas saya'}</button>
            <button className={button} aria-expanded={showFilters} aria-controls="creative-task-filters" onClick={() => setShowFilters(!showFilters)}>{showFilters ? 'Tutup filter' : 'Filter'}{filters.platform || filters.workstream || filters.status || (filters.assignee && filters.assignee !== userId) ? ' · aktif' : ''}</button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap gap-1.5" aria-label="Fokus pekerjaan">
            {(Object.keys(focusLabels) as Focus[]).map(option => <button key={option} aria-pressed={focus === option}
              className={(focus === option ? primary : button) + ' !py-1 !px-3 !text-xs'} onClick={() => chooseFocus(option)}>{focusLabels[option]}</button>)}
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/70 p-1 text-xs dark:border-slate-800 dark:bg-slate-900/70">
            <button
              type="button"
              onClick={() => setRoutineFilter('all')}
              className={`rounded-full px-3 py-1 font-semibold transition-all ${routineFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setRoutineFilter('routine')}
              className={`rounded-full px-3 py-1 font-semibold transition-all ${routineFilter === 'routine' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
            >
              Rutinitas
            </button>
            <button
              type="button"
              onClick={() => setRoutineFilter('once')}
              className={`rounded-full px-3 py-1 font-semibold transition-all ${routineFilter === 'once' ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
            >
              1x Buat
            </button>
          </div>
        </div>
        <SavedTaskViews key={userId} userId={userId} view={{ filters, focus, mode: taskView }} onApply={view => {
          setFilters(view.filters); setFocus(view.focus); setTaskView(view.mode); setPage(0);
        }} />
        {showFilters && <div id="creative-task-filters" className="grid grid-cols-1 gap-2.5 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 sm:grid-cols-2 lg:grid-cols-5 dark:border-slate-800 dark:bg-slate-900/50">
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
        {visibleQuery.isPending && <p role="status" className="text-sm text-slate-600 dark:text-slate-400">Memuat tugas…</p>}
        {visibleQuery.isSuccess && taskGroups.every(group => !group.total) && <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
          <p className="font-medium">Tidak ada tugas untuk pilihan ini.</p>
          <button className={button + ' mt-3'} onClick={() => { setTaskSearch(''); chooseFocus('all', true); }}>Tampilkan semua tugas</button>
        </div>}
        {taskView === 'board' && boardQuery.isSuccess && <p className="text-xs text-slate-500 dark:text-slate-400">Menampilkan hingga {BOARD_PAGE_SIZE} tugas per kolom stage.</p>}
        <div className={taskView === 'board' ? 'flex gap-3.5 overflow-x-auto pb-3 snap-x' : ''}>
          {taskGroups.map(group => {
            const dotColor = group.status === 'doing' ? 'bg-blue-500'
              : group.status === 'review' ? 'bg-amber-500'
              : group.status === 'ready' ? 'bg-teal-500'
              : group.status === 'done' ? 'bg-emerald-500'
              : group.status === 'blocked' ? 'bg-rose-500'
              : 'bg-slate-400';
            return <div key={group.status ?? 'list'} className={group.status ? 'w-[18.5rem] shrink-0 snap-start rounded-2xl border border-slate-200/70 bg-slate-100/70 p-2.5 dark:border-slate-800/80 dark:bg-slate-900/50' : ''}>
            {group.status && <div className="mb-2.5 flex items-center justify-between px-1.5">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">{taskStatuses[group.status]}</h3>
              </div>
              <span className="rounded-full bg-white/90 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-600 shadow-2xs dark:bg-slate-800 dark:text-slate-300">{group.total}</span>
            </div>}
            <ul className="space-y-2.5">
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
            const hasAttachment = Boolean(
              task.copy_template_id ||
              output ||
              (task.source_idea?.reference_urls && task.source_idea.reference_urls.length > 0) ||
              (typeof task.creative_brief?.references === 'string' && /https?:\/\//i.test(task.creative_brief.references))
            );
            return <li key={task.id} data-status={task.status} className={'creative-task-card flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-[#111622] ' + (taskView === 'list' ? 'sm:flex-row sm:p-4' : '')}>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={'rounded-full px-2 py-0.5 text-[11px] font-bold ' + statusColor[task.status]}>{taskStatuses[task.status]}</span>
                  {task.output_type && task.output_type !== 'other' && (
                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                      {outputTypes[task.output_type] ?? task.output_type}
                    </span>
                  )}
                  {hasAttachment && (
                    <button
                      type="button"
                      onClick={() => setDetailId(task.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-blue-200/80 bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                      title="Buka lampiran naskah / referensi di detail tugas"
                    >
                      📎 Lampiran
                    </button>
                  )}
                  {task.routine_mode && task.routine_mode !== 'once' && (
                    <span className="rounded-full border border-indigo-200/80 bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
                      🔁 {task.routine_category ? taskRoutineCategories[task.routine_category] : taskRoutineModes[task.routine_mode]}
                    </span>
                  )}
                  {Boolean(task.routine_runs && task.routine_runs > 0) && (
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                      ✓ {task.routine_runs}x
                    </span>
                  )}
                  {task.priority !== 'normal' && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">{priorities[task.priority]}</span>}
                  {Boolean(notif.creativeBadges?.taskDiscussions[task.id]) && (
                    <button
                      type="button"
                      onClick={() => setDetailId(task.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs font-bold text-indigo-800 hover:bg-indigo-100"
                    >
                      💬 {notif.creativeBadges?.taskDiscussions[task.id]} diskusi
                    </button>
                  )}
                </div>
                <h3 className="break-words text-[14.5px] font-bold leading-snug text-slate-900 dark:text-slate-50">{task.title}</h3>
                {task.routine_mode && task.routine_mode !== 'once' && (task.routine_trigger || task.routine_target) && (
                  <p className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-2.5 py-1.5 text-xs font-medium text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200">
                    <strong>Rutinitas:</strong> {task.routine_trigger || taskRoutineModes[task.routine_mode]}
                    {task.routine_target ? ` · Target: ${task.routine_target}` : ''}
                  </p>
                )}
                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <p className="break-words">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{assigneeIds.length ? assigneeIds.map(person).join(', ') : person(null)}</span>
                    {' · '}{platformNames}{task.format ? ` (${task.format})` : ''}
                  </p>
                  {scope === 'all' && (
                    <p className="break-words text-[11.5px] text-slate-500 dark:text-slate-400">
                      {unitName(task.business_unit_id)} · {task.campaign?.name ?? (task.campaign_id ? 'Kampanye terkait' : 'Tanpa kampanye')}
                    </p>
                  )}
                  {(!task.routine_mode || task.routine_mode === 'once' || task.due_on || task.publish_on) ? (
                    <p className="text-[11.5px]">
                      <span className={overdue ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}>
                        Deadline {date(task.due_on)}{overdue ? ' (terlambat)' : ''}
                      </span>
                      <span className="mx-1 text-slate-300 dark:text-slate-600">•</span>
                      <span>Tayang {date(task.publish_on)}</span>
                    </p>
                  ) : (
                    <p className="text-[11.5px] font-medium text-indigo-600 dark:text-indigo-300">
                      Jadwal berulang: {task.routine_trigger || taskRoutineModes[task.routine_mode]}
                    </p>
                  )}
                </div>
                {task.reviewer_id && <p className="text-[11.5px] text-slate-500 dark:text-slate-400">Reviewer: {person(task.reviewer_id)}{task.reviewed_at ? ' · Disetujui' : ''}</p>}
                {awaitingApproval && <p className="rounded-lg bg-amber-50/80 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">Menunggu persetujuan {person(task.approver_id ?? null)}</p>}
                {task.blocker && <p className="break-words rounded-lg bg-rose-50/80 px-2 py-1 text-xs font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">Hambatan: {task.blocker}</p>}
                {task.status === 'doing' && task.review_note && <p className="break-words rounded-lg bg-amber-50/80 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">Revisi: {task.review_note}</p>}
                {task.brief && <details className="text-xs"><summary className="cursor-pointer font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">Lihat ringkasan brief</summary><p className="whitespace-pre-wrap break-words pt-1.5 leading-relaxed text-slate-700 dark:text-slate-300">{task.brief}</p></details>}
                {task.source_idea && <details className="text-xs"><summary className="cursor-pointer font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">Ide sumber: {task.source_idea.title}</summary>
                  <ReferenceLinks urls={task.source_idea.reference_urls} />
                </details>}
                {output && <a className="inline-block text-xs font-semibold text-blue-600 underline hover:text-blue-700 dark:text-blue-400" href={output} target="_blank" rel="noopener noreferrer">Buka hasil / aset</a>}
                {quickUpdate.isError && quickUpdate.variables?.task.id === task.id && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{errorText(quickUpdate.error)}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5 dark:border-slate-800/80 sm:border-t-0 sm:pt-0">
                {canEdit && action && <button className={primary + ' !py-1 !px-3 !text-xs'} disabled={quickUpdate.isPending} aria-label={action.label + ': ' + task.title}
                  onClick={() => { setNotice(''); quickUpdate.mutate({ task, status: action.status }); }}>{updating ? 'Menyimpan…' : action.label}</button>}
                <button className={(canEdit && publishable && task.status === 'ready' && !awaitingApproval ? primary : button) + ' !py-1 !px-3 !text-xs'} onClick={() => setDetailId(task.id)}>{canEdit && publishable && task.status === 'ready' && !awaitingApproval ? 'Catat tayang' : 'Detail'}</button>
                {canEdit && <button className={button + ' !py-1 !px-2.5 !text-xs'} disabled={updating} aria-label={'Edit ' + task.title} onClick={() => openEditor({ kind: 'task', row: task })}>Edit</button>}
                {(canRemove || (canEdit && isDemoText(task.title))) && <button className={button + ' inline-flex items-center gap-1 !py-1 !px-2.5 !text-xs !text-rose-600 hover:!bg-rose-50 dark:!text-rose-400 dark:hover:!bg-rose-950/40'} disabled={updating}
                  aria-label={'Hapus ' + task.title} onClick={() => { removal.reset(); setNotice(''); setTaskToRemove(task); }}><Trash2 size={13} aria-hidden="true" /></button>}
              </div>
            </li>;
          })}
            </ul>
            {group.status && !group.rows.length && <p className="px-1 py-2 text-xs text-slate-500 dark:text-slate-400">Tidak ada di halaman ini</p>}
          </div>;
          })}
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
