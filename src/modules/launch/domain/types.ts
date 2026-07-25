export type WorkOrderStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'ON_HOLD'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'CANCELLED'
  | 'ARCHIVED';

export type StageCode =
  | 'BRIEF'
  | 'MATERIAL_RESEARCH'
  | 'SUPPLIER_FIX'
  | 'COLOR_FIX'
  | 'SAMPLE_FIX'
  | 'HPP_FIX'
  | 'SIZE_CHART_FIX'
  | 'QC_FINAL';

export type StageStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'WAITING_MATERIAL'
  | 'WAITING_DECISION'
  | 'REVISION_REQUIRED'
  | 'IN_REVIEW'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface LaunchBrand {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface WorkOrder {
  id: string;
  brand_id: string;
  article_code: string;
  article_name: string;
  category: string;
  product_type?: string;
  purpose?: string;
  target_market?: string;
  description?: string;
  custom_capability: boolean;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  target_date?: string;
  primary_pic_user_id?: string;
  current_stage_code: StageCode;
  overall_status: WorkOrderStatus;
  progress_percent: number;
  reference_url?: string;
  hero_media_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  approved_by?: string;
  approved_at?: string;
  published_catalog_product_id?: string;
  // Joins
  launch_brands?: LaunchBrand;
  profiles?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface StageRun {
  id: string;
  work_order_id: string;
  stage_definition_id: string;
  stage_code: StageCode;
  status: StageStatus;
  assigned_user_id?: string;
  started_at?: string;
  completed_at?: string;
  due_at?: string;
  blocked_reason?: string;
  revision_notes?: string;
  created_at: string;
  updated_at: string;
  // Join definition
  launch_stage_definitions?: {
    name: string;
    sequence_no: number;
    weight: number;
  };
}
