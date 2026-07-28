import { FormEvent, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, Factory, PackagePlus, Phone, Truck } from 'lucide-react';
import { useAddMaterial, useDeleteMaterial, useMasterMaterials, useMasterSuppliers, useSelectQuote, useUpdateStage } from '../hooks/useLaunch';
import { findOrCreateMasterMaterial, findOrCreateMasterSupplier } from '../data/launchRepository';
import { DeleteButton } from './DeleteButton';
import { BOM_COMPONENT_ROLES, bomRoleLabel } from '../domain/types';
import type { LaunchStage, MaterialSupplierDraft, ProjectWorkspace } from '../domain/types';

const MATERIAL_ROLES = BOM_COMPONENT_ROLES;
const UNITS = ['meter', 'yard', 'kg', 'gram', 'pcs', 'set', 'pasang', 'roll', 'lembar', 'lusin', 'box', 'liter'];
const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const emptyMaterial = (): MaterialSupplierDraft => ({
  proposed_name: '', role: 'MAIN_FABRIC', composition: '', gsm: '', width_cm: '', color_notes: '', estimated_consumption: '', unit: 'meter',
  suitability_notes: '', risk_notes: '', supplier_name: '', supplier_role: 'PRIMARY', contact_name: '', phone: '', city: '', address: '',
  unit_price: '', price_unit: 'meter', moq: '', moq_notes: '', lead_time_days: '', supplier_notes: '',
});

function numberValue(value: string): number | '' { return value === '' ? '' : Number(value); }

interface SourcingPanelProps {
  projectId: string;
  stage?: LaunchStage;
  materials: ProjectWorkspace['materials'];
  onBack: () => void;
}

