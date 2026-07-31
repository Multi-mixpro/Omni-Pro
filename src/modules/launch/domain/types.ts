export type BusinessUnitCode = 'GG_SUPPLY' | 'GUDSKUY';
export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'BLOCKED' | 'IN_REVIEW' | 'READY_FOR_PRODUCTION' | 'ARCHIVED';
export type Priority = 'NORMAL' | 'HIGH' | 'URGENT';
export type StageStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING' | 'BLOCKED' | 'IN_REVIEW' | 'REVISION' | 'COMPLETED';

export const STAGE_ORDER = [
  'BRIEF',
  'RESEARCH',
  'SOURCING',
  'SAMPLING',
  'COSTING',
  'SPECIFICATION',
  'QC',
  'OWNER_APPROVAL',
  'PRODUCTION_READY',
] as const;

export type StageCode = (typeof STAGE_ORDER)[number];

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  job_title: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export interface BusinessUnit {
  id: string;
  code: BusinessUnitCode;
  name: string;
  short_name: string;
  accent_color: string;
}

export interface LaunchProject {
  id: string;
  code: string;
  article_name: string;
  category: string;
  concept: string | null;
  source_notes: string | null;
  reference_image_url: string | null;
  status: ProjectStatus;
  priority: Priority;
  current_stage: StageCode;
  progress: number;
  target_date: string | null;
  target_fix_date: string | null;
  target_launch_date: string | null;
  target_sample_date: string | null;
  target_quantity: number | null;
  research_summary: string | null;
  created_at: string;
  updated_at: string;
  owner_id: string;
  business_unit_id: string;
  business_unit?: BusinessUnit;
  owner?: Profile;
}

export interface LaunchStage {
  id: string;
  project_id: string;
  code: StageCode;
  name: string;
  position: number;
  status: StageStatus;
  progress: number;
  owner_id: string | null;
  due_date: string | null;
  blocking_note: string | null;
  completed_at: string | null;
  owner?: Profile | null;
}

export type DependencyType = 'FS' | 'SS' | 'FF' | 'NONE';

export interface LaunchTask {
  id: string;
  project_id: string;
  stage_code: StageCode;
  title: string;
  status: 'TODO' | 'DOING' | 'WAITING' | 'DONE';
  priority: Priority;
  assignee_id: string | null;
  due_date: string | null;
  depends_on_task_id: string | null;
  dependency_type: DependencyType;
  project?: Pick<LaunchProject, 'id' | 'code' | 'article_name'>;
  assignee?: Profile | null;
}

