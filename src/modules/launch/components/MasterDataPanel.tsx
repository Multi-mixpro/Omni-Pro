import { FormEvent, useState } from 'react';
import { Link2, Plus, Save, Star, Trash2, X } from 'lucide-react';
import { useCreateMasterMaterial, useCreateMasterSupplier, useLinkMaterialSupplier, useMasterSuppliers, useMaterialSuppliers, useUnlinkMaterialSupplier, useUpdateMasterMaterial, useUpdateMasterSupplier, useUpdateMaterialSupplierLink } from '../hooks/useLaunch';
import type { MasterMaterial, MasterMaterialDraft, MasterSupplier, MasterSupplierDraft, MaterialSupplierLinkDraft } from '../domain/types';

const MATERIAL_UNITS = ['meter', 'yard', 'kg', 'gram', 'pcs', 'set', 'pasang', 'roll', 'lembar', 'lusin', 'box', 'liter'];
const MATERIAL_CATEGORIES = ['Kain utama', 'Lining', 'Rib', 'Aksesori', 'Kemasan', 'Benang', 'Label', 'Lainnya'];
const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

function emptyMaterial(): MasterMaterialDraft {
  return { name: '', category: '', composition: '', gsm: '', width_cm: '', unit: 'meter', characteristics: '', care_notes: '' };
}

