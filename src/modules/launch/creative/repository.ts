import { supabase } from '@/integrations/supabase/client';
import { mondayWeek, type Focus } from './schedule';

export const platforms = {
  instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', facebook: 'Facebook',
  whatsapp: 'WhatsApp', marketplace: 'Marketplace', website: 'Website', internal: 'Internal', other: 'Lainnya',
};
export const taskStatuses = {
  todo: 'Belum mulai', doing: 'Dikerjakan', review: 'Review', ready: 'Siap tayang',
  done: 'Selesai / tayang', blocked: 'Terhambat', cancelled: 'Dibatalkan',
};
export const campaignStatuses = { planned: 'Direncanakan', active: 'Aktif', completed: 'Selesai', archived: 'Diarsipkan' };
export const priorities = { normal: 'Normal', high: 'Tinggi', urgent: 'Mendesak' };
export const ideaQueues = { candidate: 'Perlu ditinjau', ready: 'Siap dikerjakan', parked: 'Ditunda' };
type Row = { id: string; updated_at: string };
export type Campaign = Row & {
  name: string; objective: string; owner_id: string | null; status: keyof typeof campaignStatuses;
  starts_on: string | null; ends_on: string | null; budget_idr: number; spent_idr: number;
};
export type Task = Row & {
  campaign_id: string | null; title: string; brief: string; assignee_id: string | null;
  platform: keyof typeof platforms; format: string; status: keyof typeof taskStatuses;
  priority: keyof typeof priorities; due_on: string | null; publish_on: string | null;
  output_url: string; blocker: string;
};
export type TeamMember = { id: string; full_name: string; is_active: boolean };
type ListedTask = Task & {
  campaign: { name: string } | null;
  source_idea: { title: string; reference_urls: string[] } | null;
};
export type Idea = Row & {
  title: string; brief: string; platform: Task['platform']; reference_urls: string[]; prioritized: boolean;
  queue_state: keyof typeof ideaQueues;
};
export type ListedIdea = Idea & { task: Pick<Task, 'id' | 'status'> | null };
export type Draft<T> = Omit<T, keyof Row>;
export const PAGE_SIZE = 30;

const campaignColumns = 'id,name,objective,owner_id,status,starts_on,ends_on,budget_idr,spent_idr,updated_at';
const taskColumns = 'id,campaign_id,title,brief,assignee_id,platform,format,status,priority,due_on,publish_on,output_url,blocker,updated_at';

export async function campaigns(page: number, signal: AbortSignal) {
  const start = page * PAGE_SIZE;
  const { data, error } = await supabase.from('creative_campaigns').select(campaignColumns)
    .order('name').order('id').range(start, start + PAGE_SIZE).abortSignal(signal);
  if (error) throw error;
  return data as Campaign[];
}

export async function team(signal: AbortSignal) {
  const { data, error } = await supabase.from('profiles').select('id,full_name,is_active')
    .order('full_name').abortSignal(signal);
  if (error) throw error;
  return data as TeamMember[];
}

export type Filters = {
  platform: string; status: string; assignee: string; order: 'due_on' | 'publish_on';
};

export async function tasks(campaignId: string | null | 'all', filters: Filters, page: number, signal: AbortSignal,
  focus: Focus = 'all', today = '') {
  const start = page * PAGE_SIZE;
  let query = supabase.from('creative_tasks').select(taskColumns + ',campaign:creative_campaigns(name),source_idea:creative_ideas(title,reference_urls)');
  if (campaignId !== 'all') query = campaignId ? query.eq('campaign_id', campaignId) : query.is('campaign_id', null);
  if (filters.platform) query = query.eq('platform', filters.platform);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.assignee === 'unassigned') query = query.is('assignee_id', null);
  else if (filters.assignee) query = query.eq('assignee_id', filters.assignee);
  if (focus === 'week' || focus === 'publish') {
    const { monday, nextMonday } = mondayWeek(today);
    const column = focus === 'week' ? 'due_on' : 'publish_on';
    query = query.gte(column, monday).lt(column, nextMonday).neq('status', 'cancelled');
  } else if (focus === 'today' || focus === 'overdue') {
    query = (focus === 'today' ? query.eq('due_on', today) : query.lt('due_on', today))
      .not('status', 'in', '(done,cancelled)');
  } else if (focus === 'review') {
    query = query.eq('status', 'review');
  } else if (focus === 'unplanned') {
    query = query.or('assignee_id.is.null,due_on.is.null').not('status', 'in', '(done,cancelled)');
  }
  const { data, error } = await query.order(filters.order, { nullsFirst: false }).order('id')
    .range(start, start + PAGE_SIZE).abortSignal(signal);
  if (error) throw error;
  return data as unknown as ListedTask[];
}

export async function summary(campaignId: string | null, today: string, signal: AbortSignal) {
  const { data, error } = await supabase.rpc('creative_weekly_execution', {
    p_campaign_id: campaignId === 'all' ? null : campaignId, p_all: campaignId === 'all', p_today: today,
  })
    .abortSignal(signal).single();
  if (error) throw error;
  return data as {
    total: number; done: number; blocked: number; overdue: number;
    target: number; closed: number; on_time: number; review: number; unplanned: number;
  };
}

export function safeOutputUrl(value: string) {
  try {
    const url = new URL(value);
    if (/^https?:$/.test(url.protocol) && !url.username && !url.password) return url.href;
  } catch { /* Empty or malformed URL */ }
  return '';
}

export async function ideas(page: number, onlyPriority: boolean, queue: string, signal: AbortSignal) {
  const start = page * PAGE_SIZE;
  let query = supabase.from('creative_ideas')
    .select('id,title,brief,platform,reference_urls,prioritized,queue_state,updated_at,task:creative_tasks(id,status)');
  if (onlyPriority) query = query.eq('prioritized', true);
  if (queue) query = query.eq('queue_state', queue);
  if (queue === 'ready') query = query.is('task', null);
  const { data, error } = await query.order('prioritized', { ascending: false })
    .order('updated_at', { ascending: false }).order('id').range(start, start + PAGE_SIZE).abortSignal(signal);
  if (error) throw error;
  return ((data ?? []) as unknown as (Omit<ListedIdea, 'task'> & { task: ListedIdea['task'] | NonNullable<ListedIdea['task']>[] })[])
    .map(row => ({ ...row, task: Array.isArray(row.task) ? row.task[0] ?? null : row.task }));
}

async function save(table: string, values: Record<string, string | number | boolean | string[] | null>, previous?: Row) {
  const target = supabase.from(table);
  const query = previous
    ? target.update(values).eq('id', previous.id).eq('updated_at', previous.updated_at)
    : target.insert(values);
  const { data, error } = await query.select('id').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Data sudah diubah pengguna lain. Segarkan dan buka ulang sebelum menyimpan.');
  return data.id as string;
}

export const saveCampaign = (values: Draft<Campaign>, previous?: Campaign) => save('creative_campaigns', values, previous);
export async function saveTask(values: Draft<Task>, previous?: Task, sourceIdeaId?: string) {
  try {
    return await save('creative_tasks', { ...values, ...(!previous && sourceIdeaId ? { source_idea_id: sourceIdeaId } : {}) }, previous);
  } catch (error) {
    if (sourceIdeaId && error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      throw new Error('Ide ini sudah dijadikan tugas. Segarkan daftar untuk melihat statusnya.');
    }
    throw error;
  }
}
export const saveIdea = (values: Draft<Idea>, previous?: Idea) => save('creative_ideas', values, previous);
