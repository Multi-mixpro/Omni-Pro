# System Design & UI/UX Specification — Product Launch OS 3.0

Panduan lengkap Design System, Design Tokens, Typography, Layout Rules, Color Palette, dan UX Patterns untuk **Product Launch OS 3.0** (Studio Operations & Apparel PLM).

---

## 1. Design Philosophy & Aesthetic Principles

**Product Launch OS 3.0** mengusung filosofi **Modern High-Density Studio Workspace**. Desain berfokus pada kejelasan data (*data legibility*), kecepatan navigasi operasional, serta pemanfaatan ruang visual secara efisien tanpa terasa sesak.

### Core Principles
1. **Clean High-Contrast Studio Canvas**: Menggunakan *light palette* netral slate dengan background `bg-slate-50`, kartu putih bersih `bg-white`, serta border krisp `border-slate-200`.
2. **Signature Teal Identity**: Warna identitas utama adalah **Deep Studio Teal (`#087E79`)** yang memberikan kesan profesional, tenang, dan modern.
3. **High Data Density**: Menampilkan metrik, tabel BOM, dan status operasional dalam tampilan padat (*compact*) namun tetap mudah dibaca.
4. **Contextual Status Tokens**: Indikator status dan kesehatan jadwal yang konsisten secara visual di seluruh modul (Green = On Track, Amber = At Risk, Rose = Overdue/Blocked).
5. **Monospace Precision**: Penggunaan font *monospace* untuk seluruh angka, mata uang IDR, kode artikel, persentase, dan tanggal target.

---

## 2. Design Tokens & Color System

### Primary & Accent Colors
- **Primary Teal**: `#087E79` (`bg-[#087E79]`, `text-[#087E79]`, `border-[#087E79]`)
- **Primary Teal Hover**: `#066864` (`hover:bg-[#066864]`)
- **Teal Light Soft**: `bg-teal-50` (`#F0FDFD`), `border-teal-200`, `text-teal-900`
- **Teal Accent Subdued**: `bg-teal-100/60`

### Neutral Palette (Slate System)
- **App Background**: `bg-slate-50` (`#F8FAFC`)
- **Surface / Card Background**: `bg-white` (`#FFFFFF`)
- **Secondary Surface / Table Header**: `bg-slate-100/90` (`#F1F5F9`)
- **Borders & Dividers**: `border-slate-200` (`#E2E8F0`)
- **Subtle Borders**: `border-slate-100` (`#F1F5F9`)
- **Body Text Dark**: `text-slate-900` (`#0F172A`)
- **Muted Text**: `text-slate-500` (`#64748B`)
- **Subtle Text**: `text-slate-400` (`#94A3B8`)

### Semantic Status Tokens
- **On Track / Success**:
  - Background: `bg-emerald-50`
  - Border: `border-emerald-200`
  - Text: `text-emerald-800`
  - Badge / Dot: `bg-emerald-600`
- **At Risk / Warning / Custom Price**:
  - Background: `bg-amber-50`
  - Border: `border-amber-200`
  - Text: `text-amber-800`
  - Badge / Dot: `bg-amber-600`
- **Overdue / Danger / Blocked**:
  - Background: `bg-rose-50`
  - Border: `border-rose-200`
  - Text: `text-rose-800`
  - Badge / Dot: `bg-rose-600`
- **In Development / Info**:
  - Background: `bg-indigo-50`
  - Border: `border-indigo-200`
  - Text: `text-indigo-800`
  - Badge / Dot: `bg-indigo-600`

---

## 3. Typography & Hierarchy

### Font Families
- **Display & UI Copy**: `Inter` / `Plus Jakarta Sans` / `system-ui` (`font-sans`)
- **Codes & Numeric Values**: `JetBrains Mono` / `Fira Code` / `ui-monospace` (`font-mono`)

