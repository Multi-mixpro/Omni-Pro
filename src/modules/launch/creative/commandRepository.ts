import { supabase } from '@/integrations/supabase/client';
import { PAGE_SIZE, safeOutputUrl, type Task } from './repository';
import { channelPlatforms } from './channelRepository';

export type SocialAccount = {
  id: string; business_unit_id: string; platform: keyof typeof channelPlatforms; handle: string;
  profile_url: string; owner_id: string | null; is_active: boolean; updated_at: string;
};
export type Snapshot = {
  period_start: string; period_end: string; source: 'platform' | 'csv';
  followers: number | null; views: number | null; reach: number | null; link_clicks: number | null;
};
export type Publication = { id: string; published_url: string; published_at: string; account: Pick<SocialAccount, 'handle' | 'platform'> | null };
export type TaskEvent = { id: string; kind: 'status' | 'publication' | 'nudge'; detail: string; created_at: string; task_id: string; task?: { title: string } | null };
const accountFields = 'id,business_unit_id,platform,handle,profile_url,owner_id,is_active,updated_at';

export async function accounts(unit: string, page: number, signal: AbortSignal, activeOnly = false, platform?: string) {
  let query = supabase.from('creative_accounts').select(accountFields);
  if (unit === 'unassigned') return [];
  if (unit !== 'all') query = query.eq('business_unit_id', unit);
  if (activeOnly) query = query.eq('is_active', true);
  if (platform) query = query.eq('platform',platform);
  const { data, error } = await query.order('handle').order('id').range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).abortSignal(signal);
  if (error) throw error;
  return (data ?? []) as SocialAccount[];
}

export async function saveAccount(draft: Omit<SocialAccount, 'id' | 'updated_at'>, previous?: SocialAccount) {
  const table = supabase.from('creative_accounts');
  const query = previous ? table.update(draft).eq('id', previous.id).eq('updated_at', previous.updated_at) : table.insert(draft);
  const { data, error } = await query.select('id').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Akun berubah. Segarkan sebelum menyimpan.');
  return data.id as string;
}

export async function accountSnapshots(id: string, page: number, signal: AbortSignal) {
  const { data, error } = await supabase.from('creative_account_snapshots').select('period_start,period_end,source,followers,views,reach,link_clicks')
    .eq('account_id', id).order('period_end', { ascending: false }).order('period_start', { ascending: false }).order('source')
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).abortSignal(signal);
  if (error) throw error;
  return (data ?? []) as Snapshot[];
}

export async function saveSnapshot(id: string, snapshot: Snapshot) {
  const { error } = await supabase.from('creative_account_snapshots').upsert({ ...snapshot, account_id: id, recorded_at: new Date().toISOString() },
    { onConflict: 'account_id,period_start,period_end,source' });
  if (error) throw error;
  return id;
}

export type PostSnapshot = Omit<Snapshot, 'followers' | 'source'>;
export async function publicationSnapshots(id: string, page: number, signal: AbortSignal) {
  const { data,error } = await supabase.from('creative_publication_snapshots').select('period_start,period_end,views,reach,link_clicks')
    .eq('publication_id',id).order('period_end',{ ascending:false }).order('period_start',{ ascending:false })
    .range(page*PAGE_SIZE,(page+1)*PAGE_SIZE).abortSignal(signal);
  if (error) throw error;
  return (data ?? []) as PostSnapshot[];
}
export async function savePublicationSnapshot(id: string, snapshot: PostSnapshot) {
  const { error } = await supabase.from('creative_publication_snapshots')
    .upsert({ ...snapshot,publication_id:id,recorded_at:new Date().toISOString() }, { onConflict:'publication_id,period_start,period_end' });
  if (error) throw error;
  return id;
}

export async function publications(column: 'task_id' | 'account_id', id: string, page: number, signal: AbortSignal) {
  const { data, error } = await supabase.from('creative_publications').select('id,published_url,published_at,account:creative_accounts(handle,platform)')
    .eq(column, id).order('published_at', { ascending: false }).order('id').range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).abortSignal(signal);
  if (error) throw error;
  return (data ?? []) as unknown as Publication[];
}

export async function publicationTaskId(id: string) {
  const { data,error } = await supabase.from('creative_publications').select('task_id').eq('id',id).single();
  if (error) throw error;
  return data.task_id as string;
}

export async function recordPublication(task: Task, account: string, url: string, publishedAt: string) {
  const link = safeOutputUrl(url);
  if (!link) throw new Error('Masukkan tautan publik HTTP atau HTTPS yang valid.');
  const { data, error } = await supabase.rpc('record_creative_publication', {
    p_task: task.id, p_account: account, p_url: link, p_published_at: publishedAt, p_version: task.updated_at,
  });
  if (error?.code === '23505') throw new Error('Publikasi pada akun ini sudah tercatat.');
  if (error) throw error;
  return data as string;
}

export async function nudgeTask(task: string) {
  const { data, error } = await supabase.rpc('nudge_creative_task', { p_task: task });
  if (error) throw error;
  return Boolean(data);
}

export async function taskEvents(scope: 'task' | 'inbox', id: string, signal: AbortSignal, page = 0) {
  let query = supabase.from('creative_task_events').select('id,kind,detail,created_at,task_id,task:creative_tasks(title)');
  query = scope === 'task' ? query.eq('task_id', id) : query.eq('recipient_id', id).eq('kind', 'nudge');
  const { data, error } = await query.order('created_at', { ascending: false }).order('id').range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).abortSignal(signal);
  if (error) throw error;
  return (data ?? []) as unknown as TaskEvent[];
}
