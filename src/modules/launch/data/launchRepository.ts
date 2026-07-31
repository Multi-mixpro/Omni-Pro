import { supabase } from '@/integrations/supabase/client';
import type { BlockerDraft, BusinessUnit, ColorwayDraft, CostComponent, CostComponentDraft, HppLineDraft, LaunchProject, LaunchStage, LaunchTask, MasterMaterial, MasterMaterialDraft, MasterSupplier, MasterSupplierDraft, MaterialSupplierDraft, MaterialSupplierLink, MaterialSupplierLinkDraft, NewProjectInput, ProductionBatch, ProductionBatchDraft, Profile, ProgressUpdate, ProgressUpdateDraft, ProjectEditInput, ProjectWorkspace, ReferenceType, ReleasePlan, ReleasePlanDraft, SampleDraft, SizeChartDraft } from '../domain/types';

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

export async function listRecentProgressUpdates() {
  const { data, error } = await supabase.from('launch_progress_updates')
    .select('*, author:profiles!launch_progress_updates_author_id_fkey(*), project:launch_projects(id, code, article_name)')
    .order('created_at', { ascending: false })
    .limit(8);
  if (error) throw error;
  return (data ?? []) as unknown as ProgressUpdate[];
}

export async function getProjectWorkspace(projectId: string): Promise<ProjectWorkspace> {
  const [projectResult, stagesResult, tasksResult, activityResult, referenceResult, materialResult, colorResult, variantMatrixResult, hppResult, sizeResult, qcResult, sampleResult, blockerResult, approvalResult, commentResult, progressResult, productionResult, releaseResult] = await Promise.all([
    supabase.from('launch_projects').select(PROJECT_FIELDS).eq('id', projectId).single(),
    supabase.from('launch_stage_runs').select('*, owner:profiles!launch_stage_runs_owner_id_fkey(*)').eq('project_id', projectId).order('position'),
    supabase.from('launch_tasks').select('*, assignee:profiles!launch_tasks_assignee_id_fkey(*)').eq('project_id', projectId).order('created_at'),
    supabase.from('launch_activity').select('*, actor:profiles!launch_activity_actor_id_fkey(*)').eq('project_id', projectId).order('created_at', { ascending: false }).limit(20),
    supabase.from('launch_references').select('id, title, reference_type, source_url, image_url, insight, is_primary').eq('project_id', projectId).order('sort_order'),
    supabase.from('launch_material_candidates').select('id, proposed_name, role, composition, gsm, width_cm, color_notes, estimated_consumption, unit, status, quotes:launch_supplier_quotes(id, supplier_role, price, unit, moq, lead_time_days, status, supplier:suppliers(id, name, contact_name, phone, city))').eq('project_id', projectId).order('created_at'),
    supabase.from('launch_colorways').select('id, name, hex_code, status').eq('project_id', projectId).order('created_at'),
    supabase.from('launch_variant_matrix').select('id, project_id, colorway_id, size, sku, status, min_quantity, unit_cost, notes').eq('project_id', projectId).order('created_at'),
    supabase.from('launch_hpp_versions').select('id, version, total_hpp, recommended_price, target_margin_percent, status').eq('project_id', projectId).order('version', { ascending: false }),
    supabase.from('launch_size_charts').select('id, name, version, unit, status, sizes, measurements:launch_size_chart_measurements(id, point_code, point_name, position, tolerance_plus, tolerance_minus, values)').eq('project_id', projectId).order('created_at', { ascending: false }),
    supabase.from('launch_qc_checks').select('id, result, summary, checked_at').eq('project_id', projectId).order('created_at', { ascending: false }),
    supabase.from('launch_samples').select('id, version, sample_type, status, is_master, material_notes, pattern_notes, construction_notes, revision_notes').eq('project_id', projectId).order('version', { ascending: false }),
    supabase.from('launch_blockers').select('*, owner:profiles!launch_blockers_owner_id_fkey(*)').eq('project_id', projectId).order('created_at', { ascending: false }),
    supabase.from('launch_approvals').select('*, requester:profiles!launch_approvals_requested_by_fkey(*), decider:profiles!launch_approvals_decided_by_fkey(*)').eq('project_id', projectId).order('requested_at', { ascending: false }),
    supabase.from('launch_comments').select('*, author:profiles!launch_comments_author_id_fkey(*), decider:profiles!launch_comments_decided_by_fkey(*)').eq('project_id', projectId).order('created_at', { ascending: false }),
    supabase.from('launch_progress_updates').select('*, author:profiles!launch_progress_updates_author_id_fkey(*)').eq('project_id', projectId).order('created_at', { ascending: false }),
    supabase.from('launch_production_batches').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
    supabase.from('launch_release_plans').select('*').eq('project_id', projectId).maybeSingle(),
  ]);

  const failure = [projectResult, stagesResult, tasksResult, activityResult, referenceResult, materialResult, colorResult, variantMatrixResult, hppResult, sizeResult, qcResult, sampleResult, blockerResult, approvalResult, commentResult].find(result => result.error);
  if (failure?.error) throw failure.error;

  return {
    project: projectResult.data as unknown as LaunchProject,
    stages: (stagesResult.data ?? []) as unknown as LaunchStage[],
    tasks: (tasksResult.data ?? []) as unknown as LaunchTask[],
    activity: (activityResult.data ?? []) as ProjectWorkspace['activity'],
    references: (referenceResult.data ?? []) as ProjectWorkspace['references'],
    materials: (materialResult.data ?? []) as unknown as ProjectWorkspace['materials'],
    colorways: (colorResult.data ?? []) as ProjectWorkspace['colorways'],
    variantMatrix: (variantMatrixResult.data ?? []) as ProjectWorkspace['variantMatrix'],
    hpp: (hppResult.data ?? []) as ProjectWorkspace['hpp'],
    sizeCharts: (sizeResult.data ?? []) as ProjectWorkspace['sizeCharts'],
    qc: (qcResult.data ?? []) as ProjectWorkspace['qc'],
    approvals: (approvalResult.data ?? []) as unknown as ProjectWorkspace['approvals'],
    comments: (commentResult.data ?? []) as unknown as ProjectWorkspace['comments'],
    progressUpdates: progressResult.error ? [] : (progressResult.data ?? []) as unknown as ProgressUpdate[],
    samples: (sampleResult.data ?? []) as ProjectWorkspace['samples'],
    blockers: (blockerResult.data ?? []) as unknown as ProjectWorkspace['blockers'],
    productionBatches: productionResult.error ? [] : (productionResult.data ?? []) as ProductionBatch[],
    releasePlan: releaseResult.error ? null : releaseResult.data as ReleasePlan | null,
  };
}

