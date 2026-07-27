import { FormEvent, ReactNode, useState } from 'react';
import { Activity, AlertCircle, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Boxes, CalendarDays, Check, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, Factory, FileSearch, Filter, ImagePlus, Layers3, MoreHorizontal, PackageCheck, Palette, Plus, Search, Shirt, Sparkles, Target, Users } from 'lucide-react';
import { Link, useNavigate, useParams } from '@/app/router/simpleRouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/core/auth/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { uploadProjectReference } from './data/launchRepository';
import { BriefSnapshot } from './components/BriefSnapshot';
import type { LaunchProject, LaunchStage, LaunchTask, NewProjectInput, Priority, ProjectStatus, StageCode } from './domain/types';
import { STAGE_ORDER } from './domain/types';
import { useBusinessUnits, useCompleteTask, useCreateProject, useMyTasks, useProfiles, useProject, useProjects, useUpdateStage } from './hooks/useLaunch';

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
  return (
    <Link to={`/launch/app/projects/${project.id}`} className="project-card">
      <div className="project-thumb">
        {project.reference_image_url ? <img src={project.reference_image_url} alt={`Referensi ${project.article_name}`} /> : <Shirt size={34} />}
        <span className="unit-chip" style={{ '--unit-color': project.business_unit?.accent_color ?? '#f36b21' } as React.CSSProperties}>{project.business_unit?.short_name ?? 'GG'}</span>
      </div>
      <div className="project-card-body">
        <div className="project-card-top"><span>{project.code}</span><MoreHorizontal size={18} /></div>
        <h3>{project.article_name}</h3>
        <p>{project.category} · {stageMeta[project.current_stage]?.label ?? project.current_stage}</p>
        <Progress value={project.progress} />
        <div className="project-card-footer"><StatusPill status={project.status} /><span><Clock3 size={14} /> {dueText(project.target_date)}</span></div>
      </div>
    </Link>
  );
}

function TaskRow({ task, onComplete }: { task: LaunchTask; onComplete?: () => void }) {
  return <div className="task-row"><button className={`task-check ${task.status === 'DONE' ? 'done' : ''}`} onClick={onComplete} disabled={!onComplete} aria-label="Tandai selesai">{task.status === 'DONE' && <Check size={14} />}</button><div className="task-main"><b>{task.title}</b><span>{task.project?.article_name ?? stageMeta[task.stage_code]?.label}</span></div><span className={`task-due ${task.due_date && new Date(task.due_date) < new Date() ? 'late' : ''}`}>{dueText(task.due_date)}</span></div>;
}

