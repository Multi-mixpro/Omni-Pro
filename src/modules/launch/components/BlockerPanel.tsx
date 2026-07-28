import { FormEvent, useState } from 'react';
import { AlertTriangle, Check, ShieldAlert } from 'lucide-react';
import { useReportStageBlocker, useResolveStageBlocker } from '../hooks/useLaunch';
import type { BlockerDraft, BlockerType, LaunchBlocker } from '../domain/types';

const BLOCKER_TYPES: Array<[BlockerType, string]> = [
  ['MATERIAL', 'Bahan'], ['SUPPLIER', 'Supplier'], ['SAMPLE', 'Sample'],
  ['APPROVAL', 'Approval'], ['INTERNAL', 'Internal tim'], ['BUDGET', 'Anggaran'], ['OTHER', 'Lainnya'],
];

const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

function emptyDraft(): BlockerDraft {
  return { blocker_type: 'INTERNAL', description: '', target_resolution_date: '', impact: '', affects_target: false };
}

export function BlockerReportForm({ projectId, stageId, onDone }: { projectId: string; stageId: string; onDone: () => void }) {
  const report = useReportStageBlocker(projectId);
  const [draft, setDraft] = useState<BlockerDraft>(emptyDraft());
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.description.trim()) { setError('Jelaskan hambatannya terlebih dahulu.'); return; }
    setError(null);
    try { await report.mutateAsync({ stageId, input: draft }); onDone(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Hambatan belum dapat disimpan.'); }
  }

  return (
    <section className="content-card blocker-card blocker-card-form">
      <div className="section-head"><div><span className="eyebrow">Tandai terhambat</span><h3>Catat hambatan tahap ini</h3></div></div>
      <form onSubmit={submit}>
        <div className="field-grid">
          <label className="field"><span>Jenis hambatan</span><select value={draft.blocker_type} onChange={e => setDraft({ ...draft, blocker_type: e.target.value as BlockerType })}>{BLOCKER_TYPES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label className="field"><span>Target penyelesaian</span><input type="date" value={draft.target_resolution_date} onChange={e => setDraft({ ...draft, target_resolution_date: e.target.value })} /></label>
          <label className="field field-wide"><span>Penjelasan hambatan *</span><textarea rows={2} required placeholder="Apa yang menghambat pekerjaan ini…" value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} /></label>
          <label className="field field-wide"><span>Dampak</span><input placeholder="Ke mana dampaknya menjalar (tahap lain, tim lain, biaya)…" value={draft.impact} onChange={e => setDraft({ ...draft, impact: e.target.value })} /></label>
          <label className="field-check"><input type="checkbox" checked={draft.affects_target} onChange={e => setDraft({ ...draft, affects_target: e.target.checked })} /><span>Hambatan ini mengubah target tanggal artikel</span></label>
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="edit-project-actions">
          <button type="button" className="button button-secondary" onClick={onDone}>Batal</button>
          <button type="submit" className="button button-danger" disabled={report.isPending}><ShieldAlert size={16} /> {report.isPending ? 'Menyimpan…' : 'Tandai terhambat'}</button>
        </div>
      </form>
    </section>
  );
}

export function OpenBlockerCard({ projectId, blocker }: { projectId: string; blocker: LaunchBlocker }) {
  const resolve = useResolveStageBlocker(projectId);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const typeLabel = BLOCKER_TYPES.find(([value]) => value === blocker.blocker_type)?.[1] ?? blocker.blocker_type;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!note.trim()) { setError('Jelaskan bagaimana hambatan ini diselesaikan.'); return; }
    setError(null);
    try { await resolve.mutateAsync({ blockerId: blocker.id, resolutionNote: note }); setNote(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Belum dapat menandai hambatan selesai.'); }
  }

  return (
    <section className="content-card blocker-card blocker-card-open">
      <div className="section-head"><div><span className="eyebrow">Tahap terhambat</span><h3><AlertTriangle size={17} /> {typeLabel}</h3></div>{blocker.affects_target && <span className="blocker-impact-badge">Mengubah target</span>}</div>
      <p className="blocker-description">{blocker.description}</p>
      <div className="blocker-meta">
        {blocker.owner?.full_name && <span>Pelapor: {blocker.owner.full_name}</span>}
        {blocker.target_resolution_date && <span>Target selesai: {date.format(new Date(blocker.target_resolution_date))}</span>}
        {blocker.impact && <span>Dampak: {blocker.impact}</span>}
      </div>
      <form onSubmit={submit} className="blocker-resolve-form">
        <label className="field field-wide"><span>Catatan penyelesaian *</span><textarea rows={2} required placeholder="Bagaimana hambatan ini diselesaikan…" value={note} onChange={e => setNote(e.target.value)} /></label>
        {error && <div className="form-error">{error}</div>}
        <button type="submit" className="button button-primary" disabled={resolve.isPending}><Check size={16} /> {resolve.isPending ? 'Menyimpan…' : 'Tandai teratasi'}</button>
      </form>
    </section>
  );
}