export async function createProject(input: NewProjectInput) {
  const planned = await supabase.rpc('create_launch_project_brief', { p_payload: input });
  if (!planned.error) return String(planned.data);

  // Keep creation available during a rolling deployment where the frontend can
  // arrive shortly before the milestone RPC migration reaches Supabase.
  if (planned.error.code === 'PGRST202') {
    const fallback = await supabase.rpc('create_launch_project', { p_payload: input });
    if (fallback.error) throw fallback.error;
    return String(fallback.data);
  }

  throw planned.error;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from('launch_projects').delete().eq('id', id);
  if (error) throw error;
}

export async function addProjectReference(
  projectId: string,
  input: { title: string; reference_type: ReferenceType; source_url?: string; insight?: string; sort_order?: number },
) {
  const { data: sessionData } = await supabase.auth.getSession();
  const { error } = await supabase.from('launch_references').insert({
    project_id: projectId,
    title: input.title,
    reference_type: input.reference_type,
    source_url: input.source_url || null,
    insight: input.insight || null,
    sort_order: input.sort_order ?? 0,
    created_by: sessionData.session?.user.id,
  });
  if (error) throw error;
}

export async function updateProject(projectId: string, input: ProjectEditInput) {
  const { error } = await supabase.from('launch_projects').update({
    article_name: input.article_name.trim(),
    business_unit_id: input.business_unit_id,
    category: input.category.trim(),
    concept: input.concept?.trim() || null,
    source_notes: input.source_notes?.trim() || null,
    priority: input.priority,
    target_date: input.target_date || null,
    target_fix_date: input.target_fix_date || null,
    target_launch_date: input.target_launch_date || null,
  }).eq('id', projectId);
  if (error) throw error;
}

