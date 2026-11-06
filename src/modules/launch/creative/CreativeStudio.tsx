import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { CreativePager } from './CreativeAccounts';
import { button, errorText, primary } from './CreativeForms';
import { PAGE_SIZE, tasks, taskStatuses, type Task } from './repository';

export function CreativeStudio({ userId, unit, campaign, canEdit, onOpen, onEdit }: {
  userId: string; unit: string; campaign: string | null; canEdit: boolean;
  onOpen: (id: string) => void; onEdit: (task: Task) => void;
}) {
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ['creative', userId, 'tasks', 'studio', unit, campaign, page],
    queryFn: ({ signal }) => tasks(campaign, { platform: '', status: '', assignee: '', order: 'due_on', workstream: 'creative' }, page, signal, 'all', '', unit),
  });

  return <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4" aria-label="Studio brief dan copy">
    <div><h2 className="text-lg font-bold">Brief dan naskah produksi</h2><p className="text-sm text-slate-600">Lengkapi brief, tulis naskah, lalu buka riwayat versi dan keputusan dari tugas yang sama.</p></div>
    {query.isPending && <p role="status" className="text-sm text-slate-600">Memuat tugas kreatif…</p>}
    {query.isError && <p role="alert" className="text-sm text-red-700">{errorText(query.error)}</p>}
    {query.isSuccess && !query.data.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Belum ada tugas produksi konten di lingkup ini.</p>}
    <ul className="divide-y divide-slate-100">{query.data?.slice(0, PAGE_SIZE).map(row => {
      const objective = row.creative_brief?.objective;
      return <li key={row.id} className="flex flex-wrap items-center gap-3 py-3">
        <span className="creative-studio-icon"><FileText size={17} /></span>
        <div className="min-w-0 flex-1 break-words"><h3 className="font-semibold">{row.title}</h3>
          <p className="text-xs text-slate-600">{taskStatuses[row.status]} · {row.campaign?.name ?? 'Tanpa kampanye'}</p>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{typeof objective === 'string' && objective ? objective : row.brief || 'Brief belum diisi.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && <button type="button" className={button} onClick={() => onEdit(row)}>Edit brief</button>}
          <button type="button" className={primary} onClick={() => onOpen(row.id)}>Versi &amp; review</button>
        </div>
      </li>;
    })}</ul>
    <CreativePager page={page} next={(query.data?.length ?? 0) > PAGE_SIZE} onPage={setPage} />
  </section>;
}
