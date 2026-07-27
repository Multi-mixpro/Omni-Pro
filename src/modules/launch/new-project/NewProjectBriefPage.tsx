import { FormEvent, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Calculator, Check, ChevronRight,
  CircleDollarSign, ExternalLink, FileImage, ImagePlus, Layers3, Link2,
  PackagePlus, Palette, Plus, Ruler, Sparkles, Trash2, Truck, UploadCloud,
} from 'lucide-react';
import { useNavigate } from '@/app/router/simpleRouter';
import { uploadProjectReference } from '../data/launchRepository';
import type {
  ColorwayDraft, HppLineDraft, MaterialSupplierDraft, MeasurementDraft,
  NewProjectInput, Priority, ReferenceDraft,
} from '../domain/types';
import { useBusinessUnits, useCreateProject } from '../hooks/useLaunch';

const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
const MATERIAL_ROLES = [['MAIN', 'Bahan utama'], ['LINING', 'Lining'], ['RIB', 'Rib'], ['ACCESSORY', 'Aksesori'], ['PACKAGING', 'Kemasan'], ['OTHER', 'Lainnya']] as const;
const HPP_CATEGORIES = [['MATERIAL', 'Material'], ['ACCESSORY', 'Aksesori'], ['LABOR', 'Jahit/tenaga'], ['PRINTING', 'Sablon'], ['EMBROIDERY', 'Bordir'], ['PACKAGING', 'Kemasan'], ['OVERHEAD', 'Overhead'], ['OTHER', 'Lainnya']] as const;

interface LocalReference {
  id: string;
  file: File;
  preview: string;
}

const uid = () => crypto.randomUUID();
const emptyImageLink = (): ReferenceDraft => ({ title: '', reference_type: 'PRODUCT', image_url: '', insight: '', sort_order: 0 });
const emptyStudyLink = (): ReferenceDraft => ({ title: '', reference_type: 'MARKET', source_url: '', insight: '', sort_order: 0 });
const emptyColor = (): ColorwayDraft => ({ name: '', color_code: '', hex_code: '#111b2d', panel_notes: '' });
const emptyMeasurement = (position: number): MeasurementDraft => ({ point_code: `P${String(position).padStart(2, '0')}`, point_name: '', position, tolerance_plus: 1, tolerance_minus: 1, values: {} });
const emptyMaterial = (supplierRole: 'PRIMARY' | 'ALTERNATIVE' = 'PRIMARY'): MaterialSupplierDraft => ({
  proposed_name: '', role: 'MAIN', composition: '', gsm: '', width_cm: '', color_notes: '', estimated_consumption: '', unit: 'meter',
  suitability_notes: '', risk_notes: '', supplier_name: '', supplier_role: supplierRole, contact_name: '', phone: '', city: '', address: '',
  unit_price: '', moq: '', moq_notes: '', lead_time_days: '', supplier_notes: '',
});
const emptyHpp = (): HppLineDraft => ({ category: 'MATERIAL', item_name: '', quantity: 1, unit: 'pcs', unit_price: '', waste_percent: 0, notes: '' });

function numberValue(value: string): number | '' { return value === '' ? '' : Number(value); }

