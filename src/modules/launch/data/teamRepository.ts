import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '../domain/types';

export interface TeamMember extends Profile {
  role_code: string | null;
  role_name: string | null;
}

export interface RoleOption { code: string; name: string }

export interface NewTeamUserInput {
  username: string;
  pin: string;
  full_name: string;
  job_title?: string;
  role_code: string;
}

export interface UpdateTeamUserInput {
  user_id: string;
  username: string;
  full_name: string;
  job_title?: string;
  role_code: string;
  password?: string;
}

export interface DeleteTeamUserResult {
  id: string;
  deleted: boolean;
  deleted_self?: boolean;
}

async function authorizedFetch(path: string, body: unknown) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sesi tidak tersedia. Silakan masuk ulang.');

  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error ?? 'Permintaan gagal diproses.');
  return payload;
}

export async function listRoles(): Promise<RoleOption[]> {
  const { data, error } = await supabase.from('roles').select('code, name').order('name');
  if (error) throw error;
  return (data ?? []) as RoleOption[];
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, user_roles(role:roles(code, name))')
    .eq('is_active', true)
    .order('full_name');
  if (error) throw error;

  type Row = Profile & { user_roles?: Array<{ role?: { code: string; name: string } | null }> };
  return ((data ?? []) as unknown as Row[]).map(row => {
    const role = row.user_roles?.find(item => item.role)?.role ?? null;
    return { ...row, role_code: role?.code ?? null, role_name: role?.name ?? null };
  });
}

export const createTeamUser = (input: NewTeamUserInput) => authorizedFetch('/api/team-user-create', input);
export const deleteTeamUser = (userId: string) => authorizedFetch('/api/team-user-delete', { user_id: userId }) as Promise<DeleteTeamUserResult>;
export const updateTeamUser = (input: UpdateTeamUserInput) => authorizedFetch('/api/team-user-update', input);

export async function reactivateTeamUser(userId: string) {
  const { error } = await supabase.from('profiles').update({ is_active: true }).eq('id', userId);
  if (error) throw error;
}

export interface ProjectAccessRow {
  id: string;
  user_id: string;
  responsibility: string | null;
  can_launch: boolean;
  profile?: Profile | null;
}

export async function listProjectAccess(projectId: string): Promise<ProjectAccessRow[]> {
  const { data, error } = await supabase
    .from('launch_project_members')
    .select('id, user_id, responsibility, can_launch, profile:profiles(*)')
    .eq('project_id', projectId);
  if (error) throw error;
  return (data ?? []) as unknown as ProjectAccessRow[];
}

export async function setProjectMember(projectId: string, userId: string, enabled: boolean) {
  if (!enabled) {
    const { error } = await supabase.from('launch_project_members').delete().eq('project_id', projectId).eq('user_id', userId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('launch_project_members').insert({ project_id: projectId, user_id: userId });
  if (error && error.code !== '23505') throw error;
}

export async function setMemberCanLaunch(projectId: string, userId: string, canLaunch: boolean) {
  const { error } = await supabase
    .from('launch_project_members')
    .update({ can_launch: canLaunch })
    .eq('project_id', projectId)
    .eq('user_id', userId);
  if (error) throw error;
}
