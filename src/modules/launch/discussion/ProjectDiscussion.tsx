import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DISCUSSION_PAGE_SIZE, isProjectId, loadDiscussion, MAX_COMMENT_LENGTH, postDiscussion, type DiscussionScope } from './repository';

const button = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50';
const timestamp = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' });

type Props = { scope: DiscussionScope; projectId: string; userId: string; canPost: boolean };

export function ProjectDiscussion(props: Props) {
  return <DiscussionPanel key={props.scope + ':' + props.projectId + ':' + props.userId} {...props} />;
}

function DiscussionPanel({ scope, projectId, userId, canPost }: Props) {
  const client = useQueryClient();
  const [page, setPage] = useState(0);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const valid = isProjectId(projectId);
  const key = ['project-discussion', userId, scope, projectId];
  const query = useQuery({
    queryKey: [...key, page], enabled: valid,
    queryFn: ({ signal }) => loadDiscussion(scope, projectId, page, signal),
    staleTime: 60_000, retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false,
  });
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canPost || !draft.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      await postDiscussion(scope, projectId, userId, draft);
      setDraft('');
      await client.invalidateQueries({ queryKey: key, refetchType: 'none' });
      if (page === 0) void client.refetchQueries({ queryKey: [...key, 0], exact: true, type: 'active' });
      else setPage(0);
    } catch {
      setError('Komentar belum terkirim. Periksa koneksi atau izin proyek, lalu coba lagi.');
    } finally {
      setSending(false);
    }
  }
  if (!valid) return <p className="text-sm text-slate-600">Diskusi tersedia setelah proyek tersimpan.</p>;
  return <section className="mx-auto max-w-4xl space-y-4 rounded-xl border border-slate-200 bg-white p-4" aria-label="Diskusi proyek">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 className="text-lg font-bold">Diskusi proyek</h2>
        <p className="text-sm text-slate-600">Catat masukan, keputusan tim, atau tindak lanjut. Gunakan Segarkan untuk memuat komentar terbaru.</p>
      </div>
      <button type="button" className={button} disabled={query.isFetching || sending} onClick={() => {
        if (page === 0) void query.refetch();
        else { void client.invalidateQueries({ queryKey: key, refetchType: 'none' }); setPage(0); }
      }}>Segarkan</button>
    </div>
    {canPost && <form className="space-y-2" onSubmit={send}>
      <label className="block text-sm font-semibold">Komentar
        <textarea className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-sm" rows={3}
          required maxLength={MAX_COMMENT_LENGTH} value={draft} disabled={sending} onChange={event => setDraft(event.target.value)} />
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={sending || !draft.trim()} className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {sending ? 'Mengirim…' : 'Kirim komentar'}
      </button>
    </form>}
    {query.isPending && <p role="status" className="text-sm text-slate-600">Memuat diskusi…</p>}
    {query.isError && <p role="alert" className="text-sm text-red-700">Diskusi belum dapat dimuat. Coba tekan Segarkan.</p>}
    {query.isSuccess && !query.data.length && <p className="text-sm text-slate-600">Belum ada komentar pada halaman ini.</p>}
    <ul className="divide-y divide-slate-200">
      {query.data?.slice(0, DISCUSSION_PAGE_SIZE).map(comment => <li key={comment.id} className="space-y-1 py-3">
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <strong>{comment.authorName}</strong>
          <time dateTime={comment.createdAt} className="text-slate-600">{timestamp.format(new Date(comment.createdAt))} WIB</time>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm">{comment.body}</p>
      </li>)}
    </ul>
    {(page > 0 || (query.data?.length ?? 0) > DISCUSSION_PAGE_SIZE) && <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={button} disabled={sending || page === 0} onClick={() => setPage(page - 1)}>Lebih baru</button>
      <span className="text-sm">Halaman {page + 1}</span>
      <button type="button" className={button} disabled={sending || (query.data?.length ?? 0) <= DISCUSSION_PAGE_SIZE} onClick={() => setPage(page + 1)}>Lebih lama</button>
    </div>}
  </section>;
}
