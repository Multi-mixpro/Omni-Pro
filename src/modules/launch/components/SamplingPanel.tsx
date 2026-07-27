import { FormEvent, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, Plus, Shirt } from 'lucide-react';
import { useAddSample, useApproveMasterSample, useDeleteSample, useUpdateStage } from '../hooks/useLaunch';
import { DeleteButton } from './DeleteButton';
import type { LaunchStage, ProjectWorkspace, SampleDraft } from '../domain/types';

const SAMPLE_TYPES = [['DEVELOPMENT', 'Development'], ['FIT', 'Fit sample'], ['PRE_PRODUCTION', 'Pre-production'], ['PRODUCTION', 'Production']] as const;
const emptySample = (): SampleDraft => ({ sample_type: 'DEVELOPMENT', material_notes: '', pattern_notes: '', construction_notes: '', revision_notes: '' });

interface SamplingPanelProps {
  projectId: string;
  stage?: LaunchStage;
  samples: ProjectWorkspace['samples'];
  onBack: () => void;
}

export function SamplingPanel({ projectId, stage, samples, onBack }: SamplingPanelProps) {
  const addSample = useAddSample(projectId);
  const approveMaster = useApproveMasterSample(projectId);
  const deleteSample = useDeleteSample(projectId);
  const updateStageMutation = useUpdateStage(projectId);
  const [draft, setDraft] = useState<SampleDraft>(emptySample());
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageError, setStageError] = useState<string | null>(null);

  const master = samples.find(item => item.is_master && item.status === 'APPROVED');
  const nextVersion = samples.reduce((max, item) => Math.max(max, item.version), 0) + 1;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try { await addSample.mutateAsync({ input: draft, nextVersion }); setDraft(emptySample()); setShowForm(false); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Versi sample belum dapat disimpan.'); }
  }

  async function completeStage() {
    if (!stage) return;
    setStageError(null);
    try { await updateStageMutation.mutateAsync({ stageId: stage.id, status: 'COMPLETED' }); }
    catch (reason) { setStageError(reason instanceof Error ? reason.message : 'Gate sampling belum lengkap.'); }
  }

  function update(patch: Partial<SampleDraft>) { setDraft(current => ({ ...current, ...patch })); }

  return (
    <div className="workstream-panel">
      <button className="back-link" onClick={onBack}><ArrowLeft size={18} /> Kembali ke ruang kerja</button>
      <div className="section-head"><div><span className="eyebrow">Tahap 04 · Sampling</span><h3>Versi sample dan master sample</h3><p>Catat setiap versi sample beserta catatan pola, konstruksi, dan revisi. Tetapkan satu master sample sebagai acuan produksi.</p></div></div>

      <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Riwayat sample</span><h3>{samples.length} versi</h3></div><button type="button" className="button button-secondary" onClick={() => setShowForm(value => !value)}><Plus size={17} /> {showForm ? 'Tutup form' : 'Tambah versi sample'}</button></div>
        {samples.length ? <div className="sourcing-list">{samples.map(item => <article key={item.id} className={`sourcing-card ${item.is_master && item.status === 'APPROVED' ? 'sourcing-locked' : ''}`}>
          <div className="sourcing-card-head"><span className="material-role">V{item.version}</span><div><b>{SAMPLE_TYPES.find(([value]) => value === item.sample_type)?.[1] ?? item.sample_type}</b><small>Status: {item.status}</small></div>{item.is_master && item.status === 'APPROVED' ? <span className="sourcing-badge"><Check size={13} /> Master sample</span> : <button type="button" className="button button-primary" disabled={approveMaster.isPending} onClick={() => approveMaster.mutate(item.id)}>Jadikan master</button>}<DeleteButton label={`sample V${item.version}`} pending={deleteSample.isPending} onConfirm={() => deleteSample.mutate(item.id)} /></div>
          {(item.material_notes || item.pattern_notes || item.construction_notes || item.revision_notes) && <div className="sample-notes">
            {item.material_notes && <p><small>Bahan</small>{item.material_notes}</p>}
            {item.pattern_notes && <p><small>Pola</small>{item.pattern_notes}</p>}
            {item.construction_notes && <p><small>Konstruksi</small>{item.construction_notes}</p>}
            {item.revision_notes && <p><small>Revisi</small>{item.revision_notes}</p>}
          </div>}
        </article>)}</div> : <div className="state-panel state-empty"><Shirt size={28} /><h3>Belum ada sample</h3><p>Tambahkan versi sample pertama untuk mulai mencatat perkembangan konstruksi.</p></div>}
      </section>

      {showForm && <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Versi baru</span><h3>Sample V{nextVersion}</h3></div></div>
        <form onSubmit={submit}>
          <div className="field-grid">
            <label className="field"><span>Jenis sample</span><select value={draft.sample_type} onChange={e => update({ sample_type: e.target.value as SampleDraft['sample_type'] })}>{SAMPLE_TYPES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label className="field field-wide"><span>Catatan bahan</span><input placeholder="Bahan yang dipakai pada versi ini" value={draft.material_notes} onChange={e => update({ material_notes: e.target.value })} /></label>
            <label className="field field-wide"><span>Catatan pola</span><input placeholder="Ukuran pola, grading, perubahan bentuk…" value={draft.pattern_notes} onChange={e => update({ pattern_notes: e.target.value })} /></label>
            <label className="field field-wide"><span>Catatan konstruksi</span><input placeholder="Jahitan, finishing, aksesori…" value={draft.construction_notes} onChange={e => update({ construction_notes: e.target.value })} /></label>
            <label className="field field-wide"><span>Revisi yang diminta</span><textarea rows={2} placeholder="Perbaikan yang harus dilakukan pada versi berikutnya…" value={draft.revision_notes} onChange={e => update({ revision_notes: e.target.value })} /></label>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="edit-project-actions"><button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Batal</button><button type="submit" className="button button-primary" disabled={addSample.isPending}>{addSample.isPending ? 'Menyimpan…' : 'Simpan versi sample'}</button></div>
        </form>
      </section>}

      {stage && stage.status !== 'COMPLETED' && <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Gate tahap</span><h3>Tandai sampling selesai</h3></div></div>
        <div className="gate-list"><div className={master ? 'done' : ''}><span>{master ? <Check size={15} /> : <Shirt size={16} />}</span><b>Master sample disetujui</b><small>{master ? `Versi V${master.version}` : 'Belum ada master sample'}</small></div></div>
        {stageError && <div className="form-error"><AlertCircle size={16} /> {stageError}</div>}
        <button className="button button-primary" disabled={!master || updateStageMutation.isPending} onClick={completeStage}>{updateStageMutation.isPending ? 'Memproses…' : 'Tandai sampling selesai'}</button>
      </section>}
    </div>
  );
}
