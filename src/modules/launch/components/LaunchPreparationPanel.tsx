import { FormEvent, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Check, ExternalLink, Megaphone, Save } from 'lucide-react';
import { useSaveReleasePlan } from '../hooks/useLaunch';
import type { ReleasePlan, ReleasePlanDraft, ReleasePlanStatus } from '../domain/types';

const STATUS_LABELS: Record<ReleasePlanStatus, string> = {
  NOT_STARTED: 'Belum dimulai',
  IN_PREPARATION: 'Dalam persiapan',
  WAITING_PRODUCT: 'Menunggu produk',
  READY: 'Siap rilis',
  PUBLISHED: 'Sudah tayang',
};

const READINESS_ITEMS = [
  ['final_name', 'Nama produk final', 'Nama siap dipakai pada katalog dan promosi'],
  ['price', 'Harga jual', 'Harga retail telah disetujui'],
  ['sku_stock', 'SKU dan stok awal', 'Varian memiliki SKU dan stok siap jual'],
  ['product_photo', 'Foto produk', 'Foto utama, detail, dan foto model tersedia'],
  ['description', 'Deskripsi & selling points', 'Konten katalog telah ditinjau'],
  ['size_guide', 'Panduan ukuran', 'Size guide final tersedia untuk pelanggan'],
  ['qc_passed', 'QC produksi', 'Produk yang akan dijual telah lolos QC'],
  ['channels_ready', 'Kanal penjualan', 'Marketplace atau website siap menerima order'],
  ['campaign_ready', 'Materi kampanye', 'Konten dan jadwal promosi telah disiapkan'],
] as const;

function initialDraft(projectName: string, targetLaunchDate: string | null, releasePlan: ReleasePlan | null): ReleasePlanDraft {
  return {
    final_product_name: releasePlan?.final_product_name ?? projectName,
    product_description: releasePlan?.product_description ?? '',
    selling_points: releasePlan?.selling_points ?? '',
    retail_price: releasePlan?.retail_price ?? '',
    marketing_start_date: releasePlan?.marketing_start_date ?? '',
    launch_date: releasePlan?.launch_date ?? targetLaunchDate ?? '',
    channel_links: {
      marketplace: releasePlan?.channel_links.marketplace ?? '',
      website: releasePlan?.channel_links.website ?? '',
      social: releasePlan?.channel_links.social ?? '',
    },
    readiness_checks: Object.fromEntries(READINESS_ITEMS.map(([key]) => [key, releasePlan?.readiness_checks[key] ?? false])),
    status: releasePlan?.status ?? 'NOT_STARTED',
  };
}

