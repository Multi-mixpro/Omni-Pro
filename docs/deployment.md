# DEPLOYMENT — GG PRODUCT OS

**Versi:** 1.0  
**Status:** Draft Arsitektur  
**Prinsip:** Project mandiri, tidak ada hubungan dengan GarSys Pro atau project lain

---

## 1. INFRASTRUCTURE OVERVIEW

```mermaid
flowchart TD
    DEV[Developer Laptop] -->|git push| GH[GitHub Repository\ngg-product-os]
    GH -->|auto deploy| VERCEL[Vercel\nFrontend + API]
    GH -->|migrations| SB_PREV[Supabase Preview\nDatabase]
    GH -->|main branch| SB_PROD[Supabase Production\nDatabase]
    VERCEL -->|Anon Key| SB_PROD
    VERCEL -->|API Secret| CLD[Cloudinary\nMedia Storage]
    USERS[Tim Pengguna] -->|HTTPS| VERCEL

    style GH fill:#333,color:#fff
    style VERCEL fill:#000,color:#fff
    style SB_PREV fill:#3ecf8e,color:#fff
    style SB_PROD fill:#3ecf8e,color:#fff
    style CLD fill:#3448c5,color:#fff
```

**Stack infrastructure yang digunakan:**
- **GitHub**: Version control dan CI/CD trigger
- **Vercel**: Hosting frontend + serverless functions `/api/`
- **Supabase**: PostgreSQL, Auth, Realtime (opsional), Storage (dokumen)
- **Cloudinary**: Media visual (gambar, foto)
- **Sentry** *(optional production)*: Error monitoring frontend

---

## 2. ENVIRONMENT

| Environment | Frontend | Database | Branch | Tujuan |
|---|---|---|---|---|
| **Local Development** | `http://localhost:5173` | Supabase local (Docker) | `feature/*`, `fix/*` | Development harian |
| **Preview** | `https://gg-pos-xxx.vercel.app` | Supabase Preview Project | Setiap PR | Testing dan review |
| **Production** | `https://app.gg-product-os.com` | Supabase Production | `main` | Live pengguna |

---

## 3. ENVIRONMENT VARIABLES

### 3.1 Frontend Public (prefix `VITE_`)

> Aman di-expose ke browser karena tidak mengandung secret.

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=gg-product-os

# App
VITE_APP_ENV=local              # local | preview | production
VITE_APP_VERSION=1.0.0

# Feature Flags (override dari database jika tersedia)
VITE_ENABLE_PRODUCT_LAUNCH=true
VITE_ENABLE_CATALOG=true
VITE_ENABLE_ATTENDANCE=false
VITE_ENABLE_POS_SELLER=false
VITE_ENABLE_REALTIME=false
VITE_ENABLE_PWA=false
```

### 3.2 Server-only (TANPA prefix `VITE_`)

> **TIDAK BOLEH** di-expose ke browser. Hanya tersedia di serverless functions.

```env
# Supabase Service Role (untuk serverless functions)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cloudinary (API Key boleh di server, Secret HARUS di server saja)
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDINARY_UPLOAD_FOLDER=gg-product-os

# Sentry (production only)
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx
```

### 3.3 Perbedaan per Environment

| Variable | Local | Preview | Production |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `http://localhost:54321` | Preview Supabase URL | Prod Supabase URL |
| `VITE_APP_ENV` | `local` | `preview` | `production` |
| `VITE_ENABLE_ATTENDANCE` | `true` (untuk dev) | `false` | `false` |
| `VITE_ENABLE_POS_SELLER` | `true` (untuk dev) | `false` | `false` |

---

## 4. VERCEL CONFIGURATION

### 4.1 `vercel.json`

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "devCommand": "npm run dev",
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x",
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### 4.2 Preview Deployments

- Setiap push ke branch non-main → auto-deploy ke Vercel Preview URL
- Preview URL format: `https://gg-product-os-[branch]-[org].vercel.app`
- Preview deployments: **aktif** untuk semua PR
- Production deployment: **hanya** dari branch `main`

---

## 5. SUPABASE CLI WORKFLOW

### 5.1 Setup Awal

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Init Supabase di root project
supabase init

# Start local Supabase (Docker diperlukan)
supabase start

# Output:
# API URL: http://localhost:54321
# Studio URL: http://localhost:54323
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Anon Key: eyJ...
# Service Role Key: eyJ...
```

### 5.2 Migrations

```bash
# Buat migration baru
supabase migration new nama_migration
# → Membuat file: supabase/migrations/20260725000001_nama_migration.sql

# Test migration di local
supabase db reset
# → Menghapus semua data local dan menjalankan ulang semua migration + seed

