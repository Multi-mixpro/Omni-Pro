/**
 * Product Launch OS 3.0 - Main Application Controller
 */

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { SaveStatus, SaveState } from './components/shared/SaveStatus';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { ArticleStickyHeader } from './components/article/ArticleStickyHeader';
import { FloatingChatBubble } from './components/shared/FloatingChatBubble';

const DashboardView = React.lazy(() => import('./components/dashboard/DashboardView').then(m => ({ default: m.DashboardView })));
const ArticlePipelineView = React.lazy(() => import('./components/pipeline/ArticlePipelineView').then(m => ({ default: m.ArticlePipelineView })));
const QuickCreateModal = React.lazy(() => import('./components/pipeline/QuickCreateModal').then(m => ({ default: m.QuickCreateModal })));
const GlobalSearchModal = React.lazy(() => import('./components/modals/GlobalSearchModal').then(m => ({ default: m.GlobalSearchModal })));
const ArticleBriefView = React.lazy(() => import('./components/article/ArticleBriefView').then(m => ({ default: m.ArticleBriefView })));
const ArticleDetailView = React.lazy(() => import('./components/article/ArticleDetailView').then(m => ({ default: m.ArticleDetailView })));
const ArticleWorkspaceView = React.lazy(() => import('./components/workspace/ArticleWorkspaceView').then(m => ({ default: m.ArticleWorkspaceView })));
const ArticleImplementationView = React.lazy(() => import('./components/implementation/ArticleImplementationView').then(m => ({ default: m.ArticleImplementationView })));
const MasterDataView = React.lazy(() => import('./components/master/MasterDataView').then(m => ({ default: m.MasterDataView })));
const ApprovalsView = React.lazy(() => import('./components/approvals/ApprovalsView').then(m => ({ default: m.ApprovalsView })));
const TasksView = React.lazy(() => import('./components/tasks/TasksView').then(m => ({ default: m.TasksView })));
const CalendarView = React.lazy(() => import('./components/calendar/CalendarView').then(m => ({ default: m.CalendarView })));
const ReportsView = React.lazy(() => import('./components/reports/ReportsView').then(m => ({ default: m.ReportsView })));

import { StorageService } from './services/storage';
import { isAllBusinessUnits } from './services/businessUnits';
import { uploadArticleMedia } from './services/media';
import { compressImageForUpload } from './utils/cloudinary';
import { deriveArticleIndicators } from './utils/calculations';
import { useLocation, useNavigate } from '@/app/router/simpleRouter';
import { signOut } from '@/core/auth/useAuth';
import {
  Article,
  Supplier,
  MaterialMaster,
  ServiceMaster,
  TaskItem,
  BlockerItem,
  DecisionRequest,
  ProgressUpdate,
  ApprovalGate,
  BusinessUnit,
} from './types';

interface PatenAppProps {
  currentUser?: {
    id: string;
    name: string;
    jobTitle?: string | null;
    avatarUrl?: string | null;
  };
  permissions?: string[];
}

type PatenTab =
  | 'dashboard'
  | 'pipeline'
  | 'workspace'
  | 'implementation'
  | 'brief'
  | 'detail'
  | 'master'
  | 'approvals'
  | 'tasks'
  | 'calendar'
  | 'reports';

function routeState(pathname: string, search: string): { tab: PatenTab; articleId?: string } {
  const articleMatch = pathname.match(/^\/launch\/app\/projects\/([^/]+)/);
  if (articleMatch) {
    const view = new URLSearchParams(search).get('view');
    const tab: PatenTab = view === 'brief' ? 'brief' : view === 'detail' ? 'detail' : 'workspace';
    return { tab, articleId: decodeURIComponent(articleMatch[1]) };
  }
  const implementationMatch = pathname.match(/^\/launch\/app\/implementation\/([^/]+)/);
  if (implementationMatch) return { tab: 'implementation', articleId: decodeURIComponent(implementationMatch[1]) };
  if (pathname.includes('/projects')) return { tab: 'pipeline' };
  if (pathname.includes('/approvals')) return { tab: 'approvals' };
  if (pathname.includes('/tasks')) return { tab: 'tasks' };
  if (pathname.includes('/calendar')) return { tab: 'calendar' };
  if (pathname.includes('/master')) return { tab: 'master' };
  if (pathname.includes('/reports')) return { tab: 'reports' };
  return { tab: 'dashboard' };
}

