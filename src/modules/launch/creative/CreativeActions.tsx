import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { button, Editor, errorText, field, Label, primary } from './CreativeForms';
import { CreativePager, PublicationList } from './CreativeAccounts';
import { accounts, nudgeTask, publications, recordPublication, taskEvents } from './commandRepository';
import { channelPlatforms } from './channelRepository';
import { getTask, PAGE_SIZE, requestRevision, safeOutputUrl, taskStatuses } from './repository';
import type { Focus } from './schedule';

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
  const unit = row?.business_unit_id ?? 'unassigned';
  const accountQuery = useQuery({ queryKey: [...prefix,'accounts','active',unit,accountPage], enabled: action === 'publish',
    queryFn: ({ signal }) => accounts(unit,accountPage,signal,true) });
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
    {row && <>
      {row.brief && <p className="whitespace-pre-wrap break-words text-sm">{row.brief}</p>}
      {row.review_note && <p className="whitespace-pre-wrap break-words rounded-lg bg-amber-50 p-2 text-sm text-amber-900">Catatan revisi: {row.review_note}</p>}
      {safeOutputUrl(row.output_url) && <a className="text-sm font-semibold text-teal-800 underline" href={safeOutputUrl(row.output_url)} target="_blank" rel="noopener noreferrer">Buka aset / video final internal</a>}
      <div className="flex flex-wrap gap-2">
        {canEdit && row.platform !== 'internal' && row.workstream !== 'operations' && !row.source_activation_id && ['ready','done'].includes(row.status) &&
          <button className={primary} onClick={() => { setAccountPage(0); setAction('publish'); }}>Catat tayang</button>}
        {canEdit && row.status === 'review' && <button className={button} onClick={() => setAction('revision')}>Kembalikan untuk revisi</button>}
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
  const query = useQuery({ queryKey: ['creative',userId,'task-events','inbox',page], queryFn: ({ signal }) => taskEvents('inbox',userId,signal,page) });
  return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4" aria-label="Kotak tindakan">
    <div><h2 className="text-lg font-bold">Kotak tindakan</h2><p className="text-sm text-slate-600">Antrean dari lingkup terpilih dan permintaan yang dikirim ke Anda.</p></div>
    <div className="flex flex-wrap gap-2">
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