export function TodayPage() {
  const auth = useAuth();
  const projects = useProjects();
  const tasks = useMyTasks();
  const name = auth.data?.profile?.full_name.split(' ')[0] ?? 'Tim';
  const data = projects.data ?? [];
  const active = data.filter(item => item.status === 'ACTIVE');
  const review = data.filter(item => item.status === 'IN_REVIEW');
  const blocked = data.filter(item => item.status === 'BLOCKED');
  const ready = data.filter(item => item.status === 'READY_FOR_PRODUCTION');
  const stageCounts = STAGE_ORDER.map(code => ({ code, count: data.filter(item => item.current_stage === code).length }));

  if (projects.isLoading) return <LoadingBlocks />;
  if (projects.error) return <ErrorPanel detail="Koneksi layanan tersedia, tetapi struktur Product Launch OS baru belum terbaca. Terapkan migration reset yang disertakan." />;

  return (
    <div className="page-stack">
      <section className="welcome-row">
        <div><span className="eyebrow">Minggu peluncuran · {date.format(new Date())}</span><h2>Selamat bekerja, {name}.</h2><p>Berikut fokus yang paling mendekatkan artikel ke produksi hari ini.</p></div>
        <Link to="/launch/app/projects/new" className="button button-primary"><Plus size={18} /> Perintah artikel baru</Link>
      </section>

      <section className="decision-banner">
        <div className="decision-icon"><Sparkles size={24} /></div>
        <div><span>PRIORITAS OWNER</span><h3>{review.length ? `${review.length} artikel menunggu keputusan Anda` : 'Tidak ada keputusan yang tertahan'}</h3><p>{review.length ? 'Review HPP, hasil sample, atau persetujuan produksi agar pekerjaan tim terus bergerak.' : 'Seluruh approval terkini sudah tertangani. Pantau artikel aktif di bawah.'}</p></div>
        <Link to="/launch/app/projects?status=IN_REVIEW" className="button button-light">{review.length ? 'Buka antrean' : 'Lihat artikel'} <ArrowRight size={17} /></Link>
      </section>

      <section className="metric-grid">
        <div className="metric-card"><span className="metric-icon orange"><Activity size={19} /></span><div><small>Artikel berjalan</small><b>{active.length}</b><span>{data.length} total artikel</span></div></div>
        <div className="metric-card"><span className="metric-icon yellow"><Clock3 size={19} /></span><div><small>Tugas saya</small><b>{tasks.data?.length ?? 0}</b><span>butuh perhatian</span></div></div>
        <div className="metric-card"><span className="metric-icon red"><AlertCircle size={19} /></span><div><small>Terhambat</small><b>{blocked.length}</b><span>perlu dibuka</span></div></div>
        <div className="metric-card"><span className="metric-icon green"><PackageCheck size={19} /></span><div><small>Siap produksi</small><b>{ready.length}</b><span>artikel tervalidasi</span></div></div>
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
          {data.length ? <div className="project-list-compact">{data.slice(0, 4).map(project => <Link to={`/launch/app/projects/${project.id}`} key={project.id}><span className="compact-thumb">{project.reference_image_url ? <img src={project.reference_image_url} alt="" /> : <Shirt size={22} />}</span><div><b>{project.article_name}</b><small>{project.code} · {stageMeta[project.current_stage].short}</small></div><Progress value={project.progress} compact /><ChevronRight size={18} /></Link>)}</div> : <EmptyPanel icon={<Boxes size={28} />} title="Belum ada artikel" detail="Mulai dari gambar referensi pertama yang diberikan owner." action={<Link className="button button-primary" to="/launch/app/projects/new">Buat artikel pertama</Link>} />}
        </section>
        <section className="content-card">
          <div className="section-head"><div><span className="eyebrow">Fokus personal</span><h3>Tugas saya</h3></div><span className="count-badge">{tasks.data?.length ?? 0}</span></div>
          {tasks.isLoading ? <LoadingBlocks /> : tasks.data?.length ? <div className="task-list">{tasks.data.slice(0, 5).map(task => <TaskRow key={task.id} task={task} />)}</div> : <EmptyPanel icon={<CheckCircle2 size={28} />} title="Fokus terkendali" detail="Belum ada tugas terbuka yang ditugaskan kepada Anda." />}
        </section>
      </div>
    </div>
  );
}

export function ProjectsPage() {
  const [status, setStatus] = useState('ALL');
  const [query, setQuery] = useState('');
  const projects = useProjects(status);
  const filtered = (projects.data ?? []).filter(item => `${item.article_name} ${item.code} ${item.category}`.toLowerCase().includes(query.toLowerCase()));
  const filters = [['ALL', 'Semua'], ['ACTIVE', 'Berjalan'], ['IN_REVIEW', 'Review'], ['BLOCKED', 'Terhambat'], ['READY_FOR_PRODUCTION', 'Siap produksi']];

  return <div className="page-stack"><section className="page-intro"><div><span className="eyebrow">Portfolio artikel</span><h2>Kelola seluruh peluncuran.</h2><p>Urutkan pekerjaan berdasarkan status, brand, atau kebutuhan keputusan.</p></div><Link className="button button-primary" to="/launch/app/projects/new"><Plus size={18} /> Artikel baru</Link></section>
    <section className="toolbar-card"><div className="search-field"><Search size={18} /><input placeholder="Cari nama artikel, kode, atau kategori…" value={query} onChange={event => setQuery(event.target.value)} /></div><div className="filter-scroll">{filters.map(([value, label]) => <button className={status === value ? 'active' : ''} key={value} onClick={() => setStatus(value)}>{label}</button>)}</div><button className="icon-button filter-button"><Filter size={19} /></button></section>
    {projects.isLoading ? <LoadingBlocks /> : projects.error ? <ErrorPanel /> : filtered.length ? <section className="project-grid">{filtered.map(project => <ProjectCard project={project} key={project.id} />)}</section> : <EmptyPanel icon={<FileSearch size={30} />} title="Tidak ada artikel yang cocok" detail="Ubah kata pencarian atau filter status untuk melihat artikel lainnya." />}
  </div>;
}

