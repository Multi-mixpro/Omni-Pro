import { useState, type FormEvent, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { unitSectors, useWorkspaceUnits } from '../data/businessWorkspace';
import {
  CopyRichTextContent,
  CopyRichTextEditor,
  CopyScriptViewerModal,
  formatScriptForBrief,
  OpenScriptReaderButton,
  stripCopyRichText,
} from './CopyRichText';
import {
  briefFields, campaignStatuses, copyFormats, copyTemplates, getIdeaAttachedScript, ideaQueues, outputTypes, platforms, priorities, safeOutputUrl, saveCampaign, saveCopyTemplate, saveIdea, saveTask, setIdeaAttachedScript, taskStatuses, workstreams,
  type Campaign, type CopyTemplate, type Idea, type Task, type TeamMember,
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
  return <form onSubmit={submit} aria-busy={busy} className="creative-editor space-y-4 rounded-xl border border-teal-200 bg-white p-4">
    <h2 className="text-lg font-bold">{title}</h2>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">{children}</fieldset>
    <div className="creative-editor-actions flex flex-wrap gap-2">
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
  const [outputType, setOutputType] = useState<Task['output_type']>(task?.output_type ?? 'post');
  const [selectedTemplateId, setSelectedTemplateId] = useState(task?.copy_template_id ?? getIdeaAttachedScript(sourceIdea?.id) ?? '');
  const [briefText, setBriefText] = useState(task?.brief ?? sourceIdea?.brief ?? '');
  const [customScriptNote, setCustomScriptNote] = useState('');
  const [viewingScript, setViewingScript] = useState<CopyTemplate | null>(null);
  const templates = useQuery({ queryKey: ['creative-copy-library', defaultUnit ?? 'all'], queryFn: ({ signal }) => copyTemplates(signal, defaultUnit ?? 'all') });
  const selectedTemplate = templates.data?.find(t => t.id === selectedTemplateId);
  return <>
    {viewingScript && (
      <CopyScriptViewerModal
        template={viewingScript}
        onClose={() => setViewingScript(null)}
      />
    )}
    <Editor title={task ? 'Edit tugas' : sourceIdea ? 'Jadikan ide sebagai tugas' : 'Tugas kreatif baru'} onCancel={onCancel} onSaved={onSaved}
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
        copy_template_id: value(data, 'copyTemplate') || null,
        output_type: outputType,
        format: value(data, 'format'), status, priority: value(data, 'priority') as Task['priority'],
        due_on: value(data, 'due') || null, publish_on: value(data, 'publish') || null,
        output_url: output, blocker: status === 'blocked' ? blocker : '',
        business_unit_id: selectedCampaign ? task?.business_unit_id ?? null : value(data, 'businessUnit') || null,
        workstream: value(data, 'workstream') as Task['workstream'],
      }, task, sourceIdea?.id);
    }}>
    <Label title="Judul / hasil yang dibutuhkan"><input name="title" className={field} required maxLength={160} defaultValue={task?.title ?? sourceIdea?.title} /></Label>
    {(task?.reviewed_at || task?.approved_at) && ['ready','done'].includes(task.status) && <p className="sm:col-span-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
      Brief dan hasil ini sudah disetujui. Pilih status Dikerjakan saat mengubahnya agar review dan persetujuan dapat dicatat ulang.
    </p>}
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
                defaultChecked={(task ? task.additional_platforms : sourceIdea?.additional_platforms)?.includes(id as Task['platform'])} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </details>
    </div>
    <Label title="Tipe output konten">
      <select name="outputType" className={field} value={outputType} onChange={event => setOutputType(event.target.value as Task['output_type'])}>
        <Options values={outputTypes} />
      </select>
    </Label>
    <div className="space-y-2.5 sm:col-span-2 rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="task-copy-template" className="font-bold text-slate-800">
          Lampirkan Skrip &amp; Penjelasan dari Bank Ide / Copywriting (opsional)
        </label>
        {templates.data && templates.data.length > 0 && (
          <span className="text-xs text-teal-800 font-semibold">{templates.data.length} template naskah siap pakai</span>
        )}
      </div>
      <select
        id="task-copy-template"
        name="copyTemplate"
        className={field}
        value={selectedTemplateId}
        onChange={event => {
          const nextId = event.target.value;
          setSelectedTemplateId(nextId);
          const selected = templates.data?.find(t => t.id === nextId);
          if (selected) {
            setOutputType(selected.output_type);
            if (selected.platform) setPlatform(selected.platform);
          }
        }}
      >
        <option value="">-- Buat naskah mandiri / Tanpa template bank copy --</option>
        {templates.data?.map(tpl => (
          <option key={tpl.id} value={tpl.id}>
            [{outputTypes[tpl.output_type] ?? tpl.output_type}] {tpl.title}
          </option>
        ))}
      </select>
      {selectedTemplate ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-900">
                {copyFormats[selectedTemplate.format] ?? selectedTemplate.format}
              </span>
              <span className="text-xs font-bold text-slate-800">{selectedTemplate.title}</span>
            </div>
            <OpenScriptReaderButton
              label="Mode Lihat Nyaman"
              onClick={() => setViewingScript(selectedTemplate)}
            />
          </div>

          {selectedTemplate.description && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2 text-xs text-amber-950">
              <strong className="block font-bold text-amber-900">Penjelasan / Arahan Skrip:</strong>
              <p className="mt-0.5 whitespace-pre-wrap">{selectedTemplate.description}</p>
            </div>
          )}

          <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-800">
            <CopyRichTextContent content={selectedTemplate.body} />
          </div>

          <label className="block space-y-1 text-xs font-semibold text-slate-700">
            <span>Catatan / Penjelasan Tambahan Skrip untuk Brief Tugas Ini (opsional)</span>
            <input
              type="text"
              value={customScriptNote}
              onChange={e => setCustomScriptNote(e.target.value)}
              placeholder="Contoh: Gunakan produk warna Navy, durasi maksimal 25 detik, penekanan pada promo gratis ongkir..."
              className={field}
            />
          </label>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-semibold text-slate-600 mr-1">Lampirkan ke Brief Tugas:</span>
            <button
              type="button"
              className="rounded-full bg-teal-800 px-3 py-1 text-xs font-bold text-white hover:bg-teal-900 transition-colors"
              onClick={() => {
                const block = formatScriptForBrief(selectedTemplate, customScriptNote, 'all');
                setBriefText(prev => prev.trim() ? `${prev.trim()}\n\n${block}` : block);
              }}
            >
              + Lampirkan Naskah + Penjelasan ke Brief
            </button>
            <button
              type="button"
              className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-900 hover:bg-teal-100 transition-colors"
              onClick={() => {
                const block = formatScriptForBrief(selectedTemplate, customScriptNote, 'body');
                setBriefText(prev => prev.trim() ? `${prev.trim()}\n\n${block}` : block);
              }}
            >
              + Hanya Naskah ke Brief
            </button>
            <button
              type="button"
              className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors"
              onClick={() => {
                const block = formatScriptForBrief(selectedTemplate, customScriptNote, 'notes');
                setBriefText(prev => prev.trim() ? `${prev.trim()}\n\n${block}` : block);
              }}
            >
              + Hanya Penjelasan Skrip ke Brief
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-600">
          Memilih naskah dari Bank Ide akan menyelaraskan tipe output, menampilkan penjelasan/arahan skrip, dan memudahkan pelampiran ke Brief Tugas.
        </p>
      )}
    </div>
    <Label title="Pos kerja"><select name="workstream" className={field} defaultValue={task?.workstream ?? 'creative'}><Options values={workstreams} /></select></Label>
    <Label title="Format"><input name="format" className={field} maxLength={80} placeholder="Contoh: Reels 30 detik / Carousel 5 slide" defaultValue={task?.format} /></Label>
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
    <Label title="Reviewer"><People name="reviewer" members={members.filter(member => member.can_decide || member.id === task?.reviewer_id)} current={task?.reviewer_id} /></Label>
    <Label title="Pemberi persetujuan"><People name="approver" members={members.filter(member => member.can_decide || member.id === task?.approver_id)} current={task?.approver_id} /></Label>
    <Label title="Prioritas"><select name="priority" className={field} defaultValue={task?.priority ?? 'normal'}><Options values={priorities} /></select></Label>
    <Label title={sourceIdea ? 'Deadline pengerjaan (wajib)' : 'Deadline pengerjaan'}><input name="due" className={field} required={!!sourceIdea} type="date" defaultValue={task?.due_on ?? ''} /></Label>
    <Label title="Jadwal tayang"><input name="publish" className={field} type="date" defaultValue={task?.publish_on ?? ''} /></Label>
    <Label title="Status"><select name="status" className={field} value={status} onChange={event => setStatus(event.target.value as Task['status'])}><Options values={taskStatuses} /></select></Label>
    {status === 'blocked' && <Label title="Alasan terhambat"><input name="blocker" className={field} required maxLength={500} defaultValue={task?.blocker} /></Label>}
    <Label title="Brief"><textarea name="brief" className={field} maxLength={2000} value={briefText} onChange={event => setBriefText(event.target.value)} /></Label>
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
  </Editor>
  </>;
}

