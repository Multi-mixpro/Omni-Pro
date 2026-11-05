import { supabase } from '@/integrations/supabase/client';

export type DiscussionScope = 'article' | 'campaign';
export const DISCUSSION_PAGE_SIZE = 20;
export const MAX_COMMENT_LENGTH = 2000;
export const isProjectId = (id: string) => /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id);

const tables = {
  article: { name: 'launch_comments', parent: 'project_id', author: 'launch_comments_author_id_fkey' },
  campaign: { name: 'creative_campaign_comments', parent: 'campaign_id', author: 'creative_campaign_comments_author_id_fkey' },
} as const;

export async function loadDiscussion(scope: DiscussionScope, id: string, page: number, signal: AbortSignal) {
  const table = tables[scope];
  let query = supabase.from(table.name).select('id,body,created_at,author:profiles!' + table.author + '(full_name)').eq(table.parent, id);
  if (scope === 'article') query = query.eq('is_decision_request', false);
  const start = page * DISCUSSION_PAGE_SIZE;
  const { data, error } = await query.order('created_at', { ascending: false }).order('id', { ascending: false })
    .range(start, start + DISCUSSION_PAGE_SIZE).abortSignal(signal);
  if (error) throw error;
  type Author = { full_name?: string };
  return ((data ?? []) as unknown as { id: string; body: string; created_at: string; author: Author | Author[] | null }[])
    .map(row => ({
      id: row.id, body: row.body, createdAt: row.created_at,
      authorName: (Array.isArray(row.author) ? row.author[0] : row.author)?.full_name ?? 'Tim',
    }));
}

export async function postDiscussion(scope: DiscussionScope, id: string, authorId: string, body: string) {
  const text = body.trim();
  if (!text || text.length > MAX_COMMENT_LENGTH || !isProjectId(id)) throw new Error('Proyek atau isi komentar tidak valid.');
  const table = tables[scope];
  const { error } = await supabase.from(table.name).insert({ [table.parent]: id, author_id: authorId, body: text });
  if (error) throw error;
}
