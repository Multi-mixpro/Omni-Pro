import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Bell, Check, ChevronDown, CircleDot, Command, Layers3, Menu, Plus, Search, X } from 'lucide-react';
import { Link } from '@/app/router/simpleRouter';
import { initialUnits, modules, samples, staff, workflow, type Item, type ModuleId } from './demo';
import './blueprint.css';

const key = 'gg-blueprint-preview-v1';
const weekday = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const displayDate = (value: string) => value ? weekday.format(new Date(`${value}T00:00:00Z`)) : 'Tanpa tanggal';
const isDone = (item: Item) => item.stage >= workflow(item).length - 1;
const needsDecision = (item: Item) => /review|persetujuan|diajukan/i.test(workflow(item)[item.stage]);

function readDemo() {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (Array.isArray(saved?.items) && Array.isArray(saved?.units)) return saved as { items: Item[]; units: string[] };
  } catch { /* Use the demo starting point. */ }
  return { items: samples, units: initialUnits };
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="bp-dialog" aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="bp-dialog-head"><h2>{title}</h2><button type="button" className="bp-icon" aria-label="Tutup" onClick={onClose}><X size={19} /></button></div>
    {children}
  </dialog>;
}

function ItemRows({ items, open }: { items: Item[]; open: (item: Item) => void }) {
  if (!items.length) return <div className="bp-empty"><Layers3 size={24} /><strong>Belum ada item di tampilan ini</strong><span>Ubah filter atau tambahkan item contoh.</span></div>;
  return <div className="bp-rows">{items.map(item => <button type="button" className="bp-row" key={item.id} onClick={() => open(item)}>
    <span className="bp-row-glyph"><CircleDot size={16} /></span><span className="bp-row-name"><strong>{item.title}</strong><small>{item.unit} · {item.owner}</small></span>
    <span className={`bp-status ${isDone(item) ? 'done' : needsDecision(item) ? 'waiting' : ''}`}>{workflow(item)[item.stage]}</span>
    <span className="bp-row-date">{displayDate(item.due)}</span><ArrowUpRight size={15} />
  </button>)}</div>;
}

