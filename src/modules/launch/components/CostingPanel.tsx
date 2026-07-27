import { FormEvent, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, Calculator, Check, CircleDollarSign, Plus, Trash2 } from 'lucide-react';
import { useAddHppVersion, useDeleteHppVersion, useFinalizeHpp, useUpdateStage } from '../hooks/useLaunch';
import { DeleteButton } from './DeleteButton';
import type { HppLineDraft, LaunchStage, ProjectWorkspace } from '../domain/types';

const HPP_CATEGORIES = [['MATERIAL', 'Material'], ['ACCESSORY', 'Aksesori'], ['LABOR', 'Jahit/tenaga'], ['PRINTING', 'Sablon'], ['EMBROIDERY', 'Bordir'], ['PACKAGING', 'Kemasan'], ['OVERHEAD', 'Overhead'], ['OTHER', 'Lainnya']] as const;
const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const emptyLine = (): HppLineDraft => ({ category: 'MATERIAL', item_name: '', quantity: 1, unit: 'pcs', unit_price: '', waste_percent: 0, notes: '' });

function numberValue(value: string): number | '' { return value === '' ? '' : Number(value); }

interface CostingPanelProps {
  projectId: string;
  stage?: LaunchStage;
  hpp: ProjectWorkspace['hpp'];
  onBack: () => void;
}