export interface Comment {
  id: string;
  project_id: string;
  author_id: string;
  body: string;
  is_decision_request: boolean;
  decision_deadline: string | null;
  decision_status: 'OPEN' | 'DECIDED' | null;
  decision_note: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  author?: Profile | null;
  decider?: Profile | null;
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION';

export interface LaunchApproval {
  id: string;
  project_id: string;
  approval_type: string;
  status: ApprovalStatus;
  requested_by: string;
  decided_by: string | null;
  decision_note: string | null;
  requested_at: string;
  decided_at: string | null;
  requester?: Profile | null;
  decider?: Profile | null;
}

export type BlockerType = 'MATERIAL' | 'SUPPLIER' | 'SAMPLE' | 'APPROVAL' | 'INTERNAL' | 'BUDGET' | 'OTHER';

export interface LaunchBlocker {
  id: string;
  project_id: string;
  stage_run_id: string | null;
  blocker_type: BlockerType;
  description: string;
  owner_id: string | null;
  target_resolution_date: string | null;
  impact: string | null;
  affects_target: boolean;
  status: 'OPEN' | 'RESOLVED';
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
  owner?: Profile | null;
}

export interface BlockerDraft {
  blocker_type: BlockerType;
  description: string;
  target_resolution_date?: string;
  impact?: string;
  affects_target: boolean;
}

export interface ActivityItem {
  id: string;
  project_id: string;
  actor_id: string | null;
  event_type: string;
  message: string;
  created_at: string;
  actor?: Profile | null;
}

export interface ProjectWorkspace {
  project: LaunchProject;
  stages: LaunchStage[];
  tasks: LaunchTask[];
  activity: ActivityItem[];
  references: Array<{ id: string; title: string; reference_type: string; source_url: string | null; image_url: string | null; insight: string | null; is_primary: boolean }>;
  materials: Array<{
    id: string;
    proposed_name: string;
    role: string;
    composition: string | null;
    gsm: number | null;
    width_cm: number | null;
    color_notes: string | null;
    estimated_consumption: number | null;
    unit: string;
    status: string;
    quotes?: Array<{
      id: string;
      supplier_role: string;
      price: number;
      unit: string;
      moq: number | null;
      lead_time_days: number | null;
      status: string;
      supplier?: { id: string; name: string; contact_name: string | null; phone: string | null; city: string | null } | null;
    }>;
  }>;
  colorways: Array<{ id: string; name: string; hex_code: string | null; status: string }>;
  variantMatrix: VariantMatrixRow[];
  hpp: Array<{ id: string; version: number; total_hpp: number; recommended_price: number | null; target_margin_percent: number | null; status: string }>;
  sizeCharts: SizeChartData[];
  qc: Array<{ id: string; result: string; summary: string | null; checked_at: string | null }>;
  samples: Array<{ id: string; version: number; sample_type: string; status: string; is_master: boolean; material_notes: string | null; pattern_notes: string | null; construction_notes: string | null; revision_notes: string | null }>;
  blockers: LaunchBlocker[];
  approvals: LaunchApproval[];
  comments: Comment[];
  progressUpdates: ProgressUpdate[];
  productionBatches: ProductionBatch[];
  releasePlan: ReleasePlan | null;
}

export type ProgressUpdateType = 'TEAM_UPDATE' | 'OWNER_DIRECTION' | 'MILESTONE' | 'RISK';

export interface ProgressUpdate {
  id: string;
  project_id: string;
  stage_code: StageCode | null;
  author_id: string;
  update_type: ProgressUpdateType;
  completed_text: string | null;
  current_text: string | null;
  blocker_text: string | null;
  decision_needed: string | null;
  next_step: string | null;
  forecast_finish: string | null;
  progress_percent: number | null;
  created_at: string;
  author?: Profile | null;
  project?: Pick<LaunchProject, 'id' | 'code' | 'article_name'>;
}

export interface ProgressUpdateDraft {
  stage_code?: StageCode | '';
  update_type: ProgressUpdateType;
  completed_text?: string;
  current_text?: string;
  blocker_text?: string;
  decision_needed?: string;
  next_step?: string;
  forecast_finish?: string;
  progress_percent?: number | '';
}

export interface SizeChartMeasurement {
  id: string;
  point_code: string;
  point_name: string;
  position: number;
  tolerance_plus: number;
  tolerance_minus: number;
  values: Record<string, number>;
}

export interface SizeChartData {
  id: string;
  name: string;
  version: number;
  unit: string;
  status: string;
  sizes: string[];
  measurements: SizeChartMeasurement[];
}

export interface SizeChartDraft {
  name: string;
  unit: string;
  sizes: string[];
  measurements: MeasurementDraft[];
  version: number;
}

export interface NewProjectInput {
  article_name: string;
  business_unit_id: string;
  category: string;
  concept?: string;
  source_notes?: string;
  priority: Priority;
  target_date?: string;
  target_research_date?: string;
  target_sourcing_date?: string;
  target_fix_date?: string;
  target_costing_date?: string;
  target_launch_date?: string;
  target_sample_date?: string;
  target_quantity?: number | '';
  references?: ReferenceDraft[];
  colorways?: ColorwayDraft[];
  sizes?: string[];
  size_chart_name?: string;
  size_unit?: string;
  measurements?: MeasurementDraft[];
  materials?: MaterialSupplierDraft[];
  hpp_lines?: HppLineDraft[];
  target_margin_percent?: number | '';
}

export interface SampleDraft {
  sample_type: 'DEVELOPMENT' | 'FIT' | 'PRE_PRODUCTION' | 'PRODUCTION';
  material_notes?: string;
  pattern_notes?: string;
  construction_notes?: string;
  revision_notes?: string;
}

export interface ProjectEditInput {
  article_name: string;
  business_unit_id: string;
  category: string;
  concept?: string;
  source_notes?: string;
  priority: Priority;
  target_date?: string;
  target_fix_date?: string;
  target_launch_date?: string;
}

export type ReferenceType = 'PRODUCT' | 'MATERIAL' | 'PRICE' | 'CONSTRUCTION' | 'MARKET' | 'OTHER';

export interface ReferenceDraft {
  title: string;
  reference_type: ReferenceType;
  source_url?: string;
  image_url?: string;
  insight?: string;
  sort_order: number;
  is_primary?: boolean;
}

export interface ColorwayDraft {
  name: string;
  color_code?: string;
  hex_code?: string;
  panel_notes?: string;
}

export interface MeasurementDraft {
  point_code: string;
  point_name: string;
  position: number;
  tolerance_plus: number | '';
  tolerance_minus: number | '';
  values: Record<string, number | ''>;
}

export type BomComponentRole =
  | 'MAIN_FABRIC' | 'SECONDARY_FABRIC' | 'LINING' | 'INTERLINING' | 'PADDING' | 'RIB'
  | 'WEBBING' | 'ELASTIC' | 'ZIPPER' | 'BUTTON' | 'SNAP' | 'VELCRO' | 'THREAD'
  | 'DRAWCORD' | 'EYELET' | 'LABEL' | 'PATCH' | 'PRINTING' | 'EMBROIDERY'
  | 'POLYBAG' | 'HANGTAG' | 'CARTON' | 'PACKAGING' | 'OTHER';

export const BOM_COMPONENT_ROLES: Array<[BomComponentRole, string]> = [
  ['MAIN_FABRIC', 'Kain utama'], ['SECONDARY_FABRIC', 'Kain sekunder'], ['LINING', 'Lining'],
  ['INTERLINING', 'Interlining'], ['PADDING', 'Padding'], ['RIB', 'Rib'], ['WEBBING', 'Webbing'],
  ['ELASTIC', 'Elastic'], ['ZIPPER', 'Zipper'], ['BUTTON', 'Kancing'], ['SNAP', 'Snap'],
  ['VELCRO', 'Velcro'], ['THREAD', 'Benang'], ['DRAWCORD', 'Drawcord'], ['EYELET', 'Eyelet'],
  ['LABEL', 'Label'], ['PATCH', 'Patch'], ['PRINTING', 'Sablon'], ['EMBROIDERY', 'Bordir'],
  ['POLYBAG', 'Polybag'], ['HANGTAG', 'Hangtag'], ['CARTON', 'Karton'], ['PACKAGING', 'Kemasan'],
  ['OTHER', 'Komponen custom'],
];

export function bomRoleLabel(role: string): string {
  return BOM_COMPONENT_ROLES.find(([value]) => value === role)?.[1] ?? role;
}

export interface MaterialSupplierDraft {
  proposed_name: string;
  role: BomComponentRole;
  composition?: string;
  gsm?: number | '';
  width_cm?: number | '';
  color_notes?: string;
  estimated_consumption?: number | '';
  unit: string;
  suitability_notes?: string;
  risk_notes?: string;
  supplier_name?: string;
  supplier_role: 'PRIMARY' | 'ALTERNATIVE';
  price_unit: string;
  contact_name?: string;
  phone?: string;
  city?: string;
  address?: string;
  unit_price?: number | '';
  moq?: number | '';
  moq_notes?: string;
  lead_time_days?: number | '';
  supplier_notes?: string;
}

export interface HppLineDraft {
  category: 'MATERIAL' | 'ACCESSORY' | 'LABOR' | 'PRINTING' | 'EMBROIDERY' | 'PACKAGING' | 'OVERHEAD' | 'OTHER';
  item_name: string;
  quantity: number | '';
  unit: string;
  unit_price: number | '';
  waste_percent: number | '';
  notes?: string;
}

export type CostCalculationMethod = 'PER_UNIT' | 'PER_BATCH' | 'PERCENTAGE' | 'FIXED';

export interface CostComponent {
  id: string;
  name: string;
  category: HppLineDraft['category'];
  calculation_method: CostCalculationMethod;
  unit: string;
  default_price: number | null;
  notes: string | null;
  is_active: boolean;
}

export interface CostComponentDraft {
  name: string;
  category: HppLineDraft['category'];
  calculation_method: CostCalculationMethod;
  unit: string;
  default_price?: number | '';
  notes?: string;
}

export type ProductionBatchStatus = 'PLANNED' | 'IN_PROGRESS' | 'WAITING' | 'COMPLETED' | 'CANCELLED';

export interface ProductionBatch {
  id: string;
  project_id: string;
  batch_code: string;
  vendor_name: string | null;
  planned_start: string | null;
  target_finish: string | null;
  actual_start: string | null;
  actual_finish: string | null;
  total_quantity: number;
  cutting_progress: number;
  sewing_progress: number;
  finishing_progress: number;
  qc_progress: number;
  quantity_passed: number;
  quantity_rejected: number;
  quantity_reworked: number;
  status: ProductionBatchStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductionBatchDraft {
  batch_code: string;
  vendor_name?: string;
  planned_start?: string;
  target_finish?: string;
  total_quantity: number | '';
  notes?: string;
}

export type ReleasePlanStatus = 'NOT_STARTED' | 'IN_PREPARATION' | 'WAITING_PRODUCT' | 'READY' | 'PUBLISHED';

export interface ReleasePlan {
  id: string;
  project_id: string;
  final_product_name: string | null;
  product_description: string | null;
  selling_points: string | null;
  retail_price: number | null;
  marketing_start_date: string | null;
  launch_date: string | null;
  channel_links: Record<string, string>;
  readiness_checks: Record<string, boolean>;
  status: ReleasePlanStatus;
  updated_at: string;
}

export interface ReleasePlanDraft {
  final_product_name?: string;
  product_description?: string;
  selling_points?: string;
  retail_price?: number | '';
  marketing_start_date?: string;
  launch_date?: string;
  channel_links: Record<string, string>;
  readiness_checks: Record<string, boolean>;
  status: ReleasePlanStatus;
}

export interface MasterMaterial {
  id: string;
  code: string | null;
  name: string;
  category: string;
  composition: string | null;
  gsm: number | null;
  width_cm: number | null;
  unit: string;
  characteristics: string | null;
  care_notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MasterMaterialDraft {
  name: string;
  category: string;
  composition?: string;
  gsm?: number | '';
  width_cm?: number | '';
  unit: string;
  characteristics?: string;
  care_notes?: string;
}

export interface MasterSupplier {
  id: string;
  code: string | null;
  name: string;
  category: string | null;
  contact_name: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  lead_time_days: number | null;
  minimum_order_notes: string | null;
  quality_notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MasterSupplierDraft {
  name: string;
  category?: string;
  contact_name?: string;
  phone?: string;
  city?: string;
  address?: string;
  lead_time_days?: number | '';
  minimum_order_notes?: string;
  quality_notes?: string;
}

export interface MaterialSupplierLink {
  id: string;
  material_id: string;
  supplier_id: string;
  is_primary: boolean;
  unit_price: number | null;
  price_unit: string | null;
  moq: number | null;
  lead_time_days: number | null;
  notes: string | null;
  supplier?: Pick<MasterSupplier, 'id' | 'name' | 'contact_name' | 'phone' | 'city'>;
}

export interface MaterialSupplierLinkDraft {
  supplier_id: string;
  is_primary?: boolean;
  unit_price?: number | '';
  price_unit?: string;
  moq?: number | '';
  lead_time_days?: number | '';
  notes?: string;
}

export type VariantMatrixStatus = 'DRAFT' | 'SAMPLE_ONLY' | 'APPROVED' | 'PRODUCTION_READY' | 'DISABLED';

export interface VariantMatrixRow {
  id: string;
  project_id: string;
  colorway_id: string;
  size: string;
  sku: string | null;
  status: VariantMatrixStatus;
  min_quantity: number | null;
  unit_cost: number | null;
  notes: string | null;
}
