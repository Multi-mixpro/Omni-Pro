import { FormEvent, useState } from 'react';
import { AlertCircle, Save, X } from 'lucide-react';
import { useBusinessUnits, useUpdateProject } from '../hooks/useLaunch';
import type { LaunchProject, Priority, ProjectEditInput } from '../domain/types';

export function EditProjectPanel({ project, onClose }: { project: LaunchProject; onClose: () => void }) {
  const units = useBusinessUnits();
  const update = useUpdateProject(project.id);
  const [form, setForm] = useState<ProjectEditInput>({
    article_name: project.article_name,
    business_unit_id: project.business_unit_id,
    category: project.category,
    concept: project.concept ?? '',
    source_notes: project.source_notes ?? '',
    priority: project.priority,
    target_date: project.target_date ?? '',
    target_fix_date: project.target_fix_date ?? '',
    target_launch_date: project.target_launch_date ?? '',
  });
  const [error, setError] = useState<string | null>(null);

  const ready = Boolean(form.article_name.trim() && form.business_unit_id && form.category.trim());
  const milestones = [form.target_fix_date, form.target_date, form.target_launch_date].filter(Boolean) as string[];
  const dateConflict = milestones.some((value, index) => index > 0 && value < milestones[index - 1]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    setError(null);
    try { await update.mutateAsync(form); onClose(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Perubahan belum dapat disimpan.'); }
  }

  return (
    <section className="content-card edit-project-card">
      <div className="section-head"><div><span className="eyebrow">Ubah artikel</span><h3>Perbarui identitas & target</h3></div><button type="button" className="icon-button" onClick={onClose} aria-label="Tutup"><X size={18} /></button></div>
      <form onSubmit={submit}>
        <div className="field-grid">
          <label className="field field-wide"><span>Nama artikel *</span><input required value={form.article_name} onChange={e => setForm({ ...form, article_name: e.target.value })} /></label>
          <label className="field"><span>Unit bisnis *</span><select required value={form.business_unit_id} onChange={e => setForm({ ...form, business_unit_id: e.target.value })}>{units.data?.map(unit => <option value={unit.id} key={unit.id}>{unit.name}</option>)}</select></label>
          <label className="field"><span>Kategori *</span><input required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></label>
          <label className="field field-wide"><span>Konsep & tujuan artikel</span><textarea rows={3} value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })} /></label>
          <label className="field field-wide"><span>Arahan owner</span><textarea rows={2} value={form.source_notes} onChange={e => setForm({ ...form, source_notes: e.target.value })} /></label>
          <label className="field"><span>Prioritas</span><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}><option value="NORMAL">Normal</option><option value="HIGH">Tinggi</option><option value="URGENT">Mendesak</option></select></label>
          <label className="field"><span>Artikel / master sample fix</span><input type="date" value={form.target_fix_date} onChange={e => setForm({ ...form, target_fix_date: e.target.value })} /></label>
          <label className="field"><span>Siap produksi massal</span><input type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} /></label>
          <label className="field"><span>Target rilis produk</span><input type="date" value={form.target_launch_date} onChange={e => setForm({ ...form, target_launch_date: e.target.value })} /></label>
        </div>
        {dateConflict && <div className="milestone-warning"><AlertCircle size={16} /><span>Urutan tanggal belum logis: artikel fix, lalu siap produksi, lalu rilis.</span></div>}
        {error && <div className="form-error">{error}</div>}
        <div className="edit-project-actions">
          <button type="button" className="button button-secondary" onClick={onClose}>Batal</button>
          <button type="submit" className="button button-primary" disabled={!ready || update.isPending}><Save size={17} /> {update.isPending ? 'Menyimpan…' : 'Simpan perubahan'}</button>
        </div>
      </form>
    </section>
  );
}