export function IdeaForm({ idea, defaultUnit, initialTemplate, onCancel, onSaved }: Omit<Common, 'members'> & { idea?: Idea; defaultUnit?: string; initialTemplate?: CopyTemplate }) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Idea['platform'][]>(
    idea ? [idea.platform, ...new Set(idea.additional_platforms ?? [])] : initialTemplate?.platform ? [initialTemplate.platform] : ['internal'],
  );
  const [attachedScriptId, setAttachedScriptId] = useState<string>(() => idea ? getIdeaAttachedScript(idea.id) : initialTemplate?.id ?? '');
  const [briefText, setBriefText] = useState<string>(() => {
    if (idea?.brief) return idea.brief;
    if (initialTemplate) return formatScriptForBrief(initialTemplate, undefined, 'all');
    return '';
  });
  const [viewingScript, setViewingScript] = useState<CopyTemplate | null>(null);
  const templates = useQuery({
    queryKey: ['creative-copy-library', defaultUnit ?? 'all'],
    queryFn: ({ signal }) => copyTemplates(signal, defaultUnit ?? 'all'),
  });
  const selectedScript = templates.data?.find(tpl => tpl.id === attachedScriptId);

  function togglePlatform(platform: Idea['platform'], checked: boolean) {
    setSelectedPlatforms(current => {
      if (!checked) return current.filter(choice => choice !== platform);
      if (platform === 'internal') return ['internal'];
      return [...current.filter(choice => choice !== 'internal'), platform];
    });
  }
  return <>
    {viewingScript && (
      <CopyScriptViewerModal
        template={viewingScript}
        onClose={() => setViewingScript(null)}
      />
    )}
    <Editor title={idea ? 'Edit ide konten' : 'Tambah ide konten'} onCancel={onCancel} onSaved={onSaved}
    onSave={async data => {
      const [platform, ...additionalPlatforms] = selectedPlatforms;
      if (!platform) throw new Error('Pilih minimal satu platform tujuan.');
      const inputs = value(data, 'references').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      if (inputs.length > 5) throw new Error('Masukkan maksimal 5 tautan referensi.');
      const references = inputs.map(safeOutputUrl);
      const brief = value(data, 'brief');
      const queue = value(data, 'queue') as Idea['queue_state'];
      if (queue === 'ready' && !brief) throw new Error('Tulis apa yang perlu dibuat sebelum menandai ide siap dikerjakan.');
      if (references.some(url => !url || url.length > 1024)) {
        throw new Error('Setiap referensi harus berupa tautan HTTP atau HTTPS yang valid (maksimal 1024 karakter).');
      }
      const savedId = await saveIdea({
        title: value(data, 'title'), brief, platform, additional_platforms: additionalPlatforms,
        reference_urls: [...new Set(references)], prioritized: data.has('prioritized'), queue_state: queue,
        business_unit_id: value(data, 'businessUnit') || null,
      }, idea);
      setIdeaAttachedScript(savedId, attachedScriptId || null);
      return savedId;
    }}>
    <Label title="Judul ide"><input name="title" className={field} maxLength={160} required defaultValue={idea?.title ?? initialTemplate?.title} /></Label>
    <UnitField current={idea ? idea.business_unit_id : defaultUnit} required={!idea} />
    <fieldset className="min-w-0 rounded-lg border border-slate-200 px-3 pb-3">
      <legend className="px-1 text-sm font-medium">Platform tujuan</legend>
      <p className="mb-2 text-xs text-slate-600">Centang beberapa platform. Pilih Internal untuk ide khusus tim.</p>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(platforms) as Idea['platform'][]).map(platform => <label key={platform} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={selectedPlatforms.includes(platform)} onChange={event => togglePlatform(platform, event.target.checked)} />
          <span>{platforms[platform]}</span>
        </label>)}
      </div>
    </fieldset>
    <Label title="Antrean ide"><select name="queue" className={field} defaultValue={idea?.queue_state ?? (initialTemplate ? 'ready' : 'candidate')}><Options values={ideaQueues} /></select></Label>
    <div className="space-y-2.5 sm:col-span-2 rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="idea-copy-template" className="font-bold text-slate-800">
          Lampirkan Naskah &amp; Penjelasan dari List Copywriting / Skrip (opsional)
        </label>
        {templates.data && templates.data.length > 0 && (
          <span className="text-xs font-semibold text-teal-800">{templates.data.length} naskah di Bank Ide</span>
        )}
      </div>
      <select
        id="idea-copy-template"
        name="ideaCopyTemplate"
        className={field}
        value={attachedScriptId}
        onChange={event => {
          const nextId = event.target.value;
          setAttachedScriptId(nextId);
          const tpl = templates.data?.find(item => item.id === nextId);
          if (tpl?.platform) {
            togglePlatform(tpl.platform, true);
          }
        }}
      >
        <option value="">-- Tanpa lampiran naskah / Tulis catatan mandiri --</option>
        {templates.data?.map(tpl => (
          <option key={tpl.id} value={tpl.id}>
            [{copyFormats[tpl.format] ?? tpl.format} · {outputTypes[tpl.output_type] ?? tpl.output_type}] {tpl.title}
          </option>
        ))}
      </select>
      {selectedScript ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800">
              Lampiran: {selectedScript.title} ({copyFormats[selectedScript.format] ?? selectedScript.format})
            </span>
            <OpenScriptReaderButton
              label="Mode Lihat Nyaman"
              onClick={() => setViewingScript(selectedScript)}
            />
          </div>

          {selectedScript.description && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2 text-xs text-amber-950">
              <strong className="block font-bold text-amber-900">Penjelasan / Arahan Skrip:</strong>
              <p className="mt-0.5 whitespace-pre-wrap">{selectedScript.description}</p>
            </div>
          )}

          <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-800">
            <CopyRichTextContent content={selectedScript.body} />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              className="rounded-full bg-teal-800 px-3 py-1 text-xs font-bold text-white hover:bg-teal-900 transition-colors"
              onClick={() => {
                const block = formatScriptForBrief(selectedScript, undefined, 'all');
                setBriefText(prev => prev.trim() ? `${prev.trim()}\n\n${block}` : block);
              }}
            >
              + Salin Naskah + Penjelasan ke Catatan Ide
            </button>
            <button
              type="button"
              className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-900 hover:bg-teal-100 transition-colors"
              onClick={() => {
                const block = formatScriptForBrief(selectedScript, undefined, 'body');
                setBriefText(prev => prev.trim() ? `${prev.trim()}\n\n${block}` : block);
              }}
            >
              + Hanya Naskah ke Catatan Ide
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-600">
          Pilih naskah copywriting/skrip dari Bank Ide agar penjelasan dan naskahnya otomatis terlampir saat ide diubah menjadi tugas produksi.
        </p>
      )}
    </div>
    <Label title="Catatan: apa yang perlu dibuat atau diadaptasi?"><textarea name="brief" className={field} rows={4} maxLength={2000} value={briefText} onChange={event => setBriefText(event.target.value)} /></Label>
    <Label title="Tautan referensi (maksimal 5, satu per baris)"><textarea name="references" className={field} rows={4} maxLength={5124}
      placeholder="https://…" defaultValue={idea?.reference_urls.join('\n')} /></Label>
    <label className="flex items-center gap-2 text-sm font-semibold">
      <input name="prioritized" type="checkbox" defaultChecked={idea?.prioritized} /> Prioritas untuk dikerjakan
    </label>
  </Editor>
  </>;
}

