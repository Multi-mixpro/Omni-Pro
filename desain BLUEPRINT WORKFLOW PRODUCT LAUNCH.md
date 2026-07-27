# GG Product OS — Product Launch OS Design Specification

**Document:** `design.md`  
**Module:** Product Launch OS  
**Version:** 1.0  
**Status:** Implementation Ready  
**Primary Stack:** Next.js / React, Supabase, Vercel, Cloudinary  
**Primary Users:** Owner, Project Leader, Product Development Team, Sourcing, Pattern & Sample Team, QC, Production, Marketing, Finance

---

## 1. Purpose

Product Launch OS adalah pusat kerja untuk mengelola seluruh proses pengembangan artikel fashion dari prospek awal sampai produk diluncurkan.

Sistem harus membantu Owner dan tim untuk:

- memasukkan prospek artikel secara cepat;
- menjaga antrean artikel tetap hidup;
- menentukan target sampel, produksi, dan rilis;
- mengelola referensi visual dan dokumen;
- menyusun variant matrix warna dan ukuran;
- menyusun size chart dinamis;
- menyimpan bahan, aksesori, supplier, dan BOM;
- mengelola sampling dan revisi;
- menghitung HPP dan simulasi harga;
- membuat standar QC;
- mengontrol kesiapan produksi;
- mengelola launch preparation;
- memonitor progress, kelengkapan data, jadwal, biaya, dan blocker;
- menyimpan histori keputusan, revisi, dan approval.

Product Launch OS tidak boleh terasa seperti formulir administrasi panjang. Sistem harus terasa seperti **command center pengembangan produk**.

---

## 2. Product Design Principles

### 2.1 Quick Intake, Progressive Completion

Owner harus dapat membuat prospek artikel dalam waktu 2–5 menit. Detail teknis diisi bertahap oleh tim di dalam Article Workspace.

### 2.2 One Article, One Workspace

Seluruh data artikel harus berada dalam satu workspace terpusat. Pengguna tidak perlu berpindah ke banyak modul untuk memahami kondisi satu artikel.

### 2.3 Clear Ownership

Setiap artikel, tahapan, task, approval, blocker, dan keputusan harus memiliki Owner atau PIC yang jelas.

### 2.4 Parallel Workflows

Sourcing, size chart, costing, sampling, dan launch preparation dapat berjalan paralel jika prerequisite terpenuhi.

### 2.5 No Hidden Changes

Semua perubahan penting harus memiliki histori nilai sebelum, nilai sesudah, pengguna, waktu, dan alasan.

### 2.6 Decision Driven

Sistem harus membedakan antara informasi biasa, update kerja, blocker, dan keputusan yang membutuhkan approval Owner.

### 2.7 Visual First

Karena objek utama adalah produk fashion, daftar artikel, workspace, sampling, colorway, dan material harus menampilkan media secara kuat tetapi tetap efisien.

### 2.8 Professional but Simple

UI harus modern, ringan, modular, dan tidak padat secara berlebihan. Informasi teknis besar ditampilkan secara bertahap melalui section, tab, drawer, modal, dan expandable table.

---

## 3. User Roles

### 3.1 Owner

Akses utama:

- membuat artikel;
- menetapkan prioritas;
- menetapkan target dan anggaran;
- menetapkan Project Leader;
- memberikan keputusan dan approval;
- mengubah status portofolio;
- melihat semua artikel dan laporan;
- melakukan override terhadap gate dengan alasan.

### 3.2 Project Leader

Akses utama:

- menyusun workflow artikel;
- mengatur urutan task dan dependency;
- menunjuk PIC;
- mengatur estimasi durasi;
- memperbarui forecast;
- mengelola blocker;
- mengajukan approval;
- memastikan readiness setiap tahap.

### 3.3 Team Member

Akses utama:

- mengerjakan task;
- mengisi data sesuai tanggung jawab;
- mengunggah file dan media;
- mengisi tanggal aktual;
- membuat update;
- melaporkan blocker;
- mengajukan revisi atau keputusan.

### 3.4 Reviewer / Approver

Akses utama:

- membaca data tahap terkait;
- approve;
- approve dengan catatan;
- request revision;
- reject;
- memberikan komentar keputusan.

### 3.5 Viewer

Akses baca tanpa kemampuan edit, kecuali komentar jika diizinkan.

---

## 4. Role Permission Rules

Gunakan permission berbasis role dan unit bisnis.

Permission minimal:

- `article.create`
- `article.read`
- `article.update`
- `article.archive`
- `article.override_gate`
- `task.create`
- `task.assign`
- `task.update`
- `approval.request`
- `approval.decide`
- `cost.view`
- `cost.update`
- `supplier.view`
- `supplier.update`
- `production.release`
- `launch.release`
- `settings.manage`

Field sensitif seperti cost, margin, dan supplier quotation dapat dibatasi berdasarkan role.

---

## 5. Information Architecture

### Main Navigation

1. Dashboard
2. Article Pipeline
3. Launch Calendar
4. Tasks
5. Approvals
6. Materials & Accessories
7. Suppliers
8. Templates
9. Reports
10. Settings

### Primary Routes

