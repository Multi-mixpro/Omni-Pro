export interface MaterialCandidate {
  id: string;
  work_order_id: string;
  material_name: string;
  composition?: string;
  gsm?: number;
  width_cm?: number;
  unit: 'meter' | 'yard';
  estimated_consumption: number;
  characteristics?: string;
  suitability_reason?: string;
  risks?: string;
  status: 'CANDIDATE' | 'SELECTED' | 'REJECTED';
  swatch_media_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierQuote {
  id: string;
  work_order_id: string;
  supplier_name: string;
  supplier_code?: string;
  contact_name?: string;
  phone?: string;
  item_name: string;
  price: number;
  currency: 'IDR' | 'USD';
  price_unit: string;
  moq?: number;
  lead_time_days?: number;
  valid_until?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface ArticleColor {
  id: string;
  work_order_id: string;
  color_name: string;
  internal_color_code?: string;
  supplier_color_code?: string;
  panel_scope?: string;
  hex_reference?: string;
  swatch_media_id?: string;
  is_final: boolean;
  created_at: string;
}

export interface HppItem {
  id?: string;
  hpp_version_id?: string;
  category:
    | 'FABRIC'
    | 'LINING'
    | 'ACCESSORY'
    | 'CUTTING'
    | 'SEWING'
    | 'PRINTING'
    | 'EMBROIDERY'
    | 'LABEL'
    | 'PACKAGING'
    | 'FINISHING'
    | 'QUALITY_CONTROL'
    | 'TRANSPORT'
    | 'OTHER';
  item_name: string;
  specification?: string;
  qty: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
}

export interface HppVersion {
  id: string;
  work_order_id: string;
  version_no: number;
  status: 'DRAFT' | 'FINAL';
  direct_cost_total: number;
  reject_pct: number;
  reject_cost_total: number;
  overhead_pct: number;
  overhead_cost_total: number;
  hpp_total: number;
  target_margin_pct: number;
  suggested_selling_price: number;
  notes?: string;
  created_at: string;
  items?: HppItem[];
}
