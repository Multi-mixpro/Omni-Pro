import { FormEvent, useMemo, useState } from 'react';
import { Check, Plus, Ruler, Sparkles, Trash2 } from 'lucide-react';
import { useCreateSizeChart } from '../hooks/useLaunch';
import type { MeasurementDraft, ProjectWorkspace } from '../domain/types';
import { recommendSizeTemplate, SIZE_CHART_TEMPLATES } from '../domain/sizeChartTemplates';

const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'ONE SIZE'];

function makeRows(templateId: string): MeasurementDraft[] {
  const template = SIZE_CHART_TEMPLATES.find(item => item.id === templateId) ?? SIZE_CHART_TEMPLATES[0];
  return template.measurements.map((item, index) => ({
    point_code: item.code,
    point_name: item.name,
    position: index + 1,
    tolerance_plus: 1,
    tolerance_minus: 1,
    values: {},
  }));
}

export function SizeChartBuilder({ projectId, category, charts }: { projectId: string; category: string; charts: ProjectWorkspace['sizeCharts'] }) {
  const recommended = recommendSizeTemplate(category);
  const create = useCreateSizeChart(projectId);
  const [templateId, setTemplateId] = useState(recommended.id);
  const [sizes, setSizes] = useState<string[]>(recommended.defaultSizes);
  const [rows, setRows] = useState<MeasurementDraft[]>(() => makeRows(recommended.id));
  const [customSize, setCustomSize] = useState('');
  const [customPoint, setCustomPoint] = useState('');
  const [name, setName] = useState(`Size chart ${category || recommended.label}`);
  const [error, setError] = useState<string | null>(null);
  const nextVersion = useMemo(() => charts.reduce((max, chart) => Math.max(max, chart.version), 0) + 1, [charts]);

  function chooseTemplate(value: string) {
    const template = SIZE_CHART_TEMPLATES.find(item => item.id === value) ?? SIZE_CHART_TEMPLATES[0];
    setTemplateId(template.id);
    setRows(makeRows(template.id));
    setSizes(template.defaultSizes);
    setName(`Size chart ${template.label}`);
  }

  function toggleSize(size: string) {
    setSizes(current => current.includes(size) ? current.filter(item => item !== size) : [...current, size]);
  }

  function addSize() {
    const value = customSize.trim().toUpperCase();
    if (value && !sizes.includes(value)) setSizes(current => [...current, value]);
    setCustomSize('');
  }

  function addPoint() {
    const pointName = customPoint.trim();
    if (!pointName) return;
    setRows(current => [...current, {
      point_code: `C${String(current.length + 1).padStart(2, '0')}`,
      point_name: pointName,
      position: current.length + 1,
      tolerance_plus: 1,
      tolerance_minus: 1,
      values: {},
    }]);
    setCustomPoint('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!name.trim() || !sizes.length || !rows.length) {
      setError('Nama, minimal satu ukuran, dan satu titik ukur wajib tersedia.');
      return;
    }
    try {
      await create.mutateAsync({ name, unit: 'cm', sizes, measurements: rows, version: nextVersion });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Size chart belum dapat disimpan.');
    }
  }

  return (
    <details className="workspace-disclosure" open>
      <summary><span><Ruler size={18} /><b>Buat size chart dari template kategori</b><small>Rekomendasi otomatis, tetap dapat dikustom</small></span><span className="disclosure-state">Buka/tutup</span></summary>
      <form className="size-chart-builder" onSubmit={submit}>
        <div className="size-builder-toolbar">
          <label className="field"><span>Template kategori</span><select value={templateId} onChange={event => chooseTemplate(event.target.value)}>{SIZE_CHART_TEMPLATES.map(template => <option value={template.id} key={template.id}>{template.label}</option>)}</select></label>
          <label className="field"><span>Nama chart versi {nextVersion}</span><input value={name} onChange={event => setName(event.target.value)} /></label>
          <div className="template-recommendation"><Sparkles size={16} /><span>Rekomendasi untuk kategori <b>{category || 'artikel'}</b>: {recommended.label}</span></div>
        </div>

        <div className="size-builder-section">
          <div className="size-builder-title"><b>Ukuran yang diproduksi</b><small>Pilih preset atau tambahkan custom</small></div>
          <div className="size-builder-pills">{SIZE_PRESETS.map(size => <button type="button" className={sizes.includes(size) ? 'selected' : ''} onClick={() => toggleSize(size)} key={size}>{sizes.includes(size) && <Check size={13} />}{size}</button>)}</div>
          <div className="inline-add"><input value={customSize} placeholder="Ukuran custom" onChange={event => setCustomSize(event.target.value)} /><button type="button" onClick={addSize}><Plus size={16} /> Tambah</button></div>
        </div>

        <div className="size-builder-section">
          <div className="size-builder-title"><b>Titik ukur</b><small>{rows.length} variabel aktif dari template</small></div>
          <div className="measurement-chip-grid">{rows.map((row, index) => <button type="button" key={`${row.point_code}-${index}`} onClick={() => setRows(current => current.filter((_, rowIndex) => rowIndex !== index))}><Check size={12} /><span>{row.point_name}</span><Trash2 size={12} /></button>)}</div>
          <div className="inline-add"><input value={customPoint} placeholder="Tambah titik ukur custom" onChange={event => setCustomPoint(event.target.value)} /><button type="button" onClick={addPoint}><Plus size={16} /> Tambah variabel</button></div>
        </div>

        <div className="measurement-editor">
          <table>
            <thead><tr><th>Titik ukur</th>{sizes.map(size => <th key={size}>{size}</th>)}<th>Toleransi +/−</th></tr></thead>
            <tbody>{rows.map((row, rowIndex) => <tr key={`${row.point_code}-${rowIndex}`}>
              <td><input value={row.point_name} onChange={event => setRows(current => current.map((item, index) => index === rowIndex ? { ...item, point_name: event.target.value } : item))} /></td>
              {sizes.map(size => <td key={size}><input inputMode="decimal" placeholder="0" value={row.values[size] ?? ''} onChange={event => setRows(current => current.map((item, index) => index === rowIndex ? { ...item, values: { ...item.values, [size]: event.target.value === '' ? '' : Number(event.target.value) } } : item))} /></td>)}
              <td><div><input inputMode="decimal" value={row.tolerance_plus} onChange={event => setRows(current => current.map((item, index) => index === rowIndex ? { ...item, tolerance_plus: event.target.value === '' ? '' : Number(event.target.value) } : item))} /><span>/</span><input inputMode="decimal" value={row.tolerance_minus} onChange={event => setRows(current => current.map((item, index) => index === rowIndex ? { ...item, tolerance_minus: event.target.value === '' ? '' : Number(event.target.value) } : item))} /></div></td>
            </tr>)}</tbody>
          </table>
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="size-builder-actions"><span>Nilai masih draft dan dapat divalidasi saat fitting sampel.</span><button className="button button-primary" disabled={create.isPending}>{create.isPending ? 'Menyimpan…' : `Simpan size chart V${nextVersion}`}</button></div>
      </form>
    </details>
  );
}
