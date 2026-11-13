import { supabase } from '@/integrations/supabase/client';
import { mondayWeek, type Focus } from './schedule';

export const platforms = {
  instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', facebook: 'Facebook',
  whatsapp: 'WhatsApp', marketplace: 'Marketplace', website: 'Website', internal: 'Internal', other: 'Lainnya',
};
export const taskStatuses = {
  todo: 'Belum mulai', doing: 'Dikerjakan', review: 'Review', ready: 'Siap tayang',
  done: 'Selesai', blocked: 'Terhambat', cancelled: 'Dibatalkan',
};
export const campaignStatuses = { planned: 'Direncanakan', active: 'Aktif', completed: 'Selesai', archived: 'Diarsipkan' };
export const priorities = { normal: 'Normal', high: 'Tinggi', urgent: 'Mendesak' };
export const ideaQueues = { candidate: 'Perlu ditinjau', ready: 'Siap dikerjakan', parked: 'Ditunda' };
export const workstreams = { creative: 'Produksi Konten', marketing: 'Marketing & Promo', operations: 'Operasional' };
export const outputTypes = { post: 'Postingan teks', image: 'Gambar statis', carousel: 'Carousel', video: 'Video', story: 'Story', live: 'Live', other: 'Lainnya' };
export const copyFormats = { caption: 'Caption', hook: 'Hook video', script: 'Skrip video', listing: 'Listing produk', ad: 'Iklan', other: 'Lainnya' };
type Row = { id: string; updated_at: string };
export type ChecklistItem = { label: string; done: boolean };
export const briefFields = {
  objective: 'Tujuan', audience: 'Audiens', insight: 'Insight pelanggan', message: 'Pesan utama',
  offer: 'Penawaran', cta: 'Ajakan bertindak', mandatory: 'Elemen wajib', restrictions: 'Batasan atau klaim yang dihindari',
  voice: 'Panduan gaya bahasa dan visual', references: 'Referensi',
};
type CreativeBrief = Partial<Record<keyof typeof briefFields, string>>;
export type Campaign = Row & {
  business_unit_id?: string | null;
  name: string; objective: string; owner_id: string | null; status: keyof typeof campaignStatuses;
  starts_on: string | null; ends_on: string | null; budget_idr: number; spent_idr: number;
};
export type Task = Row & {
  creative_brief?: CreativeBrief;
  approver_id?: string | null;
  approved_at?: string | null;
  reviewer_id?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  checklist?: ChecklistItem[];
  deliverable?: string;
  acceptance_criteria?: string;
  completion_note?: string;
  review_note?: string;
  source_activation_id?: string | null;
  business_unit_id?: string | null;
  copy_template_id?: string | null;
  output_type?: keyof typeof outputTypes;
  workstream?: keyof typeof workstreams;
  campaign_id: string | null; title: string; brief: string; assignee_id: string | null;
  platform: keyof typeof platforms; format: string; status: keyof typeof taskStatuses;
  additional_platforms?: (keyof typeof platforms)[];
  additional_assignee_ids?: string[];
  priority: keyof typeof priorities; due_on: string | null; publish_on: string | null;
  output_url: string; blocker: string;
};
export type TeamMember = { id: string; full_name: string; is_active: boolean; job_title: string | null; can_decide?: boolean };
export type ListedTask = Task & {
  campaign: { name: string } | null;
  source_idea: { title: string; reference_urls: string[] } | null;
};
export type Idea = Row & {
  additional_platforms?: Task['platform'][];
  business_unit_id?: string | null;
  title: string; brief: string; platform: Task['platform']; reference_urls: string[]; prioritized: boolean;
  queue_state: keyof typeof ideaQueues;
};
export type ListedIdea = Idea & { task: Pick<Task, 'id' | 'status'> | null };
export type Draft<T> = Omit<T, keyof Row>;
export const PAGE_SIZE = 30;

const campaignColumns = 'id,business_unit_id,name,objective,owner_id,status,starts_on,ends_on,budget_idr,spent_idr,updated_at';
const taskColumns = 'id,business_unit_id,workstream,campaign_id,title,brief,creative_brief,deliverable,acceptance_criteria,completion_note,checklist,assignee_id,reviewer_id,reviewed_by,reviewed_at,approver_id,approved_at,platform,additional_platforms,additional_assignee_ids,copy_template_id,output_type,format,status,priority,due_on,publish_on,output_url,blocker,review_note,source_activation_id,updated_at';