### Scale & Hierarchy
| Level | Font Size | Weight | Tracking | Usage Examples |
| :--- | :--- | :--- | :--- | :--- |
| **H1 Header** | `18px - 20px` (`text-lg` / `text-xl`) | `800` (`font-extrabold`) | `tracking-tight` | Header Modul & Judul Halaman Utama |
| **H2 Section** | `14px - 16px` (`text-sm` / `text-base`) | `800` (`font-extrabold`) | `tracking-tight` | Header Sub-panel, Modal Title |
| **H3 Card** | `12px - 13px` (`text-xs`) | `800` (`font-extrabold`) | Normal | Nama Artikel, Judul Item BOM |
| **Body Copy** | `12px` (`text-xs`) | `500` / `600` | Normal | Deskripsi, Nilai Form, Teks Tabel |
| **Sub-label / Meta**| `10px - 11px` | `600` / `700` | `tracking-wide` | Eyebrow Label, Stage Badge, Tag PIC |
| **Numeric Code** | `11px - 12px` | `800` (`font-extrabold`) | `font-mono` | Kode `ART-101`, IDR Currency, HPP |

---

## 4. Component Layout Rules & Spacing Standards

### Border Radius Hierarchy
- **Primary Cards & Containers**: `rounded-2xl` (`16px`)
- **Sub-panels & Modals**: `rounded-xl` (`12px`)
- **Inputs, Buttons, & Table Badges**: `rounded-lg` (`8px`)
- **Status Pills & Chips**: `rounded-full` (`9999px`)

### Elevation & Shadows
- **Card Base**: `shadow-2xs` (`0 1px 2px 0 rgb(0 0 0 / 0.05)`)
- **Floating Modals & Drawers**: `shadow-2xl` (`0 25px 50px -12px rgb(0 0 0 / 0.25)`)

### Spacing Discipline
- **Outer Container Padding**: `p-4` / `p-6`
- **Internal Card Padding**: `p-3` / `p-3.5` / `p-4`
- **Grid Gap Standard**: `gap-2` untuk elemen rapat, `gap-3` / `gap-4` untuk section antar panel.
- **Button Padding**: Horizontal `px-3.5` / `px-4`, Vertical `py-1.5` / `py-2`.

---

## 5. Module UX Patterns

### A. Executive Dashboard
- **Layout**: Grid 4 kolom KPI Cards di atas, diikuti split panel 2 kolom (Stage Progress Bar + Milestone Alerts).
- **Interactive Triggers**: Quick BU filter tabs & tombol "+ Tambah Artikel".

### B. Implementation Workspace (Article Detail)
- **Top Bar Header**: Menampilkan Kode Artikel, Stage Badge, Schedule Health, PIC, serta Target Dates.
- **Multi-Tab Workspace**:
  - `General Specs & Tech Pack`: Form spesifikasi & PDF Viewer.
  - `Materials & Accessories (BOM)`:
    - Multi-select modal resep material.
    - Sinkronisasi otomatis dengan Data Master Supplier.
    - Toggle Lock/Unlock custom price.
    - Kalkulasi otomatis gross consumption & cost per product.
  - `Labor & Processing Cost`: Daftar ongkos potong, jahit, sablon, finishing, serta Rincian HPP Kalkulasi vs Target HPP.
  - `Sample Iteration Tracker`: Log Proto 1, Proto 2, Gold Sample dengan catatan & foto preview.
  - `Batch Production PO`: Pengelolaan PO batch produksi & slider progress operasi.

### C. Implementation Calendar
- **Layout**: High-density Month Grid (8 kolom) dipadukan dengan Split Side Inspector Panel (4 kolom).
- **Interaksi**: Mengklik tanggal mana pun di grid langsung menampilkan seluruh daftar milestone pada hari tersebut di panel samping tanpa menutup kalender.
- **View Switcher**: Toggle instan antara Grid Bulan, Gantt Timeline, dan Agenda List.

---

## 6. Mobile Responsiveness Standards

1. **Touch Targets**: Minimal 40px - 44px tinggi area sentuh untuk tombol navigasi mobile.
2. **Bottom Navigation Sheet**: Menyediakan Bottom Nav bar pada layar smartphone (`< md`) untuk akses cepat ke Dashboard, Article Pipeline, Implementation, Tasks, Calendar, dan Master Data.
3. **Horizontal Scrolling Tables**: Menggunakan `overflow-x-auto` pada tabel BOM dan Gantt Timeline agar tidak merusak layout layar kecil.
