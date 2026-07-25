# UI/UX — GG PRODUCT OS

**Versi:** 1.0  
**Status:** Draft Arsitektur  
**Prinsip:** Profesional · Ringan · Responsif · Tidak membebani tim produksi

---

## 1. PRINSIP DESAIN

### 1.1 Filosofi Utama

1. **Informasi penting terlihat tanpa membuka banyak modal** — status, deadline, blocker harus terlihat di tampilan daftar
2. **Progressive disclosure** — tampilkan field dasar dulu, detail dapat dibuka jika diperlukan
3. **Form panjang dibagi tab atau step** — jangan tampilkan 20 field sekaligus
4. **Tindakan berikutnya selalu jelas** — user harus tahu apa yang harus dilakukan selanjutnya
5. **Status menggunakan label DAN warna** — warna bukan satu-satunya penanda (aksesbilitas)
6. **Mobile-first untuk Attendance dan POS** — keyboard besar, touch target 44px minimum
7. **Desktop-optimized untuk HPP, Size Chart, Owner Monitor** — tabel lebar, multi-column

### 1.2 State yang Wajib Tersedia

Setiap halaman **wajib** menangani:

| State | Deskripsi | Implementasi |
|---|---|---|
| `loading` | Data sedang dimuat | Skeleton sesuai layout |
| `empty` | Tidak ada data | Ilustrasi + pesan + action button |
| `error` | Request gagal | Pesan error + tombol retry |
| `permission_denied` | Tidak punya akses | Halaman blocked state |
| `offline` | Koneksi terputus | Banner notifikasi + cached data |
| `unsaved_changes` | Ada perubahan belum disimpan | Konfirmasi sebelum navigasi |

---

## 2. DESIGN SYSTEM

### 2.1 Tipografi

```css
/* Google Fonts: Inter */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace; /* untuk kode artikel */
```

### 2.2 Color System

```css
/* Neutral */
--color-gray-50:  #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-400: #9ca3af;
--color-gray-600: #4b5563;
--color-gray-800: #1f2937;
--color-gray-900: #111827;

/* Brand */
--color-primary-500: #3b82f6;   /* Biru utama */
--color-primary-600: #2563eb;
--color-primary-700: #1d4ed8;

/* Status Colors */
--color-draft:      #9ca3af;   /* abu */
--color-active:     #3b82f6;   /* biru */
--color-on-hold:    #f59e0b;   /* oranye */
--color-in-review:  #8b5cf6;   /* ungu */
--color-approved:   #10b981;   /* hijau */
--color-published:  #059669;   /* hijau tua */
--color-blocked:    #ef4444;   /* merah */
--color-cancelled:  #6b7280;   /* abu gelap */
--color-completed:  #10b981;   /* hijau */
--color-waiting:    #f59e0b;   /* kuning */
```

### 2.3 Status Badge Mapping

| Status | Label | Warna | Ikon |
|---|---|---|---|
| DRAFT | Draft | Abu | ⚪ |
| ACTIVE | Aktif | Biru | 🔵 |
| ON_HOLD | Ditunda | Oranye | 🟠 |
| IN_REVIEW | Review | Ungu | 🟣 |
| APPROVED | Disetujui | Hijau | ✅ |
| PUBLISHED | Published | Hijau Tua | 🚀 |
| BLOCKED | Terhambat | Merah | 🔴 |
| CANCELLED | Dibatalkan | Abu Gelap | ⚫ |
| NOT_STARTED | Belum Mulai | Abu | ⚪ |
| IN_PROGRESS | Sedang Berjalan | Biru | 🔵 |
| WAITING_MATERIAL | Menunggu Bahan | Kuning | 🟡 |
| WAITING_DECISION | Menunggu Keputusan | Kuning | 🟡 |
| REVISION_REQUIRED | Perlu Revisi | Oranye | 🟠 |
| COMPLETED | Selesai | Hijau | ✅ |

---

## 3. APP SHELL LAYOUT

### 3.1 Desktop Layout

