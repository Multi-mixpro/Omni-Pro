-- Additional Stage Tables: Color, Sample, Size Chart, QC, and Evaluations

-- 1. Article Colors (Tahap 4)
CREATE TABLE IF NOT EXISTS public.launch_article_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.launch_work_orders(id) ON DELETE CASCADE,
  color_name TEXT NOT NULL,
  internal_color_code TEXT,
  supplier_color_code TEXT,
  panel_scope TEXT,
  hex_reference TEXT,
  swatch_media_id UUID REFERENCES public.media_files(id),
  is_final BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Article Samples & Iteration (Tahap 5)
CREATE TABLE IF NOT EXISTS public.launch_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.launch_work_orders(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL DEFAULT 1,
  sample_code TEXT NOT NULL,
  parent_sample_id UUID REFERENCES public.launch_samples(id),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'REVISION', 'APPROVED', 'MASTER')),
  sample_date DATE,
  material_summary TEXT,
  pattern_summary TEXT,
  construction_summary TEXT,
  result_summary TEXT,
  revision_notes TEXT,
  is_master_sample BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. HPP Versions & Items (Tahap 6)
CREATE TABLE IF NOT EXISTS public.launch_hpp_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.launch_work_orders(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'FINAL')),
  direct_cost_total NUMERIC NOT NULL DEFAULT 0,
  reject_pct NUMERIC NOT NULL DEFAULT 3,
  reject_cost_total NUMERIC NOT NULL DEFAULT 0,
  overhead_pct NUMERIC NOT NULL DEFAULT 15,
  overhead_cost_total NUMERIC NOT NULL DEFAULT 0,
  hpp_total NUMERIC NOT NULL DEFAULT 0,
  target_margin_pct NUMERIC NOT NULL DEFAULT 35,
  suggested_selling_price NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.launch_hpp_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hpp_version_id UUID NOT NULL REFERENCES public.launch_hpp_versions(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  qty NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'pcs',
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0
);

-- 4. Size Chart Versions, Sizes & Measurement Points (Tahap 7)
CREATE TABLE IF NOT EXISTS public.launch_size_chart_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.launch_work_orders(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'FINAL')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.launch_size_chart_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size_chart_version_id UUID NOT NULL REFERENCES public.launch_size_chart_versions(id) ON DELETE CASCADE,
  size_code TEXT NOT NULL, -- S, M, L, XL, XXL
  sequence_no INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.launch_measurement_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size_chart_version_id UUID NOT NULL REFERENCES public.launch_size_chart_versions(id) ON DELETE CASCADE,
  point_name TEXT NOT NULL, -- Lingkar Dada, Panjang Badan, dll
  tolerance_plus NUMERIC DEFAULT 1,
  tolerance_minus NUMERIC DEFAULT 1,
  sequence_no INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.launch_size_chart_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size_id UUID NOT NULL REFERENCES public.launch_size_chart_sizes(id) ON DELETE CASCADE,
  measurement_point_id UUID NOT NULL REFERENCES public.launch_measurement_points(id) ON DELETE CASCADE,
  measurement_value NUMERIC NOT NULL DEFAULT 0
);

-- 5. QC Checklist & Approval (Tahap 8)
CREATE TABLE IF NOT EXISTS public.launch_qc_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.launch_qc_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.launch_qc_templates(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  check_point TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.launch_qc_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.launch_work_orders(id) ON DELETE CASCADE,
  template_item_id UUID NOT NULL REFERENCES public.launch_qc_template_items(id),
  result TEXT NOT NULL DEFAULT 'PASS' CHECK (result IN ('PASS', 'FAIL', 'NA')),
  notes TEXT,
  checked_by UUID REFERENCES public.profiles(id),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Catalog Products & Variants (Public Launch Target)
CREATE TABLE IF NOT EXISTS public.catalog_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_work_order_id UUID UNIQUE REFERENCES public.launch_work_orders(id),
  brand_id UUID NOT NULL REFERENCES public.launch_brands(id),
  product_code TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED')),
  is_sellable BOOLEAN NOT NULL DEFAULT true,
  hero_media_id UUID REFERENCES public.media_files(id),
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
