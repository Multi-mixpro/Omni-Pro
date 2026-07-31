# Product Launch OS 3.0 — Comprehensive Blueprint & Architecture Specification

System Architecture, UI/UX Standards, Workflows, and Technical Blueprint for **Product Launch OS 3.0** (Studio Operations & Apparel Product Lifecycle Management).

---

## 1. System Overview & Vision

**Product Launch OS 3.0** is an enterprise-grade Apparel Product Lifecycle & Studio Operations Management platform. Designed for fashion brands, garment manufacturing teams, and studio managers to track products from **Initial Design Brief -> Tech Pack -> Multi-Iterative Sampling -> Costing Engine (BOM + Labor) -> Multi-Batch Production -> Gate Approvals -> Warehouse Launch**.

### Integrated Services Architecture
* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Motion.
* **Database & Auth (Configured)**: **Supabase** (PostgreSQL with Row Level Security, Realtime subscriptions, Auth for Studio Users).
* **Media Storage (Configured)**: **Cloudinary** (High-res article sketches, tech pack PDFs, proto sample photos, fabric swatch inspects).
* **Deployment & Hosting (Configured)**: **Vercel** (Serverless functions for API endpoints, edge routing, automated CI/CD).

---

## 2. Technical Stack & Service Integration Architecture

```
                       ┌─────────────────────────────────────────┐
                       │          React 18 + Vite Frontend       │
                       │    (Tailwind CSS, TypeScript, Lucide)   │
                       └────────────────────┬────────────────────┘
                                            │
         ┌──────────────────────────────────┼──────────────────────────────────┐
         ▼                                  ▼                                  ▼
┌─────────────────┐               ┌──────────────────┐               ┌─────────────────┐
│    Supabase     │               │    Cloudinary    │               │     Vercel      │
│  (PostgreSQL +  │               │ (Media Storage & │               │  (Hosting & Edge│
│ Auth & Realtime)│               │ Image Processing)│               │ API Serverless) │
└─────────────────┘               └──────────────────┘               └─────────────────┘
```

### Database Schema Structure (Supabase / PostgreSQL)

1. **`articles`**
   - `id` (UUID, Primary Key)
   - `code` (VARCHAR, e.g. "ART-101")
   - `name` (VARCHAR)
   - `business_unit` ('Mainline Studio' | 'Streetwear Co' | 'Activewear Lab')
   - `category` (VARCHAR, e.g. 'Outerwear', 'Tops', 'Bottoms')
   - `stage` ('Briefing' | 'Tech Pack' | 'Sampling' | 'Costing & Approval' | 'Bulk Production' | 'Warehouse Launch')
   - `status` ('In Development' | 'In Sample' | 'Production Approved' | 'On Hold' | 'Released')
   - `target_hpp` (NUMERIC)
   - `calculated_hpp` (NUMERIC)
   - `target_sample_date` (DATE)
   - `target_release_date` (DATE)
   - `schedule_health` ('On Track' | 'At Risk' | 'Overdue')
   - `owner_name` (VARCHAR)
   - `tech_pack_url` (TEXT - Cloudinary URL)
   - `image_url` (TEXT - Cloudinary URL)
   - `created_at`, `updated_at` (TIMESTAMPTZ)

2. **`materials_master`**
   - `id` (UUID, PK)
   - `code` (VARCHAR, e.g. "MAT-001")
   - `name` (VARCHAR)
   - `group` ('main_fabric' | 'lining' | 'rib' | 'zipper' | 'button' | 'label' | 'packaging' | 'thread')
   - `stock_unit` ('meter' | 'yard' | 'pcs' | 'roll' | 'cone')
   - `latest_price` (NUMERIC)
   - `preferred_supplier_id` (UUID, FK -> `suppliers`)
   - `composition` (VARCHAR)
   - `default_waste_percent` (NUMERIC)

3. **`article_bom`**
   - `id` (UUID, PK)
   - `article_id` (UUID, FK -> `articles`)
   - `material_id` (UUID, FK -> `materials_master`)
   - `usage_area` (VARCHAR, e.g. "Body Utama", "Kerah & Rib")
   - `net_consumption` (NUMERIC)
   - `consumption_unit` (VARCHAR)
   - `waste_percent` (NUMERIC)
   - `gross_consumption` (NUMERIC)
   - `effective_unit_price` (NUMERIC)
   - `is_custom_price` (BOOLEAN)
   - `cost_per_product` (NUMERIC)

4. **`article_labor_costs`**
   - `id` (UUID, PK)
   - `article_id` (UUID, FK -> `articles`)
   - `process_name` (VARCHAR, e.g. "Potong / Cutting", "Jahit Utama", "Sablon / Printing")
   - `cost_per_piece` (NUMERIC)
   - `vendor_name` (VARCHAR)
   - `notes` (TEXT)

