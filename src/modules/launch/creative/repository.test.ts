import { beforeEach, describe, expect, it, vi } from 'vitest';
import { advanceTask, ideas, safeOutputUrl, saveTask, tasks, type Draft, type Task } from './repository';

const { from, chain } = vi.hoisted(() => {
  const chain = {
    select: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(), lt: vi.fn().mockReturnThis(), neq: vi.fn().mockReturnThis(), not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis(),
    abortSignal: vi.fn(), maybeSingle: vi.fn(),
  };
  return { chain, from: vi.fn(() => chain) };
});
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from } }));

const draft: Draft<Task> = {
  campaign_id: null, title: 'Video promo', brief: '', assignee_id: null,
  platform: 'tiktok', format: 'Video', status: 'review', priority: 'high',
  due_on: null, publish_on: null, output_url: '', blocker: '',
};

beforeEach(() => vi.clearAllMocks());

describe('creative repository', () => {
  it('rejects saving a stale edit instead of overwriting a teammate', async () => {
    chain.maybeSingle.mockResolvedValue({ data: null, error: null });
    const previous: Task = { ...draft, id: 'task-id', updated_at: '2026-11-05T08:00:00.000001+00:00' };
    await expect(saveTask({ ...draft, status: 'ready' }, previous)).rejects.toThrow(/diubah pengguna lain/);
    expect(chain.eq).toHaveBeenCalledWith('id', previous.id);
    expect(chain.eq).toHaveBeenCalledWith('updated_at', previous.updated_at);
  });

  it('uses the task revision for quick progress without resending its other fields', async () => {
    chain.maybeSingle.mockResolvedValue({ data: null, error: null });
    const previous: Task = { ...draft, id: 'task-id', updated_at: '2026-11-05T08:00:00.000001+00:00' };
    await expect(advanceTask(previous, 'ready')).rejects.toThrow(/diubah pengguna lain/);
    expect(chain.update).toHaveBeenCalledWith({ status: 'ready', blocker: '' });
    expect(chain.eq).toHaveBeenCalledWith('id', previous.id);
    expect(chain.eq).toHaveBeenCalledWith('updated_at', previous.updated_at);
  });

  it('prevents a second task from being created for an idea already assigned by a teammate', async () => {
    chain.maybeSingle.mockResolvedValue({ data: null, error: { code: '23505' } });
    await expect(saveTask(draft, undefined, 'idea-id')).rejects.toThrow(/sudah dijadikan tugas/);
    expect(chain.insert).toHaveBeenCalledWith({ ...draft, source_idea_id: 'idea-id' });
  });

  it('limits a filtered standalone task page at the database', async () => {
    chain.abortSignal.mockResolvedValue({ data: [], error: null });
    await tasks(null, { platform: 'tiktok', status: 'review', assignee: 'unassigned', order: 'publish_on' }, 1, new AbortController().signal);
    expect(chain.is).toHaveBeenCalledWith('campaign_id', null);
    expect(chain.is).toHaveBeenCalledWith('assignee_id', null);
    expect(chain.eq).toHaveBeenCalledWith('platform', 'tiktok');
    expect(chain.eq).toHaveBeenCalledWith('status', 'review');
    expect(chain.range).toHaveBeenCalledWith(30, 60);
  });

  it('filters publication week by scheduled publication, including completed posts and excluding cancellations', async () => {
    chain.abortSignal.mockResolvedValue({ data: [], error: null });
    await tasks('all', { platform: '', status: '', assignee: '', order: 'publish_on' }, 0,
      new AbortController().signal, 'publish', '2026-11-05');
    expect(chain.gte).toHaveBeenCalledWith('publish_on', '2026-11-02');
    expect(chain.lt).toHaveBeenCalledWith('publish_on', '2026-11-09');
    expect(chain.neq).toHaveBeenCalledWith('status', 'cancelled');
    expect(chain.not).not.toHaveBeenCalled();
  });

  it('does not offer already assigned ideas in the ready queue', async () => {
    chain.abortSignal.mockResolvedValue({ data: [], error: null });
    await ideas(0, true, 'ready', new AbortController().signal);
    expect(chain.eq).toHaveBeenCalledWith('prioritized', true);
    expect(chain.eq).toHaveBeenCalledWith('queue_state', 'ready');
    expect(chain.is).toHaveBeenCalledWith('task', null);
  });

  it('applies unit and workstream before paginating tasks', async () => {
    chain.abortSignal.mockResolvedValue({ data: [], error: null });
    await tasks('all', { platform: '', status: '', assignee: 'staff', order: 'due_on', workstream: 'operations' },
      0, new AbortController().signal, 'all', '', 'unit-fnb');
    expect(chain.eq).toHaveBeenCalledWith('business_unit_id', 'unit-fnb');
    expect(chain.eq).toHaveBeenCalledWith('workstream', 'operations');
    expect(chain.eq).toHaveBeenCalledWith('assignee_id', 'staff');
  });

  it('blocks executable URLs, inline media, and URLs with embedded credentials', () => {
    for (const url of ['javascript:alert(1)', 'data:image/png;base64,abc', 'https://user:pass@example.com']) {
      expect(safeOutputUrl(url)).toBe('');
    }
    expect(safeOutputUrl('https://res.cloudinary.com/example/image/upload/demo.jpg'))
      .toBe('https://res.cloudinary.com/example/image/upload/demo.jpg');
  });
});
