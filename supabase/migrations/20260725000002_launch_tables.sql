-- Launch Brands
CREATE TABLE IF NOT EXISTS public.launch_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Launch Work Orders
CREATE TABLE IF NOT EXISTS public.launch_work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.launch_brands(id),
  article_code TEXT NOT NULL UNIQUE,
  article_name TEXT NOT NULL,
  category TEXT NOT NULL,
  product_type TEXT,
  purpose TEXT,
  target_market TEXT,
  description TEXT,
  custom_capability BOOLEAN DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  target_date DATE,
  primary_pic_user_id UUID REFERENCES public.profiles(id),
  current_stage_code TEXT NOT NULL DEFAULT 'BRIEF',
  overall_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (overall_status IN ('DRAFT', 'ACTIVE', 'ON_HOLD', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'CANCELLED', 'ARCHIVED')),
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  reference_url TEXT,
  hero_media_id UUID REFERENCES public.media_files(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  published_catalog_product_id UUID
);

-- Launch Work Order Members
CREATE TABLE IF NOT EXISTS public.launch_work_order_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.launch_work_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_title TEXT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(work_order_id, user_id)
);

-- Launch Stage Definitions
CREATE TABLE IF NOT EXISTS public.launch_stage_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sequence_no INTEGER NOT NULL UNIQUE,
  description TEXT,
  weight INTEGER NOT NULL DEFAULT 10,
  completion_rules JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Launch Stage Runs
CREATE TABLE IF NOT EXISTS public.launch_stage_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.launch_work_orders(id) ON DELETE CASCADE,
  stage_definition_id UUID NOT NULL REFERENCES public.launch_stage_definitions(id),
  stage_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'WAITING_MATERIAL', 'WAITING_DECISION', 'REVISION_REQUIRED', 'IN_REVIEW', 'BLOCKED', 'COMPLETED', 'CANCELLED')),
  assigned_user_id UUID REFERENCES public.profiles(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  blocked_reason TEXT,
  revision_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(work_order_id, stage_code)
);

-- Launch Tasks
CREATE TABLE IF NOT EXISTS public.launch_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.launch_work_orders(id) ON DELETE CASCADE,
  stage_run_id UUID REFERENCES public.launch_stage_runs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_user_id UUID REFERENCES public.profiles(id),
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'WAITING', 'BLOCKED', 'DONE', 'CANCELLED')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Brands
INSERT INTO public.launch_brands (code, name, description)
VALUES
  ('GG_SUPPLY', 'GG Supply', 'Brand Apparel & Menswear Utama'),
  ('GUDSKUY', 'GUDSKUY', 'Brand Streetwear & Casual Collection')
ON CONFLICT (code) DO NOTHING;

-- Seed 8 Stage Definitions
INSERT INTO public.launch_stage_definitions (code, name, sequence_no, description, weight)
VALUES
  ('BRIEF', 'Brief Artikel', 1, 'Mendefinisikan brief awal artikel, kategori, dan penunjukan PIC', 10),
  ('MATERIAL_RESEARCH', 'Riset Bahan', 2, 'Mengidentifikasi dan memilih spesifikasi kain & bahan', 15),
  ('SUPPLIER_FIX', 'Fix Supplier', 3, 'Menetapkan supplier final dan konfirmasi quotation harga', 15),
  ('COLOR_FIX', 'Fix Warna', 4, 'Menentukan varian warna final dan swatch fisik', 10),
  ('SAMPLE_FIX', 'Fix Sampel', 5, 'Iterasi pembuatan sampel hingga disetujui (Master Sample)', 20),
  ('HPP_FIX', 'Fix HPP', 6, 'Kalkulasi HPP final, overhead, reject rate, dan margin target', 10),
  ('SIZE_CHART_FIX', 'Fix Size Chart', 7, 'Menetapkan tabel spesifikasi ukuran dan toleransi', 10),
  ('QC_FINAL', 'QC & Artikel Final', 8, 'Pemeriksaan akhir Quality Control dan approval Owner', 10)
ON CONFLICT (code) DO NOTHING;
