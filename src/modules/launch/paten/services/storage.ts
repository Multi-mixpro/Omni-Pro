/**
 * Product Launch OS 3.0 - Supabase persistence and compatibility bridge.
 *
 * PATEN is the canonical product shape. Existing normalized Product Launch
 * tables are imported as a baseline; richer PATEN edits are persisted as
 * realtime records in public.paten_records.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  ApprovalGate,
  Article,
  ArticleFile,
  ArticleStage,
  BlockerItem,
  BusinessUnit,
  DecisionRequest,
  MaterialMaster,
  ProgressUpdate,
  ServiceMaster,
  Supplier,
  TaskItem,
} from '../types';
type MockModule = typeof import('../data/mockData');
let _mockCache: MockModule | null = null;
async function loadMock(): Promise<MockModule> {
  if (!_mockCache) _mockCache = await import('../data/mockData');
  return _mockCache;
}

// Supabase compatibility rows span multiple evolving legacy table shapes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
type RecordType =
  | 'article'
  | 'supplier'
  | 'material'
  | 'service'
  | 'task'
  | 'blocker'
  | 'decision'
  | 'approval'
  | 'progress_update';

export interface WorkspaceSnapshot {
  articles: Article[];
  suppliers: Supplier[];
  materials: MaterialMaster[];
  services: ServiceMaster[];
  tasks: TaskItem[];
  blockers: BlockerItem[];
  decisions: DecisionRequest[];
  approvals: ApprovalGate[];
  updates: ProgressUpdate[];
  source: 'supabase' | 'demo';
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const lastIds = new Map<RecordType, Set<string>>();
const lastPayloads = new Map<RecordType, Map<string, string>>();
const lastRevisions = new Map<RecordType, Map<string, number>>();
const errorListeners = new Set<(message: string | null) => void>();
let persistenceQueue: Promise<void> = Promise.resolve();
let lastLocalWriteTime = 0;

// Master data cache — these tables rarely change and don't need realtime reload
let masterDataCache: {
  profiles: Row[];
  suppliers: Row[];
  materials: Row[];
  materialLinks: Row[];
  costComponents: Row[];
} | null = null;
let lastReloadTime = 0;

function reportError(reason: unknown) {
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === 'object' && reason && 'message' in reason
        ? String((reason as { message: unknown }).message)
        : 'Sinkronisasi database gagal.';
  console.error('[PATEN sync]', reason);
  errorListeners.forEach((listener) => listener(message));
}

function clearError() {
  errorListeners.forEach((listener) => listener(null));
}

// PostgREST builders are PromiseLike with table-specific generics unavailable here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rows(query: any): Promise<Row[]> {
  const result = await query;
  if (result.error) throw result.error;
  return Array.isArray(result.data) ? result.data : [];
}

function rowsFor<T extends { id: string }>(
  base: T[],
  type: RecordType,
  bridgeRows: Row[],
): T[] {
  const map = new Map(base.map((item) => [item.id, item]));
  bridgeRows
    .filter((record) => record.record_type === type)
    .forEach((record) => {
      if (record.is_deleted) {
        map.delete(record.record_id);
        return;
      }
      const current = map.get(record.record_id);
      const merged = {
        ...(current || {}),
        ...(record.payload || {}),
        id: record.record_id,
      } as T;
      if (type === 'article' && current) {
        const baseline = current as unknown as Article;
        Object.assign(merged as unknown as Article, {
          files: baseline.files || [],
          teamComments: baseline.teamComments || [],
        });
      }
      map.set(record.record_id, merged);
    });
  const result = Array.from(map.values());
  lastRevisions.set(
    type,
    new Map(
      bridgeRows
        .filter((record) => record.record_type === type)
        .map((record) => [String(record.record_id), Number(record.revision || 0)]),
    ),
  );
  lastIds.set(type, new Set(result.map((item) => item.id)));
  lastPayloads.set(
    type,
    new Map(result.map((item) => [item.id, JSON.stringify(item)])),
  );
  return result;
}

function mapBusinessUnit(row: Row): BusinessUnit {
  const name = row.business_unit?.name;
  if (name) return name;
  const code = String(row.business_unit?.code || row.business_unit_code || '').toUpperCase();
  if (code === 'GUDSKUY') return 'GUDSKUY';
  if (code === 'GG_SUPPLY') return 'GG Supply';
  return 'GUDSKUY';
}

function mapStage(stage: unknown): ArticleStage {
  const value = String(stage || '').toUpperCase();
  if (value === 'SPECIFICATION') return 'Specification';
  if (value === 'SOURCING') return 'Source & Pattern';
  if (value === 'SAMPLING') return 'Sampling';
  if (value === 'COSTING') return 'Costing';
  if (value === 'QC' || value === 'OWNER_APPROVAL') return 'Production Plan';
  if (value === 'PRODUCTION_READY') return 'Production';
  if (value === 'LAUNCH') return 'Launch';
  return 'Prospect';
}

function mapStatus(status: unknown): Article['status'] {
  const value = String(status || '').toUpperCase();
  if (value === 'DRAFT') return 'Draft';
  if (value === 'BLOCKED') return 'Blocked';
  if (value === 'IN_REVIEW') return 'Ready Queue';
  if (value === 'READY_FOR_PRODUCTION') return 'Ready for Production';
  if (value === 'ARCHIVED') return 'Archived';
  return 'Active';
}

function defaultPanels(): Article['workspacePanels'] {
  return [
    { key: 'brief', title: 'Brief & Direction', subtitle: 'Tujuan, target, dan referensi', isExpanded: true, isPinned: true, status: 'Incomplete', completenessPercent: 0, missingRequiredCount: 1, ownerRole: 'Pimpro' },
    { key: 'materials', title: 'Materials & Accessories', subtitle: 'Material, supplier, dan BOM', isExpanded: true, isPinned: true, status: 'Incomplete', completenessPercent: 0, missingRequiredCount: 1, ownerRole: 'Sourcing' },
    { key: 'colors', title: 'Colors & Variants', subtitle: 'Colorway dan identitas SKU', isExpanded: true, isPinned: false, status: 'Incomplete', completenessPercent: 0, missingRequiredCount: 1, ownerRole: 'Designer' },
    { key: 'sizes', title: 'Sizes & Size Chart', subtitle: 'Spesifikasi ukuran', isExpanded: true, isPinned: false, status: 'Incomplete', completenessPercent: 0, missingRequiredCount: 1, ownerRole: 'Pattern Maker' },
    { key: 'hpp', title: 'HPP & Pricing', subtitle: 'Biaya dan simulasi harga', isExpanded: true, isPinned: true, status: 'Incomplete', completenessPercent: 0, missingRequiredCount: 1, ownerRole: 'Finance' },
  ];
}

function legacyArticle(
  project: Row,
  related: {
    references: Row[];
    candidates: Row[];
    quotes: Row[];
    colorways: Row[];
    samples: Row[];
    hppVersions: Row[];
    hppLines: Row[];
    sizeCharts: Row[];
    measurements: Row[];
    batches: Row[];
    releasePlans: Row[];
    variantRows: Row[];
    mediaAssets: Row[];
    comments: Row[];
    blockers: Row[];
    approvals: Row[];
  },
): Article {
  const projectId = String(project.id);
  const selectedQuotes = related.quotes.filter(
    (quote) => quote.project_id === projectId && String(quote.status).toUpperCase() === 'SELECTED',
  );
  const latestHpp = related.hppVersions
    .filter((version) => version.project_id === projectId)
    .sort((a, b) => Number(b.version || 0) - Number(a.version || 0))[0];
  const hppLines = latestHpp
    ? related.hppLines.filter((line) => line.hpp_version_id === latestHpp.id)
    : [];
  const latestSizeChart = related.sizeCharts
    .filter((chart) => chart.project_id === projectId)
    .sort((a, b) => Number(b.version || 0) - Number(a.version || 0))[0];
  const sizeRows = latestSizeChart
    ? related.measurements.filter((item) => item.size_chart_id === latestSizeChart.id)
    : [];
  const release = related.releasePlans.find((item) => item.project_id === projectId);
  const projectColorways = related.colorways.filter((item) => item.project_id === projectId);
  const projectVariants = related.variantRows.filter((item) => item.project_id === projectId);
  const targetDate = String(project.target_date || '');
  const blockerCount = related.blockers.filter(
    (item) => item.project_id === projectId && String(item.status).toUpperCase() !== 'RESOLVED',
  ).length;
  const pendingApprovalCount = related.approvals.filter(
    (item) => item.project_id === projectId && String(item.status).toUpperCase() === 'PENDING',
  ).length;

  const materials = related.candidates
    .filter((candidate) => candidate.project_id === projectId)
    .map((candidate) => {
      const quote = selectedQuotes.find(
        (item) => item.material_candidate_id === candidate.id,
      );
      const net = Number(candidate.estimated_consumption || 0);
      const price = Number(quote?.price || 0);
      return {
        id: String(candidate.id),
        materialId: String(candidate.material_id || candidate.id),
        materialName: String(candidate.proposed_name || 'Material'),
        group: String(candidate.role || 'main_fabric').toLowerCase(),
        usageArea: String(candidate.suitability_notes || candidate.role || 'Komponen'),
        supplierId: String(quote?.supplier_id || ''),
        supplierName: String(quote?.supplier_name || 'Belum dipilih'),
        netConsumption: net,
        consumptionUnit: String(candidate.unit || quote?.unit || 'meter'),
        wastePercent: Number(quote?.waste_percent || 0),
        grossConsumption: net,
        effectiveUnitPrice: price,
        priceSourceStatus: quote ? 'Valid' as const : 'Manual' as const,
        costPerProduct: net * price,
        isCustomPrice: false,
      };
    });

  const calculatedHpp = Number(
    latestHpp?.total_hpp ||
      materials.reduce((sum, item) => sum + item.costPerProduct, 0),
  );
  const targetMsrp = Number(release?.retail_price || latestHpp?.recommended_price || 0);

  return {
    id: projectId,
    code: String(project.code || `ART-${projectId.slice(0, 6)}`),
    name: String(project.article_name || 'Artikel tanpa nama'),
    category: 'Accessory / Custom',
    subCategory: String(project.category || 'General'),
    businessUnit: mapBusinessUnit(project),
    genderTarget: 'Unisex',
    seasonCollection: '',
    mainImage: String(project.reference_image_url || ''),
    galleryImages: [],
    files: related.mediaAssets
      .filter((media) => media.project_id === projectId && !media.deleted_at)
      .map((media) => ({
        id: String(media.id),
        name: String(media.metadata?.original_name || media.public_id || 'File'),
        url: String(media.secure_url || ''),
        kind: String(media.kind || 'OTHER') as ArticleFile['kind'],
        mimeType: String(media.metadata?.mime_type || ''),
        bytes: Number(media.bytes || 0),
        uploadedAt: String(media.created_at || ''),
      })),
    teamComments: related.comments
      .filter((comment) => comment.project_id === projectId && !comment.is_decision_request)
      .map((comment) => ({
        id: String(comment.id),
        authorName: String(comment.author?.full_name || 'Tim'),
        authorAvatar: String(comment.author?.avatar_url || ''),
        body: String(comment.body || ''),
        createdAt: String(comment.created_at || ''),
      })),
    stage: mapStage(project.current_stage),
    status: mapStatus(project.status),
    workflowProgressPercent: Number(project.progress || 0),
    dataCompletenessPercent: Number(project.progress || 0),
    scheduleHealth: blockerCount > 0 ? 'At Risk' : targetDate && targetDate < new Date().toISOString().slice(0, 10) ? 'Overdue' : 'On Track',
    costConfidence: latestHpp?.status === 'FINAL' ? 'Locked - Production' : latestHpp ? 'Medium - Quoted' : 'Low - Estimate',
    productionReadiness: project.current_stage === 'PRODUCTION_READY' ? 'Ready' : 'Not Ready',
    targetSampleDate: targetDate,
    targetReleaseDate: String(release?.launch_date || targetDate),
    ownerName: String(project.owner?.full_name || 'Belum ditentukan'),
    pimproName: String(project.owner?.full_name || 'Belum ditentukan'),
    briefIntent: String(project.concept || ''),
    targetUserDescription: String(project.source_notes || ''),
    acceptanceCriteria: String(project.production_notes || ''),
    references: related.references
      .filter((item) => item.project_id === projectId)
      .map((item) => ({
        id: String(item.id),
        type: item.image_url ? 'image' as const : item.source_url ? 'link' as const : 'note' as const,
        url: String(item.image_url || item.source_url || ''),
        title: String(item.title || 'Referensi'),
        label: 'detail' as const,
        note: String(item.insight || ''),
      })),
    targetPriceMSRP: targetMsrp,
    targetHPP: Number(latestHpp?.target_hpp || 0),
    materials,
    colorways: projectColorways.map((item) => ({
      id: String(item.id),
      code: String(item.color_code || ''),
      name: String(item.name || 'Colorway'),
      hex: String(item.hex_code || '#64748b'),
      comboPartsNote: String(item.panel_notes || ''),
      isSampleColor: String(item.status).toUpperCase() === 'APPROVED',
    })),
    sizeSet: Array.isArray(latestSizeChart?.sizes) ? latestSizeChart.sizes : [],
    baseSize: Array.isArray(latestSizeChart?.sizes) ? String(latestSizeChart.sizes[0] || '') : '',
    sizeChart: sizeRows.map((row) => ({
      fieldId: String(row.point_code || row.id),
      fieldName: String(row.point_name || row.point_code || 'Ukuran'),
      tolerance: Math.max(Number(row.tolerance_plus || 0), Number(row.tolerance_minus || 0)),
      targetValues: row.values || {},
    })),
    sampleIterations: related.samples
      .filter((sample) => sample.project_id === projectId)
      .map((sample, index) => ({
        id: String(sample.id),
        iterationName: sample.is_master ? 'Golden Sample' as const : (`Sample V${Math.min(index + 1, 3)}` as 'Sample V1' | 'Sample V2' | 'Sample V3'),
        dateReceived: String(sample.created_at || '').slice(0, 10),
        workshopName: '',
        targetSize: '',
        colorwayName: '',
        status: String(sample.status).toUpperCase() === 'APPROVED' ? 'Approved' as const : 'Pending Review' as const,
        measurementActuals: [],
        findings: [],
        decisionNote: String(sample.revision_notes || ''),
        isGoldenSample: Boolean(sample.is_master),
      })),
    costComponents: hppLines.map((line) => ({
      id: String(line.id),
      name: String(line.item_name || 'Biaya'),
      category: String(line.category).toUpperCase() === 'MATERIAL' ? 'Material' as const : 'CMT & Service' as const,
      calculationMethod: 'per_unit' as const,
      amount: Number(line.line_total || 0),
      isIncluded: true,
      isCustom: false,
    })),
    calculatedHPP: calculatedHpp,
    priceSimulation: {
      targetMarginPercent: Number(latestHpp?.target_margin_percent || 0),
      sellingChannel: 'Direct',
      channelFeePercent: 0,
      discountBufferPercent: 0,
      suggestedMSRP: targetMsrp,
      wholesalePrice: 0,
      resellerPrice: 0,
      projectedGrossMarginPercent: targetMsrp > 0 ? ((targetMsrp - calculatedHpp) / targetMsrp) * 100 : 0,
      breakEvenQuantity: 0,
    },
    scenarios: projectVariants.length
      ? [{
          id: `legacy-${projectId}`,
          name: 'Base',
          matrix: projectVariants.map((variant) => ({
            colorId: String(variant.colorway_id || ''),
            sizeCode: String(variant.size || ''),
            plannedQty: Number(variant.min_quantity || 0),
            cellBudget: Number(variant.unit_cost || 0) * Number(variant.min_quantity || 0),
            cellRevenue: 0,
          })),
          totalQty: projectVariants.reduce((sum, item) => sum + Number(item.min_quantity || 0), 0),
          totalBudget: projectVariants.reduce((sum, item) => sum + Number(item.unit_cost || 0) * Number(item.min_quantity || 0), 0),
          totalRevenue: 0,
          grossMarginPercent: 0,
          isSelectedPlan: true,
        }]
      : [],
    readinessChecklist: [],
    batches: related.batches
      .filter((batch) => batch.project_id === projectId)
      .map((batch) => {
        const progress = Math.round(
          (Number(batch.cutting_progress || 0) +
            Number(batch.sewing_progress || 0) +
            Number(batch.finishing_progress || 0) +
            Number(batch.qc_progress || 0)) /
            4,
        );
        return {
          id: String(batch.id),
          batchCode: String(batch.batch_code || ''),
          vendorName: String(batch.vendor_name || ''),
          startDate: String(batch.actual_start || batch.planned_start || ''),
          targetFinishDate: String(batch.target_finish || ''),
          totalTargetQty: Number(batch.total_quantity || 0),
          currentOperation: progress >= 100 ? 'Stock Ready' as const : progress >= 75 ? 'QC Inspection' as const : progress >= 50 ? 'Finishing' as const : progress >= 25 ? 'Sewing' as const : 'Cutting' as const,
          passedQty: Number(batch.quantity_passed || 0),
          rejectedQty: Number(batch.quantity_rejected || 0),
          reworkQty: Number(batch.quantity_reworked || 0),
          progressPercent: progress,
        };
      }),
    copywriting: String(release?.product_description || ''),
    sellingPoints: String(release?.selling_points || '').split('\n').filter(Boolean),
    launchChecklist: Object.entries(release?.readiness_checks || {}).map(([item, done]) => ({ item, done: Boolean(done) })),
    blockerCount,
    pendingApprovalCount,
    lastUpdated: String(project.updated_at || project.created_at || '').slice(0, 10),
    workspacePanels: defaultPanels(),
  };
}

function mapSupplier(row: Row): Supplier {
  return {
    id: String(row.id),
    code: String(row.code || `SUP-${String(row.id).slice(0, 6)}`),
    name: String(row.name || 'Supplier'),
    type: String(row.category || '').toLowerCase().includes('factory') ? 'factory' : 'material',
    address: String(row.address || row.city || ''),
    picName: String(row.contact_name || ''),
    picContact: String(row.phone || ''),
    verificationStatus: 'Verified',
    paymentTerms: '',
    moqDefault: Number(row.moq || 0),
    leadTimeDays: Number(row.lead_time_days || 0),
    qualityScore: 0,
    onTimeDeliveryRate: 0,
    status: row.is_active === false ? 'Inactive' : 'Active',
  };
}

function mapMaterial(row: Row, links: Row[], supplierMap: Map<string, Supplier>): MaterialMaster {
  const primary = links.find((link) => link.material_id === row.id && link.is_primary)
    || links.find((link) => link.material_id === row.id);
  const supplier = primary ? supplierMap.get(String(primary.supplier_id)) : undefined;
  return {
    id: String(row.id),
    code: String(row.code || `MAT-${String(row.id).slice(0, 6)}`),
    name: String(row.name || 'Material'),
    group: 'main_fabric',
    composition: String(row.composition || ''),
    gsmOrWeight: row.gsm ? `${row.gsm} gsm` : '',
    width: row.width_cm ? `${row.width_cm} cm` : '',
    stockUnit: String(row.unit || 'meter'),
    purchaseUnit: String(primary?.price_unit || row.unit || 'meter'),
    conversionFactor: 1,
    defaultWastePercent: 5,
    preferredSupplierId: String(primary?.supplier_id || ''),
    supplierName: supplier?.name,
    latestPrice: Number(primary?.unit_price || 0),
    currency: 'IDR',
    moq: Number(primary?.moq || 0),
    leadTimeDays: Number(primary?.lead_time_days || supplier?.leadTimeDays || 0),
    status: row.is_active === false ? 'Inactive' : 'Active',
  };
}

function mapService(row: Row): ServiceMaster {
  const method = String(row.calculation_method || 'PER_UNIT').toUpperCase();
  return {
    id: String(row.id),
    code: `SVC-${String(row.id).slice(0, 6)}`,
    name: String(row.name || 'Layanan'),
    category: String(row.category || 'OTHER'),
    calculationMethod: method === 'PER_BATCH' ? 'per_batch' : method === 'PERCENTAGE' ? 'percentage' : method === 'FIXED' ? 'fixed' : 'per_unit',
    defaultRate: Number(row.default_price || 0),
    unitLabel: String(row.unit || 'pcs'),
  };
}

let activeLoadWorkspacePromise: Promise<WorkspaceSnapshot> | null = null;

async function loadMasterData() {
  if (masterDataCache) return masterDataCache;
  const [profiles, suppliers, materials, materialLinks, costComponents] = await Promise.all([
    rows(supabase.from('profiles').select('*')),
    rows(supabase.from('suppliers').select('*')),
    rows(supabase.from('materials').select('*')),
    rows(supabase.from('material_suppliers').select('*')),
    rows(supabase.from('cost_components').select('*')),
  ]);
  masterDataCache = { profiles, suppliers, materials, materialLinks, costComponents };
  return masterDataCache;
}

export function invalidateMasterData() {
  masterDataCache = null;
}

export function loadWorkspace(): Promise<WorkspaceSnapshot> {
  if (activeLoadWorkspacePromise) {
    return activeLoadWorkspacePromise;
  }
  activeLoadWorkspacePromise = (async () => {
    try {
      const [master, ...queries] = await Promise.all([
        loadMasterData(),
        rows(supabase.from('paten_records').select('*')),
        rows(supabase.from('launch_projects').select('*, business_unit:business_units(*), owner:profiles!launch_projects_owner_id_fkey(*)').order('updated_at', { ascending: false })),
    rows(supabase.from('launch_tasks').select('*')),
    rows(supabase.from('launch_blockers').select('*')),
    rows(supabase.from('launch_comments').select('*, author:profiles!launch_comments_author_id_fkey(*)')),
    rows(supabase.from('launch_approvals').select('*')),
    rows(supabase.from('launch_progress_updates').select('*')),
    rows(supabase.from('launch_references').select('*')),
    rows(supabase.from('launch_material_candidates').select('*')),
    rows(supabase.from('launch_supplier_quotes').select('*')),
    rows(supabase.from('launch_colorways').select('*')),
    rows(supabase.from('launch_samples').select('*')),
    rows(supabase.from('launch_hpp_versions').select('*')),
    rows(supabase.from('launch_hpp_lines').select('*')),
    rows(supabase.from('launch_size_charts').select('*')),
    rows(supabase.from('launch_size_chart_measurements').select('*')),
    rows(supabase.from('launch_production_batches').select('*')),
    rows(supabase.from('launch_release_plans').select('*')),
    rows(supabase.from('launch_variant_matrix').select('*')),
    rows(supabase.from('media_assets').select('*').is('deleted_at', null)),
  ]);

  const value = (index: number) => queries[index];
  const allowDemoData = import.meta.env.VITE_PATEN_DEMO_MODE === 'true';
  const mock = allowDemoData ? await loadMock() : null;
  const bridge = value(0);
  const projects = value(1);
  const profiles = master.profiles;
  const suppliersRaw = master.suppliers;
  const materialsRaw = master.materials;
  const materialLinks = master.materialLinks;
  const servicesRaw = master.costComponents;
  const tasksRaw = value(2);
  const blockersRaw = value(3);
  const commentsRaw = value(4);
  const approvalsRaw = value(5);
  const updatesRaw = value(6);
  const profileMap = new Map(profiles.map((profile) => [String(profile.id), profile]));
  const projectMap = new Map(projects.map((project) => [String(project.id), project]));
  const supplierBase = suppliersRaw.map(mapSupplier);
  const supplierMap = new Map(supplierBase.map((supplier) => [supplier.id, supplier]));

  const related = {
    references: value(7),
    candidates: value(8),
    quotes: value(9),
    colorways: value(10),
    samples: value(11),
    hppVersions: value(12),
    hppLines: value(13),
    sizeCharts: value(14),
    measurements: value(15),
    batches: value(16),
    releasePlans: value(17),
    variantRows: value(18),
    mediaAssets: value(19),
    comments: commentsRaw,
    blockers: blockersRaw,
    approvals: approvalsRaw,
  };

  const articleBase = projects.map((project) => legacyArticle(project, related));
  const suppliers = rowsFor(
    supplierBase.length ? supplierBase : mock ? mock.INITIAL_SUPPLIERS : [],
    'supplier',
    bridge,
  );
  const materials = rowsFor(
    materialsRaw.length
      ? materialsRaw.map((row) => mapMaterial(row, materialLinks, supplierMap))
      : mock ? mock.INITIAL_MATERIALS : [],
    'material',
    bridge,
  );
  const services = rowsFor(
    servicesRaw.length ? servicesRaw.map(mapService) : mock ? mock.INITIAL_SERVICES : [],
    'service',
    bridge,
  );

  const tasksBase: TaskItem[] = tasksRaw.map((task) => {
    const project = projectMap.get(String(task.project_id));
    const assignee = profileMap.get(String(task.assignee_id));
    const status = String(task.status || '').toUpperCase();
    return {
      id: String(task.id),
      articleId: String(task.project_id || ''),
      articleCode: String(project?.code || ''),
      articleTitle: String(project?.article_name || ''),
      title: String(task.title || 'Task'),
      stage: mapStage(task.stage_code),
      picId: String(task.assignee_id || ''),
      picName: String(assignee?.full_name || 'Belum ditentukan'),
      dueDate: String(task.due_date || ''),
      priority: String(task.priority).toUpperCase() === 'URGENT' ? 'High' : String(task.priority).toUpperCase() === 'HIGH' ? 'Medium' : 'Low',
      status: status === 'DONE' ? 'Completed' : status === 'DOING' ? 'In Progress' : status === 'WAITING' ? 'Waiting' : 'Ready',
    };
  });

  const blockersBase: BlockerItem[] = blockersRaw
    .filter((row) => String(row.status).toUpperCase() !== 'RESOLVED')
    .map((row) => {
      const project = projectMap.get(String(row.project_id));
      const owner = profileMap.get(String(row.owner_id));
      return {
        id: String(row.id),
        articleId: String(row.project_id || ''),
        articleCode: String(project?.code || ''),
        title: String(row.blocker_type || 'Blocker'),
        severity: row.affects_target ? 'Critical' : 'Major',
        description: String(row.description || ''),
        ownerName: String(owner?.full_name || 'Belum ditentukan'),
        reportedDate: String(row.created_at || '').slice(0, 10),
        targetResolutionDate: String(row.target_resolution_date || ''),
        status: 'Open',
      };
    });

  const decisionsBase: DecisionRequest[] = commentsRaw
    .filter((row) => row.is_decision_request)
    .map((row) => {
      const project = projectMap.get(String(row.project_id));
      return {
        id: String(row.id),
        articleId: String(row.project_id || ''),
        articleCode: String(project?.code || ''),
        question: String(row.body || ''),
        options: [],
        recommendedOption: '',
        impactDescription: '',
        requestedToName: 'Owner',
        dueDate: String(row.decision_deadline || ''),
        status: String(row.decision_status).toUpperCase() === 'DECIDED' ? 'Decided' : 'Pending',
        rationale: String(row.decision_note || ''),
      };
    });

  const approvalsBase: ApprovalGate[] = approvalsRaw.map((row) => {
    const project = projectMap.get(String(row.project_id));
    const requester = profileMap.get(String(row.requested_by));
    const decider = profileMap.get(String(row.decided_by));
    const rawStatus = String(row.status || '').toUpperCase();
    return {
      id: String(row.id),
      articleId: String(row.project_id || ''),
      articleCode: String(project?.code || ''),
      articleTitle: String(project?.article_name || ''),
      gateType: 'Production Release',
      requestedBy: String(requester?.full_name || 'Tim'),
      requestedDate: String(row.requested_at || '').slice(0, 10),
      approverRole: 'Owner',
      status: rawStatus === 'APPROVED' ? 'Approved' : rawStatus === 'REJECTED' ? 'Rejected' : rawStatus === 'REVISION' ? 'Revision Requested' : 'Pending',
      versionTag: String(row.approval_type || ''),
      summaryNote: '',
      decidedBy: String(decider?.full_name || ''),
      decidedDate: String(row.decided_at || '').slice(0, 10),
      decisionNote: String(row.decision_note || ''),
    };
  });

  const updatesBase: ProgressUpdate[] = updatesRaw.map((row) => {
    const author = profileMap.get(String(row.author_id));
    const type = String(row.update_type || '').toUpperCase();
    return {
      id: String(row.id),
      articleId: String(row.project_id || ''),
      authorName: String(author?.full_name || 'Tim'),
      authorAvatar: String(author?.avatar_url || ''),
      timestamp: String(row.created_at || ''),
      updateType: type === 'RISK' ? 'Hambatan' : type === 'OWNER_DIRECTION' ? 'Butuh Keputusan' : type === 'MILESTONE' ? 'Selesai' : 'Berjalan',
      notes: String(row.completed_text || row.current_text || row.blocker_text || row.decision_needed || row.next_step || ''),
      impactForecast: String(row.forecast_finish || ''),
    };
  });

  const articles = rowsFor(
    articleBase.length ? articleBase : mock ? mock.INITIAL_ARTICLES : [],
    'article',
    bridge,
  );
  const tasks = rowsFor(tasksBase.length ? tasksBase : mock ? mock.INITIAL_TASKS : [], 'task', bridge);
  const blockers = rowsFor(blockersBase.length ? blockersBase : mock ? mock.INITIAL_BLOCKERS : [], 'blocker', bridge);
  const decisions = rowsFor(decisionsBase.length ? decisionsBase : mock ? mock.INITIAL_DECISIONS : [], 'decision', bridge);
  const approvals = rowsFor(approvalsBase.length ? approvalsBase : mock ? mock.INITIAL_APPROVALS : [], 'approval', bridge);
  const updates = rowsFor(updatesBase.length ? updatesBase : mock ? mock.INITIAL_PROGRESS_UPDATES : [], 'progress_update', bridge);
  const hasRemoteData = projects.length > 0 || bridge.length > 0 || suppliersRaw.length > 0;

    return {
      articles,
      suppliers,
      materials,
      services,
      tasks,
      blockers,
      decisions,
      approvals,
      updates,
      source: hasRemoteData ? 'supabase' : 'demo',
    };
  } finally {
    activeLoadWorkspacePromise = null;
  }
})();
return activeLoadWorkspacePromise;
}

function projectIdFor(type: RecordType, value: Row): string | null {
  const candidate =
    type === 'article'
      ? value.id
      : value.articleId || value.projectId || null;
  return typeof candidate === 'string' && UUID_PATTERN.test(candidate)
    ? candidate
    : null;
}

function queue(operation: () => Promise<unknown>): Promise<void> {
  const result = persistenceQueue
    .then(async () => {
      lastLocalWriteTime = Date.now();
      await operation();
      lastLocalWriteTime = Date.now();
    })
    .then(() => {
      clearError();
    });
  persistenceQueue = result.catch((reason) => {
    reportError(reason);
  });
  return result;
}

async function ensureProjects(articles: Article[], newIds: Set<string>) {
  const candidates = articles.filter(
    (article) => UUID_PATTERN.test(article.id) && newIds.has(article.id),
  );
  if (!candidates.length) return;

  const [{ data: auth }, businessUnits] = await Promise.all([
    supabase.auth.getUser(),
    rows(supabase.from('business_units').select('*').eq('is_active', true)),
  ]);
  const userId = auth.user?.id;
  if (!userId) throw new Error('Sesi pengguna berakhir. Silakan masuk kembali.');

  for (const article of candidates) {
    const unit = businessUnits.find((item: any) =>
      item.name?.toUpperCase() === article.businessUnit?.toUpperCase() ||
      item.code?.toUpperCase() === article.businessUnit?.toUpperCase()
    ) || businessUnits[0];
    if (!unit) throw new Error('Business unit belum tersedia di database.');
    const { error } = await supabase.from('launch_projects').upsert({
      id: article.id,
      code: article.code,
      business_unit_id: unit.id,
      owner_id: userId,
      article_name: article.name,
      category: article.subCategory || article.category,
      concept: article.briefIntent || null,
      source_notes: article.targetUserDescription || null,
      reference_image_url: article.mainImage || null,
      status: 'ACTIVE',
      priority: 'NORMAL',
      current_stage: 'BRIEF',
      progress: article.workflowProgressPercent || 0,
      target_date: article.targetReleaseDate || article.targetSampleDate || null,
      production_notes: article.acceptanceCriteria || null,
      created_by: userId,
    }, { onConflict: 'id' });
    if (error) throw error;
  }
}

async function syncArticleColumns(
  articles: Article[],
  previousPayloads: Map<string, string>,
) {
  const userId = await currentUserId();
  for (const article of articles.filter((item) => UUID_PATTERN.test(item.id))) {
    const previousSerialized = previousPayloads.get(article.id);
    const previous = previousSerialized
      ? JSON.parse(previousSerialized) as Article
      : undefined;
    const { error } = await supabase
      .from('launch_projects')
      .update({
        code: article.code,
        article_name: article.name,
        category: article.subCategory || article.category,
        concept: article.briefIntent || null,
        source_notes: article.targetUserDescription || null,
        reference_image_url: article.mainImage || null,
        current_stage: stageCode(article.stage),
        status: article.status === 'Archived'
          ? 'ARCHIVED'
          : article.status === 'Blocked'
            ? 'BLOCKED'
            : article.productionReadiness === 'Approved'
              ? 'READY_FOR_PRODUCTION'
              : 'ACTIVE',
        progress: Math.round(article.workflowProgressPercent || 0),
        target_date: article.targetReleaseDate || article.targetSampleDate || null,
        target_sample_date: article.targetSampleDate || null,
        target_launch_date: article.targetReleaseDate || null,
        production_notes: article.acceptanceCriteria || null,
      })
      .eq('id', article.id);
    if (error) throw error;
    await syncArticleOperations(article, userId ?? '', previous);
  }
}

function phaseProgress(progress: number, start: number, end: number) {
  if (progress <= start) return 0;
  if (progress >= end) return 100;
  return Math.round(((progress - start) / (end - start)) * 100);
}

async function syncArticleOperations(
  article: Article,
  userId: string,
  previous?: Article,
) {
  const changed = (select: (value: Article) => unknown) =>
    !previous || JSON.stringify(select(previous)) !== JSON.stringify(select(article));
  if (changed((value) => value.colorways)) {
    const validColorways = (article.colorways || []).filter((item) => UUID_PATTERN.test(item.id));
    const validIds = validColorways.map((c) => c.id);
    if (validIds.length > 0) {
      await supabase
        .from('launch_colorways')
        .delete()
        .eq('project_id', article.id)
        .not('id', 'in', `(${validIds.join(',')})`);
    } else {
      await supabase.from('launch_colorways').delete().eq('project_id', article.id);
    }

    if (validColorways.length > 0) {
      const { error } = await supabase.from('launch_colorways').upsert(
        validColorways.map((item) => ({
          id: item.id,
          project_id: article.id,
          name: item.name,
          color_code: item.code || null,
          hex_code: item.hex || null,
          panel_notes: item.comboPartsNote || null,
          status: item.isSampleColor ? 'APPROVED' : 'CANDIDATE',
          created_by: userId,
        })),
        { onConflict: 'id' },
      );
      if (error) throw error;
    }
  }

  const validSamples = (article.sampleIterations || []).filter((item) => UUID_PATTERN.test(item.id));
  if (changed((value) => value.sampleIterations) && validSamples.length) {
    const { error } = await supabase.from('launch_samples').upsert(
      validSamples.map((item, index) => ({
        id: item.id,
        project_id: article.id,
        version: index + 1,
        sample_type: item.isGoldenSample ? 'MASTER' : item.iterationName === 'Pre-Production' ? 'PRE_PRODUCTION' : 'DEVELOPMENT',
        status: item.status === 'Approved'
          ? 'APPROVED'
          : item.status === 'Rejected'
            ? 'REJECTED'
            : item.status === 'Revision Required' || item.status === 'Approved with Revision'
              ? 'REVISION'
              : 'REVIEW',
        revision_notes: item.decisionNote || item.findings.map((finding) => finding.note).join('\n') || null,
        is_master: Boolean(item.isGoldenSample),
        created_by: userId,
        approved_by: item.status === 'Approved' ? userId : null,
        approved_at: item.status === 'Approved' ? new Date().toISOString() : null,
      })),
      { onConflict: 'id' },
    );
    if (error) throw error;
  }

  const validBatches = (article.batches || []).filter((item) => UUID_PATTERN.test(item.id));
  if (changed((value) => value.batches) && validBatches.length) {
    const { error } = await supabase.from('launch_production_batches').upsert(
      validBatches.map((batch) => ({
        id: batch.id,
        project_id: article.id,
        batch_code: batch.batchCode,
        vendor_name: batch.vendorName,
        planned_start: batch.startDate || null,
        actual_start: batch.progressPercent > 0 ? batch.startDate || new Date().toISOString().slice(0, 10) : null,
        target_finish: batch.targetFinishDate || null,
        actual_finish: batch.progressPercent >= 100 ? new Date().toISOString().slice(0, 10) : null,
        total_quantity: batch.totalTargetQty,
        cutting_progress: phaseProgress(batch.progressPercent, 0, 20),
        sewing_progress: phaseProgress(batch.progressPercent, 20, 45),
        finishing_progress: phaseProgress(batch.progressPercent, 45, 65),
        qc_progress: phaseProgress(batch.progressPercent, 65, 90),
        quantity_passed: batch.passedQty,
        quantity_rejected: batch.rejectedQty,
        quantity_reworked: batch.reworkQty,
        status: batch.progressPercent >= 100 ? 'COMPLETED' : batch.progressPercent > 0 ? 'IN_PROGRESS' : 'PLANNED',
        created_by: userId,
      })),
      { onConflict: 'id' },
    );
    if (error) throw error;
  }

  const selectedScenario = (article.scenarios || []).find((scenario) => scenario.isSelectedPlan);
  if (changed((value) => value.scenarios) && selectedScenario) {
    const variants = selectedScenario.matrix.filter((cell) => UUID_PATTERN.test(cell.colorId));
    if (variants.length) {
      const { error } = await supabase.from('launch_variant_matrix').upsert(
        variants.map((cell) => ({
          project_id: article.id,
          colorway_id: cell.colorId,
          size: cell.sizeCode,
          min_quantity: cell.plannedQty,
          unit_cost: cell.plannedQty > 0 ? cell.cellBudget / cell.plannedQty : article.calculatedHPP,
          status: article.productionReadiness === 'Approved' ? 'PRODUCTION_READY' : 'DRAFT',
          created_by: userId,
        })),
        { onConflict: 'colorway_id,size' },
      );
      if (error) throw error;
    }
  }

  if (changed((value) => ({
    name: value.name,
    copywriting: value.copywriting,
    sellingPoints: value.sellingPoints,
    targetPriceMSRP: value.targetPriceMSRP,
    targetReleaseDate: value.targetReleaseDate,
    launchChecklist: value.launchChecklist,
    stage: value.stage,
    productionReadiness: value.productionReadiness,
  }))) {
    const { error: releaseError } = await supabase.from('launch_release_plans').upsert({
    project_id: article.id,
    final_product_name: article.name,
    product_description: article.copywriting || null,
    selling_points: (article.sellingPoints || []).join('\n') || null,
    retail_price: article.targetPriceMSRP || null,
    launch_date: article.targetReleaseDate || null,
    readiness_checks: Object.fromEntries((article.launchChecklist || []).map((item) => [item.item, item.done])),
    status: article.stage === 'Launch' ? 'PUBLISHED' : article.productionReadiness === 'Approved' ? 'READY' : 'IN_PREPARATION',
    created_by: userId,
  }, { onConflict: 'project_id' });
    if (releaseError) throw releaseError;
  }

  if (!changed((value) => ({
    calculatedHPP: value.calculatedHPP,
    costConfidence: value.costConfidence,
    targetPriceMSRP: value.targetPriceMSRP,
    priceSimulation: value.priceSimulation,
  }))) return;

  const { data: hppVersion, error: hppLookupError } = await supabase
    .from('launch_hpp_versions')
    .select('id, version')
    .eq('project_id', article.id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (hppLookupError) throw hppLookupError;
  const hppPayload = {
    project_id: article.id,
    version: Number(hppVersion?.version || 0) || 1,
    status: article.costConfidence === 'Locked - Production' ? 'FINAL' : 'IN_REVIEW',
    total_hpp: article.calculatedHPP || 0,
    target_margin_percent: article.priceSimulation?.targetMarginPercent || null,
    recommended_price: article.targetPriceMSRP || null,
    finalized_by: article.costConfidence === 'Locked - Production' ? userId : null,
    finalized_at: article.costConfidence === 'Locked - Production' ? new Date().toISOString() : null,
    created_by: userId,
  };
  const hppResult = hppVersion?.id
    ? await supabase.from('launch_hpp_versions').update(hppPayload).eq('id', hppVersion.id)
    : await supabase.from('launch_hpp_versions').insert(hppPayload);
  if (hppResult.error) throw hppResult.error;
}

let cachedUserId: string | null = null;

async function currentUserId() {
  if (cachedUserId) return cachedUserId;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('Sesi pengguna berakhir. Silakan masuk kembali.');
  }
  cachedUserId = data.user.id;
  return cachedUserId;
}

function stageCode(stage: unknown) {
  const value = String(stage || '');
  if (value === 'Specification') return 'SPECIFICATION';
  if (value === 'Source & Pattern') return 'SOURCING';
  if (value === 'Sampling') return 'SAMPLING';
  if (value === 'Costing') return 'COSTING';
  if (value === 'Production Plan') return 'QC';
  if (value === 'Production' || value === 'Launch') return 'PRODUCTION_READY';
  return 'BRIEF';
}

function costCategory(category: unknown) {
  const value = String(category || '').toUpperCase();
  if (value.includes('MATERIAL')) return 'MATERIAL';
  if (value.includes('ACCESS')) return 'ACCESSORY';
  if (value.includes('PRINT')) return 'PRINTING';
  if (value.includes('EMBROID')) return 'EMBROIDERY';
  if (value.includes('PACK')) return 'PACKAGING';
  if (value.includes('OVERHEAD')) return 'OVERHEAD';
  if (value.includes('LABOR') || value.includes('CUT') || value.includes('SEW')) return 'LABOR';
  return 'OTHER';
}

async function syncNormalizedRecords(
  type: RecordType,
  changedValues: Row[],
  removedIds: string[],
  newIds: Set<string>,
) {
  if (!changedValues.length && !removedIds.length) return;
  const userId = await currentUserId();

  for (const value of changedValues.filter((item) => UUID_PATTERN.test(String(item.id)))) {
    let table = '';
    let payload: Row | null = null;

    if (type === 'supplier') {
      table = 'suppliers';
      payload = {
        id: value.id,
        code: value.code || null,
        name: value.name,
        category: value.type || null,
        contact_name: value.picName || null,
        phone: value.picContact || null,
        address: value.address || null,
        lead_time_days: Number(value.leadTimeDays || 0),
        minimum_order_notes: value.moqDefault ? String(value.moqDefault) : null,
        quality_notes: value.qualityScore ? `Quality score: ${value.qualityScore}` : null,
        is_active: value.status !== 'Inactive' && value.status !== 'Blocked',
        created_by: userId,
      };
    } else if (type === 'material') {
      table = 'materials';
      payload = {
        id: value.id,
        code: value.code || null,
        name: value.name,
        category: value.group || 'main_fabric',
        composition: value.composition || null,
        gsm: Number.parseFloat(String(value.gsmOrWeight || '')) || null,
        width_cm: Number.parseFloat(String(value.width || '')) || null,
        unit: value.stockUnit || 'meter',
        is_active: value.status !== 'Inactive',
        created_by: userId,
      };
    } else if (type === 'service') {
      table = 'cost_components';
      const method = String(value.calculationMethod || 'per_unit');
      payload = {
        id: value.id,
        name: value.name,
        category: costCategory(value.category),
        calculation_method: method === 'per_batch' ? 'PER_BATCH' : method === 'percentage' ? 'PERCENTAGE' : method === 'fixed' ? 'FIXED' : 'PER_UNIT',
        unit: value.unitLabel || 'pcs',
        default_price: Number(value.defaultRate || 0),
        is_active: true,
        created_by: userId,
      };
    } else if (type === 'task' && UUID_PATTERN.test(String(value.articleId || ''))) {
      table = 'launch_tasks';
      const status = String(value.status || '');
      payload = {
        id: value.id,
        project_id: value.articleId,
        stage_code: stageCode(value.stage),
        title: value.title,
        status: status === 'Completed' ? 'DONE' : status === 'In Progress' ? 'DOING' : status === 'Waiting' || status === 'Blocked' ? 'WAITING' : 'TODO',
        priority: value.priority === 'High' ? 'URGENT' : value.priority === 'Medium' ? 'HIGH' : 'NORMAL',
        assignee_id: UUID_PATTERN.test(String(value.picId || '')) ? value.picId : null,
        due_date: value.dueDate || null,
        created_by: userId,
        completed_at: status === 'Completed' ? new Date().toISOString() : null,
      };
    } else if (type === 'blocker' && UUID_PATTERN.test(String(value.articleId || ''))) {
      table = 'launch_blockers';
      payload = {
        id: value.id,
        project_id: value.articleId,
        blocker_type: 'OTHER',
        description: value.description || value.title,
        target_resolution_date: value.targetResolutionDate || null,
        impact: value.title || null,
        affects_target: value.severity === 'Critical',
        status: value.status === 'Resolved' ? 'RESOLVED' : 'OPEN',
        resolved_at: value.status === 'Resolved' ? new Date().toISOString() : null,
        resolved_by: value.status === 'Resolved' ? userId : null,
        created_by: userId,
      };
    } else if (type === 'approval' && UUID_PATTERN.test(String(value.articleId || ''))) {
      const status = String(value.status || '');
      const decisionPayload = {
        status: status === 'Approved' ? 'APPROVED' : status === 'Rejected' ? 'REJECTED' : status === 'Revision Requested' ? 'REVISION' : 'PENDING',
        decided_by: status === 'Pending' ? null : userId,
        decision_note: value.decisionNote || null,
        decided_at: status === 'Pending' ? null : new Date().toISOString(),
      };
      if (!newIds.has(String(value.id))) {
        const { error } = await supabase
          .from('launch_approvals')
          .update(decisionPayload)
          .eq('id', value.id);
        if (error) throw error;
        continue;
      }
      table = 'launch_approvals';
      payload = {
        id: value.id,
        project_id: value.articleId,
        approval_type: value.gateType || value.versionTag || 'PATEN_GATE',
        requested_by: userId,
        ...decisionPayload,
      };
    } else if (
      type === 'progress_update'
      && newIds.has(String(value.id))
      && UUID_PATTERN.test(String(value.articleId || ''))
    ) {
      table = 'launch_progress_updates';
      const updateType = String(value.updateType || '');
      payload = {
        id: value.id,
        project_id: value.articleId,
        stage_code: null,
        author_id: userId,
        update_type: updateType === 'Hambatan' ? 'RISK' : updateType === 'Butuh Keputusan' ? 'OWNER_DIRECTION' : updateType === 'Selesai' ? 'MILESTONE' : 'TEAM_UPDATE',
        completed_text: updateType === 'Selesai' ? value.notes : null,
        current_text: updateType === 'Selesai' ? null : value.notes,
        forecast_finish: value.impactForecast || null,
      };
    }

    if (table && payload) {
      const { error } = await supabase.from(table).upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      if (
        type === 'material'
        && UUID_PATTERN.test(String(value.preferredSupplierId || ''))
      ) {
        const { error: linkError } = await supabase
          .from('material_suppliers')
          .upsert({
            material_id: value.id,
            supplier_id: value.preferredSupplierId,
            is_primary: true,
            unit_price: Number(value.latestPrice || 0),
            price_unit: value.purchaseUnit || value.stockUnit || 'meter',
            moq: Number(value.moq || 0),
            lead_time_days: Number(value.leadTimeDays || 0),
            created_by: userId,
          }, { onConflict: 'material_id,supplier_id' });
        if (linkError) throw linkError;
      }
    }
  }

  const validRemovedIds = removedIds.filter((id) => UUID_PATTERN.test(id));
  if (!validRemovedIds.length) return;
  if (type === 'supplier' || type === 'material' || type === 'service') {
    const table = type === 'supplier' ? 'suppliers' : type === 'material' ? 'materials' : 'cost_components';
    const { error } = await supabase.from(table).update({ is_active: false }).in('id', validRemovedIds);
    if (error) throw error;
  } else if (type === 'blocker') {
    const { error } = await supabase
      .from('launch_blockers')
      .update({
        status: 'RESOLVED',
        resolved_at: new Date().toISOString(),
        resolved_by: userId,
      })
      .in('id', validRemovedIds);
    if (error) throw error;
  }
}

async function persistCollection<T extends { id: string }>(
  type: RecordType,
  values: T[],
) {
  const previous = lastIds.get(type) || new Set<string>();
  const previousPayloads = lastPayloads.get(type) || new Map<string, string>();
  const next = new Set(values.map((value) => value.id));
  const newIds = new Set(Array.from(next).filter((id) => !previous.has(id)));
  const removedIds = Array.from(previous).filter((id) => !next.has(id));
  const changedValues = values.filter(
    (value) => previousPayloads.get(value.id) !== JSON.stringify(value),
  );
  if (type === 'article') {
    await ensureProjects(changedValues as unknown as Article[], newIds);
    await syncArticleColumns(changedValues as unknown as Article[], previousPayloads);
  } else {
    await syncNormalizedRecords(
      type,
      changedValues as unknown as Row[],
      removedIds,
      newIds,
    );
  }

  const upserts = changedValues.map((value) => ({
    record_type: type,
    record_id: value.id,
    project_id: projectIdFor(type, value as Row),
    payload: value,
    is_deleted: false,
  }));
  const tombstones = removedIds
    .map((id) => ({
      record_type: type,
      record_id: id,
      project_id: null,
      payload: {},
      is_deleted: true,
    }));
  const payload = [...upserts, ...tombstones];
  const revisionMap = lastRevisions.get(type) || new Map<string, number>();
  for (const record of payload) {
    const { data: revision, error } = await supabase.rpc('save_paten_record', {
      p_record_type: record.record_type,
      p_record_id: record.record_id,
      p_project_id: record.project_id,
      p_payload: record.payload,
      p_is_deleted: record.is_deleted,
      p_expected_revision: revisionMap.get(record.record_id) || 0,
    });
    if (error) {
      if (error.code === '40001' || String(error.message).includes('PATEN_CONFLICT')) {
        throw new Error('Data diubah oleh pengguna lain. Workspace dimuat ulang sebelum Anda melanjutkan.');
      }
      throw error;
    }
    revisionMap.set(record.record_id, Number(revision || 1));
  }
  lastRevisions.set(type, revisionMap);
  lastIds.set(type, next);
  lastPayloads.set(
    type,
    new Map(values.map((value) => [value.id, JSON.stringify(value)])),
  );
}

async function resolveDecision(decisionId: string, choice: string) {
  if (!UUID_PATTERN.test(decisionId)) return;
  const userId = await currentUserId();
  const { error } = await supabase
    .from('launch_comments')
    .update({
      decision_status: 'DECIDED',
      decision_note: choice || 'Diputuskan melalui PATEN',
      decided_by: userId,
      decided_at: new Date().toISOString(),
    })
    .eq('id', decisionId);
  if (error) throw error;
}

function save<T extends { id: string }>(type: RecordType, values: T[]) {
  return queue(() => persistCollection(type, values));
}

export const StorageService = {
  loadWorkspace,

  saveArticles(values: Article[]) { return save('article', values); },
  saveSuppliers(values: Supplier[]) { invalidateMasterData(); return save('supplier', values); },
  saveMaterials(values: MaterialMaster[]) { invalidateMasterData(); return save('material', values); },
  saveServices(values: ServiceMaster[]) { invalidateMasterData(); return save('service', values); },
  saveTasks(values: TaskItem[]) { return save('task', values); },
  saveBlockers(values: BlockerItem[]) { return save('blocker', values); },
  saveDecisions(values: DecisionRequest[]) { return save('decision', values); },
  saveApprovals(values: ApprovalGate[]) { return save('approval', values); },
  saveUpdates(values: ProgressUpdate[]) { return save('progress_update', values); },
  resolveDecision(decisionId: string, choice: string) {
    return queue(() => resolveDecision(decisionId, choice));
  },

  subscribe(onChange: () => void) {
    const POLL_INTERVAL = 30_000;
    const poll = () => {
      if (Date.now() - lastLocalWriteTime < 4000) return;
      lastReloadTime = Date.now();
      onChange();
    };
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  },

  subscribeErrors(listener: (message: string | null) => void) {
    errorListeners.add(listener);
    return () => errorListeners.delete(listener);
  },
};