export type CopyTemplate = {
  id: string;
  title: string;
  description?: string;
  format: keyof typeof copyFormats;
  output_type: keyof typeof outputTypes;
  platform: keyof typeof platforms | null;
  body: string;
  business_unit_id: string | null;
  is_archived: boolean;
  updated_at: string;
};

const LOCAL_COPY_LIBRARY_KEY = 'mix_pro_creative_copy_library_v1';

const DEFAULT_COPY_TEMPLATES: CopyTemplate[] = [
  {
    id: 'template-hook-1',
    title: 'Hook Before-After Masalah Pakaian / Lookbook',
    description: 'Digunakan untuk 3 detik pembuka Reels/TikTok. Talent menghadap kamera dengan ekspresi relatable, lalu transisi cepat ke outfit rapi.',
    format: 'hook',
    output_type: 'video',
    platform: 'tiktok',
    body: '<b>[HOOK 0-3 Detik]</b><br>Pernah nggak ngerasa outfit kamu <span style="color:#dc2626"><b>kaku banget</b></span> pas dipakai seharian?<br><br><i>Ini 3 rahasia styling simpel yang bikin look kamu 10x lebih rapi tanpa ribet.</i>',
    business_unit_id: null,
    is_archived: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'template-caption-1',
    title: 'Caption Peluncuran Drop Baru (Storytelling)',
    description: 'Cocok untuk postingan feed/carousel rilis koleksi baru. Menonjolkan kualitas jahitan, kenyamanan bahan breathable, dan CTA ke bio.',
    format: 'caption',
    output_type: 'post',
    platform: 'instagram',
    body: '<b>Setiap jahitan punya cerita.</b><br><br>Koleksi terbaru kami hadir dengan material <u>premium breathable</u> yang siap nemenin mobilitas harian kamu dari pagi sampai malam.<br><br><mark style="background-color:#fef08a">Stok batch pertama terbatas — klik link pembelian di bio sekarang!</mark>',
    business_unit_id: null,
    is_archived: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'template-script-1',
    title: 'Skrip Review Produk & Uji Detail 30 Detik',
    description: 'Panduan shooting video produk 30 detik: ambil close-up tekstur kain di awal, lanjutkan penjelasan 3 fitur utama, dan tutup dengan fitting on-body.',
    format: 'script',
    output_type: 'video',
    platform: 'instagram',
    body: '<b>[0-5s · ADEGAN VISUAL]</b><br>Buka video dengan zoom detail jahitan &amp; tekstur bahan.<br><br><b>[6-15s · DIALOG / INTI]</b><br>Jelaskan <b>3 fitur unggulan</b>: <i>anti kusut, furing adem, dan fitting proporsional</i>.<br><br><b>[16-25s · BUKTI PEMAKAIAN]</b><br>Tunjukkan pemakaian di badan saat bergerak aktif.<br><br><b>[26-30s · CTA]</b><br><span style="color:#0f766e"><b>Cek varian warna sekarang sebelum kehabisan!</b></span>',
    business_unit_id: null,
    is_archived: false,
    updated_at: new Date().toISOString(),
  },
];

function getLocalCopyLibrary(): CopyTemplate[] {
  try {
    const raw = localStorage.getItem(LOCAL_COPY_LIBRARY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CopyTemplate[];
      const defaultsById = new Map(DEFAULT_COPY_TEMPLATES.map(d => [d.id, d]));
      return parsed.map(item => ({
        ...item,
        description: item.description ?? defaultsById.get(item.id)?.description ?? '',
      }));
    }
  } catch { /* ignore */ }
  return DEFAULT_COPY_TEMPLATES;
}

function saveLocalCopyLibrary(items: CopyTemplate[]) {
  try {
    localStorage.setItem(LOCAL_COPY_LIBRARY_KEY, JSON.stringify(items));
  } catch { /* ignore */ }
}

