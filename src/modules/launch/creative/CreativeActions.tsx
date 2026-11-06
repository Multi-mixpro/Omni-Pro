import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { button, Editor, errorText, field, Label, primary } from './CreativeForms';
import { CreativePager, PublicationList } from './CreativeAccounts';
import { accounts, nudgeTask, publications, recordPublication, taskEvents } from './commandRepository';
import { channelPlatforms } from './channelRepository';
import { advanceTask, approveTask, briefFields, getTask, PAGE_SIZE, pendingTaskDecisions, platforms, requestRevision, safeOutputUrl, setTaskChecklistItem, taskStatuses } from './repository';
import type { Focus } from './schedule';
import { ProjectDiscussion } from '../discussion/ProjectDiscussion';
import { CreativeCopyVersions } from './CreativeCopyVersions';

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
  const task = useQuery({ queryKey: [...prefix,'task-detail',taskId], queryFn: ({ signal }) => getTask(taskId,signal) });
  const post = useQuery({ queryKey: [...prefix,'publications','task',taskId], queryFn: ({ signal }) => publications('task_id',taskId,0,signal) });
  const history = useQuery({ queryKey: [...prefix,'task-events','task',taskId], queryFn: ({ signal }) => taskEvents('task',taskId,signal) });
  const row = task.data;
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
  const unit = row?.business_unit_id ?? 'unassigned';
  const taskPlatforms = row?.additional_platforms?.length ? [row.platform, ...row.additional_platforms] : undefined;
  const accountQuery = useQuery({ queryKey: [...prefix,'accounts','active',unit,accountPage,taskPlatforms], enabled: action === 'publish',
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
      {taskPlatforms && <p className="text-sm text-slate-600">
        Platform yang memerlukan bukti tayang: {taskPlatforms.map(platform => platforms[platform]).join(', ')}
      </p>}
      {row.brief && <p className="whitespace-pre-wrap break-words text-sm">{row.brief}</p>}
      {briefEntries.length > 0 && <details className="rounded-lg border border-slate-200 p-3">
        <summary className="cursor-pointer text-sm font-semibold">Brief kreatif</summary>
        <dl className="mt-2 grid gap-2 sm:grid-cols-2">{briefEntries.map(({ label, value }) => <div key={label}>
          <dt className="text-sm font-semibold">{label}</dt><dd className="whitespace-pre-wrap break-words text-sm">{value}</dd>
        </div>)}</dl>
      </details>}
      {([
        ['Hasil yang harus diserahkan', row.deliverable],
        ['Kriteria penerimaan', row.acceptance_criteria],
        ['Catatan bukti hasil', row.completion_note],
      ] as const).map(([label, value]) => value && <div key={label}>
        <h3 className="text-sm font-semibold">{label}</h3>
        <p className="whitespace-pre-wrap break-words text-sm">{value}</p>
      </div>)}
      {checklist.length > 0 && <fieldset className="space-y-2 rounded-lg border border-slate-200 p-3"
        disabled={!canEdit || row.status === 'done' || row.status === 'cancelled' || checklistUpdate.isPending}>
        <legend className="px-1 text-sm font-semibold">Checklist · {checklist.filter(item => item.done).length}/{checklist.length} selesai</legend>
        {checklist.map((item, index) => <label key={`${index}-${item.label}`} className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={item.done} onChange={event => checklistUpdate.mutate({ index, done: event.target.checked })} />
          <span className="break-words">{item.label}</span>
        </label>)}
        {checklistUpdate.isError && <p role="alert" className="text-sm text-red-700">{errorText(checklistUpdate.error)}</p>}
      </fieldset>}
      {row.review_note && <p className="whitespace-pre-wrap break-words rounded-lg bg-amber-50 p-2 text-sm text-amber-900">Catatan revisi: {row.review_note}</p>}
      {row.reviewed_at && <p className="text-sm text-teal-800">Review disetujui pada {when(row.reviewed_at)}.</p>}
      {row.approved_at && <p className="text-sm text-teal-800">Persetujuan akhir tercatat pada {when(row.approved_at)}.</p>}
      {row.status === 'ready' && awaitingApproval && <p className="text-sm font-semibold text-amber-800">Menunggu persetujuan akhir sebelum tayang atau selesai.</p>}
      {row.status === 'review' && row.reviewer_id && row.reviewer_id !== userId && <p className="text-sm text-slate-600">Menunggu keputusan reviewer yang ditugaskan.</p>}
      {safeOutputUrl(row.output_url) && <a className="text-sm font-semibold text-teal-800 underline" href={safeOutputUrl(row.output_url)} target="_blank" rel="noopener noreferrer">Buka aset / video final internal</a>}
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
        {accountQuery.isSuccess && !accountQuery.data.length && <p className="text-sm text-slate-600">Belum ada akun aktif. Tambahkan akun di Akun &amp; Performa.</p>}
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
      <ul className="space-y-2 text-sm">{history.data?.slice(0,PAGE_SIZE).map(event => <li key={event.id}><span className="text-slate-600">{when(event.created_at)} · </span>{describeEvent(event.kind,event.detail)}</li>)}</ul>
    </div>
  </section>;
}

export function CreativeInbox({ userId, counts, evaluations, onFocus, onAds, onTask }: {
  userId: string; counts?: { review: number; overdue: number; blocked: number }; evaluations?: number;
  onFocus: (focus: Focus) => void; onAds: () => void; onTask: (id: string) => void;
}) {
  const [page, setPage] = useState(0);
  const [decisionPage, setDecisionPage] = useState(0);
  const query = useQuery({ queryKey: ['creative',userId,'task-events','inbox',page], queryFn: ({ signal }) => taskEvents('inbox',userId,signal,page) });
  const decisions = useQuery({ queryKey: ['creative',userId,'tasks','waiting-for-me',decisionPage],
    queryFn: ({ signal }) => pendingTaskDecisions(userId,decisionPage,signal) });
  return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4" aria-label="Kotak tindakan">
    <div><h2 className="text-lg font-bold">Kotak tindakan</h2><p className="text-sm text-slate-600">Antrean dari lingkup terpilih dan permintaan yang dikirim ke Anda.</p></div>
    <div className="flex flex-wrap gap-2">
      <button className={button} onClick={() => onFocus('ready')}>Buka antrean siap tayang</button>
      {counts && <><button className={button} onClick={() => onFocus('review')}>{counts.review} menunggu review</button>
        <button className={button} onClick={() => onFocus('overdue')}>{counts.overdue} terlambat</button>
        <button className={button} onClick={() => onFocus('blocked')}>{counts.blocked} terhambat</button></>}
      {evaluations !== undefined && <button className={button} onClick={onAds}>{evaluations} evaluasi terlambat</button>}
    </div>
    <div className="space-y-2 border-t border-slate-200 pt-3">
      <h3 className="font-semibold">Menunggu saya · semua unit</h3>
      {decisions.isPending && <p role="status" className="text-sm">Memuat antrean keputusan…</p>}
      {decisions.isError && <p role="alert" className="text-sm text-red-700">{errorText(decisions.error)}</p>}
      {decisions.isSuccess && !decisions.data.length && <p className="text-sm text-slate-600">Tidak ada review atau persetujuan yang menunggu Anda di halaman ini.</p>}
      <ul className="divide-y divide-slate-200">{decisions.data?.slice(0,PAGE_SIZE).map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
        <div><h4 className="font-semibold">{item.title}</h4><p className="text-sm text-slate-600">{item.status === 'review' ? 'Review' : 'Persetujuan akhir'}{item.due_on ? ` · Deadline ${item.due_on}` : ''}</p></div>
        <button type="button" className={button} onClick={() => onTask(item.id)}>Buka tugas</button>
      </li>)}</ul>
      <CreativePager page={decisionPage} next={(decisions.data?.length ?? 0)>PAGE_SIZE} onPage={setDecisionPage} />
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