export function NewProjectPage() {
  const navigate = useNavigate();
  const units = useBusinessUnits();
  const create = useCreateProject();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState<NewProjectInput>({ article_name: '', business_unit_id: '', category: '', concept: '', source_notes: '', priority: 'HIGH', target_date: '' });
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    try {
      const projectId = await create.mutateAsync(form);
      if (image) await uploadProjectReference(projectId, image);
      navigate(`/launch/app/projects/${projectId}`);
    } catch (reason) { setSubmitError(reason instanceof Error ? reason.message : 'Perintah artikel belum dapat dibuat.'); }
  }

  function chooseImage(file?: File) { if (!file) return; setImage(file); setPreview(URL.createObjectURL(file)); }

  return <div className="form-page"><div className="form-top"><button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Kembali</button><div><span className="eyebrow">Perintah kerja owner</span><h2>Mulai artikel dari satu referensi.</h2><p>Sistem otomatis menyiapkan sembilan tahap kerja dan ruang kolaborasi tim.</p></div></div>
    <form className="project-form" onSubmit={submit}>
      <div className="form-main">
        <section className="form-section"><div className="form-section-title"><span>01</span><div><h3>Gambar & identitas artikel</h3><p>Titik awal yang menyatukan pemahaman seluruh tim.</p></div></div>
          <label className={`upload-zone ${preview ? 'has-preview' : ''}`}>{preview ? <img src={preview} alt="Preview referensi" /> : <><span><ImagePlus size={27} /></span><b>Tambahkan gambar referensi</b><small>Foto, screenshot, atau sketsa · JPG/PNG/WebP · maks. 10 MB</small></>}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => chooseImage(event.target.files?.[0])} />{preview && <div className="upload-overlay">Ganti gambar</div>}</label>
          <div className="field-grid"><label className="field field-wide"><span>Nama artikel *</span><input required placeholder="Contoh: Windbreaker Urban Shell" value={form.article_name} onChange={e => setForm({ ...form, article_name: e.target.value })} /></label><label className="field"><span>Unit bisnis *</span><select required value={form.business_unit_id} onChange={e => setForm({ ...form, business_unit_id: e.target.value })}><option value="">Pilih unit</option>{units.data?.map(unit => <option value={unit.id} key={unit.id}>{unit.name}</option>)}</select></label><label className="field"><span>Kategori *</span><input required placeholder="Jaket, kaos, hoodie…" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></label></div>
        </section>
        <section className="form-section"><div className="form-section-title"><span>02</span><div><h3>Arah produk</h3><p>Jelaskan apa yang perlu dicapai, bukan cara mengerjakannya.</p></div></div><label className="field"><span>Konsep & tujuan artikel</span><textarea rows={4} placeholder="Target pengguna, karakter produk, fungsi utama, kisaran kualitas…" value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })} /></label><label className="field"><span>Catatan dari referensi</span><textarea rows={3} placeholder="Bagian yang harus dipertahankan, diubah, atau diteliti…" value={form.source_notes} onChange={e => setForm({ ...form, source_notes: e.target.value })} /></label></section>
        <section className="form-section"><div className="form-section-title"><span>03</span><div><h3>Prioritas & target</h3><p>Membantu sistem menempatkan pekerjaan pada urutan yang tepat.</p></div></div><div className="field-grid"><label className="field"><span>Prioritas</span><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}><option value="NORMAL">Normal</option><option value="HIGH">Tinggi</option><option value="URGENT">Mendesak</option></select></label><label className="field"><span>Target siap produksi</span><input type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} /></label></div></section>
      </div>
      <aside className="form-summary"><span className="eyebrow">Setelah dibuat</span><h3>Workspace otomatis</h3><ol>{STAGE_ORDER.map((code, index) => <li key={code}><span>{index + 1}</span>{stageMeta[code].label}</li>)}</ol>{submitError && <div className="form-error">{submitError}</div>}<button className="button button-primary button-large" disabled={create.isPending || !form.article_name || !form.business_unit_id || !form.category}>{create.isPending ? 'Menyiapkan workspace…' : 'Mulai perintah artikel'} <ArrowRight size={18} /></button><small>Gambar akan disimpan ke Cloudinary setelah workspace dibuat.</small></aside>
    </form>
  </div>;
}

function StageRail({ stages, active }: { stages: LaunchStage[]; active: StageCode }) {
  return <div className="stage-rail">{stages.map(stage => <div className={`stage-node stage-${stage.status.toLowerCase()} ${stage.code === active ? 'current' : ''}`} key={stage.id}><span>{stage.status === 'COMPLETED' ? <Check size={15} /> : stage.position}</span><div><b>{stageMeta[stage.code].short}</b><small>{stage.progress}%</small></div></div>)}</div>;
}

