import { supabase } from '@/integrations/supabase/client';
import type { LaunchProject } from '../domain/types';

const PROJECT_FIELDS = '*, business_unit:business_units(*), owner:profiles!launch_projects_owner_id_fkey(*)';

export async function listProjects(status?: string) {
  let query = supabase.from('launch_projects').select(PROJECT_FIELDS).order('updated_at', { ascending: false });
  if (status && status !== 'ALL') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as LaunchProject[];
}