```text
/dashboard
/articles
/articles/new
/articles/[articleId]
/articles/[articleId]/overview
/articles/[articleId]/brief
/articles/[articleId]/references
/articles/[articleId]/variants
/articles/[articleId]/size-chart
/articles/[articleId]/bom
/articles/[articleId]/suppliers
/articles/[articleId]/sampling
/articles/[articleId]/costing
/articles/[articleId]/qc
/articles/[articleId]/production
/articles/[articleId]/launch
/articles/[articleId]/tasks
/articles/[articleId]/files
/articles/[articleId]/discussion
/articles/[articleId]/history
/calendar
/tasks
/approvals
/materials
/accessories
/suppliers
/templates/workflows
/templates/size-charts
/templates/qc
/templates/cost-components
/reports
/settings
```

Route dapat diimplementasikan dengan nested route atau tab state, tetapi URL harus tetap dapat dibagikan dan dipulihkan.

---

## 6. Global Application Shell

### Desktop Layout

- Sidebar kiri tetap.
- Topbar untuk global search, notification, quick create, dan profile.
- Main content fleksibel.
- Optional right utility panel untuk quick context.

### Sidebar

Sidebar berisi:

- logo GG Product OS;
- menu utama;
- indikator jumlah approval;
- indikator blocker aktif;
- quick create article;
- switch unit bisnis jika pengguna memiliki lebih dari satu unit.

### Topbar

Topbar berisi:

- global search;
- quick command;
- tombol `Create Article`;
- notification center;
- bantuan;
- avatar dan account menu.

### Global Search

Search mencakup:

- nama artikel;
- kode artikel;
- SKU;
- nama supplier;
- material;
- task;
- approval;
- dokumen;
- user.

Hasil dikelompokkan berdasarkan entitas.

---

## 7. Visual Design System

### 7.1 General Style

Gunakan visual modern, profesional, dan tenang.

Karakter utama:

- neutral background;
- white card surface;
- accent color kuat untuk primary action;
- radius medium;
- shadow tipis;
- border halus;
- typography tegas;
- whitespace cukup;
- data table tetap padat tetapi mudah dibaca.

### 7.2 Suggested Color Tokens

```css
--color-bg: #f6f7f9;
--color-surface: #ffffff;
--color-surface-muted: #f1f3f5;
--color-border: #e4e7eb;
--color-text-primary: #16181d;
--color-text-secondary: #667085;
--color-primary: #f97316;
--color-primary-hover: #ea580c;
--color-success: #16a34a;
--color-warning: #d97706;
--color-danger: #dc2626;
--color-info: #2563eb;
--color-purple: #7c3aed;
```

Accent color dapat diubah dari Settings tanpa mengubah status semantic colors.

### 7.3 Typography

Gunakan font sans-serif modern seperti Inter atau Geist.

```text
Page Title: 28–32px / semibold
Section Title: 18–20px / semibold
Card Title: 15–16px / semibold
Body: 14px / regular
Table: 13–14px / regular
Caption: 12px / medium
```

### 7.4 Spacing

Gunakan base spacing 4px.

```text
4, 8, 12, 16, 20, 24, 32, 40, 48
```

### 7.5 Border Radius

```text
Small: 6px
Medium: 10px
Large: 14px
Pill: 999px
```

### 7.6 Status Colors

Status semantic harus konsisten di seluruh aplikasi.

- Draft: gray
- Ready: blue
- In Progress: indigo
- Waiting: amber
- Blocked: red
- In Review: purple
- Completed: green
- Archived: muted gray

Status tidak boleh hanya dibedakan dengan warna. Sertakan label dan icon.

---

## 8. Core UI Components

Komponen reusable minimum:

- AppShell
- Sidebar
- Topbar
- Breadcrumb
- PageHeader
- ArticleHeader
- MetricCard
- StatusBadge
- PriorityBadge
- HealthBadge
- ProgressBar
- ReadinessRing
- AvatarGroup
- UserPicker
- DatePicker
- DateRangePicker
- DurationInput
- CurrencyInput
- UnitInput
- InlineEditableField
- EditableTable
- DataGrid
- KanbanBoard
- TimelineView
- CalendarView
- FilterBar
- SavedViewPicker
- CommandPalette
- FileUploader
- MediaGallery
- ImageAnnotator
- ReferenceCard
- EmptyState
- ErrorState
- SkeletonState
- ConfirmationDialog
- SideDrawer
- ActivityTimeline
- CommentComposer
- ApprovalCard
- DecisionCard
- BlockerCard
- TaskCard
- DependencyPicker
- VersionHistoryDrawer
- ComparisonView
- AuditLogTable

---

## 9. Dashboard Design

### 9.1 Owner Command Center

Dashboard Owner harus langsung menjawab:

- apa yang sedang berjalan;
- apa yang terlambat;
- apa yang menunggu keputusan;
- artikel mana yang berisiko;
- apa yang akan dirilis;
- siapa yang memiliki beban kerja tinggi.

### 9.2 Dashboard Sections

#### Summary Metrics

- Active Articles
- Waiting Approval
- At Risk
- Blocked
- Ready for Production
- Ready to Launch
- Release This Month

#### Attention Required

Tampilkan prioritas tertinggi:

