import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CreativePager } from './CreativeAccounts';
import { button, Editor, errorText, field, Label, Options } from './CreativeForms';

const formats = { caption: 'Caption', hook: 'Hook video', script: 'Skrip video', listing: 'Listing produk', ad: 'Iklan', other: 'Lainnya' };
const stages = { review: 'Review', approval: 'Persetujuan akhir' };
type Stage = keyof typeof stages;
type Decision = { stage: Stage; outcome: 'accepted' | 'changes_requested'; note: string; decided_at: string };
type CopyVersion = { id: string; version: number; format: keyof typeof formats; body: string; change_note: string; created_at: string; decisions: Decision[] };
const pageSize = 8;
const timestamp = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' });

export function CreativeCopyVersions({ taskId, userId, canEdit, reviewerId, approverId }: {
  taskId: string; userId: string; canEdit: boolean; reviewerId?: string | null; approverId?: string | null;
}) {
  const client = useQueryClient();
  const [page, setPage] = useState(0);
  const [draft, setDraft] = useState<CopyVersion | 'new' | null>(null);
  const [decision, setDecision] = useState<{ id: string; stage: Stage } | null>(null);
  const key = ['creative', userId, 'copy-versions', taskId];
  const versions = useQuery({ queryKey: [...key, page], queryFn: async ({ signal }) => {
    const start = page * pageSize;
    const { data, error } = await supabase.from('creative_copy_versions')
      .select('id,version,format,body,change_note,created_at,decisions:creative_copy_decisions(stage,outcome,note,decided_at)').eq('task_id', taskId)
      .order('version', { ascending: false }).range(start, start + pageSize).abortSignal(signal);
    if (error) throw error;
    return data as CopyVersion[];
  } });
  const template = draft && draft !== 'new' ? draft : null;

  return <section className="space-y-3 border-t border-slate-200 pt-3" aria-label="Versi copy">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-bold">Versi copy</h3>
      {canEdit && !draft && <button type="button" className={button} onClick={() => setDraft('new')}>Tulis versi baru</button>}
    </div>
    {draft && <Editor title={template ? `Revisi dari versi ${template.version}` : 'Versi copy baru'} onCancel={() => setDraft(null)}
      onSaved={() => { setDraft(null); setPage(0); void client.invalidateQueries({ queryKey: key }); }}
      onSave={async data => {
        const body = String(data.get('body') ?? '').trim();
        if (!body) throw new Error('Isi naskah sebelum menyimpan.');
        const { data: row, error } = await supabase.from('creative_copy_versions').insert({
          task_id: taskId, format: data.get('format'), body, change_note: String(data.get('note') ?? '').trim(),
        }).select('id').single();
        if (error) throw error;
        return row.id as string;
      }}>
      <Label title="Jenis copy"><select className={field} name="format" defaultValue={template?.format ?? 'caption'}><Options values={formats} /></select></Label>
      <Label title="Catatan perubahan"><input className={field} name="note" maxLength={1000} /></Label>
      <div className="sm:col-span-2"><Label title="Naskah"><textarea className={field} name="body" rows={6} required maxLength={12000} defaultValue={template?.body} /></Label></div>
    </Editor>}
    {versions.isPending && <p role="status" className="text-sm">Memuat versi copy…</p>}
    {versions.isError && <p role="alert" className="text-sm text-red-700">{errorText(versions.error)}</p>}
    {versions.isSuccess && !versions.data.length && <p className="text-sm text-slate-600">Belum ada versi copy di halaman ini.</p>}
    {versions.data?.slice(0, pageSize).map(item => {
      const review = item.decisions.find(record => record.stage === 'review');
      const approval = item.decisions.find(record => record.stage === 'approval');
      const needsRevision = review?.outcome === 'changes_requested' || approval?.outcome === 'changes_requested';
      const status = needsRevision ? 'Perlu revisi' : approval?.outcome === 'accepted' ? 'Disetujui akhir'
        : approverId && (!reviewerId || review?.outcome === 'accepted') ? 'Menunggu persetujuan akhir'
          : review?.outcome === 'accepted' ? 'Lulus review' : reviewerId ? 'Menunggu review' : 'Draf';
      const mayReview = canEdit && reviewerId === userId && !review && !approval;
      const mayApprove = canEdit && approverId === userId && !approval && !needsRevision && (!reviewerId || review?.outcome === 'accepted');
      const currentDecision = decision?.id === item.id ? decision : null;
      return <details key={item.id} className="rounded-lg border border-slate-200 p-2">
        <summary className="cursor-pointer text-sm font-semibold">Versi {item.version} · {formats[item.format]} · {status}</summary>
        <p className="mt-2 text-xs text-slate-600">Disimpan {timestamp.format(new Date(item.created_at))} WIB</p>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm">{item.body}</p>
        {item.change_note && <p className="mt-2 break-words text-sm text-slate-600">{item.change_note}</p>}
        {[review, approval].map(record => record && <div key={record.stage} className="mt-2 rounded bg-slate-50 p-2 text-sm">
          <p className="font-semibold">{stages[record.stage]} · {record.outcome === 'accepted' ? 'Disetujui' : 'Perlu revisi'}</p>
          <p className="text-xs text-slate-600">{timestamp.format(new Date(record.decided_at))} WIB</p>
          {record.note && <p className="whitespace-pre-wrap break-words">{record.note}</p>}
        </div>)}
        <div className="mt-2 flex flex-wrap gap-2">
          {mayReview && !decision && <button type="button" className={button} onClick={() => setDecision({ id: item.id, stage: 'review' })}>Catat review</button>}
          {mayApprove && !decision && <button type="button" className={button} onClick={() => setDecision({ id: item.id, stage: 'approval' })}>Catat persetujuan akhir</button>}
          {canEdit && !draft && <button type="button" className={button} onClick={() => setDraft(item)}>Gunakan sebagai dasar revisi</button>}
        </div>
        {currentDecision && <Editor title={`${stages[currentDecision.stage]} · Versi ${item.version}`} onCancel={() => setDecision(null)}
          onSaved={() => { setDecision(null); void client.invalidateQueries({ queryKey: key }); }}
          onSave={async data => {
            const outcome = String(data.get('outcome') ?? '');
            const note = String(data.get('decisionNote') ?? '').trim();
            if (outcome === 'changes_requested' && !note) throw new Error('Jelaskan perubahan yang diperlukan.');
            const { data: row, error } = await supabase.from('creative_copy_decisions')
              .insert({ version_id: item.id, stage: currentDecision.stage, outcome, note }).select('id').single();
            if (error) throw error;
            return row.id as string;
          }}>
          <Label title="Keputusan"><select name="outcome" className={field}>
            <option value="accepted">Setujui versi ini</option><option value="changes_requested">Minta revisi</option>
          </select></Label>
          <Label title="Catatan keputusan"><textarea name="decisionNote" className={field} maxLength={1000} /></Label>
        </Editor>}
      </details>;
    })}
    <CreativePager page={page} next={(versions.data?.length ?? 0) > pageSize} onPage={setPage} />
  </section>;
}
