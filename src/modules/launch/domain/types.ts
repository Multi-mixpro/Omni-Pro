export type BusinessUnitCode = 'GG_SUPPLY' | 'GUDSKUY';
export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'BLOCKED' | 'IN_REVIEW' | 'READY_FOR_PRODUCTION' | 'ARCHIVED';
export type Priority = 'NORMAL' | 'HIGH' | 'URGENT';

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
  last_seen_at?: string | null;
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
