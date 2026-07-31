import { ReactNode, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Boxes, CalendarDays, Check, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardList, Clock3, Factory, FileSearch, FileText, Filter, LayoutGrid, Layers3, Link2, List, Megaphone, MessageSquare, PackageCheck, Palette, Pencil, Plus, Ruler, Search, ShieldCheck, Shirt, Sparkles, Tags, Target, Users } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from '@/app/router/simpleRouter';
import { useAuth } from '@/core/auth/useAuth';
import { listTeamMembers } from './data/teamRepository';
import { BriefSnapshot } from './components/BriefSnapshot';
import { ResearchPanel } from './components/ResearchPanel';
import { SafeImage } from './components/SafeImage';
import { EditProjectPanel } from './components/EditProjectPanel';
import { DeleteButton } from './components/DeleteButton';
import { SourcingPanel } from './components/SourcingPanel';
import { SamplingPanel } from './components/SamplingPanel';
import { CostingPanel } from './components/CostingPanel';
import { SpecificationPanel } from './components/SpecificationPanel';
import { QcPanel } from './components/QcPanel';
import { CostComponentFormPanel, MaterialFormPanel, SupplierFormPanel } from './components/MasterDataPanel';
import { ProductionPanel } from './components/ProductionPanel';
import { LaunchPreparationPanel } from './components/LaunchPreparationPanel';
import { ArticleResultPanel } from './components/ArticleResultPanel';
import { ProgressSheetPanel } from './components/ProgressSheetPanel';
import { BlockerReportForm, OpenBlockerCard } from './components/BlockerPanel';
import { ApprovalPanel } from './components/ApprovalPanel';
import { DiscussionPanel } from './components/DiscussionPanel';
import { StudioWorkspacePanel } from './components/StudioWorkspacePanel';
import type { DependencyType, LaunchProject, LaunchStage, LaunchTask, MasterMaterial, MasterSupplier, ProjectStatus, StageCode } from './domain/types';
import { STAGE_ORDER } from './domain/types';
import { COST_CONFIDENCE_LABEL, SCHEDULE_HEALTH_LABEL, costConfidence, dataReadiness, dataReadinessItems, scheduleHealth } from './domain/indicators';
import { useCompleteTask, useCostComponents, useDeactivateCostComponent, useDeactivateMasterMaterial, useDeactivateMasterSupplier, useDeleteProject, useMasterMaterials, useMasterSuppliers, useMyTasks, useProject, useProjects, useRecentProgressUpdates, useSetTaskDependency, useUpdateStage } from './hooks/useLaunch';
import type { ProjectWorkspace as ProjectWorkspaceData } from './domain/types';

const stageMeta: Record<StageCode, { short: string; label: string }> = {
  BRIEF: { short: 'Brief', label: 'Brief & arahan' },
  RESEARCH: { short: 'Riset', label: 'Riset artikel' },
  SOURCING: { short: 'Sourcing', label: 'Bahan & supplier' },
  SAMPLING: { short: 'Sample', label: 'Sampling' },
  COSTING: { short: 'HPP', label: 'HPP & harga' },
  SPECIFICATION: { short: 'Spesifikasi', label: 'Warna & size chart' },
  QC: { short: 'QC', label: 'Quality control' },
  OWNER_APPROVAL: { short: 'Approval', label: 'Approval owner' },
  PRODUCTION_READY: { short: 'Produksi', label: 'Siap produksi' },
};

type WorkstreamCode = StageCode | 'PRODUCTION' | 'LAUNCH' | null;
type StudioPanelCode = 'PRODUCT_BRIEF' | 'MATERIALS' | 'COLORS' | 'SIZES' | 'SUPPLIERS' | 'PATTERN' | 'SAMPLING' | 'COSTING' | 'BUDGET' | 'READINESS' | 'PRODUCTION' | 'LAUNCH' | 'TASKS' | 'FILES';

const WORKSTREAM_TABS: Array<{ code: WorkstreamCode; label: string; icon: ReactNode }> = [
  { code: null, label: 'Brief', icon: <Layers3 size={15} /> },
  { code: 'RESEARCH', label: 'Riset', icon: <BookOpen size={15} /> },
  { code: 'SOURCING', label: 'Bahan & supplier', icon: <Factory size={15} /> },
  { code: 'SAMPLING', label: 'Sampling', icon: <Shirt size={15} /> },
  { code: 'COSTING', label: 'HPP', icon: <CircleDollarSign size={15} /> },
  { code: 'SPECIFICATION', label: 'Warna & size', icon: <Palette size={15} /> },
  { code: 'QC', label: 'QC', icon: <PackageCheck size={15} /> },
  { code: 'OWNER_APPROVAL', label: 'Approval', icon: <ShieldCheck size={15} /> },
  { code: 'PRODUCTION', label: 'Produksi', icon: <Factory size={15} /> },
  { code: 'LAUNCH', label: 'Rilis', icon: <Megaphone size={15} /> },
];

const statusLabels: Record<ProjectStatus, string> = {
  DRAFT: 'Draft', ACTIVE: 'Berjalan', BLOCKED: 'Terhambat', IN_REVIEW: 'Menunggu review', READY_FOR_PRODUCTION: 'Siap produksi', ARCHIVED: 'Arsip',
};

const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

function initials(name?: string | null) { return (name ?? 'GG').split(' ').map(value => value[0]).join('').slice(0, 2).toUpperCase(); }
function dueText(value?: string | null) { if (!value) return 'Tanpa tenggat'; const diff = Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000); if (diff === 0) return 'Hari ini'; if (diff === 1) return 'Besok'; if (diff < 0) return `${Math.abs(diff)} hari terlambat`; return `${diff} hari lagi`; }

function LoadingBlocks() { return <div className="loading-grid"><span /><span /><span /><span /></div>; }
function ErrorPanel({ title = 'Data belum dapat dimuat', detail }: { title?: string; detail?: string }) { return <div className="state-panel"><AlertCircle size={28} /><h3>{title}</h3><p>{detail ?? 'Periksa koneksi dan pastikan blueprint database terbaru sudah diterapkan.'}</p></div>; }
function EmptyPanel({ icon, title, detail, action }: { icon: ReactNode; title: string; detail: string; action?: ReactNode }) { return <div className="state-panel state-empty">{icon}<h3>{title}</h3><p>{detail}</p>{action}</div>; }

function StatusPill({ status }: { status: ProjectStatus }) { return <span className={`status-pill status-${status.toLowerCase()}`}><i />{statusLabels[status]}</span>; }

function Progress({ value, compact = false }: { value: number; compact?: boolean }) {
  return <div className={`progress-wrap ${compact ? 'progress-compact' : ''}`}><div className="progress-track"><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>{!compact && <b>{value}%</b>}</div>;
}

function ProjectCard({ project }: { project: LaunchProject }) {
  // The list query stays light, so health is derived from the article fields
  // alone; the workspace adds stage-level detail once the article is opened.
  const health = scheduleHealth(project, []);
  const signals = [project.reference_image_url, project.concept, project.target_sample_date, project.target_date, project.target_launch_date, project.owner_id];
  const completeness = Math.round(signals.filter(Boolean).length / signals.length * 100);
  return (
    <article className="project-card studio-article-card">
      <Link to={`/launch/app/projects/${project.id}?tab=overview`} className="project-thumb studio-article-image">
        <SafeImage src={project.reference_image_url} alt={`Referensi ${project.article_name}`} fallback={<Shirt size={34} />} />
        <span className="unit-chip" style={{ '--unit-color': project.business_unit?.accent_color ?? '#f36b21' } as React.CSSProperties}>{project.business_unit?.short_name ?? 'GG'}</span>
        <span className={`project-health-overlay health-${health.toLowerCase()}`}><i />{SCHEDULE_HEALTH_LABEL[health]}</span>
      </Link>
      <div className="project-card-body studio-article-body">
        <div className="project-card-top"><span>{project.code}</span><span className={`priority priority-${project.priority.toLowerCase()}`}>{project.priority}</span></div>
        <h3>{project.article_name}</h3>
        <p>{project.category} · {stageMeta[project.current_stage]?.label ?? project.current_stage}</p>
        <div className="project-stage-line"><span><i style={{ width: `${project.progress}%` }} /></span><b>{project.progress}%</b></div>
        <div className="studio-card-progress"><div><span>Kelengkapan data</span><b>{completeness}%</b><i><em style={{ width: `${completeness}%` }} /></i></div></div>
        <div className="project-card-insight">
          <div><small>Tahap aktif</small><b>{stageMeta[project.current_stage]?.short ?? project.current_stage}</b></div>
          <div><small>Target selesai</small><b>{dueText(project.target_date)}</b></div>
          <div><small>Owner</small><b>{project.owner?.full_name?.split(' ')[0] ?? 'Belum ada'}</b></div>
        </div>
        <div className="project-card-actions"><Link to={`/launch/app/projects/${project.id}?tab=brief`}>Brief</Link><Link to={`/launch/app/projects/${project.id}?tab=overview`}>Detail</Link><Link to={`/launch/app/projects/${project.id}?tab=work`}>Workspace <ChevronRight size={14} /></Link></div>
      </div>
    </article>
  );
}