- approval paling lama menunggu;
- blocker kritis;
- target terlewat;
- HPP melewati target;
- artikel tanpa update;
- supplier belum dikonfirmasi.

#### Article Pipeline

Visual pipeline horizontal:

```text
Prospect → Brief → Sourcing → Sampling → Costing → Production Ready → Production → Launch Ready → Launched
```

Setiap tahap menampilkan jumlah artikel. Klik tahap untuk membuka filtered article list.

#### Upcoming Milestones

Tampilkan 7–30 hari ke depan:

- target sample;
- target produksi;
- target stock ready;
- target photoshoot;
- target release.

#### Team Workload

Tampilkan task aktif, overdue, dan kapasitas per anggota.

#### Launch Calendar Preview

Tampilkan agenda peluncuran terdekat.

---

## 10. Article Pipeline Page

### 10.1 View Modes

Sediakan:

- Grid View
- List View
- Kanban View
- Timeline View

Pilihan view disimpan per user.

### 10.2 Grid View

Article Card menampilkan:

- cover image;
- nama artikel;
- kode artikel;
- brand;
- kategori;
- stage;
- status;
- progress;
- readiness;
- health;
- target release;
- countdown;
- PIC;
- jumlah blocker;
- jumlah approval pending;
- last update.

Quick actions pada hover atau menu:

- Open
- Edit basic info
- Add update
- Add task
- Duplicate
- Move status
- Archive

### 10.3 List View

Kolom default:

- Article
- Unit Business
- Category
- Priority
- Status
- Stage
- Progress
- Readiness
- Schedule Health
- Owner
- Project Leader
- Next Milestone
- Target Release
- Last Update

Kolom optional:

- Target sample
- Target production
- HPP estimate
- Target price
- Supplier status
- Sample version
- Blocker count
- Approval count

Fitur table:

- sticky header;
- column resize;
- show/hide columns;
- sort;
- multi-filter;
- bulk update;
- export;
- row selection;
- inline priority and status editing.

### 10.4 Kanban View

Group by:

- stage;
- status;
- owner;
- priority;
- schedule health;
- unit business.

Drag and drop hanya boleh mengubah stage/status jika gate terpenuhi. Jika belum terpenuhi, tampilkan gate dialog.

### 10.5 Saved Views

Contoh:

- My Active Articles
- Waiting for Approval
- Release This Month
- Overdue Sampling
- HPP Above Target
- Ready for Production
- Launch Assets Incomplete

---

## 11. Create Article Experience

Gunakan drawer besar atau page flow ringan. Hindari form panjang.

### 11.1 Step 1 — Basic Information

Required:

- article working name;
- unit business;
- category;
- owner;
- priority.

Optional:

- target product name;
- brand;
- subcategory;
- target user;
- collection;
- description.

### 11.2 Step 2 — Reference

- cover image;
- image gallery;
- reference links;
- PDF;
- video link;
- notes.

Minimal satu reference disarankan, tetapi tidak wajib untuk draft.

### 11.3 Step 3 — Targets

- first sample target;
- final sample target;
- mass production target;
- stock ready target;
- launch target;
- target quantity;
- target price;
- maximum HPP.

Input dapat menggunakan exact date atau estimated duration.

### 11.4 Step 4 — Initial Variants

- planned colors;
- planned sizes;
- variant notes.

### 11.5 Step 5 — Team and Workflow

- Project Leader;
- team members;
- workflow template;
- default stage durations.

### 11.6 Submit Behavior

Actions:

- Save Draft
- Save to Backlog
- Start Development

Setelah submit, sistem:

- membuat article code;
- membuat workspace;
- membuat workflow stages;
- membuat draft tasks;
- membuat media folder;
- membuat readiness checklist;
- mencatat audit log.

---

## 12. Article Workspace Layout

### 12.1 Desktop Structure

Gunakan layout tiga area:

```text
┌──────────────────────────────────────────────────────────────┐
│ Article Header                                               │
├───────────────┬──────────────────────────────┬───────────────┤
│ Stage Nav     │ Main Workspace               │ Context Panel │
│ Left          │ Center                       │ Right         │
└───────────────┴──────────────────────────────┴───────────────┘
```

### 12.2 Article Header

Tampilkan:

- cover thumbnail;
- article name;
- article code;
- brand;
- unit business;
- category;
- priority;
- portfolio status;
- current stage;
- Owner;
- Project Leader;
- target release;
- progress;
- readiness;
- schedule health;
- cost confidence.

Primary actions:

- Add Update
- Add Task
- Request Approval
- More Actions

### 12.3 Left Stage Navigation

Items:

- Overview
- Product Brief
- References
- Variants
- Materials & BOM
- Suppliers
- Size Chart
- Sampling
- Costing
- QC
- Production
- Launch
- Tasks
- Files
- Discussion
- History

Setiap item memiliki status:

- Not Started
- In Progress
- Missing Data
- Waiting Approval
- Completed
- Blocked

### 12.4 Main Workspace

Main workspace menggunakan:

- section cards;
- inline edit;
- autosave;
- table editing;
- bulk input;
- file dropzone;
- sticky footer actions untuk form panjang;
- clear save state.

### 12.5 Right Context Panel

Tampilkan:

