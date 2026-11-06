import { useState, type FormEvent, type ReactNode } from 'react';
import { unitSectors, useWorkspaceUnits } from '../data/businessWorkspace';
import {
  briefFields, campaignStatuses, ideaQueues, platforms, priorities, safeOutputUrl, saveCampaign, saveIdea, saveTask, taskStatuses, workstreams,
  type Campaign, type Idea, type Task, type TeamMember,
} from './repository';

export const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
export const button = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50';
export const primary = 'rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';

export function errorText(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && error.code === '42501') {
    return 'Akun ini tidak memiliki izin untuk melakukan perubahan.';
  }
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'Permintaan gagal. Coba lagi.';
}

export function Label({ children, title }: { children: ReactNode; title: string }) {
  return <label className="block space-y-1 text-sm font-medium"><span>{title}</span>{children}</label>;
}

function UnitField({ current, required }: { current?: string | null; required?: boolean }) {
  const units = useWorkspaceUnits();
  return <Label title="Unit bisnis">
    <select name="businessUnit" className={field} defaultValue={current ?? ''} required={required}>
      <option value="">{required ? 'Pilih unit bisnis' : 'Belum ditetapkan'}</option>
      {current && !units.data?.some(unit => unit.id === current) && <option value={current}>Unit saat ini</option>}
      {units.data?.filter(unit => unit.is_active || unit.id === current).map(unit =>
        <option key={unit.id} value={unit.id}>{unit.name} · {unitSectors[unit.sector]}{unit.is_active ? '' : ' (arsip)'}</option>)}
    </select>
    {units.isError && <span className="text-xs text-red-700">Daftar unit belum dapat dimuat.</span>}
  </Label>;
}

