# TESTING PLAN — GG PRODUCT OS

**Versi:** 1.0  
**Status:** Draft Arsitektur  
**Stack Testing:** Vitest · React Testing Library · Playwright · Supabase Local

---

## 1. FILOSOFI TESTING

### 1.1 Piramida Testing

```
        ┌─────────────┐
        │    E2E      │  ← Playwright: sedikit, high-value
        │   Tests     │
       ┌─┴─────────────┴─┐
       │  Integration    │  ← Supabase local: happy path + RLS
       │     Tests       │
      ┌─┴─────────────────┴─┐
      │     Unit Tests      │  ← Vitest: banyak, cepat, domain logic
      └─────────────────────┘
```

### 1.2 Prinsip

1. **Test behavior, bukan implementation** — test apa yang terjadi, bukan bagaimana caranya
2. **Domain logic wajib ditest** — HPP formula, workflow gate, permission resolver: coverage 80%+
3. **RLS harus ditest di database nyata** — bukan di mock, karena mock bisa gagal menangkap bug RLS
4. **E2E test untuk alur kritis** — login → buat WO → complete → publish
5. **Test berhasil = siap deploy** — tidak ada manual "quick check" untuk alur yang sudah ada E2E-nya

### 1.3 Coverage Target

| Layer | Target Coverage | Keterangan |
|---|---|---|
| Domain (HPP, gate, permission) | **80%** | Wajib pass sebelum merge |
| Service layer | **60%** | Happy path + error handling |
| UI components | **40%** | Hanya komponen kritis |
| E2E happy path | **100%** | Semua alur utama tercakup |

---

## 2. TESTING STACK SETUP