- Next Milestone
- Progress
- Data Readiness
- Schedule Health
- Cost Confidence
- Current Owner / PIC
- Upcoming Tasks
- Active Blockers
- Pending Approvals
- Latest Update
- Decision Required

Panel dapat collapse.

---

## 13. Article Overview

Overview adalah ringkasan eksekutif.

Sections:

### Product Summary

- description;
- target user;
- use case;
- key features;
- target price;
- target HPP;
- target quantity.

### Milestones

- first sample;
- final sample;
- production start;
- stock ready;
- launch.

### Workflow Progress

Tampilkan stage stepper dengan status dan tanggal.

### Workstream Status

- Product Definition
- Sourcing
- Size & Fit
- Sampling
- Costing
- QC
- Production
- Launch

### Latest Activity

Timeline ringkas.

### Attention Required

- missing critical data;
- blockers;
- approval;
- overdue tasks.

---

## 14. Product Brief UI

Gunakan structured sections:

- Product Goal
- Target Customer
- Use Cases
- Product Positioning
- Required Features
- Optional Features
- Design Restrictions
- Competitor Benchmark
- Target Price and Margin
- Risks and Assumptions

Setiap section:

- supports rich text;
- supports attachments;
- shows last edited by;
- can be marked complete;
- can be submitted for approval.

Product Brief memiliki versioning dan lock state.

---

## 15. References UI

### 15.1 Reference Gallery

Modes:

- masonry grid;
- compact grid;
- list.

Reference card menampilkan:

- thumbnail;
- title;
- source;
- reference type;
- tags;
- owner;
- created date;
- review status.

### 15.2 Reference Types

- silhouette;
- material;
- color;
- construction;
- sewing detail;
- sizing;
- packaging;
- pricing;
- competitor;
- inspiration.

### 15.3 Image Annotation

Pengguna dapat:

- menambahkan pin;
- menulis note per area;
- menandai `Use`;
- menandai `Avoid`;
- assign note ke anggota tim;
- membuat task dari annotation.

### 15.4 Link Preview

Link reference menampilkan preview title, source, thumbnail, dan note manual. Sistem tetap menyimpan URL asli.

---

## 16. Variant Matrix UI

### 16.1 Variant Dimensions

Default:

- Colorway
- Size
- Material
- Style
- Packaging

Pengguna dapat menambah dimension custom.

### 16.2 Matrix Design

Tampilan utama berupa matrix dan variant summary.

Colorway row menampilkan:

- swatch;
- color name;
- internal code;
- supplier code;
- image;
- status;
- active sizes;
- minimum quantity;
- SKU count.

### 16.3 Color Picker

Sources:

- select from color library;
- create custom color;
- upload swatch;
- enter HEX/RGB/Pantone-like reference;
- link supplier color code.

Custom color dapat disimpan ke master library.

### 16.4 SKU Generation

Generate berdasarkan pattern yang dapat dikonfigurasi:

```text
[BRAND]-[ARTICLE]-[COLOR]-[SIZE]
```

Sebelum generate, tampilkan preview dan conflict warning.

---

## 17. Size Chart UI

### 17.1 Template Selection

Pilih template berdasarkan kategori:

- jacket;
- t-shirt;
- shirt;
- hoodie;
- pants;
- shorts;
- hat;
- bag;
- custom.

### 17.2 Measurement Library

Default fields untuk atasan/jaket:

- body length front;
- body length back;
- shoulder width;
- shoulder length;
- chest width;
- chest circumference;
- waist width;
- waist circumference;
- bottom width;
- bottom circumference;
- sleeve length;
- sleeve from neck;
- upper arm width;
- bicep circumference;
- elbow width;
- cuff width;
- cuff circumference;
- armhole height;
- armhole circumference;
- neck width;
- neck circumference;
- front neck depth;
- back neck depth;
- collar height;
- rib height;
- hood width;
- hood height;
- hood depth;
- hood visor length;
- pocket width;
- pocket height.

Default fields untuk celana:

- relaxed waist;
- maximum waist;
- waist width;
- hip circumference;
- hip width;
- front rise;
- back rise;
- outseam;
- inseam;
- thigh circumference;
- thigh width;
- knee width;
- leg opening;
- waistband height;
- pocket width;
- pocket depth.

Pengguna dapat menambah measurement custom dan menyimpannya ke library.

### 17.3 Table Modes

Size chart mendukung:

- Target Measurement
- Sample Actual
- Final Measurement
- Difference
- Tolerance
- Pass/Fail

### 17.4 Grading

Pengguna dapat:

- memasukkan base size;
- mengisi grading rule;
- preview hasil;
- override per cell;
- highlight outlier.

### 17.5 Versioning

Setiap perubahan besar membuat version:

- Draft V1
- Draft V2
- Sample V1
- Sample Final
- Production Final

Lock memerlukan approval.

---

## 18. Materials, Accessories, and BOM UI

### 18.1 BOM Sections

Group by:

- Main Fabric
- Secondary Fabric
- Lining
- Interlining
- Rib
- Zipper
- Button / Snap
- Elastic
- Drawcord
- Label
- Patch
- Printing
- Embroidery
- Packaging
- Custom Component

### 18.2 BOM Table Columns