export function Options({ values }: { values: Record<string, string> }) {
  return <>{Object.entries(values).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</>;
}

export function People({ members, current, required, name = 'person' }: { members: TeamMember[]; current?: string | null; required?: boolean; name?: string }) {
  return <select className={field} name={name} required={required} defaultValue={current ?? ''}>
    <option value="">Belum ditugaskan</option>
    {current && !members.some(member => member.id === current) && <option value={current}>PIC saat ini</option>}
    {members.filter(member => member.is_active || member.id === current).map(member =>
      <option key={member.id} value={member.id}>{member.full_name}{member.job_title ? ' · ' + member.job_title : ''}{member.is_active ? '' : ' (nonaktif)'}</option>)}
  </select>;
}

export function Editor({ title, children, onCancel, onSave, onSaved }: {
  title: string; children: ReactNode; onCancel: () => void;
  onSave: (data: FormData) => Promise<string>; onSaved: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      onSaved(await onSave(data));
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  }
  return <form onSubmit={submit} aria-busy={busy} className="space-y-4 rounded-xl border border-teal-200 bg-white p-4">
    <h2 className="text-lg font-bold">{title}</h2>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">{children}</fieldset>
    <div className="flex flex-wrap gap-2">
      <button type="submit" className={primary} disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
      <button type="button" className={button} disabled={busy} onClick={onCancel}>Batal</button>
    </div>
  </form>;
}

const value = (data: FormData, key: string) => String(data.get(key) ?? '').trim();
type Common = { members: TeamMember[]; onCancel: () => void; onSaved: (id: string) => void };

export function CampaignForm({ campaign, defaultUnit, members, onCancel, onSaved }: Common & { campaign?: Campaign; defaultUnit?: string }) {
  return <Editor title={campaign ? 'Edit kampanye' : 'Kampanye baru'} onCancel={onCancel} onSaved={onSaved}
    onSave={data => {
      const starts = value(data, 'start');
      const ends = value(data, 'end');
      if (starts && ends && starts > ends) throw new Error('Tanggal akhir harus sama dengan atau setelah tanggal mulai.');
      return saveCampaign({
        name: value(data, 'name'), objective: value(data, 'objective'), owner_id: value(data, 'person') || null,
        status: value(data, 'status') as Campaign['status'], starts_on: starts || null, ends_on: ends || null,
        budget_idr: Number(value(data, 'budget')), spent_idr: Number(value(data, 'spent')),
        business_unit_id: value(data, 'businessUnit') || null,
      }, campaign);
    }}>
    <Label title="Nama kampanye"><input name="name" className={field} required maxLength={160} defaultValue={campaign?.name} /></Label>
    <UnitField current={campaign ? campaign.business_unit_id : defaultUnit} required={!campaign} />
    <Label title="PIC kampanye"><People members={members} current={campaign?.owner_id} /></Label>
    <Label title="Status"><select name="status" className={field} defaultValue={campaign?.status ?? 'planned'}><Options values={campaignStatuses} /></select></Label>
    <Label title="Tujuan / konteks promo"><textarea name="objective" className={field} maxLength={2000} defaultValue={campaign?.objective} /></Label>
    <Label title="Mulai"><input name="start" className={field} type="date" defaultValue={campaign?.starts_on ?? ''} /></Label>
    <Label title="Berakhir"><input name="end" className={field} type="date" defaultValue={campaign?.ends_on ?? ''} /></Label>
    <Label title="Anggaran (Rp)"><input name="budget" className={field} type="number" min={0} max={999999999999} step={1} defaultValue={campaign?.budget_idr ?? 0} /></Label>
    <Label title="Realisasi manual (Rp)"><input name="spent" className={field} type="number" min={0} max={999999999999} step={1} defaultValue={campaign?.spent_idr ?? 0} /></Label>
  </Editor>;
}

export function TaskForm({ task, sourceIdea, campaignId, campaignList, defaultUnit, members, onCancel, onSaved }: Common & {
  task?: Task; sourceIdea?: Idea; campaignId: string | null; campaignList: Campaign[]; defaultUnit?: string;
}) {
  const [status, setStatus] = useState(task?.status ?? 'todo');
  const [selectedCampaign, setSelectedCampaign] = useState(task ? task.campaign_id ?? '' : campaignId ?? '');
  const [platform, setPlatform] = useState<Task['platform']>(task?.platform ?? sourceIdea?.platform ?? 'internal');
  return <Editor title={task ? 'Edit tugas' : sourceIdea ? 'Jadikan ide sebagai tugas' : 'Tugas kreatif baru'} onCancel={onCancel} onSaved={onSaved}
    onSave={data => {
      const link = value(data, 'url');
      const output = safeOutputUrl(link);
      const blocker = value(data, 'blocker');
      const people = [...new Set(data.getAll('additionalPerson').map(String))];
      const primaryPerson = value(data, 'person') || people[0] || null;
      const extraPlatforms = data.getAll('additionalPlatform').map(String) as Task['platform'][];
      const steps = [...new Set(value(data, 'checklist').split(/\r?\n/).map(line => line.trim()).filter(Boolean))];
      if (steps.length > 20 || steps.some(step => step.length > 160)) {
        throw new Error('Checklist maksimal 20 langkah, masing-masing 160 karakter.');
      }
      const checked = new Set(task?.checklist?.filter(item => item.done).map(item => item.label));
      if (sourceIdea && (!value(data, 'person') || !value(data, 'due'))) throw new Error('Tentukan PIC dan deadline sebelum memasukkan ide ke antrean produksi.');
      if (link && !output) throw new Error('Tautan hasil harus berupa URL HTTP atau HTTPS yang valid.');
      if (status === 'blocked' && !blocker) throw new Error('Isi alasan tugas terhambat.');
      return saveTask({
        campaign_id: value(data, 'campaign') || null, title: value(data, 'title'), brief: value(data, 'brief'),
        creative_brief: Object.fromEntries(Object.keys(briefFields).map(key => [key, value(data, `brief.${key}`)]).filter(([, text]) => text)),
        deliverable: value(data, 'deliverable'), acceptance_criteria: value(data, 'criteria'),
        completion_note: value(data, 'evidence'),
        checklist: steps.map(label => ({ label, done: checked.has(label) })),
        assignee_id: primaryPerson, platform,
        reviewer_id: value(data, 'reviewer') || null,
        approver_id: value(data, 'approver') || null,
        additional_assignee_ids: people.filter(id => id !== primaryPerson),
        additional_platforms: platform === 'internal' ? [] : extraPlatforms.filter(choice => choice !== platform),
        format: value(data, 'format'), status, priority: value(data, 'priority') as Task['priority'],
        due_on: value(data, 'due') || null, publish_on: value(data, 'publish') || null,
        output_url: output, blocker: status === 'blocked' ? blocker : '',
        business_unit_id: selectedCampaign ? task?.business_unit_id ?? null : value(data, 'businessUnit') || null,
        workstream: value(data, 'workstream') as Task['workstream'],
      }, task, sourceIdea?.id);
    }}>
    <Label title="Judul / hasil yang dibutuhkan"><input name="title" className={field} required maxLength={160} defaultValue={task?.title ?? sourceIdea?.title} /></Label>
    <Label title="Kampanye"><select name="campaign" className={field} value={selectedCampaign} onChange={event => setSelectedCampaign(event.target.value)}>
      <option value="">Tanpa kampanye</option>
      {task?.campaign_id && !campaignList.some(campaign => campaign.id === task.campaign_id) &&
        <option value={task.campaign_id}>Kampanye saat ini</option>}
      {campaignList.filter(campaign => campaign.status !== 'archived' || campaign.id === task?.campaign_id).map(campaign =>
        <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
    </select></Label>
    {selectedCampaign ? <p className="self-center text-sm text-slate-600">Unit bisnis mengikuti kampanye.</p>
      : <UnitField current={task ? task.business_unit_id : sourceIdea?.business_unit_id ?? defaultUnit} required={!task} />}
    <div className="space-y-2">
      <Label title="Platform utama"><select name="platform" className={field} value={platform} onChange={event => setPlatform(event.target.value as Task['platform'])}><Options values={platforms} /></select></Label>
      <details className="rounded-lg border border-slate-200 p-2 text-sm" hidden={platform === 'internal'}>
        <summary className="cursor-pointer font-medium">Platform tambahan</summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {Object.entries(platforms).filter(([id]) => id !== 'internal').map(([id, label]) => (
            <label key={id} hidden={id === platform} className="space-x-2">
              <input type="checkbox" name="additionalPlatform" value={id} disabled={id === platform || platform === 'internal'}
                defaultChecked={task?.additional_platforms?.includes(id as Task['platform'])} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </details>
    </div>
    <Label title="Pos kerja"><select name="workstream" className={field} defaultValue={task?.workstream ?? 'creative'}><Options values={workstreams} /></select></Label>
    <Label title="Format"><input name="format" className={field} maxLength={80} placeholder="Contoh: Reels 30 detik" defaultValue={task?.format} /></Label>
    <div className="space-y-2">
      <Label title={sourceIdea ? 'PIC utama (wajib)' : 'PIC utama'}><People members={members} current={task?.assignee_id} required={!!sourceIdea} /></Label>
      <details className="rounded-lg border border-slate-200 p-2 text-sm">
        <summary className="cursor-pointer font-medium">PIC tambahan</summary>
        <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
          {members.filter(member => member.is_active || task?.additional_assignee_ids?.includes(member.id)).map(member => (
            <label key={member.id} className="flex items-center gap-2">
              <input type="checkbox" name="additionalPerson" value={member.id} defaultChecked={task?.additional_assignee_ids?.includes(member.id)} />
              <span>{member.full_name}{member.is_active ? '' : ' (nonaktif)'}</span>
            </label>
          ))}
          {task?.additional_assignee_ids?.filter(id => !members.some(member => member.id === id)).map(id => (
            <label key={id} className="flex items-center gap-2">
              <input type="checkbox" name="additionalPerson" value={id} defaultChecked />
              <span>PIC saat ini (profil tidak tersedia)</span>
            </label>
          ))}
          {!members.length && <p className="text-slate-600">Belum ada anggota yang dapat dipilih.</p>}
        </div>
      </details>
    </div>
    <Label title="Reviewer"><People name="reviewer" members={members} current={task?.reviewer_id} /></Label>
    <Label title="Pemberi persetujuan"><People name="approver" members={members} current={task?.approver_id} /></Label>
    <Label title="Prioritas"><select name="priority" className={field} defaultValue={task?.priority ?? 'normal'}><Options values={priorities} /></select></Label>
    <Label title={sourceIdea ? 'Deadline pengerjaan (wajib)' : 'Deadline pengerjaan'}><input name="due" className={field} required={!!sourceIdea} type="date" defaultValue={task?.due_on ?? ''} /></Label>
    <Label title="Jadwal tayang"><input name="publish" className={field} type="date" defaultValue={task?.publish_on ?? ''} /></Label>
    <Label title="Status"><select name="status" className={field} value={status} onChange={event => setStatus(event.target.value as Task['status'])}><Options values={taskStatuses} /></select></Label>
    {status === 'blocked' && <Label title="Alasan terhambat"><input name="blocker" className={field} required maxLength={500} defaultValue={task?.blocker} /></Label>}
    <Label title="Brief"><textarea name="brief" className={field} maxLength={2000} defaultValue={task?.brief ?? sourceIdea?.brief} /></Label>
    <details className="rounded-lg border border-slate-200 p-3 sm:col-span-2">
      <summary className="cursor-pointer text-sm font-semibold">Brief kreatif terstruktur</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {(Object.keys(briefFields) as (keyof typeof briefFields)[]).map(key => <Label key={key} title={briefFields[key]}>
          <textarea name={`brief.${key}`} className={field} maxLength={700} rows={2} defaultValue={task?.creative_brief?.[key]} />
        </Label>)}
      </div>
    </details>
    <Label title="Hasil yang harus diserahkan"><textarea name="deliverable" className={field} maxLength={1000} defaultValue={task?.deliverable} placeholder="Contoh: tiga versi logo dalam SVG" /></Label>
    <Label title="Kriteria penerimaan"><textarea name="criteria" className={field} maxLength={2000} defaultValue={task?.acceptance_criteria} placeholder="Contoh: logo tetap terbaca pada ukuran kecil" /></Label>
    <Label title="Checklist pekerjaan"><textarea name="checklist" className={field} rows={3} maxLength={3220}
      defaultValue={task?.checklist?.map(item => item.label).join('\n')} placeholder="Tulis satu langkah per baris" /></Label>
    <Label title="Catatan bukti hasil"><textarea name="evidence" className={field} maxLength={2000} defaultValue={task?.completion_note} placeholder="Isi catatan atau lampirkan tautan hasil sebelum review" /></Label>
    <Label title="Tautan hasil / aset"><input name="url" className={field} type="url" maxLength={1024} defaultValue={task?.output_url} /></Label>
  </Editor>;
}

export function IdeaForm({ idea, defaultUnit, onCancel, onSaved }: Omit<Common, 'members'> & { idea?: Idea; defaultUnit?: string }) {
  return <Editor title={idea ? 'Edit ide konten' : 'Tambah ide konten'} onCancel={onCancel} onSaved={onSaved}
    onSave={data => {
      const inputs = value(data, 'references').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      if (inputs.length > 5) throw new Error('Masukkan maksimal 5 tautan referensi.');
      const references = inputs.map(safeOutputUrl);
      const brief = value(data, 'brief');
      const queue = value(data, 'queue') as Idea['queue_state'];
      if (queue === 'ready' && !brief) throw new Error('Tulis apa yang perlu dibuat sebelum menandai ide siap dikerjakan.');
      if (references.some(url => !url || url.length > 1024)) {
        throw new Error('Setiap referensi harus berupa tautan HTTP atau HTTPS yang valid (maksimal 1024 karakter).');
      }
      return saveIdea({
        title: value(data, 'title'), brief, platform: value(data, 'platform') as Idea['platform'],
        reference_urls: [...new Set(references)], prioritized: data.has('prioritized'), queue_state: queue,
        business_unit_id: value(data, 'businessUnit') || null,
      }, idea);
    }}>
    <Label title="Judul ide"><input name="title" className={field} maxLength={160} required defaultValue={idea?.title} /></Label>
    <UnitField current={idea ? idea.business_unit_id : defaultUnit} required={!idea} />
    <Label title="Platform tujuan"><select name="platform" className={field} defaultValue={idea?.platform ?? 'internal'}><Options values={platforms} /></select></Label>
    <Label title="Antrean ide"><select name="queue" className={field} defaultValue={idea?.queue_state ?? 'candidate'}><Options values={ideaQueues} /></select></Label>
    <Label title="Catatan: apa yang perlu dibuat atau diadaptasi?"><textarea name="brief" className={field} rows={4} maxLength={2000} defaultValue={idea?.brief} /></Label>
    <Label title="Tautan referensi (maksimal 5, satu per baris)"><textarea name="references" className={field} rows={4} maxLength={5124}
      placeholder="https://…" defaultValue={idea?.reference_urls.join('\n')} /></Label>
    <label className="flex items-center gap-2 text-sm font-semibold">
      <input name="prioritized" type="checkbox" defaultChecked={idea?.prioritized} /> Prioritas untuk dikerjakan
    </label>
  </Editor>;
}
