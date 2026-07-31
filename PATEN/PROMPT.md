# Master Prompt for AI Code Editors (Cursor / Windsurf / Claude Code / Copilot)

> **Instructions for AI**: Copy and paste this prompt into your AI Code Editor prompt window to continue full development, backend synchronization, or feature extension of **Product Launch OS 3.0**.

---

```markdown
# TASK PROMPT: Product Launch OS 3.0 — Supabase, Vercel, & Cloudinary Full-Stack Integration

You are an expert Senior Full-Stack Engineer and UI/UX Designer specializing in React 18, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth + Realtime), Vercel Serverless Functions, and Cloudinary Media API.

You are maintaining and extending **Product Launch OS 3.0**, a high-density Studio Operations & Apparel Product Lifecycle Management (PLM) system.

---

## 1. Project Background & Tech Stack

- **Application Name**: Product Launch OS 3.0 (Studio Operations & Apparel PLM)
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Motion (Framer Motion)
- **Primary Color Accent**: Deep Studio Teal `#087E79` (`bg-[#087E79]`, `text-[#087E79]`, `border-teal-200`)
- **Backend Services**:
  - **Database**: Supabase (PostgreSQL with RLS)
  - **Media Storage**: Cloudinary (Tech Pack PDFs, Fabric Swatch Photos, Proto Samples)
  - **Deployment**: Vercel (Frontend + Serverless API routes under `/api/*`)

---

## 2. Supabase SQL Migration Script (Execute in Supabase SQL Editor)

Please ensure the following database structure is initialized in Supabase:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Suppliers / Vendors Table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'Fabric Mill', 'Trimming Vendor', 'Garment Factory', 'Printing Studio'
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  rating NUMERIC(3,2) DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Articles Table
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  business_unit VARCHAR(100) NOT NULL DEFAULT 'Mainline Studio',
  category VARCHAR(100) NOT NULL,
  stage VARCHAR(100) NOT NULL DEFAULT 'Briefing',
  status VARCHAR(100) NOT NULL DEFAULT 'In Development',
  target_hpp NUMERIC(15,2) DEFAULT 0,
  calculated_hpp NUMERIC(15,2) DEFAULT 0,
  target_sample_date DATE,
  actual_sample_date DATE,
  target_release_date DATE,
  schedule_health VARCHAR(50) DEFAULT 'On Track',
  owner_name VARCHAR(255) NOT NULL,
  tech_pack_url TEXT,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Materials Master Table
CREATE TABLE IF NOT EXISTS public.materials_master (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  group_type VARCHAR(100) NOT NULL,
  stock_unit VARCHAR(50) NOT NULL,
  latest_price NUMERIC(15,2) DEFAULT 0,
  preferred_supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  composition VARCHAR(255),
  default_waste_percent NUMERIC(5,2) DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Article Bill of Materials (BOM)
CREATE TABLE IF NOT EXISTS public.article_bom (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials_master(id) ON DELETE RESTRICT,
  usage_area VARCHAR(255) NOT NULL,
  net_consumption NUMERIC(10,4) NOT NULL,
  consumption_unit VARCHAR(50) NOT NULL,
  waste_percent NUMERIC(5,2) DEFAULT 5.0,
  effective_unit_price NUMERIC(15,2) NOT NULL,
  is_custom_price BOOLEAN DEFAULT FALSE,
  cost_per_product NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Article Labor Costs
CREATE TABLE IF NOT EXISTS public.article_labor_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  process_name VARCHAR(255) NOT NULL,
  cost_per_piece NUMERIC(15,2) NOT NULL DEFAULT 0,
  vendor_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Article Batches (PO / Production)
CREATE TABLE IF NOT EXISTS public.article_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  batch_code VARCHAR(100) NOT NULL,
  order_quantity INT NOT NULL,
  current_operation VARCHAR(100) NOT NULL DEFAULT 'Fabric Inspection',
  progress_percent NUMERIC(5,2) DEFAULT 0,
  start_date DATE,
  target_finish_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tasks & Operational Action Items
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  stage VARCHAR(100) NOT NULL,
  priority VARCHAR(50) DEFAULT 'Medium',
  status VARCHAR(50) DEFAULT 'Todo',
  pic_name VARCHAR(255) NOT NULL,
  due_date DATE,
  is_blocking BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_bom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_labor_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow read/write for authenticated studio users
CREATE POLICY "Allow read write for studio users" ON public.articles
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow read write for materials" ON public.materials_master
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow read write for bom" ON public.article_bom
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow read write for labor" ON public.article_labor_costs
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow read write for batches" ON public.article_batches
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow read write for tasks" ON public.tasks
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
```

---

## 3. Environment Variables Configuration (`.env`)

Create or update your `.env` file in the project root:

```env
# Supabase Credentials
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Cloudinary Credentials (For Frontend Upload Unsigned Preset or API endpoint)
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=product_launch_os_preset

# Serverless API / Secret Keys (For Vercel)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

---

## 4. Key Workflows to Implement or Enhance

1. **Supabase Realtime Sync**:
   - Replace standard `localStorage` implementation in `src/services/storage.ts` with Supabase client `@supabase/supabase-js`.
   - Subscribe to Realtime changes on `articles` and `article_bom` so multi-user updates reflect instantly on all studio screens.

2. **Cloudinary Upload Widget**:
   - Integrated in `GeneralView.tsx` (Tech Pack PDF upload) and `SamplesView.tsx` (Proto Sample photos).
   - Direct unsigned preset upload to Cloudinary folder `product-launch-os/articles/`.

3. **Costing Engine Calculation Rules**:
   - `Gross Consumption = Net Consumption * (1 + Waste % / 100)`
   - `Material Cost = Gross Consumption * Effective Unit Price`
   - `Total Material BOM = SUM(Material Cost)`
   - `Total Labor Cost = SUM(Labor Process Rates)`
   - `Calculated HPP = Total Material BOM + Total Labor Cost`
   - Real-time comparison with `Target HPP` (Alert warning if Calculated HPP > Target HPP).

4. **Implementation Calendar (High Density)**:
   - Calendar Grid View with Month Nav, Today button, Side Inspector panel for selected dates, Gantt timeline, and Agenda List.
   - Quick Reschedule modal connected directly to Supabase update query.

---

## 5. UI/UX Quality Guidelines

- **Clean Light Palette**: Background `bg-slate-50`, cards `bg-white`, borders `border-slate-200`, text `text-slate-900`.
- **Primary Color Accent**: `#087E79` (`bg-[#087E79]`, `text-[#087E79]`, `hover:bg-[#066864]`).
- **Typography**: Mono numbers and codes (`font-mono`), Jakarta/Inter for UI copy.
- **Micro-Interactions**: Smooth hover states, badge indicators for Schedule Health (`On Track`, `At Risk`, `Overdue`), clear zero-state empty screens.
```