export function ProjectDetailPage() {
  const { projectId = '' } = useParams();
  const workspace = useProject(projectId);
  const completeTaskMutation = useCompleteTask(projectId);
  const stageMutation = useUpdateStage(projectId);
  const [tab, setTab] = useState<'overview' | 'work' | 'tasks' | 'activity'>('overview');
  if (workspace.isLoading) return <LoadingBlocks />;
  if (workspace.error || !workspace.data) return <ErrorPanel title="Artikel tidak dapat dibuka" />;
  const { project, stages, tasks, activity, references, materials, colorways, hpp, sizeCharts, qc } = workspace.data;
  const currentStage = stages.find(stage => stage.code === project.current_stage) ?? stages.find(stage => stage.status !== 'COMPLETED');
  const openTasks = tasks.filter(task => task.status !== 'DONE');
  const latestHpp = hpp[0];

  return <div className="project-page"><Link className="back-link" to="/launch/app/projects"><ArrowLeft size={18} /> Semua artikel</Link>
    <section className="project-hero"><div className="project-hero-image">{project.reference_image_url ? <img src={project.reference_image_url} alt={project.article_name} /> : <Shirt size={44} />}<span className="unit-chip" style={{ '--unit-color': project.business_unit?.accent_color ?? '#f36b21' } as React.CSSProperties}>{project.business_unit?.short_name}</span></div><div className="project-hero-copy"><div className="project-meta"><span>{project.code}</span><StatusPill status={project.status} /><span className={`priority priority-${project.priority.toLowerCase()}`}>{project.priority}</span></div><h2>{project.article_name}</h2><p>{project.concept || 'Konsep artikel belum dilengkapi.'}</p><div className="hero-facts"><span><Target size={16} /> {project.category}</span><span><CalendarDays size={16} /> {project.target_date ? date.format(new Date(project.target_date)) : 'Target belum ada'}</span><span><Users size={16} /> Owner: {project.owner?.full_name ?? 'Belum ditetapkan'}</span></div></div><div className="hero-progress"><div className="progress-ring" style={{ '--progress': `${project.progress * 3.6}deg` } as React.CSSProperties}><span><b>{project.progress}%</b><small>kesiapan</small></span></div></div></section>

    <section className="stage-card"><div className="section-head"><div><span className="eyebrow">Alur utama</span><h3>{currentStage ? `Sekarang: ${stageMeta[currentStage.code].label}` : 'Seluruh tahap selesai'}</h3></div>{currentStage && currentStage.status === 'NOT_STARTED' && <button className="button button-secondary" onClick={() => stageMutation.mutate({ stageId: currentStage.id, status: 'IN_PROGRESS' })}>Mulai tahap <ArrowRight size={16} /></button>}</div><StageRail stages={stages} active={project.current_stage} /></section>

    <div className="project-tabs">{([['overview', 'Ringkasan'], ['work', 'Ruang kerja'], ['tasks', `Tugas (${openTasks.length})`], ['activity', 'Aktivitas']] as const).map(item => <button key={item[0]} className={tab === item[0] ? 'active' : ''} onClick={() => setTab(item[0])}>{item[1]}</button>)}</div>

    {tab === 'overview' && <div className="workspace-grid"><section className="content-card next-action"><div className="next-icon"><ArrowUpRight size={23} /></div><div><span className="eyebrow">Tindakan terbaik berikutnya</span><h3>{currentStage?.status === 'BLOCKED' ? 'Buka hambatan tahap ini' : `Lanjutkan ${currentStage ? stageMeta[currentStage.code].label.toLowerCase() : 'persiapan produksi'}`}</h3><p>{currentStage?.blocking_note || 'Lengkapi data wajib dan selesaikan tugas terbuka sebelum mengajukan review.'}</p></div><button className="button button-primary" onClick={() => setTab('work')}>Buka ruang kerja</button></section>
      <section className="content-card"><div className="section-head"><div><span className="eyebrow">Kelengkapan artikel</span><h3>Gate produksi</h3></div></div><div className="gate-list"><div className={colorways.length ? 'done' : ''}><span>{colorways.length ? <Check size={15} /> : <Palette size={16} />}</span><b>Varian warna</b><small>{colorways.length} final/kandidat</small></div><div className={latestHpp?.status === 'FINAL' ? 'done' : ''}><span>{latestHpp?.status === 'FINAL' ? <Check size={15} /> : <CircleDollarSign size={16} />}</span><b>HPP final</b><small>{latestHpp ? money.format(latestHpp.total_hpp) : 'Belum dihitung'}</small></div><div className={sizeCharts.some(item => item.status === 'FINAL') ? 'done' : ''}><span>{sizeCharts.some(item => item.status === 'FINAL') ? <Check size={15} /> : <Layers3 size={16} />}</span><b>Size chart</b><small>{sizeCharts.length ? sizeCharts[0].status : 'Belum tersedia'}</small></div><div className={qc.some(item => item.result === 'PASS') ? 'done' : ''}><span>{qc.some(item => item.result === 'PASS') ? <Check size={15} /> : <PackageCheck size={16} />}</span><b>QC sample</b><small>{qc.length ? qc[0].result : 'Belum diperiksa'}</small></div></div></section>
      <section className="content-card"><div className="section-head"><div><span className="eyebrow">Tugas terbuka</span><h3>Yang perlu diselesaikan</h3></div><button className="text-button" onClick={() => setTab('tasks')}>Lihat semua</button></div>{openTasks.length ? <div className="task-list">{openTasks.slice(0, 5).map(task => <TaskRow task={task} key={task.id} onComplete={() => completeTaskMutation.mutate(task.id)} />)}</div> : <EmptyPanel icon={<CheckCircle2 size={27} />} title="Semua tugas selesai" detail="Tidak ada tugas terbuka pada artikel ini." />}</section></div>}

    {tab === 'work' && <><BriefSnapshot references={references} materials={materials} colorways={colorways} sizeCharts={sizeCharts} hpp={hpp} /><section className="workstream-grid"><Workstream icon={<BookOpen />} tone="blue" title="Riset & referensi" metric={`${references.length} referensi`} detail="Benchmark, fungsi, target pengguna, dan insight artikel." /><Workstream icon={<Factory />} tone="purple" title="Bahan & supplier" metric={`${materials.length} kandidat`} detail="Kandidat bahan, quotation, MOQ, lead time, dan supplier terpilih." /><Workstream icon={<Shirt />} tone="orange" title="Sampling" metric="Versi sample" detail="Konstruksi, pola, revisi, foto, dan master sample." /><Workstream icon={<CircleDollarSign />} tone="green" title="HPP & harga" metric={latestHpp ? money.format(latestHpp.total_hpp) : 'Belum dihitung'} detail="Bahan, aksesori, jasa, overhead, margin, dan harga rekomendasi." /><Workstream icon={<Palette />} tone="pink" title="Warna & size chart" metric={`${colorways.length} warna · ${sizeCharts.length} chart`} detail="Varian final, titik ukur, toleransi, dan standar produksi." /><Workstream icon={<PackageCheck />} tone="yellow" title="QC & approval" metric={qc[0]?.result ?? 'Belum diperiksa'} detail="Checklist kualitas, bukti pemeriksaan, revisi, dan persetujuan owner." /></section></>}

    {tab === 'tasks' && <section className="content-card tasks-full"><div className="section-head"><div><span className="eyebrow">Eksekusi tim</span><h3>Daftar tugas artikel</h3></div></div>{tasks.length ? <div className="task-list">{tasks.map(task => <TaskRow key={task.id} task={task} onComplete={task.status === 'DONE' ? undefined : () => completeTaskMutation.mutate(task.id)} />)}</div> : <EmptyPanel icon={<CheckCircle2 size={28} />} title="Belum ada tugas" detail="Tugas otomatis akan muncul ketika tahapan mulai dikerjakan." />}</section>}
    {tab === 'activity' && <section className="content-card activity-card"><div className="section-head"><div><span className="eyebrow">Jejak keputusan</span><h3>Aktivitas artikel</h3></div></div>{activity.length ? <div className="activity-list">{activity.map(item => <div key={item.id}><span className="avatar avatar-small">{initials(item.actor?.full_name)}</span><div><p><b>{item.actor?.full_name ?? 'Sistem'}</b> {item.message}</p><small>{date.format(new Date(item.created_at))}</small></div></div>)}</div> : <EmptyPanel icon={<Activity size={28} />} title="Belum ada aktivitas" detail="Perubahan dan keputusan penting akan tercatat di sini." />}</section>}
  </div>;
}