- Component
- Category
- Material
- Supplier
- Supplier Code
- Color
- Unit
- Consumption
- Waste %
- MOQ
- Unit Price
- Lead Time
- Availability
- Status
- Attachment

### 18.3 Add Component Flow

Options:

- Select existing component
- Create new component
- Duplicate from another article
- Import from template

Jika membuat baru:

- save only for this article;
- save to master library;
- save as category template.

### 18.4 Supplier Comparison

Comparison drawer menampilkan:

- price;
- MOQ;
- lead time;
- sample availability;
- quality score;
- delivery score;
- note;
- quotation validity.

### 18.5 BOM Status

- Draft
- Under Review
- Approved
- Locked
- Revision Required

---

## 19. Sampling UI

### 19.1 Sample Iteration Cards

Tampilkan setiap iterasi sebagai card atau timeline:

- Sample V1
- Sample V2
- Pre-Production Sample
- Golden Sample

Card menampilkan:

- status;
- size;
- colorway;
- sample maker;
- request date;
- target date;
- received date;
- cost;
- review result;
- photo count.

### 19.2 Sample Detail

Sections:

- media gallery;
- material used;
- actual measurements;
- fitting review;
- construction review;
- defects;
- revision request;
- decision.

### 19.3 Review Findings

Finding fields:

- severity;
- category;
- description;
- image annotation;
- owner;
- action;
- due date;
- status.

Severity:

- Critical
- Major
- Minor
- Suggestion

### 19.4 Sample Decision

Actions:

- Approve
- Approve with Revision
- Request Revision
- Reject
- Set as Golden Sample

Keputusan harus tercatat di history.

---

## 20. Costing and HPP UI

### 20.1 Cost Version Tabs

- Initial Estimate
- Supplier Quotation
- Sample Cost
- Pre-Production HPP
- Actual Production HPP

### 20.2 Cost Component Table

Columns:

- Cost Component
- Category
- Calculation Type
- Quantity
- Unit
- Unit Cost
- Waste %
- Total
- Source
- Confidence
- Notes

Calculation types:

- per unit;
- per batch;
- percentage;
- fixed;
- formula.

### 20.3 Custom Cost Component

Pengguna dapat:

- select from master;
- create custom;
- save custom to library;
- assign default calculation method.

### 20.4 Cost Summary

Tampilkan:

- material cost;
- labor cost;
- finishing;
- packaging;
- overhead;
- reject allowance;
- total HPP;
- target HPP;
- variance;
- cost confidence.

### 20.5 Pricing Simulation

Input:

- target margin;
- wholesale margin;
- reseller margin;
- marketplace fee;
- tax;
- discount allowance.

Output:

- minimum retail price;
- recommended retail price;
- wholesale price;
- reseller price;
- margin amount;
- margin percentage;
- break-even quantity.

---

## 21. QC UI

### 21.1 QC Template

Template berdasarkan kategori produk.

Stages:

- Incoming Material QC
- Cutting QC
- Inline Sewing QC
- Finishing QC
- Measurement QC
- Final QC
- Packaging QC

### 21.2 Checklist Item

Fields:

- checkpoint;
- category;
- method;
- standard;
- tolerance;
- severity if failed;
- reference image;
- required evidence;
- result;
- note.

### 21.3 QC Result

- Pass
- Conditional Pass
- Fail
- Not Checked

### 21.4 Defect Tracking

Defect memiliki:

- defect type;
- severity;
- quantity;
- location;
- image;
- corrective action;
- recheck status.

---

## 22. Production Readiness Gate

Tampilkan readiness checklist sebelum status `Ready for Production`.

Mandatory items:

- Product Brief Locked
- Variant Matrix Locked
- Size Chart Locked
- BOM Locked
- Supplier Confirmed
- Sample Approved
- Golden Sample Selected
- HPP Approved
- QC Standard Approved
- Packaging Ready
- Material Availability Confirmed
- Production Capacity Confirmed
- Quantity Finalized
- Production Schedule Confirmed

### Gate Behavior

- Semua mandatory item harus complete.
- Item incomplete menampilkan owner dan quick action.
- Owner dapat override dengan permission khusus.
- Override wajib mengisi alasan dan risk acknowledgement.

---

## 23. Production UI

### 23.1 Batch Summary

- batch number;
- vendor/workshop;
- planned quantity;
- start date;
- target finish;
- forecast finish;
- status;
- overall progress.

### 23.2 Production Stages

- Material Preparation
- Cutting
- Sewing
- Finishing
- QC
- Packaging
- Completed

### 23.3 Variant Quantity Table

Per colorway dan size:

- planned;
- cut;
- sewn;
- passed QC;
- rejected;
- reworked;
- packed.

### 23.4 Production Issues

Issue fields:

- issue type;
- severity;
- stage;
- affected quantity;
- description;
- owner;
- action;
- target resolution;
- status.

---

## 24. Launch Preparation UI

### 24.1 Launch Checklist

- Final Product Name
- Product Description
- Selling Points
- Retail Price
- SKU
- Barcode
- Size Guide
- Product Photo
- Model Photo
- Product Video
- Marketplace Assets
- Packaging
- Stock Ready
- Channel Setup
- Content Schedule
- Launch Approval