```
╔══════════════════════════════════════════════════════════════════╗
║ SIDEBAR (240px)     ║ TOPBAR                                     ║
║                     ║─────────────────────────────────────────── ║
║ 🏠 Dashboard        ║ Breadcrumb > Perintah Kerja                 ║
║                     ║                         [🔔] [Gugun ▾]     ║
║ ▼ Product Launch    ║═══════════════════════════════════════════ ║
║   Perintah Kerja    ║                                             ║
║   Kelola & Pantau   ║  CONTENT AREA (max-width: 1280px, centered) ║
║   Supplier & Bahan  ║                                             ║
║   Sampling          ║                                             ║
║   HPP               ║                                             ║
║   Size Chart        ║                                             ║
║   QC                ║                                             ║
║   Laporan           ║                                             ║
║                     ║                                             ║
║ ▼ Catalog           ║                                             ║
║   Produk            ║                                             ║
║                     ║                                             ║
║ Pengaturan          ║                                             ║
║                     ║                                             ║
║ [≡ Collapse]        ║                                             ║
╚══════════════════════════════════════════════════════════════════╝
```

**Perilaku sidebar:**
- Default: expanded (240px)
- Collapsed: icon only (64px)
- Mobile: hidden, drawer toggle via hamburger
- State tersimpan di localStorage (preferensi UI, bukan data)

### 3.2 Mobile Layout

```
╔══════════════════════════════════════╗
║ ☰  GG Product OS          🔔  👤   ║
╠══════════════════════════════════════╣
║                                      ║
║  CONTENT AREA (full width)           ║
║                                      ║
║                                      ║
║                                      ║
║                                      ║
║                                      ║
║                                      ║
║                                      ║
╠══════════════════════════════════════╣
║  🏠        📋        📁        ⚙️   ║
║ Dashboard Perintah Catalog  Setting ║
╚══════════════════════════════════════╝
```

---

## 4. HALAMAN — WIREFRAME TEKSTUAL

### 4.1 Login

