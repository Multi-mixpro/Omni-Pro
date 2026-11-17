import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, ExternalLink, Eye, FileText, Link2, Paperclip } from 'lucide-react';
import { button, Editor, errorText, field, Label, primary } from './CreativeForms';
import { CreativePager, PublicationList } from './CreativeAccounts';
import { accounts, nudgeTask, publications, recordPublication, taskEvents } from './commandRepository';
import { channelPlatforms } from './channelRepository';
import { CopyRichTextContent, CopyScriptViewerModal, stripCopyRichText } from './CopyRichText';
import { advanceTask, approveTask, briefFields, copyFormats, copyTemplates, getTask, outputTypes, PAGE_SIZE, pendingTaskDecisions, platforms, recordRoutineExecution, requestRevision, safeOutputUrl, setTaskChecklistItem, taskRoutineCategories, taskRoutineModes, taskStatuses, type CopyTemplate } from './repository';
import type { Focus } from './schedule';
import { ProjectDiscussion } from '../discussion/ProjectDiscussion';
import { CreativeCopyVersions } from './CreativeCopyVersions';

function extractUrlsFromText(text?: string | null): string[] {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s<>"')]+/gi) ?? [];
  return matches.map(u => safeOutputUrl(u)).filter((u): u is string => Boolean(u));
}

function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(url) || /res\.cloudinary\.com\/.+\/image\/upload\//i.test(url);
}

const dateTime = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' });
const when = (time: string) => dateTime.format(new Date(time)) + ' WIB';
function describeEvent(kind: string, detail: string) {
  if (kind !== 'status') return detail;
  const [before, rest] = detail.split(' → ');
  const [after, ...note] = (rest ?? '').split(': ');
  return (taskStatuses[before as keyof typeof taskStatuses] ?? before) + ' → ' +
    (taskStatuses[after as keyof typeof taskStatuses] ?? after) + (note.length ? ': ' + note.join(': ') : '');
}

