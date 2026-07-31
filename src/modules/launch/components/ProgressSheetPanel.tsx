import { FormEvent, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Flag, MessageSquareWarning, Plus, Send, Target } from 'lucide-react';
import { useAuth } from '@/core/auth/useAuth';
import { useAddProgressUpdate, useDeleteProgressUpdate } from '../hooks/useLaunch';
import { DeleteButton } from './DeleteButton';
import { STAGE_ORDER } from '../domain/types';
import type { ProgressUpdateDraft, ProjectWorkspace, StageCode } from '../domain/types';

const STAGE_LABELS: Record<StageCode, string> = {
  BRIEF: 'Brief',
  RESEARCH: 'Riset',
  SOURCING: 'Bahan & supplier',
  SAMPLING: 'Sampling',
  COSTING: 'HPP',
  SPECIFICATION: 'Warna & size',
  QC: 'QC',
  OWNER_APPROVAL: 'Approval owner',
  PRODUCTION_READY: 'Siap produksi',
};

const TYPE_LABELS = {
  TEAM_UPDATE: 'Update tim',
  OWNER_DIRECTION: 'Arahan owner',
  MILESTONE: 'Milestone',
  RISK: 'Risiko',
} as const;

const dateTime = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const emptyDraft = (stage: StageCode): ProgressUpdateDraft => ({
  stage_code: stage,
  update_type: 'TEAM_UPDATE',
  completed_text: '',
  current_text: '',
  blocker_text: '',
  decision_needed: '',
  next_step: '',
  forecast_finish: '',
  progress_percent: '',
});

function initials(name?: string | null) {
  return (name ?? 'GG').split(' ').map(value => value[0]).join('').slice(0, 2).toUpperCase();
}