export function NewProjectBriefPage() {
  const navigate = useNavigate();
  const units = useBusinessUnits();
  const create = useCreateProject();
  const [form, setForm] = useState<NewProjectInput>({ article_name: '', business_unit_id: '', category: '', concept: '', source_notes: '', priority: 'HIGH', target_date: '' });
  const [localImages, setLocalImages] = useState<LocalReference[]>([]);
  const [imageLinks, setImageLinks] = useState<ReferenceDraft[]>([emptyImageLink()]);
  const [studyLinks, setStudyLinks] = useState<ReferenceDraft[]>([emptyStudyLink()]);
  const [colors, setColors] = useState<ColorwayDraft[]>([emptyColor()]);
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [customSize, setCustomSize] = useState('');
  const [measurements, setMeasurements] = useState<MeasurementDraft[]>([
    { ...emptyMeasurement(1), point_name: 'Lebar dada', point_code: 'LD' },
    { ...emptyMeasurement(2), point_name: 'Panjang badan', point_code: 'PB' },
  ]);
  const [materials, setMaterials] = useState<MaterialSupplierDraft[]>([emptyMaterial()]);
  const [hppLines, setHppLines] = useState<HppLineDraft[]>([emptyHpp()]);
  const [targetMargin, setTargetMargin] = useState<number | ''>(30);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<{ id: string; failedUploads: number } | null>(null);

  const referenceCount = localImages.length + imageLinks.filter(item => item.image_url?.trim()).length + studyLinks.filter(item => item.source_url?.trim()).length;
  const validColors = colors.filter(item => item.name.trim());
  const validMaterials = materials.filter(item => item.proposed_name.trim());
  const validHpp = hppLines.filter(item => item.item_name.trim());
  const hppTotal = useMemo(() => validHpp.reduce((sum, line) => {
    const quantity = Number(line.quantity) || 0;
    const price = Number(line.unit_price) || 0;
    const waste = Number(line.waste_percent) || 0;
    return sum + quantity * price * (1 + waste / 100);
  }, 0), [validHpp]);
  const identityReady = Boolean(form.article_name.trim() && form.business_unit_id && form.category.trim());
  const readyToSubmit = identityReady && referenceCount > 0;
  const completionItems = [identityReady, referenceCount > 0, validMaterials.length > 0, validColors.length > 0 && sizes.length > 0, validHpp.length > 0];
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

  function toggleSize(size: string) { setSizes(current => current.includes(size) ? current.filter(item => item !== size) : [...current, size]); }
  function addCustomSize() { const value = customSize.trim().toUpperCase(); if (value && !sizes.includes(value)) setSizes(current => [...current, value]); setCustomSize(''); }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!readyToSubmit || submitting || createdProject) return;
    setSubmitting(true);
    setSubmitError(null);
    setUploadProgress('Menyimpan brief dan menyiapkan ruang kerja…');
    try {
      const externalImages = imageLinks.filter(item => item.image_url?.trim()).map((item, index) => ({ ...item, sort_order: localImages.length + index, is_primary: localImages.length === 0 && index === 0 }));
      const learningLinks = studyLinks.filter(item => item.source_url?.trim()).map((item, index) => ({ ...item, sort_order: localImages.length + externalImages.length + index, is_primary: false }));
      const payload: NewProjectInput = {
        ...form,
        references: [...externalImages, ...learningLinks],
        colorways: validColors,
        sizes,
        size_chart_name: 'Chart size awal',
        size_unit: 'cm',
        measurements: measurements.filter(item => item.point_name.trim()),
        materials: validMaterials,
        hpp_lines: validHpp,
        target_margin_percent: targetMargin,
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
        <div><span className="eyebrow">Perintah kerja owner · Brief terstruktur</span><h2>Mulai artikel dari referensi yang kuat.</h2><p>Kumpulkan konteks awal sekali, lalu biarkan tim memvalidasi dan menyempurnakannya di setiap tahap.</p></div>
      </header>

      <nav className="brief-step-nav" aria-label="Bagian brief artikel">
        <a href="#brief-reference"><span>01</span> Referensi</a><ChevronRight size={15} />
        <a href="#brief-variant"><span>02</span> Varian & ukuran</a><ChevronRight size={15} />
        <a href="#brief-sourcing"><span>03</span> Material & supplier</a><ChevronRight size={15} />
        <a href="#brief-costing"><span>04</span> Draft HPP</a>
      </nav>

      <form className="brief-builder-layout" onSubmit={submit}>
        <div className="brief-builder-main">
          <section className="brief-section" id="brief-reference">
            <div className="brief-section-heading"><span className="section-number">01</span><div><span className="eyebrow">Fondasi keputusan</span><h3>Referensi & identitas artikel</h3><p>Gunakan beberapa sudut gambar, URL gambar, dan link yang dapat dipelajari tim.</p></div><span className={`section-state ${referenceCount ? 'ready' : ''}`}>{referenceCount ? <><Check size={14} /> {referenceCount} referensi</> : 'Minimal 1'}</span></div>

            <div className="reference-source-grid">
              <label className="multi-upload-zone"><UploadCloud size={30} /><b>Upload beberapa gambar</b><span>Pilih foto, screenshot, atau sketsa dari perangkat</span><small>JPG, PNG, WebP · maksimal 8 file · 10 MB/file</small><input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={event => addFiles(event.target.files)} /></label>
              <div className="reference-guidance"><Sparkles size={21} /><div><b>Referensi yang baik</b><p>Gabungkan tampak depan/belakang, detail konstruksi, material, warna, dan pembanding pasar.</p></div></div>
            </div>

            {localImages.length > 0 && <div className="local-reference-grid">{localImages.map((item, index) => <article key={item.id}><img src={item.preview} alt={`Referensi lokal ${index + 1}`} /><span>{index === 0 ? 'Cover utama' : `Gambar ${index + 1}`}</span><button type="button" aria-label={`Hapus ${item.file.name}`} onClick={() => removeLocalImage(item.id)}><Trash2 size={16} /></button><small>{item.file.name}</small></article>)}</div>}

            <div className="subsection-title"><div><FileImage size={18} /><span><b>Gambar dari URL</b><small>Untuk gambar yang sudah tersedia online</small></span></div><button type="button" className="text-button" onClick={() => setImageLinks(current => [...current, emptyImageLink()])}><Plus size={16} /> Tambah URL gambar</button></div>
            <div className="repeat-list">{imageLinks.map((item, index) => <div className="reference-row" key={`image-${index}`}><span className="row-index">{index + 1}</span><label className="field"><span>Judul gambar</span><input placeholder="Contoh: Tampak belakang" value={item.title} onChange={e => setImageLinks(current => current.map((row, i) => i === index ? { ...row, title: e.target.value } : row))} /></label><label className="field field-grow"><span>URL gambar</span><div className="input-icon"><Link2 size={16} /><input type="url" placeholder="https://…/gambar.jpg" value={item.image_url} onChange={e => setImageLinks(current => current.map((row, i) => i === index ? { ...row, image_url: e.target.value } : row))} /></div></label><label className="field field-grow"><span>Hal penting</span><input placeholder="Detail yang perlu dipelajari" value={item.insight} onChange={e => setImageLinks(current => current.map((row, i) => i === index ? { ...row, insight: e.target.value } : row))} /></label>{imageLinks.length > 1 && <button type="button" className="remove-row" onClick={() => setImageLinks(current => current.filter((_, i) => i !== index))}><Trash2 size={17} /></button>}</div>)}</div>

            <div className="subsection-title"><div><ExternalLink size={18} /><span><b>Link referensi untuk dipelajari</b><small>Produk pembanding, supplier, material, harga, atau tren</small></span></div><button type="button" className="text-button" onClick={() => setStudyLinks(current => [...current, emptyStudyLink()])}><Plus size={16} /> Tambah link</button></div>
            <div className="repeat-list">{studyLinks.map((item, index) => <div className="reference-row reference-link-row" key={`link-${index}`}><span className="row-index">{index + 1}</span><label className="field"><span>Jenis</span><select value={item.reference_type} onChange={e => setStudyLinks(current => current.map((row, i) => i === index ? { ...row, reference_type: e.target.value as ReferenceDraft['reference_type'] } : row))}><option value="PRODUCT">Produk</option><option value="MATERIAL">Material</option><option value="PRICE">Harga</option><option value="CONSTRUCTION">Konstruksi</option><option value="MARKET">Pasar/tren</option><option value="OTHER">Lainnya</option></select></label><label className="field"><span>Judul</span><input placeholder="Nama sumber" value={item.title} onChange={e => setStudyLinks(current => current.map((row, i) => i === index ? { ...row, title: e.target.value } : row))} /></label><label className="field field-grow"><span>Link aktif</span><input type="url" placeholder="https://…" value={item.source_url} onChange={e => setStudyLinks(current => current.map((row, i) => i === index ? { ...row, source_url: e.target.value } : row))} /></label><label className="field field-grow"><span>Alasan dipakai</span><input placeholder="Apa yang harus dipelajari?" value={item.insight} onChange={e => setStudyLinks(current => current.map((row, i) => i === index ? { ...row, insight: e.target.value } : row))} /></label>{studyLinks.length > 1 && <button type="button" className="remove-row" onClick={() => setStudyLinks(current => current.filter((_, i) => i !== index))}><Trash2 size={17} /></button>}</div>)}</div>

            <div className="field-grid brief-identity-grid"><label className="field field-wide"><span>Nama artikel *</span><input required placeholder="Contoh: Windbreaker Urban Shell" value={form.article_name} onChange={e => setForm({ ...form, article_name: e.target.value })} /></label><label className="field"><span>Unit bisnis *</span><select required value={form.business_unit_id} onChange={e => setForm({ ...form, business_unit_id: e.target.value })}><option value="">Pilih unit</option>{units.data?.map(unit => <option value={unit.id} key={unit.id}>{unit.name}</option>)}</select></label><label className="field"><span>Kategori *</span><input required placeholder="Jaket, kaos, hoodie…" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></label><label className="field field-wide"><span>Konsep & tujuan artikel</span><textarea rows={3} placeholder="Target pengguna, fungsi, fit, karakter, dan level kualitas…" value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })} /></label><label className="field field-wide"><span>Arahan owner dari seluruh referensi</span><textarea rows={3} placeholder="Bagian yang dipertahankan, diubah, dihindari, dan pertanyaan yang harus dijawab tim…" value={form.source_notes} onChange={e => setForm({ ...form, source_notes: e.target.value })} /></label></div>
          </section>

          <section className="brief-section" id="brief-variant">
            <div className="brief-section-heading"><span className="section-number">02</span><div><span className="eyebrow">Arah spesifikasi</span><h3>Varian warna, ukuran & chart size</h3><p>Masukkan hipotesis awal. Tim sampling tetap bertanggung jawab memvalidasi ukuran final.</p></div></div>
            <div className="subsection-title"><div><Palette size={18} /><span><b>Kandidat warna</b><small>Nama, kode, dan catatan panel/kombinasi</small></span></div><button type="button" className="text-button" onClick={() => setColors(current => [...current, emptyColor()])}><Plus size={16} /> Tambah warna</button></div>
            <div className="color-draft-grid">{colors.map((color, index) => <div className="color-draft" key={`color-${index}`}><input className="color-picker" type="color" value={color.hex_code || '#111b2d'} aria-label={`Pilih warna ${index + 1}`} onChange={e => setColors(current => current.map((row, i) => i === index ? { ...row, hex_code: e.target.value } : row))} /><label className="field"><span>Nama warna</span><input placeholder="Black Onyx" value={color.name} onChange={e => setColors(current => current.map((row, i) => i === index ? { ...row, name: e.target.value } : row))} /></label><label className="field"><span>Kode</span><input placeholder="BLK-01" value={color.color_code} onChange={e => setColors(current => current.map((row, i) => i === index ? { ...row, color_code: e.target.value } : row))} /></label><label className="field field-grow"><span>Panel/kombinasi</span><input placeholder="Body hitam, zipper abu" value={color.panel_notes} onChange={e => setColors(current => current.map((row, i) => i === index ? { ...row, panel_notes: e.target.value } : row))} /></label>{colors.length > 1 && <button type="button" className="remove-row" onClick={() => setColors(current => current.filter((_, i) => i !== index))}><Trash2 size={17} /></button>}</div>)}</div>

            <div className="subsection-title"><div><Ruler size={18} /><span><b>Rentang ukuran</b><small>Pilih preset dan tambahkan ukuran custom bila perlu</small></span></div></div>
            <div className="size-selector"><div>{SIZE_PRESETS.map(size => <button type="button" className={sizes.includes(size) ? 'selected' : ''} key={size} onClick={() => toggleSize(size)}>{sizes.includes(size) && <Check size={14} />}{size}</button>)}</div><label><input value={customSize} placeholder="Custom" onChange={e => setCustomSize(e.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addCustomSize(); } }} /><button type="button" onClick={addCustomSize}><Plus size={16} /></button></label></div>

            <div className="measurement-wrap"><div className="measurement-head"><b>Draft chart size <span>cm</span></b><button type="button" className="text-button" onClick={() => setMeasurements(current => [...current, emptyMeasurement(current.length + 1)])}><Plus size={16} /> Titik ukur</button></div><div className="measurement-scroll"><table><thead><tr><th>Titik ukur</th>{sizes.map(size => <th key={size}>{size}</th>)}<th>Toleransi +/−</th><th /></tr></thead><tbody>{measurements.map((row, index) => <tr key={`${row.point_code}-${index}`}><td><input placeholder="Lebar dada" value={row.point_name} onChange={e => setMeasurements(current => current.map((item, i) => i === index ? { ...item, point_name: e.target.value } : item))} /></td>{sizes.map(size => <td key={size}><input inputMode="decimal" placeholder="0" value={row.values[size] ?? ''} onChange={e => setMeasurements(current => current.map((item, i) => i === index ? { ...item, values: { ...item.values, [size]: numberValue(e.target.value) } } : item))} /></td>)}<td><div className="tolerance-input"><input inputMode="decimal" value={row.tolerance_plus} onChange={e => setMeasurements(current => current.map((item, i) => i === index ? { ...item, tolerance_plus: numberValue(e.target.value) } : item))} /><span>/</span><input inputMode="decimal" value={row.tolerance_minus} onChange={e => setMeasurements(current => current.map((item, i) => i === index ? { ...item, tolerance_minus: numberValue(e.target.value) } : item))} /></div></td><td>{measurements.length > 1 && <button type="button" onClick={() => setMeasurements(current => current.filter((_, i) => i !== index))}><Trash2 size={16} /></button>}</td></tr>)}</tbody></table></div></div>
          </section>

          <section className="brief-section" id="brief-sourcing">
            <div className="brief-section-heading"><span className="section-number">03</span><div><span className="eyebrow">Kesiapan sourcing</span><h3>Material & supplier</h3><p>Catat bahan baku, konsumsi, supplier utama atau alternatif, kontak, harga, MOQ, dan lead time.</p></div><button type="button" className="button button-secondary" onClick={() => setMaterials(current => [...current, emptyMaterial('ALTERNATIVE')])}><PackagePlus size={17} /> Tambah kandidat</button></div>
            <div className="material-card-list">{materials.map((item, index) => <article className="material-draft-card" key={`material-${index}`}><div className="material-card-head"><span className="material-card-icon"><Layers3 size={20} /></span><div><b>Kandidat {index + 1}</b><small>{item.supplier_role === 'PRIMARY' ? 'Supplier utama' : 'Supplier alternatif'}</small></div><select value={item.supplier_role} onChange={e => setMaterials(current => current.map((row, i) => i === index ? { ...row, supplier_role: e.target.value as MaterialSupplierDraft['supplier_role'] } : row))}><option value="PRIMARY">Utama</option><option value="ALTERNATIVE">Alternatif</option></select>{materials.length > 1 && <button type="button" className="remove-row" onClick={() => setMaterials(current => current.filter((_, i) => i !== index))}><Trash2 size={17} /></button>}</div><div className="material-form-grid"><label className="field field-span-2"><span>Nama bahan/komponen</span><input placeholder="Contoh: Taslan balon coating" value={item.proposed_name} onChange={e => setMaterials(current => current.map((row, i) => i === index ? { ...row, proposed_name: e.target.value } : row))} /></label><label className="field"><span>Peran bahan</span><select value={item.role} onChange={e => setMaterials(current => current.map((row, i) => i === index ? { ...row, role: e.target.value as MaterialSupplierDraft['role'] } : row))}>{MATERIAL_ROLES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="field"><span>Komposisi</span><input placeholder="100% nylon" value={item.composition} onChange={e => setMaterials(current => current.map((row, i) => i === index ? { ...row, composition: e.target.value } : row))} /></label><label className="field"><span>GSM</span><input type="number" min="0" placeholder="120" value={item.gsm} onChange={e => setMaterials(current => current.map((row, i) => i === index ? { ...row, gsm: numberValue(e.target.value) } : row))} /></label><label className="field"><span>Lebar bahan (cm)</span><input type="number" min="0" placeholder="150" value={item.width_cm} onChange={e => setMaterials(current => current.map((row, i) => i === index ? { ...row, width_cm: numberValue(e.target.value) } : row))} /></label><label className="field"><span>Konsumsi</span><div className="joined-input"><input type="number" min="0" step="0.01" placeholder="1.5" value={item.estimated_consumption} onChange={e => setMaterials(current => current.map((row, i) => i === index ? { ...row, estimated_consumption: numberValue(e.target.value) } : row))} /><select value={item.unit} onChange={e => setMaterials(current => current.map((row, i) => i === index ? { ...row, unit: e.target.value } : row))}><option>meter</option><option>kg</option><option>pcs</option><option>set</option><option>roll</option></select></div></label><label className="field field-span-3"><span>Warna & karakter bahan</span><input placeholder="Pilihan warna, handfeel, stretch, coating, ketebalan…" value={item.color_notes} onChange={e => setMaterials(current => current.map((row, i) => i === index ? { ...row, color_notes: e.target.value } : row))} /></label></div><div className="supplier-divider"><Truck size={17} /><span>Data supplier</span></div><div className="material-form-grid"><label className="field field-span-2"><span>Nama supplier</span><input placeholder="Nama toko, pabrik, atau distributor" value={item.supplier_name} onChange={e => setMaterials(current => current.map((row, i) => i === index ? { ...row, supplier_name: e.target.value } : row))} /></label><label className="field"><span>Kontak person</span><input placeholder="Nama PIC" value={item.contact_name} onChange={e => setMaterials(current => current.map((row, i) => i === index ? { ...row, contact_name: e.target.value } : row))} /></label><label className="field"><span>WhatsApp/telepon</span><input inputMode="tel" placeholder="08…" value={item.phone} onChange={e => setMaterials(current => current.map((row, i) => i === index ? { ...row, phone: e.target.value } : row))} /></label><label className="field"><span>Kota</span><input placeholder="Bandung" value={item.city} onChange={e => setMaterials(current => current.map((row, i) => i === index ? { ...row, city: e.target.value } : row))} /></label><label className="field"><span>Harga per {item.unit}</span><input type="number" min="0" placeholder="0" value={item.unit_price} onChange={e => setMaterials(current => current.map((row, i) => i === index ? { ...row, unit_price: numberValue(e.target.value) } : row))} /></label><label className="field"><span>MOQ</span><input type="number" min="0" placeholder="0" value={item.moq} onChange={e => setMaterials(current => current.map((row, i) => i === index ? { ...row, moq: numberValue(e.target.value) } : row))} /></label><label className="field"><span>Lead time (hari)</span><input type="number" min="0" placeholder="7" value={item.lead_time_days} onChange={e => setMaterials(current => current.map((row, i) => i === index ? { ...row, lead_time_days: numberValue(e.target.value) } : row))} /></label><label className="field field-span-3"><span>Catatan supplier</span><input placeholder="Kualitas, cara pemesanan, risiko, masa berlaku harga…" value={item.supplier_notes} onChange={e => setMaterials(current => current.map((row, i) => i === index ? { ...row, supplier_notes: e.target.value } : row))} /></label></div></article>)}</div>
          </section>

          <section className="brief-section" id="brief-costing">
            <div className="brief-section-heading"><span className="section-number">04</span><div><span className="eyebrow">Estimasi awal</span><h3>Draft HPP & target</h3><p>Owner boleh memberi angka awal; tim costing wajib memvalidasi sebelum status final.</p></div><button type="button" className="button button-secondary" onClick={() => setHppLines(current => [...current, emptyHpp()])}><Plus size={17} /> Komponen biaya</button></div>
            <div className="hpp-table-wrap"><div className="hpp-table-head"><span>Komponen</span><span>Jumlah</span><span>Satuan</span><span>Harga satuan</span><span>Waste</span><span>Total</span><span /></div>{hppLines.map((line, index) => { const total = (Number(line.quantity) || 0) * (Number(line.unit_price) || 0) * (1 + (Number(line.waste_percent) || 0) / 100); return <div className="hpp-table-row" key={`hpp-${index}`}><div><select value={line.category} aria-label="Kategori biaya" onChange={e => setHppLines(current => current.map((row, i) => i === index ? { ...row, category: e.target.value as HppLineDraft['category'] } : row))}>{HPP_CATEGORIES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><input placeholder="Nama bahan/jasa" value={line.item_name} onChange={e => setHppLines(current => current.map((row, i) => i === index ? { ...row, item_name: e.target.value } : row))} /></div><input type="number" min="0" step="0.01" value={line.quantity} onChange={e => setHppLines(current => current.map((row, i) => i === index ? { ...row, quantity: numberValue(e.target.value) } : row))} /><input value={line.unit} onChange={e => setHppLines(current => current.map((row, i) => i === index ? { ...row, unit: e.target.value } : row))} /><input type="number" min="0" placeholder="0" value={line.unit_price} onChange={e => setHppLines(current => current.map((row, i) => i === index ? { ...row, unit_price: numberValue(e.target.value) } : row))} /><div className="percent-input"><input type="number" min="0" value={line.waste_percent} onChange={e => setHppLines(current => current.map((row, i) => i === index ? { ...row, waste_percent: numberValue(e.target.value) } : row))} /><span>%</span></div><b>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(total)}</b>{hppLines.length > 1 && <button type="button" onClick={() => setHppLines(current => current.filter((_, i) => i !== index))}><Trash2 size={16} /></button>}</div>; })}</div>
            <div className="cost-summary-strip"><div><Calculator size={21} /><span><small>Estimasi HPP awal</small><b>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(hppTotal)}</b></span></div><label><span>Target margin</span><div><input type="number" min="0" max="100" value={targetMargin} onChange={e => setTargetMargin(numberValue(e.target.value))} /><b>%</b></div></label><div><small>Harga rekomendasi awal</small><b>{targetMargin !== '' && Number(targetMargin) < 100 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(hppTotal / (1 - Number(targetMargin) / 100)) : '—'}</b></div></div>
            <div className="field-grid priority-grid"><label className="field"><span>Prioritas</span><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}><option value="NORMAL">Normal</option><option value="HIGH">Tinggi</option><option value="URGENT">Mendesak</option></select></label><label className="field"><span>Target siap produksi</span><input type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} /></label></div>
          </section>
        </div>

        <aside className="brief-command-panel">
          <div className="brief-score"><div className="brief-score-ring" style={{ '--score': `${completion * 3.6}deg` } as React.CSSProperties}><span>{completion}%</span></div><div><span className="eyebrow">Kesiapan brief</span><h3>{completion >= 80 ? 'Siap dibagikan ke tim' : 'Lengkapi konteks utama'}</h3></div></div>
          <div className="brief-checklist"><div className={identityReady ? 'done' : ''}><span>{identityReady ? <Check size={14} /> : '1'}</span><p><b>Identitas artikel</b><small>Nama, unit, dan kategori</small></p></div><div className={referenceCount ? 'done' : ''}><span>{referenceCount ? <Check size={14} /> : '2'}</span><p><b>Minimal satu referensi</b><small>File, URL gambar, atau link</small></p></div><div className={validMaterials.length ? 'done' : ''}><span>{validMaterials.length ? <Check size={14} /> : '3'}</span><p><b>Material & supplier</b><small>{validMaterials.length} kandidat disiapkan</small></p></div><div className={validColors.length && sizes.length ? 'done' : ''}><span>{validColors.length && sizes.length ? <Check size={14} /> : '4'}</span><p><b>Varian & ukuran</b><small>{validColors.length} warna · {sizes.length} ukuran</small></p></div><div className={validHpp.length ? 'done' : ''}><span>{validHpp.length ? <Check size={14} /> : '5'}</span><p><b>Draft HPP</b><small>{validHpp.length} komponen biaya</small></p></div></div>
          <div className="brief-output"><span className="eyebrow">Output otomatis</span><p><ImagePlus size={16} /> Galeri referensi Cloudinary</p><p><Layers3 size={16} /> 9 tahap dan tugas tim</p><p><Palette size={16} /> Draft spesifikasi</p><p><CircleDollarSign size={16} /> Worksheet HPP versi 1</p></div>
          {submitError && <div className={`form-error ${createdProject ? 'form-warning' : ''}`}>{createdProject && <AlertTriangle size={17} />}{submitError}</div>}
          {createdProject ? <button type="button" className="button button-primary button-large" onClick={() => navigate(`/launch/app/projects/${createdProject.id}`)}>Buka workspace artikel <ArrowRight size={18} /></button> : <button className="button button-primary button-large" disabled={!readyToSubmit || submitting}>{submitting ? uploadProgress : 'Buat workspace artikel'} <ArrowRight size={18} /></button>}
          {!readyToSubmit && <small className="submit-hint">Lengkapi identitas dan minimal satu referensi untuk melanjutkan.</small>}
          <small className="data-note">Data terstruktur tersimpan di Supabase. File gambar tersimpan di Cloudinary.</small>
        </aside>
      </form>
    </div>
  );
}