export async function copyTemplates(_signal?: AbortSignal, unit = 'all'): Promise<CopyTemplate[]> {
  const local = getLocalCopyLibrary().filter(item => !item.is_archived);
  if (unit === 'all') return local;
  if (unit === 'unassigned') return local.filter(item => item.business_unit_id === null);
  return local.filter(item => item.business_unit_id === null || item.business_unit_id === unit);
}

export async function saveCopyTemplate(template: Omit<CopyTemplate, 'id' | 'updated_at' | 'is_archived'>, id?: string): Promise<string> {
  const now = new Date().toISOString();
  const list = getLocalCopyLibrary();
  if (id) {
    const updated = list.map(item => item.id === id ? { ...item, ...template, updated_at: now } : item);
    saveLocalCopyLibrary(updated);
    return id;
  }
  const newId = `copy-tpl-${Date.now()}`;
  const created: CopyTemplate = { ...template, id: newId, is_archived: false, updated_at: now };
  saveLocalCopyLibrary([created, ...list]);
  return newId;
}

export async function deleteCopyTemplate(id: string): Promise<void> {
  const list = getLocalCopyLibrary().map(item => item.id === id ? { ...item, is_archived: true } : item);
  saveLocalCopyLibrary(list);
}

const IDEA_SCRIPT_LINKS_KEY = 'mix_pro_idea_script_links_v1';
const HIDDEN_IDEAS_KEY = 'mix_pro_hidden_ideas_v1';
const DEMO_PURGED_KEY = 'mix_pro_demo_purged_v1';

export function getIdeaAttachedScript(ideaId?: string | null): string {
  if (!ideaId) return '';
  try {
    const raw = localStorage.getItem(IDEA_SCRIPT_LINKS_KEY);
    if (!raw) return '';
    const map = JSON.parse(raw) as Record<string, string>;
    return map[ideaId] ?? '';
  } catch {
    return '';
  }
}

