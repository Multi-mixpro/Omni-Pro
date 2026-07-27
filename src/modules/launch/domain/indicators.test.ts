import { describe, expect, it } from 'vitest';
import { costConfidence, dataReadiness, scheduleHealth } from './indicators';
import type { LaunchStage, ProjectWorkspace } from './types';

const emptyWorkspace = {
  project: { concept: null, research_summary: null },
  references: [],
  materials: [],
  colorways: [],
  sizeCharts: [],
  hpp: [],
  qc: [],
  samples: [],
} as unknown as Parameters<typeof dataReadiness>[0];

const quote = (status: string) => ({ id: 'q', supplier_role: 'PRIMARY', price: 1, unit: 'meter', moq: null, lead_time_days: null, status });
const material = (quoteStatus?: string) => ({ id: 'm', proposed_name: 'Taslan', role: 'MAIN', composition: null, gsm: null, width_cm: null, color_notes: null, status: 'CANDIDATE', quotes: quoteStatus ? [quote(quoteStatus)] : [] }) as unknown as ProjectWorkspace['materials'][number];
const sample = (isMaster: boolean, status: string) => ({ id: 's', version: 1, sample_type: 'DEVELOPMENT', status, is_master: isMaster, material_notes: null, pattern_notes: null, construction_notes: null, revision_notes: null });
const hppVersion = (status: string) => ({ id: 'h', version: 1, total_hpp: 1000, recommended_price: null, target_margin_percent: null, status });
const stage = (status: LaunchStage['status'], due_date: string | null = null) => ({ status, due_date });

describe('data readiness', () => {
  it('artikel kosong tidak dianggap siap sama sekali', () => {
    expect(dataReadiness(emptyWorkspace)).toBe(0);
  });

  it('menghitung kelengkapan terpisah dari progress tahapan', () => {
    const partial = {
      ...emptyWorkspace,
      project: { concept: 'Jaket ringan', research_summary: 'Target pengguna urban' },
      references: [{ id: 'r' }],
      materials: [material('SELECTED')],
    } as unknown as Parameters<typeof dataReadiness>[0];
    // konsep, referensi, riset, bahan, supplier = 5 dari 10
    expect(dataReadiness(partial)).toBe(50);
  });
});

describe('schedule health', () => {
  const today = new Date('2026-07-27T00:00:00Z');

  it('menandai terhambat ketika ada tahap blocked', () => {
    expect(scheduleHealth({ status: 'ACTIVE', progress: 40, target_date: '2026-09-01' }, [stage('BLOCKED')], today)).toBe('BLOCKED');
  });

  it('menandai terlambat ketika target produksi sudah lewat', () => {
    expect(scheduleHealth({ status: 'ACTIVE', progress: 40, target_date: '2026-07-01' }, [stage('IN_PROGRESS')], today)).toBe('OVERDUE');
  });

  it('menandai berisiko ketika tenggat tahap terlewat walau target akhir belum', () => {
    expect(scheduleHealth({ status: 'ACTIVE', progress: 40, target_date: '2026-09-01' }, [stage('IN_PROGRESS', '2026-07-20')], today)).toBe('AT_RISK');
  });

  it('artikel siap produksi tidak pernah dianggap bermasalah', () => {
    expect(scheduleHealth({ status: 'READY_FOR_PRODUCTION', progress: 100, target_date: '2026-07-01' }, [stage('COMPLETED')], today)).toBe('ON_TRACK');
  });

  it('menandai lebih cepat ketika mayoritas tahap selesai jauh sebelum target', () => {
    const stages = [stage('COMPLETED'), stage('COMPLETED'), stage('IN_PROGRESS')];
    expect(scheduleHealth({ status: 'ACTIVE', progress: 66, target_date: '2026-09-01' }, stages, today)).toBe('AHEAD');
  });
});

describe('cost confidence', () => {
  it('tanpa versi HPP berarti belum dihitung', () => {
    expect(costConfidence({ hpp: [], materials: [], samples: [] } as unknown as ProjectWorkspace)).toBe('NONE');
  });

  it('draft HPP tanpa penawaran hanya estimasi awal', () => {
    expect(costConfidence({ hpp: [hppVersion('DRAFT')], materials: [material()], samples: [] } as unknown as ProjectWorkspace)).toBe('ESTIMATE');
  });

  it('naik ke penawaran supplier setelah quotation dikunci', () => {
    expect(costConfidence({ hpp: [hppVersion('DRAFT')], materials: [material('SELECTED')], samples: [] } as unknown as ProjectWorkspace)).toBe('QUOTED');
  });

  it('naik ke berdasarkan sampel setelah master sample disetujui', () => {
    expect(costConfidence({ hpp: [hppVersion('DRAFT')], materials: [material('SELECTED')], samples: [sample(true, 'APPROVED')] } as unknown as ProjectWorkspace)).toBe('SAMPLED');
  });

  it('HPP final berarti terverifikasi', () => {
    expect(costConfidence({ hpp: [hppVersion('FINAL')], materials: [], samples: [] } as unknown as ProjectWorkspace)).toBe('VERIFIED');
  });
});