export function LaunchPreparationPanel({
  projectId,
  projectName,
  targetLaunchDate,
  releasePlan,
  onBack,
}: {
  projectId: string;
  projectName: string;
  targetLaunchDate: string | null;
  releasePlan: ReleasePlan | null;
  onBack: () => void;
}) {
  const save = useSaveReleasePlan(projectId);
  const [draft, setDraft] = useState<ReleasePlanDraft>(() => initialDraft(projectName, targetLaunchDate, releasePlan));
  const [error, setError] = useState<string | null>(null);
  const readiness = useMemo(() => {
    const done = READINESS_ITEMS.filter(([key]) => draft.readiness_checks[key]).length;
    return Math.round((done / READINESS_ITEMS.length) * 100);
  }, [draft.readiness_checks]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await save.mutateAsync(draft);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Rencana rilis belum dapat disimpan.');
    }
  }

  function toggleCheck(key: string) {
    setDraft(current => ({
      ...current,
      readiness_checks: { ...current.readiness_checks, [key]: !current.readiness_checks[key] },
    }));
  }

  function setChannel(key: string, value: string) {
    setDraft(current => ({ ...current, channel_links: { ...current.channel_links, [key]: value } }));
  }

  return (
    <div className="workstream-panel">
      <button className="back-link" onClick={onBack}><ArrowLeft size={18} /> Kembali ke workspace</button>
      <div className="section-head">
        <div><span className="eyebrow">Persiapan peluncuran</span><h3>Siapkan produk untuk masuk pasar</h3><p>Produksi dan persiapan pemasaran dapat berjalan paralel tanpa kehilangan kontrol kesiapan.</p></div>
      </div>

      <form onSubmit={submit} className="release-layout">
        <div className="release-main">
          <section className="content-card">
            <div className="section-head"><div><span className="eyebrow">Identitas komersial</span><h3>Konten dan harga produk</h3></div></div>
            <div className="field-grid">
              <label className="field field-wide"><span>Nama produk final</span><input value={draft.final_product_name} onChange={event => setDraft({ ...draft, final_product_name: event.target.value })} /></label>
              <label className="field field-wide"><span>Deskripsi produk</span><textarea rows={4} placeholder="Kegunaan, material utama, karakter produk, dan detail penting…" value={draft.product_description} onChange={event => setDraft({ ...draft, product_description: event.target.value })} /></label>
              <label className="field field-wide"><span>Selling points</span><textarea rows={3} placeholder="Satu poin per baris: ringan, tahan angin, mudah dirawat…" value={draft.selling_points} onChange={event => setDraft({ ...draft, selling_points: event.target.value })} /></label>
              <label className="field"><span>Harga retail</span><input type="number" min={0} placeholder="0" value={draft.retail_price} onChange={event => setDraft({ ...draft, retail_price: event.target.value === '' ? '' : Number(event.target.value) })} /></label>
              <label className="field"><span>Status persiapan</span><select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as ReleasePlanStatus })}>{Object.entries(STATUS_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
              <label className="field"><span>Mulai pemasaran</span><input type="date" value={draft.marketing_start_date} onChange={event => setDraft({ ...draft, marketing_start_date: event.target.value })} /></label>
              <label className="field"><span>Tanggal rilis</span><input type="date" value={draft.launch_date} onChange={event => setDraft({ ...draft, launch_date: event.target.value })} /></label>
            </div>
          </section>

          <section className="content-card">
            <div className="section-head"><div><span className="eyebrow">Kanal penjualan</span><h3>Tautan publikasi</h3></div></div>
            <div className="release-channel-list">
              {([
                ['marketplace', 'Marketplace', 'https://…/produk'],
                ['website', 'Website', 'https://…/products/…'],
                ['social', 'Media sosial', 'https://instagram.com/…'],
              ] as const).map(([key, label, placeholder]) => <label className="field" key={key}><span>{label}</span><div className="release-link-input"><ExternalLink size={16} /><input type="url" placeholder={placeholder} value={draft.channel_links[key] ?? ''} onChange={event => setChannel(key, event.target.value)} /></div></label>)}
            </div>
          </section>
        </div>

        <aside className="content-card release-readiness">
          <div className="release-score">
            <div className="release-score-ring" style={{ '--release-score': `${readiness * 3.6}deg` } as React.CSSProperties}><span>{readiness}%</span></div>
            <div><span className="eyebrow">Kesiapan rilis</span><h3>{readiness === 100 ? 'Siap dipublikasikan' : 'Lengkapi kebutuhan rilis'}</h3><p>{READINESS_ITEMS.filter(([key]) => !draft.readiness_checks[key]).length} item masih perlu diselesaikan.</p></div>
          </div>
          <div className="release-checklist">
            {READINESS_ITEMS.map(([key, label, detail]) => <button type="button" className={draft.readiness_checks[key] ? 'done' : ''} onClick={() => toggleCheck(key)} key={key}><span>{draft.readiness_checks[key] ? <Check size={14} /> : null}</span><div><b>{label}</b><small>{detail}</small></div></button>)}
          </div>
          <div className="release-next-date"><CalendarDays size={18} /><span><small>Target rilis</small><b>{draft.launch_date || 'Belum ditentukan'}</b></span></div>
          {error && <div className="form-error">{error}</div>}
          <button className="button button-primary release-save" disabled={save.isPending}><Save size={17} /> {save.isPending ? 'Menyimpan…' : 'Simpan persiapan rilis'}</button>
          {readiness === 100 && <div className="release-ready-note"><Megaphone size={17} /> Semua gate rilis telah ditandai lengkap.</div>}
        </aside>
      </form>
    </div>
  );
}
