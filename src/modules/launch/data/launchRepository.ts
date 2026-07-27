import { supabase } from '@/integrations/supabase/client';
import type { BusinessUnit, LaunchProject, LaunchStage, LaunchTask, NewProjectInput, Profile, ProjectWorkspace } from '../domain/types';

const PROJECT_FIELDS = '*, business_unit:business_units(*), owner:profiles!launch_projects_owner_id_fkey(*)';

export async function listBusinessUnits() {
  const { data, error } = await supabase.from('business_units').select('*').eq('is_active', true).order('name');
  if (error) throw error;
  return (data ?? []) as BusinessUnit[];
}

export async function listProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').eq('is_active', true).order('full_name');
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function listProjects(status?: string) {
  let query = supabase.from('launch_projects').select(PROJECT_FIELDS).order('updated_at', { ascending: false });
  if (status && status !== 'ALL') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as LaunchProject[];
}

export async function listMyTasks(userId: string) {
  const { data, error } = await supabase
    .from('launch_tasks')
    .select('*, project:launch_projects(id, code, article_name)')
    .eq('assignee_id', userId)
    .neq('status', 'DONE')
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(8);
  if (error) throw error;
  return (data ?? []) as unknown as LaunchTask[];
}

export async function getProjectWorkspace(projectId: string): Promise<ProjectWorkspace> {
  const [projectResult, stagesResult, tasksResult, activityResult, colorResult, hppResult, sizeResult, qcResult] = await Promise.all([
    supabase.from('launch_projects').select(PROJECT_FIELDS).eq('id', projectId).single(),
    supabase.from('launch_stage_runs').select('*, owner:profiles!launch_stage_runs_owner_id_fkey(*)').eq('project_id', projectId).order('position'),
    supabase.from('launch_tasks').select('*, assignee:profiles!launch_tasks_assignee_id_fkey(*)').eq('project_id', projectId).order('created_at'),
    supabase.from('launch_activity').select('*, actor:profiles!launch_activity_actor_id_fkey(*)').eq('project_id', projectId).order('created_at', { ascending: false }).limit(20),
    supabase.from('launch_colorways').select('id, name, hex_code, status').eq('project_id', projectId).order('created_at'),
    supabase.from('launch_hpp_versions').select('id, version, total_hpp, recommended_price, status').eq('project_id', projectId).order('version', { ascending: false }),
    supabase.from('launch_size_charts').select('id, name, status').eq('project_id', projectId).order('created_at', { ascending: false }),
    supabase.from('launch_qc_checks').select('id, result, summary, checked_at').eq('project_id', projectId).order('created_at', { ascending: false }),
  ]);

  const failure = [projectResult, stagesResult, tasksResult, activityResult, colorResult, hppResult, sizeResult, qcResult].find(result => result.error);
  if (failure?.error) throw failure.error;

  return {
    project: projectResult.data as unknown as LaunchProject,
    stages: (stagesResult.data ?? []) as unknown as LaunchStage[],
    tasks: (tasksResult.data ?? []) as unknown as LaunchTask[],
    activity: (activityResult.data ?? []) as ProjectWorkspace['activity'],
    colorways: (colorResult.data ?? []) as ProjectWorkspace['colorways'],
    hpp: (hppResult.data ?? []) as ProjectWorkspace['hpp'],
    sizeCharts: (sizeResult.data ?? []) as ProjectWorkspace['sizeCharts'],
    qc: (qcResult.data ?? []) as ProjectWorkspace['qc'],
  };
}

export async function createProject(input: NewProjectInput) {
  const { data, error } = await supabase.rpc('create_launch_project', { p_payload: input });
  if (error) throw error;
  return String(data);
}

export async function completeTask(taskId: string) {
  const { error } = await supabase.from('launch_tasks').update({ status: 'DONE', completed_at: new Date().toISOString() }).eq('id', taskId);
  if (error) throw error;
}

export async function updateStage(stageId: string, status: string) {
  const { error } = await supabase.rpc('transition_launch_stage', { p_stage_id: stageId, p_status: status });
  if (error) throw error;
}

export async function uploadProjectReference(projectId: string, file: File) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Sesi upload tidak tersedia.');

  const folder = `gg-indo-apparel/product-launch/${projectId}`;
  const signatureResponse = await fetch('/api/cloudinary-sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ folder }),
  });
  if (!signatureResponse.ok) throw new Error('Tidak dapat menyiapkan upload gambar.');
  const signature = await signatureResponse.json() as { signature: string; timestamp: number; api_key: string; cloud_name: string };

  const body = new FormData();
  body.append('file', file);
  body.append('folder', folder);
  body.append('timestamp', String(signature.timestamp));
  body.append('api_key', signature.api_key);
  body.append('signature', signature.signature);
  const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloud_name}/image/upload`, { method: 'POST', body });
  if (!uploadResponse.ok) throw new Error('Upload gambar referensi gagal.');
  const uploaded = await uploadResponse.json() as { public_id: string; secure_url: string; width: number; height: number; format: string; bytes: number };

  const { data: media, error: mediaError } = await supabase.from('media_assets').insert({
    project_id: projectId,
    kind: 'REFERENCE',
    public_id: uploaded.public_id,
    secure_url: uploaded.secure_url,
    width: uploaded.width,
    height: uploaded.height,
    format: uploaded.format,
    bytes: uploaded.bytes,
  }).select('id').single();
  if (mediaError) throw mediaError;

  const { error } = await supabase.from('launch_projects').update({ reference_media_id: media.id, reference_image_url: uploaded.secure_url }).eq('id', projectId);
  if (error) throw error;
  return uploaded.secure_url;
}