export default function App({ currentUser, permissions = [] }: PatenAppProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const initialRoute = routeState(location.pathname, location.search);
  const canEdit = permissions.some((permission) =>
    ['launch.edit', 'launch.admin'].includes(permission),
  );
  const canCreate = permissions.some((permission) =>
    ['launch.create', 'launch.edit', 'launch.admin'].includes(permission),
  );
  const stageOrder: Article['stage'][] = [
    'Prospect',
    'Specification',
    'Source & Pattern',
    'Sampling',
    'Costing',
    'Production Plan',
    'Production',
    'Launch',
  ];

  const requiredGateForStage: Partial<Record<Article['stage'], ApprovalGate['gateType']>> = {
    Sampling: 'Specification Approval',
    'Production Plan': 'Sample Approval',
    Production: 'Production Release',
    Launch: 'Launch Approval',
  };
  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState<PatenTab>(initialRoute.tab);

  const [selectedUnit, setSelectedUnit] = useState<BusinessUnit>('Semua Unit Bisnis');
  const [selectedArticleId, setSelectedArticleId] = useState<string>(initialRoute.articleId || '');
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [showGlobalSearchModal, setShowGlobalSearchModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Persistence Data States
  const [articles, setArticles] = useState<Article[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<MaterialMaster[]>([]);
  const [services, setServices] = useState<ServiceMaster[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [blockers, setBlockers] = useState<BlockerItem[]>([]);
  const [decisions, setDecisions] = useState<DecisionRequest[]>([]);
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [approvals, setApprovals] = useState<ApprovalGate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tandai proses autosave: 'saving' -> 'saved' (auto kembali ke idle) atau 'error'.
  const trackSave = <T,>(promise: Promise<T>): Promise<T> => {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setSaveState('saving');
    return promise.then(
      (value) => {
        setSaveState('saved');
        savedTimerRef.current = setTimeout(() => setSaveState('idle'), 2200);
        return value;
      },
      (reason) => {
        setSaveState('error');
        throw reason;
      },
    );
  };

  useEffect(() => () => {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
  }, []);

  const tabUrl = (tab: PatenTab, articleId = selectedArticleId) => {
    if (tab === 'dashboard') return '/launch/app/today';
    if (tab === 'pipeline') return '/launch/app/projects';
    if (tab === 'implementation') return articleId ? `/launch/app/implementation/${encodeURIComponent(articleId)}` : '/launch/app/implementation';
    if (tab === 'workspace' || tab === 'brief' || tab === 'detail') {
      return articleId
        ? `/launch/app/projects/${encodeURIComponent(articleId)}?view=${tab}`
        : '/launch/app/projects';
    }
    return `/launch/app/${tab}`;
  };

  const selectTab = (tab: PatenTab, articleId?: string) => {
    const nextArticleId = articleId || selectedArticleId;
    if (articleId) setSelectedArticleId(articleId);
    setActiveTab(tab);
    navigate(tabUrl(tab, nextArticleId));
  };

  useEffect(() => {
    const next = routeState(location.pathname, location.search);
    setActiveTab(next.tab);
    if (next.articleId) setSelectedArticleId(next.articleId);
  }, [location.pathname, location.search]);

  // Load Supabase data and keep every PATEN screen in realtime sync.
  useEffect(() => {
    let active = true;

    const reload = async () => {
      try {
        const snapshot = await StorageService.loadWorkspace();
        if (!active) return;
        setArticles(snapshot.articles.map(deriveArticleIndicators));
        setSuppliers(snapshot.suppliers);
        setMaterials(snapshot.materials);
        setServices(snapshot.services);
        setTasks(snapshot.tasks);
        setBlockers(snapshot.blockers);
        setDecisions(snapshot.decisions);
        setUpdates(snapshot.updates);
        setApprovals(snapshot.approvals);
        setSyncError(null);
      } catch (reason) {
        if (!active) return;
        setSyncError(
          reason instanceof Error
            ? reason.message
            : 'Data workspace belum dapat dimuat dari database.',
        );
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void reload();
    const unsubscribeRealtime = StorageService.subscribe(() => void reload());
    const unsubscribeErrors = StorageService.subscribeErrors(setSyncError);

    return () => {
      active = false;
      unsubscribeRealtime();
      unsubscribeErrors();
    };
  }, []);

  // Keyboard shortcut Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearchModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync Article Changes
  const handleUpdateArticle = (updatedArticle: Article) => {
    if (!canEdit) {
      setSyncError('Akun Anda hanya memiliki akses lihat. Perubahan tidak disimpan.');
      return;
    }
    const currentArticle = articles.find((article) => article.id === updatedArticle.id);
    const isAdvancing = currentArticle
      && stageOrder.indexOf(updatedArticle.stage) > stageOrder.indexOf(currentArticle.stage);
    const requiredGate = requiredGateForStage[updatedArticle.stage];
    if (
      isAdvancing
      && requiredGate
      && !approvals.some((approval) =>
        approval.articleId === updatedArticle.id
        && approval.gateType === requiredGate
        && approval.status === 'Approved')
    ) {
      setSyncError(`Stage ${updatedArticle.stage} memerlukan ${requiredGate} yang sudah disetujui.`);
      return;
    }
    const derivedArticle = deriveArticleIndicators(updatedArticle);
    const previous = articles;
    const newArticles = articles.map((a) =>
      a.id === derivedArticle.id ? derivedArticle : a
    );
    setArticles(newArticles);
    void trackSave(StorageService.saveArticles(newArticles)).catch(() => setArticles(previous));
  };

  const handleCreateArticle = (newArticle: Article) => {
    if (!canCreate) {
      setSyncError('Anda tidak memiliki izin membuat artikel.');
      return;
    }
    const previous = articles;
    const createdArticle = deriveArticleIndicators(newArticle);
    const updated = [createdArticle, ...articles];
    setArticles(updated);
    void StorageService.saveArticles(updated).catch(() => setArticles(previous));
    selectTab('workspace', createdArticle.id);
  };

  const handleDeleteArticle = (articleId: string) => {
    if (!canEdit) {
      setSyncError('Akun Anda hanya memiliki akses lihat. Artikel tidak dihapus.');
      return;
    }
    const previous = articles;
    const remaining = articles.filter((article) => article.id !== articleId);
    if (remaining.length === previous.length) return;
    setArticles(remaining);
    // persistCollection menulis tombstone (is_deleted) untuk id yang hilang.
    void StorageService.saveArticles(remaining).catch(() => setArticles(previous));
    if (selectedArticleId === articleId) {
      selectTab('pipeline');
    }
  };

  const handleAddProgressUpdate = (newUpdate: ProgressUpdate) => {
    if (!canEdit) return;
    const previous = updates;
    const updated = [newUpdate, ...updates];
    setUpdates(updated);
    void StorageService.saveUpdates(updated).catch(() => setUpdates(previous));
  };

  const handleUpdateApproval = (updatedApproval: ApprovalGate) => {
    if (!canEdit) return;
    const previous = approvals;
    const updated = approvals.map((a) =>
      a.id === updatedApproval.id ? updatedApproval : a
    );
    setApprovals(updated);
    void StorageService.saveApprovals(updated).catch(() => setApprovals(previous));

    // Approval updates article counters, while stage movement remains explicit and gated.
    if (updatedApproval.articleCode) {
      const relatedArt = articles.find((a) => a.code === updatedApproval.articleCode);
      if (relatedArt) {
        const newArt: Article = {
          ...relatedArt,
          pendingApprovalCount: updated.filter(
            (approval) => approval.articleId === relatedArt.id && approval.status === 'Pending',
          ).length,
          lastUpdated: new Date().toISOString().split('T')[0],
        };
        handleUpdateArticle(newArt);
      }
    }
  };

  const handleCreateApprovalRequest = (newApproval: ApprovalGate) => {
    if (!canEdit) return;
    const previous = approvals;
    const updated = [newApproval, ...approvals];
    setApprovals(updated);
    void StorageService.saveApprovals(updated).catch(() => setApprovals(previous));
  };

  // Task & Blocker Handlers
  const handleUpdateTask = (updatedTask: TaskItem) => {
    if (!canEdit) return;
    const previous = tasks;
    const updated = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    setTasks(updated);
    void StorageService.saveTasks(updated).catch(() => setTasks(previous));
  };

  const handleCreateTask = (newTask: TaskItem) => {
    if (!canEdit) return;
    const previous = tasks;
    const updated = [newTask, ...tasks];
    setTasks(updated);
    void StorageService.saveTasks(updated).catch(() => setTasks(previous));
  };

  const handleResolveBlocker = (blockerId: string) => {
    if (!canEdit) return;
    const previous = blockers;
    const updated = blockers.filter((b) => b.id !== blockerId);
    setBlockers(updated);
    void StorageService.saveBlockers(updated).catch(() => setBlockers(previous));

    // Reduce blocker count on matching article
    const targetBlocker = blockers.find((b) => b.id === blockerId);
    if (targetBlocker) {
      const art = articles.find((a) => a.code === targetBlocker.articleCode);
      if (art) {
        const newArt: Article = {
          ...art,
          blockerCount: Math.max(0, art.blockerCount - 1),
          scheduleHealth: art.blockerCount - 1 <= 0 ? 'On Track' : 'At Risk',
        };
        handleUpdateArticle(newArt);
      }
    }
  };

  const handleCreateBlocker = (newBlocker: BlockerItem) => {
    if (!canEdit) return;
    const previous = blockers;
    const updated = [newBlocker, ...blockers];
    setBlockers(updated);
    void StorageService.saveBlockers(updated).catch(() => setBlockers(previous));

    // Increase blocker count on article
    const art = articles.find((a) => a.code === newBlocker.articleCode);
    if (art) {
      const newArt: Article = {
        ...art,
        blockerCount: art.blockerCount + 1,
        scheduleHealth: 'At Risk',
      };
      handleUpdateArticle(newArt);
    }
  };

  const handleResolveDecision = (decisionId: string, choice: string) => {
    if (!canEdit) return;
    const previous = decisions;
    const updated = decisions.filter((d) => d.id !== decisionId);
    setDecisions(updated);
    void Promise.all([
      StorageService.resolveDecision(decisionId, choice),
      StorageService.saveDecisions(updated),
    ]).catch(() => setDecisions(previous));
  };

  // Master Data Handlers
  const handleAddSupplier = (newSup: Supplier) => {
    if (!canEdit) return;
    const previous = suppliers;
    const updated = [newSup, ...suppliers];
    setSuppliers(updated);
    void StorageService.saveSuppliers(updated).catch(() => setSuppliers(previous));
  };

  const handleUpdateSupplier = (updatedSup: Supplier) => {
    if (!canEdit) return;
    const previous = suppliers;
    const updated = suppliers.map((s) => (s.id === updatedSup.id ? updatedSup : s));
    setSuppliers(updated);
    void StorageService.saveSuppliers(updated).catch(() => setSuppliers(previous));
  };

  const handleDeleteSupplier = (id: string) => {
    if (!canEdit) return;
    const previous = suppliers;
    const updated = suppliers.filter((s) => s.id !== id);
    setSuppliers(updated);
    void StorageService.saveSuppliers(updated).catch(() => setSuppliers(previous));
  };

  const handleAddMaterial = (newMat: MaterialMaster) => {
    if (!canEdit) return;
    const previous = materials;
    const updated = [newMat, ...materials];
    setMaterials(updated);
    void StorageService.saveMaterials(updated).catch(() => setMaterials(previous));
  };

  const handleUpdateMaterial = (updatedMat: MaterialMaster) => {
    if (!canEdit) return;
    const previous = materials;
    const updated = materials.map((m) => (m.id === updatedMat.id ? updatedMat : m));
    setMaterials(updated);
    void StorageService.saveMaterials(updated).catch(() => setMaterials(previous));
  };

  const handleDeleteMaterial = (id: string) => {
    if (!canEdit) return;
    const previous = materials;
    const updated = materials.filter((m) => m.id !== id);
    setMaterials(updated);
    void StorageService.saveMaterials(updated).catch(() => setMaterials(previous));
  };

  const handleAddService = (newSvc: ServiceMaster) => {
    if (!canEdit) return;
    const previous = services;
    const updated = [newSvc, ...services];
    setServices(updated);
    void StorageService.saveServices(updated).catch(() => setServices(previous));
  };

  const handleUpdateService = (updatedSvc: ServiceMaster) => {
    if (!canEdit) return;
    const previous = services;
    const updated = services.map((s) => (s.id === updatedSvc.id ? updatedSvc : s));
    setServices(updated);
    void StorageService.saveServices(updated).catch(() => setServices(previous));
  };

  const handleDeleteService = (id: string) => {
    if (!canEdit) return;
    const previous = services;
    const updated = services.filter((s) => s.id !== id);
    setServices(updated);
    void StorageService.saveServices(updated).catch(() => setServices(previous));
  };

  // Filter Articles by Business Unit.
  // "Semua Unit Bisnis" (default) menampilkan seluruh artikel — sebelumnya cek
  // hanya cocok dengan 'Semua' sehingga default justru mengosongkan daftar.
  const filteredArticles = articles.filter((a) => {
    if (isAllBusinessUnits(selectedUnit)) return true;
    return a.businessUnit === selectedUnit;
  });

  const activeArticle =
    articles.find((a) => a.id === selectedArticleId) || articles[0];

  const editingArticle = editingArticleId
    ? articles.find((article) => article.id === editingArticleId) || null
    : null;

  const openArticleEditor = (articleId: string) => {
    setEditingArticleId(articleId);
    setShowQuickCreateModal(true);
  };

  // Selalu bersihkan target edit, agar "Tambah Artikel" tidak membuka modal
  // dalam mode edit setelah sebelumnya dipakai untuk mengubah artikel.
  const handleOpenQuickCreate = () => {
    setEditingArticleId(null);
    setShowQuickCreateModal(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/launch/login');
  };

  const pendingApprovals = approvals.filter((a) => a.status === 'Pending');
  const pendingApprovalsCount = pendingApprovals.length;
  const blockedTasksCount = blockers.length;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 grid place-items-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-2xl">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#087E79] text-sm font-black text-white">
            PL
          </div>
          <h1 className="text-base font-extrabold text-white">Menyiapkan PATEN Workspace</h1>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Menyinkronkan artikel, workflow, master data, dan aktivitas tim.
          </p>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[#087E79]" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="paten-shell min-h-screen text-slate-900 font-sans antialiased selection:bg-[#087E79]/20 selection:text-[#087E79]">
      {syncError && (
        <div className="paten-floating-toast fixed right-3 z-[70] max-w-[calc(100vw-1.5rem)] sm:max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-900 shadow-lg">
          Perubahan tetap terlihat di layar, tetapi sinkronisasi database perlu diperiksa: {syncError}
        </div>
      )}
      {/* Navbar */}
      <Navbar
        activeBusinessUnit={selectedUnit}
        onSelectBusinessUnit={setSelectedUnit}
        onOpenQuickCreate={handleOpenQuickCreate}
        pendingApprovals={pendingApprovals}
        onOpenGlobalSearch={() => setShowGlobalSearchModal(true)}
        onSelectTab={(tab) => selectTab(tab as PatenTab)}
        onSignOut={() => void handleSignOut()}
        activeTab={activeTab}
        currentUser={currentUser}
        canCreate={canCreate}
        syncHealthy={!syncError}
      />

      {/* Main Body Layout */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => selectTab(tab as PatenTab)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        pendingApprovalsCount={pendingApprovalsCount}
        blockedTasksCount={blockedTasksCount}
      />

      <div className={`paten-main ${isSidebarCollapsed ? 'md:pl-[76px]' : 'md:pl-[232px]'} transition-all duration-200 min-h-screen flex flex-col`}>
        {/* Sticky Article Header (when inspecting specific article views) */}
        {activeArticle &&
          ['brief', 'workspace', 'detail'].includes(activeTab) && (
            <ArticleStickyHeader
              article={activeArticle}
              activeTab={activeTab as 'brief' | 'workspace' | 'detail'}
              onSelectTab={(tab) => selectTab(tab)}
              onBack={() => selectTab('pipeline')}
              onRequestApproval={() => selectTab('approvals')}
            />
          )}

        {/* View Switcher Engine */}
        <main className="p-3 sm:p-4">
        <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#087E79]" /></div>}>
          {activeTab === 'dashboard' && (
            <DashboardView
              articles={filteredArticles}
              pendingApprovals={pendingApprovals}
              decisions={decisions}
              blockers={blockers}
              activeBusinessUnit={selectedUnit}
              onOpenArticle={(artId, initialTab) => {
                selectTab(initialTab || 'workspace', artId);
              }}
              onSelectTab={(tab) => selectTab(tab as PatenTab)}
              onOpenQuickCreate={handleOpenQuickCreate}
              canCreate={canCreate}
            />
          )}

          {activeTab === 'pipeline' && (
            <ArticlePipelineView
              articles={filteredArticles}
              activeBusinessUnit={selectedUnit}
              onOpenArticle={(artId, initialTab) => {
                selectTab(initialTab || 'workspace', artId);
              }}
              onDeleteArticle={canEdit ? handleDeleteArticle : undefined}
              onEditArticle={canEdit ? openArticleEditor : undefined}
              onOpenQuickCreate={handleOpenQuickCreate}
              canCreate={canCreate}
            />
          )}

          {activeTab === 'workspace' && activeArticle && (
            <ArticleWorkspaceView
              article={activeArticle}
              masterMaterials={materials}
              masterSuppliers={suppliers}
              masterServices={services}
              updates={updates}
              onUpdateArticle={handleUpdateArticle}
              onAddUpdate={handleAddProgressUpdate}
              onNavigateToDetail={() => selectTab('detail')}
              onNavigateToImplementation={() => selectTab('implementation')}
              saveStatus={<SaveStatus state={saveState} />}
              onEditArticle={canEdit ? openArticleEditor : undefined}
            />
          )}

          {activeTab === 'implementation' && (
            <ArticleImplementationView
              articles={filteredArticles}
              selectedArticleId={selectedArticleId}
              onSelectArticleId={(articleId) => selectTab('implementation', articleId)}
              masterMaterials={materials}
              masterSuppliers={suppliers}
              masterServices={services}
              updates={updates}
              onUpdateArticle={handleUpdateArticle}
              onAddUpdate={handleAddProgressUpdate}
              onNavigateToDetail={() => selectTab('detail')}
              currentUserName={currentUser?.name}
              currentUserAvatar={currentUser?.avatarUrl}
              saveStatus={<SaveStatus state={saveState} />}
            />
          )}

          {activeTab === 'brief' && activeArticle && (
            <ArticleBriefView
              article={activeArticle}
              onUpdateArticle={handleUpdateArticle}
            />
          )}

          {activeTab === 'detail' && activeArticle && (
            <ArticleDetailView article={activeArticle} />
          )}

          {activeTab === 'master' && (
            <MasterDataView
              suppliers={suppliers}
              materials={materials}
              services={services}
              onAddSupplier={handleAddSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
              onAddMaterial={handleAddMaterial}
              onUpdateMaterial={handleUpdateMaterial}
              onDeleteMaterial={handleDeleteMaterial}
              onAddService={handleAddService}
              onUpdateService={handleUpdateService}
              onDeleteService={handleDeleteService}
            />
          )}

          {activeTab === 'approvals' && (
            <ApprovalsView
              articles={articles}
              approvals={approvals}
              onUpdateApproval={handleUpdateApproval}
              onCreateApproval={handleCreateApprovalRequest}
              currentUserName={currentUser?.name || 'Pengguna Aktif'}
              canDecide={canEdit}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              articles={articles}
              tasks={tasks}
              blockers={blockers}
              decisions={decisions}
              onUpdateTask={handleUpdateTask}
              onCreateTask={handleCreateTask}
              onResolveBlocker={handleResolveBlocker}
              onCreateBlocker={handleCreateBlocker}
              onResolveDecision={handleResolveDecision}
              currentUserName={currentUser?.name}
              currentUserId={currentUser?.id}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              articles={filteredArticles}
              tasks={tasks}
              activeBusinessUnit={selectedUnit}
              onSelectArticle={(artId, initialTab) => {
                selectTab(initialTab ? (initialTab as PatenTab) : 'workspace', artId);
              }}
              onUpdateArticle={handleUpdateArticle}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView articles={filteredArticles} />
          )}
        </Suspense>
        </main>

        {/* Bottom Navigation for Mobile */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={(tab) => selectTab(tab as PatenTab)}
          onOpenQuickCreate={handleOpenQuickCreate}
          pendingApprovalsCount={pendingApprovalsCount}
          activeBusinessUnit={selectedUnit}
          onSelectBusinessUnit={setSelectedUnit}
        onSignOut={() => void handleSignOut()}
          canCreate={canCreate}
        />
      </div>

      {/* Quick Create Modal */}
      <Suspense fallback={null}>
      {showQuickCreateModal && (
        <QuickCreateModal
          isOpen={showQuickCreateModal}
          onClose={() => {
            setShowQuickCreateModal(false);
            setEditingArticleId(null);
          }}
          activeBusinessUnit={selectedUnit}
          materials={materials}
          onCreateArticle={handleCreateArticle}
          ownerName={currentUser?.name}
          editArticle={editingArticle}
          onUpdateArticle={handleUpdateArticle}
          existingCodes={articles
            .filter((article) => article.id !== editingArticleId)
            .map((article) => article.code)}
          onUploadPhoto={
            editingArticleId
              ? async (file) => {
                  // Perkecil di browser dulu: menghemat kuota bandwidth unggah
                  // sekaligus storage Cloudinary, tanpa mengubah alur upload.
                  const optimized = await compressImageForUpload(file);
                  const uploaded = await uploadArticleMedia(editingArticleId, optimized, 'REFERENCE');
                  return uploaded.url;
                }
              : undefined
          }
        />
      )}

      {/* Global Search Modal */}
      {showGlobalSearchModal && (
        <GlobalSearchModal
          isOpen={showGlobalSearchModal}
          onClose={() => setShowGlobalSearchModal(false)}
          articles={articles}
          materials={materials}
          suppliers={suppliers}
          tasks={tasks}
          onSelectArticle={(id) => {
            selectTab('workspace', id);
          }}
          onSelectTab={(tab) => selectTab(tab as PatenTab)}
        />
      )}
      </Suspense>

      {/* Floating Chat Bubble */}
      <FloatingChatBubble
        articles={articles}
        selectedArticleId={selectedArticleId}
        onUpdateArticle={handleUpdateArticle}
        currentUserName={currentUser?.name}
      />
    </div>
  );
}