```
╔══════════════════════════════════════════════════╗
║                                                  ║
║           🎯 GG Product OS                       ║
║       Sistem Operasional Produk GG               ║
║                                                  ║
║  ┌─────────────────────────────────────────┐    ║
║  │  Email                                  │    ║
║  │  [___________________________________]  │    ║
║  │                                         │    ║
║  │  Password                               │    ║
║  │  [___________________________________]  │    ║
║  │                                         │    ║
║  │  [        Masuk        ]               │    ║
║  │                                         │    ║
║  │  ⚠️  Akun belum aktif? Hubungi Owner.  │    ║
║  └─────────────────────────────────────────┘    ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

### 4.2 Dashboard (Desktop — Owner)

```
╔═══════════════════════════════════════════════════════════════════╗
║  📊 Dashboard                         Jumat, 25 Juli 2026         ║
╠═══════════════════════════════════════════════════════════════════╣
║  [Total Artikel: 24]  [Aktif: 12]  [Overdue: 3]  [Review: 2]     ║
║  [GG Supply: 14]      [GUDSKUY: 10]  [Published: 8]               ║
╠═════════════════════════════════╦═════════════════════════════════╣
║  ⚠️ PERLU PERHATIAN             ║  📋 AKTIVITAS TIM TERBARU       ║
║ ─────────────────────────────── ║ ─────────────────────────────── ║
║  🔴 [GGS-003] Blocked 3 hari   ║  Dodi — HPP v2 difinalisasi     ║
║  🟡 [GDK-007] Waiting review   ║  Yadi — Sample GDK-002 approved  ║
║  🟠 [GGS-001] Overdue 2 hari   ║  Syaikhu — Supplier baru ditambah║
║  🔴 [GDK-004] Supplier belum fix║  Dodi — Material GGS-005 selected║
╠═════════════════════════════════╩═════════════════════════════════╣
║  📈 PROGRESS PER BRAND                                             ║
║ ──────────────────────────────────────────────────────────────── ║
║  GG Supply   ████████████████░░░░  78%  (11/14 stage aktif selesai)║
║  GUDSKUY     ██████████░░░░░░░░░░  52%  (5/10 stage aktif selesai) ║
╚═══════════════════════════════════════════════════════════════════╝
```

### 4.3 Dashboard (Mobile — Tim)

```
╔══════════════════════════╗
║ Dashboard     🔔  👤     ║
╠══════════════════════════╣
║ 👋 Halo, Dodi            ║
╠══════════════════════════╣
║ [Task Saya: 5] [Overdue]  ║
╠══════════════════════════╣
║ 📋 TASK HARI INI         ║
║ ─────────────────────── ║
║ 🔵 Finalize HPP GGS-003  ║
║    Due: hari ini  [→]    ║
║ ─────────────────────── ║
║ 🟠 Riset material hoodie  ║
║    Due: besok     [→]    ║
║ ─────────────────────── ║
║ ⚪ Konfirmasi supplier    ║
║    Due: Senin     [→]    ║
╚══════════════════════════╝
```

### 4.4 Perintah Kerja (Desktop — Kanban)

```
╔═══════════════════════════════════════════════════════════════════╗
║ Perintah Kerja    [+ Buat Baru]    [Kanban] [Tabel] [List]        ║
║ Filter: Brand[Semua▾] Stage[Semua▾] PIC[Semua▾] Status[Semua▾]   ║
╠═══════════════════╦═══════════════════╦═══════════════════════════╣
║ BRIEF             ║ MATERIAL          ║ SUPPLIER                   ║
║ ─────────────── ║ ─────────────── ║ ─────────────────────────  ║
║ ┌─────────────┐  ║ ┌─────────────┐  ║ ┌─────────────────────┐   ║
║ │GGS-005      │  ║ │GDK-002      │  ║ │GGS-003              │   ║
║ │Kaos Oversize│  ║ │Hoodie Street│  ║ │Polo Shirt Corp      │   ║
║ │🔵 IN_PROGRESS│ ║ │🟡 WAITING   │  ║ │🔴 BLOCKED           │   ║
║ │PIC: Dodi    │  ║ │PIC: Dodi    │  ║ │PIC: Syaikhu         │   ║
║ │Due: 30 Jul  │  ║ │2 hari lagi  │  ║ │OVERDUE 3 hari       │   ║
║ │[⚡ Update]  │  ║ │[⚡ Update]  │  ║ │[⚡ Update]          │   ║
║ └─────────────┘  ║ └─────────────┘  ║ └─────────────────────┘   ║
╚═══════════════════╩═══════════════════╩═══════════════════════════╝
```

### 4.5 Detail Artikel — Header dan Tab Navigation

```
╔═══════════════════════════════════════════════════════════════════╗
║ ← Perintah Kerja                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║  [GG Supply] GGS-003 · Polo Shirt Corporate                       ║
║  🔵 ACTIVE  ████████████░░░░░░░  62%  PIC: Syaikhu               ║
║  Target: 15 Agustus 2026  Priority: HIGH                          ║
║  [Request Review] [Edit] [Batalkan]                                ║
╠═══════════════════════════════════════════════════════════════════╣
║ Overview │ Workflow │ Task │ Material │ Supplier │ Warna │ Sampling│
║ HPP │ Size Chart │ QC │ Media │ Activity Log                       ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  TAB CONTENT                                                       ║
║                                                                    ║
╚═══════════════════════════════════════════════════════════════════╝
```

### 4.6 HPP Form (Desktop)

```
╔═══════════════════════════════════════════════════════════════════╗
║ HPP · GGS-003 Polo Shirt Corporate                                 ║
║ Version: v2 (DRAFT)  [Compare v1] [Finalize HPP]                  ║
╠═══════════════════════════════════════════════════════════════════╣
║ Kategori   │ Item           │ Qty │ Satuan │ Harga/unit │ Total    ║
╠════════════╪════════════════╪═════╪════════╪════════════╪══════════╣
║ FABRIC     │ Cotton 30s     │ 1.2 │ meter  │ 45,000     │ 54,000   ║
║ ACCESSORY  │ Kancing        │ 10  │ pcs    │  2,000     │ 20,000   ║
║ PRINTING   │ Sablon dada    │ 1   │ pcs    │ 15,000     │ 15,000   ║
║ SEWING     │ CMT            │ 1   │ pcs    │ 25,000     │ 25,000   ║
║ [+ Tambah item]                                                    ║
╠══════════════════════════════════════════════════════════════════╣
║                          Direct Cost Total:  Rp 114,000           ║
║  Reject    [  3  ]%      Reject Cost:         Rp   3,420          ║
║  Overhead  [ 15  ]%      Overhead Cost:       Rp  17,613          ║
║  ─────────────────────────────────────────────────────────────   ║
║  HPP Total:                                   Rp 135,033          ║
║  Target Margin [ 35 ]%   Harga Jual:          Rp 207,743          ║
╚═══════════════════════════════════════════════════════════════════╝
```

### 4.7 Sampling — Version Timeline

```
╔══════════════════════════════════════════════════════════╗
║ Sampling · GGS-003  [+ Buat Versi Baru]                   ║
╠══════════════════════════════════════════════════════════╣
║  ●─────────────────●─────────────────●                    ║
║  v1 REVISION       v2 APPROVED       v3 MASTER ✅          ║
║  15 Jun            25 Jun            10 Jul               ║
║  [Lihat detail]    [Lihat detail]    [Lihat detail]       ║
╠══════════════════════════════════════════════════════════╣
║  DETAIL v3 (Master Sample)                                 ║
║  ─────────────────────────────────────────────────────   ║
║  [📸 Foto depan]  [📸 Foto belakang]  [📸 Detail jahitan] ║
║                                                            ║
║  Material: Cotton 30s, Kancing resin hitam                 ║
║  Pola: A0-GGS-003-v3                                       ║
║  Hasil: PASSED - Semua measurement dalam toleransi         ║
║                                                            ║
║  Pengukuran:                                               ║
║  Lingkar dada: 100cm (target: 100±1cm) ✅                  ║
║  Panjang badan: 72cm  (target: 72±1cm) ✅                   ║
║  Lingkar leher: 42cm  (target: 42±1cm) ✅                   ║
╚══════════════════════════════════════════════════════════╝
```

---

## 5. DETAIL TAB — DETAIL ARTIKEL (12 Tab)

### Tab 1: Overview
- Informasi dasar: brand, kode, nama, kategori, tujuan, target pasar
- Progress bar keseluruhan
- PIC dan tim
- Deadline dan priority
- Foto hero (referensi)
- Deskripsi artikel
- Link referensi

### Tab 2: Workflow
- Timeline 8 tahap dengan status masing-masing
- Stage aktif disorot
- Tanggal mulai dan selesai per stage
- Assignee per stage
- Blocker dan revision notes jika ada

### Tab 3: Task
- Daftar task per stage
- Status, assignee, deadline per task
- [+ Tambah Task] button
- Filter: stage, status, assignee
- Subtask dependency visible

### Tab 4: Material
- Daftar kandidat material
- Status per material (CANDIDATE/SELECTED/REJECTED)
- Detail: komposisi, GSM, lebar, estimasi konsumsi
- Foto swatch per material
- [+ Tambah Material] button
- Perbandingan material jika lebih dari 1

### Tab 5: Supplier
- Daftar supplier yang dilibatkan
- Quote per supplier: item, harga, MOQ, lead time, status
- [Approve] / [Reject] per quote
- [+ Tambah Supplier/Quote] button
- Filter: status quote

### Tab 6: Warna
- Grid swatch warna
- Kode internal dan supplier per warna
- Status: final atau belum
- Panel scope
- [+ Tambah Warna] button
- [Finalize Warna] jika minimal 1 warna siap

### Tab 7: Sampling
- Version timeline (lihat wireframe 4.7)
- Foto per versi
- Measurement hasil sampling
- Status per versi
- Revision notes
- [+ Versi Baru] / [Approve Master]

### Tab 8: HPP
- Dropdown pilih versi
- Tabel line item (lihat wireframe 4.6)
- Formula HPP real-time
- [Compare versi] untuk lihat perubahan
- [Finalize] untuk mengunci versi

### Tab 9: Size Chart
- Dropdown pilih versi
- Tabel dinamis: kolom = ukuran, baris = titik ukur
- Nilai + toleransi per cell
- Diagram titik ukur (foto/ilustrasi)
- [Tambah Ukuran] / [Tambah Titik Ukur]
- [Finalize] untuk mengunci

### Tab 10: QC
- Pilih QC template
- Checklist per item: ✅ PASS / ❌ FAIL / — N/A
- Item required ditandai (*)
- Catatan per item
- Progress: X/Y required items passed
- [Approve QC] jika semua required PASS

### Tab 11: Media
- Grid semua foto terkait artikel (dari semua tahap)
- Filter: kategori (reference, material, sample, qc, catalog)
- Upload foto baru
- Hapus foto
- Preview modal

### Tab 12: Activity Log
- Timeline kronologis semua perubahan
- Filter: tipe aksi, tanggal, user
- Format: [Waktu] [User] [Aksi] — contoh: "10 Jul 14:30 · Yadi · Sample v3 diapprove sebagai Master Sample"

---

## 6. KOMPONEN SHARED

### 6.1 StatusBadge

```typescript
// Contoh penggunaan
<StatusBadge status="BLOCKED" />
// → Badge merah dengan teks "Terhambat" dan ikon 🔴
// → Tooltip: status lengkap

