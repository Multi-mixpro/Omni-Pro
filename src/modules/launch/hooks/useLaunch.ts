import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/core/auth/useAuth';
import { completeTask, createProject, getProjectWorkspace, listBusinessUnits, listMyTasks, listProfiles, listProjects, updateStage } from '../data/launchRepository';

export const launchKeys = {
  projects: (status = 'ALL') => ['launch-projects', status] as const,
  project: (id: string) => ['launch-project', id] as const,
  tasks: (id: string) => ['launch-tasks', id] as const,
};

export function useProjects(status = 'ALL') { return useQuery({ queryKey: launchKeys.projects(status), queryFn: () => listProjects(status) }); }
export function useProject(id: string) { return useQuery({ queryKey: launchKeys.project(id), queryFn: () => getProjectWorkspace(id), enabled: Boolean(id) }); }
export function useBusinessUnits() { return useQuery({ queryKey: ['business-units'], queryFn: listBusinessUnits }); }
export function useProfiles() { return useQuery({ queryKey: ['profiles'], queryFn: listProfiles }); }
export function useMyTasks() { const auth = useAuth(); const id = auth.data?.profile?.id ?? ''; return useQuery({ queryKey: launchKeys.tasks(id), queryFn: () => listMyTasks(id), enabled: Boolean(id) }); }

export function useCreateProject() {
  const client = useQueryClient();
  return useMutation({ mutationFn: createProject, onSuccess: () => client.invalidateQueries({ queryKey: ['launch-projects'] }) });
}

export function useCompleteTask(projectId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: completeTask, onSuccess: async () => { await client.invalidateQueries({ queryKey: launchKeys.project(projectId) }); await client.invalidateQueries({ queryKey: ['launch-tasks'] }); } });
}

export function useUpdateStage(projectId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ stageId, status }: { stageId: string; status: string }) => updateStage(stageId, status), onSuccess: () => client.invalidateQueries({ queryKey: launchKeys.project(projectId) }) });
}