5. **`article_batches`**
   - `id` (UUID, PK)
   - `article_id` (UUID, FK -> `articles`)
   - `batch_code` (VARCHAR, e.g. "PO-2026-001")
   - `order_quantity` (INTEGER)
   - `current_operation` ('Fabric Inspection' | 'Cutting' | 'Sewing' | 'QC' | 'Finishing & Packaging')
   - `progress_percent` (NUMERIC)
   - `start_date` (DATE)
   - `target_finish_date` (DATE)
   - `vendor_id` (UUID, FK -> `suppliers`)

6. **`approvals_gate`**
   - `id` (UUID, PK)
   - `article_id` (UUID, FK -> `articles`)
   - `gate_type` ('Sample Approval' | 'Costing HPP Sign-off' | 'Bulk Production Release' | 'Warehouse Launch')
   - `status` ('Pending' | 'Approved' | 'Rejected')
   - `approver_name` (VARCHAR)
   - `signed_at` (TIMESTAMPTZ)
   - `notes` (TEXT)

---

## 3. Core Modules & User Experience Workflows

### Module 1: Executive Operations Dashboard
* **KPI Metrics**: Total Active Articles, Samples in Iteration, Total BOM & HPP Cost Summary, Approvals Gate Queue, Overdue Milestones.
* **Business Unit Selector**: Filter workspace by `Mainline Studio`, `Streetwear Co`, or `Activewear Lab`.
* **Quick Action Triggers**: Create Article, Batch Add Materials, Emergency Delay Alert.

### Module 2: Article Pipeline (Kanban & High-Density Table)
* **Kanban Board**: Drag-and-drop or status-click movement across 6 Stages:
  `Briefing -> Tech Pack -> Sampling -> Costing & Approval -> Bulk Production -> Warehouse Launch`.
* **Table View**: Column sorting, category filter, HPP target vs calculated variance display.

### Module 3: Implementation Workspace (Single Article Detail)
* **Header Bar**: Article Code, Stage Badge, Schedule Health Indicator, Owner Tag, Target Sample & Release Dates.
* **Multi-Tab Architecture**:
  1. **General Specs & Brief**: Tech Pack PDF view, Spec Sheets, Fabric Composition, Target HPP settings.
  2. **Materials & Accessories (BOM)**:
     - Multi-Select Recipe Modal to pick multiple fabrics/trimming at once.
     - Auto-synchronized master suppliers & prices.
     - Lock/Unlock toggle for custom price overrides.
     - Real-time gross consumption (`Net * (1 + Waste%)`) and cost per product calculation.
  3. **Labor & Processing Cost**:
     - Operational rate items (Cutting, Sewing, Printing, QC, Packaging).
     - Live HPP Costing Engine: `Total HPP = Total Material BOM + Total Labor Cost + Overhead %`.
  4. **Sample Iteration Tracker**: Proto 1, Proto 2, Gold Sample approval logs with revision notes and photo uploads via Cloudinary.
  5. **Batch Production PO**: Multi-batch PO management, vendor allocation, progress sliders, operation status tracking.

### Module 4: High-Density Implementation Calendar
* **Integrated View Switcher**: Grid Month View, Gantt Timeline View, Agenda List View.
* **Split Inspector Panel**: Click any date cell in the grid to immediately view, filter, and edit all milestones due on that day in a side panel without blocking the grid view.
* **Quick Reschedule Modal**: Update `targetSampleDate` and `targetReleaseDate` directly with instant calendar update.

### Module 5: Approvals Gate & Quality Control
* Gatekeeper sign-off matrix with digital approval status, timestamp, and audit trail for production release.

### Module 6: Master Data Directory
* Unified master management for `Materials`, `Suppliers`, `Standard Operational Labor Rates`, and `Vendor Directory`.

---

## 4. UI/UX & Styling Standards

* **Color Palette**:
  * Primary Accent: Deep Studio Teal `#087E79` (`hover: #066864`, `bg: bg-teal-50`).
  * Slate Neutrals: High contrast off-white background `bg-slate-50`, cards `bg-white`, borders `border-slate-200`, dark headings `text-slate-900`.
  * Status Tokens:
    * `On Track`: Emerald `bg-emerald-50 text-emerald-800 border-emerald-200`
    * `At Risk`: Amber `bg-amber-50 text-amber-800 border-amber-200`
    * `Overdue / Blocked`: Rose `bg-rose-50 text-rose-800 border-rose-200`
* **Typography**:
  * Mono font for Codes, IDR Currency, Unit Calculations, and Dates (`font-mono`).
  * Plus Jakarta Sans / Inter for clean display & body text.
* **Layout Discipline**:
  * High-density, compact controls with clear negative space.
  * Rounded corners capped at `rounded-xl` / `rounded-2xl`.
  * All currency formatted in Indonesian Rupiah (`formatIDR`).