function Workstream({ icon, tone, title, metric, detail }: { icon: ReactNode; tone: string; title: string; metric: string; detail: string }) { return <article className="workstream-card"><span className={`workstream-icon ${tone}`}>{icon}</span><div><small>MODUL KERJA</small><h3>{title}</h3><b>{metric}</b><p>{detail}</p></div><span className="workstream-arrow" aria-hidden="true"><ChevronRight size={19} /></span></article>; }

export function LibraryPage() {
  const library = useQuery({ queryKey: ['launch-library'], queryFn: async () => { const [suppliers, materials] = await Promise.all([supabase.from('suppliers').select('*').eq('is_active', true).order('name'), supabase.from('materials').select('*').eq('is_active', true).order('name')]); if (suppliers.error) throw suppliers.error; if (materials.error) throw materials.error; return { suppliers: suppliers.data ?? [], materials: materials.data ?? [] }; } });
  return <div className="page-stack"><section className="page-intro"><div><span className="eyebrow">Sumber daya bersama</span><h2>Jangan riset hal yang sama dua kali.</h2><p>Supplier dan bahan tervalidasi menjadi pengetahuan bersama untuk artikel berikutnya.</p></div><button className="button button-primary"><Plus size={18} /> Tambah data</button></section>{library.isLoading ? <LoadingBlocks /> : library.error ? <ErrorPanel /> : <div className="library-grid"><section className="content-card"><div className="section-head"><div><span className="eyebrow">Mitra produksi</span><h3>Supplier</h3></div><span className="count-badge">{library.data?.suppliers.length}</span></div>{library.data?.suppliers.length ? <div className="resource-list">{library.data.suppliers.map(item => <div key={item.id}><span className="resource-icon"><Factory size={18} /></span><div><b>{item.name}</b><small>{item.city || 'Lokasi belum diisi'} · {item.lead_time_days ? `${item.lead_time_days} hari` : 'Lead time belum ada'}</small></div><ChevronRight size={18} /></div>)}</div> : <EmptyPanel icon={<Factory size={28} />} title="Supplier belum tercatat" detail="Tambahkan supplier saat proses sourcing artikel pertama." />}</section><section className="content-card"><div className="section-head"><div><span className="eyebrow">Standar bahan</span><h3>Material</h3></div><span className="count-badge">{library.data?.materials.length}</span></div>{library.data?.materials.length ? <div className="resource-list">{library.data.materials.map(item => <div key={item.id}><span className="resource-icon"><Layers3 size={18} /></span><div><b>{item.name}</b><small>{item.category} · {item.composition || 'Komposisi belum diisi'}</small></div><ChevronRight size={18} /></div>)}</div> : <EmptyPanel icon={<Layers3 size={28} />} title="Material belum tercatat" detail="Material yang disetujui akan menjadi pustaka yang dapat dipakai ulang." />}</section></div>}</div>;
}