// Properti
interface StatusBadgeProps {
  status: WorkOrderStatus | StageStatus | TaskStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}
```

### 6.2 ProgressBar

```typescript
<ProgressBar value={62} max={100} color="blue" label="62% selesai" />
```

### 6.3 EmptyState

```typescript
<EmptyState
  icon="📋"
  title="Belum ada perintah kerja"
  description="Buat perintah kerja pertama untuk memulai."
  action={{ label: "Buat Perintah Kerja", onClick: handleCreate }}
/>
```

### 6.4 PermissionDenied

```typescript
<PermissionDenied
  permission="launch.work_order.view_all"
  message="Anda tidak memiliki akses ke halaman ini."
/>
// → Tampil full-page dengan ikon kunci dan pesan
```

### 6.5 VersionSelector

```typescript
<VersionSelector
  versions={hppVersions}
  selectedId={selectedVersionId}
  onChange={setSelectedVersionId}
  renderLabel={(v) => `v${v.version_no} · ${v.status} · ${formatDate(v.created_at)}`}
/>
```

### 6.6 ConfirmDialog

```typescript
<ConfirmDialog
  open={showConfirm}
  title="Finalisasi HPP?"
  description="HPP yang sudah difinalisasi tidak dapat diubah. Revisi akan membuat versi baru."
  confirmLabel="Finalisasi"
  confirmVariant="danger"
  onConfirm={handleFinalize}
  onCancel={() => setShowConfirm(false)}