export async function updateResearchSummary(projectId: string, summary: string) {
  const { error } = await supabase.from('launch_projects').update({ research_summary: summary || null }).eq('id', projectId);
  if (error) throw error;
}

export async function addMaterialCandidate(projectId: string, input: MaterialSupplierDraft) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  const { data: candidate, error: candidateError } = await supabase.from('launch_material_candidates').insert({
    project_id: projectId,
    proposed_name: input.proposed_name.trim(),
    role: input.role,
    estimated_consumption: input.estimated_consumption === '' ? null : input.estimated_consumption,
    unit: input.unit,
    composition: input.composition?.trim() || null,
    gsm: input.gsm === '' ? null : input.gsm,
    width_cm: input.width_cm === '' ? null : input.width_cm,
    color_notes: input.color_notes?.trim() || null,
    suitability_notes: input.suitability_notes?.trim() || null,
    risk_notes: input.risk_notes?.trim() || null,
    created_by: userId,
  }).select('id').single();
  if (candidateError) throw candidateError;

  const supplierName = input.supplier_name?.trim();
  if (!supplierName) return;

  const { data: existing, error: lookupError } = await supabase.from('suppliers').select('id').ilike('name', supplierName).limit(1);
  if (lookupError) throw lookupError;

  let supplierId = existing?.[0]?.id as string | undefined;
  if (!supplierId) {
    const { data: created, error: supplierError } = await supabase.from('suppliers').insert({
      name: supplierName,
      category: input.role,
      contact_name: input.contact_name?.trim() || null,
      phone: input.phone?.trim() || null,
      city: input.city?.trim() || null,
      lead_time_days: input.lead_time_days === '' ? null : input.lead_time_days,
      minimum_order_notes: input.moq_notes?.trim() || null,
      quality_notes: input.supplier_notes?.trim() || null,
      created_by: userId,
    }).select('id').single();
    if (supplierError) throw supplierError;
    supplierId = created.id;
  }

  const { error: quoteError } = await supabase.from('launch_supplier_quotes').insert({
    project_id: projectId,
    supplier_id: supplierId,
    material_candidate_id: candidate.id,
    item_name: input.proposed_name.trim(),
    price: input.unit_price === '' ? 0 : input.unit_price,
    unit: input.price_unit,
    moq: input.moq === '' ? null : input.moq,
    lead_time_days: input.lead_time_days === '' ? null : input.lead_time_days,
    notes: input.supplier_notes?.trim() || null,
    supplier_role: input.supplier_role,
    created_by: userId,
  });
  if (quoteError) throw quoteError;
}

export async function selectSupplierQuote(quoteId: string, materialCandidateId: string) {
  // Only one quote per material may win, so competing quotes drop back to candidate.
  const { error: resetError } = await supabase.from('launch_supplier_quotes')
    .update({ status: 'CANDIDATE', selected_at: null })
    .eq('material_candidate_id', materialCandidateId)
    .neq('id', quoteId);
  if (resetError) throw resetError;

  const { error } = await supabase.from('launch_supplier_quotes')
    .update({ status: 'SELECTED', selected_at: new Date().toISOString() })
    .eq('id', quoteId);
  if (error) throw error;

  const { error: materialError } = await supabase.from('launch_material_candidates')
    .update({ status: 'APPROVED', approved_at: new Date().toISOString() })
    .eq('id', materialCandidateId);
  if (materialError) throw materialError;
}

async function currentUserId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id;
}

export async function addSample(projectId: string, input: SampleDraft, nextVersion: number) {
  const { error } = await supabase.from('launch_samples').insert({
    project_id: projectId,
    version: nextVersion,
    sample_type: input.sample_type,
    status: 'IN_PROGRESS',
    material_notes: input.material_notes?.trim() || null,
    pattern_notes: input.pattern_notes?.trim() || null,
    construction_notes: input.construction_notes?.trim() || null,
    revision_notes: input.revision_notes?.trim() || null,
    created_by: await currentUserId(),
  });
  if (error) throw error;
}

