import { FormEvent, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, Palette, Plus, Ruler } from 'lucide-react';
import { useAddColorway, useDeleteColorway, useFinalizeSizeChart, useSetColorwayStatus, useUpdateStage } from '../hooks/useLaunch';
import { DeleteButton } from './DeleteButton';
import type { ColorwayDraft, LaunchStage, ProjectWorkspace } from '../domain/types';

const emptyColor = (): ColorwayDraft => ({ name: '', color_code: '', hex_code: '#111b2d', panel_notes: '' });

interface SpecificationPanelProps {
  projectId: string;
  stage?: LaunchStage;
  colorways: ProjectWorkspace['colorways'];
  sizeCharts: ProjectWorkspace['sizeCharts'];
  onBack: () => void;
}

export function SpecificationPanel({ projectId, stage, colorways, sizeCharts, onBack }: SpecificationPanelProps) {
  const addColor = useAddColorway(projectId);
  const setStatus = useSetColorwayStatus(projectId);
  const deleteColor = useDeleteColorway(projectId);
  const finalizeChart = useFinalizeSizeChart(projectId);
  const updateStageMutation = useUpdateStage(projectId);
  const [draft, setDraft] = useState<ColorwayDraft>(emptyColor());
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageError, setStageError] = useState<string | null>(null);

  const approvedColor = colorways.find(item => item.status === 'APPROVED');
  const finalChart = sizeCharts.find(item => item.status === 'FINAL');
  const gateReady = Boolean(approvedColor && finalChart);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!draft.name.trim()) { setError('Nama warna wajib diisi.'); return; }
    try { await addColor.mutateAsync(draft); setDraft(emptyColor()); setShowForm(false); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Warna belum dapat disimpan.'); }
  }

  async function completeStage() {
    if (!stage) return;
    setStageError(null);
    try { await updateStageMutation.mutateAsync({ stageId: stage.id, status: 'COMPLETED' }); }
    catch (reason) { setStageError(reason instanceof Error ? reason.message : 'Gate spesifikasi belum lengkap.'); }
  }

  return (
    <div className="workstream-panel">
      <button className="back-link" onClick={onBack}><ArrowLeft size={18} /> Kembali ke ruang kerja</button>
      <div className="section-head"><div><span className="eyebrow">Tahap 06 · Warna & size chart</span><h3>Kunci varian warna dan standar ukuran</h3><p>Setujui minimal satu warna dan finalkan satu size chart sebagai standar produksi.</p></div></div>

      <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Varian warna</span><h3>{colorways.length} warna</h3></div><button type="button" className="button button-secondary" onClick={() => setShowForm(value => !value)}><Plus size={17} /> {showForm ? 'Tutup form' : 'Tambah warna'}</button></div>
        {colorways.length ? <div className="sourcing-list">{colorways.map(item => <article key={item.id} className={`sourcing-card ${item.status === 'APPROVED' ? 'sourcing-locked' : ''}`}>
          <div className="sourcing-card-head"><span className="colorway-swatch" style={{ background: item.hex_code || '#d6dae1' }} /><div><b>{item.name}</b><small>Status: {item.status}</small></div>{item.status === 'APPROVED' ? <span className="sourcing-badge"><Check size={13} /> Disetujui</span> : <button type="button" className="button button-primary" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ colorwayId: item.id, status: 'APPROVED' })}>Setujui warna</button>}<DeleteButton label={`warna ${item.name}`} pending={deleteColor.isPending} onConfirm={() => deleteColor.mutate(item.id)} /></div>
        </article>)}</div> : <div className="state-panel state-empty"><Palette size={28} /><h3>Belum ada varian warna</h3><p>Tambahkan kandidat warna lalu setujui yang akan diproduksi.</p></div>}
      </section>

      {showForm && <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Warna baru</span><h3>Kandidat varian</h3></div></div>
        <form onSubmit={submit}>
          <div className="field-grid">
            <label className="field"><span>Nama warna *</span><input required placeholder="Contoh: Navy" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
            <label className="field"><span>Kode warna</span><input placeholder="Contoh: NVY-01" value={draft.color_code} onChange={e => setDraft({ ...draft, color_code: e.target.value })} /></label>
            <label className="field"><span>Hex</span><input type="color" value={draft.hex_code} onChange={e => setDraft({ ...draft, hex_code: e.target.value })} /></label>
            <label className="field field-wide"><span>Catatan panel/kombinasi</span><input placeholder="Bagian mana memakai warna ini…" value={draft.panel_notes} onChange={e => setDraft({ ...draft, panel_notes: e.target.value })} /></label>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="edit-project-actions"><button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Batal</button><button type="submit" className="button button-primary" disabled={addColor.isPending}>{addColor.isPending ? 'Menyimpan…' : 'Simpan warna'}</button></div>
        </form>
      </section>}

      <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Standar ukuran</span><h3>{sizeCharts.length} size chart</h3></div></div>
        {sizeCharts.length ? <div className="sourcing-list">{sizeCharts.map(item => <article key={item.id} className={`sourcing-card ${item.status === 'FINAL' ? 'sourcing-locked' : ''}`}>
          <div className="sourcing-card-head"><span className="material-role"><Ruler size={14} /></span><div><b>{item.name}</b><small>Status: {item.status} · {item.sizes.join(', ') || 'Belum ada ukuran'}</small></div>{item.status === 'FINAL' ? <span className="sourcing-badge"><Check size={13} /> Final</span> : <button type="button" className="button button-primary" disabled={finalizeChart.isPending} onClick={() => finalizeChart.mutate(item.id)}>Tandai final</button>}</div>
        </article>)}</div> : <div className="state-panel state-empty"><Ruler size={28} /><h3>Belum ada size chart</h3><p>Size chart awal dibuat dari brief. Tambahkan ukuran melalui brief artikel.</p></div>}
      </section>

      {stage && stage.status !== 'COMPLETED' && <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Gate tahap</span><h3>Tandai spesifikasi selesai</h3></div></div>
        <div className="gate-list">
          <div className={approvedColor ? 'done' : ''}><span>{approvedColor ? <Check size={15} /> : <Palette size={16} />}</span><b>Warna disetujui</b><small>{approvedColor ? approvedColor.name : 'Belum ada warna disetujui'}</small></div>
          <div className={finalChart ? 'done' : ''}><span>{finalChart ? <Check size={15} /> : <Ruler size={16} />}</span><b>Size chart final</b><small>{finalChart ? finalChart.name : 'Belum ada chart final'}</small></div>
        </div>
        {stageError && <div className="form-error"><AlertCircle size={16} /> {stageError}</div>}
        <button className="button button-primary" disabled={!gateReady || updateStageMutation.isPending} onClick={completeStage}>{updateStageMutation.isPending ? 'Memproses…' : 'Tandai spesifikasi selesai'}</button>
      </section>}
    </div>
  );
}