### 24.2 Launch Assets

Tampilkan asset grid dengan status:

- Missing
- Draft
- In Review
- Approved
- Published

### 24.3 Sales Channels

Per channel:

- channel name;
- listing status;
- URL;
- price;
- stock;
- publish date;
- owner.

### 24.4 Release Gate

Produk tidak dapat dirilis jika item kritis belum lengkap.

---

## 25. Tasks and Scheduling

### 25.1 Task Fields

- title;
- article;
- stage;
- owner;
- assignees;
- priority;
- status;
- planned start;
- planned finish;
- actual start;
- actual finish;
- forecast finish;
- due date;
- duration;
- dependency;
- blocker;
- attachments;
- checklist;
- result summary.

### 25.2 Task Status

- Not Started
- Ready
- In Progress
- Waiting
- Blocked
- In Review
- Revision
- Completed
- Cancelled

### 25.3 Dependency Types

- Finish to Start
- Start to Start
- Finish to Finish
- None

### 25.4 Date Rules

Jangan menimpa planned date saat terjadi keterlambatan.

Gunakan:

- Planned Start
- Planned Finish
- Actual Start
- Actual Finish
- Forecast Finish

### 25.5 Task Views

- My Tasks
- By Article
- Board
- List
- Calendar
- Timeline

---

## 26. Updates, Discussion, and Decisions

### 26.1 Work Update

Template update:

- Completed
- In Progress
- Blocked
- Decision Needed
- Next Step
- Forecast

### 26.2 Comment Features

- mention user;
- attach file;
- link task;
- link field;
- resolve thread;
- edit history.

### 26.3 Decision Request

Fields:

- question;
- context;
- available options;
- impact per option;
- recommendation;
- decision deadline;
- approver.

Decision actions:

- Choose Option
- Request More Information
- Defer
- Reject Proposal

---

## 27. Approval System

### 27.1 Approval Types

- Product Brief Approval
- Concept Lock
- Variant Lock
- Material Lock
- Size Chart Lock
- Sample Approval
- HPP Approval
- QC Approval
- Production Release
- Launch Release

### 27.2 Approval States

- Draft
- Requested
- Under Review
- Approved
- Approved with Notes
- Revision Requested
- Rejected
- Cancelled

### 27.3 Approval Card

Tampilkan:

- approval type;
- requester;
- requested date;
- approver;
- related version;
- summary;
- due date;
- waiting duration;
- decision history.

---

## 28. Notifications

Notification categories:

- Assignment
- Mention
- Approval Request
- Approval Decision
- Task Due Soon
- Task Overdue
- Blocker Created
- Blocker Resolved
- Target Changed
- Version Locked
- Production Issue
- Launch Gate

Notification preference:

- in-app;
- email optional;
- digest optional.

Hindari notification berlebihan. Group notification berdasarkan artikel dan jenis.

---

## 29. Activity History and Audit

Setiap perubahan penting mencatat:

- actor;
- timestamp;
- entity;
- action;
- previous value;
- new value;
- reason;
- source;
- related approval.

History filters:

- All
- Data Changes
- Status Changes
- Approvals
- Files
- Comments
- Tasks
- Cost
- Production

---

## 30. File and Media Management

### 30.1 Cloudinary Usage

Cloudinary digunakan untuk:

- product images;
- reference images;
- sample photos;
- QC evidence;
- launch assets;
- video preview;
- thumbnails.

### 30.2 File Metadata

Setiap asset menyimpan:

- public ID;
- secure URL;
- resource type;
- file format;
- size;
- width and height;
- uploaded by;
- article ID;
- section;
- tags;
- version;
- created date.

### 30.3 Upload UX

- drag and drop;
- multi-upload;
- progress indicator;
- retry;
- cancel;
- image compression preview;
- duplicate warning;
- file type validation.

### 30.4 Folder Strategy

Gunakan folder logical:

```text
product-launch/{unit-business}/{article-code}/references
product-launch/{unit-business}/{article-code}/samples
product-launch/{unit-business}/{article-code}/qc
product-launch/{unit-business}/{article-code}/launch
```

---

## 31. Data Entry and Validation UX

### 31.1 Autosave

Gunakan autosave untuk field ringan dan rich text.

Tampilkan state:

- Saving...
- Saved
- Failed to save
- Offline changes pending

### 31.2 Explicit Save

Gunakan explicit save untuk:

- version lock;
- approval request;
- HPP version;
- size chart bulk change;
- BOM bulk change;
- production release;
- launch release.

### 31.3 Validation

Validation harus:

- tampil dekat field;
- menggunakan pesan spesifik;
- tidak menghapus input;
- menampilkan jumlah error pada section;
- mendukung scroll to first error.

### 31.4 Unsaved Changes

Jika pengguna meninggalkan halaman dengan perubahan belum tersimpan, tampilkan confirmation dialog.

---

## 32. Loading, Empty, Error, and Offline States

### Loading

Gunakan skeleton yang mengikuti layout final.

### Empty State

Empty state harus menjelaskan:

- apa yang belum ada;
- kenapa penting;
- tindakan berikutnya.

Contoh:

`Belum ada iterasi sampel. Buat Sample V1 untuk mulai mencatat proses sampling dan hasil review.`

