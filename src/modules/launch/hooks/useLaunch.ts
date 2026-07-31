import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/core/auth/useAuth';
import { addColorway, addComment, addHppVersion, addMaterialCandidate, addProgressUpdate, addProjectReference, addQcCheck, addSample, approveMasterSample, completeTask, createCostComponent, createMasterMaterial, createMasterSupplier, createProductionBatch, createProject, createSizeChart, deactivateCostComponent, deactivateMasterMaterial, deactivateMasterSupplier, decideApproval, decideCommentRequest, deleteColorway, deleteComment, deleteHppVersion, deleteMaterialCandidate, deleteProgressUpdate, deleteProject, deleteQcCheck, deleteReference, deleteSample, deleteSizeChart, deleteVariantMatrixRow, finalizeHpp, finalizeSizeChart, generateVariantMatrix, getProjectWorkspace, linkMaterialSupplier, listBusinessUnits, listCostComponents, listMasterMaterials, listMasterSuppliers, listMaterialSuppliers, listMyTasks, listProfiles, listProjects, listRecentProgressUpdates, reportStageBlocker, requestApproval, resolveStageBlocker, saveReleasePlan, selectSupplierQuote, setColorwayStatus, setTaskDependency, unlinkMaterialSupplier, updateMasterMaterial, updateMasterSupplier, updateMaterialSupplierLink, updateProductionBatch, updateProject, updateResearchSummary, updateStage, updateVariantMatrixRow } from '../data/launchRepository';
import type { BlockerDraft, ColorwayDraft, CostComponentDraft, HppLineDraft, MasterMaterialDraft, MasterSupplierDraft, MaterialSupplierDraft, MaterialSupplierLinkDraft, ProductionBatchDraft, ProgressUpdateDraft, ProjectEditInput, ReleasePlanDraft, SampleDraft, SizeChartDraft } from '../domain/types';

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
export function useRecentProgressUpdates() { return useQuery({ queryKey: ['launch-recent-progress-updates'], queryFn: listRecentProgressUpdates, retry: false }); }

export function useCreateProject() {
  const client = useQueryClient();
  return useMutation({ mutationFn: createProject, onSuccess: () => client.invalidateQueries({ queryKey: ['launch-projects'] }) });
}

export function useDeleteProject() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (id: string) => deleteProject(id), onSuccess: () => client.invalidateQueries({ queryKey: ['launch-projects'] }) });
}

export function useCompleteTask(projectId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: completeTask, onSuccess: async () => { await client.invalidateQueries({ queryKey: launchKeys.project(projectId) }); await client.invalidateQueries({ queryKey: ['launch-tasks'] }); } });
}

export function useSetTaskDependency(projectId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ taskId, dependsOnId, type }: { taskId: string; dependsOnId: string | null; type: string }) => setTaskDependency(taskId, dependsOnId, type), onSuccess: () => client.invalidateQueries({ queryKey: launchKeys.project(projectId) }) });
}

export function useUpdateStage(projectId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ stageId, status }: { stageId: string; status: string }) => updateStage(stageId, status), onSuccess: () => client.invalidateQueries({ queryKey: launchKeys.project(projectId) }) });
}

export function useReportStageBlocker(projectId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ stageId, input }: { stageId: string; input: BlockerDraft }) => reportStageBlocker(stageId, input), onSuccess: () => client.invalidateQueries({ queryKey: launchKeys.project(projectId) }) });
}

export function useResolveStageBlocker(projectId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ blockerId, resolutionNote }: { blockerId: string; resolutionNote: string }) => resolveStageBlocker(blockerId, resolutionNote), onSuccess: () => client.invalidateQueries({ queryKey: launchKeys.project(projectId) }) });
}

export function useRequestApproval(projectId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (approvalType: string) => requestApproval(projectId, approvalType), onSuccess: () => client.invalidateQueries({ queryKey: launchKeys.project(projectId) }) });
}

export function useDecideApproval(projectId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ approvalId, status, note }: { approvalId: string; status: 'APPROVED' | 'REJECTED' | 'REVISION'; note: string }) => decideApproval(approvalId, status, note), onSuccess: () => client.invalidateQueries({ queryKey: launchKeys.project(projectId) }) });
}

export function useAddComment(projectId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ body, isDecisionRequest, decisionDeadline }: { body: string; isDecisionRequest: boolean; decisionDeadline?: string }) => addComment(projectId, body, isDecisionRequest, decisionDeadline), onSuccess: () => client.invalidateQueries({ queryKey: launchKeys.project(projectId) }) });
}

export function useDeleteComment(projectId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (id: string) => deleteComment(id), onSuccess: () => client.invalidateQueries({ queryKey: launchKeys.project(projectId) }) });
}

export function useDecideCommentRequest(projectId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ commentId, note }: { commentId: string; note: string }) => decideCommentRequest(commentId, note), onSuccess: () => client.invalidateQueries({ queryKey: launchKeys.project(projectId) }) });
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

