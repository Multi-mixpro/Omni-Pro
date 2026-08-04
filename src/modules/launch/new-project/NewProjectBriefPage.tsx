import { FormEvent, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, ExternalLink, FileImage, ImagePlus,
  Layers3, Link2, Palette, Plus, Sparkles, Trash2, UploadCloud, User,
} from 'lucide-react';
import { useNavigate } from '@/app/router/simpleRouter';
import { useAuth } from '@/core/auth/useAuth';
import { uploadProjectReference } from '../data/launchRepository';
import type { NewProjectInput, Priority, ReferenceDraft } from '../domain/types';
import { useBusinessUnits, useCreateProject } from '../hooks/useLaunch';

const CATEGORY_SUGGESTIONS = ['Jaket', 'Kaos', 'Polo', 'Kemeja', 'Hoodie', 'Crewneck', 'Celana', 'Celana Pendek', 'Rok', 'Dress', 'Vest', 'Topi', 'Tas', 'Aksesori', 'Seragam'];

interface LocalReference {
  id: string;
  file: File;
  preview: string;
}

const uid = () => crypto.randomUUID();
const emptyImageLink = (): ReferenceDraft => ({ title: '', reference_type: 'PRODUCT', image_url: '', insight: '', sort_order: 0 });
const emptyStudyLink = (): ReferenceDraft => ({ title: '', reference_type: 'MARKET', source_url: '', insight: '', sort_order: 0 });

function offsetDate(value: string, days: number) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
// Halaman produk (mis. marketplace) sering tertempel di kolom URL gambar dan
// menghasilkan gambar rusak tanpa peringatan. Terima hanya URL berkas gambar.
function imageUrlIssue(value: string) {
  const url = value.trim();
  if (!url) return null;
  let parsed: URL;
  try { parsed = new URL(url); } catch { return 'URL tidak valid. Awali dengan https://'; }
  if (!/^https?:$/.test(parsed.protocol)) return 'Gunakan alamat http:// atau https://';
  if (!/\.(jpe?g|png|webp|gif|avif)$/i.test(parsed.pathname)) {
    return 'Ini sepertinya link halaman, bukan berkas gambar. Pakai URL yang berakhiran .jpg/.png/.webp, atau pindahkan ke "Link referensi".';
  }
  return null;
}

