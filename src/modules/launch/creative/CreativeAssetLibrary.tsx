import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CreativePager } from './CreativeAccounts';
import { button, errorText } from './CreativeForms';
import { PAGE_SIZE, safeOutputUrl } from './repository';

export function CreativeAssetLibrary({ userId, unit, scope, onTask }: {
  userId: string; unit: string; scope: string; onTask: (id: string) => void;
}) {
  const [page, setPage] = useState(0);
  const assets = useQuery({
    queryKey: ['creative', userId, 'tasks', 'assets', unit, scope, page],
    queryFn: async ({ signal }) => {
      const start = page * PAGE_SIZE;
      let query = supabase.from('creative_tasks').select('id,title,output_url').neq('output_url', '');
      if (unit !== 'all') query = unit === 'unassigned' ? query.is('business_unit_id', null) : query.eq('business_unit_id', unit);
      if (scope !== 'all') query = scope === 'standalone' ? query.is('campaign_id', null) : query.eq('campaign_id', scope);
      const { data, error } = await query.order('updated_at', { ascending: false }).order('id').range(start, start + PAGE_SIZE).abortSignal(signal);
      if (error) throw error;
      return data ?? [];
    },
  });

  return <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4" aria-label="Pustaka Aset Creative">
    <div><h2 className="text-lg font-bold">Tautan hasil produksi</h2><p className="text-sm text-slate-600">Aset diambil dari tautan hasil yang sudah disimpan di tugas Creative.</p></div>
    {assets.isPending && <p role="status" className="text-sm text-slate-600">Memuat aset…</p>}
    {assets.isError && <p role="alert" className="text-sm text-red-700">{errorText(assets.error)}</p>}
    {assets.isSuccess && !assets.data.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Belum ada tautan hasil pada lingkup ini. Tambahkan tautan hasil di form tugas.</p>}
    <ul className="divide-y divide-slate-100">{assets.data?.slice(0, PAGE_SIZE).map(asset => {
      const url = safeOutputUrl(asset.output_url);
      return <li key={asset.id} className="flex flex-wrap items-center gap-3 py-3">
        <span className="creative-color-icon" data-color="mint"><Image size={17} /></span>
        <div className="min-w-0 flex-1 break-words"><h3 className="font-semibold">{asset.title}</h3><p className="text-xs text-slate-600">{url ? new URL(url).hostname : 'Tautan tidak valid'}</p></div>
        <button type="button" className={button} onClick={() => onTask(asset.id)}>Buka tugas</button>
        {url && <a className={`${button} inline-flex items-center gap-1`} href={url} target="_blank" rel="noopener noreferrer">Buka aset <ExternalLink size={13} /></a>}
      </li>;
    })}</ul>
    <CreativePager page={page} next={(assets.data?.length ?? 0) > PAGE_SIZE} onPage={setPage} />
  </section>;
}
