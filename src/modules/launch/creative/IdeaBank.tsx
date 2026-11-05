import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { button, errorText, field, IdeaForm, Options, primary } from './CreativeForms';
import { ideas, ideaQueues, PAGE_SIZE, platforms, safeOutputUrl, taskStatuses, type Idea } from './repository';

export function ReferenceLinks({ urls }: { urls: string[] }) {
  const links = [...new Set(urls.map(safeOutputUrl).filter(Boolean))];
  if (!links.length) return null;
  return <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
    {links.map((url, index) => <li key={url}>
      <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-800 underline">
        Referensi {index + 1} · {new URL(url).hostname}
      </a>
    </li>)}
  </ul>;
}

export function IdeaBank({ userId, canEdit, onConvert }: { userId: string; canEdit: boolean; onConvert: (idea: Idea) => void }) {
  const client = useQueryClient();
  const [page, setPage] = useState(0);
  const [priority, setPriority] = useState(false);
  const [queue, setQueue] = useState('');
  const [editor, setEditor] = useState<Idea | 'new' | null>(null);
  const [notice, setNotice] = useState('');
  const query = useQuery({
    queryKey: ['creative', userId, 'ideas', page, priority, queue],
    queryFn: ({ signal }) => ideas(page, priority, queue, signal),
  });
  const saved = () => {
    setEditor(null);
    setPage(0);
    setNotice('Ide tersimpan.');
    void client.invalidateQueries({ queryKey: ['creative', userId, 'ideas'] });
    void client.invalidateQueries({ queryKey: ['creative', userId, 'tasks'] });
  };
  return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4" aria-labelledby="idea-bank-heading">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 id="idea-bank-heading" className="font-bold">Bank Ide &amp; Referensi</h2>
        <p className="mt-1 text-sm text-slate-600">Kumpulkan inspirasi, tandai yang perlu dikerjakan, lalu jadikan tugas untuk tim.</p>
      </div>
      {canEdit && <button className={primary} onClick={() => { setEditor('new'); setNotice(''); }}>Tambah ide</button>}
    </div>
    {notice && <p role="status" className="text-sm text-teal-800">{notice}</p>}
    {editor && canEdit && <IdeaForm key={editor === 'new' ? 'new' : editor.id} idea={editor === 'new' ? undefined : editor}
      onCancel={() => setEditor(null)} onSaved={saved} />}
    <div className="flex flex-wrap gap-3">
      <label className="text-sm font-medium">Antrean
        <select className={field} value={queue} onChange={event => { setQueue(event.target.value); setPage(0); }}>
          <option value="">Semua ide</option><Options values={ideaQueues} />
        </select>
      </label>
      <label className="inline-flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={priority} onChange={event => { setPriority(event.target.checked); setPage(0); }} /> Hanya ide prioritas
      </label>
    </div>
    {query.isPending && <p role="status" className="text-sm text-slate-600">Memuat ide…</p>}
    {query.error && <p role="alert" className="text-sm text-red-700">Ide belum dapat dimuat: {errorText(query.error)}</p>}
    {query.isSuccess && !query.data.length && <p className="text-sm text-slate-600">Belum ada ide pada filter ini.</p>}
    <ul className="divide-y divide-slate-200">
      {query.data?.slice(0, PAGE_SIZE).map(idea => <li key={idea.id} className="flex flex-wrap justify-between gap-3 py-4">
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="break-words font-semibold">{idea.title}</h3>
          <p className="text-sm text-slate-600">{platforms[idea.platform]}{idea.prioritized ? ' · Prioritas' : ''} · {idea.task ? 'Tugas: ' + taskStatuses[idea.task.status] : ideaQueues[idea.queue_state]}</p>
          {idea.brief && <p className="whitespace-pre-wrap break-words text-sm">{idea.brief}</p>}
          <ReferenceLinks urls={idea.reference_urls} />
        </div>
        {canEdit && <div className="flex flex-wrap items-start gap-2">
          <button className={button} onClick={() => { setEditor(idea); setNotice(''); document.getElementById('idea-bank-heading')?.scrollIntoView({ block: 'start' }); }}>Edit ide</button>
          {!idea.task && idea.queue_state === 'ready' && <button className={button} onClick={() => onConvert(idea)}>Jadikan tugas</button>}
        </div>}
      </li>)}
    </ul>
    {(page > 0 || (query.data?.length ?? 0) > PAGE_SIZE) && <div className="flex flex-wrap items-center gap-2">
      <button className={button} disabled={page === 0} onClick={() => setPage(page - 1)}>Sebelumnya</button>
      <span className="text-sm">Halaman {page + 1}</span>
      <button className={button} disabled={(query.data?.length ?? 0) <= PAGE_SIZE} onClick={() => setPage(page + 1)}>Berikutnya</button>
    </div>}
  </section>;
}
