export type UserRoleCode =
  | 'owner'
  | 'product_lead'
  | 'production_lead'
  | 'sourcing_admin'
  | 'creative'
  | 'qc'
  | 'seller'
  | 'attendance_supervisor'
  | 'viewer';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  job_title?: string;
  department?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  code: UserRoleCode;
  name: string;
  description?: string;
  is_system: boolean;
}

export interface UserPermission {
  code: string;
  module: string;
  description?: string;
}