### 2.1 Vitest + React Testing Library

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/modules/*/domain/**', 'src/core/permissions/**'],
      thresholds: {
        functions: 80,
        branches: 80,
        lines: 80,
      },
    },
  },
});
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase client
vi.mock('src/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));
```

### 2.2 Playwright

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'src/test/e2e',
  timeout: 30_000,
  retries: 2,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { channel: 'chrome' } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
});
```

### 2.3 Script npm

```json
// package.json scripts
{
  "test:unit": "vitest run",
  "test:unit:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:all": "npm run test:unit && npm run test:e2e"
}
```

---

## 3. UNIT TESTS: DOMAIN LAYER

### 3.1 HPP Calculation

**File:** `src/modules/launch/domain/hpp.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateDirectCost,
  calculateRejectCost,
  calculateOverheadCost,
  calculateHpp,
  calculateSuggestedPrice,
  validateHppInputs,
} from './hpp';

describe('HPP Calculation', () => {
  const sampleItems = [
    { category: 'FABRIC', total_cost: 54000 },
    { category: 'SEWING', total_cost: 25000 },
    { category: 'ACCESSORY', total_cost: 10000 },
  ];

  describe('calculateDirectCost', () => {
    it('menjumlahkan semua item cost', () => {
      expect(calculateDirectCost(sampleItems)).toBe(89000);
    });
    it('mengembalikan 0 jika tidak ada item', () => {
      expect(calculateDirectCost([])).toBe(0);
    });
  });

  describe('calculateRejectCost', () => {
    it('menghitung reject cost dengan benar', () => {
      // 89000 * 3 / 100 = 2670
      expect(calculateRejectCost(89000, 3)).toBe(2670);
    });
    it('mengembalikan 0 jika reject_pct = 0', () => {
      expect(calculateRejectCost(89000, 0)).toBe(0);
    });
  });

  describe('calculateOverheadCost', () => {
    it('menghitung overhead dari direct + reject', () => {
      // (89000 + 2670) * 15 / 100 = 13750.5
      expect(calculateOverheadCost(89000, 2670, 15)).toBeCloseTo(13750.5);
    });
  });

  describe('calculateHpp', () => {
    it('menjumlahkan direct + reject + overhead', () => {
      const direct = 89000;
      const reject = 2670;
      const overhead = 13750;
      expect(calculateHpp(direct, reject, overhead)).toBe(105420);
    });
  });

  describe('calculateSuggestedPrice', () => {
    it('menghitung harga jual dengan margin target', () => {
      // 105420 / (1 - 35/100) = 105420 / 0.65 = 162184.6...
      const price = calculateSuggestedPrice(105420, 35);
      expect(price).toBeCloseTo(162184.6, 0);
    });
    it('melempar error jika margin >= 100', () => {
      expect(() => calculateSuggestedPrice(100000, 100)).toThrow();
      expect(() => calculateSuggestedPrice(100000, 101)).toThrow();
    });
    it('melempar error jika margin < 0', () => {
      expect(() => calculateSuggestedPrice(100000, -1)).toThrow();
    });
  });

  describe('validateHppInputs', () => {
    it('valid jika semua input benar', () => {
      expect(() => validateHppInputs(sampleItems, 3, 15, 35)).not.toThrow();
    });
    it('melempar error jika ada item dengan cost negatif', () => {
      const badItems = [{ category: 'FABRIC', total_cost: -1000 }];
      expect(() => validateHppInputs(badItems, 3, 15, 35)).toThrow(/negatif/i);
    });
    it('melempar error jika reject_pct > 100', () => {
      expect(() => validateHppInputs(sampleItems, 101, 15, 35)).toThrow();
    });
    it('melempar error jika overhead_pct > 100', () => {
      expect(() => validateHppInputs(sampleItems, 3, 101, 35)).toThrow();
    });
  });
});
```

### 3.2 Progress Calculation

**File:** `src/modules/launch/domain/progress.test.ts`

```typescript
describe('Progress Calculation', () => {
  const stageDefinitions = [
    { code: 'BRIEF', weight: 10 },
    { code: 'MATERIAL_RESEARCH', weight: 15 },
    { code: 'SUPPLIER_FIX', weight: 15 },
    { code: 'COLOR_FIX', weight: 10 },
    { code: 'SAMPLE_FIX', weight: 20 },
    { code: 'HPP_FIX', weight: 10 },
    { code: 'SIZE_CHART_FIX', weight: 10 },
    { code: 'QC_FINAL', weight: 10 },
  ];  // Total weight = 100

  it('progress 0 jika semua stage NOT_STARTED', () => {
    const stageRuns = stageDefinitions.map(s => ({ ...s, status: 'NOT_STARTED' }));
    expect(calculateProgress(stageRuns, stageDefinitions)).toBe(0);
  });

  it('progress 25 jika BRIEF dan MATERIAL selesai', () => {
    const stageRuns = stageDefinitions.map(s => ({
      ...s,
      status: ['BRIEF', 'MATERIAL_RESEARCH'].includes(s.code) ? 'COMPLETED' : 'NOT_STARTED',
    }));
    expect(calculateProgress(stageRuns, stageDefinitions)).toBe(25);
  });

  it('stage CANCELLED tidak dihitung sebagai progress', () => {
    const stageRuns = stageDefinitions.map(s => ({
      ...s,
      status: s.code === 'BRIEF' ? 'COMPLETED' : s.code === 'MATERIAL_RESEARCH' ? 'CANCELLED' : 'NOT_STARTED',
    }));
    expect(calculateProgress(stageRuns, stageDefinitions)).toBe(10);
  });

  it('progress 100 jika semua stage COMPLETED', () => {
    const stageRuns = stageDefinitions.map(s => ({ ...s, status: 'COMPLETED' }));
    expect(calculateProgress(stageRuns, stageDefinitions)).toBe(100);
  });
});
```

### 3.3 Workflow Gate Validation

**File:** `src/modules/launch/domain/gates.test.ts`

```typescript
describe('Workflow Gate Validation', () => {
  describe('validateBriefGate', () => {
    it('valid jika semua field wajib terisi', () => {
      const wo = {
        brand_id: 'uuid-1',
        article_code: 'GGS-001',
        article_name: 'Kaos Polos',
        category: 'TOPS',
        primary_pic_user_id: 'uuid-user',
        description: 'Ini deskripsi minimal',
      };
      expect(validateBriefGate(wo).valid).toBe(true);
    });
    it('tidak valid jika article_code kosong', () => {
      const wo = { brand_id: 'uuid-1', article_code: '', article_name: 'Test', category: 'TOPS', primary_pic_user_id: 'uuid', description: 'desc' };
      const result = validateBriefGate(wo);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('article_code');
    });
  });

  describe('validateMaterialGate', () => {
    it('valid jika ada ≥1 material SELECTED', () => {
      const materials = [
        { status: 'CANDIDATE' },
        { status: 'SELECTED' },
      ];
      expect(validateMaterialGate(materials).valid).toBe(true);
    });
    it('tidak valid jika tidak ada material SELECTED', () => {
      const materials = [{ status: 'CANDIDATE' }];
      expect(validateMaterialGate(materials).valid).toBe(false);
    });
  });

  describe('validateSampleGate', () => {
    it('valid jika ada sampel MASTER', () => {
      const samples = [
        { status: 'REVISION', is_master_sample: false },
        { status: 'MASTER', is_master_sample: true },
      ];
      expect(validateSampleGate(samples).valid).toBe(true);
    });
    it('tidak valid jika tidak ada MASTER', () => {
      const samples = [{ status: 'APPROVED', is_master_sample: false }];
      expect(validateSampleGate(samples).valid).toBe(false);
    });
  });

  describe('validateQCGate', () => {
    it('valid jika semua required items PASS dan overall APPROVED', () => {
      const items = [
        { is_required: true, result: 'PASS' },
        { is_required: true, result: 'PASS' },
        { is_required: false, result: 'FAIL' },  // optional boleh FAIL
      ];
      expect(validateQCGate(items, 'APPROVED').valid).toBe(true);
    });
    it('tidak valid jika ada required item yang FAIL', () => {
      const items = [
        { is_required: true, result: 'PASS' },
        { is_required: true, result: 'FAIL' },
      ];
      expect(validateQCGate(items, 'PENDING').valid).toBe(false);
    });
    it('tidak valid jika overall_status bukan APPROVED', () => {
      const items = [{ is_required: true, result: 'PASS' }];
      expect(validateQCGate(items, 'PENDING').valid).toBe(false);
    });
  });
});
```

### 3.4 Permission Resolver

**File:** `src/core/permissions/permissionResolver.test.ts`

```typescript
describe('Permission Resolver', () => {
  const ownerCtx = {
    userId: 'owner-uuid',
    isOwner: true,
    isActive: true,
    rolePermissions: new Map(),
    overrides: new Map(),
  };

  const inactiveCtx = {
    userId: 'user-uuid',
    isOwner: false,
    isActive: false,
    rolePermissions: new Map([['launch.work_order.create', true]]),
    overrides: new Map(),
  };

  const productLeadCtx = {
    userId: 'lead-uuid',
    isOwner: false,
    isActive: true,
    rolePermissions: new Map([
      ['launch.dashboard.view', true],
      ['launch.work_order.view_assigned', true],
      ['launch.hpp.manage', true],
    ]),
    overrides: new Map(),
  };

  it('owner memiliki semua permission', () => {
    expect(hasPermission(ownerCtx, 'launch.article.publish')).toBe(true);
    expect(hasPermission(ownerCtx, 'core.features.manage')).toBe(true);
    expect(hasPermission(ownerCtx, 'pos.order.void')).toBe(true);
  });

  it('user tidak aktif ditolak semua permission', () => {
    expect(hasPermission(inactiveCtx, 'launch.work_order.create')).toBe(false);
    expect(hasPermission(inactiveCtx, 'launch.dashboard.view')).toBe(false);
  });

  it('product lead memiliki permission yang sesuai role', () => {
    expect(hasPermission(productLeadCtx, 'launch.hpp.manage')).toBe(true);
    expect(hasPermission(productLeadCtx, 'launch.article.publish')).toBe(false);
  });

  it('override allow mengizinkan permission yang tidak ada di role', () => {
    const ctxWithOverride = {
      ...productLeadCtx,
      overrides: new Map([['launch.work_order.create', true]]),
    };
    expect(hasPermission(ctxWithOverride, 'launch.work_order.create')).toBe(true);
  });

  it('override deny memblokir permission yang ada di role', () => {
    const ctxWithDeny = {
      ...productLeadCtx,
      overrides: new Map([['launch.hpp.manage', false]]),
    };
    expect(hasPermission(ctxWithDeny, 'launch.hpp.manage')).toBe(false);
  });
});
```

### 3.5 Overdue Detection

```typescript
describe('Overdue Detection', () => {
  const now = new Date('2026-07-25');

  it('work order overdue jika target_date di masa lalu dan belum PUBLISHED', () => {
    const wo = { target_date: '2026-07-20', overall_status: 'ACTIVE' };
    expect(isWorkOrderOverdue(wo, now)).toBe(true);
  });

  it('work order tidak overdue jika sudah PUBLISHED', () => {
    const wo = { target_date: '2026-07-20', overall_status: 'PUBLISHED' };
    expect(isWorkOrderOverdue(wo, now)).toBe(false);
  });

  it('stage overdue jika due_at di masa lalu dan belum COMPLETED', () => {
    const stage = { due_at: '2026-07-20T00:00:00Z', status: 'IN_PROGRESS' };
    expect(isStageOverdue(stage, now)).toBe(true);
  });

  it('stage tidak overdue jika COMPLETED walaupun terlambat', () => {
    const stage = { due_at: '2026-07-20T00:00:00Z', status: 'COMPLETED' };
    expect(isStageOverdue(stage, now)).toBe(false);
  });
});
```

### 3.6 Catalog Publish Idempotency

```typescript
describe('Catalog Publish Idempotency', () => {
  it('publish dua kali mengembalikan product_id yang sama', async () => {
    const workOrderId = 'wo-uuid-1';
    
    // Pertama
    const result1 = await catalogService.publish(workOrderId);
    
    // Kedua (idempotent)
    const result2 = await catalogService.publish(workOrderId);
    
    expect(result1.catalogProductId).toBe(result2.catalogProductId);
  });

  it('melempar error jika work order belum APPROVED', async () => {
    await expect(
      catalogService.publish('wo-draft-uuid')
    ).rejects.toThrow('Work order harus berstatus APPROVED');
  });
});
```

---

## 4. INTEGRATION TESTS

### 4.1 Authentication

**Setup:** Gunakan Supabase local instance.

```typescript
// src/test/integration/auth.test.ts
describe('Authentication Integration', () => {
  it('login berhasil → session valid', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'owner@test.com',
      password: 'test-password-123',
    });
    expect(error).toBeNull();
    expect(data.session).not.toBeNull();
    expect(data.user?.id).toBeTruthy();
  });

  it('login gagal → error message', async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'owner@test.com',
      password: 'wrong-password',
    });
    expect(error).not.toBeNull();
    expect(error?.message).toBeTruthy();
  });

  it('user is_active=false → akses ke data ditolak (RLS)', async () => {
    // Login sebagai user inactive
    await supabase.auth.signInWithPassword({
      email: 'inactive@test.com',
      password: 'test-password-123',
    });
    
    // Coba akses data — RLS harus menolak
    const { data } = await supabase.from('launch_work_orders').select();
    expect(data).toHaveLength(0);  // RLS memblokir
  });
});
```

### 4.2 RLS Tests

```typescript
describe('RLS: Work Orders', () => {
  it('non-member tidak bisa baca work order orang lain', async () => {
    await loginAs('seller@test.com');
    const { data } = await supabase.from('launch_work_orders').select();
    expect(data).toHaveLength(0);  // Seller tidak assign ke WO manapun
  });

  it('PIC bisa baca work ordernya sendiri', async () => {
    await loginAs('dodi@test.com');
    const { data } = await supabase.from('launch_work_orders')
      .select()
      .eq('primary_pic_user_id', DODI_USER_ID);
    expect(data?.length).toBeGreaterThan(0);
  });

  it('owner bisa baca semua work order', async () => {
    await loginAs('gugun@test.com');
    const { data } = await supabase.from('launch_work_orders').select();
    expect(data?.length).toBeGreaterThan(0);
  });

  it('HPP FINAL tidak bisa di-UPDATE', async () => {
    await loginAs('dodi@test.com');
    const { error } = await supabase
      .from('launch_hpp_versions')
      .update({ hpp_total: 999 })
      .eq('id', FINAL_HPP_ID);
    expect(error).not.toBeNull();  // RLS menolak update FINAL
  });

  it('audit_logs tidak bisa di-UPDATE atau DELETE', async () => {
    await loginAs('gugun@test.com');
    const { error: updateError } = await supabase
      .from('audit_logs')
      .update({ action: 'TAMPERED' })
      .eq('id', LOG_ID);
    expect(updateError).not.toBeNull();

    const { error: deleteError } = await supabase
      .from('audit_logs')
      .delete()
      .eq('id', LOG_ID);
    expect(deleteError).not.toBeNull();
  });
});
```

### 4.3 Work Order Lifecycle

```typescript
describe('Work Order Lifecycle', () => {
  it('membuat WO → 8 stage runs dibuat otomatis', async () => {
    await loginAs('gugun@test.com');
    
    const { data: wo } = await supabase
      .from('launch_work_orders')
      .insert({ brand_id: GG_SUPPLY_ID, article_code: 'TEST-001', ... })
      .select()
      .single();
    
    const { data: stages } = await supabase
      .from('launch_stage_runs')
      .select()
      .eq('work_order_id', wo.id);
    
    expect(stages).toHaveLength(8);
    expect(stages?.every(s => s.status === 'NOT_STARTED')).toBe(true);
  });
  
  it('update stage ke COMPLETED → progress berubah', async () => {
    // Update stage BRIEF ke COMPLETED
    await stageService.complete(STAGE_BRIEF_RUN_ID, { actorId: OWNER_ID });
    
    const { data: wo } = await supabase
      .from('launch_work_orders')
      .select('progress_percent')
      .eq('id', WORK_ORDER_ID)
      .single();
    
    expect(wo.progress_percent).toBe(10);  // BRIEF memiliki weight 10
  });
});
```

---

## 5. E2E TESTS (PLAYWRIGHT)

### 5.1 Alur Utama (Happy Path)

**File:** `src/test/e2e/product-launch-happy-path.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Product Launch Happy Path', () => {
  test('Owner membuat artikel dari brief hingga publish', async ({ page }) => {
    // 1. Login sebagai Owner
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'gugun@test.com');
    await page.fill('[data-testid="password-input"]', 'test-password');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/app/dashboard');

    // 2. Buat work order baru
    await page.goto('/app/launch/work-orders/new');
    await page.selectOption('[data-testid="brand-select"]', { label: 'GG Supply' });
    await page.fill('[data-testid="article-code"]', 'TEST-E2E-001');
    await page.fill('[data-testid="article-name"]', 'Kaos E2E Test');
    await page.selectOption('[data-testid="category-select"]', 'TOPS');
    await page.fill('[data-testid="description"]', 'Ini artikel untuk E2E test');
    await page.selectOption('[data-testid="pic-select"]', { label: 'Dodi' });
    await page.click('[data-testid="save-brief-button"]');

    // 3. Verifikasi WO terbuat
    await expect(page.locator('[data-testid="work-order-status"]')).toContainText('Aktif');
    
    // ... (lanjut semua tahap)

    // 18. Owner publish
    await page.click('[data-testid="publish-button"]');
    await page.click('[data-testid="confirm-publish"]');
    await expect(page.locator('[data-testid="work-order-status"]')).toContainText('Published');

    // 19. Cek katalog
    await page.goto('/app/catalog/products');
    await expect(page.locator('text=TEST-E2E-001')).toBeVisible();
  });
});
```

### 5.2 Alur Error

```typescript
test.describe('Error Paths', () => {
  test('login dengan kredensial salah', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'wrong@test.com');
    await page.fill('[data-testid="password-input"]', 'wrong-pass');
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('akses work order tanpa permission → halaman ditolak', async ({ page }) => {
    await loginAs(page, 'seller@test.com');
    await page.goto('/app/launch/work-orders');
    await expect(page.locator('[data-testid="permission-denied"]')).toBeVisible();
  });

  test('publish artikel yang belum approved → error', async ({ page }) => {
    await loginAs(page, 'gugun@test.com');
    await page.goto(`/app/launch/work-orders/${ACTIVE_WO_ID}`);
    // Tombol publish harus tidak ada / disabled
    const publishBtn = page.locator('[data-testid="publish-button"]');
    await expect(publishBtn).not.toBeVisible();
  });
});
```

### 5.3 Security Tests (E2E)

```typescript
test.describe('Security', () => {
  test('service-role key tidak ada di bundle frontend', async ({ page }) => {
    // Cek source JS yang didownload oleh browser
    const scriptContents: string[] = [];
    page.on('response', async (response) => {
      if (response.url().includes('.js')) {
        scriptContents.push(await response.text());
      }
    });
    
    await page.goto('/');
    
    for (const script of scriptContents) {
      expect(script).not.toContain('SERVICE_ROLE_KEY');
      expect(script).not.toContain('CLOUDINARY_API_SECRET');
    }
  });
});
```

---

## 6. TEST DATA MANAGEMENT

### 6.1 Seed Data untuk Testing

```sql
-- supabase/seed/test_users.sql (hanya untuk local/preview)
-- Buat user melalui Supabase Auth API, lalu profil melalui trigger

-- Owner: gugun@test.com / test-password-123
-- Product Lead: dodi@test.com / test-password-123
-- Production Lead: yadi@test.com / test-password-123
-- Sourcing Admin: syaikhu@test.com / test-password-123
-- Seller (inactive): inactive@test.com / test-password-123
```

### 6.2 Test Fixtures

```typescript
// src/test/fixtures/workOrder.ts
export const createWorkOrderFixture = (overrides = {}) => ({
  brand_id: 'gg-supply-uuid',
  article_code: `TEST-${Date.now()}`,  // unique per test
  article_name: 'Test Article',
  category: 'TOPS',
  description: 'Test description minimal',
  primary_pic_user_id: 'dodi-uuid',
  overall_status: 'DRAFT',
  progress_percent: 0,
  ...overrides,
});
```

### 6.3 Database Cleanup

```typescript
// src/test/helpers/cleanup.ts
export async function cleanupTestData(prefix: string) {
  await supabase
    .from('launch_work_orders')
    .delete()
    .like('article_code', `${prefix}%`);
}
```

---

## 7. TEST NAMING CONVENTIONS

```
Untuk unit tests:
  describe('[NamaFungsi/Modul]', () => {
    it('[kondisi input] → [hasil yang diharapkan]', () => { ... })
  })

Contoh:
  describe('calculateHpp', () => {
    it('menjumlahkan direct + reject + overhead dengan benar', () => ...)
    it('melempar error jika margin >= 100%', () => ...)
  })

Untuk E2E:
  test.describe('[Alur/Feature]', () => {
    test('[siapa] dapat/tidak dapat [melakukan apa]', async ({ page }) => { ... })
  })

Contoh:
  test.describe('Work Order Creation', () => {
    test('Owner dapat membuat work order baru dengan brief lengkap', ...)
    test('Product Lead tidak dapat publish artikel', ...)
  })
```

---

## 8. CI/CD TEST PIPELINE

```yaml
# Urutan eksekusi di CI:
# 1. npm run type-check    → gagal cepat jika ada type error
# 2. npm run lint          → gagal cepat jika ada lint error
# 3. npm run test:unit     → domain logic tests
# 4. npm run build         → verifikasi build berhasil
# 5. grep -r "SECRET" dist/ → cek secret tidak bocor
# 6. npm run test:e2e      → hanya di PR ke main
```

---

## 9. LAPORAN COVERAGE

```bash
# Generate laporan coverage
npm run test:coverage

# Output tersedia di:
# coverage/index.html  — HTML report (buka di browser)
# coverage/lcov.info   — untuk integrasi dengan Codecov
```

**Minimum coverage yang wajib pass sebelum merge ke main:**
- `src/modules/*/domain/`: **80%** functions, branches, lines
- `src/core/permissions/`: **80%** functions, branches, lines

---

*Akhir dokumen testing-plan.md*