export function SourcingPanel({ projectId, stage, materials, onBack }: SourcingPanelProps) {
  const addMaterial = useAddMaterial(projectId);
  const deleteMaterial = useDeleteMaterial(projectId);
  const selectQuote = useSelectQuote(projectId);
  const updateStageMutation = useUpdateStage(projectId);
  const masterMaterials = useMasterMaterials();
  const masterSuppliers = useMasterSuppliers();
  const [draft, setDraft] = useState<MaterialSupplierDraft>(emptyMaterial());
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageError, setStageError] = useState<string | null>(null);

  const hasSelected = materials.some(item => item.quotes?.some(quote => quote.status === 'SELECTED'));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!draft.proposed_name.trim()) { setError('Nama bahan wajib diisi.'); return; }
    try {
      await addMaterial.mutateAsync(draft);
      // Kandidat baru yang diketik manual (bukan dipilih dari datalist) langsung
      // tersimpan ke data master; kegagalan di sini tidak menahan alur sourcing.
      await Promise.allSettled([
        findOrCreateMasterMaterial({ name: draft.proposed_name, category: draft.role, composition: draft.composition, gsm: draft.gsm, width_cm: draft.width_cm, unit: draft.unit }),
        draft.supplier_name?.trim() ? findOrCreateMasterSupplier({ name: draft.supplier_name, contact_name: draft.contact_name, phone: draft.phone, city: draft.city, address: draft.address, lead_time_days: draft.lead_time_days }) : Promise.resolve(),
      ]);
      setDraft(emptyMaterial()); setShowForm(false);
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Kandidat bahan belum dapat disimpan.'); }
  }

  async function completeStage() {
    if (!stage) return;
    setStageError(null);
    try { await updateStageMutation.mutateAsync({ stageId: stage.id, status: 'COMPLETED' }); }
    catch (reason) { setStageError(reason instanceof Error ? reason.message : 'Gate sourcing belum lengkap.'); }
  }

  function update(patch: Partial<MaterialSupplierDraft>) { setDraft(current => ({ ...current, ...patch })); }

  return (
    <div className="workstream-panel">
      <button className="back-link" onClick={onBack}><ArrowLeft size={18} /> Kembali ke ruang kerja</button>
      <div className="section-head"><div><span className="eyebrow">Tahap 03 · Bahan & supplier</span><h3>Validasi bahan, harga, dan supplier terpilih</h3><p>Bandingkan kandidat bahan beserta penawaran supplier, lalu kunci satu penawaran per bahan sebagai pilihan resmi.</p></div></div>

      <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Kandidat terkumpul</span><h3>{materials.length} bahan</h3></div><button type="button" className="button button-secondary" onClick={() => setShowForm(value => !value)}><PackagePlus size={17} /> {showForm ? 'Tutup form' : 'Tambah kandidat'}</button></div>
        {materials.length ? <div className="sourcing-list">{materials.map(item => {
          const selected = item.quotes?.find(quote => quote.status === 'SELECTED');
          return <article key={item.id} className={`sourcing-card ${selected ? 'sourcing-locked' : ''}`}>
            <div className="sourcing-card-head"><span className="material-role">{bomRoleLabel(item.role)}</span><div><b>{item.proposed_name}</b><small>{[item.composition, item.gsm ? `${item.gsm} GSM` : null, item.width_cm ? `lebar ${item.width_cm} cm` : null].filter(Boolean).join(' · ') || 'Spesifikasi belum lengkap'}</small></div>{selected && <span className="sourcing-badge"><Check size={13} /> Terkunci</span>}<DeleteButton label={`bahan ${item.proposed_name}`} pending={deleteMaterial.isPending} onConfirm={() => deleteMaterial.mutate(item.id)} /></div>
            {item.quotes?.length ? <div className="quote-list">{item.quotes.map(quote => <div className={`quote-row ${quote.status === 'SELECTED' ? 'quote-selected' : ''}`} key={quote.id}>
              <div><small>{quote.supplier_role === 'PRIMARY' ? 'Supplier utama' : 'Supplier alternatif'}</small><b>{quote.supplier?.name ?? 'Supplier belum diberi nama'}</b>{quote.supplier?.phone && <a href={`tel:${quote.supplier.phone}`}><Phone size={12} /> {quote.supplier.phone}</a>}</div>
              <div><small>Harga</small><b>{money.format(quote.price)} / {quote.unit}</b><span>{quote.lead_time_days ? `${quote.lead_time_days} hari` : 'Lead time belum ada'}{quote.moq ? ` · MOQ ${quote.moq}` : ''}</span></div>
              <button type="button" className={`button ${quote.status === 'SELECTED' ? 'button-secondary' : 'button-primary'}`} disabled={quote.status === 'SELECTED' || selectQuote.isPending} onClick={() => selectQuote.mutate({ quoteId: quote.id, materialId: item.id })}>{quote.status === 'SELECTED' ? 'Terpilih' : 'Pilih supplier ini'}</button>
            </div>)}</div> : <p className="quote-empty">Belum ada penawaran supplier untuk bahan ini.</p>}
          </article>;
        })}</div> : <div className="state-panel state-empty"><Factory size={28} /><h3>Belum ada kandidat bahan</h3><p>Tambahkan bahan beserta penawaran supplier untuk membuka gate sourcing.</p></div>}
      </section>

      {showForm && <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Kandidat baru</span><h3>Bahan & penawaran supplier</h3></div></div>
        <datalist id="master-material-names">{masterMaterials.data?.map(m => <option value={m.name} key={m.id} />)}</datalist>
        <datalist id="master-supplier-names">{masterSuppliers.data?.map(s => <option value={s.name} key={s.id} />)}</datalist>
        <form onSubmit={submit}>
          <div className="field-grid">
            <label className="field field-wide"><span>Nama bahan/komponen *</span><input required list="master-material-names" placeholder="Pilih dari daftar atau ketik nama baru" value={draft.proposed_name} onChange={e => { const value = e.target.value; const match = masterMaterials.data?.find(m => m.name.toLowerCase() === value.toLowerCase()); update(match ? { proposed_name: value, composition: match.composition ?? draft.composition, gsm: match.gsm ?? draft.gsm, width_cm: match.width_cm ?? draft.width_cm, unit: match.unit } : { proposed_name: value }); }} /></label>
            <label className="field"><span>Peran bahan</span><select value={draft.role} onChange={e => update({ role: e.target.value as MaterialSupplierDraft['role'] })}>{MATERIAL_ROLES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label className="field"><span>Komposisi</span><input placeholder="100% nylon" value={draft.composition} onChange={e => update({ composition: e.target.value })} /></label>
            <label className="field"><span>GSM</span><input type="number" min="0" value={draft.gsm} onChange={e => update({ gsm: numberValue(e.target.value) })} /></label>
            <label className="field"><span>Lebar bahan (cm)</span><input type="number" min="0" value={draft.width_cm} onChange={e => update({ width_cm: numberValue(e.target.value) })} /></label>
            <label className="field"><span>Konsumsi produksi</span><div className="joined-input"><input type="number" min="0" step="0.01" value={draft.estimated_consumption} onChange={e => update({ estimated_consumption: numberValue(e.target.value) })} /><select value={draft.unit} onChange={e => update({ unit: e.target.value })}>{UNITS.map(unit => <option value={unit} key={unit}>{unit}</option>)}</select></div></label>
            <label className="field"><span>Peran supplier</span><select value={draft.supplier_role} onChange={e => update({ supplier_role: e.target.value as MaterialSupplierDraft['supplier_role'] })}><option value="PRIMARY">Utama</option><option value="ALTERNATIVE">Alternatif</option></select></label>
          </div>
          <div className="supplier-divider"><Truck size={17} /><span>Data supplier</span></div>
          <div className="field-grid">
            <label className="field field-wide"><span>Nama supplier</span><input list="master-supplier-names" placeholder="Pilih dari daftar atau ketik nama baru" value={draft.supplier_name} onChange={e => { const value = e.target.value; const match = masterSuppliers.data?.find(s => s.name.toLowerCase() === value.toLowerCase()); update(match ? { supplier_name: value, contact_name: match.contact_name ?? draft.contact_name, phone: match.phone ?? draft.phone, city: match.city ?? draft.city, address: match.address ?? draft.address, lead_time_days: match.lead_time_days ?? draft.lead_time_days } : { supplier_name: value }); }} /></label>
            <label className="field"><span>Kontak person</span><input value={draft.contact_name} onChange={e => update({ contact_name: e.target.value })} /></label>
            <label className="field"><span>WhatsApp/telepon</span><input inputMode="tel" placeholder="08…" value={draft.phone} onChange={e => update({ phone: e.target.value })} /></label>
            <label className="field"><span>Kota</span><input value={draft.city} onChange={e => update({ city: e.target.value })} /></label>
            <label className="field"><span>Harga beli supplier</span><div className="joined-input"><input type="number" min="0" placeholder="0" value={draft.unit_price} onChange={e => update({ unit_price: numberValue(e.target.value) })} /><select value={draft.price_unit} onChange={e => update({ price_unit: e.target.value })}>{UNITS.map(unit => <option value={unit} key={unit}>per {unit}</option>)}</select></div></label>
            <label className="field"><span>MOQ</span><input type="number" min="0" value={draft.moq} onChange={e => update({ moq: numberValue(e.target.value) })} /></label>
            <label className="field"><span>Lead time (hari)</span><input type="number" min="0" value={draft.lead_time_days} onChange={e => update({ lead_time_days: numberValue(e.target.value) })} /></label>
            <label className="field field-wide"><span>Catatan supplier</span><input placeholder="Kualitas, cara pemesanan, risiko, masa berlaku harga…" value={draft.supplier_notes} onChange={e => update({ supplier_notes: e.target.value })} /></label>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="edit-project-actions"><button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Batal</button><button type="submit" className="button button-primary" disabled={addMaterial.isPending}>{addMaterial.isPending ? 'Menyimpan…' : 'Simpan kandidat'}</button></div>
        </form>
      </section>}

      {stage && stage.status !== 'COMPLETED' && <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Gate tahap</span><h3>Tandai sourcing selesai</h3></div></div>
        <div className="gate-list"><div className={hasSelected ? 'done' : ''}><span>{hasSelected ? <Check size={15} /> : <Factory size={16} />}</span><b>Supplier terpilih</b><small>{hasSelected ? 'Minimal satu penawaran dikunci' : 'Belum ada penawaran yang dipilih'}</small></div></div>
        {stageError && <div className="form-error"><AlertCircle size={16} /> {stageError}</div>}
        <button className="button button-primary" disabled={!hasSelected || updateStageMutation.isPending} onClick={completeStage}>{updateStageMutation.isPending ? 'Memproses…' : 'Tandai sourcing selesai'}</button>
      </section>}
    </div>
  );
}