const DEPENDENCY_LABEL: Record<DependencyType, string> = { NONE: 'Tanpa dependency', FS: 'Finish-to-Start', SS: 'Start-to-Start', FF: 'Finish-to-Finish' };

function TaskRow({ task, onComplete, allTasks, onSetDependency }: { task: LaunchTask; onComplete?: () => Promise<unknown>; allTasks?: LaunchTask[]; onSetDependency?: (dependsOnId: string | null, type: DependencyType) => Promise<unknown> }) {
  const [error, setError] = useState<string | null>(null);
  const [editingDep, setEditingDep] = useState(false);
  const predecessor = allTasks?.find(item => item.id === task.depends_on_task_id);
  const locked = Boolean(predecessor && predecessor.status !== 'DONE' && (task.dependency_type === 'FS' || task.dependency_type === 'FF'));

  async function handleComplete() {
    if (!onComplete) return;
    setError(null);
    try { await onComplete(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Tugas belum dapat ditandai selesai.'); }
  }

  return <div className="task-row-wrap">
    <div className="task-row">
      <button className={`task-check ${task.status === 'DONE' ? 'done' : ''}`} onClick={handleComplete} disabled={!onComplete || locked} aria-label="Tandai selesai">{task.status === 'DONE' && <Check size={14} />}</button>
      <div className="task-main">
        <b>{task.title}</b>
        <span>{task.project?.article_name ?? stageMeta[task.stage_code]?.label}</span>
        {predecessor && <small className={`task-dependency ${locked ? 'task-dependency-locked' : ''}`}>{locked ? 'Menunggu' : 'Setelah'}: {predecessor.title}</small>}
        {error && <small className="task-error">{error}</small>}
      </div>
      <span className={`task-due ${task.due_date && new Date(task.due_date) < new Date() ? 'late' : ''}`}>{dueText(task.due_date)}</span>
      {allTasks && onSetDependency && <button type="button" className="icon-button task-dep-toggle" onClick={() => setEditingDep(value => !value)} aria-label="Atur dependency"><Link2 size={14} /></button>}
    </div>
    {editingDep && allTasks && onSetDependency && <div className="task-dependency-editor">
      <select value={task.depends_on_task_id ?? ''} onChange={e => onSetDependency(e.target.value || null, task.dependency_type === 'NONE' ? 'FS' : task.dependency_type)}>
        <option value="">Tanpa predecessor</option>
        {allTasks.filter(item => item.id !== task.id).map(item => <option value={item.id} key={item.id}>{item.title}</option>)}
      </select>
      {task.depends_on_task_id && <select value={task.dependency_type} onChange={e => onSetDependency(task.depends_on_task_id, e.target.value as DependencyType)}>{(['FS', 'SS', 'FF'] as const).map(type => <option value={type} key={type}>{DEPENDENCY_LABEL[type]}</option>)}</select>}
    </div>}
  </div>;
}

export function TodayPage() {
  const auth = useAuth();
  const projects = useProjects();
  const tasks = useMyTasks();
  const progressUpdates = useRecentProgressUpdates();
  const name = auth.data?.profile?.full_name.split(' ')[0] ?? 'Tim';
  const data = projects.data ?? [];
  const active = data.filter(item => item.status === 'ACTIVE');
  const review = data.filter(item => item.status === 'IN_REVIEW');
  const blocked = data.filter(item => item.status === 'BLOCKED');
  const ready = data.filter(item => item.status === 'READY_FOR_PRODUCTION');
  const health = data.map(item => ({ item, status: scheduleHealth(item, []) }));
  const atRisk = health.filter(entry => entry.status === 'AT_RISK');
  const overdue = health.filter(entry => entry.status === 'OVERDUE');
  const now = new Date();
  const releaseThisMonth = data.filter(item => {
    if (!item.target_launch_date) return false;
    const target = new Date(item.target_launch_date);
    return target.getUTCFullYear() === now.getUTCFullYear() && target.getUTCMonth() === now.getUTCMonth();
  });
  const stageCounts = STAGE_ORDER.map(code => ({ code, count: data.filter(item => item.current_stage === code).length }));

  if (projects.isLoading) return <LoadingBlocks />;
  if (projects.error) return <ErrorPanel detail="Koneksi layanan tersedia, tetapi struktur Product Launch OS baru belum terbaca. Terapkan migration reset yang disertakan." />;

  return (
    <div className="page-stack today-command-page">
      <div className="owner-command-grid">
      <section className="welcome-row owner-command-head">
        <div><span className="eyebrow">Minggu peluncuran · {date.format(new Date())}</span><h2>Selamat bekerja, {name}.</h2><p>Berikut fokus yang paling mendekatkan artikel ke produksi hari ini.</p></div>
        <Link to="/launch/app/projects/new" className="button button-primary"><Plus size={18} /> Perintah artikel baru</Link>
      </section>

      <section className="decision-banner">
        <div className="decision-icon"><Sparkles size={24} /></div>
        <div><span>PRIORITAS OWNER</span><h3>{review.length ? `${review.length} artikel menunggu keputusan Anda` : 'Tidak ada keputusan yang tertahan'}</h3><p>{review.length ? 'Review HPP, hasil sample, atau persetujuan produksi agar pekerjaan tim terus bergerak.' : 'Seluruh approval terkini sudah tertangani. Pantau artikel aktif di bawah.'}</p></div>
        <Link to="/launch/app/projects?status=IN_REVIEW" className="button button-light">{review.length ? 'Buka antrean' : 'Lihat artikel'} <ArrowRight size={17} /></Link>
      </section>

      </div>

      <section className="metric-grid">
        <div className="metric-card"><span className="metric-icon orange"><Activity size={19} /></span><div><small>Artikel berjalan</small><b>{active.length}</b><span>{data.length} total artikel</span></div></div>
        <div className="metric-card"><span className="metric-icon yellow"><Clock3 size={19} /></span><div><small>Tugas saya</small><b>{tasks.data?.length ?? 0}</b><span>butuh perhatian</span></div></div>
        <div className="metric-card"><span className="metric-icon red"><AlertCircle size={19} /></span><div><small>Terhambat</small><b>{blocked.length}</b><span>perlu dibuka</span></div></div>
        <div className="metric-card"><span className="metric-icon green"><PackageCheck size={19} /></span><div><small>Siap produksi</small><b>{ready.length}</b><span>artikel tervalidasi</span></div></div>
        <div className="metric-card"><span className="metric-icon yellow"><AlertCircle size={19} /></span><div><small>Berisiko</small><b>{atRisk.length}</b><span>mendekati tenggat</span></div></div>
        <div className="metric-card"><span className="metric-icon red"><Clock3 size={19} /></span><div><small>Terlambat</small><b>{overdue.length}</b><span>lewat target</span></div></div>
        <div className="metric-card"><span className="metric-icon orange"><Sparkles size={19} /></span><div><small>Menunggu approval</small><b>{review.length}</b><span>butuh keputusan owner</span></div></div>
        <div className="metric-card"><span className="metric-icon green"><CalendarDays size={19} /></span><div><small>Rilis bulan ini</small><b>{releaseThisMonth.length}</b><span>target launch</span></div></div>
      </section>

      <section className="content-card launch-lane-card">
        <div className="section-head"><div><span className="eyebrow">Pipeline langsung</span><h3>Posisi seluruh artikel</h3></div><Link to="/launch/app/projects">Lihat semua <ChevronRight size={17} /></Link></div>
        <div className="launch-lane">
          {stageCounts.map((stage, index) => <div className={`lane-step ${stage.count ? 'lane-active' : ''}`} key={stage.code}><span>{String(index + 1).padStart(2, '0')}</span><div><b>{stageMeta[stage.code].short}</b><small>{stage.count} artikel</small></div>{index < stageCounts.length - 1 && <i />}</div>)}
        </div>
      </section>

      <div className="dashboard-columns">
        <section className="content-card">
          <div className="section-head"><div><span className="eyebrow">Sedang bergerak</span><h3>Artikel terbaru</h3></div><Link to="/launch/app/projects">Semua artikel <ChevronRight size={17} /></Link></div>
          {data.length ? <div className="project-list-compact">{data.slice(0, 4).map(project => <Link to={`/launch/app/projects/${project.id}`} key={project.id}><span className="compact-thumb"><SafeImage src={project.reference_image_url} alt="" fallback={<Shirt size={22} />} /></span><div><b>{project.article_name}</b><small>{project.code} · {stageMeta[project.current_stage].short}</small></div><Progress value={project.progress} compact /><ChevronRight size={18} /></Link>)}</div> : <EmptyPanel icon={<Boxes size={28} />} title="Belum ada artikel" detail="Mulai dari gambar referensi pertama yang diberikan owner." action={<Link className="button button-primary" to="/launch/app/projects/new">Buat artikel pertama</Link>} />}
        </section>
        <section className="content-card">
          <div className="section-head"><div><span className="eyebrow">Fokus personal</span><h3>Tugas saya</h3></div><span className="count-badge">{tasks.data?.length ?? 0}</span></div>
          {tasks.isLoading ? <LoadingBlocks /> : tasks.data?.length ? <div className="task-list">{tasks.data.slice(0, 5).map(task => <TaskRow key={task.id} task={task} />)}</div> : <EmptyPanel icon={<CheckCircle2 size={28} />} title="Fokus terkendali" detail="Belum ada tugas terbuka yang ditugaskan kepada Anda." />}
        </section>
      </div>

      <section className="content-card owner-update-feed">
        <div className="section-head"><div><span className="eyebrow">Update terbaru tim</span><h3>Kondisi pekerjaan lintas artikel</h3><p>Ringkasan hasil, arahan, risiko, dan forecast terbaru dari lembar progres.</p></div></div>
        {progressUpdates.data?.length ? <div className="owner-update-list">{progressUpdates.data.map(update => <Link to={`/launch/app/projects/${update.project_id}?tab=progress`} key={update.id}>
          <span className={`owner-update-mark update-${update.update_type.toLowerCase()}`}><Activity size={15} /></span>
          <div><b>{update.project?.article_name ?? 'Artikel'}</b><small>{update.author?.full_name ?? 'Tim'} · {update.stage_code ? stageMeta[update.stage_code].short : 'Lintas tahap'}</small><p>{update.blocker_text || update.decision_needed || update.completed_text || update.current_text || update.next_step}</p></div>
          <span className="owner-update-date">{date.format(new Date(update.created_at))}</span><ChevronRight size={17} />
        </Link>)}</div> : <EmptyPanel icon={<Activity size={28} />} title="Belum ada update tim" detail="Update terstruktur akan tampil di sini setelah tim mengisi lembar progres artikel." />}
      </section>
    </div>
  );
}

function ProjectListView({ projects }: { projects: LaunchProject[] }) {
  return <section className="content-card"><div className="project-list-table"><table><thead><tr><th>Artikel</th><th>Unit</th><th>Kategori</th><th>Priority</th><th>Status</th><th>Tahap</th><th>Progress</th><th>Kondisi jadwal</th><th>Owner</th><th>Target produksi</th><th>Target rilis</th><th>Update terakhir</th></tr></thead><tbody>{projects.map(project => {
    const health = scheduleHealth(project, []);
    return <tr key={project.id}><td><Link className="project-list-identity" to={`/launch/app/projects/${project.id}?tab=overview`}><span><SafeImage src={project.reference_image_url} alt="" fallback={<Shirt size={18} />} /></span><p><b>{project.article_name}</b><small>{project.code}</small></p></Link></td><td>{project.business_unit?.short_name ?? '—'}</td><td>{project.category}</td><td><span className={`priority priority-${project.priority.toLowerCase()}`}>{project.priority}</span></td><td><StatusPill status={project.status} /></td><td>{stageMeta[project.current_stage]?.short}</td><td><Progress value={project.progress} compact /></td><td><span className={`health-chip health-${health.toLowerCase()}`}>{SCHEDULE_HEALTH_LABEL[health]}</span></td><td>{project.owner?.full_name ?? '—'}</td><td>{project.target_date ? date.format(new Date(project.target_date)) : '—'}</td><td>{project.target_launch_date ? date.format(new Date(project.target_launch_date)) : '—'}</td><td>{date.format(new Date(project.updated_at))}</td></tr>;
  })}</tbody></table></div></section>;
}

export function ProjectsPage() {
  const [status, setStatus] = useState('ALL');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const projects = useProjects(status);
  const filtered = (projects.data ?? []).filter(item => `${item.article_name} ${item.code} ${item.category}`.toLowerCase().includes(query.toLowerCase()));
  const filters = [['ALL', 'Semua'], ['ACTIVE', 'Berjalan'], ['IN_REVIEW', 'Review'], ['BLOCKED', 'Terhambat'], ['READY_FOR_PRODUCTION', 'Siap produksi']];
  const allProjects = projects.data ?? [];

  return <div className="page-stack pipeline-page">
    <section className="pipeline-command">
      <div className="pipeline-command-copy">
        <span className="pipeline-live"><i /> LIVE PRODUCT PIPELINE</span>
        <h2>Dari referensi menuju<br />produk siap jual.</h2>
        <p>Satu pusat kerja untuk brief, material, sample, HPP, produksi, dan peluncuran artikel GG Supply maupun Gudskuy.</p>
        <div className="pipeline-command-actions"><Link className="button button-primary" to="/launch/app/projects/new"><Plus size={18} /> Mulai artikel</Link><Link className="button button-dark-ghost" to="/launch/app/calendar">Lihat kalender <ArrowUpRight size={17} /></Link></div>
      </div>
      <div className="pipeline-pulse">
        <div><small>ARTIKEL AKTIF</small><b>{allProjects.filter(item => item.status === 'ACTIVE').length}</b><span>dalam pengembangan</span></div>
        <div><small>MENUNGGU REVIEW</small><b>{allProjects.filter(item => item.status === 'IN_REVIEW').length}</b><span>butuh keputusan</span></div>
        <div><small>SIAP PRODUKSI</small><b>{allProjects.filter(item => item.status === 'READY_FOR_PRODUCTION').length}</b><span>lolos gate</span></div>
        <div className="pulse-visual"><span /><span /><span /><span /><span /><span /></div>
      </div>
    </section>
    <section className="pipeline-heading"><div><span className="eyebrow">Article pipeline</span><h2>Antrean pengembangan</h2><p>{filtered.length} artikel · diperbarui otomatis dari lembar kerja tim</p></div><div className="pipeline-view-note"><span>{view === 'grid' ? 'Visual board' : 'Operational list'}</span><small>Pilih artikel untuk melanjutkan pekerjaan</small></div></section>
    <section className="page-intro legacy-pipeline-intro"><div><span className="eyebrow">Portfolio artikel</span><h2>Kelola seluruh peluncuran.</h2><p>Urutkan pekerjaan berdasarkan status, brand, atau kebutuhan keputusan.</p></div><Link className="button button-primary" to="/launch/app/projects/new"><Plus size={18} /> Artikel baru</Link></section>
    <section className="toolbar-card"><div className="search-field"><Search size={18} /><input placeholder="Cari nama artikel, kode, atau kategori…" value={query} onChange={event => setQuery(event.target.value)} /></div><div className="filter-scroll">{filters.map(([value, label]) => <button className={status === value ? 'active' : ''} key={value} onClick={() => setStatus(value)}>{label}</button>)}</div><div className="view-toggle"><button type="button" className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} aria-label="Tampilan grid"><LayoutGrid size={17} /></button><button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-label="Tampilan list"><List size={17} /></button></div><button className="icon-button filter-button"><Filter size={19} /></button></section>
    {projects.isLoading ? <LoadingBlocks /> : projects.error ? <ErrorPanel /> : filtered.length ? (view === 'grid' ? <section className="project-grid">{filtered.map(project => <ProjectCard project={project} key={project.id} />)}</section> : <ProjectListView projects={filtered} />) : <EmptyPanel icon={<FileSearch size={30} />} title="Tidak ada artikel yang cocok" detail="Ubah kata pencarian atau filter status untuk melihat artikel lainnya." />}
  </div>;
}


function IndicatorPanel({ workspace }: { workspace: ProjectWorkspaceData }) {
  const { project, stages } = workspace;
  const readinessItems = dataReadinessItems({ ...workspace, project });
  const readiness = dataReadiness({ ...workspace, project });
  const health = scheduleHealth(project, stages);
  const cost = costConfidence(workspace);
  const missing = readinessItems.filter(item => !item.done);

  return (
    <section className="indicator-grid">
      <article className="indicator-card">
        <small>Progress tahapan</small>
        <b>{project.progress}%</b>
        <Progress value={project.progress} compact />
        <span>{stages.filter(stage => stage.status === 'COMPLETED').length} dari {stages.length} tahap selesai</span>
      </article>
      <article className="indicator-card">
        <small>Kelengkapan data</small>
        <b>{readiness}%</b>
        <Progress value={readiness} compact />
        <span>{missing.length ? `Belum ada: ${missing.slice(0, 2).map(item => item.label.toLowerCase()).join(', ')}${missing.length > 2 ? `, +${missing.length - 2}` : ''}` : 'Seluruh data utama lengkap'}</span>
      </article>
      <article className={`indicator-card health-${health.toLowerCase()}`}>
        <small>Kondisi jadwal</small>
        <b>{SCHEDULE_HEALTH_LABEL[health]}</b>
        <span>{project.target_date ? `Target produksi ${date.format(new Date(project.target_date))}` : 'Target produksi belum ditetapkan'}</span>
      </article>
      <article className={`indicator-card cost-${cost.toLowerCase()}`}>
        <small>Keyakinan biaya</small>
        <b>{COST_CONFIDENCE_LABEL[cost]}</b>
        <span>{workspace.hpp[0] ? money.format(workspace.hpp[0].total_hpp) : 'HPP belum disusun'}</span>
      </article>
    </section>
  );
}

function StageRail({ stages, active }: { stages: LaunchStage[]; active: StageCode }) {
  return <div className="stage-rail">{stages.map(stage => <div className={`stage-node stage-${stage.status.toLowerCase()} ${stage.code === active ? 'current' : ''}`} key={stage.id}><span>{stage.status === 'COMPLETED' ? <Check size={15} /> : stage.position}</span><div><b>{stageMeta[stage.code].short}</b><small>{stage.progress}%</small></div></div>)}</div>;
}

export function ProjectDetailPage() {
  const { projectId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const workspace = useProject(projectId);
  const completeTaskMutation = useCompleteTask(projectId);
  const stageMutation = useUpdateStage(projectId);
  const dependencyMutation = useSetTaskDependency(projectId);
  const deleteProjectMutation = useDeleteProject();
  const requestedTab = new URLSearchParams(location.search).get('tab');
  const initialTab = requestedTab === 'brief' || requestedTab === 'work' || requestedTab === 'progress' ? requestedTab : 'overview';
  const [tab, setTab] = useState<'brief' | 'overview' | 'work' | 'progress' | 'tasks' | 'discussion' | 'activity'>(initialTab);
  const [activeWorkstream, setActiveWorkstream] = useState<WorkstreamCode>(null);
  const [expandedWorkstreams, setExpandedWorkstreams] = useState<StudioPanelCode[]>(['PRODUCT_BRIEF', 'MATERIALS']);
  const [activeStudioPanel, setActiveStudioPanel] = useState<StudioPanelCode>('PRODUCT_BRIEF');
  const [pinnedPanels, setPinnedPanels] = useState<StudioPanelCode[]>([]);
  const [editing, setEditing] = useState(false);
  const [reportingBlocker, setReportingBlocker] = useState(false);
  const canDelete = auth.data?.permissions.includes('launch.admin') ?? false;
  if (workspace.isLoading) return <LoadingBlocks />;
  if (workspace.error || !workspace.data) return <ErrorPanel title="Artikel tidak dapat dibuka" />;
  const { project, stages, tasks, activity, references, materials, colorways, hpp, sizeCharts, qc, samples, blockers, productionBatches, releasePlan } = workspace.data;
  const currentStage = stages.find(stage => stage.code === project.current_stage) ?? stages.find(stage => stage.status !== 'COMPLETED');
  const stageOf = (code: StageCode) => stages.find(stage => stage.code === code);
  const openTasks = tasks.filter(task => task.status !== 'DONE');
  const latestHpp = hpp[0];
  const openBlocker = currentStage ? blockers.find(b => b.status === 'OPEN' && b.stage_run_id === currentStage.id) : undefined;
  const workspaceSections: Array<{ code: StudioPanelCode; label: string; eyebrow: string; icon: ReactNode; metric: string; detail: string; completeness: number; missing: number }> = [
    { code: 'PRODUCT_BRIEF', label: 'Product Brief', eyebrow: 'Arah & referensi', icon: <BookOpen size={19} />, metric: `${references.length} referensi`, detail: 'Konteks produk, target, referensi visual, link pembelajaran, dan keputusan arah artikel.', completeness: Math.min(100, references.length * 25 + (project.concept ? 25 : 0) + (project.target_date ? 25 : 0)), missing: Math.max(0, 4 - references.length) },
    { code: 'MATERIALS', label: 'Materials & Accessories', eyebrow: 'Bill of materials', icon: <Layers3 size={19} />, metric: `${materials.length} komponen`, detail: 'Kain, lining, rib, label, zipper, aksesori, konsumsi, waste, dan unit pembelian.', completeness: Math.min(100, materials.length * 25), missing: materials.length ? 0 : 3 },
    { code: 'COLORS', label: 'Colors & Variants', eyebrow: 'Variant planning', icon: <Palette size={19} />, metric: `${colorways.length} warna`, detail: 'Colorway, kode warna, swatch, status sample, dan keputusan varian produksi.', completeness: Math.min(100, colorways.length * 34), missing: colorways.length ? 0 : 2 },
    { code: 'SIZES', label: 'Sizes & Size Chart', eyebrow: 'Standar ukuran', icon: <Ruler size={19} />, metric: `${sizeCharts.length} chart`, detail: 'Template kategori, titik ukur, grading, toleransi, hasil sample, dan final lock.', completeness: sizeCharts.some(item => item.status === 'FINAL') ? 100 : sizeCharts.length ? 55 : 0, missing: sizeCharts.length ? 1 : 3 },
    { code: 'SUPPLIERS', label: 'Source & Suppliers', eyebrow: 'Sourcing decision', icon: <Factory size={19} />, metric: `${materials.filter(item => item.quotes?.some(quote => quote.status === 'SELECTED')).length} pilihan`, detail: 'Perbandingan supplier utama dan alternatif berdasarkan harga, MOQ, lead time, dan risiko.', completeness: materials.length ? Math.round(materials.filter(item => item.quotes?.some(quote => quote.status === 'SELECTED')).length / materials.length * 100) : 0, missing: materials.filter(item => !item.quotes?.some(quote => quote.status === 'SELECTED')).length },
    { code: 'PATTERN', label: 'Pattern', eyebrow: 'Konstruksi produk', icon: <Tags size={19} />, metric: samples.length ? 'Terhubung ke sample' : 'Belum dimulai', detail: 'Versi pola, file pola, pembuat, status review, dan catatan konstruksi.', completeness: samples.length ? 45 : 0, missing: samples.length ? 2 : 4 },
    { code: 'SAMPLING', label: 'Sampling & Fitting', eyebrow: 'Validasi fisik', icon: <Shirt size={19} />, metric: samples.length ? `${samples.length} iterasi` : 'Belum ada sample', detail: 'Permintaan sample, fitting, temuan, revisi, foto, keputusan, dan golden sample.', completeness: Math.min(100, samples.length * 35), missing: samples.length ? 1 : 4 },
    { code: 'COSTING', label: 'HPP & Pricing', eyebrow: 'Kalkulasi biaya', icon: <CircleDollarSign size={19} />, metric: latestHpp ? money.format(latestHpp.total_hpp) : 'Belum dihitung', detail: 'Biaya bahan, CMT, cutting, jahit, finishing, packing, overhead, margin, dan harga jual.', completeness: latestHpp?.status === 'FINAL' ? 100 : latestHpp ? 65 : 0, missing: latestHpp ? 1 : 4 },
    { code: 'BUDGET', label: 'Stock & Production Budget', eyebrow: 'Matriks produksi', icon: <ClipboardList size={19} />, metric: `${workspace.data.variantMatrix.length} kombinasi`, detail: 'Warna × size × kuantitas × HPP untuk budgeting produksi dan kebutuhan modal.', completeness: workspace.data.variantMatrix.length ? 70 : 0, missing: workspace.data.variantMatrix.length ? 1 : 3 },
    { code: 'READINESS', label: 'QC & Readiness', eyebrow: 'Production gate', icon: <ShieldCheck size={19} />, metric: qc[0]?.result ?? 'Belum diperiksa', detail: 'Checklist mutu, bukti QC, approval owner, override, dan kesiapan produksi.', completeness: qc.some(item => item.result === 'PASS') ? 100 : qc.length ? 55 : 0, missing: qc.length ? 1 : 4 },
    { code: 'PRODUCTION', label: 'Production', eyebrow: 'Eksekusi massal', icon: <Factory size={19} />, metric: productionBatches.length ? `${productionBatches.length} batch` : 'Belum ada batch', detail: 'Cutting, jahit, finishing, QC, output lolos, reject, rework, dan forecast.', completeness: productionBatches.length ? 55 : 0, missing: productionBatches.length ? 2 : 4 },
    { code: 'LAUNCH', label: 'Launch', eyebrow: 'Go to market', icon: <Megaphone size={19} />, metric: releasePlan?.status ? releasePlan.status.replace(/_/g, ' ') : 'Belum dimulai', detail: 'Nama final, konten, aset, harga, kanal, stok awal, dan checklist publikasi.', completeness: releasePlan ? 60 : 0, missing: releasePlan ? 2 : 5 },
    { code: 'TASKS', label: 'Tasks & Progress', eyebrow: 'Kolaborasi tim', icon: <CheckCircle2 size={19} />, metric: `${openTasks.length} tugas terbuka`, detail: 'Rencana, aktual, dependency, update dua sisi, blocker, keputusan, dan langkah berikutnya.', completeness: tasks.length ? Math.round(tasks.filter(item => item.status === 'DONE').length / tasks.length * 100) : 0, missing: openTasks.length },
    { code: 'FILES', label: 'Files, Discussion & History', eyebrow: 'Dokumentasi artikel', icon: <MessageSquare size={19} />, metric: `${workspace.data.comments.length} diskusi`, detail: 'File, komentar, mention, keputusan, versi, dan jejak perubahan artikel.', completeness: workspace.data.comments.length || activity.length ? 70 : 0, missing: workspace.data.comments.length ? 0 : 1 },
  ];

  function toggleWorkstream(code: StudioPanelCode) {
    setExpandedWorkstreams(current => current.includes(code) ? current.filter(item => item !== code) : [...current, code]);
    setActiveStudioPanel(code);
  }

  function focusWorkstream(code: StudioPanelCode) {
    setExpandedWorkstreams(current => current.includes(code) ? current : [...current, code]);
    setActiveStudioPanel(code);
    window.setTimeout(() => document.getElementById(`workspace-${code.toLowerCase()}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  function renderWorkstreamPanel(code: StudioPanelCode) {
    if (code === 'PRODUCT_BRIEF') return <ResearchPanel projectId={project.id} stage={stageOf('RESEARCH')} references={references} researchSummary={project.research_summary} onBack={() => toggleWorkstream(code)} />;
    if (code === 'MATERIALS') return <SourcingPanel projectId={project.id} stage={stageOf('SOURCING')} materials={materials} onBack={() => toggleWorkstream(code)} />;
    if (code === 'COLORS') return <SpecificationPanel mode="colors" projectId={project.id} category={project.category} stage={stageOf('SPECIFICATION')} colorways={colorways} sizeCharts={sizeCharts} variantMatrix={workspace.data!.variantMatrix} hpp={hpp} onBack={() => toggleWorkstream(code)} />;
    if (code === 'SIZES') return <SpecificationPanel mode="sizes" projectId={project.id} category={project.category} stage={stageOf('SPECIFICATION')} colorways={colorways} sizeCharts={sizeCharts} variantMatrix={workspace.data!.variantMatrix} hpp={hpp} onBack={() => toggleWorkstream(code)} />;
    if (code === 'SUPPLIERS') return <section className="studio-embedded-summary"><div className="studio-summary-head"><Factory size={20} /><div><b>Keputusan sourcing</b><p>Ringkasan supplier yang terhubung ke setiap material.</p></div></div>{materials.length ? <div className="studio-summary-list">{materials.map(item => <div key={item.id}><span>{item.role}</span><b>{item.proposed_name}</b><small>{item.quotes?.some(quote => quote.status === 'SELECTED') ? 'Supplier utama sudah dipilih' : 'Perlu pilih quotation utama'}</small></div>)}</div> : <EmptyPanel icon={<Factory size={26} />} title="Belum ada sumber material" detail="Tambahkan material terlebih dahulu, lalu bandingkan supplier utama dan alternatif." />}</section>;
    if (code === 'PATTERN') return <section className="studio-embedded-summary"><div className="studio-summary-head"><Tags size={20} /><div><b>Register pola artikel</b><p>Panel pola terhubung dengan iterasi sample agar revisi konstruksi tetap dapat dilacak.</p></div></div><div className="studio-empty-action"><FileText size={28} /><b>Belum ada file pola</b><p>Tambahkan versi pola, pembuat pola, tanggal, dan catatan konstruksi saat sample pertama dimulai.</p><button className="button button-secondary" onClick={() => focusWorkstream('SAMPLING')}>Lanjut ke Sampling</button></div></section>;
    if (code === 'SAMPLING') return <SamplingPanel projectId={project.id} stage={stageOf('SAMPLING')} samples={samples} onBack={() => toggleWorkstream(code)} />;
    if (code === 'COSTING') return <CostingPanel projectId={project.id} stage={stageOf('COSTING')} hpp={hpp} materials={materials} onBack={() => toggleWorkstream(code)} />;
    if (code === 'BUDGET') return <SpecificationPanel mode="budget" projectId={project.id} category={project.category} stage={stageOf('SPECIFICATION')} colorways={colorways} sizeCharts={sizeCharts} variantMatrix={workspace.data!.variantMatrix} hpp={hpp} onBack={() => toggleWorkstream(code)} />;
    if (code === 'READINESS') return <><QcPanel projectId={project.id} stage={stageOf('QC')} qc={qc} samples={samples} onBack={() => toggleWorkstream(code)} /><ApprovalPanel projectId={project.id} ownerApprovalStage={stageOf('OWNER_APPROVAL')} productionReadyStage={stageOf('PRODUCTION_READY')} approvals={workspace.data!.approvals} onBack={() => toggleWorkstream(code)} /></>;
    if (code === 'PRODUCTION') return <ProductionPanel projectId={project.id} batches={productionBatches} targetQuantity={project.target_quantity} onBack={() => toggleWorkstream(code)} />;
    if (code === 'LAUNCH') return <LaunchPreparationPanel projectId={project.id} projectName={project.article_name} targetLaunchDate={project.target_launch_date} releasePlan={releasePlan} onBack={() => toggleWorkstream(code)} />;
    if (code === 'TASKS') return <><ProgressSheetPanel projectId={project.id} currentStage={project.current_stage} updates={workspace.data!.progressUpdates} /><section className="content-card tasks-full"><div className="section-head"><div><span className="eyebrow">Eksekusi tim</span><h3>Daftar tugas artikel</h3></div></div>{tasks.length ? <div className="task-list">{tasks.map(task => <TaskRow key={task.id} task={task} allTasks={tasks} onComplete={task.status === 'DONE' ? undefined : () => completeTaskMutation.mutateAsync(task.id)} onSetDependency={(dependsOnId, type) => dependencyMutation.mutateAsync({ taskId: task.id, dependsOnId, type })} />)}</div> : <EmptyPanel icon={<CheckCircle2 size={28} />} title="Belum ada tugas" detail="Tugas otomatis akan muncul ketika tahapan mulai dikerjakan." />}</section></>;
    return <><DiscussionPanel projectId={project.id} comments={workspace.data!.comments} /><section className="content-card"><div className="section-head"><div><span className="eyebrow">Jejak perubahan</span><h3>Aktivitas artikel</h3></div></div>{activity.length ? <div className="activity-list">{activity.slice(0, 12).map(item => <div key={item.id}><span className="avatar avatar-small">{initials(item.actor?.full_name)}</span><div><p><b>{item.actor?.full_name ?? 'Sistem'}</b> {item.message}</p><small>{date.format(new Date(item.created_at))}</small></div></div>)}</div> : <EmptyPanel icon={<Activity size={28} />} title="Belum ada aktivitas" detail="Perubahan dan keputusan penting akan tercatat di sini." />}</section></>;
  }

  return <div className="project-page"><Link className="back-link" to="/launch/app/projects"><ArrowLeft size={18} /> Semua artikel</Link>
    <section className="project-hero studio-article-header"><div className="project-hero-image"><SafeImage src={project.reference_image_url} alt={project.article_name} fallback={<Shirt size={44} />} /><span className="unit-chip" style={{ '--unit-color': project.business_unit?.accent_color ?? '#087e79' } as React.CSSProperties}>{project.business_unit?.short_name}</span></div><div className="project-hero-copy"><div className="project-meta"><span>{project.code}</span><StatusPill status={project.status} /><span className={`priority priority-${project.priority.toLowerCase()}`}>{project.priority}</span></div><h2>{project.article_name}</h2><p>{project.category} · {stageMeta[project.current_stage]?.label}</p><div className="hero-facts"><span><Target size={16} /> {project.target_fix_date ? `Fix ${date.format(new Date(project.target_fix_date))}` : 'Target fix belum ada'}</span><span><CalendarDays size={16} /> {project.target_launch_date ? `Rilis ${date.format(new Date(project.target_launch_date))}` : 'Target rilis belum ada'}</span><span><Users size={16} /> {project.owner?.full_name ?? 'PIC belum ditetapkan'}</span></div></div><div className="hero-progress"><div className="progress-ring" style={{ '--progress': `${project.progress * 3.6}deg` } as React.CSSProperties}><span><b>{project.progress}%</b><small>workflow</small></span></div><div className="hero-actions"><button type="button" className="button button-secondary hero-edit" onClick={() => setEditing(true)}><Pencil size={16} /> Ubah</button>{canDelete && <DeleteButton label={`artikel ${project.article_name}`} pending={deleteProjectMutation.isPending} onConfirm={() => deleteProjectMutation.mutate(project.id, { onSuccess: () => navigate('/launch/app/projects') })} />}</div></div></section>

    {editing && <EditProjectPanel project={project} onClose={() => setEditing(false)} />}

    <section className="stage-card"><div className="section-head"><div><span className="eyebrow">Alur utama</span><h3>{currentStage ? `Sekarang: ${stageMeta[currentStage.code].label}` : 'Seluruh tahap selesai'}</h3></div><div className="stage-card-actions">{currentStage && currentStage.status === 'NOT_STARTED' && <button className="button button-secondary" onClick={() => stageMutation.mutate({ stageId: currentStage.id, status: 'IN_PROGRESS' })}>Mulai tahap <ArrowRight size={16} /></button>}{currentStage && currentStage.status !== 'BLOCKED' && currentStage.status !== 'COMPLETED' && <button type="button" className="button button-danger-ghost" onClick={() => setReportingBlocker(true)}><AlertTriangle size={15} /> Tandai terhambat</button>}</div></div><StageRail stages={stages} active={project.current_stage} /></section>

    {reportingBlocker && currentStage && <BlockerReportForm projectId={project.id} stageId={currentStage.id} onDone={() => setReportingBlocker(false)} />}
    {openBlocker && <OpenBlockerCard projectId={project.id} blocker={openBlocker} />}

    <div className="project-tabs studio-mode-switch">{([['brief', 'Brief'], ['overview', 'Detail'], ['work', 'Workspace']] as const).map(item => <button key={item[0]} className={tab === item[0] ? 'active' : ''} onClick={() => setTab(item[0])}>{item[1]}</button>)}</div>

    {tab === 'brief' && <BriefSnapshot references={references} materials={materials} colorways={colorways} sizeCharts={sizeCharts} hpp={hpp} />}
    {tab === 'overview' && <><IndicatorPanel workspace={workspace.data} /><ArticleResultPanel workspace={workspace.data} /><div className="workspace-grid"><section className="content-card next-action"><div className="next-icon"><ArrowUpRight size={23} /></div><div><span className="eyebrow">Tindakan terbaik berikutnya</span><h3>{currentStage?.status === 'BLOCKED' ? 'Buka hambatan tahap ini' : `Lanjutkan ${currentStage ? stageMeta[currentStage.code].label.toLowerCase() : 'persiapan produksi'}`}</h3><p>{currentStage?.blocking_note || 'Lengkapi data wajib dan selesaikan tugas terbuka sebelum mengajukan review.'}</p></div><button className="button button-primary" onClick={() => setTab('work')}>Buka ruang kerja</button></section>
      <section className="content-card"><div className="section-head"><div><span className="eyebrow">Kelengkapan artikel</span><h3>Gate produksi</h3></div></div><div className="gate-list"><div className={colorways.length ? 'done' : ''}><span>{colorways.length ? <Check size={15} /> : <Palette size={16} />}</span><b>Varian warna</b><small>{colorways.length} final/kandidat</small></div><div className={latestHpp?.status === 'FINAL' ? 'done' : ''}><span>{latestHpp?.status === 'FINAL' ? <Check size={15} /> : <CircleDollarSign size={16} />}</span><b>HPP final</b><small>{latestHpp ? money.format(latestHpp.total_hpp) : 'Belum dihitung'}</small></div><div className={sizeCharts.some(item => item.status === 'FINAL') ? 'done' : ''}><span>{sizeCharts.some(item => item.status === 'FINAL') ? <Check size={15} /> : <Layers3 size={16} />}</span><b>Size chart</b><small>{sizeCharts.length ? sizeCharts[0].status : 'Belum tersedia'}</small></div><div className={qc.some(item => item.result === 'PASS') ? 'done' : ''}><span>{qc.some(item => item.result === 'PASS') ? <Check size={15} /> : <PackageCheck size={16} />}</span><b>QC sample</b><small>{qc.length ? qc[0].result : 'Belum diperiksa'}</small></div></div></section>
      <section className="content-card"><div className="section-head"><div><span className="eyebrow">Tugas terbuka</span><h3>Yang perlu diselesaikan</h3></div><button className="text-button" onClick={() => setTab('tasks')}>Lihat semua</button></div>{openTasks.length ? <div className="task-list">{openTasks.slice(0, 5).map(task => <TaskRow task={task} key={task.id} allTasks={tasks} onComplete={() => completeTaskMutation.mutateAsync(task.id)} />)}</div> : <EmptyPanel icon={<CheckCircle2 size={27} />} title="Semua tugas selesai" detail="Tidak ada tugas terbuka pada artikel ini." />}</section></div></>}

    {tab === 'work' && <div className="blueprint-workspace unified-workspace">
      <aside className="blueprint-stage-nav">
        <div className="stage-nav-head"><span>LEMBAR KERJA</span><b>{expandedWorkstreams.length}/{workspaceSections.length} panel terbuka</b></div>
        {workspaceSections.map((item, index) => <button type="button" key={item.code} className={activeStudioPanel === item.code ? 'active' : ''} onClick={() => focusWorkstream(item.code)}><span className="stage-nav-number">{String(index + 1).padStart(2, '0')}</span><span><b>{item.label}</b><small>{item.metric}</small></span><em>{item.completeness}%</em></button>)}
      </aside>
      <main className="blueprint-workspace-main unified-workspace-form">
        <section className="workspace-form-intro">
          <div><span className="eyebrow">Lembar kerja artikel</span><h3>Lengkapi secara bertahap dalam satu halaman.</h3><p>Buka panel yang dibutuhkan, isi bersama tim, lalu tutup kembali tanpa kehilangan konteks artikel.</p></div>
          <div><button type="button" onClick={() => setExpandedWorkstreams(workspaceSections.map(item => item.code))}>Buka semua</button><button type="button" onClick={() => setExpandedWorkstreams([])}>Tutup semua</button></div>
        </section>
        <div className="workspace-accordion">
          {workspaceSections.map((item, index) => {
            const expanded = expandedWorkstreams.includes(item.code);
            const complete = item.completeness >= 100;
            return <StudioWorkspacePanel
              key={item.code}
              id={`workspace-${item.code.toLowerCase()}`}
              index={index + 1}
              icon={item.icon}
              title={item.label}
              subtitle={item.eyebrow}
              metric={item.metric}
              completeness={item.completeness}
              missingCount={item.missing}
              owner={project.owner?.full_name}
              state={complete ? 'complete' : item.completeness >= 70 ? 'review' : 'incomplete'}
              expanded={expanded}
              active={activeStudioPanel === item.code}
              pinned={pinnedPanels.includes(item.code)}
              onToggle={() => toggleWorkstream(item.code)}
              onPin={() => setPinnedPanels(current => current.includes(item.code) ? current.filter(code => code !== item.code) : [...current, item.code])}
              onResult={() => setTab('overview')}
            >{renderWorkstreamPanel(item.code)}</StudioWorkspacePanel>;
          })}
        </div>
      </main>
      <aside className="blueprint-context-panel">
        <div className="context-score"><span className="progress-ring" style={{ '--progress': `${project.progress * 3.6}deg` } as React.CSSProperties}><b>{project.progress}%</b></span><div><small>KESIAPAN ARTIKEL</small><b>{project.progress < 100 ? 'Masih dikembangkan' : 'Siap diproduksi'}</b></div></div>
        <div className="context-section"><span>TARGET FIX ARTIKEL</span><b>{project.target_fix_date ? date.format(new Date(project.target_fix_date)) : 'Belum ditentukan'}</b><small>Seluruh spesifikasi harus terkunci</small></div>
        <div className="context-section"><span>PANEL TERBUKA</span><b>{expandedWorkstreams.length} dari {workspaceSections.length}</b><small>Input tersimpan per panel kerja</small></div>
        <div className="context-checks"><span>KELENGKAPAN UTAMA</span><div className={materials.length ? 'done' : ''}><i>{materials.length ? <Check size={12} /> : null}</i><b>Material & supplier</b></div><div className={colorways.length ? 'done' : ''}><i>{colorways.length ? <Check size={12} /> : null}</i><b>Varian warna</b></div><div className={sizeCharts.length ? 'done' : ''}><i>{sizeCharts.length ? <Check size={12} /> : null}</i><b>Size chart</b></div><div className={hpp.length ? 'done' : ''}><i>{hpp.length ? <Check size={12} /> : null}</i><b>Draft HPP</b></div></div>
        <button className="button button-primary context-update" onClick={() => focusWorkstream('TASKS')}><Activity size={16} /> Tambah update tim</button>
      </aside>
    </div>}

    {tab === 'work' && expandedWorkstreams.length < 0 && <div className="blueprint-workspace">
      <aside className="blueprint-stage-nav">
        <div className="stage-nav-head"><span>LEMBAR KERJA</span><b>{project.progress}% selesai</b></div>
        <button type="button" className={activeWorkstream === null ? 'active' : ''} onClick={() => setActiveWorkstream(null)}><Layers3 size={17} /><span><b>Ringkasan</b><small>Semua panel kerja</small></span></button>
        {WORKSTREAM_TABS.filter(item => item.code !== null).map(item => <button type="button" key={item.label} className={activeWorkstream === item.code ? 'active' : ''} onClick={() => setActiveWorkstream(item.code)}>{item.icon}<span><b>{item.label}</b><small>{item.code && stageOf(item.code as StageCode) ? `${stageOf(item.code as StageCode)?.progress ?? 0}% lengkap` : 'Panel operasional'}</small></span></button>)}
      </aside>
      <main className="blueprint-workspace-main">
      <div className="workstream-tabs">{WORKSTREAM_TABS.map(item => <button type="button" key={item.label} className={activeWorkstream === item.code ? 'active' : ''} onClick={() => setActiveWorkstream(item.code)}>{item.icon}{item.label}</button>)}</div>
      {activeWorkstream === 'RESEARCH'
      ? <ResearchPanel projectId={project.id} stage={stageOf('RESEARCH')} references={references} researchSummary={project.research_summary} onBack={() => setActiveWorkstream(null)} />
      : activeWorkstream === 'SOURCING'
      ? <SourcingPanel projectId={project.id} stage={stageOf('SOURCING')} materials={materials} onBack={() => setActiveWorkstream(null)} />
      : activeWorkstream === 'SAMPLING'
      ? <SamplingPanel projectId={project.id} stage={stageOf('SAMPLING')} samples={samples} onBack={() => setActiveWorkstream(null)} />
      : activeWorkstream === 'COSTING'
      ? <CostingPanel projectId={project.id} stage={stageOf('COSTING')} hpp={hpp} materials={materials} onBack={() => setActiveWorkstream(null)} />
      : activeWorkstream === 'SPECIFICATION'
      ? <SpecificationPanel projectId={project.id} category={project.category} stage={stageOf('SPECIFICATION')} colorways={colorways} sizeCharts={sizeCharts} variantMatrix={workspace.data.variantMatrix} hpp={hpp} onBack={() => setActiveWorkstream(null)} />
      : activeWorkstream === 'QC'
      ? <QcPanel projectId={project.id} stage={stageOf('QC')} qc={qc} samples={samples} onBack={() => setActiveWorkstream(null)} />
      : activeWorkstream === 'OWNER_APPROVAL'
      ? <ApprovalPanel projectId={project.id} ownerApprovalStage={stageOf('OWNER_APPROVAL')} productionReadyStage={stageOf('PRODUCTION_READY')} approvals={workspace.data.approvals} onBack={() => setActiveWorkstream(null)} />
      : activeWorkstream === 'PRODUCTION'
      ? <ProductionPanel projectId={project.id} batches={productionBatches} targetQuantity={project.target_quantity} onBack={() => setActiveWorkstream(null)} />
      : activeWorkstream === 'LAUNCH'
      ? <LaunchPreparationPanel projectId={project.id} projectName={project.article_name} targetLaunchDate={project.target_launch_date} releasePlan={releasePlan} onBack={() => setActiveWorkstream(null)} />
      : <section className="workstream-grid"><Workstream icon={<BookOpen />} tone="blue" title="Riset & referensi" metric={`${references.length} referensi`} detail="Benchmark, fungsi, target pengguna, dan insight artikel." onClick={() => setActiveWorkstream('RESEARCH')} /><Workstream icon={<Factory />} tone="purple" title="Bahan & supplier" metric={`${materials.length} kandidat`} detail="Kandidat bahan, quotation, MOQ, lead time, dan supplier terpilih." onClick={() => setActiveWorkstream('SOURCING')} /><Workstream icon={<Shirt />} tone="orange" title="Sampling" metric={samples.length ? `${samples.length} versi sample` : 'Belum ada sample'} detail="Konstruksi, pola, revisi, foto, dan master sample." onClick={() => setActiveWorkstream('SAMPLING')} /><Workstream icon={<CircleDollarSign />} tone="green" title="HPP & harga" metric={latestHpp ? money.format(latestHpp.total_hpp) : 'Belum dihitung'} detail="Bahan, aksesori, jasa, overhead, margin, dan harga rekomendasi." onClick={() => setActiveWorkstream('COSTING')} /><Workstream icon={<Palette />} tone="pink" title="Warna & size chart" metric={`${colorways.length} warna · ${sizeCharts.length} chart`} detail="Varian final, titik ukur, toleransi, dan standar produksi." onClick={() => setActiveWorkstream('SPECIFICATION')} /><Workstream icon={<PackageCheck />} tone="yellow" title="QC" metric={qc[0]?.result ?? 'Belum diperiksa'} detail="Checklist kualitas dan bukti pemeriksaan sebelum approval." onClick={() => setActiveWorkstream('QC')} /><Workstream icon={<ShieldCheck />} tone="blue" title="Approval produksi" metric={workspace.data.approvals[0]?.status ?? 'Belum diajukan'} detail="Persetujuan owner sebelum artikel ditandai siap produksi." onClick={() => setActiveWorkstream('OWNER_APPROVAL')} /><Workstream icon={<Factory />} tone="purple" title="Produksi massal" metric={productionBatches.length ? `${productionBatches.length} batch` : 'Belum ada batch'} detail="Monitor cutting, jahit, finishing, QC, output, reject, dan rework." onClick={() => setActiveWorkstream('PRODUCTION')} /><Workstream icon={<Megaphone />} tone="orange" title="Persiapan rilis" metric={releasePlan?.status ? releasePlan.status.replace(/_/g, ' ') : 'Belum dimulai'} detail="Nama final, konten, harga, kanal penjualan, dan checklist publikasi." onClick={() => setActiveWorkstream('LAUNCH')} /></section>}
      </main>
      <aside className="blueprint-context-panel">
        <div className="context-score"><span className="progress-ring" style={{ '--progress': `${project.progress * 3.6}deg` } as React.CSSProperties}><b>{project.progress}%</b></span><div><small>KESIAPAN ARTIKEL</small><b>{project.progress < 100 ? 'Masih dikembangkan' : 'Siap diproduksi'}</b></div></div>
        <div className="context-section"><span>TARGET BERIKUTNYA</span><b>{project.target_fix_date ? date.format(new Date(project.target_fix_date)) : 'Belum ditentukan'}</b><small>Fix artikel dan seluruh spesifikasi</small></div>
        <div className="context-section"><span>PIC UTAMA</span><b>{project.owner?.full_name ?? 'Belum ditetapkan'}</b><small>{openTasks.length} tugas masih terbuka</small></div>
        <div className="context-checks">
          <span>GATE UTAMA</span>
          <div className={materials.length ? 'done' : ''}><i>{materials.length ? <Check size={12} /> : null}</i><b>Material & supplier</b></div>
          <div className={colorways.length ? 'done' : ''}><i>{colorways.length ? <Check size={12} /> : null}</i><b>Varian warna</b></div>
          <div className={sizeCharts.length ? 'done' : ''}><i>{sizeCharts.length ? <Check size={12} /> : null}</i><b>Size chart</b></div>
          <div className={hpp.length ? 'done' : ''}><i>{hpp.length ? <Check size={12} /> : null}</i><b>Draft HPP</b></div>
        </div>
        <button className="button button-primary context-update" onClick={() => setTab('progress')}><Activity size={16} /> Tambah update tim</button>
      </aside>
    </div>}

    {tab === 'progress' && <ProgressSheetPanel projectId={project.id} currentStage={project.current_stage} updates={workspace.data.progressUpdates} />}
    {tab === 'tasks' && <section className="content-card tasks-full"><div className="section-head"><div><span className="eyebrow">Eksekusi tim</span><h3>Daftar tugas artikel</h3></div></div>{tasks.length ? <div className="task-list">{tasks.map(task => <TaskRow key={task.id} task={task} allTasks={tasks} onComplete={task.status === 'DONE' ? undefined : () => completeTaskMutation.mutateAsync(task.id)} onSetDependency={(dependsOnId, type) => dependencyMutation.mutateAsync({ taskId: task.id, dependsOnId, type })} />)}</div> : <EmptyPanel icon={<CheckCircle2 size={28} />} title="Belum ada tugas" detail="Tugas otomatis akan muncul ketika tahapan mulai dikerjakan." />}</section>}
    {tab === 'discussion' && <DiscussionPanel projectId={project.id} comments={workspace.data.comments} />}
    {tab === 'activity' && <section className="content-card activity-card"><div className="section-head"><div><span className="eyebrow">Jejak keputusan</span><h3>Aktivitas artikel</h3></div></div>{activity.length ? <div className="activity-list">{activity.map(item => <div key={item.id}><span className="avatar avatar-small">{initials(item.actor?.full_name)}</span><div><p><b>{item.actor?.full_name ?? 'Sistem'}</b> {item.message}</p><small>{date.format(new Date(item.created_at))}</small></div></div>)}</div> : <EmptyPanel icon={<Activity size={28} />} title="Belum ada aktivitas" detail="Perubahan dan keputusan penting akan tercatat di sini." />}</section>}
  </div>;
}

function Workstream({ icon, tone, title, metric, detail, onClick }: { icon: ReactNode; tone: string; title: string; metric: string; detail: string; onClick?: () => void }) {
  const inner = <><span className={`workstream-icon ${tone}`}>{icon}</span><div><small>MODUL KERJA</small><h3>{title}</h3><b>{metric}</b><p>{detail}</p></div><span className="workstream-arrow" aria-hidden="true"><ChevronRight size={19} /></span></>;
  if (onClick) return <button type="button" className="workstream-card workstream-card-clickable" onClick={onClick}>{inner}</button>;
  return <article className="workstream-card">{inner}</article>;
}

export function LibraryPage() {
  const materials = useMasterMaterials();
  const suppliers = useMasterSuppliers();
  const costs = useCostComponents();
  const deactivateMaterial = useDeactivateMasterMaterial();
  const deactivateSupplier = useDeactivateMasterSupplier();
  const deactivateCost = useDeactivateCostComponent();
  const [materialForm, setMaterialForm] = useState<'new' | MasterMaterial | null>(null);
  const [supplierForm, setSupplierForm] = useState<'new' | MasterSupplier | null>(null);
  const [costForm, setCostForm] = useState(false);
  const isLoading = materials.isLoading || suppliers.isLoading;
  const error = materials.error || suppliers.error;

  return <div className="page-stack">
    <section className="page-intro"><div><span className="eyebrow">Sumber daya bersama</span><h2>Jangan riset hal yang sama dua kali.</h2><p>Supplier dan bahan tervalidasi menjadi pengetahuan bersama untuk artikel berikutnya.</p></div></section>
    {materialForm && <MaterialFormPanel material={materialForm === 'new' ? undefined : materialForm} onClose={() => setMaterialForm(null)} />}
    {supplierForm && <SupplierFormPanel supplier={supplierForm === 'new' ? undefined : supplierForm} onClose={() => setSupplierForm(null)} />}
    {costForm && <CostComponentFormPanel onClose={() => setCostForm(false)} />}
    {isLoading ? <LoadingBlocks /> : error ? <ErrorPanel /> : <div className="library-grid">
      <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Mitra produksi</span><h3>Supplier</h3></div><span className="count-badge">{suppliers.data?.length}</span><button type="button" className="button button-secondary" onClick={() => setSupplierForm('new')}><Plus size={16} /> Tambah</button></div>
        {suppliers.data?.length ? <div className="resource-list">{suppliers.data.map(item => <div key={item.id}><span className="resource-icon"><Factory size={18} /></span><div><b>{item.name}</b><small>{item.city || 'Lokasi belum diisi'} · {item.lead_time_days ? `${item.lead_time_days} hari` : 'Lead time belum ada'}</small></div><button type="button" className="icon-button" onClick={() => setSupplierForm(item)} aria-label="Ubah supplier"><Pencil size={16} /></button><DeleteButton label={`supplier ${item.name}`} pending={deactivateSupplier.isPending} onConfirm={() => deactivateSupplier.mutate(item.id)} /></div>)}</div> : <EmptyPanel icon={<Factory size={28} />} title="Supplier belum tercatat" detail="Tambahkan supplier saat proses sourcing artikel pertama." />}
      </section>
      <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Standar bahan</span><h3>Material</h3></div><span className="count-badge">{materials.data?.length}</span><button type="button" className="button button-secondary" onClick={() => setMaterialForm('new')}><Plus size={16} /> Tambah</button></div>
        {materials.data?.length ? <div className="resource-list">{materials.data.map(item => <div key={item.id}><span className="resource-icon"><Layers3 size={18} /></span><div><b>{item.name}</b><small>{item.category} · {item.composition || 'Komposisi belum diisi'}</small></div><button type="button" className="icon-button" onClick={() => setMaterialForm(item)} aria-label="Ubah material"><Pencil size={16} /></button><DeleteButton label={`material ${item.name}`} pending={deactivateMaterial.isPending} onConfirm={() => deactivateMaterial.mutate(item.id)} /></div>)}</div> : <EmptyPanel icon={<Layers3 size={28} />} title="Material belum tercatat" detail="Material yang disetujui akan menjadi pustaka yang dapat dipakai ulang." />}
      </section>
      <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Variabel HPP</span><h3>Komponen biaya</h3></div><span className="count-badge">{costs.data?.length ?? 0}</span><button type="button" className="button button-secondary" onClick={() => setCostForm(true)}><Plus size={16} /> Tambah</button></div>
        {costs.isLoading ? <LoadingBlocks /> : costs.error ? <div className="state-panel"><AlertCircle size={24} /><h3>Master biaya belum aktif</h3><p>Terapkan pembaruan database operasional untuk mengaktifkannya.</p></div> : costs.data?.length ? <div className="resource-list">{costs.data.map(item => <div key={item.id}><span className="resource-icon"><CircleDollarSign size={18} /></span><div><b>{item.name}</b><small>{item.category} · {item.unit}{item.default_price ? ` · ${money.format(item.default_price)}` : ''}</small></div><DeleteButton label={`komponen ${item.name}`} pending={deactivateCost.isPending} onConfirm={() => deactivateCost.mutate(item.id)} /></div>)}</div> : <EmptyPanel icon={<CircleDollarSign size={28} />} title="Komponen biaya belum tercatat" detail="Simpan cutting, CMT, finishing, packing, dan biaya custom agar dapat dipilih ulang." />}
      </section>
    </div>}
  </div>;
}

type CalendarMilestone = {
  id: string;
  date: string;
  label: string;
  tone: string;
  project: LaunchProject;
};

export function LaunchCalendarPage() {
  const projects = useProjects();
  const milestones = (projects.data ?? []).flatMap(project => ([
    project.target_sample_date && { id: `${project.id}-sample`, date: project.target_sample_date, label: 'Sample pertama', tone: 'sample', project },
    project.target_fix_date && { id: `${project.id}-fix`, date: project.target_fix_date, label: 'Fix artikel', tone: 'fix', project },
    project.target_date && { id: `${project.id}-production`, date: project.target_date, label: 'Produk selesai', tone: 'production', project },
    project.target_launch_date && { id: `${project.id}-launch`, date: project.target_launch_date, label: 'Rilis produk', tone: 'launch', project },
  ].filter(Boolean) as CalendarMilestone[])).sort((a, b) => a.date.localeCompare(b.date));
  const grouped = milestones.reduce<Record<string, CalendarMilestone[]>>((result, milestone) => {
    const key = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(`${milestone.date}T00:00:00`));
    result[key] = [...(result[key] ?? []), milestone];
    return result;
  }, {});
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = milestones.filter(item => item.date >= today);

  if (projects.isLoading) return <LoadingBlocks />;
  if (projects.error) return <ErrorPanel />;

  return <div className="page-stack">
    <section className="page-intro"><div><span className="eyebrow">Kalender lintas artikel</span><h2>Seluruh target dalam satu pandangan.</h2><p>Sample, fix artikel, produk selesai, dan rilis tersusun agar benturan waktu terlihat lebih awal.</p></div><Link className="button button-primary" to="/launch/app/projects/new"><Plus size={18} /> Artikel baru</Link></section>
    <section className="calendar-summary">
      <div><CalendarDays size={20} /><span><small>Milestone mendatang</small><b>{upcoming.length}</b></span></div>
      <div><Shirt size={20} /><span><small>Target sample</small><b>{upcoming.filter(item => item.tone === 'sample').length}</b></span></div>
      <div><Factory size={20} /><span><small>Produk selesai</small><b>{upcoming.filter(item => item.tone === 'production').length}</b></span></div>
      <div><Megaphone size={20} /><span><small>Target rilis</small><b>{upcoming.filter(item => item.tone === 'launch').length}</b></span></div>
    </section>
    {milestones.length ? <div className="calendar-month-list">{Object.entries(grouped).map(([month, items]) => <section className="content-card calendar-month" key={month}>
      <div className="calendar-month-head"><span>{month}</span><b>{items.length} target</b></div>
      <div className="calendar-event-list">{items.map(item => <Link className={`calendar-event calendar-${item.tone} ${item.date < today ? 'calendar-past' : ''}`} to={`/launch/app/projects/${item.project.id}?tab=work`} key={item.id}><time dateTime={item.date}><b>{new Date(`${item.date}T00:00:00`).getDate()}</b><small>{new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(new Date(`${item.date}T00:00:00`))}</small></time><i /><div><span>{item.label}</span><h3>{item.project.article_name}</h3><p>{item.project.code} · {item.project.business_unit?.short_name ?? 'GG Indo Apparel'} · {item.project.category}</p></div><ChevronRight size={19} /></Link>)}</div>
    </section>)}</div> : <EmptyPanel icon={<CalendarDays size={30} />} title="Belum ada target kalender" detail="Target akan otomatis muncul setelah tanggal sample, fix, produksi, atau rilis diisi pada artikel." />}
  </div>;
}

const ROLE_RESPONSIBILITY: Record<string, string> = {
  owner: 'Arah produk, prioritas, keputusan, dan approval akhir.',
  product_lead: 'Riset produk, kelayakan artikel, HPP, dan koordinasi peluncuran.',
  sourcing_lead: 'Sourcing bahan, supplier, quotation, dan dokumentasi.',
  production_qc: 'Sampling, konstruksi, standar ukuran, produksi, dan QC.',
  product_team: 'Berkolaborasi dalam riset, validasi, dan peluncuran artikel.',
};

export function TeamPage() {
  const team = useQuery({ queryKey: ['launch-team-directory'], queryFn: listTeamMembers });
  const members = (team.data ?? []).filter(person => person.is_active);
  return <div className="page-stack"><section className="page-intro"><div><span className="eyebrow">{members.length} orang · 1 sistem</span><h2>Tim kecil dengan visibilitas penuh.</h2><p>Tanggung jawab utama jelas, tetapi informasi dan keputusan tetap dapat dilihat bersama.</p></div></section>{team.isLoading ? <LoadingBlocks /> : team.error ? <ErrorPanel /> : <section className="team-grid">{members.map((person, index) => <article className="team-card" key={person.id}><div className={`avatar avatar-large avatar-tone-${index % 4}`}>{initials(person.full_name)}</div><div><span className="online-dot">Aktif</span><h3>{person.full_name}</h3><b>{person.job_title || person.role_name || 'Tim Product Launch'}</b><p>{(person.role_code && ROLE_RESPONSIBILITY[person.role_code]) ?? 'Berkolaborasi dalam riset, validasi, dan peluncuran artikel.'}</p></div></article>)}</section>}</div>;
}