export function CopyTemplateForm({
  template,
  defaultUnit,
  onCancel,
  onSaved,
}: {
  template?: CopyTemplate;
  defaultUnit?: string;
  onCancel: () => void;
  onSaved: (id: string) => void;
}) {
  return (
    <Editor
      title={template ? 'Edit skrip / naskah copywriting' : 'Tambah naskah baru ke Bank Ide & Copywriting'}
      onCancel={onCancel}
      onSaved={onSaved}
      onSave={data => {
        const title = value(data, 'title');
        const body = value(data, 'body');
        const description = value(data, 'description');
        if (!title) throw new Error('Judul template naskah wajib diisi.');
        if (!stripCopyRichText(body)) throw new Error('Isi naskah / skrip tidak boleh kosong.');
        return saveCopyTemplate({
          title,
          description,
          body,
          format: (value(data, 'format') as CopyTemplate['format']) || 'caption',
          output_type: (value(data, 'output_type') as CopyTemplate['output_type']) || 'post',
          platform: (value(data, 'platform') as CopyTemplate['platform']) || null,
          business_unit_id: value(data, 'businessUnit') || null,
        }, template?.id);
      }}
    >
      <Label title="Judul naskah / skrip">
        <input name="title" className={field} maxLength={160} required defaultValue={template?.title} placeholder="Contoh: Hook video unboxing varsity" />
      </Label>
      <UnitField current={template ? template.business_unit_id : defaultUnit} required={false} />
      <Label title="Format naskah">
        <select name="format" className={field} defaultValue={template?.format ?? 'hook'}>
          <Options values={copyFormats} />
        </select>
      </Label>
      <Label title="Target tipe output">
        <select name="output_type" className={field} defaultValue={template?.output_type ?? 'video'}>
          <Options values={outputTypes} />
        </select>
      </Label>
      <Label title="Platform utama (opsional)">
        <select name="platform" className={field} defaultValue={template?.platform ?? ''}>
          <option value="">Semua platform</option>
          <Options values={platforms} />
        </select>
      </Label>
      <div className="sm:col-span-2">
        <Label title="Penjelasan Skrip / Arahan Brief &amp; Konteks Penggunaan (opsional)">
          <textarea
            name="description"
            className={field}
            rows={2}
            maxLength={1500}
            defaultValue={template?.description ?? ''}
            placeholder="Jelaskan arah penggunaan skrip ini: intonasi bicara talent, angle visual kamera, tujuan brief, atau catatan eksekusi..."
          />
        </Label>
      </div>
      <div className="sm:col-span-2">
        <Label title="Isi naskah / skrip / copywriting (Gunakan Text Tools untuk Tebal, Miring, Ukuran, Warna &amp; Stabilo)">
          <CopyRichTextEditor
            name="body"
            defaultValue={template?.body ?? ''}
            placeholder="Tuliskan hook, naskah dialog video, alur adegan, atau caption di sini..."
          />
        </Label>
      </div>
    </Editor>
  );
}