export function setIdeaAttachedScript(ideaId: string, templateId: string | null) {
  if (!ideaId) return;
  try {
    const raw = localStorage.getItem(IDEA_SCRIPT_LINKS_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    if (templateId) map[ideaId] = templateId;
    else delete map[ideaId];
    localStorage.setItem(IDEA_SCRIPT_LINKS_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

function getHiddenIdeaIds(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_IDEAS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export async function deleteIdea(id: string): Promise<void> {
  try {
    await supabase.from('creative_ideas').delete().eq('id', id);
  } catch { /* fallback to local hide */ }
  try {
    const hidden = getHiddenIdeaIds();
    hidden.add(id);
    localStorage.setItem(HIDDEN_IDEAS_KEY, JSON.stringify([...hidden]));
  } catch { /* ignore */ }
}

export function isDemoPurged(): boolean {
  try {
    return localStorage.getItem(DEMO_PURGED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function isDemoText(text?: string | null): boolean {
  if (!text) return false;
  return /^\s*\[DEMO\]/i.test(text) || /^DEMO[\s_]/i.test(text);
}

export async function purgeCreativeDemoData(): Promise<{ removedTasks: number; removedIdeas: number; removedCampaigns: number }> {
  let removedTasks = 0;
  let removedIdeas = 0;
  let removedCampaigns = 0;

  try {
    const { data: demoTasks } = await supabase
      .from('creative_tasks')
      .select('id,updated_at,title')
      .ilike('title', '[DEMO]%');
    if (demoTasks?.length) {
      for (const t of demoTasks) {
        try {
          await supabase.rpc('remove_creative_task', { p_task: t.id, p_version: t.updated_at });
          removedTasks++;
        } catch {
          await supabase.from('creative_tasks').delete().eq('id', t.id);
          removedTasks++;
        }
      }
    }
  } catch { /* ignore */ }

  try {
    const { data: demoIdeas } = await supabase
      .from('creative_ideas')
      .select('id')
      .ilike('title', '[DEMO]%');
    if (demoIdeas?.length) {
      removedIdeas = demoIdeas.length;
      await supabase.from('creative_ideas').delete().ilike('title', '[DEMO]%');
    }
  } catch { /* ignore */ }

  try {
    await supabase.from('creative_channel_activations').delete().ilike('name', '[DEMO]%');
  } catch { /* ignore */ }

  try {
    const { data: demoCampaigns } = await supabase
      .from('creative_campaigns')
      .select('id')
      .ilike('name', '[DEMO]%');
    if (demoCampaigns?.length) {
      removedCampaigns = demoCampaigns.length;
      await supabase.from('creative_campaigns').delete().ilike('name', '[DEMO]%');
      await supabase.from('creative_campaigns').update({ status: 'archived' }).ilike('name', '[DEMO]%');
    }
  } catch { /* ignore */ }

  try {
    await supabase.from('creative_accounts').update({ is_active: false }).ilike('handle', 'demo.%');
    await supabase.from('business_units').update({ is_active: false }).eq('code', 'DEMO_CREATIVE');
  } catch { /* ignore */ }

  try {
    localStorage.setItem(DEMO_PURGED_KEY, 'true');
  } catch { /* ignore */ }

  return { removedTasks, removedIdeas, removedCampaigns };
}

export async function campaigns(page: number, signal: AbortSignal, unit = 'all') {
  const start = page * PAGE_SIZE;
  let query = supabase.from('creative_campaigns').select(campaignColumns);
  if (unit !== 'all') query = unit === 'unassigned' ? query.is('business_unit_id', null) : query.eq('business_unit_id', unit);
  const { data, error } = await query
    .order('name').order('id').range(start, start + PAGE_SIZE).abortSignal(signal);
  if (error) throw error;
  const rows = (data ?? []) as Campaign[];
  return isDemoPurged() ? rows.filter(row => !isDemoText(row.name)) : rows;
}

export async function team(signal: AbortSignal) {
  const { data, error } = await supabase.rpc('creative_team_directory').abortSignal(signal);
  if (!error) return (data ?? []) as TeamMember[];
  if (error.code !== 'PGRST202') throw error;

  // Older databases have role grants only, before account overrides exist.
  const previous = await supabase.from('profiles')
    .select('id,full_name,is_active,job_title,user_roles(role:roles(role_permissions(permission:permissions(code))))')
    .order('full_name').abortSignal(signal);
  if (previous.error) throw previous.error;
  type Assignment = { role: { role_permissions: { permission: { code: string } | null }[] } | null };
  return ((previous.data ?? []) as unknown as (TeamMember & { user_roles: Assignment[] })[]).map(({ user_roles, ...member }) => {
    const codes = new Set(user_roles.flatMap(({ role }) => role?.role_permissions.map(item => item.permission?.code) ?? []));
    return { ...member, can_decide: member.is_active && (codes.has('launch.admin') || (codes.has('creative.view') && codes.has('creative.edit'))) };
  });
}

export type Filters = {
  platform: string; status: string; assignee: string; order: 'due_on' | 'publish_on';
  workstream?: string;
};

export async function pendingTaskDecisions(userId: string, page: number, signal: AbortSignal, unit = 'all', scope = 'all') {
  if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(userId)) return [];
  const start = page * PAGE_SIZE;
  let query = supabase.from('creative_tasks').select('id,title,status,due_on')
    .or(`and(status.eq.review,reviewer_id.eq.${userId}),and(status.eq.ready,approver_id.eq.${userId},approved_at.is.null)`);
  if (unit !== 'all') query = unit === 'unassigned' ? query.is('business_unit_id', null) : query.eq('business_unit_id', unit);
  if (scope !== 'all') query = scope === 'standalone' ? query.is('campaign_id', null) : query.eq('campaign_id', scope);
  const { data, error } = await query.order('due_on', { nullsFirst: false }).order('id')
    .range(start, start + PAGE_SIZE).abortSignal(signal);
  if (error) throw error;
  return (data ?? []) as Pick<Task, 'id' | 'title' | 'status' | 'due_on'>[];
}

export async function tasks(campaignId: string | null | 'all', filters: Filters, page: number, signal: AbortSignal,
  focus: Focus = 'all', today = '', unit = 'all') {
  const start = page * PAGE_SIZE;
  let query = supabase.from('creative_tasks').select(taskColumns + ',campaign:creative_campaigns(name),source_idea:creative_ideas(title,reference_urls)');
  if (unit !== 'all') query = unit === 'unassigned' ? query.is('business_unit_id', null) : query.eq('business_unit_id', unit);
  if (campaignId !== 'all') query = campaignId ? query.eq('campaign_id', campaignId) : query.is('campaign_id', null);
  if (filters.platform && Object.prototype.hasOwnProperty.call(platforms, filters.platform)) {
    query = query.or(`platform.eq.${filters.platform},additional_platforms.cs.{${filters.platform}}`);
  }
  if (filters.workstream) query = query.eq('workstream', filters.workstream);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.assignee === 'unassigned') query = query.is('assignee_id', null).eq('additional_assignee_ids', '{}');
  else if (/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(filters.assignee)) {
    query = query.or(`assignee_id.eq.${filters.assignee},additional_assignee_ids.cs.{${filters.assignee}}`);
  }
  if (focus === 'week' || focus === 'publish') {
    const { monday, nextMonday } = mondayWeek(today);
    const column = focus === 'week' ? 'due_on' : 'publish_on';
    query = query.gte(column, monday).lt(column, nextMonday).neq('status', 'cancelled');
  } else if (focus === 'today' || focus === 'overdue') {
    query = (focus === 'today' ? query.eq('due_on', today) : query.lt('due_on', today))
      .not('status', 'in', '(done,cancelled)');
  } else if (focus === 'review' || focus === 'blocked' || focus === 'ready') {
    query = query.eq('status', focus);
  } else if (focus === 'unplanned') {
    query = query.or('and(assignee_id.is.null,additional_assignee_ids.eq.{}),due_on.is.null').not('status', 'in', '(done,cancelled)');
  }
  const { data, error } = await query.order(filters.order, { nullsFirst: false }).order('id')
    .range(start, start + PAGE_SIZE).abortSignal(signal);
  if (error) throw error;
  const rows = (data ?? []) as unknown as ListedTask[];
  return isDemoPurged() ? rows.filter(row => !isDemoText(row.title)) : rows;
}

export async function summary(campaignId: string | null, today: string, signal: AbortSignal, unit = 'all') {
  const { data, error } = await supabase.rpc('creative_command_summary', {
    p_campaign_id: campaignId === 'all' ? null : campaignId, p_all: campaignId === 'all', p_today: today,
    p_unit_id: unit === 'all' || unit === 'unassigned' ? null : unit, p_unassigned: unit === 'unassigned',
  })
    .abortSignal(signal).single();
  if (error) throw error;
  return data as {
    total: number; done: number; blocked: number; overdue: number;
    target: number; closed: number; on_time: number; review: number; unplanned: number; published_week: number;
  };
}

export function safeOutputUrl(value: string) {
  try {
    const url = new URL(value);
    if (/^https?:$/.test(url.protocol) && !url.username && !url.password) return url.href;
  } catch { /* Empty or malformed URL */ }
  return '';
}

export async function ideas(page: number, onlyPriority: boolean, queue: string, signal: AbortSignal, unit = 'all') {
  const start = page * PAGE_SIZE;
  let query = supabase.from('creative_ideas')
    .select('*,task:creative_tasks(id,status)');
  if (unit !== 'all') query = unit === 'unassigned' ? query.is('business_unit_id', null) : query.eq('business_unit_id', unit);
  if (onlyPriority) query = query.eq('prioritized', true);
  if (queue) query = query.eq('queue_state', queue);
  if (queue === 'ready') query = query.is('task', null);
  const { data, error } = await query.order('prioritized', { ascending: false })
    .order('updated_at', { ascending: false }).order('id').range(start, start + PAGE_SIZE).abortSignal(signal);
  if (error) throw error;
  const hidden = getHiddenIdeaIds();
  const purged = isDemoPurged();
  return ((data ?? []) as unknown as (Omit<ListedIdea, 'task'> & { task: ListedIdea['task'] | NonNullable<ListedIdea['task']>[] })[])
    .filter(row => !hidden.has(row.id) && (!purged || !isDemoText(row.title)))
    .map(row => ({ ...row, task: Array.isArray(row.task) ? row.task[0] ?? null : row.task }));
}

async function save(table: string, values: Record<string, string | number | boolean | string[] | ChecklistItem[] | CreativeBrief | null | undefined>, previous?: Row) {
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
export async function removeTask(task: Pick<Task, 'id' | 'updated_at'>) {
  const { error } = await supabase.rpc('remove_creative_task', {
    p_task: task.id, p_version: task.updated_at,
  });
  if (error?.code === 'PGRST202') throw new Error('Fitur hapus belum aktif di database.');
  if (error) throw error;
}
export async function saveIdea(values: Draft<Idea>, previous?: Idea) {
  const { additional_platforms, ...fields } = values;
  const payload = additional_platforms?.length || previous?.additional_platforms?.length
    ? { ...fields, additional_platforms: additional_platforms ?? [] }
    : fields;
  try {
    return await save('creative_ideas', payload, previous);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST204'
      && 'message' in error && String(error.message).includes('additional_platforms')) {
      throw new Error('Penyimpanan beberapa platform belum aktif. Terapkan migrasi Bank Ide terlebih dahulu.');
    }
    throw error;
  }
}

export function setTaskChecklistItem(task: Task, index: number, done: boolean) {
  if (!task.checklist?.[index]) throw new Error('Langkah checklist tidak ditemukan.');
  const checklist = task.checklist.map((item, position) => position === index ? { ...item, done } : item);
  return save('creative_tasks', { checklist }, task);
}

export function approveTask(task: Task) {
  // The database validates the caller and records its own timestamp.
  return save('creative_tasks', { approved_at: new Date().toISOString() }, task);
}

export function advanceTask(task: Task, status: Exclude<Task['status'], 'blocked'>) {
  return save('creative_tasks', { status, blocker: '' }, task);
}

export function requestRevision(task: Task, note: string) {
  if (task.status !== 'review' || !note.trim()) throw new Error('Masukkan catatan revisi untuk tugas yang sedang direview.');
  return save('creative_tasks', { status: 'doing', review_note: note.trim(), blocker: '' }, task);
}

export async function getTask(id: string, signal: AbortSignal) {
  const { data, error } = await supabase.from('creative_tasks')
    .select(taskColumns + ',campaign:creative_campaigns(name),source_idea:creative_ideas(title,reference_urls)')
    .eq('id', id).abortSignal(signal).single();
  if (error) throw error;
  return data as unknown as ListedTask;
}

export const BOARD_PAGE_SIZE = 6;

export type Workload = {
  subject_id: string | null;
  open_count: number;
  review_count: number;
  blocked_count: number;
  overdue_count: number;
  week_target: number;
  week_done: number;
};
export async function workload(group: 'team' | 'campaign', unit: string, scope: string, today: string, signal: AbortSignal) {
  const { data, error } = await supabase.rpc('creative_workload_summary', {
    p_group: group, p_unit: unit === 'all' || unit === 'unassigned' ? null : unit,
    p_unassigned: unit === 'unassigned', p_campaign: scope === 'all' || scope === 'standalone' ? null : scope,
    p_standalone: scope === 'standalone', p_today: today,
  }).abortSignal(signal);
  if (error) throw error;
  return (data ?? []) as Workload[];
}
export async function boardTasks(scope: string, unit: string, filters: Filters, focus: Focus, today: string, page: number, signal: AbortSignal) {
  const { data, error } = await supabase.rpc('creative_board', {
    p_unit: unit === 'all' || unit === 'unassigned' ? null : unit, p_unassigned: unit === 'unassigned',
    p_campaign: scope === 'all' || scope === 'standalone' ? null : scope, p_standalone: scope === 'standalone',
    p_filters: filters, p_focus: focus, p_today: today, p_page: page,
  }).abortSignal(signal);
  if (error) throw error;
  const lanes = (data ?? []) as { stage: Task['status']; total: number; items: ListedTask[] }[];
  if (!isDemoPurged()) return lanes;
  return lanes.map(lane => {
    const filtered = (lane.items ?? []).filter(item => !isDemoText(item.title));
    const removedCount = (lane.items?.length ?? 0) - filtered.length;
    return { ...lane, items: filtered, total: Math.max(0, Number(lane.total ?? 0) - removedCount) };
  });
}