### Error State

Tampilkan:

- pesan sederhana;
- retry;
- technical reference code;
- fallback navigation.

### Offline / Connection Issue

- tampilkan offline banner;
- simpan draft lokal untuk text input jika memungkinkan;
- blokir approval dan release saat offline;
- retry otomatis ketika koneksi kembali.

---

## 33. Responsive Design

### Desktop

Full three-column workspace.

### Tablet

- sidebar collapsible;
- right panel menjadi drawer;
- table dapat horizontal scroll;
- sticky key actions.

### Mobile

Mobile fokus untuk:

- melihat ringkasan;
- update task;
- upload bukti;
- komentar;
- approval;
- melihat blocker;
- melihat milestone.

Form kompleks seperti size chart, BOM, dan HPP sebaiknya tetap optimal di desktop, tetapi dapat dibaca di mobile.

Mobile article workspace menggunakan:

- top summary;
- segmented tabs;
- bottom action bar;
- card-based detail.

---

## 34. Accessibility

Minimum requirement:

- keyboard navigation;
- visible focus state;
- semantic HTML;
- label untuk semua input;
- status tidak hanya menggunakan warna;
- contrast sesuai WCAG AA;
- screen reader text untuk icon action;
- table header association;
- reduced motion support;
- minimum touch target 44px pada mobile.

---

## 35. Performance Requirements

Target:

- dashboard first meaningful paint cepat;
- image thumbnails menggunakan Cloudinary transformations;
- lazy load gallery;
- virtualized rows untuk table besar;
- pagination atau cursor pagination;
- debounce search;
- optimistic update untuk status ringan;
- background refetch setelah mutation;
- cache data master seperti category, measurement, material, dan supplier.

Hindari memuat seluruh histori atau seluruh media pada initial render.

---

## 36. Supabase Interaction Guidelines

Gunakan Supabase untuk:

- authentication;
- relational data;
- role permission;
- realtime task/update/approval jika diperlukan;
- audit event;
- database function untuk aggregate metrics.

### Data Fetching Rules

- server-side fetch untuk initial page;
- client-side query untuk interactive table;
- RLS wajib aktif;
- mutation wajib divalidasi di server;
- gunakan transaction atau RPC untuk multi-step critical actions;
- hindari insert partial yang meninggalkan data gate tidak konsisten.

Critical actions yang disarankan melalui server action atau API route:

- create article;
- lock version;
- approval decision;
- production release;
- launch release;
- duplicate article;
- mass variant generation;
- mass SKU generation.

---

## 37. Suggested Frontend Folder Structure

```text
src/
  app/
    (dashboard)/
      dashboard/
      articles/
      approvals/
      tasks/
      materials/
      suppliers/
      reports/
  components/
    ui/
    layout/
    articles/
    tasks/
    approvals/
    media/
    tables/
    forms/
  features/
    article-intake/
    article-workspace/
    product-brief/
    references/
    variants/
    size-chart/
    bom/
    suppliers/
    sampling/
    costing/
    qc/
    production/
    launch/
  lib/
    supabase/
    cloudinary/
    permissions/
    validations/
    formatters/
  hooks/
  types/
  constants/
```

---

## 38. UX Copy Guidelines

Gunakan bahasa operasional yang jelas.

Gunakan:

- `Buat Artikel`
- `Ajukan Persetujuan`
- `Minta Revisi`
- `Tandai sebagai Golden Sample`
- `Siap Produksi`
- `Terhambat`
- `Perbarui Perkiraan Selesai`

Hindari istilah teknis yang tidak diperlukan.

Pesan konfirmasi harus menjelaskan dampak.

Contoh:

`Mengunci Size Chart akan menjadikannya acuan produksi. Perubahan berikutnya harus dibuat sebagai versi baru.`

---

## 39. Key Business Rules

1. Owner dapat membuat prospek tanpa detail teknis lengkap.
2. Artikel tidak boleh masuk produksi tanpa readiness gate, kecuali override resmi.
3. Planned date tidak boleh ditimpa oleh forecast date.
4. Semua approval harus terikat ke version tertentu.
5. Semua lock menghasilkan version history.
6. Komponen custom dapat disimpan ke master library.
7. Measurement custom dapat disimpan ke measurement library.
8. Artikel dapat memiliki banyak supplier, material, varian, sampel, dan cost version.
9. Golden Sample hanya boleh satu aktif per artikel dan version.
10. Launch preparation dapat berjalan paralel dengan produksi.
11. Archive tidak menghapus histori.
12. Duplicate article harus menyalin data terpilih, bukan seluruh histori.
13. Semua override harus mencatat alasan dan actor.
14. Artikel dengan blocker kritis harus terlihat di dashboard Owner.
15. Readiness, progress, schedule health, dan cost confidence dihitung terpisah.

---

## 40. Readiness Calculation

Data Readiness dihitung dari checklist berbobot.

Contoh bobot:

```text
Product Brief: 10%
References & Concept: 10%
Variant Matrix: 10%
Size Chart: 15%
BOM & Supplier: 15%
Sampling: 15%
HPP: 10%
QC Standard: 10%
Launch Data: 5%
```

