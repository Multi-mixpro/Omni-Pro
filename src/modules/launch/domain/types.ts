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

export interface LaunchTask {
  id: string;
  project_id: string;
  stage_code: StageCode;
  title: string;
  status: 'TODO' | 'DOING' | 'WAITING' | 'DONE';
  priority: Priority;
  assignee_id: string | null;
  due_date: string | null;
  project?: Pick<LaunchProject, 'id' | 'code' | 'article_name'>;
  assignee?: Profile | null;
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
  hpp: Array<{ id: string; version: number; total_hpp: number; recommended_price: number | null; target_margin_percent: number | null; status: string }>;
  sizeCharts: Array<{ id: string; name: string; status: string; sizes: string[] }>;
  qc: Array<{ id: string; result: string; summary: string | null; checked_at: string | null }>;
  samples: Array<{ id: string; version: number; sample_type: string; status: string; is_master: boolean; material_notes: string | null; pattern_notes: string | null; construction_notes: string | null; revision_notes: string | null }>;
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

export interface MaterialSupplierDraft {
  proposed_name: string;
  role: 'MAIN' | 'LINING' | 'RIB' | 'ACCESSORY' | 'PACKAGING' | 'OTHER';
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
