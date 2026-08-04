import { FormEvent, useState } from 'react';
import { AlertCircle, ArrowLeft, BookOpen, Check, ExternalLink, FileImage, ImageOff, Plus } from 'lucide-react';
import { SafeImage } from './SafeImage';
import { uploadProjectReference } from '../data/launchRepository';
import { useAddReference, useDeleteReference, useUpdateResearchSummary, useUpdateStage } from '../hooks/useLaunch';
import { DeleteButton } from './DeleteButton';
import type { LaunchStage, ProjectWorkspace, ReferenceType } from '../domain/types';

const REFERENCE_TYPES: Array<[ReferenceType, string]> = [
  ['PRODUCT', 'Produk pembanding'], ['MATERIAL', 'Bahan'], ['PRICE', 'Harga pasar'],
  ['CONSTRUCTION', 'Konstruksi/fit'], ['MARKET', 'Insight pasar'], ['OTHER', 'Lainnya'],
];

interface ResearchPanelProps {
  projectId: string;
  stage?: LaunchStage;
  references: ProjectWorkspace['references'];
  researchSummary: string | null;
  onBack: () => void;
}

export function ResearchPanel({ projectId, stage, references, researchSummary, onBack }: ResearchPanelProps) {
  const addReference = useAddReference(projectId);
  const deleteReference = useDeleteReference(projectId);
  const updateSummary = useUpdateResearchSummary(projectId);
  const updateStageMutation = useUpdateStage(projectId);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ReferenceType>('PRODUCT');
  const [sourceUrl, setSourceUrl] = useState('');
  const [insight, setInsight] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [summary, setSummary] = useState(researchSummary ?? '');
  const [addError, setAddError] = useState<string | null>(null);
  const [stageError, setStageError] = useState<string | null>(null);

  const imageReferences = references.filter(item => item.image_url);
  const linkReferences = references.filter(item => !item.image_url);
  const summaryDirty = summary !== (researchSummary ?? '');
  const canComplete = references.length > 0 && (researchSummary ?? '').trim().length > 0;

  async function submitReference(event: FormEvent) {
    event.preventDefault();
    setAddError(null);
    try {
      if (image) {
        await uploadProjectReference(projectId, image, { title: title || undefined, sortOrder: references.length });
      } else {
        if (!title.trim()) throw new Error('Judul referensi wajib diisi.');
        await addReference.mutateAsync({ title: title.trim(), reference_type: type, source_url: sourceUrl.trim() || undefined, insight: insight.trim() || undefined, sort_order: references.length });
      }
      setTitle(''); setSourceUrl(''); setInsight(''); setImage(null); setType('PRODUCT');
    } catch (reason) { setAddError(reason instanceof Error ? reason.message : 'Referensi belum dapat disimpan.'); }
  }

  async function completeStage() {
    if (!stage) return;
    setStageError(null);
    try { await updateStageMutation.mutateAsync({ stageId: stage.id, status: 'COMPLETED' }); }
    catch (reason) { setStageError(reason instanceof Error ? reason.message : 'Gate riset belum lengkap.'); }
  }

  return (
    <div className="workstream-panel">
      <button className="back-link" onClick={onBack}><ArrowLeft size={18} /> Kembali ke ruang kerja</button>
      <div className="section-head"><div><span className="eyebrow">Tahap 02 · Riset artikel</span><h3>Benchmark, insight, dan kesimpulan riset</h3><p>Kumpulkan referensi produk sejenis, target pengguna, konstruksi, harga pasar, lalu tuliskan kesimpulan sebelum lanjut ke sourcing.</p></div></div>

      <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Referensi terkumpul</span><h3>{references.length} referensi</h3></div></div>
        {references.length > 0 ? <>
          {imageReferences.length > 0 && <div className="snapshot-gallery">{imageReferences.map(item => <div className="gallery-item" key={item.id}><a href={item.source_url || item.image_url || '#'} target="_blank" rel="noreferrer"><SafeImage src={item.image_url} alt={item.title} fallback={<span className="image-fallback"><ImageOff size={20} /><small>Gambar tidak dapat dimuat</small></span>} /><span>{item.is_primary && <small>Cover</small>}<b>{item.title}</b></span></a><div className="gallery-delete"><DeleteButton label={item.title} pending={deleteReference.isPending} onConfirm={() => deleteReference.mutate(item.id)} /></div></div>)}</div>}
          {linkReferences.length > 0 && <div className="snapshot-links">{linkReferences.map(item => <div className="link-item" key={item.id}><a href={item.source_url || '#'} target="_blank" rel="noreferrer"><span><small>{item.reference_type}</small><b>{item.title}</b><p>{item.insight || 'Belum ada catatan insight.'}</p></span><ExternalLink size={17} /></a><DeleteButton label={item.title} pending={deleteReference.isPending} onConfirm={() => deleteReference.mutate(item.id)} /></div>)}</div>}
        </> : <div className="state-panel state-empty"><BookOpen size={28} /><h3>Belum ada referensi</h3><p>Tambahkan minimal satu referensi untuk membuka gate riset.</p></div>}
      </section>

      <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Tambah referensi</span><h3>Gambar, link, atau catatan baru</h3></div></div>
        <form className="field-grid" onSubmit={submitReference}>
          <label className="field field-wide"><span>Judul referensi</span><input placeholder="Contoh: Windbreaker kompetitor A" value={title} onChange={e => setTitle(e.target.value)} /></label>
          <label className="field"><span>Jenis</span><select value={type} onChange={e => setType(e.target.value as ReferenceType)}>{REFERENCE_TYPES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label className="field"><span>Link sumber (opsional)</span><input placeholder="https://…" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} /></label>
          <label className="field field-wide"><span>Insight/catatan</span><textarea rows={2} placeholder="Apa yang bisa dipelajari dari referensi ini…" value={insight} onChange={e => setInsight(e.target.value)} /></label>
          <label className="field"><span>Atau unggah gambar</span><input type="file" accept="image/*,.webp,.png,.jpg,.jpeg,.gif,.bmp,.svg,.avif,.heic,.heif" onChange={e => setImage(e.target.files?.[0] ?? null)} /></label>
          {addError && <div className="form-error field-wide">{addError}</div>}
          <button className="button button-primary" disabled={addReference.isPending} type="submit"><Plus size={17} /> {addReference.isPending ? 'Menyimpan…' : 'Simpan referensi'}</button>
        </form>
      </section>

      <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Kesimpulan riset</span><h3>Ringkasan sebelum lanjut sourcing</h3></div></div>
        <label className="field field-wide"><span>Target pengguna, fungsi, keunggulan, dan risiko artikel</span><textarea rows={4} placeholder="Rangkum hasil riset: siapa penggunanya, kenapa produk ini relevan, apa risikonya…" value={summary} onChange={e => setSummary(e.target.value)} /></label>
        <button className="button button-secondary" disabled={!summaryDirty || updateSummary.isPending} onClick={() => updateSummary.mutate(summary)}>{updateSummary.isPending ? 'Menyimpan…' : 'Simpan kesimpulan'}</button>
      </section>

      {stage && stage.status !== 'COMPLETED' && <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Gate tahap</span><h3>Tandai riset selesai</h3></div></div>
        <div className="gate-list"><div className={references.length ? 'done' : ''}><span>{references.length ? <Check size={15} /> : <BookOpen size={16} />}</span><b>Minimal satu referensi</b><small>{references.length} tersimpan</small></div><div className={(researchSummary ?? '').trim() ? 'done' : ''}><span>{(researchSummary ?? '').trim() ? <Check size={15} /> : <FileImage size={16} />}</span><b>Kesimpulan riset</b><small>{(researchSummary ?? '').trim() ? 'Tersedia' : 'Belum diisi'}</small></div></div>
        {stageError && <div className="form-error"><AlertCircle size={16} /> {stageError}</div>}
        <button className="button button-primary" disabled={!canComplete || updateStageMutation.isPending} onClick={completeStage}>{updateStageMutation.isPending ? 'Memproses…' : 'Tandai riset selesai'}</button>
      </section>}
    </div>
  );
}
