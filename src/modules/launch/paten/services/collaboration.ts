import { supabase } from '@/integrations/supabase/client';
import { ArticleComment } from '../types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function addArticleComment(
  projectId: string,
  body: string,
): Promise<ArticleComment> {
  const text = body.trim();
  if (!text) throw new Error('Komentar tidak boleh kosong.');

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    throw new Error('Sesi tidak tersedia. Silakan masuk kembali.');
  }

  const isArticle = UUID_RE.test(projectId);

  const [{ data: profile }, insertResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', auth.user.id)
      .maybeSingle(),
    supabase
      .from('launch_comments')
      .insert({
        project_id: isArticle ? projectId : null,
        author_id: auth.user.id,
        body: text,
        is_decision_request: false,
      })
      .select('id, created_at')
      .single(),
  ]);

  if (insertResult.error) throw insertResult.error;
  return {
    id: String(insertResult.data.id),
    authorName: String(profile?.full_name || auth.user.email || 'Tim'),
    authorAvatar: String(profile?.avatar_url || ''),
    body: text,
    createdAt: String(insertResult.data.created_at || new Date().toISOString()),
  };
}

export async function loadGlobalComments(): Promise<ArticleComment[]> {
  const { data, error } = await supabase
    .from('launch_comments')
    .select('id, body, created_at, author:profiles!launch_comments_author_id_fkey(full_name, avatar_url)')
    .is('project_id', null)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: String(row.id),
    authorName: String(row.author?.full_name || 'Tim'),
    authorAvatar: String(row.author?.avatar_url || ''),
    body: String(row.body),
    createdAt: String(row.created_at),
  }));
}

export function broadcastNewMessage(comment: ArticleComment & { projectId: string }) {
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('mix_pro_chat_realtime_channel');
      channel.postMessage({ type: 'NEW_MESSAGE', comment });
      channel.close();
    }
  } catch (err) {
    console.warn('BroadcastChannel message send skipped:', err);
  }
}
