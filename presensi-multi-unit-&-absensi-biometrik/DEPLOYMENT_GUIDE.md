# 🚀 Panduan Konfigurasi Deploy: GitHub, Vercel & Supabase

Dokumen ini berisi panduan langkah demi langkah untuk mengkonfigurasi dan mempublikasikan aplikasi **Unified Absensi Enterprise** ke **GitHub**, **Vercel**, dan **Supabase**.

---

## 1. 📦 Integrasi & Push ke GitHub

1. Inisialisasi Git repository di lokal komputer Anda (jika belum):
   ```bash
   git init
   git add .
   git commit -m "feat: Initial commit Unified Absensi Enterprise with Auth & Supabase"
   ```
2. Buat repository baru di [GitHub](https://github.com/new) (misal: `unified-absensi-enterprise`).
3. Hubungkan repository lokal Anda ke GitHub dan push kode:
   ```bash
   git remote add origin https://github.com/username/unified-absensi-enterprise.git
   git branch -M main
   git push -u origin main
   ```

---

## 2. 🗄️ Konfigurasi Database Supabase

1. Buka [Supabase Dashboard](https://database.new) dan buat project baru.
2. Masuk ke menu **SQL Editor** di bilah navigasi kiri.
3. Buka file `supabase_schema.sql` dari project ini, lalu salin (copy) seluruh isi kodenya.
4. Tempelkan (paste) ke **SQL Editor** Supabase, lalu klik **RUN**.
5. Salin URL dan Anon Key project Supabase Anda:
   - Buka **Project Settings** -> **API**.
   - Salin **Project URL** (contoh: `https://xyzcompany.supabase.co`).
   - Salin **`anon` `public` key**.

---

## 3. 🌐 Deploy ke Vercel

1. Buka [Vercel Dashboard](https://vercel.com/new) dan login dengan akun GitHub Anda.
2. Impor (Import) repository `unified-absensi-enterprise` dari GitHub.
3. Pada bagian **Framework Preset**, Vercel akan otomatis mendeteksi **Vite**.
4. Pada bagian **Environment Variables**, tambahkan dua variabel berikut:
   - `VITE_SUPABASE_URL` = (Project URL dari Supabase Anda)
   - `VITE_SUPABASE_ANON_KEY` = (Anon Public Key dari Supabase Anda)
5. Klik **Deploy**.
6. Aplikasi Anda akan selesai dalam kurun waktu 1-2 menit dan mendapatkan domain gratis (contoh: `https://unified-absensi.vercel.app`).

---

## 🔑 Kredensial Akses Login Sistem (Awal)

### A. Login Manager Admin / HQ Operator
- **Role**: Full Admin Access (Dashboard, Kelola Karyawan, Shift, Analitik, Security, Payroll API)
- **Username**: `admin` atau `manager`
- **Password**: `admin123`

### B. Login Absen Mandiri Karyawan (Portal Terpisah)
- **Role**: Karyawan Self-Service (Scan Wajah, Verifikasi Geofence GPS, Clock In / Clock Out, Riwayat Absen)
- **Karyawan 1 (GUDSKUY)**: Username `eko.prasetyo` | Password `absen123`
- **Karyawan 2 (GG Supply)**: Username `andi.pratama` | Password `absen123`
- **Karyawan 3 (Bakso Ujo)**: Username `chef.ujo` | Password `absen123`