# Apply migration ke Supabase remote (preview)
supabase link --project-ref [PREVIEW_PROJECT_REF]
supabase db push

# Generate types TypeScript dari database schema
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### 5.3 Seed Data

```bash
# Seed dijalankan otomatis saat supabase db reset
# File seed: supabase/seed.sql (atau supabase/seed/)

# Manual seed
supabase db execute --local -f supabase/seed/01_roles.sql
```

---

## 6. MIGRATION WORKFLOW

```mermaid
flowchart LR
    A[Tulis migration SQL\ndi supabase/migrations/] --> B[Test di local\nsupabase db reset]
    B --> C{Test berhasil?}
    C -->|Tidak| A
    C -->|Ya| D[Commit dan push ke branch feature]
    D --> E[PR ke main]
    E --> F[Review + apply ke Preview Supabase\nsupabase db push - preview]
    F --> G[Test di Preview deployment]
    G --> H{Preview OK?}
    H -->|Tidak| A
    H -->|Ya| I[Merge PR ke main]
    I --> J[Backup Production DB]
    J --> K[Apply ke Production Supabase\nsupabase db push - production]
    K --> L[Vercel auto-deploy dari main]
    L --> M[Smoke test di Production]
```

### Urutan Migration (Fase 1 — Fondasi)

```
supabase/migrations/
  20260101000001_core_profiles.sql
  20260101000002_core_roles.sql
  20260101000003_core_permissions.sql
  20260101000004_core_role_permissions.sql
  20260101000005_core_user_roles.sql
  20260101000006_core_user_permission_overrides.sql
  20260101000007_core_feature_flags.sql
  20260101000008_core_audit_logs.sql
  20260101000009_core_media_files.sql
  20260101000010_core_rls_policies.sql
  20260101000011_core_triggers.sql
  20260101000012_core_helper_functions.sql
```

### Urutan Migration (Fase 2 — Product Launch)

```
  20260201000001_launch_brands.sql
  20260201000002_launch_work_orders.sql
  20260201000003_launch_work_order_members.sql
  20260201000004_launch_stage_definitions.sql
  20260201000005_launch_stage_runs.sql
  20260201000006_launch_tasks.sql
  20260201000007_launch_stage_updates.sql
  20260201000008_launch_rls_policies.sql
```

---

## 7. CI/CD PIPELINE

### GitHub Actions (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Unit tests
        run: npm run test:unit
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.PREVIEW_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.PREVIEW_SUPABASE_ANON_KEY }}
          VITE_CLOUDINARY_CLOUD_NAME: ${{ secrets.CLOUDINARY_CLOUD_NAME }}
      
      - name: Check no secrets in build
        run: |
          if grep -r "SERVICE_ROLE_KEY\|API_SECRET" dist/; then
            echo "ERROR: Secret ditemukan di build output!"
            exit 1
          fi
  
  e2e:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: ${{ secrets.PREVIEW_URL }}
```

---

## 8. FEATURE FLAG MANAGEMENT

Feature flags dikelola di **dua lapisan**:

### Lapisan 1: Environment Variable (Build-time)

Dikontrol di Vercel Dashboard per environment:
```
VITE_ENABLE_ATTENDANCE=false
VITE_ENABLE_POS_SELLER=false
```

Digunakan untuk **menonaktifkan route** sepenuhnya (tidak memuat kode modul).

### Lapisan 2: Database `feature_flags` (Runtime)

```sql
SELECT * FROM feature_flags;
-- code           | is_enabled | description
-- ATTENDANCE     | false      | Modul absensi karyawan
-- POS_SELLER     | false      | Modul penjualan seller
-- REALTIME       | false      | Supabase Realtime updates
-- PWA            | false      | Progressive Web App
```

Digunakan untuk **toggle fitur** tanpa rebuild. Owner dapat mengubah dari `/settings/features`.

### Prioritas

Jika `VITE_ENABLE_ATTENDANCE=false` di env, flag database diabaikan — modul tidak akan dimuat.  
Jika `VITE_ENABLE_ATTENDANCE=true` di env, flag database menentukan apakah fitur aktif atau tidak.

---

## 9. ENVIRONMENT VALIDATION

### Saat Build

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_CLOUDINARY_CLOUD_NAME',
];

export default defineConfig({
  plugins: [
    {
      name: 'env-validator',
      buildStart() {
        const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
        if (missing.length > 0) {
          throw new Error(`Missing environment variables: ${missing.join(', ')}`);
        }
      },
    },
  ],
});
```

### Saat Runtime