export default function BlueprintWorkspace() {
  const [demo, setDemo] = useState(readDemo);
  const [active, setActive] = useState<ModuleId>('overview');
  const [tab, setTab] = useState<string>('Ringkasan');
  const [unit, setUnit] = useState('');
  const [query, setQuery] = useState('');
  const [mobile, setMobile] = useState(false);
  const [board, setBoard] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');
  const [createModule, setCreateModule] = useState<ModuleId>('projects');
  const [createView, setCreateView] = useState('Tugas tim');
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(demo)); } catch { /* Storage can be unavailable. */ } }, [demo]);

  const current = modules.find(module => module.id === active)!;
  const target = modules.find(module => module.id === createModule)!;
  const scoped = demo.items.filter(item => !unit || item.unit === unit);
  const item = demo.items.find(record => record.id === selected);
  const itemStages = item ? workflow(item) : [];
  const pending = scoped.filter(needsDecision);
  const projectCount = scoped.filter(record => record.module === 'projects' && record.view === 'Proyek artikel' && !isDone(record)).length;
  const creativeCount = scoped.filter(record => record.module === 'creative' && !isDone(record)).length;
  const completed = scoped.filter(isDone).length;
  const matching = query.trim() ? scoped.filter(record => `${record.title} ${record.unit} ${record.owner}`.toLowerCase().includes(query.trim().toLowerCase())) : [];
  const dateSorted = [...scoped].filter(record => record.due).sort((a,b) => a.due.localeCompare(b.due));
  const calendarItems = dateSorted.filter(record => tab === 'Jadwal konten' ? record.module === 'creative' : tab === 'Milestone proyek' ? record.view === 'Milestone' : ['projects','creative','marketing'].includes(record.module));
  const rows = active === 'overview' ? (tab === 'Kotak tindakan' ? pending : scoped.filter(record => record.owner === 'Nadia' && !isDone(record)))
    : scoped.filter(record => record.module === active && (tab === 'Persetujuan' ? needsDecision(record) : tab === record.view));
  const open = (record: Item) => { setSelected(record.id); setQuery(''); };
  function go(id: ModuleId, view?: string) {
    setActive(id); setTab(view ?? modules.find(module => module.id === id)!.views[0]);
    setMobile(false); setQuery(''); setBoard(false); setNotice('');
  }
  function beginCreate() {
    const creatable = modules.filter(module => !['overview','business','people','calendar','analytics','settings'].includes(module.id));
    const next = creatable.find(module => module.id === active);
    setCreateModule(next?.id ?? 'projects');
    setCreateView(next && tab !== 'Persetujuan' ? tab : 'Tugas tim');
    setFormError(''); setCreating(true);
  }
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get('title') ?? '').trim();
    if (!title) { setFormError('Isi judul terlebih dahulu.'); return; }
    if (active === 'business') {
      if (demo.units.some(name => name.toLowerCase() === title.toLowerCase())) { setFormError('Unit bisnis ini sudah ada.'); return; }
      setDemo(previous => ({ ...previous, units: [...previous.units, title] }));
    } else {
      const owner = String(form.get('owner'));
      const record: Item = { id: crypto.randomUUID(), title, module: createModule, view: createView,
        unit: String(form.get('unit')), owner, due: String(form.get('due') ?? ''), stage: 0, note: String(form.get('note') ?? '').trim(),
        platforms: form.getAll('platform').map(String), contributors: form.getAll('person').map(String).filter(person => person !== owner) };
      setDemo(previous => ({ ...previous, items: [record, ...previous.items] }));
      setUnit(record.unit); go(record.module, record.view); open(record);
    }
    setCreating(false); setNotice('Perubahan disimpan di prototipe.');
  }
  function changeStage(record: Item, stage: number) {
    setDemo(previous => ({ ...previous, items: previous.items.map(row => row.id === record.id ? { ...row, stage } : row) }));
    setNotice(`${record.title} · ${workflow(record)[stage]}`);
  }
  function convert(record: Item) {
    const existing = demo.items.find(row => row.origin === record.id);
    if (existing) { go('creative', 'Brief kreatif'); open(existing); return; }
    const creative: Item = { ...record, id: crypto.randomUUID(), origin: record.id, module: 'creative', view: 'Brief kreatif', stage: 0 };
    setDemo(previous => ({ ...previous, items: [creative, ...previous.items] }));
    go('creative', 'Brief kreatif'); open(creative);
  }

  return <div className="bp-shell">
    {mobile && <button className="bp-scrim" type="button" aria-label="Tutup navigasi" onClick={() => setMobile(false)} />}
    <aside className={`bp-sidebar ${mobile ? 'open' : ''}`}>
      <button type="button" className="bp-brand" onClick={() => go('overview')}><span><Command size={21} /></span><span><strong>GG Workspace</strong><small>BUSINESS OS</small></span></button>
      <div className="bp-nav-title">RUANG KERJA</div>
      <nav aria-label="Menu blueprint">{modules.map((module, index) => <div key={module.id}>
        {index === 8 && <div className="bp-nav-title">PENGELOLAAN</div>}
        <button type="button" aria-current={active === module.id ? 'page' : undefined} onClick={() => go(module.id)}><module.icon size={17} />{module.name}</button>
      </div>)}</nav>
      <Link to="/launch/login" className="bp-return"><ArrowLeft size={14} /> Aplikasi utama</Link>
    </aside>

    <div className="bp-body">
      <header className="bp-header">
        <button type="button" className="bp-icon bp-mobile" aria-label="Buka navigasi" onClick={() => setMobile(!mobile)}><Menu size={20} /></button>
        <div className="bp-unit"><span className="bp-unit-icon"><Layers3 size={16} /></span><select aria-label="Pilih unit bisnis" value={unit} onChange={event => setUnit(event.target.value)}>
          <option value="">Semua unit bisnis</option>{demo.units.map(name => <option key={name}>{name}</option>)}
        </select><ChevronDown size={14} /></div>
        <div className="bp-head-tools">
          <div className="bp-search"><Search size={17} /><input aria-label="Cari di prototipe" placeholder="Cari pekerjaan…" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') setQuery(''); }} />
            {query.trim() && <div className="bp-search-results">{matching.length ? matching.slice(0,7).map(record => <button key={record.id} onClick={() => open(record)}>{record.title}<small>{record.unit}</small></button>) : <p>Tidak ada hasil.</p>}</div>}
          </div>
          <button type="button" className="bp-icon bp-bell" aria-label="Kotak tindakan" onClick={() => go('overview','Kotak tindakan')}><Bell size={19} /></button>
          <span className="bp-avatar" title="Nadia · profil contoh">ND</span>
        </div>
      </header>

      <main className="bp-main">
        <div className="bp-page-head"><div><span className="bp-eyebrow"><span /> PROTOTIPE INTERAKTIF</span><h1>{current.name}</h1>
          <p>{active === 'overview' ? 'Pantau apa yang bergerak dan apa yang butuh keputusan.' : `Jelajahi ${current.name.toLowerCase()} untuk ${unit || 'semua unit bisnis'}.`}</p></div>
          <button type="button" className="bp-primary" onClick={beginCreate}><Plus size={18} /> {active === 'business' ? 'Unit baru' : 'Buat item'}</button></div>
        <div className="bp-tabs" aria-label="Tampilan modul">{current.views.map(view => <button type="button" key={view} aria-pressed={tab === view} onClick={() => { setTab(view); setBoard(false); }}>{view}</button>)}</div>
        {notice && <p className="bp-notice" role="status"><Check size={16} /> {notice}<button type="button" aria-label="Tutup pesan" onClick={() => setNotice('')}><X size={14} /></button></p>}

        {active === 'overview' && tab === 'Ringkasan' ? <>
          <div className="bp-hero"><div><span>JUMAT, 06 NOVEMBER 2026</span><h2>Satu ruang kerja.<br />Semua bisnis.</h2><p>Prioritas tim, progres artikel, dan keputusan yang perlu Anda ambil dalam satu tampilan.</p>
            <button type="button" onClick={() => go('overview','Kotak tindakan')}>Lihat prioritas <ArrowRight size={16} /></button></div><div className="bp-orbit" aria-hidden="true"><i/><i/><i/><b>GG</b></div></div>
          <div className="bp-metrics">{[
            ['Proyek artikel aktif', projectCount, 'Prospek hingga launching', () => go('projects')],
            ['Pekerjaan Creative', creativeCount, 'Brief hingga evaluasi', () => go('creative')],
            ['Perlu keputusan', pending.length, 'Review dan persetujuan', () => go('overview','Kotak tindakan')],
            ['Item selesai', completed, 'Seluruh modul dalam lingkup', () => go('analytics')],
          ].map(([label,count,note,action]) => <button type="button" className="bp-metric" key={String(label)} onClick={action as () => void}><span>{String(label)}<ArrowUpRight size={16} /></span><strong>{String(count).padStart(2,'0')}</strong><small>{String(note)}</small></button>)}</div>
          <div className="bp-grid"><section className="bp-card"><div className="bp-card-head"><div><h2>Butuh keputusan</h2><p>Review, persetujuan, dan permintaan yang menunggu.</p></div><button type="button" className="bp-text" onClick={() => go('overview','Kotak tindakan')}>Lihat semua <ArrowRight size={15} /></button></div><ItemRows items={pending.slice(0,4)} open={open} /></section>
            <section className="bp-card"><div className="bp-card-head"><div><h2>Agenda terdekat</h2><p>Deadline dan jadwal tim.</p></div><button type="button" className="bp-icon" aria-label="Buka kalender" onClick={() => go('calendar')}><ArrowUpRight size={18} /></button></div><ItemRows items={calendarItems.slice(0,3)} open={open} /></section></div>
        </> : active === 'business' ? <div className="bp-unit-grid">{demo.units.filter(name => !unit || name === unit).map((name, index) => <section className="bp-card bp-unit-card" key={name}>
          <span className="bp-row-glyph"><Layers3 size={19} /></span><small>UNIT {String(index+1).padStart(2,'0')}</small><h2>{name}</h2><p>{demo.items.filter(record => record.unit === name).length} item contoh lintas modul</p>
          <button type="button" className="bp-text" onClick={() => { setUnit(name); go('overview'); }}>Buka command center <ArrowUpRight size={15} /></button>
        </section>)}</div> : active === 'calendar' ? <section className="bp-card"><div className="bp-card-head"><div><h2>November 2026</h2><p>Pilih jadwal untuk membuka detail pekerjaannya.</p></div></div>
          <div className="bp-agenda">{Array.from(new Set(calendarItems.map(record => record.due))).map(day => <div key={day}><h3>{displayDate(day)}</h3><ItemRows items={calendarItems.filter(record => record.due === day)} open={open} /></div>)}</div>
          {!calendarItems.length && <ItemRows items={[]} open={open} />}</section>
        : active === 'people' || active === 'analytics' ? <section className="bp-card"><div className="bp-card-head"><div><h2>{tab}</h2><p>Dihitung dari pekerjaan contoh dalam lingkup ini.</p></div></div>
          <div className="bp-bars">{(active === 'people' ? staff : demo.units.filter(name => !unit || name === unit)).map(name => {
            const records = scoped.filter(record => active === 'people' ? record.owner === name || record.contributors?.includes(name) : record.unit === name);
            const done = records.filter(isDone).length;
            return <div key={name}><strong>{name}</strong><div className="bp-bar-track"><i style={{ width: `${records.length ? done / records.length * 100 : 0}%` }} /></div><span>{done} / {records.length} selesai</span></div>;
          })}</div></section>
        : <section className="bp-card"><div className="bp-card-head"><div><h2>{tab}</h2><p>{rows.length} item dalam tampilan ini</p></div>
          {['projects','creative','ideas','marketing','budget'].includes(active) && <button type="button" className="bp-secondary" onClick={() => setBoard(!board)}>{board ? 'Daftar' : 'Papan status'}</button>}
          </div>{board && rows.length ? <div className="bp-board">{Array.from(new Set(rows.map(row => workflow(row)[row.stage]))).map(stage => <section key={stage}><h3>{stage}</h3><ItemRows items={rows.filter(row => workflow(row)[row.stage] === stage)} open={open} /></section>)}</div> : <ItemRows items={rows} open={open} />}</section>}
        <footer className="bp-footer"><span>GG Workspace · Pratinjau desain</span><span>Data contoh · tersimpan di browser ini</span></footer>
      </main>
    </div>

    {item && <Dialog title={item.title} onClose={() => setSelected(undefined)}>
      <div className="bp-dialog-content"><div className="bp-detail-meta"><span className="bp-status">{item.unit}</span><span>{item.view} · {item.owner} · {displayDate(item.due)}</span></div>
        {item.note && <p className="bp-note">{item.note}</p>}
        {Boolean(item.platforms?.length) && <p><strong>Platform:</strong> {item.platforms?.join(', ')}</p>}
        {Boolean(item.contributors?.length) && <p><strong>PIC tambahan:</strong> {item.contributors?.join(', ')}</p>}
        <h3>Alur pekerjaan</h3><ol className="bp-flow">{itemStages.map((label, index) => <li key={label} aria-current={index === item.stage ? 'step' : undefined}><span>{index < item.stage ? <Check size={13} /> : index+1}</span>{label}</li>)}</ol>
        <div className="bp-dialog-actions">
          {item.stage > 0 && item.stage < itemStages.length-1 && <button type="button" className="bp-secondary" onClick={() => changeStage(item, item.stage-1)}><ArrowDownRight size={16} /> Kembali satu tahap</button>}
          {item.stage < itemStages.length-1 && <button type="button" className="bp-primary" onClick={() => changeStage(item, item.stage+1)}>{itemStages[item.stage+1]} <ArrowRight size={16} /></button>}
          {item.module === 'ideas' && <button type="button" className="bp-secondary" onClick={() => convert(item)}>Jadikan brief Creative</button>}
        </div>
      </div>
    </Dialog>}
    {creating && <Dialog title={active === 'business' ? 'Tambah unit bisnis' : 'Buat item demo'} onClose={() => setCreating(false)}>
      <form className="bp-dialog-content bp-form" onSubmit={add}>
        <label className="bp-span">{active === 'business' ? 'Nama unit bisnis' : 'Judul pekerjaan'}<input name="title" required maxLength={120} /></label>
        {active !== 'business' && <>
          <label>Modul<select value={createModule} onChange={event => {
            const next = modules.find(module => module.id === event.target.value)!; setCreateModule(next.id); setCreateView(next.views[0]);
          }}>{modules.filter(module => !['overview','business','people','calendar','analytics','settings'].includes(module.id)).map(module => <option value={module.id} key={module.id}>{module.name}</option>)}</select></label>
          <label>Jenis item<select value={createView} onChange={event => setCreateView(event.target.value)}>{target.views.filter(view => view !== 'Persetujuan').map(view => <option key={view}>{view}</option>)}</select></label>
          <label>Unit bisnis<select name="unit" defaultValue={unit || demo.units[0]}>{demo.units.map(name => <option key={name}>{name}</option>)}</select></label>
          <label>PIC utama<select name="owner">{staff.map(name => <option key={name}>{name}</option>)}</select></label>
          <label>Deadline<input name="due" type="date" /></label>
          <label className="bp-span">Brief atau catatan<textarea name="note" rows={3} maxLength={2000} /></label>
          {createModule === 'creative' && <>
            <fieldset><legend>Platform</legend>{['Instagram','TikTok','YouTube','Marketplace'].map(platform => <label key={platform}><input type="checkbox" name="platform" value={platform} />{platform}</label>)}</fieldset>
            <fieldset><legend>PIC tambahan</legend>{staff.map(person => <label key={person}><input type="checkbox" name="person" value={person} />{person}</label>)}</fieldset>
          </>}
        </>}
        {formError && <p role="alert" className="bp-span">{formError}</p>}
        <div className="bp-dialog-actions bp-span"><button type="button" className="bp-secondary" onClick={() => setCreating(false)}>Batal</button><button className="bp-primary" type="submit">Simpan di prototipe <Check size={16} /></button></div>
      </form>
    </Dialog>}
  </div>;
}
