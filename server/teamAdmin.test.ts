import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import createTeamUser from '../api/team-user-create';
import deleteTeamUser from '../api/team-user-delete';

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));

const client = vi.mocked(createClient);
const getUser = vi.fn();
const rpc = vi.fn();
const from = vi.fn();
const createUser = vi.fn();
const req = { method: 'POST', headers: { authorization: 'Bearer simulated-session' }, body: {
  username: 'qa_producer', pin: '872935', full_name: 'QA Producer', role_code: 'creative_producer',
} } as unknown as VercelRequest;

const result = () => {
  const status = vi.fn();
  const json = vi.fn();
  status.mockReturnValue({ json });
  return { status, json, response: { setHeader: vi.fn(), status } as unknown as VercelResponse };
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('SUPABASE_ANON_KEY', 'simulated-public-key');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'simulated-service-key');
  client.mockImplementation((_url, key) => (key === 'simulated-public-key'
    ? { auth: { getUser }, rpc } : { from, auth: { admin: { createUser } }, rpc }) as never);
  getUser.mockResolvedValue({ data: { user: { id: 'admin' } }, error: null });
  rpc.mockResolvedValue({ data: true, error: null });
});

afterEach(() => vi.unstubAllEnvs());

describe('team user creation', () => {
  it('validates the supplied token and rejects an inactive caller before any privileged action', async () => {
    rpc.mockImplementation(async (name: string) => ({ data: name !== 'is_active_user', error: null }));
    const { status, response } = result();
    await createTeamUser(req, response);
    expect(getUser).toHaveBeenCalledWith('simulated-session');
    expect(status).toHaveBeenCalledWith(403);
    expect(client).toHaveBeenCalledTimes(1);
  });

  it('rejects configuration mismatch without transmitting the bearer token', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://other.supabase.co');
    const { status, response } = result();
    await createTeamUser(req, response);
    expect(status).toHaveBeenCalledWith(503);
    expect(client).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid session before any permission or account changes', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { status: 401 } });
    const { status, response } = result();
    await createTeamUser(req, response);
    expect(status).toHaveBeenCalledWith(401);
    expect(rpc).not.toHaveBeenCalled();
    expect(client).toHaveBeenCalledTimes(1);
  });

  it('reports an occupied username and never calls Auth create', async () => {
    from.mockImplementation((table: string) => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: table }, error: null }) }) }),
    }));
    const { status, response } = result();
    await createTeamUser(req, response);
    expect(status).toHaveBeenCalledWith(409);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('creates a fresh account and assigns the selected role after authorization', async () => {
    from.mockImplementation((table: string) => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: table === 'roles' ? { id: 'producer-role', code: 'creative_producer' } : null, error: null }) }) }),
      upsert: async () => ({ error: null }),
    }));
    createUser.mockResolvedValue({ data: { user: { id: 'new-user' } }, error: null });
    const { status, response } = result();
    await createTeamUser(req, response);
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ app_metadata: { app_role: 'creative_producer' } }));
    expect(rpc).toHaveBeenCalledWith('replace_workspace_user_role', { p_user: 'new-user', p_role: 'producer-role' });
    expect(status).toHaveBeenCalledWith(201);
  });
});

it('rejects deleting the signed-in administrator before changing any records', async () => {
  const { status, response } = result();
  await deleteTeamUser({ ...req, body: { user_id: 'admin' } }, response);
  expect(status).toHaveBeenCalledWith(400);
  expect(from).not.toHaveBeenCalled();
});