Field critical memiliki bobot lebih tinggi dan dapat memblokir readiness gate meskipun skor total tinggi.

---

## 41. Schedule Health Calculation

Status:

- Ahead of Schedule
- On Track
- At Risk
- Overdue
- Blocked

Suggested logic:

```text
Ahead of Schedule:
forecast finish lebih cepat dari planned finish.

On Track:
forecast finish tidak melewati planned finish dan tidak ada blocker kritis.

At Risk:
forecast mendekati atau sedikit melewati target, atau prerequisite belum selesai.

Overdue:
planned finish terlewat dan task belum selesai.

Blocked:
terdapat blocker aktif yang menghentikan critical path.
```

---

## 42. Cost Confidence Calculation

Levels:

- Low — estimasi kasar tanpa quotation;
- Medium — sebagian besar berdasarkan quotation;
- High — berdasarkan sample cost dan supplier terpilih;
- Verified — berdasarkan actual production HPP.

Tampilkan alasan confidence pada tooltip atau details drawer.

---

## 43. Progress Calculation

Progress berasal dari penyelesaian stage dan task berbobot, bukan hanya jumlah task.

Contoh:

```text
Article Intake: 5%
Product Brief: 8%
Reference & Concept: 8%
Variant Planning: 8%
Material & Supplier: 12%
Size Chart: 10%
Sampling: 15%
Costing: 10%
QC: 8%
Production Readiness: 6%
Production: 6%
Launch: 4%
```

Stage dapat memiliki partial progress berdasarkan task completion.

---

## 44. Acceptance Criteria — Phase 1

### Article Intake

- Owner dapat membuat artikel dalam maksimal lima langkah ringan.
- Artikel code dibuat otomatis.
- Workflow template dibuat otomatis.
- Artikel muncul di grid dan list.

### Article Workspace

- Semua section utama dapat diakses dari workspace.
- Header selalu menampilkan progress, readiness, health, dan target.
- Activity history tercatat.

### References

- User dapat upload banyak media.
- User dapat menambahkan link dan catatan.
- Media tersimpan di Cloudinary.

### Variants

- User dapat membuat colorway dan size matrix.
- User dapat menggunakan master color atau custom color.
- SKU dapat digenerate.

### Size Chart

- User dapat menggunakan template.
- User dapat menambah measurement custom.
- User dapat menyimpan beberapa version.

### BOM

- Satu artikel dapat memiliki banyak material dan aksesori.
- Component dapat dipilih dari master atau dibuat baru.
- Supplier dapat dibandingkan.

### Sampling

- User dapat membuat banyak sample iteration.
- Review dapat memiliki finding dan decision.
- Golden Sample dapat ditetapkan.

### Costing

- User dapat membuat cost component custom.
- User dapat membuat beberapa cost version.
- Sistem menghitung total HPP dan variance.

### Task and Approval

- Task memiliki planned, actual, dan forecast date.
- Approval terikat ke version.
- Blocker tampil di dashboard.

---

## 45. Implementation Priority

### Phase 1 — Foundation

1. App shell and navigation
2. Authentication and permissions
3. Article list grid/list
4. Quick Create Article
5. Article Workspace shell
6. Product Brief
7. Reference management
8. Variant matrix
9. Size chart
10. BOM and supplier selection
11. Sampling
12. Costing
13. Tasks
14. Approvals
15. Activity history
16. Basic dashboard

### Phase 2 — Stabilization

1. Saved views
2. Kanban
3. Timeline
4. Notifications
5. Blocker workflow
6. Decision requests
7. Version compare
8. Readiness score
9. Schedule health
10. Workload monitoring
11. Clone article
12. Workflow templates

### Phase 3 — Professional Optimization

1. QC digital
2. Production readiness gate
3. Production batch monitoring
4. Launch calendar
5. Launch asset management
6. Product Development Pack
7. Supplier scorecard
8. HPP variance report
9. Capacity planning
10. Portfolio scoring
11. Analytics and KPI

---

## 46. Definition of Done

Satu feature dianggap selesai jika:

- UI mengikuti design system;
- loading, empty, error, dan permission state tersedia;
- desktop dan mobile behavior ditentukan;
- validation tersedia;
- audit event tercatat jika diperlukan;
- RLS dan authorization diuji;
- mutation memiliki error handling;
- accessibility dasar terpenuhi;
- unit atau integration test untuk business rule penting tersedia;
- tidak ada placeholder data pada production build;
- acceptance criteria feature terpenuhi.

---

## 47. Final Product Experience

Product Launch OS harus memberikan pengalaman berikut:

- Owner dapat terus memasukkan prospek artikel tanpa menghambat tim.
- Tim selalu mengetahui apa yang harus dikerjakan berikutnya.
- Setiap artikel memiliki target, PIC, status, dan dokumentasi yang jelas.
- Semua bahan, supplier, ukuran, biaya, sampel, dan QC terdokumentasi.
- Risiko terlihat sebelum mengganggu produksi dan launch.
- Keputusan tidak hilang dalam chat terpisah.
- Artikel dapat dibandingkan, diduplikasi, dilanjutkan, ditahan, dan diarsipkan.
- Sistem menjadi sumber pengetahuan perusahaan untuk pengembangan produk berikutnya.

