import { describe, expect, it } from 'vitest';
import { STAGE_ORDER } from './types';
import { calculateStageProgress, getNextStage, isProductionReady } from './workflow';

describe('Product Launch workflow', () => {
  it('menghitung progress dari seluruh stage, bukan input manual project', () => {
    expect(calculateStageProgress([
      { status: 'COMPLETED', progress: 10 },
      { status: 'IN_PROGRESS', progress: 40 },
      { status: 'NOT_STARTED', progress: 0 },
    ])).toBe(47);
  });

  it('mengembalikan stage pertama yang belum selesai', () => {
    expect(getNextStage(['BRIEF', 'RESEARCH'])).toBe('SOURCING');
  });

  it('menahan produksi sebelum delapan gate utama selesai', () => {
    expect(isProductionReady(['BRIEF', 'RESEARCH', 'SOURCING'])).toBe(false);
    expect(isProductionReady([...STAGE_ORDER.slice(0, -1)])).toBe(true);
  });
});
