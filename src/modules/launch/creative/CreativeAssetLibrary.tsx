import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Image, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CreativePager } from './CreativeAccounts';
import { button, errorText, field } from './CreativeForms';
import { isDemoText, PAGE_SIZE, safeOutputUrl } from './repository';

export function CreativeAssetLibrary({ userId, unit, scope, onTask }: {
  userId: string; unit: string; scope: string; onTask: (id: string) => void;
}) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const assets = useQuery({
    queryKey: ['creative', userId, 'tasks', 'assets', unit, scope, page],
    queryFn: async ({ signal }) => {
      const start = page * PAGE_SIZE;
      let query = supabase.from('creative_tasks').select('id,title,output_url').neq('output_url', '');
      if (unit !== 'all') query = unit === 'unassigned' ? query.is('business_unit_id', null) : query.eq('business_unit_id', unit);
      if (scope !== 'all') query = scope === 'standalone' ? query.is('campaign_id', null) : query.eq('campaign_id', scope);
      const { data, error } = await query.order('updated_at', { ascending: false }).order('id').range(start, start + PAGE_SIZE).abortSignal(signal);
      if (error) throw error;
      return (data ?? []).filter(item => !isDemoText(item.title) && !/example\.com/i.test(item.output_url ?? ''));
    },
  });

  const q = search.trim().toLowerCase();
  const visibleAssets = (assets.data ?? [])
    .slice(0, PAGE_SIZE)
    .filter(asset => !q || `${asset.title} ${asset.output_url}`.toLowerCase().includes(q));

  return (
    <section className="sa-surface space-y-3 p-4 sm:p-5" aria-label="Pustaka Aset Creative">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Tautan hasil produksi</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Aset diambil dari tautan hasil yang sudah disimpan di tugas Creative.
          </p>
        </div>
        <div className="relative min-w-[200px]">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari judul atau domain aset…"
            aria-label="Cari aset"
            className={`${field} !h-8 !rounded-full !py-1 !pl-8 !pr-3 !text-xs`}
          />
        </div>
      </div>

      {assets.isPending && <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Memuat aset…</p>}
      {assets.isError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{errorText(assets.error)}</p>}
      {assets.isSuccess && !visibleAssets.length && (
        <p className="rounded-xl bg-slate-50/80 p-4 text-sm text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">
          {q ? 'Tidak ada aset yang cocok dengan pencarian.' : 'Belum ada tautan hasil pada lingkup ini. Tambahkan tautan hasil di form tugas.'}
        </p>
      )}
      <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
        {visibleAssets.map(asset => {
          const url = safeOutputUrl(asset.output_url);
          return (
            <li key={asset.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="creative-color-icon" data-color="mint"><Image size={17} /></span>
              <div className="min-w-0 flex-1 break-words">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{asset.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{url ? new URL(url).hostname : 'Tautan tidak valid'}</p>
              </div>
              <button type="button" className={button} onClick={() => onTask(asset.id)}>Buka tugas</button>
              {url && (
                <a className={`${button} inline-flex items-center gap-1`} href={url} target="_blank" rel="noopener noreferrer">
                  Buka aset <ExternalLink size={13} />
                </a>
              )}
            </li>
          );
        })}
      </ul>
      <CreativePager page={page} next={(assets.data?.length ?? 0) > PAGE_SIZE} onPage={setPage} />
    </section>
  );
}
