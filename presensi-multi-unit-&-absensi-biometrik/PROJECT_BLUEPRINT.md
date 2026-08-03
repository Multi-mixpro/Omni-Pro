# Blueprint Project: Unified Absensi Multi-Unit & Biometric Geofence

Blueprint ini dibuat secara khusus untuk mempermudah kelanjutan pengembangan aplikasi presensi enterprise di **Claude Code Editor** atau lingkungan lokal (VS Code + Claude Code CLI / Cursor).

---

## 1. Overview & Core Features Implemented

1. **Full-Edge Modern Theme & Layout Architecture**
   - Mendukung **Light Mode** & **Dark Mode** secara konsisten di seluruh halaman (`LoginPage`, `EmployeeAttendancePortal`, `MonitoringDashboard`, `EmployeeManagementView`, dsb.).
   - Bebas dari *outer container padding / background frame border* yang mengurung halaman (Layout kini **full 100% viewport edge-to-edge**).

2. **Konsistensi Branding Unit**:
   - Nama bisnis warehoushub diubah dari `Gdskuy` menjadi **`GUDSKUY`** di seluruh mock data, file SQL Supabase (`supabase_schema.sql`), dan panduan dokumentasi.

3. **Pengintegrasian WhatsApp Notif & Direct Chat (`wa.me`)**:
   - Modul helper terisolasi di `/src/utils/whatsapp.ts`.
   - Mengubah nomor telepon Indonesia (`08xxx`, `+62xxx`, `628xxx`) secara otomatis menjadi format internasional tanpa simbol (`628xxx`).
   - Tombol **Notif WA / Chat WA** langsung membuka browser/aplikasi WhatsApp melalui URL standard `https://wa.me/628xxx?text=...`.
   - Terintegrasi di:
     - **Monitoring Dashboard**: Tombol **Notif WA** untuk mengirimkan alert keterlambatan/absen karyawan.
     - **Manajemen Karyawan**: Badge nomor WhatsApp karyawan yang dapat diklik langsung.
     - **Detail Modal Karyawan**: Link langsung `WA: 08xxx`.
     - **Portal Karyawan**: Tombol `WA Manager` untuk menghubungi Manager unit langsung.
     - **Pengaturan Unit Business**: Link `Chat WA Manager` pada field input handphone.

---

## 2. Structure Blueprint File Directory

```
├── CLAUDE_CODE_BLUEPRINT.md       # Document Panduan Pengembangan (File Ini)
├── DEPLOYMENT_GUIDE.md           # Panduan Deployment & Credentials Demo
├── supabase_schema.sql            # Schema PostgreSQL / Supabase lengkap dengan data unit & karyawan
├── package.json                   # Dependencies (React 18, Vite, TailwindCSS v4, Lucide React, XLSX)
├── src/
│   ├── App.tsx                    # Controller Utama (State Theme, Switcher Tab Dashboard/Portal)
│   ├── types.ts                   # Standard Data Types (Employee, BusinessUnit, Shift, AttendanceRecord)
│   ├── utils/
│   │   └── whatsapp.ts            # Utility Format & Template Pesan WhatsApp wa.me
│   ├── data/
│   │   └── mockData.ts            # Mock Data (Unit GUDSKUY, GG Supply, Bakso Ujo, Data Karyawan)
│   └── components/
│       ├── LoginPage.tsx                  # Login Role Switcher (Karyawan & Manager HQ)
│       ├── EmployeeAttendancePortal.tsx   # Portal Self-Service Absen Karyawan
│       ├── MonitoringDashboard.tsx        # Dashboard Executive Manager HQ
│       ├── EmployeeManagementView.tsx     # Manajemen Data Karyawan & Notif WA
│       ├── EmployeeDetailModal.tsx        # Modal Detail Karyawan & Export Presensi
│       ├── UnitConfigurationModal.tsx     # Configuration Radius Geofence & Unit Info
│       ├── GeofenceMapModal.tsx           # Visualisasi Peta Geofence Radius
│       ├── ShiftScheduleView.tsx          # Manajemen Shift Kerja
│       ├── AuditLogView.tsx               # Log Audit Keamanan Biometrik & Sistem
│       └── Topbar.tsx                     # Navigation Topbar & Switcher Theme
```

---

## 3. WhatsApp Integration Blueprint (`/src/utils/whatsapp.ts`)

```typescript
export function formatToWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = '62' + digits.substring(1);
  } else if (digits.startsWith('8')) {
    digits = '62' + digits;
  }
  return digits;
}

export function getWhatsAppLink(phone: string, text?: string): string {
  const formattedPhone = formatToWhatsAppNumber(phone);
  if (!formattedPhone) return '#';
  const baseUrl = `https://wa.me/${formattedPhone}`;
  return text ? `${baseUrl}?text=${encodeURIComponent(text)}` : baseUrl;
}
```

---

## 4. Cara Menjalankan Project di Claude Code / Local Machine

1. **Clone / Export Project**:
   Unduh source code dari menu *Export to GitHub / ZIP* di AI Studio.

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Menjalankan Development Server**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

4. **Build untuk Produksi**:
   ```bash
   npm run build
   ```

5. **Deploy Database (Supabase / PostgreSQL)**:
   Gunakan script `supabase_schema.sql` untuk langsung membangun tabel `business_units`, `employees`, `shifts`, dan `attendance_records` beserta RLS policies.

---

## 5. Kredensial Demo Cepat

- **Dashboard Manager HQ**: Username `admin` | Password `admin123`
- **Karyawan 1 (GUDSKUY)**: Username `eko.prasetyo` | Password `absen123`
- **Karyawan 2 (GG Supply)**: Username `andi.pratama` | Password `absen123`
- **Karyawan 3 (Bakso Ujo)**: Username `chef.ujo` | Password `absen123`
