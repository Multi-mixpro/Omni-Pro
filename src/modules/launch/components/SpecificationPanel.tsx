import { FormEvent, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, Grid3x3, Palette, Plus, Ruler, Wallet } from 'lucide-react';
import { useAddColorway, useDeleteColorway, useDeleteVariantMatrixRow, useFinalizeSizeChart, useGenerateVariantMatrix, useSetColorwayStatus, useUpdateStage, useUpdateVariantMatrixRow } from '../hooks/useLaunch';
import { DeleteButton } from './DeleteButton';
import type { ColorwayDraft, LaunchStage, ProjectWorkspace, VariantMatrixStatus } from '../domain/types';

const emptyColor = (): ColorwayDraft => ({ name: '', color_code: '', hex_code: '#111b2d', panel_notes: '' });
const VARIANT_STATUS_LABEL: Record<VariantMatrixStatus, string> = {
  DRAFT: 'Draft', SAMPLE_ONLY: 'Sample only', APPROVED: 'Disetujui', PRODUCTION_READY: 'Siap produksi', DISABLED: 'Nonaktif',
};
const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

interface SpecificationPanelProps {
  projectId: string;
  stage?: LaunchStage;
  colorways: ProjectWorkspace['colorways'];
  sizeCharts: ProjectWorkspace['sizeCharts'];
  variantMatrix: ProjectWorkspace['variantMatrix'];
  hpp: ProjectWorkspace['hpp'];
  onBack: () => void;
}

export function SpecificationPanel({ projectId, stage, colorways, sizeCharts, variantMatrix, hpp, onBack }: SpecificationPanelProps) {
  const addColor = useAddColorway(projectId);
  const setStatus = useSetColorwayStatus(projectId);
  const deleteColor = useDeleteColorway(projectId);
  const finalizeChart = useFinalizeSizeChart(projectId);
  const updateStageMutation = useUpdateStage(projectId);
  const generateMatrix = useGenerateVariantMatrix(projectId);
  const updateMatrixRow = useUpdateVariantMatrixRow(projectId);
  const deleteMatrixRow = useDeleteVariantMatrixRow(projectId);
  const [draft, setDraft] = useState<ColorwayDraft>(emptyColor());
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageError, setStageError] = useState<string | null>(null);
  const availableSizes = sizeCharts[0]?.sizes ?? [];
  const referenceHpp = hpp.find(item => item.status === 'FINAL') ?? hpp[0];
  const totalQuantity = variantMatrix.reduce((sum, row) => sum + (row.min_quantity ?? 0), 0);
  const totalBudget = variantMatrix.reduce((sum, row) => sum + (row.min_quantity ?? 0) * (row.unit_cost ?? referenceHpp?.total_hpp ?? 0), 0);
  const missingCostCount = variantMatrix.filter(row => (row.min_quantity ?? 0) > 0 && row.unit_cost == null && !referenceHpp).length;

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
        <div className="section-head"><div><span className="eyebrow">Variant planning</span><h3>Matriks warna × ukuran</h3><p>{variantMatrix.length} kombinasi SKU{referenceHpp ? ` · HPP acuan ${money.format(referenceHpp.total_hpp)}/unit` : ' · Belum ada HPP acuan'}</p></div><button type="button" className="button button-secondary" disabled={!colorways.length || !availableSizes.length || generateMatrix.isPending} onClick={() => generateMatrix.mutate({ colorwayIds: colorways.map(c => c.id), sizes: availableSizes, defaultUnitCost: referenceHpp?.total_hpp ?? null })}><Grid3x3 size={17} /> {generateMatrix.isPending ? 'Membuat…' : 'Buat/perbarui matriks'}</button></div>
        {!colorways.length || !availableSizes.length ? <div className="state-panel state-empty"><Grid3x3 size={28} /><h3>Belum siap dibuat</h3><p>Tambahkan minimal satu warna dan pastikan size chart sudah memiliki daftar ukuran.</p></div>
        : variantMatrix.length ? <>
        <div className="budget-summary">
          <div><small>Total kuantitas minimum</small><b>{totalQuantity.toLocaleString('id-ID')} pcs</b></div>
          <div><small>Estimasi anggaran produksi massal</small><b>{money.format(totalBudget)}</b></div>
          <div className="budget-hint"><Wallet size={15} /><span>Dihitung dari kuantitas minimum × biaya per unit (per ukuran jika diisi, jika kosong memakai HPP acuan artikel).</span></div>
        </div>
        {missingCostCount > 0 && <div className="form-error"><AlertCircle size={16} /> {missingCostCount} kombinasi belum punya biaya per unit maupun HPP acuan — estimasi anggaran belum lengkap.</div>}
        <div className="variant-matrix-table"><table><thead><tr><th>Warna</th><th>Ukuran</th><th>SKU</th><th>Status</th><th>Min. qty</th><th>Biaya/unit</th><th>Subtotal</th><th /></tr></thead><tbody>{variantMatrix.map(row => {
          const colorway = colorways.find(c => c.id === row.colorway_id);
          const effectiveCost = row.unit_cost ?? referenceHpp?.total_hpp ?? 0;
          const subtotal = (row.min_quantity ?? 0) * effectiveCost;
          return <tr key={row.id}>
            <td><span className="colorway-swatch" style={{ background: colorway?.hex_code || '#d6dae1' }} /> {colorway?.name ?? 'Warna dihapus'}</td>
            <td>{row.size}</td>
            <td><input defaultValue={row.sku ?? ''} onBlur={e => e.target.value !== row.sku && updateMatrixRow.mutate({ id: row.id, patch: { sku: e.target.value } })} /></td>
            <td><select defaultValue={row.status} onChange={e => updateMatrixRow.mutate({ id: row.id, patch: { status: e.target.value } })}>{Object.entries(VARIANT_STATUS_LABEL).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></td>
            <td><input type="number" min={0} defaultValue={row.min_quantity ?? ''} onBlur={e => { const value = e.target.value === '' ? null : Number(e.target.value); if (value !== row.min_quantity) updateMatrixRow.mutate({ id: row.id, patch: { min_quantity: value } }); }} /></td>
            <td><input type="number" min={0} placeholder={referenceHpp ? String(referenceHpp.total_hpp) : '0'} defaultValue={row.unit_cost ?? ''} onBlur={e => { const value = e.target.value === '' ? null : Number(e.target.value); if (value !== row.unit_cost) updateMatrixRow.mutate({ id: row.id, patch: { unit_cost: value } }); }} /></td>
            <td>{money.format(subtotal)}</td>
            <td><DeleteButton label={`SKU ${row.sku ?? `${colorway?.name}-${row.size}`}`} pending={deleteMatrixRow.isPending} onConfirm={() => deleteMatrixRow.mutate(row.id)} /></td>
          </tr>;
        })}</tbody></table></div>
        </> : <div className="state-panel state-empty"><Grid3x3 size={28} /><h3>Matriks belum dibuat</h3><p>Klik "Buat/perbarui matriks" untuk membuat kombinasi warna dan ukuran secara otomatis.</p></div>}
      </section>

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
