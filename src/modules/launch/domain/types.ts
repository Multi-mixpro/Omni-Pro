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
  colorways: Array<{ id: string; name: string; hex_code: string | null; status: string }>;
  hpp: Array<{ id: string; version: number; total_hpp: number; recommended_price: number | null; status: string }>;
  sizeCharts: Array<{ id: string; name: string; status: string }>;
  qc: Array<{ id: string; result: string; summary: string | null; checked_at: string | null }>;
}

export interface NewProjectInput {
  article_name: string;
  business_unit_id: string;
  category: string;
  concept?: string;
  source_notes?: string;
  priority: Priority;
  target_date?: string;
}