export async function approveMasterSample(projectId: string, sampleId: string) {
  // A project keeps exactly one master sample, so any previous master steps down.
  const { error: resetError } = await supabase.from('launch_samples')
    .update({ is_master: false })
    .eq('project_id', projectId)
    .neq('id', sampleId);
  if (resetError) throw resetError;

  const { error } = await supabase.from('launch_samples')
    .update({ status: 'APPROVED', is_master: true, approved_by: await currentUserId(), approved_at: new Date().toISOString() })
    .eq('id', sampleId);
  if (error) throw error;
}

export async function addHppVersion(projectId: string, lines: HppLineDraft[], targetMargin: number | '', nextVersion: number) {
  const { data: version, error: versionError } = await supabase.from('launch_hpp_versions').insert({
    project_id: projectId,
    version: nextVersion,
    status: 'DRAFT',
    target_margin_percent: targetMargin === '' ? null : targetMargin,
    created_by: await currentUserId(),
  }).select('id').single();
  if (versionError) throw versionError;

  const payload = lines.filter(line => line.item_name.trim()).map(line => ({
    hpp_version_id: version.id,
    category: line.category,
    item_name: line.item_name.trim(),
    quantity: line.quantity === '' ? 1 : line.quantity,
    unit: line.unit,
    unit_price: line.unit_price === '' ? 0 : line.unit_price,
    waste_percent: line.waste_percent === '' ? 0 : line.waste_percent,
    notes: line.notes?.trim() || null,
  }));
  if (payload.length) {
    const { error: lineError } = await supabase.from('launch_hpp_lines').insert(payload);
    if (lineError) throw lineError;
  }
  return version.id as string;
}

export async function finalizeHpp(projectId: string, hppId: string, recommendedPrice: number | '') {
  const { error: supersedeError } = await supabase.from('launch_hpp_versions')
    .update({ status: 'SUPERSEDED' })
    .eq('project_id', projectId)
    .eq('status', 'FINAL')
    .neq('id', hppId);
  if (supersedeError) throw supersedeError;

  const { error } = await supabase.from('launch_hpp_versions')
    .update({ status: 'FINAL', recommended_price: recommendedPrice === '' ? null : recommendedPrice, finalized_by: await currentUserId(), finalized_at: new Date().toISOString() })
    .eq('id', hppId);
  if (error) throw error;
}

export async function addColorway(projectId: string, input: ColorwayDraft) {
  const { error } = await supabase.from('launch_colorways').insert({
    project_id: projectId,
    name: input.name.trim(),
    color_code: input.color_code?.trim() || null,
    hex_code: input.hex_code || null,
    panel_notes: input.panel_notes?.trim() || null,
    created_by: await currentUserId(),
  });
  if (error) throw error;
}

export async function setColorwayStatus(colorwayId: string, status: 'CANDIDATE' | 'APPROVED' | 'REJECTED') {
  const { error } = await supabase.from('launch_colorways').update({ status }).eq('id', colorwayId);
  if (error) throw error;
}

export async function finalizeSizeChart(projectId: string, sizeChartId: string) {
  const { error: supersedeError } = await supabase.from('launch_size_charts')
    .update({ status: 'SUPERSEDED' })
    .eq('project_id', projectId)
    .eq('status', 'FINAL')
    .neq('id', sizeChartId);
  if (supersedeError) throw supersedeError;

  const { error } = await supabase.from('launch_size_charts')
    .update({ status: 'FINAL', finalized_by: await currentUserId(), finalized_at: new Date().toISOString() })
    .eq('id', sizeChartId);
  if (error) throw error;
}

