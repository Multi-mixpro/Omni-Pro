import { beforeEach, expect, it, vi } from 'vitest';
import { loadDiscussion, postDiscussion } from './repository';

const { from, query } = vi.hoisted(() => {
  const query = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(), abortSignal: vi.fn(), insert: vi.fn(),
  };
  return { from: vi.fn(() => query), query };
});
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from } }));
const id = '550e8400-e29b-41d4-a716-446655440000';
beforeEach(() => vi.clearAllMocks());

it('fetches only one article discussion page and excludes decision requests', async () => {
  query.abortSignal.mockResolvedValue({ data: [], error: null });
  await loadDiscussion('article', id, 1, new AbortController().signal);
  expect(from).toHaveBeenCalledWith('launch_comments');
  expect(query.eq).toHaveBeenCalledWith('project_id', id);
  expect(query.eq).toHaveBeenCalledWith('is_decision_request', false);
  expect(query.range).toHaveBeenCalledWith(20, 40);
});

it('posts a campaign comment without requesting a returned row or accepting a global channel', async () => {
  await expect(postDiscussion('article', 'global', 'user', 'Pesan')).rejects.toThrow();
  expect(from).not.toHaveBeenCalled();
  query.insert.mockResolvedValue({ error: null });
  await postDiscussion('campaign', id, 'user', '  Ulas brief  ');
  expect(from).toHaveBeenCalledWith('creative_campaign_comments');
  expect(query.insert).toHaveBeenCalledWith({ campaign_id: id, author_id: 'user', body: 'Ulas brief' });
  expect(query.select).not.toHaveBeenCalled();
});
