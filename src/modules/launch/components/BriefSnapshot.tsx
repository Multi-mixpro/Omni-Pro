import { BookOpen, CircleDollarSign, ExternalLink, Factory, FileImage, ImageOff, Palette, Phone, Ruler } from 'lucide-react';
import { SafeImage } from './SafeImage';
import type { ProjectWorkspace } from '../domain/types';

const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export function BriefSnapshot({ references, materials, colorways, sizeCharts, hpp }: Pick<ProjectWorkspace, 'references' | 'materials' | 'colorways' | 'sizeCharts' | 'hpp'>) {
  const imageReferences = references.filter(item => item.image_url);
  const learningLinks = references.filter(item => item.source_url);
  const latestHpp = hpp[0];
  const sizes = sizeCharts[0]?.sizes ?? [];

  return (
    <section className="brief-snapshot">
      <div className="section-head"><div><span className="eyebrow">Brief awal owner</span><h3>Konteks kerja yang sudah dikumpulkan</h3></div><span className="brief-draft-badge">Draft · Perlu validasi tim</span></div>
      <div className="brief-snapshot-metrics"><div><FileImage size={18} /><span><b>{imageReferences.length}</b><small>gambar</small></span></div><div><BookOpen size={18} /><span><b>{learningLinks.length}</b><small>link riset</small></span></div><div><Factory size={18} /><span><b>{materials.length}</b><small>material</small></span></div><div><Palette size={18} /><span><b>{colorways.length}</b><small>warna</small></span></div><div><Ruler size={18} /><span><b>{sizes.length}</b><small>ukuran</small></span></div><div><CircleDollarSign size={18} /><span><b>{latestHpp ? money.format(latestHpp.total_hpp) : '—'}</b><small>HPP awal</small></span></div></div>

      {(imageReferences.length > 0 || learningLinks.length > 0) && <div className="brief-snapshot-block"><div className="brief-snapshot-title"><FileImage size={17} /><b>Referensi visual & sumber belajar</b></div>{imageReferences.length > 0 && <div className="snapshot-gallery">{imageReferences.map(item => <a href={item.source_url || item.image_url || '#'} target="_blank" rel="noreferrer" key={item.id}><SafeImage src={item.image_url} alt={item.title} fallback={<span className="image-fallback"><ImageOff size={20} /><small>Gambar tidak dapat dimuat</small></span>} /><span>{item.is_primary && <small>Cover</small>}<b>{item.title}</b></span></a>)}</div>}{learningLinks.length > 0 && <div className="snapshot-links">{learningLinks.map(item => <a href={item.source_url || '#'} target="_blank" rel="noreferrer" key={item.id}><span><small>{item.reference_type}</small><b>{item.title}</b><p>{item.insight || 'Buka sumber untuk dipelajari tim.'}</p></span><ExternalLink size={17} /></a>)}</div>}</div>}

      {materials.length > 0 && <div className="brief-snapshot-block"><div className="brief-snapshot-title"><Factory size={17} /><b>Material & kandidat supplier</b></div><div className="snapshot-materials">{materials.map(item => { const quote = item.quotes?.[0]; return <article key={item.id}><span className="material-role">{item.role}</span><div><h4>{item.proposed_name}</h4><p>{[item.composition, item.gsm ? `${item.gsm} GSM` : null, item.width_cm ? `lebar ${item.width_cm} cm` : null].filter(Boolean).join(' · ') || 'Spesifikasi perlu dilengkapi'}</p></div><div className="snapshot-supplier"><small>{quote?.supplier_role === 'PRIMARY' ? 'Supplier utama' : 'Supplier alternatif'}</small><b>{quote?.supplier?.name || 'Belum ditentukan'}</b>{quote?.supplier?.phone && <a href={`tel:${quote.supplier.phone}`}><Phone size={12} /> {quote.supplier.phone}</a>}</div><div className="snapshot-quote"><small>Harga awal</small><b>{quote ? `${money.format(quote.price)} / ${quote.unit}` : '—'}</b><span>{quote?.lead_time_days ? `${quote.lead_time_days} hari` : 'Lead time belum ada'}</span></div></article>; })}</div></div>}

      {(colorways.length > 0 || sizes.length > 0) && <div className="snapshot-spec-row"><div><div className="brief-snapshot-title"><Palette size={17} /><b>Kandidat warna</b></div><div className="snapshot-colors">{colorways.map(item => <span key={item.id}><i style={{ background: item.hex_code || '#d6dae1' }} /><b>{item.name}</b><small>{item.status}</small></span>)}</div></div><div><div className="brief-snapshot-title"><Ruler size={17} /><b>Rentang ukuran</b></div><div className="snapshot-sizes">{sizes.map(size => <span key={size}>{size}</span>)}</div></div></div>}
    </section>
  );
}