export function CreativeTaskDetail({ taskId, userId, canEdit, onClose, onChanged }: {
  taskId: string; userId: string; canEdit: boolean; onClose: () => void; onChanged: () => void;
}) {
  const prefix = ['creative', userId];
  const client = useQueryClient();
  const [action, setAction] = useState<'publish' | 'revision' | null>(null);
  const [accountPage, setAccountPage] = useState(0);
  const [notice, setNotice] = useState('');
  const [nudgeBusy, setNudgeBusy] = useState(false);
  const [routineNote, setRoutineNote] = useState('');
  const [viewingTemplate, setViewingTemplate] = useState<CopyTemplate | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const task = useQuery({ queryKey: [...prefix,'task-detail',taskId], queryFn: ({ signal }) => getTask(taskId,signal) });
  const post = useQuery({ queryKey: [...prefix,'publications','task',taskId], queryFn: ({ signal }) => publications('task_id',taskId,0,signal) });
  const history = useQuery({ queryKey: [...prefix,'task-events','task',taskId], queryFn: ({ signal }) => taskEvents('task',taskId,signal) });
  const templatesQuery = useQuery({
    queryKey: ['creative-copy-library', 'all'],
    queryFn: ({ signal }) => copyTemplates(signal, 'all'),
  });
  const row = task.data;
  const attachedTemplate = row?.copy_template_id
    ? (templatesQuery.data?.find(t => t.id === row.copy_template_id) ??
       templatesQuery.data?.find(t =>
         row.title &&
         (t.title.toLowerCase().includes(row.title.toLowerCase()) ||
          row.title.toLowerCase().includes(t.title.toLowerCase()))
       ))
    : undefined;
  const referenceLinks = Array.from(new Set([
    ...(row?.source_idea?.reference_urls ?? []).map(u => safeOutputUrl(u)).filter((u): u is string => Boolean(u)),
    ...extractUrlsFromText(typeof row?.creative_brief?.references === 'string' ? row.creative_brief.references : ''),
    ...extractUrlsFromText(row?.brief),
  ]));
  const finalOutputUrl = safeOutputUrl(row?.output_url ?? '');
  const copyText = (text: string, key: string) => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(prev => (prev === key ? null : prev)), 2000);
    });
  };
  const briefEntries = (Object.keys(briefFields) as (keyof typeof briefFields)[]).flatMap(key => {
    const value = row?.creative_brief?.[key];
    return typeof value === 'string' && value ? [{ label: briefFields[key], value }] : [];
  });
  const awaitingApproval = Boolean(row?.approver_id && !row.approved_at);
  const approval = useMutation({
    mutationFn: (decision: 'review' | 'approval') => {
      if (!row) throw new Error('Tugas belum dimuat.');
      return decision === 'review' ? advanceTask(row, 'ready') : approveTask(row);
    },
    onSuccess: async (_, decision) => {
      await task.refetch();
      onChanged();
      setNotice(decision === 'review' ? 'Review disetujui.' : 'Persetujuan akhir tersimpan.');
    },
  });
  const checklist = row?.checklist ?? [];
  const checklistUpdate = useMutation({
    mutationFn: ({ index, done }: { index: number; done: boolean }) => {
      if (!row) throw new Error('Tugas belum dimuat.');
      return setTaskChecklistItem(row, index, done);
    },
    onSettled: async () => {
      await task.refetch();
      await client.invalidateQueries({ queryKey: [...prefix, 'tasks'] });
    },
  });
  const routineCycle = useMutation({
    mutationFn: ({ reset }: { reset: boolean }) => {
      if (!row) throw new Error('Tugas belum dimuat.');
      return recordRoutineExecution(row, routineNote, reset);
    },
    onSuccess: async (_, { reset }) => {
      setRoutineNote('');
      await task.refetch();
      onChanged();
      setNotice(
        reset
          ? 'Eksekusi rutinitas berhasil dicatat & checklist di-reset untuk order/siklus berikutnya.'
          : 'Eksekusi rutinitas berhasil ditambahkan ke catatan bukti.',
      );
    },
  });
  const unit = row?.business_unit_id ?? 'unassigned';
  const taskPlatforms = row ? [row.platform, ...(row.additional_platforms ?? [])] : [];
  const accountQuery = useQuery({ queryKey: [...prefix,'accounts','active',unit,accountPage,taskPlatforms], enabled: action === 'publish' && Boolean(row),
    queryFn: ({ signal }) => accounts(unit,accountPage,signal,true,taskPlatforms) });
  const refresh = onChanged;
  const timestamp = new Date(Date.now() + 7*3600_000).toISOString().slice(0,16);
  return <section className="space-y-4 p-5" aria-label="Detail pekerjaan">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h2 className="break-words text-xl font-bold">{row?.title ?? 'Detail pekerjaan'}</h2>
        {row && <p className="text-sm text-slate-600">{taskStatuses[row.status]} · {row.campaign?.name ?? 'Tanpa kampanye'}</p>}</div>
      <button className={button} onClick={onClose}>Tutup</button>
    </div>
    {task.isPending && <p role="status">Memuat detail…</p>}
    {task.isError && <p role="alert" className="text-red-700">{errorText(task.error)}</p>}
    {notice && <p role="status" className="text-sm text-teal-800">{notice}</p>}
    {approval.isError && <p role="alert" className="text-sm text-red-700">{errorText(approval.error)}</p>}
    {row && <>
      {row.routine_mode && row.routine_mode !== 'once' && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 space-y-2.5 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-indigo-700 px-2.5 py-0.5 text-xs font-bold text-white">
                🔁 {taskRoutineModes[row.routine_mode]}
              </span>
              {row.routine_category && (
                <span className="rounded-full border border-indigo-300 bg-white px-2.5 py-0.5 text-xs font-bold text-indigo-900">
                  {taskRoutineCategories[row.routine_category]}
                </span>
              )}
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
              Sudah dieksekusi: {row.routine_runs ?? 0} kali
            </span>
          </div>
          <div className="grid gap-1 text-xs text-slate-700 sm:grid-cols-2">
            {row.routine_trigger && (
              <p><strong>Pemicu Rutinitas:</strong> {row.routine_trigger}</p>
            )}
            {row.routine_target && (
              <p><strong>Target Output:</strong> {row.routine_target}</p>
            )}
          </div>
          {row.routine_last_note && (
            <p className="rounded-lg bg-white/90 border border-indigo-100 px-2.5 py-1.5 text-xs text-slate-700">
              <strong>Eksekusi Terakhir:</strong> {row.routine_last_note}
            </p>
          )}
          {canEdit && (
            <div className="pt-1 space-y-2 border-t border-indigo-200/70">
              <label className="block space-y-1 text-xs font-semibold text-slate-800">
                <span>Catat Eksekusi Baru (Contoh: Order #12 - Kaos 50 pcs / Testimoni Customer Baru)</span>
                <input
                  type="text"
                  value={routineNote}
                  onChange={e => setRoutineNote(e.target.value)}
                  placeholder="Tulis keterangan order customer / testimoni / episode yang baru selesai dibuat..."
                  className={field}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={routineCycle.isPending}
                  onClick={() => routineCycle.mutate({ reset: true })}
                  className="rounded-lg bg-indigo-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-800 disabled:opacity-50"
                >
                  {routineCycle.isPending ? 'Menyimpan…' : '🔄 Catat Selesai & Siapkan untuk Order Berikutnya'}
                </button>
                <button
                  type="button"
                  disabled={routineCycle.isPending}
                  onClick={() => routineCycle.mutate({ reset: false })}
                  className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-900 hover:bg-indigo-50 disabled:opacity-50"
                >
                  + Catat Eksekusi Saja (Tanpa Reset Checklist)
                </button>
              </div>
              {routineCycle.isError && <p role="alert" className="text-xs text-red-700">{errorText(routineCycle.error)}</p>}
            </div>
          )}
        </div>
      )}
      {taskPlatforms && <p className="text-sm text-slate-600 dark:text-slate-300">
        Platform yang memerlukan bukti tayang: {taskPlatforms.map(platform => platforms[platform]).join(', ')}
      </p>}
      {row.brief && (
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-sm leading-relaxed text-slate-800 dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-slate-200">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ringkasan Tugas</p>
          <p className="whitespace-pre-wrap break-words">{row.brief}</p>
        </div>
      )}

      {/* Lampiran Naskah Copywriting / Skrip (dapat dibuka ke Mode PDF & disalin langsung) */}
      {(attachedTemplate || row.copy_template_id) && (
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/60 p-4 space-y-3 dark:border-blue-800/70 dark:bg-blue-950/30">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-600 text-white shadow-xs">
                <FileText size={16} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Lampiran Naskah &amp; Skrip</p>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {attachedTemplate?.title ?? 'Naskah Terlampir'}
                </h3>
              </div>
            </div>
            {attachedTemplate && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-blue-800 border border-blue-200 dark:bg-slate-800 dark:text-blue-200 dark:border-blue-700">
                  {copyFormats[attachedTemplate.format] ?? attachedTemplate.format}
                </span>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                  {outputTypes[attachedTemplate.output_type] ?? attachedTemplate.output_type}
                </span>
              </div>
            )}
          </div>
          {attachedTemplate ? (
            <>
              {attachedTemplate.description && (
                <p className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100">
                  <strong>Arahan Skrip:</strong> {attachedTemplate.description}
                </p>
              )}
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200/90 bg-white p-3.5 text-sm dark:border-slate-700 dark:bg-slate-900">
                <CopyRichTextContent content={attachedTemplate.body} className="text-xs sm:text-sm text-slate-800 dark:text-slate-200" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingTemplate(attachedTemplate)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#1463ff] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#0b52db]"
                >
                  <Eye size={14} />
                  <span>Buka Mode PDF / Baca Nyaman</span>
                </button>
                <button
                  type="button"
                  onClick={() => copyText(stripCopyRichText(attachedTemplate.body), 'attached-script')}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {copiedKey === 'attached-script' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedKey === 'attached-script' ? 'Naskah Tersalin!' : 'Salin Naskah'}</span>
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {templatesQuery.isPending ? 'Memuat lampiran naskah…' : 'Naskah terlampir belum ditemukan atau sudah diarsipkan.'}
            </p>
          )}
        </div>
      )}

      {/* Lampiran Referensi, Tautan & Media Hasil Produksi */}
      {(referenceLinks.length > 0 || finalOutputUrl) && (
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 space-y-2.5 dark:border-emerald-800/60 dark:bg-emerald-950/25">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-600 text-white">
              <Paperclip size={14} />
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Lampiran Tautan &amp; Media ({referenceLinks.length + (finalOutputUrl ? 1 : 0)})
            </h3>
          </div>
          {finalOutputUrl && (
            <div className="rounded-xl border border-emerald-200 bg-white p-3 space-y-2 dark:border-emerald-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Aset / Hasil Final Internal</span>
                <div className="flex items-center gap-2">
                  <a
                    href={finalOutputUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    <ExternalLink size={12} />
                    <span>Buka Lampiran</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => copyText(finalOutputUrl, 'final-output')}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                  >
                    {copiedKey === 'final-output' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedKey === 'final-output' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>
              {isImageUrl(finalOutputUrl) && (
                <a href={finalOutputUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                  <img src={finalOutputUrl} alt="Pratinjau lampiran hasil" className="max-h-56 w-full object-contain bg-slate-50 dark:bg-slate-950" />
                </a>
              )}
              <p className="truncate text-[11px] font-mono text-slate-500">{finalOutputUrl}</p>
            </div>
          )}
          {referenceLinks.length > 0 && (
            <ul className="space-y-1.5">
              {referenceLinks.map((url, idx) => {
                let host = url;
                try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { /* ignore */ }
                return (
                  <li key={url} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <Link2 size={14} className="shrink-0 text-blue-600 dark:text-blue-400" />
                      <div className="min-w-0">
                        <span className="block font-bold text-slate-800 dark:text-slate-100">{host}</span>
                        <span className="block truncate font-mono text-[11px] text-slate-500">{url}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
                      >
                        <ExternalLink size={11} />
                        <span>Buka</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyText(url, `ref-${idx}`)}
                        className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                      >
                        {copiedKey === `ref-${idx}` ? 'Tersalin!' : 'Salin'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {briefEntries.length > 0 && <details open className="rounded-2xl border border-slate-200/80 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900/70">
        <summary className="cursor-pointer text-sm font-bold text-slate-900 dark:text-white">Brief kreatif</summary>
        <dl className="mt-2.5 grid gap-2.5 sm:grid-cols-2">{briefEntries.map(({ label, value }) => <div key={label} className="rounded-xl bg-slate-50/80 p-2.5 dark:bg-slate-800/60">
          <dt className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</dt>
          <dd className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-800 dark:text-slate-200">{value}</dd>
        </div>)}</dl>
      </details>}
      {([
        ['Hasil yang harus diserahkan', row.deliverable],
        ['Kriteria penerimaan', row.acceptance_criteria],
        ['Catatan bukti hasil', row.completion_note],
      ] as const).map(([label, value]) => value && <div key={label} className="rounded-2xl border border-slate-200/80 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900/70">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</h3>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800 dark:text-slate-200">{value}</p>
      </div>)}
      {checklist.length > 0 && <fieldset className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900/70"
        disabled={!canEdit || row.status === 'done' || row.status === 'cancelled' || checklistUpdate.isPending}>
        <legend className="px-1 text-sm font-bold">Checklist · {checklist.filter(item => item.done).length}/{checklist.length} selesai</legend>
        {checklist.map((item, index) => <label key={`${index}-${item.label}`} className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={item.done} onChange={event => checklistUpdate.mutate({ index, done: event.target.checked })} />
          <span className="break-words">{item.label}</span>
        </label>)}
        {checklistUpdate.isError && <p role="alert" className="text-sm text-red-700">{errorText(checklistUpdate.error)}</p>}
      </fieldset>}
      {row.review_note && <p className="whitespace-pre-wrap break-words rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">Catatan revisi: {row.review_note}</p>}
      {row.reviewed_at && <p className="text-sm text-teal-800 dark:text-teal-300">Review disetujui pada {when(row.reviewed_at)}.</p>}
      {row.approved_at && <p className="text-sm text-teal-800 dark:text-teal-300">Persetujuan akhir tercatat pada {when(row.approved_at)}.</p>}
      {row.status === 'ready' && awaitingApproval && <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Menunggu persetujuan akhir sebelum tayang atau selesai.</p>}
      {row.status === 'review' && row.reviewer_id && row.reviewer_id !== userId && <p className="text-sm text-slate-600 dark:text-slate-300">Menunggu keputusan reviewer yang ditugaskan.</p>}
      <div className="flex flex-wrap gap-2">
        {canEdit && row.status === 'ready' && awaitingApproval && row.approver_id === userId &&
          <button type="button" className={primary} disabled={approval.isPending} onClick={() => approval.mutate('approval')}>{approval.isPending ? 'Menyimpan…' : 'Setujui tugas'}</button>}
        {canEdit && row.status === 'review' && row.reviewer_id === userId &&
          <button type="button" className={primary} disabled={approval.isPending} onClick={() => approval.mutate('review')}>Setujui review</button>}
        {canEdit && !awaitingApproval && row.platform !== 'internal' && row.workstream !== 'operations' && !row.source_activation_id && ['ready','done'].includes(row.status) &&
          <button className={primary} onClick={() => { setAccountPage(0); setAction('publish'); }}>Catat tayang</button>}
        {canEdit && row.status === 'review' && (!row.reviewer_id || row.reviewer_id === userId) && <button className={button} onClick={() => setAction('revision')}>Kembalikan untuk revisi</button>}
        {canEdit && row.assignee_id && !['done','cancelled'].includes(row.status) && <button className={button} disabled={nudgeBusy} onClick={async () => {
          setNudgeBusy(true);
          try {
            const sent = await nudgeTask(row.id);
            setNotice(sent ? 'Tindak lanjut masuk ke kotak tindakan PIC.' : 'Tindak lanjut untuk PIC ini sudah dikirim hari ini.');
            if (sent) void client.invalidateQueries({ queryKey: [...prefix,'task-events'] });
          }
          catch (error) { setNotice(errorText(error)); } finally { setNudgeBusy(false); }
        }}>Minta tindak lanjut</button>}
      </div>
      {action === 'revision' && <Editor title="Kembalikan ke produksi" onCancel={() => setAction(null)} onSaved={() => {
        setAction(null); setNotice('Catatan revisi disimpan.'); refresh();
      }} onSave={data => requestRevision(row, String(data.get('note') ?? ''))}>
        <Label title="Apa yang harus direvisi?"><textarea className={field} name="note" rows={3} maxLength={1000} required /></Label>
      </Editor>}
      {action === 'publish' && <Editor title="Bukti publikasi aktual" onCancel={() => setAction(null)} onSaved={() => {
        setAction(null); setNotice('Bukti tayang tersimpan. Anda bisa mencatat akun lain.'); refresh();
      }} onSave={data => {
        const account = String(data.get('account') ?? '');
        const time = String(data.get('time') ?? '');
        if (!account || !time) throw new Error('Pilih akun dan waktu publikasi.');
        return recordPublication(row,account,String(data.get('url') ?? ''),time + ':00+07:00');
      }}>
        <Label title="Akun publikasi"><select key={accountPage} name="account" className={field} required>
          <option value="">Pilih akun aktif dari unit tugas</option>
          {accountQuery.data?.slice(0,PAGE_SIZE).map(account => <option key={account.id} value={account.id}>{account.handle} · {channelPlatforms[account.platform]}</option>)}
        </select></Label>
        <Label title="Tautan video / posting publik"><input name="url" type="url" className={field} maxLength={1024} required /></Label>
        <Label title="Waktu tayang aktual (WIB)"><input name="time" type="datetime-local" className={field} defaultValue={timestamp} max={timestamp} required /></Label>
        {accountQuery.isError && <p role="alert" className="text-sm text-red-700">{errorText(accountQuery.error)}</p>}
        {accountQuery.isSuccess && !accountQuery.data.length && <p className="text-sm text-slate-600">Belum ada akun aktif yang cocok dengan unit dan platform tugas. Tambahkan akun di Akun &amp; Performa.</p>}
        <CreativePager page={accountPage} next={(accountQuery.data?.length ?? 0)>PAGE_SIZE} onPage={setAccountPage} />
      </Editor>}
    </>}
    {row && <>
      <CreativeCopyVersions taskId={row.id} userId={userId} canEdit={canEdit} reviewerId={row.reviewer_id} approverId={row.approver_id} />
      <ProjectDiscussion scope="task" projectId={row.id} userId={userId} canPost={canEdit} />
    </>}
    <div className="space-y-2 border-t border-slate-200 pt-3">
      <h3 className="font-bold">Tautan tayang</h3>
      {post.isError && <p role="alert" className="text-sm text-red-700">{errorText(post.error)}</p>}
      {post.isSuccess && !post.data.length && <p className="text-sm text-slate-600">Belum ada bukti tayang. Status selesai saja bukan bukti publikasi.</p>}
      <PublicationList items={post.data?.slice(0,PAGE_SIZE) ?? []} />
    </div>
    <div className="space-y-2 border-t border-slate-200 pt-3">
      <h3 className="font-bold">Riwayat tindakan terbaru</h3>
      {history.isError && <p role="alert" className="text-sm text-red-700">{errorText(history.error)}</p>}
      {history.isSuccess && !history.data.length && <p className="text-sm text-slate-600">Belum ada tindakan tercatat.</p>}
      <ul className="space-y-2 text-sm">{history.data?.slice(0,PAGE_SIZE).map(event => <li key={event.id}><span className="text-slate-600 dark:text-slate-400">{when(event.created_at)} · </span>{describeEvent(event.kind,event.detail)}</li>)}</ul>
    </div>
    {viewingTemplate && (
      <CopyScriptViewerModal
        template={viewingTemplate}
        onClose={() => setViewingTemplate(null)}
      />
    )}
  </section>;
}

export function CreativeInbox({ userId, counts, evaluations, onFocus, onAds, onTask, onDecisions }: {
  userId: string; counts?: { review: number; overdue: number; blocked: number }; evaluations?: number;
  onFocus: (focus: Focus) => void; onAds: () => void; onTask: (id: string) => void; onDecisions: () => void;
}) {
  const [page, setPage] = useState(0);
  const query = useQuery({ queryKey: ['creative',userId,'task-events','inbox',page], queryFn: ({ signal }) => taskEvents('inbox',userId,signal,page) });
  return <section className="sa-surface space-y-4 p-4 sm:p-5" aria-label="Kotak tindakan">
    <div><h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Kotak tindakan</h2><p className="text-sm text-slate-600 dark:text-slate-400">Antrean dari lingkup terpilih dan permintaan yang dikirim ke Anda.</p></div>
    <div className="flex flex-wrap gap-2">
      <button type="button" className={button} onClick={onDecisions}>Review &amp; persetujuan saya</button>
      <button className={button} onClick={() => onFocus('ready')}>Buka antrean siap tayang</button>
      {counts && <><button className={button} onClick={() => onFocus('review')}>{counts.review} menunggu review</button>
        <button className={button} onClick={() => onFocus('overdue')}>{counts.overdue} terlambat</button>
        <button className={button} onClick={() => onFocus('blocked')}>{counts.blocked} terhambat</button></>}
      {evaluations !== undefined && <button className={button} onClick={onAds}>{evaluations} evaluasi terlambat</button>}
    </div>
    <h3 className="font-semibold">Permintaan tindak lanjut untuk saya · semua unit</h3>
    {query.isPending && <p role="status" className="text-sm">Memuat kotak tindakan…</p>}
    {query.isError && <p role="alert" className="text-sm text-red-700">{errorText(query.error)}</p>}
    {query.isSuccess && !query.data.length && <p className="text-sm text-slate-600">Belum ada permintaan tindak lanjut.</p>}
    <ul className="divide-y divide-slate-200">{query.data?.slice(0,PAGE_SIZE).map(event => <li className="flex flex-wrap items-center justify-between gap-2 py-3" key={event.id}>
      <div><h4 className="font-semibold">{event.task?.title ?? 'Tugas'}</h4><p className="text-sm text-slate-600">{event.detail} · {when(event.created_at)}</p></div>
      <button className={button} onClick={() => onTask(event.task_id)}>Buka tugas</button>
    </li>)}</ul>
    <CreativePager page={page} next={(query.data?.length ?? 0)>PAGE_SIZE} onPage={setPage} />
  </section>;
}

export function CreativeDecisionQueue({ userId, unit, scope, onTask }: {
  userId: string; unit: string; scope: string; onTask: (id: string) => void;
}) {
  const [page, setPage] = useState(0);
  const decisions = useQuery({ queryKey: ['creative', userId, 'tasks', 'waiting-for-me', unit, scope, page],
    queryFn: ({ signal }) => pendingTaskDecisions(userId, page, signal, unit, scope) });

  return <section className="sa-surface space-y-3 p-4 sm:p-5" aria-label="Menunggu keputusan saya">
    <div><h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Menunggu saya</h2><p className="text-sm text-slate-600 dark:text-slate-400">Tugas yang ditugaskan kepada Anda dalam unit dan kampanye terpilih.</p></div>
    {decisions.isPending && <p role="status" className="text-sm">Memuat antrean keputusan…</p>}
    {decisions.isError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{errorText(decisions.error)}</p>}
    {decisions.isSuccess && !decisions.data.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-white/[0.04] dark:text-slate-400">Tidak ada review atau persetujuan yang menunggu Anda di halaman ini.</p>}
    <ul className="divide-y divide-slate-200 dark:divide-white/[0.06]">{decisions.data?.slice(0, PAGE_SIZE).map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div><h3 className="font-semibold">{item.title}</h3><p className="text-sm text-slate-600">{item.status === 'review' ? 'Review' : 'Persetujuan akhir'}{item.due_on ? ` · Deadline ${item.due_on}` : ''}</p></div>
      <button type="button" className={button} onClick={() => onTask(item.id)}>Buka keputusan</button>
    </li>)}</ul>
    <CreativePager page={page} next={(decisions.data?.length ?? 0) > PAGE_SIZE} onPage={setPage} />
  </section>;
}