function MaterialSupplierLinks({ materialId }: { materialId: string }) {
  const links = useMaterialSuppliers(materialId);
  const suppliers = useMasterSuppliers();
  const link = useLinkMaterialSupplier(materialId);
  const unlink = useUnlinkMaterialSupplier(materialId);
  const updateLink = useUpdateMaterialSupplierLink(materialId);
  const [draft, setDraft] = useState<MaterialSupplierLinkDraft>({ supplier_id: '', unit_price: '', price_unit: 'meter', moq: '', lead_time_days: '' });
  const [error, setError] = useState<string | null>(null);

  const linkedIds = new Set((links.data ?? []).map(item => item.supplier_id));
  const availableSuppliers = (suppliers.data ?? []).filter(s => !linkedIds.has(s.id));

  async function submitLink(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!draft.supplier_id) { setError('Pilih supplier terlebih dahulu.'); return; }
    try {
      await link.mutateAsync(draft);
      setDraft({ supplier_id: '', unit_price: '', price_unit: 'meter', moq: '', lead_time_days: '' });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Supplier belum dapat ditautkan.'); }
  }

  return (
    <div className="material-supplier-links">
      <div className="section-head"><div><span className="eyebrow">Sumber belanja bahan baku</span><h3>Supplier untuk material ini</h3></div></div>
      {links.data?.length ? <div className="resource-list">{links.data.map(item => <div key={item.id}>
        <span className="resource-icon"><Link2 size={16} /></span>
        <div><b>{item.supplier?.name ?? 'Supplier'}{item.is_primary && <span className="primary-badge"><Star size={10} /> Utama</span>}</b>
          <small>{item.unit_price ? `${money.format(item.unit_price)}/${item.price_unit ?? 'unit'}` : 'Harga belum diisi'}{item.moq ? ` · MOQ ${item.moq}` : ''}{item.lead_time_days ? ` · ${item.lead_time_days} hari` : ''}</small>
        </div>
        {!item.is_primary && <button type="button" className="text-button" onClick={() => updateLink.mutate({ id: item.id, patch: { is_primary: true } })}>Jadikan utama</button>}
        <button type="button" className="icon-button" onClick={() => unlink.mutate(item.id)} aria-label="Hapus tautan supplier"><Trash2 size={15} /></button>
      </div>)}</div> : <p className="quote-empty">Belum ada supplier sumber untuk material ini.</p>}

      <form className="field-grid material-supplier-form" onSubmit={submitLink}>
        <label className="field field-wide"><span>Pilih supplier</span><select value={draft.supplier_id} onChange={e => setDraft({ ...draft, supplier_id: e.target.value })}><option value="">Pilih supplier…</option>{availableSuppliers.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
        <label className="field"><span>Harga</span><input type="number" min={0} placeholder="0" value={draft.unit_price} onChange={e => setDraft({ ...draft, unit_price: e.target.value === '' ? '' : Number(e.target.value) })} /></label>
        <label className="field"><span>Satuan harga</span><select value={draft.price_unit} onChange={e => setDraft({ ...draft, price_unit: e.target.value })}>{MATERIAL_UNITS.map(u => <option value={u} key={u}>per {u}</option>)}</select></label>
        <label className="field"><span>MOQ</span><input type="number" min={0} value={draft.moq} onChange={e => setDraft({ ...draft, moq: e.target.value === '' ? '' : Number(e.target.value) })} /></label>
        <label className="field"><span>Lead time (hari)</span><input type="number" min={0} value={draft.lead_time_days} onChange={e => setDraft({ ...draft, lead_time_days: e.target.value === '' ? '' : Number(e.target.value) })} /></label>
        {error && <div className="form-error field-wide">{error}</div>}
        <button type="submit" className="button button-secondary" disabled={link.isPending || !availableSuppliers.length}><Plus size={16} /> {link.isPending ? 'Menautkan…' : 'Tautkan supplier'}</button>
      </form>
    </div>
  );
}

export function MaterialFormPanel({ material, onClose }: { material?: MasterMaterial; onClose: () => void }) {
  const create = useCreateMasterMaterial();
  const update = useUpdateMasterMaterial();
  const [form, setForm] = useState<MasterMaterialDraft>(material ? {
    name: material.name, category: material.category, composition: material.composition ?? '',
    gsm: material.gsm ?? '', width_cm: material.width_cm ?? '', unit: material.unit,
    characteristics: material.characteristics ?? '', care_notes: material.care_notes ?? '',
  } : emptyMaterial());
  const [error, setError] = useState<string | null>(null);
  const pending = create.isPending || update.isPending;
  const ready = Boolean(form.name.trim() && form.category.trim());

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    setError(null);
    try {
      if (material) await update.mutateAsync({ id: material.id, input: form });
      else await create.mutateAsync(form);
      onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Material belum dapat disimpan.'); }
  }

  return (
    <section className="content-card edit-project-card">
      <div className="section-head"><div><span className="eyebrow">Master material</span><h3>{material ? 'Ubah material' : 'Tambah material baru'}</h3></div><button type="button" className="icon-button" onClick={onClose} aria-label="Tutup"><X size={18} /></button></div>
      <form onSubmit={submit}>
        <div className="field-grid">
          <label className="field field-wide"><span>Nama material *</span><input required placeholder="Cotton Combed 24s" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label className="field"><span>Kategori *</span><input required list="material-categories" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /><datalist id="material-categories">{MATERIAL_CATEGORIES.map(c => <option value={c} key={c} />)}</datalist></label>
          <label className="field"><span>Komposisi</span><input placeholder="100% Cotton" value={form.composition} onChange={e => setForm({ ...form, composition: e.target.value })} /></label>
          <label className="field"><span>GSM</span><input type="number" min={0} value={form.gsm} onChange={e => setForm({ ...form, gsm: e.target.value === '' ? '' : Number(e.target.value) })} /></label>
          <label className="field"><span>Lebar (cm)</span><input type="number" min={0} value={form.width_cm} onChange={e => setForm({ ...form, width_cm: e.target.value === '' ? '' : Number(e.target.value) })} /></label>
          <label className="field"><span>Satuan konsumsi *</span><select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>{MATERIAL_UNITS.map(u => <option value={u} key={u}>{u}</option>)}</select></label>
          <label className="field field-wide"><span>Karakteristik</span><textarea rows={2} placeholder="Tekstur, jatuh kain, ketebalan…" value={form.characteristics} onChange={e => setForm({ ...form, characteristics: e.target.value })} /></label>
          <label className="field field-wide"><span>Catatan perawatan</span><textarea rows={2} placeholder="Cara cuci, setrika, penyimpanan…" value={form.care_notes} onChange={e => setForm({ ...form, care_notes: e.target.value })} /></label>
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="edit-project-actions">
          <button type="button" className="button button-secondary" onClick={onClose}>Batal</button>
          <button type="submit" className="button button-primary" disabled={!ready || pending}><Save size={17} /> {pending ? 'Menyimpan…' : 'Simpan material'}</button>
        </div>
      </form>
      {material && <MaterialSupplierLinks materialId={material.id} />}
    </section>
  );
}

function emptySupplier(): MasterSupplierDraft {
  return { name: '', category: '', contact_name: '', phone: '', city: '', address: '', lead_time_days: '', minimum_order_notes: '', quality_notes: '' };
}

export function SupplierFormPanel({ supplier, onClose }: { supplier?: MasterSupplier; onClose: () => void }) {
  const create = useCreateMasterSupplier();
  const update = useUpdateMasterSupplier();
  const [form, setForm] = useState<MasterSupplierDraft>(supplier ? {
    name: supplier.name, category: supplier.category ?? '', contact_name: supplier.contact_name ?? '',
    phone: supplier.phone ?? '', city: supplier.city ?? '', address: supplier.address ?? '',
    lead_time_days: supplier.lead_time_days ?? '', minimum_order_notes: supplier.minimum_order_notes ?? '',
    quality_notes: supplier.quality_notes ?? '',
  } : emptySupplier());
  const [error, setError] = useState<string | null>(null);
  const pending = create.isPending || update.isPending;
  const ready = Boolean(form.name.trim());

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    setError(null);
    try {
      if (supplier) await update.mutateAsync({ id: supplier.id, input: form });
      else await create.mutateAsync(form);
      onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Supplier belum dapat disimpan.'); }
  }

  return (
    <section className="content-card edit-project-card">
      <div className="section-head"><div><span className="eyebrow">Master supplier</span><h3>{supplier ? 'Ubah supplier' : 'Tambah supplier baru'}</h3></div><button type="button" className="icon-button" onClick={onClose} aria-label="Tutup"><X size={18} /></button></div>
      <form onSubmit={submit}>
        <div className="field-grid">
          <label className="field field-wide"><span>Nama supplier *</span><input required placeholder="CV Tekstil Nusantara" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label className="field"><span>Kategori</span><input placeholder="Kain, aksesori, jasa…" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></label>
          <label className="field"><span>Kontak person</span><input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} /></label>
          <label className="field"><span>Telepon</span><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
          <label className="field"><span>Kota</span><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></label>
          <label className="field"><span>Lead time (hari)</span><input type="number" min={0} value={form.lead_time_days} onChange={e => setForm({ ...form, lead_time_days: e.target.value === '' ? '' : Number(e.target.value) })} /></label>
          <label className="field field-wide"><span>Alamat</span><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
          <label className="field field-wide"><span>Catatan minimum order</span><textarea rows={2} value={form.minimum_order_notes} onChange={e => setForm({ ...form, minimum_order_notes: e.target.value })} /></label>
          <label className="field field-wide"><span>Catatan kualitas</span><textarea rows={2} value={form.quality_notes} onChange={e => setForm({ ...form, quality_notes: e.target.value })} /></label>
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="edit-project-actions">
          <button type="button" className="button button-secondary" onClick={onClose}>Batal</button>
          <button type="submit" className="button button-primary" disabled={!ready || pending}><Save size={17} /> {pending ? 'Menyimpan…' : 'Simpan supplier'}</button>
        </div>
      </form>
    </section>
  );
}