export function NewProjectBriefPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const units = useBusinessUnits();
  const create = useCreateProject();
  const [form, setForm] = useState<NewProjectInput>({ article_name: '', business_unit_id: '', category: '', concept: '', priority: 'HIGH' });
  const [targetQuantity, setTargetQuantity] = useState<number | ''>(500);
  const [sampleDays, setSampleDays] = useState<number | ''>(14);
  const [localImages, setLocalImages] = useState<LocalReference[]>([]);
  const [imageLinks, setImageLinks] = useState<ReferenceDraft[]>([emptyImageLink()]);
  const [studyLinks, setStudyLinks] = useState<ReferenceDraft[]>([emptyStudyLink()]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<{ id: string; failedUploads: number } | null>(null);

  const imageLinkIssues = imageLinks.map(item => imageUrlIssue(item.image_url ?? ''));
  const validImageLinks = imageLinks.filter((item, index) => item.image_url?.trim() && !imageLinkIssues[index]);
  const referenceCount = localImages.length + validImageLinks.length + studyLinks.filter(item => item.source_url?.trim()).length;
  const identityReady = Boolean(form.article_name.trim() && form.business_unit_id && form.category.trim());
  const readyToSubmit = identityReady && referenceCount > 0;
  const completionItems = [identityReady, referenceCount > 0, Boolean(form.concept?.trim())];
  const completion = Math.round(completionItems.filter(Boolean).length / completionItems.length * 100);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const accepted = Array.from(files).filter(file => ['image/png', 'image/jpeg', 'image/webp'].includes(file.type) && file.size <= 10 * 1024 * 1024);
    const next = accepted.slice(0, Math.max(0, 8 - localImages.length)).map(file => ({ id: uid(), file, preview: URL.createObjectURL(file) }));
    setLocalImages(current => [...current, ...next]);
  }

  function removeLocalImage(id: string) {
    setLocalImages(current => {
      const target = current.find(item => item.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter(item => item.id !== id);
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!readyToSubmit || submitting || createdProject) return;
    setSubmitting(true);
    setSubmitError(null);
    setUploadProgress('Menyimpan brief dan menyiapkan ruang kerja…');
    try {
      const today = new Date().toISOString().slice(0, 10);
      const sampleDate = sampleDays === '' ? undefined : offsetDate(today, Number(sampleDays));
      const externalImages = validImageLinks.map((item, index) => ({ ...item, sort_order: localImages.length + index, is_primary: localImages.length === 0 && index === 0 }));
      const learningLinks = studyLinks.filter(item => item.source_url?.trim()).map((item, index) => ({ ...item, sort_order: localImages.length + externalImages.length + index, is_primary: false }));
      const payload: NewProjectInput = {
        ...form,
        target_quantity: targetQuantity,
        target_sample_date: sampleDate,
        target_fix_date: sampleDate,
        target_research_date: sampleDays === '' ? undefined : offsetDate(today, Math.max(2, Number(sampleDays) - 10)),
        target_sourcing_date: sampleDays === '' ? undefined : offsetDate(today, Math.max(4, Number(sampleDays) - 5)),
        target_costing_date: sampleDate ? offsetDate(sampleDate, 3) : undefined,
        target_date: sampleDate ? offsetDate(sampleDate, 10) : undefined,
        target_launch_date: sampleDate ? offsetDate(sampleDate, 24) : undefined,
        references: [...externalImages, ...learningLinks],
      };
      const projectId = await create.mutateAsync(payload);

      let failedUploads = 0;
      let primaryAssigned = localImages.length === 0;
      for (let index = 0; index < localImages.length; index += 1) {
        const item = localImages[index];
        setUploadProgress(`Mengunggah gambar ${index + 1} dari ${localImages.length}…`);
        try {
          await uploadProjectReference(projectId, item.file, { isPrimary: !primaryAssigned, sortOrder: index, title: item.file.name.replace(/\.[^.]+$/, '') });
          primaryAssigned = true;
        } catch {
          failedUploads += 1;
        }
      }
      if (failedUploads > 0) {
        setCreatedProject({ id: projectId, failedUploads });
        setSubmitError(`Workspace berhasil dibuat, tetapi ${failedUploads} gambar belum terunggah. Anda dapat melanjutkan dan menambahkannya kembali dari ruang kerja.`);
      } else {
        navigate(`/launch/app/projects/${projectId}`);
      }
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'Brief artikel belum dapat dibuat.');
    } finally {
      setSubmitting(false);
      setUploadProgress('');
    }
  }

  return (
    <div className="brief-builder-page">
      <header className="brief-builder-header">
        <button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Kembali</button>
        <div><span className="eyebrow">Pendaftaran artikel baru</span><h2>Input identitas awal, lampirkan foto &amp; referensi.</h2><p>Varian warna, ukuran, BOM, dan HPP diisi tim di ruang kerja tahap masing-masing.</p></div>
      </header>

      <form className="brief-builder-layout" onSubmit={submit}>
        <div className="brief-builder-main">
          <section className="brief-section" id="brief-identity">
            <div className="brief-section-heading"><span className="section-number">01</span><div><span className="eyebrow">Identitas &amp; unit bisnis</span><h3>Data dasar artikel</h3><p>Nama kerja, unit bisnis, dan kategori produk.</p></div></div>
            <div className="field-grid brief-identity-grid">
              <label className="field field-wide"><span>Nama artikel *</span><input required placeholder="Contoh: Windbreaker Urban Shell" value={form.article_name} onChange={e => setForm({ ...form, article_name: e.target.value })} /></label>
              <label className="field"><span>Unit bisnis *</span><select required value={form.business_unit_id} onChange={e => setForm({ ...form, business_unit_id: e.target.value })}><option value="">Pilih unit</option>{units.data?.map(unit => <option value={unit.id} key={unit.id}>{unit.name}</option>)}</select></label>
              <label className="field"><span>Kategori *</span><input required list="category-suggestions" placeholder="Jaket, kaos, hoodie…" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /><datalist id="category-suggestions">{CATEGORY_SUGGESTIONS.map(c => <option value={c} key={c} />)}</datalist></label>
              <label className="field"><span>Prioritas</span><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}><option value="NORMAL">Normal</option><option value="HIGH">Tinggi</option><option value="URGENT">Mendesak</option></select></label>
              <label className="field"><span>Target kuantitas (pcs)</span><input type="number" min={0} placeholder="500" value={targetQuantity} onChange={e => setTargetQuantity(e.target.value === '' ? '' : Number(e.target.value))} /></label>
              <label className="field"><span>Target sample pertama (hari dari sekarang)</span><input type="number" min={1} placeholder="14" value={sampleDays} onChange={e => setSampleDays(e.target.value === '' ? '' : Number(e.target.value))} /></label>
              <div className="field pimpro-display"><span>Pimpinan proyek (Pimpro)</span><div className="pimpro-chip"><User size={15} /> {auth.data?.profile?.full_name ?? 'Memuat…'}</div></div>
              <label className="field field-wide"><span>Konsep &amp; tujuan artikel</span><textarea rows={3} placeholder="Target pengguna, fungsi, fit, karakter, dan level kualitas…" value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })} /></label>
            </div>
          </section>

          <section className="brief-section" id="brief-reference">
            <div className="brief-section-heading"><span className="section-number">02</span><div><span className="eyebrow">Fondasi keputusan</span><h3>Foto &amp; referensi</h3><p>Gunakan beberapa sudut gambar, URL gambar, dan link yang dapat dipelajari tim.</p></div><span className={`section-state ${referenceCount ? 'ready' : ''}`}>{referenceCount ? <><Check size={14} /> {referenceCount} referensi</> : 'Minimal 1'}</span></div>

            <div className="reference-source-grid">
              <label className="multi-upload-zone"><UploadCloud size={30} /><b>Upload beberapa gambar</b><span>Pilih foto, screenshot, atau sketsa dari perangkat</span><small>WebP, JPG, PNG, GIF, SVG, AVIF, HEIC · maksimal 8 file · 10 MB/file</small><input type="file" multiple accept="image/*,.webp,.png,.jpg,.jpeg,.gif,.bmp,.svg,.avif,.heic,.heif" onChange={event => addFiles(event.target.files)} /></label>
              <div className="reference-guidance"><Sparkles size={21} /><div><b>Referensi yang baik</b><p>Gabungkan tampak depan/belakang, detail konstruksi, material, warna, dan pembanding pasar.</p></div></div>
            </div>

            {localImages.length > 0 && <div className="local-reference-grid">{localImages.map((item, index) => <article key={item.id}><img src={item.preview} alt={`Referensi lokal ${index + 1}`} /><span>{index === 0 ? 'Sampul utama' : `Gambar ${index + 1}`}</span><button type="button" aria-label={`Hapus ${item.file.name}`} onClick={() => removeLocalImage(item.id)}><Trash2 size={16} /></button><small>{item.file.name}</small></article>)}</div>}

            <div className="subsection-title"><div><FileImage size={18} /><span><b>Atau tempel link URL foto</b><small>Untuk gambar yang sudah tersedia online</small></span></div><button type="button" className="text-button" onClick={() => setImageLinks(current => [...current, emptyImageLink()])}><Plus size={16} /> Tambah URL</button></div>
            <div className="repeat-list">{imageLinks.map((item, index) => <div className="reference-row" key={`image-${index}`}><span className="row-index">{index + 1}</span><label className="field"><span>Judul gambar</span><input placeholder="Contoh: Tampak belakang" value={item.title} onChange={e => setImageLinks(current => current.map((row, i) => i === index ? { ...row, title: e.target.value } : row))} /></label><label className="field field-grow"><span>URL gambar</span><div className={`input-icon ${imageLinkIssues[index] ? 'input-invalid' : ''}`}><Link2 size={16} /><input type="url" placeholder="https://…/gambar.jpg" value={item.image_url} onChange={e => setImageLinks(current => current.map((row, i) => i === index ? { ...row, image_url: e.target.value } : row))} /></div>{imageLinkIssues[index] && <small className="field-hint-error">{imageLinkIssues[index]}</small>}</label>{imageLinks.length > 1 && <button type="button" className="remove-row" onClick={() => setImageLinks(current => current.filter((_, i) => i !== index))}><Trash2 size={17} /></button>}</div>)}</div>

            <div className="subsection-title"><div><ExternalLink size={18} /><span><b>Link referensi tambahan</b><small>Pinterest, media, atau kompetitor</small></span></div><button type="button" className="text-button" onClick={() => setStudyLinks(current => [...current, emptyStudyLink()])}><Plus size={16} /> Tambah link</button></div>
            <div className="repeat-list">{studyLinks.map((item, index) => <div className="reference-row reference-link-row" key={`link-${index}`}><span className="row-index">{index + 1}</span><label className="field"><span>Jenis</span><select value={item.reference_type} onChange={e => setStudyLinks(current => current.map((row, i) => i === index ? { ...row, reference_type: e.target.value as ReferenceDraft['reference_type'] } : row))}><option value="PRODUCT">Siluet</option><option value="MATERIAL">Material</option><option value="PRICE">Harga</option><option value="CONSTRUCTION">Konstruksi</option><option value="MARKET">Pasar/tren</option><option value="OTHER">Lainnya</option></select></label><label className="field"><span>Judul</span><input placeholder="Nama sumber" value={item.title} onChange={e => setStudyLinks(current => current.map((row, i) => i === index ? { ...row, title: e.target.value } : row))} /></label><label className="field field-grow"><span>Link URL referensi</span><input type="url" placeholder="https://…" value={item.source_url} onChange={e => setStudyLinks(current => current.map((row, i) => i === index ? { ...row, source_url: e.target.value } : row))} /></label><label className="field field-grow"><span>Catatan/alasan (opsional)</span><input placeholder="Apa yang harus dipelajari?" value={item.insight} onChange={e => setStudyLinks(current => current.map((row, i) => i === index ? { ...row, insight: e.target.value } : row))} /></label>{studyLinks.length > 1 && <button type="button" className="remove-row" onClick={() => setStudyLinks(current => current.filter((_, i) => i !== index))}><Trash2 size={17} /></button>}</div>)}</div>
          </section>
        </div>

        <aside className="brief-command-panel">
          <div className="brief-score"><div className="brief-score-ring" style={{ '--score': `${completion * 3.6}deg` } as React.CSSProperties}><span>{completion}%</span></div><div><span className="eyebrow">Kesiapan brief</span><h3>{completion >= 66 ? 'Siap didaftarkan' : 'Lengkapi identitas & referensi'}</h3></div></div>
          <div className="brief-checklist"><div className={identityReady ? 'done' : ''}><span>{identityReady ? <Check size={14} /> : '1'}</span><p><b>Identitas artikel</b><small>Nama, unit, dan kategori</small></p></div><div className={referenceCount ? 'done' : ''}><span>{referenceCount ? <Check size={14} /> : '2'}</span><p><b>Minimal satu referensi</b><small>File, URL gambar, atau link</small></p></div></div>
          <div className="brief-output"><span className="eyebrow">Diisi tim setelah ini</span><p><Palette size={16} /> Varian warna &amp; size chart</p><p><Layers3 size={16} /> BOM, material &amp; supplier</p><p><ImagePlus size={16} /> HPP &amp; harga produksi</p></div>
          {submitError && <div className={`form-error ${createdProject ? 'form-warning' : ''}`}>{submitError}</div>}
          {createdProject ? <button type="button" className="button button-primary button-large" onClick={() => navigate(`/launch/app/projects/${createdProject.id}`)}>Buka workspace artikel <ArrowRight size={18} /></button> : <button className="button button-primary button-large" disabled={!readyToSubmit || submitting}>{submitting ? uploadProgress : 'Daftarkan artikel sekarang'} <ArrowRight size={18} /></button>}
          {!readyToSubmit && <small className="submit-hint">Lengkapi identitas dan minimal satu referensi untuk melanjutkan.</small>}
          <small className="data-note">Data terstruktur tersimpan di Supabase. File gambar tersimpan di Cloudinary.</small>
        </aside>
      </form>
    </div>
  );
}
