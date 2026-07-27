import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/core/auth/useAuth';
import { addColorway, addHppVersion, addMaterialCandidate, addProjectReference, addQcCheck, addSample, approveMasterSample, completeTask, createProject, deleteColorway, deleteHppVersion, deleteMaterialCandidate, deleteQcCheck, deleteReference, deleteSample, finalizeHpp, finalizeSizeChart, getProjectWorkspace, listBusinessUnits, listMyTasks, listProfiles, listProjects, selectSupplierQuote, setColorwayStatus, updateProject, updateResearchSummary, updateStage } from '../data/launchRepository';
import type { ColorwayDraft, HppLineDraft, MaterialSupplierDraft, ProjectEditInput, SampleDraft } from '../domain/types';

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

export function useUpdateProject(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectEditInput) => updateProject(projectId, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: launchKeys.project(projectId) });
      await client.invalidateQueries({ queryKey: ['launch-projects'] });
    },
  });
}

export function useAddReference(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof addProjectReference>[1]) => addProjectReference(projectId, input),
    onSuccess: () => client.invalidateQueries({ queryKey: launchKeys.project(projectId) }),
  });
}

export function useAddMaterial(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: MaterialSupplierDraft) => addMaterialCandidate(projectId, input),
    onSuccess: () => client.invalidateQueries({ queryKey: launchKeys.project(projectId) }),
  });
}

export function useSelectQuote(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ quoteId, materialId }: { quoteId: string; materialId: string }) => selectSupplierQuote(quoteId, materialId),
    onSuccess: () => client.invalidateQueries({ queryKey: launchKeys.project(projectId) }),
  });
}

function useProjectMutation<TInput>(projectId: string, mutationFn: (input: TInput) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => client.invalidateQueries({ queryKey: launchKeys.project(projectId) }) });
}

export function useAddSample(projectId: string) {
  return useProjectMutation(projectId, ({ input, nextVersion }: { input: SampleDraft; nextVersion: number }) => addSample(projectId, input, nextVersion));
}

export function useApproveMasterSample(projectId: string) {
  return useProjectMutation(projectId, (sampleId: string) => approveMasterSample(projectId, sampleId));
}

export function useAddHppVersion(projectId: string) {
  return useProjectMutation(projectId, ({ lines, targetMargin, nextVersion }: { lines: HppLineDraft[]; targetMargin: number | ''; nextVersion: number }) => addHppVersion(projectId, lines, targetMargin, nextVersion));
}

export function useFinalizeHpp(projectId: string) {
  return useProjectMutation(projectId, ({ hppId, recommendedPrice }: { hppId: string; recommendedPrice: number | '' }) => finalizeHpp(projectId, hppId, recommendedPrice));
}

export function useAddColorway(projectId: string) {
  return useProjectMutation(projectId, (input: ColorwayDraft) => addColorway(projectId, input));
}

export function useSetColorwayStatus(projectId: string) {
  return useProjectMutation(projectId, ({ colorwayId, status }: { colorwayId: string; status: 'CANDIDATE' | 'APPROVED' | 'REJECTED' }) => setColorwayStatus(colorwayId, status));
}

export function useFinalizeSizeChart(projectId: string) {
  return useProjectMutation(projectId, (sizeChartId: string) => finalizeSizeChart(projectId, sizeChartId));
}

export function useAddQcCheck(projectId: string) {
  return useProjectMutation(projectId, (input: { result: string; summary?: string; sample_id?: string }) => addQcCheck(projectId, input));
}

export function useDeleteReference(projectId: string) { return useProjectMutation(projectId, deleteReference); }
export function useDeleteMaterial(projectId: string) { return useProjectMutation(projectId, deleteMaterialCandidate); }
export function useDeleteSample(projectId: string) { return useProjectMutation(projectId, deleteSample); }
export function useDeleteHppVersion(projectId: string) { return useProjectMutation(projectId, deleteHppVersion); }
export function useDeleteColorway(projectId: string) { return useProjectMutation(projectId, deleteColorway); }
export function useDeleteQcCheck(projectId: string) { return useProjectMutation(projectId, deleteQcCheck); }

export function useUpdateResearchSummary(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (summary: string) => updateResearchSummary(projectId, summary),
    onSuccess: () => client.invalidateQueries({ queryKey: launchKeys.project(projectId) }),
  });
}