export async function createSizeChart(projectId: string, input: SizeChartDraft) {
  const { data: chart, error: chartError } = await supabase.from('launch_size_charts').insert({
    project_id: projectId,
    name: input.name.trim(),
    version: input.version,
    unit: input.unit,
    sizes: input.sizes,
    status: 'DRAFT',
    created_by: await currentUserId(),
  }).select('id').single();
  if (chartError) throw chartError;

  const rows = input.measurements.filter(item => item.point_name.trim()).map((item, index) => ({
    size_chart_id: chart.id,
    point_code: item.point_code.trim() || `P${String(index + 1).padStart(2, '0')}`,
    point_name: item.point_name.trim(),
    position: index + 1,
    tolerance_plus: item.tolerance_plus === '' ? 0 : item.tolerance_plus,
    tolerance_minus: item.tolerance_minus === '' ? 0 : item.tolerance_minus,
    values: item.values,
  }));
  if (rows.length) {
    const { error } = await supabase.from('launch_size_chart_measurements').insert(rows);
    if (error) throw error;
  }
  return chart.id as string;
}

export const deleteSizeChart = (id: string) => removeRow('launch_size_charts', id);

export async function addQcCheck(projectId: string, input: { result: string; summary?: string; sample_id?: string }) {
  const { error } = await supabase.from('launch_qc_checks').insert({
    project_id: projectId,
    sample_id: input.sample_id || null,
    result: input.result,
    summary: input.summary?.trim() || null,
    checked_by: await currentUserId(),
    checked_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// Deleting brief/workstream rows is allowed for launch.admin only (RLS), so the
// UI surfaces the failure instead of silently leaving the row on screen.
async function removeRow(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

export const deleteReference = (id: string) => removeRow('launch_references', id);
export const deleteMaterialCandidate = (id: string) => removeRow('launch_material_candidates', id);
export const deleteSample = (id: string) => removeRow('launch_samples', id);
export const deleteHppVersion = (id: string) => removeRow('launch_hpp_versions', id);
export const deleteColorway = (id: string) => removeRow('launch_colorways', id);
export const deleteQcCheck = (id: string) => removeRow('launch_qc_checks', id);

export async function completeTask(taskId: string) {
  const { error } = await supabase.rpc('complete_launch_task', { p_task_id: taskId });
  if (error) throw error;
}

export async function setTaskDependency(taskId: string, dependsOnTaskId: string | null, dependencyType: string) {
  const { error } = await supabase.rpc('set_task_dependency', { p_task_id: taskId, p_depends_on_task_id: dependsOnTaskId, p_dependency_type: dependencyType });
  if (error) throw error;
}

export async function updateStage(stageId: string, status: string) {
  const { error } = await supabase.rpc('transition_launch_stage', { p_stage_id: stageId, p_status: status });
  if (error) throw error;
}

export async function addComment(projectId: string, body: string, isDecisionRequest: boolean, decisionDeadline?: string) {
  const userId = await currentUserId();
  const { error } = await supabase.from('launch_comments').insert({
    project_id: projectId, author_id: userId, body: body.trim(),
    is_decision_request: isDecisionRequest, decision_deadline: decisionDeadline || null,
  });
  if (error) throw error;
}

export const deleteComment = (id: string) => removeRow('launch_comments', id);

export async function decideCommentRequest(commentId: string, note: string) {
  const { error } = await supabase.rpc('decide_comment_request', { p_comment_id: commentId, p_note: note.trim() });
  if (error) throw error;
}

export async function requestApproval(projectId: string, approvalType: string) {
  const userId = await currentUserId();
  const { error } = await supabase.from('launch_approvals').insert({
    project_id: projectId, approval_type: approvalType, status: 'PENDING', requested_by: userId,
  });
  if (error) throw error;
}

export async function decideApproval(approvalId: string, status: 'APPROVED' | 'REJECTED' | 'REVISION', note: string) {
  const userId = await currentUserId();
  const { error } = await supabase.from('launch_approvals').update({
    status, decision_note: note.trim() || null, decided_by: userId, decided_at: new Date().toISOString(),
  }).eq('id', approvalId);
  if (error) throw error;
}

export async function reportStageBlocker(stageId: string, input: BlockerDraft) {
  const { data, error } = await supabase.rpc('report_stage_blocker', {
    p_stage_id: stageId,
    p_blocker_type: input.blocker_type,
    p_description: input.description.trim(),
    p_target_resolution_date: input.target_resolution_date || null,
    p_impact: input.impact?.trim() || null,
    p_affects_target: input.affects_target,
  });
  if (error) throw error;
  return data as string;
}

export async function resolveStageBlocker(blockerId: string, resolutionNote: string) {
  const { error } = await supabase.rpc('resolve_stage_blocker', { p_blocker_id: blockerId, p_resolution_note: resolutionNote.trim() });
  if (error) throw error;
}

export async function uploadProjectReference(
  projectId: string,
  file: File,
  options: { isPrimary?: boolean; sortOrder?: number; title?: string } = {},
) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error(`${file.name}: format gambar tidak didukung.`);
  if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name}: ukuran gambar melebihi 10 MB.`);
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const userId = sessionData.session?.user.id;
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
    metadata: { original_name: file.name },
  }).select('id').single();
  if (mediaError) throw mediaError;

  const { error: referenceError } = await supabase.from('launch_references').insert({
    project_id: projectId,
    title: options.title || file.name.replace(/\.[^.]+$/, ''),
    reference_type: 'PRODUCT',
    image_url: uploaded.secure_url,
    media_asset_id: media.id,
    sort_order: options.sortOrder ?? 0,
    is_primary: options.isPrimary ?? false,
    created_by: userId,
  });
  if (referenceError) throw referenceError;

  if (options.isPrimary) {
    const { error } = await supabase.from('launch_projects').update({ reference_media_id: media.id, reference_image_url: uploaded.secure_url }).eq('id', projectId);
    if (error) throw error;
  }
  return uploaded.secure_url;
}

export async function listMasterMaterials() {
  const { data, error } = await supabase.from('materials').select('*').eq('is_active', true).order('name');
  if (error) throw error;
  return (data ?? []) as MasterMaterial[];
}

export async function createMasterMaterial(input: MasterMaterialDraft) {
  const { data, error } = await supabase.from('materials').insert({
    name: input.name.trim(),
    category: input.category.trim(),
    composition: input.composition?.trim() || null,
    gsm: input.gsm === '' || input.gsm === undefined ? null : input.gsm,
    width_cm: input.width_cm === '' || input.width_cm === undefined ? null : input.width_cm,
    unit: input.unit,
    characteristics: input.characteristics?.trim() || null,
    care_notes: input.care_notes?.trim() || null,
    created_by: await currentUserId(),
  }).select('*').single();
  if (error) throw error;
  return data as MasterMaterial;
}

export async function updateMasterMaterial(id: string, input: MasterMaterialDraft) {
  const { error } = await supabase.from('materials').update({
    name: input.name.trim(),
    category: input.category.trim(),
    composition: input.composition?.trim() || null,
    gsm: input.gsm === '' || input.gsm === undefined ? null : input.gsm,
    width_cm: input.width_cm === '' || input.width_cm === undefined ? null : input.width_cm,
    unit: input.unit,
    characteristics: input.characteristics?.trim() || null,
    care_notes: input.care_notes?.trim() || null,
  }).eq('id', id);
  if (error) throw error;
}

export async function deactivateMasterMaterial(id: string) {
  const { error } = await supabase.from('materials').update({ is_active: false }).eq('id', id);
  if (error) throw error;
}

export async function findOrCreateMasterMaterial(input: MasterMaterialDraft) {
  const { data: existing, error: findError } = await supabase.from('materials')
    .select('id').eq('is_active', true).ilike('name', input.name.trim()).limit(1).maybeSingle();
  if (findError) throw findError;
  if (existing) return existing.id as string;
  const created = await createMasterMaterial(input);
  return created.id;
}

export async function listMasterSuppliers() {
  const { data, error } = await supabase.from('suppliers').select('*').eq('is_active', true).order('name');
  if (error) throw error;
  return (data ?? []) as MasterSupplier[];
}

export async function createMasterSupplier(input: MasterSupplierDraft) {
  const { data, error } = await supabase.from('suppliers').insert({
    name: input.name.trim(),
    category: input.category?.trim() || null,
    contact_name: input.contact_name?.trim() || null,
    phone: input.phone?.trim() || null,
    city: input.city?.trim() || null,
    address: input.address?.trim() || null,
    lead_time_days: input.lead_time_days === '' || input.lead_time_days === undefined ? null : input.lead_time_days,
    minimum_order_notes: input.minimum_order_notes?.trim() || null,
    quality_notes: input.quality_notes?.trim() || null,
    created_by: await currentUserId(),
  }).select('*').single();
  if (error) throw error;
  return data as MasterSupplier;
}

export async function updateMasterSupplier(id: string, input: MasterSupplierDraft) {
  const { error } = await supabase.from('suppliers').update({
    name: input.name.trim(),
    category: input.category?.trim() || null,
    contact_name: input.contact_name?.trim() || null,
    phone: input.phone?.trim() || null,
    city: input.city?.trim() || null,
    address: input.address?.trim() || null,
    lead_time_days: input.lead_time_days === '' || input.lead_time_days === undefined ? null : input.lead_time_days,
    minimum_order_notes: input.minimum_order_notes?.trim() || null,
    quality_notes: input.quality_notes?.trim() || null,
  }).eq('id', id);
  if (error) throw error;
}

export async function deactivateMasterSupplier(id: string) {
  const { error } = await supabase.from('suppliers').update({ is_active: false }).eq('id', id);
  if (error) throw error;
}

export async function findOrCreateMasterSupplier(input: MasterSupplierDraft) {
  const { data: existing, error: findError } = await supabase.from('suppliers')
    .select('id').eq('is_active', true).ilike('name', input.name.trim()).limit(1).maybeSingle();
  if (findError) throw findError;
  if (existing) return existing.id as string;
  const created = await createMasterSupplier(input);
  return created.id;
}

export async function listCostComponents() {
  const { data, error } = await supabase.from('cost_components').select('*').eq('is_active', true).order('category').order('name');
  if (error) throw error;
  return (data ?? []) as CostComponent[];
}

export async function createCostComponent(input: CostComponentDraft) {
  const { data, error } = await supabase.from('cost_components').insert({
    name: input.name.trim(),
    category: input.category,
    calculation_method: input.calculation_method,
    unit: input.unit,
    default_price: input.default_price === '' || input.default_price === undefined ? null : input.default_price,
    notes: input.notes?.trim() || null,
    created_by: await currentUserId(),
  }).select('*').single();
  if (error) throw error;
  return data as CostComponent;
}

export async function deactivateCostComponent(id: string) {
  const { error } = await supabase.from('cost_components').update({ is_active: false }).eq('id', id);
  if (error) throw error;
}

export async function createProductionBatch(projectId: string, input: ProductionBatchDraft) {
  const { error } = await supabase.from('launch_production_batches').insert({
    project_id: projectId,
    batch_code: input.batch_code.trim(),
    vendor_name: input.vendor_name?.trim() || null,
    planned_start: input.planned_start || null,
    target_finish: input.target_finish || null,
    total_quantity: input.total_quantity === '' ? 0 : input.total_quantity,
    notes: input.notes?.trim() || null,
    created_by: await currentUserId(),
  });
  if (error) throw error;
}

export async function updateProductionBatch(id: string, patch: Partial<Pick<ProductionBatch, 'status' | 'actual_start' | 'actual_finish' | 'cutting_progress' | 'sewing_progress' | 'finishing_progress' | 'qc_progress' | 'quantity_passed' | 'quantity_rejected' | 'quantity_reworked' | 'notes'>>) {
  const { error } = await supabase.from('launch_production_batches').update(patch).eq('id', id);
  if (error) throw error;
}

export async function saveReleasePlan(projectId: string, input: ReleasePlanDraft) {
  const { error } = await supabase.from('launch_release_plans').upsert({
    project_id: projectId,
    final_product_name: input.final_product_name?.trim() || null,
    product_description: input.product_description?.trim() || null,
    selling_points: input.selling_points?.trim() || null,
    retail_price: input.retail_price === '' || input.retail_price === undefined ? null : input.retail_price,
    marketing_start_date: input.marketing_start_date || null,
    launch_date: input.launch_date || null,
    channel_links: input.channel_links,
    readiness_checks: input.readiness_checks,
    status: input.status,
    created_by: await currentUserId(),
  }, { onConflict: 'project_id' });
  if (error) throw error;
}

export async function addProgressUpdate(projectId: string, input: ProgressUpdateDraft) {
  const { error } = await supabase.from('launch_progress_updates').insert({
    project_id: projectId,
    stage_code: input.stage_code || null,
    author_id: await currentUserId(),
    update_type: input.update_type,
    completed_text: input.completed_text?.trim() || null,
    current_text: input.current_text?.trim() || null,
    blocker_text: input.blocker_text?.trim() || null,
    decision_needed: input.decision_needed?.trim() || null,
    next_step: input.next_step?.trim() || null,
    forecast_finish: input.forecast_finish || null,
    progress_percent: input.progress_percent === '' || input.progress_percent === undefined ? null : input.progress_percent,
  });
  if (error) throw error;
}

export async function deleteProgressUpdate(id: string) {
  const { error } = await supabase.from('launch_progress_updates').delete().eq('id', id);
  if (error) throw error;
}

export async function listMaterialSuppliers(materialId: string) {
  const { data, error } = await supabase.from('material_suppliers')
    .select('id, material_id, supplier_id, is_primary, unit_price, price_unit, moq, lead_time_days, notes, supplier:suppliers(id, name, contact_name, phone, city)')
    .eq('material_id', materialId).order('is_primary', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MaterialSupplierLink[];
}

export async function linkMaterialSupplier(materialId: string, input: MaterialSupplierLinkDraft) {
  const { error } = await supabase.from('material_suppliers').insert({
    material_id: materialId,
    supplier_id: input.supplier_id,
    is_primary: input.is_primary ?? false,
    unit_price: input.unit_price === '' || input.unit_price === undefined ? null : input.unit_price,
    price_unit: input.price_unit || null,
    moq: input.moq === '' || input.moq === undefined ? null : input.moq,
    lead_time_days: input.lead_time_days === '' || input.lead_time_days === undefined ? null : input.lead_time_days,
    notes: input.notes?.trim() || null,
    created_by: await currentUserId(),
  });
  if (error) throw error;
}

export async function updateMaterialSupplierLink(id: string, patch: { is_primary?: boolean; unit_price?: number | null; price_unit?: string | null; moq?: number | null; lead_time_days?: number | null; notes?: string | null }) {
  const { error } = await supabase.from('material_suppliers').update(patch).eq('id', id);
  if (error) throw error;
}

export const unlinkMaterialSupplier = (id: string) => removeRow('material_suppliers', id);

export async function generateVariantMatrix(projectId: string, colorwayIds: string[], sizes: string[], defaultUnitCost: number | null) {
  const userId = await currentUserId();
  const rows: { project_id: string; colorway_id: string; size: string; sku: string; unit_cost: number | null; created_by: string | undefined }[] = [];
  for (const colorwayId of colorwayIds) {
    for (const size of sizes) {
      const { data: sku, error: skuError } = await supabase.rpc('generate_variant_sku', { p_project_id: projectId, p_colorway_id: colorwayId, p_size: size });
      if (skuError) throw skuError;
      rows.push({ project_id: projectId, colorway_id: colorwayId, size, sku: sku as string, unit_cost: defaultUnitCost, created_by: userId });
    }
  }
  if (!rows.length) return;
  const { error } = await supabase.from('launch_variant_matrix').upsert(rows, { onConflict: 'colorway_id,size', ignoreDuplicates: true });
  if (error) throw error;
}

export async function updateVariantMatrixRow(id: string, patch: { sku?: string; status?: string; min_quantity?: number | null; unit_cost?: number | null; notes?: string | null }) {
  const { error } = await supabase.from('launch_variant_matrix').update(patch).eq('id', id);
  if (error) throw error;
}

export const deleteVariantMatrixRow = (id: string) => removeRow('launch_variant_matrix', id);