export function ProgressSheetPanel({
  projectId,
  currentStage,
  updates,
}: {
  projectId: string;
  currentStage: StageCode;
  updates: ProjectWorkspace['progressUpdates'];
}) {
  const auth = useAuth();
  const add = useAddProgressUpdate(projectId);
  const remove = useDeleteProgressUpdate(projectId);
  const [showForm, setShowForm] = useState(updates.length === 0);
  const [draft, setDraft] = useState<ProgressUpdateDraft>(() => emptyDraft(currentStage));
  const [error, setError] = useState<string | null>(null);
  const canAdmin = auth.data?.permissions.includes('launch.admin') ?? false;
  const summary = useMemo(() => ({
    decisions: updates.filter(item => item.decision_needed).length,
    blockers: updates.filter(item => item.blocker_text).length,
    latestForecast: updates.find(item => item.forecast_finish)?.forecast_finish ?? null,
  }), [updates]);

  function update(patch: Partial<ProgressUpdateDraft>) {
    setDraft(current => ({ ...current, ...patch }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const hasContent = [draft.completed_text, draft.current_text, draft.blocker_text, draft.decision_needed, draft.next_step].some(value => value?.trim());
    if (!hasContent) { setError('Isi minimal satu bagian update progres.'); return; }
    setError(null);
    try {
      await add.mutateAsync(draft);
      setDraft(emptyDraft(currentStage));
      setShowForm(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Update progres belum dapat disimpan.');
    }
  }

  return (
    <div className="progress-sheet">
      <section className="progress-sheet-summary">
        <div><MessageSquareWarning size={19} /><span><small>Total update</small><b>{updates.length}</b></span></div>
        <div><Target size={19} /><span><small>Butuh keputusan</small><b>{summary.decisions}</b></span></div>
        <div><AlertTriangle size={19} /><span><small>Catatan hambatan</small><b>{summary.blockers}</b></span></div>
        <div><CalendarDays size={19} /><span><small>Forecast terbaru</small><b>{summary.latestForecast ?? '—'}</b></span></div>
      </section>

      <section className="content-card">
        <div className="section-head">
          <div><span className="eyebrow">Kolaborasi dua sisi</span><h3>Lembar progres artikel</h3><p>Owner memberi arah, tim melaporkan hasil, hambatan, keputusan, dan langkah berikutnya pada format yang sama.</p></div>
          <button type="button" className="button button-primary" onClick={() => setShowForm(value => !value)}><Plus size={16} /> {showForm ? 'Tutup form' : 'Tambah update'}</button>
        </div>

        {showForm && <form className="progress-update-form" onSubmit={submit}>
          <div className="progress-update-meta">
            <label className="field"><span>Jenis update</span><select value={draft.update_type} onChange={event => update({ update_type: event.target.value as ProgressUpdateDraft['update_type'] })}>{Object.entries(TYPE_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label className="field"><span>Tahap terkait</span><select value={draft.stage_code} onChange={event => update({ stage_code: event.target.value as StageCode })}>{STAGE_ORDER.map(stage => <option value={stage} key={stage}>{STAGE_LABELS[stage]}</option>)}</select></label>
            <label className="field"><span>Progres pekerjaan</span><div className="percent-input"><input type="number" min={0} max={100} placeholder="0" value={draft.progress_percent} onChange={event => update({ progress_percent: event.target.value === '' ? '' : Number(event.target.value) })} /><span>%</span></div></label>
            <label className="field"><span>Forecast selesai</span><input type="date" value={draft.forecast_finish} onChange={event => update({ forecast_finish: event.target.value })} /></label>
          </div>
          <div className="progress-update-grid">
            <label className="field"><span>Apa yang sudah selesai?</span><textarea rows={3} placeholder="Hasil nyata sejak update terakhir…" value={draft.completed_text} onChange={event => update({ completed_text: event.target.value })} /></label>
            <label className="field"><span>Apa yang sedang berjalan?</span><textarea rows={3} placeholder="Pekerjaan yang sedang diproses…" value={draft.current_text} onChange={event => update({ current_text: event.target.value })} /></label>
            <label className="field"><span>Hambatan</span><textarea rows={3} placeholder="Kosongkan jika tidak ada hambatan…" value={draft.blocker_text} onChange={event => update({ blocker_text: event.target.value })} /></label>
            <label className="field"><span>Keputusan yang dibutuhkan</span><textarea rows={3} placeholder="Tuliskan pilihan atau keputusan owner…" value={draft.decision_needed} onChange={event => update({ decision_needed: event.target.value })} /></label>
            <label className="field field-wide"><span>Langkah berikutnya</span><textarea rows={2} placeholder="Pekerjaan paling penting setelah update ini…" value={draft.next_step} onChange={event => update({ next_step: event.target.value })} /></label>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="edit-project-actions"><button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Batal</button><button className="button button-primary" disabled={add.isPending}><Send size={16} /> {add.isPending ? 'Menyimpan…' : 'Simpan update progres'}</button></div>
        </form>}

        {updates.length ? <div className="progress-update-list">{updates.map(item => <article className={`progress-update-card progress-type-${item.update_type.toLowerCase()}`} key={item.id}>
          <div className="progress-update-head">
            <span className="avatar avatar-small">{initials(item.author?.full_name)}</span>
            <div><b>{item.author?.full_name ?? 'Tim'}</b><small>{dateTime.format(new Date(item.created_at))} · {item.stage_code ? STAGE_LABELS[item.stage_code] : 'Lintas tahap'}</small></div>
            <span className="progress-update-type">{TYPE_LABELS[item.update_type]}</span>
            {(canAdmin || auth.data?.profile?.id === item.author_id) && <DeleteButton label="update progres" pending={remove.isPending} onConfirm={() => remove.mutate(item.id)} />}
          </div>
          <div className="progress-update-body">
            {item.completed_text && <div className="progress-done"><span><CheckCircle2 size={14} /> Selesai</span><p>{item.completed_text}</p></div>}
            {item.current_text && <div><span><Flag size={14} /> Sedang berjalan</span><p>{item.current_text}</p></div>}
            {item.blocker_text && <div className="progress-risk"><span><AlertTriangle size={14} /> Hambatan</span><p>{item.blocker_text}</p></div>}
            {item.decision_needed && <div className="progress-decision"><span><Target size={14} /> Perlu keputusan</span><p>{item.decision_needed}</p></div>}
            {item.next_step && <div><span><Send size={14} /> Berikutnya</span><p>{item.next_step}</p></div>}
          </div>
          {(item.progress_percent !== null || item.forecast_finish) && <footer><span>{item.progress_percent !== null ? `${item.progress_percent}% progres pekerjaan` : 'Progres belum dinilai'}</span><span>{item.forecast_finish ? `Forecast ${item.forecast_finish}` : 'Tanpa forecast'}</span></footer>}
        </article>)}</div> : !showForm && <div className="state-panel state-empty"><MessageSquareWarning size={28} /><h3>Belum ada update progres</h3><p>Tambahkan update pertama agar Owner dan tim melihat kondisi artikel yang sama.</p></div>}
      </section>
    </div>
  );
}