```typescript
// src/app/config/env.ts
export function validateEnv() {
  const required = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  };

  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    document.body.innerHTML = `
      <div style="padding:2rem;font-family:monospace;color:red">
        <h1>Configuration Error</h1>
        <p>Missing environment variables:</p>
        <ul>${missing.map(v => `<li>${v}</li>`).join('')}</ul>
        <p>Hubungi administrator sistem.</p>
      </div>
    `;
    throw new Error(`Missing env: ${missing.join(', ')}`);
  }
}
```

---

## 10. ROLLBACK PROCEDURES

### Rollback Frontend (Vercel)

```bash
# Via Vercel CLI
vercel rollback [deployment-url]

# Via Dashboard: Vercel → Deployments → Pilih deployment lama → Promote to Production
```

Rollback Vercel bersifat **instant** — tidak ada downtime.

### Rollback Database

Database migration **tidak otomatis rollback**. Diperlukan down migration manual:

```bash
# Buat down migration
supabase migration new rollback_[nama_migration]

# Isi dengan SQL untuk membatalkan perubahan
# Contoh:
# DROP TABLE IF EXISTS launch_work_orders;
# ALTER TABLE profiles DROP COLUMN IF EXISTS department;

# Apply
supabase db push
```

> ⚠️ **Penting**: Selalu backup database sebelum apply migration ke production.

### Backup Sebelum Migration Production

```bash
# Backup menggunakan pg_dump via Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql --linked

# Atau via Supabase Dashboard: Settings → Database → Backups
```

---

## 11. BACKUP DAN RECOVERY

| Jenis | Frekuensi | Retensi | Metode |
|---|---|---|---|
| **Database otomatis** | Harian | 7 hari (Free), 30 hari (Pro) | Supabase built-in |
| **Pre-migration backup** | Sebelum setiap migration production | Manual / sampai aman | pg_dump via CLI |
| **Point-in-time recovery** | Continuous | 7 hari (Supabase Pro) | Supabase PITR |
| **Media Cloudinary** | Realtime | 30 hari version history | Cloudinary Pro |
| **Code** | Setiap commit | Selamanya | GitHub |

### Recovery Database

```bash
# Restore dari backup file
psql -h [DB_HOST] -U postgres -d postgres < backup_20260725_140000.sql

# Atau via Supabase Dashboard: Point-in-time recovery
```

---

## 12. ERROR MONITORING

### Sentry (Production)

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

if (import.meta.env.VITE_APP_ENV === 'production') {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

### Log Levels

| Environment | Console Log | Sentry | Audit DB |
|---|---|---|---|
| Local | Semua level | Tidak | Ya (jika relevan) |
| Preview | Warning + Error | Tidak | Ya |
| Production | Error only | Ya | Ya |

---

## 13. CHECKLIST DEPLOYMENT PRODUCTION

Sebelum deploy ke production, pastikan semua item berikut terpenuhi:

### Pre-deployment
- [ ] Semua migration sudah ditest di local dan preview
- [ ] Build sukses di CI tanpa error
- [ ] Semua unit test pass
- [ ] E2E test happy path pass di preview environment
- [ ] Tidak ada secret di build output (`grep -r "SERVICE_ROLE_KEY" dist/`)
- [ ] Environment variables production sudah diset di Vercel
- [ ] Backup production database sudah dilakukan

### Migration
- [ ] Migration sudah diapply ke preview Supabase dan ditest
- [ ] Migration sudah diapply ke production Supabase
- [ ] Seed data baru sudah diapply jika diperlukan
- [ ] RLS policies sudah diverifikasi

### Post-deployment
- [ ] Smoke test: login berhasil
- [ ] Smoke test: buat work order
- [ ] Smoke test: feature flags berfungsi
- [ ] Error rate di Vercel/Sentry normal
- [ ] Tidak ada error di Supabase logs

---

## 14. SETUP AWAL (STEP BY STEP)

```bash
# 1. Buat repository GitHub baru
gh repo create gg-product-os --private

# 2. Clone
git clone https://github.com/[org]/gg-product-os.git
cd gg-product-os

# 3. Init project (setelah scaffold)
npm install

# 4. Setup Supabase
supabase init
supabase start  # Start local instance

# 5. Copy env template
cp .env.example .env.local
# Edit .env.local dengan nilai dari supabase start output

# 6. Run migrations
supabase db reset

# 7. Link ke Supabase remote (setelah buat project di supabase.com)
supabase link --project-ref [PROJECT_REF]
supabase db push

# 8. Setup Vercel
vercel link  # Link project ke Vercel
vercel env pull .env.local  # Sinkronisasi env vars

# 9. Deploy
git push origin main  # Auto-deploy via Vercel
```

---

*Akhir dokumen deployment.md*