export function TeamPage() {
  const profiles = useProfiles();
  const responsibility: Record<string, string> = { gugun: 'Arah produk, prioritas, keputusan, dan approval akhir.', dodi: 'Riset produk, kelayakan artikel, HPP, dan koordinasi peluncuran.', syaikhu: 'Sourcing bahan, supplier, quotation, dan dokumentasi.', yadi: 'Sampling, konstruksi, standar ukuran, produksi, dan QC.' };
  return <div className="page-stack"><section className="page-intro"><div><span className="eyebrow">4 orang · 1 sistem</span><h2>Tim kecil dengan visibilitas penuh.</h2><p>Tanggung jawab utama jelas, tetapi informasi dan keputusan tetap dapat dilihat bersama.</p></div></section>{profiles.isLoading ? <LoadingBlocks /> : profiles.error ? <ErrorPanel /> : <section className="team-grid">{profiles.data?.map((profile, index) => <article className="team-card" key={profile.id}><div className={`avatar avatar-large avatar-tone-${index % 4}`}>{initials(profile.full_name)}</div><div><span className="online-dot">Aktif</span><h3>{profile.full_name}</h3><b>{profile.job_title ?? 'Tim Product Launch'}</b><p>{responsibility[profile.username.toLowerCase()] ?? 'Berkolaborasi dalam riset, validasi, dan peluncuran artikel.'}</p></div><button className="icon-button"><MoreHorizontal size={19} /></button></article>)}</section>}</div>;
}
