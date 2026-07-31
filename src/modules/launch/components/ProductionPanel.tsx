import { FormEvent, useMemo, useState } from 'react';
import { ArrowLeft, Factory, PackageCheck, Plus, Save } from 'lucide-react';
import { useCreateProductionBatch, useUpdateProductionBatch } from '../hooks/useLaunch';
import type { ProductionBatch, ProductionBatchDraft, ProjectWorkspace } from '../domain/types';

const STATUS_LABEL = { PLANNED: 'Direncanakan', IN_PROGRESS: 'Berjalan', WAITING: 'Menunggu', COMPLETED: 'Selesai', CANCELLED: 'Dibatalkan' };
const clamp = (value: number) => Math.max(0, Math.min(100, value));

function BatchCard({ projectId, batch }: { projectId: string; batch: ProductionBatch }) {
  const update = useUpdateProductionBatch(projectId);
  const [draft, setDraft] = useState(batch);
  const average = Math.round((draft.cutting_progress + draft.sewing_progress + draft.finishing_progress + draft.qc_progress) / 4);

  function setNumber(field: keyof ProductionBatch, value: string) {
    setDraft(current => ({ ...current, [field]: Number(value) }));
  }

  return (
    <article className="production-batch-card">
      <div className="production-batch-head"><div><span className="material-role">{batch.batch_code}</span><h4>{batch.vendor_name || 'Vendor belum ditentukan'}</h4><small>{batch.target_finish ? `Target selesai ${batch.target_finish}` : 'Target selesai belum diisi'}</small></div><div className="batch-total"><small>Progress total</small><b>{average}%</b></div></div>
      <div className="production-progress-grid">
        {([['cutting_progress', 'Cutting'], ['sewing_progress', 'Jahit'], ['finishing_progress', 'Finishing'], ['qc_progress', 'QC']] as const).map(([field, label]) => <label key={field}><span><b>{label}</b><small>{draft[field]}%</small></span><input type="range" min={0} max={100} step={5} value={draft[field]} onChange={event => setNumber(field, event.target.value)} /></label>)}
      </div>
      <div className="production-result-grid">
        <label className="field"><span>Status</span><select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as ProductionBatch['status'] })}>{Object.entries(STATUS_LABEL).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label className="field"><span>Lolos QC</span><input type="number" min={0} value={draft.quantity_passed} onChange={event => setNumber('quantity_passed', event.target.value)} /></label>
        <label className="field"><span>Reject</span><input type="number" min={0} value={draft.quantity_rejected} onChange={event => setNumber('quantity_rejected', event.target.value)} /></label>
        <label className="field"><span>Rework</span><input type="number" min={0} value={draft.quantity_reworked} onChange={event => setNumber('quantity_reworked', event.target.value)} /></label>
      </div>
      <button type="button" className="button button-primary" disabled={update.isPending} onClick={() => update.mutate({
        id: batch.id,
        patch: {
          status: draft.status,
          cutting_progress: clamp(draft.cutting_progress),
          sewing_progress: clamp(draft.sewing_progress),
          finishing_progress: clamp(draft.finishing_progress),
          qc_progress: clamp(draft.qc_progress),
          quantity_passed: draft.quantity_passed,
          quantity_rejected: draft.quantity_rejected,
          quantity_reworked: draft.quantity_reworked,
          actual_start: draft.status === 'IN_PROGRESS' && !draft.actual_start ? new Date().toISOString().slice(0, 10) : draft.actual_start,
          actual_finish: draft.status === 'COMPLETED' ? new Date().toISOString().slice(0, 10) : draft.actual_finish,
        },
      })}><Save size={16} /> {update.isPending ? 'Menyimpan…' : 'Simpan progres batch'}</button>
    </article>
  );
}

export function ProductionPanel({ projectId, batches, targetQuantity, onBack }: { projectId: string; batches: ProjectWorkspace['productionBatches']; targetQuantity: number | null; onBack: () => void }) {
  const create = useCreateProductionBatch(projectId);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<ProductionBatchDraft>({ batch_code: `BATCH-${String(batches.length + 1).padStart(2, '0')}`, vendor_name: '', planned_start: '', target_finish: '', total_quantity: targetQuantity ?? '', notes: '' });
  const [error, setError] = useState<string | null>(null);
  const totals = useMemo(() => batches.reduce((sum, batch) => ({
    quantity: sum.quantity + batch.total_quantity,
    passed: sum.passed + batch.quantity_passed,
    rejected: sum.rejected + batch.quantity_rejected,
  }), { quantity: 0, passed: 0, rejected: 0 }), [batches]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!draft.batch_code.trim()) return;
    try {
      await create.mutateAsync(draft);
      setShowForm(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Batch produksi belum dapat dibuat.');
    }
  }

  return (
    <div className="workstream-panel">
      <button className="back-link" onClick={onBack}><ArrowLeft size={18} /> Kembali ke workspace</button>
      <div className="section-head"><div><span className="eyebrow">Produksi massal</span><h3>Monitor batch, progres, dan hasil QC</h3><p>Progress cutting, jahit, finishing, dan QC diperbarui bersama oleh tim produksi.</p></div><button className="button button-secondary" onClick={() => setShowForm(value => !value)}><Plus size={16} /> Batch produksi</button></div>
      <section className="production-summary-grid"><div><Factory size={19} /><span><small>Total rencana</small><b>{totals.quantity.toLocaleString('id-ID')} pcs</b></span></div><div><PackageCheck size={19} /><span><small>Lolos QC</small><b>{totals.passed.toLocaleString('id-ID')} pcs</b></span></div><div><span className="reject-dot" /><span><small>Reject</small><b>{totals.rejected.toLocaleString('id-ID')} pcs</b></span></div></section>
      {showForm && <section className="content-card"><form onSubmit={submit}><div className="field-grid"><label className="field"><span>Kode batch *</span><input required value={draft.batch_code} onChange={event => setDraft({ ...draft, batch_code: event.target.value })} /></label><label className="field"><span>Workshop/vendor</span><input value={draft.vendor_name} onChange={event => setDraft({ ...draft, vendor_name: event.target.value })} /></label><label className="field"><span>Mulai rencana</span><input type="date" value={draft.planned_start} onChange={event => setDraft({ ...draft, planned_start: event.target.value })} /></label><label className="field"><span>Target selesai</span><input type="date" value={draft.target_finish} onChange={event => setDraft({ ...draft, target_finish: event.target.value })} /></label><label className="field"><span>Total produksi</span><input type="number" min={0} value={draft.total_quantity} onChange={event => setDraft({ ...draft, total_quantity: event.target.value === '' ? '' : Number(event.target.value) })} /></label><label className="field field-wide"><span>Catatan</span><textarea rows={2} value={draft.notes} onChange={event => setDraft({ ...draft, notes: event.target.value })} /></label></div>{error && <div className="form-error">{error}</div>}<div className="edit-project-actions"><button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Batal</button><button className="button button-primary" disabled={create.isPending}>{create.isPending ? 'Menyimpan…' : 'Buat batch'}</button></div></form></section>}
      {batches.length ? <section className="production-batch-list">{batches.map(batch => <BatchCard projectId={projectId} batch={batch} key={batch.id} />)}</section> : <div className="state-panel state-empty"><Factory size={28} /><h3>Belum ada batch produksi</h3><p>Buat batch setelah artikel memperoleh approval siap produksi.</p></div>}
    </div>
  );
}
