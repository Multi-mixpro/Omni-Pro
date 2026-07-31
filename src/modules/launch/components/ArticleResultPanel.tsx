import { CalendarDays, Check, CircleDollarSign, Factory, Layers3, Megaphone, PackageCheck, Palette, Ruler, Shirt, Truck } from 'lucide-react';
import { bomRoleLabel } from '../domain/types';
import type { ProjectWorkspace } from '../domain/types';

const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('id-ID');
const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

function displayDate(value?: string | null) {
  return value ? date.format(new Date(`${value}T00:00:00`)) : 'Belum ditentukan';
}

export function ArticleResultPanel({ workspace }: { workspace: ProjectWorkspace }) {
  const { project, materials, colorways, variantMatrix, sizeCharts, hpp, samples, qc, productionBatches, releasePlan } = workspace;
  const finalHpp = hpp.find(item => item.status === 'FINAL') ?? hpp[0];
  const finalChart = sizeCharts.find(item => item.status === 'FINAL') ?? sizeCharts[0];
  const masterSample = samples.find(item => item.is_master) ?? samples[0];
  const passedQc = qc.find(item => item.result === 'PASS');
  const selectedMaterialCount = materials.filter(item => item.quotes?.some(quote => quote.status === 'SELECTED')).length;
  const totalVariantQuantity = variantMatrix.reduce((total, row) => total + (row.min_quantity ?? 0), 0);
  const variantBudget = variantMatrix.reduce((total, row) => total + (row.min_quantity ?? 0) * (row.unit_cost ?? finalHpp?.total_hpp ?? 0), 0);
  const produced = productionBatches.reduce((total, batch) => total + batch.quantity_passed, 0);
  const releaseChecks = releasePlan ? Object.values(releasePlan.readiness_checks) : [];
  const releaseReadiness = releaseChecks.length ? Math.round((releaseChecks.filter(Boolean).length / releaseChecks.length) * 100) : 0;

  const gates = [
    { label: 'Supplier terkunci', done: selectedMaterialCount > 0, detail: `${selectedMaterialCount}/${materials.length} material` },
    { label: 'Master sample', done: Boolean(masterSample?.is_master), detail: masterSample ? `V${masterSample.version}` : 'Belum ada' },
    { label: 'HPP final', done: finalHpp?.status === 'FINAL', detail: finalHpp ? money.format(finalHpp.total_hpp) : 'Belum dihitung' },
    { label: 'Size chart final', done: finalChart?.status === 'FINAL', detail: finalChart?.name ?? 'Belum ada' },
    { label: 'QC lolos', done: Boolean(passedQc), detail: passedQc ? 'PASS' : 'Belum lolos' },
    { label: 'Approval produksi', done: workspace.approvals.some(item => item.approval_type === 'PRODUCTION' && item.status === 'APPROVED'), detail: workspace.approvals[0]?.status ?? 'Belum diajukan' },
  ];

  return (
    <div className="article-result">
      <section className="result-command-card">
        <div><span className="eyebrow">Result artikel</span><h3>{project.article_name}</h3><p>Ringkasan hasil keputusan dan data kerja terkini. Informasi di bawah selalu mengikuti perubahan pada Workspace.</p></div>
        <div className="result-dates"><span><CalendarDays size={16} /><small>Fix artikel</small><b>{displayDate(project.target_fix_date)}</b></span><span><Factory size={16} /><small>Produk selesai</small><b>{displayDate(project.target_date)}</b></span><span><Megaphone size={16} /><small>Rilis</small><b>{displayDate(project.target_launch_date)}</b></span></div>
      </section>

      <section className="result-metric-grid">
        <div><Layers3 size={19} /><span><small>BOM material</small><b>{materials.length}</b><em>{selectedMaterialCount} supplier dipilih</em></span></div>
        <div><Palette size={19} /><span><small>Varian</small><b>{colorways.length} warna</b><em>{variantMatrix.length} kombinasi SKU</em></span></div>
        <div><CircleDollarSign size={19} /><span><small>HPP acuan</small><b>{finalHpp ? money.format(finalHpp.total_hpp) : '—'}</b><em>{finalHpp?.status ?? 'Belum dihitung'}</em></span></div>
        <div><Truck size={19} /><span><small>Produksi lolos</small><b>{number.format(produced)} pcs</b><em>{productionBatches.length} batch</em></span></div>
      </section>

      <div className="result-grid">
        <section className="content-card result-gates">
          <div className="section-head"><div><span className="eyebrow">Production readiness</span><h3>Gate kesiapan</h3></div><span className="count-badge">{gates.filter(item => item.done).length}/{gates.length}</span></div>
          <div>{gates.map(item => <article className={item.done ? 'done' : ''} key={item.label}><span>{item.done && <Check size={14} />}</span><div><b>{item.label}</b><small>{item.detail}</small></div></article>)}</div>
        </section>

        <section className="content-card">
          <div className="section-head"><div><span className="eyebrow">BOM terkini</span><h3>Material & supplier</h3></div></div>
          {materials.length ? <div className="result-bom-list">{materials.map(item => {
            const quote = item.quotes?.find(entry => entry.status === 'SELECTED') ?? item.quotes?.[0];
            return <article key={item.id}><span>{bomRoleLabel(item.role)}</span><div><b>{item.proposed_name}</b><small>{item.estimated_consumption ?? '—'} {item.unit} per produk</small></div><div><small>Supplier</small><b>{quote?.supplier?.name ?? 'Belum dipilih'}</b></div><div><small>Harga</small><b>{quote ? `${money.format(quote.price)}/${quote.unit}` : '—'}</b></div></article>;
          })}</div> : <p className="result-empty">BOM belum diisi.</p>}
        </section>

        <section className="content-card result-wide">
          <div className="section-head"><div><span className="eyebrow">Budget produksi</span><h3>Matriks warna × ukuran × stok</h3><p>{number.format(totalVariantQuantity)} unit rencana · estimasi modal {money.format(variantBudget)}</p></div></div>
          {variantMatrix.length ? <div className="result-variant-table"><table><thead><tr><th>Warna</th><th>Ukuran</th><th>SKU</th><th>Status</th><th>Jumlah</th><th>HPP/unit</th><th>Budget</th></tr></thead><tbody>{variantMatrix.map(row => {
            const color = colorways.find(item => item.id === row.colorway_id);
            const unitCost = row.unit_cost ?? finalHpp?.total_hpp ?? 0;
            return <tr key={row.id}><td><span className="result-color-dot" style={{ background: color?.hex_code ?? '#d8dce2' }} />{color?.name ?? 'Warna'}</td><td>{row.size}</td><td>{row.sku ?? '—'}</td><td>{row.status}</td><td>{number.format(row.min_quantity ?? 0)}</td><td>{money.format(unitCost)}</td><td>{money.format((row.min_quantity ?? 0) * unitCost)}</td></tr>;
          })}</tbody></table></div> : <p className="result-empty">Matriks varian belum dibuat.</p>}
        </section>

        <section className="content-card">
          <div className="section-head"><div><span className="eyebrow">Spesifikasi ukuran</span><h3>{finalChart?.name ?? 'Size chart'}</h3></div><Ruler size={20} /></div>
          {finalChart ? <><div className="result-size-pills">{finalChart.sizes.map(size => <span key={size}>{size}</span>)}</div><div className="result-spec-list"><span><small>Versi</small><b>V{finalChart.version}</b></span><span><small>Titik ukur</small><b>{finalChart.measurements.length}</b></span><span><small>Satuan</small><b>{finalChart.unit}</b></span><span><small>Status</small><b>{finalChart.status}</b></span></div></> : <p className="result-empty">Size chart belum tersedia.</p>}
        </section>

        <section className="content-card">
          <div className="section-head"><div><span className="eyebrow">Sample & kualitas</span><h3>Validasi produk</h3></div><PackageCheck size={20} /></div>
          <div className="result-quality">
            <div><Shirt size={18} /><span><small>Master sample</small><b>{masterSample ? `V${masterSample.version} · ${masterSample.status}` : 'Belum ada'}</b></span></div>
            <div><PackageCheck size={18} /><span><small>Hasil QC</small><b>{qc[0]?.result ?? 'Belum diperiksa'}</b></span></div>
            <p>{qc[0]?.summary || masterSample?.revision_notes || 'Catatan validasi belum tersedia.'}</p>
          </div>
        </section>

        <section className="content-card result-wide result-release">
          <div className="section-head"><div><span className="eyebrow">Launch readiness</span><h3>Persiapan rilis</h3></div><span className="result-release-score">{releaseReadiness}%</span></div>
          <div className="result-release-grid"><div><small>Nama final</small><b>{releasePlan?.final_product_name ?? 'Belum ditentukan'}</b></div><div><small>Harga retail</small><b>{releasePlan?.retail_price ? money.format(releasePlan.retail_price) : 'Belum ditentukan'}</b></div><div><small>Status</small><b>{releasePlan?.status.replace(/_/g, ' ') ?? 'Belum dimulai'}</b></div><div><small>Tanggal rilis</small><b>{displayDate(releasePlan?.launch_date ?? project.target_launch_date)}</b></div></div>
        </section>
      </div>
    </div>
  );
}
