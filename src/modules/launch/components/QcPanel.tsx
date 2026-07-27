import { FormEvent, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, PackageCheck, Plus } from 'lucide-react';
import { useAddQcCheck, useDeleteQcCheck, useUpdateStage } from '../hooks/useLaunch';
import { DeleteButton } from './DeleteButton';
import type { LaunchStage, ProjectWorkspace } from '../domain/types';

const RESULTS = [['PASS', 'Lolos'], ['CONDITIONAL', 'Lolos bersyarat'], ['FAIL', 'Gagal'], ['PENDING', 'Menunggu']] as const;
const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

interface QcPanelProps {
  projectId: string;
  stage?: LaunchStage;
  qc: ProjectWorkspace['qc'];
  samples: ProjectWorkspace['samples'];
  onBack: () => void;
}

export function QcPanel({ projectId, stage, qc, samples, onBack }: QcPanelProps) {
  const addCheck = useAddQcCheck(projectId);
  const deleteCheck = useDeleteQcCheck(projectId);
  const updateStageMutation = useUpdateStage(projectId);
  const [result, setResult] = useState('PASS');
  const [summary, setSummary] = useState('');
  const [sampleId, setSampleId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageError, setStageError] = useState<string | null>(null);

  const passed = qc.find(item => item.result === 'PASS');
  const master = samples.find(item => item.is_master);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await addCheck.mutateAsync({ result, summary, sample_id: sampleId || master?.id });
      setSummary(''); setResult('PASS'); setSampleId(''); setShowForm(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Hasil QC belum dapat disimpan.'); }
  }

  async function completeStage() {
    if (!stage) return;
    setStageError(null);
    try { await updateStageMutation.mutateAsync({ stageId: stage.id, status: 'COMPLETED' }); }
    catch (reason) { setStageError(reason instanceof Error ? reason.message : 'Gate QC belum lengkap.'); }
  }

  return (
    <div className="workstream-panel">
      <button className="back-link" onClick={onBack}><ArrowLeft size={18} /> Kembali ke ruang kerja</button>
      <div className="section-head"><div><span className="eyebrow">Tahap 07 · Quality control</span><h3>Pemeriksaan mutu sebelum produksi massal</h3><p>Catat hasil pemeriksaan material, ukuran, jahitan, dan kesesuaian dengan master sample. Kegagalan tetap tersimpan sebagai riwayat.</p></div></div>

      <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Riwayat pemeriksaan</span><h3>{qc.length} pemeriksaan</h3></div><button type="button" className="button button-secondary" onClick={() => setShowForm(value => !value)}><Plus size={17} /> {showForm ? 'Tutup form' : 'Catat hasil QC'}</button></div>
        {qc.length ? <div className="sourcing-list">{qc.map(item => <article key={item.id} className={`sourcing-card ${item.result === 'PASS' ? 'sourcing-locked' : ''}`}>
          <div className="sourcing-card-head"><span className={`qc-result qc-${item.result.toLowerCase()}`}>{RESULTS.find(([value]) => value === item.result)?.[1] ?? item.result}</span><div><b>{item.summary || 'Tanpa catatan pemeriksaan'}</b><small>{item.checked_at ? date.format(new Date(item.checked_at)) : 'Tanggal belum tercatat'}</small></div>{item.result === 'PASS' && <span className="sourcing-badge"><Check size={13} /> Lolos</span>}<DeleteButton label="hasil QC" pending={deleteCheck.isPending} onConfirm={() => deleteCheck.mutate(item.id)} /></div>
        </article>)}</div> : <div className="state-panel state-empty"><PackageCheck size={28} /><h3>Belum ada pemeriksaan</h3><p>Catat hasil QC pada master sample untuk membuka gate quality control.</p></div>}
      </section>

      {showForm && <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Pemeriksaan baru</span><h3>Hasil QC</h3></div></div>
        <form onSubmit={submit}>
          <div className="field-grid">
            <label className="field"><span>Hasil</span><select value={result} onChange={e => setResult(e.target.value)}>{RESULTS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label className="field"><span>Sample diperiksa</span><select value={sampleId} onChange={e => setSampleId(e.target.value)}><option value="">{master ? `Master sample (V${master.version})` : 'Belum ada sample'}</option>{samples.map(item => <option value={item.id} key={item.id}>V{item.version} · {item.sample_type}</option>)}</select></label>
            <label className="field field-wide"><span>Catatan pemeriksaan</span><textarea rows={3} placeholder="Material, warna, ukuran, toleransi, jahitan, aksesori, finishing, packaging…" value={summary} onChange={e => setSummary(e.target.value)} /></label>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="edit-project-actions"><button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Batal</button><button type="submit" className="button button-primary" disabled={addCheck.isPending}>{addCheck.isPending ? 'Menyimpan…' : 'Simpan hasil QC'}</button></div>
        </form>
      </section>}

      {stage && stage.status !== 'COMPLETED' && <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Gate tahap</span><h3>Tandai QC selesai</h3></div></div>
        <div className="gate-list"><div className={passed ? 'done' : ''}><span>{passed ? <Check size={15} /> : <PackageCheck size={16} />}</span><b>Pemeriksaan lolos</b><small>{passed ? 'Minimal satu QC berstatus lolos' : 'Belum ada QC yang lolos'}</small></div></div>
        {stageError && <div className="form-error"><AlertCircle size={16} /> {stageError}</div>}
        <button className="button button-primary" disabled={!passed || updateStageMutation.isPending} onClick={completeStage}>{updateStageMutation.isPending ? 'Memproses…' : 'Tandai QC selesai'}</button>
      </section>}
    </div>
  );
}
