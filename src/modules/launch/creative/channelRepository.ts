import { supabase } from '@/integrations/supabase/client';
import { PAGE_SIZE, platforms } from './repository';

export const channelPlatforms = {
  marketplace: platforms.marketplace, instagram: platforms.instagram, tiktok: platforms.tiktok,
  facebook: platforms.facebook, youtube: platforms.youtube, whatsapp: platforms.whatsapp, website: platforms.website, other: platforms.other,
};
export const channelStatus = { planned: 'Direncanakan', running: 'Berjalan', review: 'Siap dievaluasi', evaluated: 'Sudah dievaluasi', cancelled: 'Dibatalkan' };
export const metrics = { reach: 'Jangkauan', clicks: 'Klik', leads: 'Lead', orders: 'Pesanan' };
export const decisions = { continue: 'Lanjutkan', adjust: 'Sesuaikan', stop: 'Hentikan' };
export type ActivationDraft = {
  account_id?: string | null;
  name: string; campaign_id: string; platform: keyof typeof channelPlatforms; channel_name: string;
  distribution: 'paid' | 'organic'; status: keyof typeof channelStatus;
  assignee_id: string | null; starts_on: string | null; ends_on: string | null; review_on: string;
  budget_idr: number; spent_idr: number; metric: keyof typeof metrics; target_result: number; actual_result: number;
  evaluation: string; decision: keyof typeof decisions | null;
};
export type Activation = ActivationDraft & { id: string; updated_at: string; campaign: { name: string } | null; account: { handle: string } | null };
export type ChannelSummary = {
  platform: keyof typeof channelPlatforms; budget: number; spent: number;
  pending_review: number; overdue: number; evaluated: number;
};

export async function channelSummary(unit: string, campaign: string, today: string, signal: AbortSignal) {
  const { data, error } = await supabase.rpc('creative_channel_summary', {
    p_today: today, p_unit_id: unit === 'all' || unit === 'unassigned' ? null : unit,
    p_unassigned: unit === 'unassigned', p_campaign_id: campaign === 'all' ? null : campaign,
  }).abortSignal(signal);
  if (error) throw error;
  return (data ?? []) as ChannelSummary[];
}

export async function channelActivations(unit: string, campaign: string, page: number, platform: string, review: string, today: string, signal: AbortSignal, accountId?: string, activationId?: string) {
  const start = page * PAGE_SIZE;
  let query = supabase.from('creative_channel_activations')
    .select('id,updated_at,campaign_id,account_id,name,platform,channel_name,distribution,status,assignee_id,starts_on,ends_on,review_on,budget_idr,spent_idr,metric,target_result,actual_result,evaluation,decision,campaign:creative_campaigns!inner(name,business_unit_id),account:creative_accounts(handle)');
  if (unit !== 'all') query = unit === 'unassigned' ? query.is('campaign.business_unit_id', null) : query.eq('campaign.business_unit_id', unit);
  if (campaign !== 'all') query = query.eq('campaign_id', campaign);
  if (platform) query = query.eq('platform', platform);
  if (accountId) query = query.eq('account_id',accountId);
  if (activationId) query = query.eq('id',activationId);
  if (review === 'overdue') query = query.lt('review_on', today).not('status', 'in', '(evaluated,cancelled)');
  else if (review === 'open') query = query.not('status', 'in', '(evaluated,cancelled)');
  else if (review === 'evaluated') query = query.eq('status', 'evaluated');
  const { data, error } = await query.order('review_on').order('id').range(start, start + PAGE_SIZE).abortSignal(signal);
  if (error) throw error;
  return (data ?? []) as unknown as Activation[];
}

export async function saveActivation(draft: ActivationDraft, previous?: Activation) {
  const table = supabase.from('creative_channel_activations');
  const mutation = previous ? table.update(draft).eq('id', previous.id).eq('updated_at', previous.updated_at) : table.insert(draft);
  const { data, error } = await mutation.select('id').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Data sudah berubah. Segarkan sebelum menyimpan ulang.');
  return data.id as string;
}

export async function createActivationFollowup(id: string, pic: string, due: string) {
  const { data, error } = await supabase.rpc('create_creative_activation_followup',{ p_activation:id,p_pic:pic,p_due:due });
  if (error) throw error;
  return data as string;
}

export const eventKinds = { deadline: 'Deadline', publish: 'Jadwal tayang', evaluation: 'Evaluasi kanal', published: 'Tayang aktual' };
export type CalendarEvent = { item_id: string; title: string; platform: keyof typeof platforms; event_day: string; kind: keyof typeof eventKinds; status: string };
async function calendarEvents(unit: string, scope: string, from: string, until: string, page: number, signal: AbortSignal, size: number) {
  const start = page * size;
  const pUnit = unit === 'all' || unit === 'unassigned' ? null : unit;
  const pCampaign = scope === 'all' || scope === 'standalone' ? null : scope;
  const query = supabase.rpc('creative_calendar_events', {
    p_from: from, p_until: until, p_unit_id: pUnit,
    p_unassigned: unit === 'unassigned', p_campaign_id: pCampaign,
    p_standalone: scope === 'standalone',
  });
  const { data, error } = await query.order('event_day').order('kind').order('item_id').range(start, start + size).abortSignal(signal);
  if (error) throw error;
  return (data ?? []) as CalendarEvent[];
}

export async function monthEvents(unit: string, scope: string, from: string, until: string, signal: AbortSignal) {
  const size = 200;
  const rows: CalendarEvent[] = [];
  for (let page = 0; ; page += 1) {
    const batch = await calendarEvents(unit, scope, from, until, page, signal, size);
    rows.push(...batch.slice(0, size));
    if (batch.length <= size) return rows;
    signal.throwIfAborted();
  }
}