/>
```

---

## 7. NAVIGASI PER ROLE

### Owner
Semua menu aktif:
- Dashboard (full metrics)
- Product Launch (semua submenu)
- Catalog
- Attendance (jika flag ON)
- POS Seller (jika flag ON)
- Pengaturan (semua submenu)

### Product Lead (Dodi)
- Dashboard (task sendiri + overview)
- Product Launch: Perintah Kerja (assigned), Supplier & Bahan, HPP, Laporan
- Catalog: readonly

### Production Lead (Yadi)
- Dashboard (task sendiri)
- Product Launch: Perintah Kerja (assigned), Sampling, Size Chart, QC

### Sourcing Admin (Syaikhu)
- Dashboard (task sendiri)
- Product Launch: Perintah Kerja (assigned), Supplier & Bahan

### Creative
- Dashboard (task sendiri)
- Product Launch: Perintah Kerja (assigned), Sampling (view foto)

### QC
- Dashboard (task sendiri)
- Product Launch: QC, Sampling (view)

### Seller (jika flag ON)
- POS Seller: Jual, Pesanan, Shift, Pelanggan, Laporan

---

## 8. MOBILE-SPECIFIC CONSIDERATIONS

- **Touch target**: minimal 44×44px untuk semua interactive element
- **Tabel → Card**: tabel data dikonversi ke card list di layar < 768px
- **Bottom sheet**: modal dan dropdown menggunakan bottom sheet di mobile
- **Swipe gestures**: swipe untuk dismiss card, swipe pada kanban board
- **Font size minimum**: 16px untuk input (mencegah auto-zoom iOS)
- **Horizontal scroll**: hanya diizinkan untuk size chart matrix dan HPP table
- **Foto upload**: langsung dari kamera atau galeri
- **Offline indicator**: banner merah jika koneksi terputus

---

## 9. HALAMAN PENGATURAN

### /settings/users — Pengguna

```
╔══════════════════════════════════════════════════════════╗
║ Pengguna  [+ Undang Pengguna]                             ║
╠══════════════════════════════════════════════════════════╣
║ Cari: [_____________]                                      ║
╠══════════════════════════════════════════════════════════╣
║ Avatar  Nama          Role           Status   Aksi        ║
║ ──────  ─────────     ─────────────  ───────  ─────────  ║
║ [GG]    Gugun         Owner          🟢 Aktif  [Edit]     ║
║ [DD]    Dodi          Product Lead   🟢 Aktif  [Edit]     ║
║ [YD]    Yadi          Production Lead🟢 Aktif  [Edit]     ║
║ [SK]    Syaikhu       Sourcing Admin 🟢 Aktif  [Edit]     ║
╚══════════════════════════════════════════════════════════╝
```

### /settings/features — Feature Flag

```
╔══════════════════════════════════════════════════════════╗
║ Feature Flags                                             ║
╠══════════════════════════════════════════════════════════╣
║ PRODUCT_LAUNCH  Aktifkan modul Product Launch  [ON ●]    ║
║ CATALOG         Aktifkan modul Katalog          [ON ●]    ║
║ ATTENDANCE      Aktifkan modul Attendance       [OFF ○]   ║
║ POS_SELLER      Aktifkan modul POS Seller       [OFF ○]   ║
║ REALTIME        Aktifkan Realtime Updates        [OFF ○]   ║
║ PWA             Aktifkan PWA / Offline Mode      [OFF ○]   ║
╚══════════════════════════════════════════════════════════╝
```

---

## 10. LOADING DAN ERROR STATES

### Loading Skeleton (Contoh Dashboard)

```
╔══════════════════════════════════════════════════╗
║ ░░░░░░░░░░░░░░░░  ░░░░░░░░  ░░░░░░░  ░░░░░░░░   ║
╠══════════════════════════════════════════════════╣
║ ░░░░░░░░░░░░░░░░░░░░░░░      ░░░░░░░░░░░░░░░░░░ ║
║ ░░░░░░░░░░░░░░░░░░░░         ░░░░░░░░░░░░░░░░░░ ║
║ ░░░░░░░░░░░░░░░░             ░░░░░░░░░░░░░░░░░░ ║
╚══════════════════════════════════════════════════╝
// Skeleton menggunakan animasi pulse (CSS)
```

### Error State

```
╔══════════════════════════════════════════════════╗
║                                                   ║
║          ⚠️ Terjadi Kesalahan                    ║
║   Gagal memuat data. Periksa koneksi internet.   ║
║                                                   ║
║            [Coba Lagi]                            ║
║                                                   ║
╚══════════════════════════════════════════════════╝
```

### Permission Denied State

```
╔══════════════════════════════════════════════════╗
║                                                   ║
║              🔒 Akses Dibatasi                   ║
║   Anda tidak memiliki izin untuk halaman ini.    ║
║   Hubungi Owner untuk meminta akses.             ║
║                                                   ║
║            [← Kembali ke Dashboard]              ║
║                                                   ║
╚══════════════════════════════════════════════════╝
```

---

*Akhir dokumen ui-ux.md*