export function useGenerateVariantMatrix(projectId: string) {
  return useProjectMutation(projectId, ({ colorwayIds, sizes, defaultUnitCost }: { colorwayIds: string[]; sizes: string[]; defaultUnitCost: number | null }) => generateVariantMatrix(projectId, colorwayIds, sizes, defaultUnitCost));
}

export function useUpdateVariantMatrixRow(projectId: string) {
  return useProjectMutation(projectId, ({ id, patch }: { id: string; patch: Parameters<typeof updateVariantMatrixRow>[1] }) => updateVariantMatrixRow(id, patch));
}

export function useDeleteVariantMatrixRow(projectId: string) {
  return useProjectMutation(projectId, (id: string) => deleteVariantMatrixRow(id));
}

export function useFinalizeSizeChart(projectId: string) {
  return useProjectMutation(projectId, (sizeChartId: string) => finalizeSizeChart(projectId, sizeChartId));
}

export function useCreateSizeChart(projectId: string) {
  return useProjectMutation(projectId, (input: SizeChartDraft) => createSizeChart(projectId, input));
}

export function useDeleteSizeChart(projectId: string) {
  return useProjectMutation(projectId, (id: string) => deleteSizeChart(id));
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

export const masterKeys = {
  materials: ['master-materials'] as const,
  suppliers: ['master-suppliers'] as const,
  costs: ['master-cost-components'] as const,
};

export function useMasterMaterials() { return useQuery({ queryKey: masterKeys.materials, queryFn: listMasterMaterials }); }
export function useMasterSuppliers() { return useQuery({ queryKey: masterKeys.suppliers, queryFn: listMasterSuppliers }); }
export function useCostComponents() { return useQuery({ queryKey: masterKeys.costs, queryFn: listCostComponents, retry: false }); }

export function useCreateMasterMaterial() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: MasterMaterialDraft) => createMasterMaterial(input), onSuccess: () => client.invalidateQueries({ queryKey: masterKeys.materials }) });
}

export function useUpdateMasterMaterial() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: MasterMaterialDraft }) => updateMasterMaterial(id, input), onSuccess: () => client.invalidateQueries({ queryKey: masterKeys.materials }) });
}

export function useDeactivateMasterMaterial() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (id: string) => deactivateMasterMaterial(id), onSuccess: () => client.invalidateQueries({ queryKey: masterKeys.materials }) });
}

export function useCreateMasterSupplier() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: MasterSupplierDraft) => createMasterSupplier(input), onSuccess: () => client.invalidateQueries({ queryKey: masterKeys.suppliers }) });
}

export function useUpdateMasterSupplier() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: MasterSupplierDraft }) => updateMasterSupplier(id, input), onSuccess: () => client.invalidateQueries({ queryKey: masterKeys.suppliers }) });
}

export function useDeactivateMasterSupplier() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (id: string) => deactivateMasterSupplier(id), onSuccess: () => client.invalidateQueries({ queryKey: masterKeys.suppliers }) });
}

export function useMaterialSuppliers(materialId: string) {
  return useQuery({ queryKey: ['material-suppliers', materialId], queryFn: () => listMaterialSuppliers(materialId), enabled: Boolean(materialId) });
}

export function useLinkMaterialSupplier(materialId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: MaterialSupplierLinkDraft) => linkMaterialSupplier(materialId, input), onSuccess: () => client.invalidateQueries({ queryKey: ['material-suppliers', materialId] }) });
}

export function useUpdateMaterialSupplierLink(materialId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateMaterialSupplierLink>[1] }) => updateMaterialSupplierLink(id, patch), onSuccess: () => client.invalidateQueries({ queryKey: ['material-suppliers', materialId] }) });
}

export function useUnlinkMaterialSupplier(materialId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (id: string) => unlinkMaterialSupplier(id), onSuccess: () => client.invalidateQueries({ queryKey: ['material-suppliers', materialId] }) });
}

export function useCreateCostComponent() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: CostComponentDraft) => createCostComponent(input), onSuccess: () => client.invalidateQueries({ queryKey: masterKeys.costs }) });
}

export function useDeactivateCostComponent() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (id: string) => deactivateCostComponent(id), onSuccess: () => client.invalidateQueries({ queryKey: masterKeys.costs }) });
}

export function useCreateProductionBatch(projectId: string) {
  return useProjectMutation(projectId, (input: ProductionBatchDraft) => createProductionBatch(projectId, input));
}

export function useUpdateProductionBatch(projectId: string) {
  return useProjectMutation(projectId, ({ id, patch }: { id: string; patch: Parameters<typeof updateProductionBatch>[1] }) => updateProductionBatch(id, patch));
}

export function useSaveReleasePlan(projectId: string) {
  return useProjectMutation(projectId, (input: ReleasePlanDraft) => saveReleasePlan(projectId, input));
}

export function useAddProgressUpdate(projectId: string) {
  return useProjectMutation(projectId, (input: ProgressUpdateDraft) => addProgressUpdate(projectId, input));
}

export function useDeleteProgressUpdate(projectId: string) {
  return useProjectMutation(projectId, (id: string) => deleteProgressUpdate(id));
}