export function CostingPanel({ projectId, stage, hpp, onBack }: CostingPanelProps) {
  const addVersion = useAddHppVersion(projectId);
  const finalize = useFinalizeHpp(projectId);
  const deleteVersion = useDeleteHppVersion(projectId);
  const updateStageMutation = useUpdateStage(projectId);
  const [lines, setLines] = useState<HppLineDraft[]>([emptyLine()]);
  const [targetMargin, setTargetMargin] = useState<number | ''>(30);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageError, setStageError] = useState<string | null>(null);

  const finalVersion = hpp.find(item => item.status === 'FINAL');
  const nextVersion = hpp.reduce((max, item) => Math.max(max, item.version), 0) + 1;
  const total = useMemo(() => lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unit_price) || 0) * (1 + (Number(line.waste_percent) || 0) / 100), 0), [lines]);
  const recommended = targetMargin !== '' && Number(targetMargin) < 100 ? total / (1 - Number(targetMargin) / 100) : 0;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!lines.some(line => line.item_name.trim())) { setError('Minimal satu komponen biaya wajib diisi.'); return; }
    try { await addVersion.mutateAsync({ lines, targetMargin, nextVersion }); setLines([emptyLine()]); setShowForm(false); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Versi HPP belum dapat disimpan.'); }
  }

  async function completeStage() {
    if (!stage) return;
    setStageError(null);
    try { await updateStageMutation.mutateAsync({ stageId: stage.id, status: 'COMPLETED' }); }
    catch (reason) { setStageError(reason instanceof Error ? reason.message : 'Gate HPP belum lengkap.'); }
  }

  function finalizeVersion(id: string, versionTotal: number, margin: number | null) {
    const price = margin !== null && margin < 100 ? Math.round(versionTotal / (1 - margin / 100)) : '';
    finalize.mutate({ hppId: id, recommendedPrice: price });
  }

  return (
    <div className="workstream-panel">
      <button className="back-link" onClick={onBack}><ArrowLeft size={18} /> Kembali ke ruang kerja</button>
      <div className="section-head"><div><span className="eyebrow">Tahap 05 · HPP & harga</span><h3>Hitung biaya pokok dan harga jual</h3><p>Versi HPP tidak menimpa versi lama. Tandai satu versi sebagai final untuk membuka gate costing.</p></div></div>

      <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Riwayat versi</span><h3>{hpp.length} versi HPP</h3></div><button type="button" className="button button-secondary" onClick={() => setShowForm(value => !value)}><Plus size={17} /> {showForm ? 'Tutup form' : 'Versi HPP baru'}</button></div>
        {hpp.length ? <div className="sourcing-list">{hpp.map(item => <article key={item.id} className={`sourcing-card ${item.status === 'FINAL' ? 'sourcing-locked' : ''}`}>
          <div className="sourcing-card-head"><span className="material-role">V{item.version}</span><div><b>{money.format(item.total_hpp)}</b><small>Status: {item.status}{item.recommended_price ? ` · Harga jual ${money.format(item.recommended_price)}` : ''}</small></div>{item.status === 'FINAL' ? <span className="sourcing-badge"><Check size={13} /> Final</span> : <button type="button" className="button button-primary" disabled={finalize.isPending} onClick={() => finalizeVersion(item.id, item.total_hpp, item.target_margin_percent)}>Tandai final</button>}<DeleteButton label={`HPP V${item.version}`} pending={deleteVersion.isPending} onConfirm={() => deleteVersion.mutate(item.id)} /></div>
        </article>)}</div> : <div className="state-panel state-empty"><CircleDollarSign size={28} /><h3>Belum ada versi HPP</h3><p>Susun komponen biaya untuk menghitung HPP dan harga rekomendasi.</p></div>}
      </section>

      {showForm && <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Versi baru</span><h3>HPP V{nextVersion}</h3></div><button type="button" className="button button-secondary" onClick={() => setLines(current => [...current, emptyLine()])}><Plus size={16} /> Komponen biaya</button></div>
        <form onSubmit={submit}>
          <div className="hpp-table-wrap"><div className="hpp-table-head"><span>Komponen</span><span>Jumlah</span><span>Satuan</span><span>Harga satuan</span><span>Waste</span><span>Total</span><span /></div>
            {lines.map((line, index) => {
              const lineTotal = (Number(line.quantity) || 0) * (Number(line.unit_price) || 0) * (1 + (Number(line.waste_percent) || 0) / 100);
              return <div className="hpp-table-row" key={`line-${index}`}>
                <div><select value={line.category} aria-label="Kategori biaya" onChange={e => setLines(current => current.map((row, i) => i === index ? { ...row, category: e.target.value as HppLineDraft['category'] } : row))}>{HPP_CATEGORIES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><input placeholder="Nama bahan/jasa" value={line.item_name} onChange={e => setLines(current => current.map((row, i) => i === index ? { ...row, item_name: e.target.value } : row))} /></div>
                <input type="number" min="0" step="0.01" aria-label="Jumlah" value={line.quantity} onChange={e => setLines(current => current.map((row, i) => i === index ? { ...row, quantity: numberValue(e.target.value) } : row))} />
                <input aria-label="Satuan" value={line.unit} onChange={e => setLines(current => current.map((row, i) => i === index ? { ...row, unit: e.target.value } : row))} />
                <input type="number" min="0" placeholder="0" aria-label="Harga satuan" value={line.unit_price} onChange={e => setLines(current => current.map((row, i) => i === index ? { ...row, unit_price: numberValue(e.target.value) } : row))} />
                <div className="percent-input"><input type="number" min="0" aria-label="Waste" value={line.waste_percent} onChange={e => setLines(current => current.map((row, i) => i === index ? { ...row, waste_percent: numberValue(e.target.value) } : row))} /><span>%</span></div>
                <b>{money.format(lineTotal)}</b>
                {lines.length > 1 && <button type="button" aria-label="Hapus komponen" onClick={() => setLines(current => current.filter((_, i) => i !== index))}><Trash2 size={16} /></button>}
              </div>;
            })}
          </div>
          <div className="cost-summary-strip"><div><Calculator size={21} /><span><small>Estimasi HPP</small><b>{money.format(total)}</b></span></div><label><span>Target margin</span><div><input type="number" min="0" max="100" value={targetMargin} onChange={e => setTargetMargin(numberValue(e.target.value))} /><b>%</b></div></label><div><small>Harga rekomendasi</small><b>{recommended ? money.format(recommended) : '—'}</b></div></div>
          {error && <div className="form-error">{error}</div>}
          <div className="edit-project-actions"><button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Batal</button><button type="submit" className="button button-primary" disabled={addVersion.isPending}>{addVersion.isPending ? 'Menyimpan…' : 'Simpan versi HPP'}</button></div>
        </form>
      </section>}

      {stage && stage.status !== 'COMPLETED' && <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Gate tahap</span><h3>Tandai HPP selesai</h3></div></div>
        <div className="gate-list"><div className={finalVersion ? 'done' : ''}><span>{finalVersion ? <Check size={15} /> : <CircleDollarSign size={16} />}</span><b>HPP final</b><small>{finalVersion ? `V${finalVersion.version} · ${money.format(finalVersion.total_hpp)}` : 'Belum ada versi final'}</small></div></div>
        {stageError && <div className="form-error"><AlertCircle size={16} /> {stageError}</div>}
        <button className="button button-primary" disabled={!finalVersion || updateStageMutation.isPending} onClick={completeStage}>{updateStageMutation.isPending ? 'Memproses…' : 'Tandai HPP selesai'}</button>
      </section>}
    </div>
  );
}
