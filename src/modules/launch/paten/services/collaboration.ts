import { supabase } from '@/integrations/supabase/client';
import { ArticleComment } from '../types';

const PROJECT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function addArticleComment(
  projectId: string,
  body: string,
): Promise<ArticleComment> {
  if (!PROJECT_ID_PATTERN.test(projectId)) {
    throw new Error('Komentar hanya dapat ditambahkan pada artikel database.');
  }
  const text = body.trim();
  if (!text) throw new Error('Komentar tidak boleh kosong.');

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    throw new Error('Sesi komentar tidak tersedia. Silakan masuk kembali.');
  }

  const [{ data: profile }, insertResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', auth.user.id)
      .maybeSingle(),
    supabase
      .from('launch_comments')
      .insert({
        project_id: projectId,
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
