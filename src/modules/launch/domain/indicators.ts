import type { LaunchProject, LaunchStage, ProjectWorkspace } from './types';

/**
 * The blueprint asks for four separate indicators. A single progress number
 * hides articles whose tasks are done but whose cost or specification data is
 * still missing, so readiness, schedule, and cost confidence are tracked apart.
 */

export type ScheduleHealth = 'AHEAD' | 'ON_TRACK' | 'AT_RISK' | 'OVERDUE' | 'BLOCKED';
export type CostConfidence = 'NONE' | 'ESTIMATE' | 'QUOTED' | 'SAMPLED' | 'VERIFIED';

export interface ReadinessItem {
  key: string;
  label: string;
  done: boolean;
}

export const SCHEDULE_HEALTH_LABEL: Record<ScheduleHealth, string> = {
  AHEAD: 'Lebih cepat',
  ON_TRACK: 'Sesuai jadwal',
  AT_RISK: 'Berisiko',
  OVERDUE: 'Terlambat',
  BLOCKED: 'Terhambat',
};

export const COST_CONFIDENCE_LABEL: Record<CostConfidence, string> = {
  NONE: 'Belum dihitung',
  ESTIMATE: 'Estimasi awal',
  QUOTED: 'Penawaran supplier',
  SAMPLED: 'Berdasarkan sampel',
  VERIFIED: 'HPP terverifikasi',
};

type ReadinessInput = Pick<ProjectWorkspace, 'references' | 'materials' | 'colorways' | 'sizeCharts' | 'hpp' | 'qc' | 'samples'> & {
  project: Pick<LaunchProject, 'concept' | 'research_summary'>;
};

export function dataReadinessItems(input: ReadinessInput): ReadinessItem[] {
  const hasSelectedQuote = input.materials.some(item => item.quotes?.some(quote => quote.status === 'SELECTED'));
  return [
    { key: 'concept', label: 'Konsep artikel', done: Boolean(input.project.concept?.trim()) },
    { key: 'reference', label: 'Referensi', done: input.references.length > 0 },
    { key: 'research', label: 'Kesimpulan riset', done: Boolean(input.project.research_summary?.trim()) },
    { key: 'material', label: 'Kandidat bahan', done: input.materials.length > 0 },
    { key: 'supplier', label: 'Supplier terpilih', done: hasSelectedQuote },
    { key: 'colorway', label: 'Varian warna', done: input.colorways.length > 0 },
    { key: 'size', label: 'Size chart', done: input.sizeCharts.some(chart => chart.sizes.length > 0) },
    { key: 'sample', label: 'Sample', done: input.samples.length > 0 },
    { key: 'hpp', label: 'HPP', done: input.hpp.length > 0 },
    { key: 'qc', label: 'QC', done: input.qc.length > 0 },
  ];
}

export function dataReadiness(input: ReadinessInput): number {
  const items = dataReadinessItems(input);
  return Math.round((items.filter(item => item.done).length / items.length) * 100);
}

function daysUntil(date: string, today: Date) {
  const target = new Date(`${date}T00:00:00Z`).getTime();
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((target - start) / 86_400_000);
}

export function scheduleHealth(
  project: Pick<LaunchProject, 'status' | 'progress' | 'target_date'>,
  stages: Array<Pick<LaunchStage, 'status' | 'due_date'>>,
  today: Date = new Date(),
): ScheduleHealth {
  if (project.status === 'READY_FOR_PRODUCTION') return 'ON_TRACK';
  if (project.status === 'BLOCKED' || stages.some(stage => stage.status === 'BLOCKED')) return 'BLOCKED';

  if (project.target_date && daysUntil(project.target_date, today) < 0) return 'OVERDUE';

  const lateStage = stages.some(stage => stage.status !== 'COMPLETED' && stage.due_date && daysUntil(stage.due_date, today) < 0);
  if (lateStage) return 'AT_RISK';

  // Compare how far the article has come against how much of its runway is left.
  if (project.target_date) {
    const remaining = daysUntil(project.target_date, today);
    const completed = stages.filter(stage => stage.status === 'COMPLETED').length;
    const expected = stages.length ? Math.round((completed / stages.length) * 100) : project.progress;
    if (remaining <= 7 && expected < 70) return 'AT_RISK';
    if (remaining > 14 && expected >= 60) return 'AHEAD';
  }

  return 'ON_TRACK';
}

export function costConfidence(
  input: Pick<ProjectWorkspace, 'hpp' | 'materials' | 'samples'>,
): CostConfidence {
  if (!input.hpp.length) return 'NONE';
  if (input.hpp.some(version => version.status === 'FINAL')) return 'VERIFIED';

  const hasMasterSample = input.samples.some(sample => sample.is_master && sample.status === 'APPROVED');
  if (hasMasterSample) return 'SAMPLED';

  const hasSelectedQuote = input.materials.some(item => item.quotes?.some(quote => quote.status === 'SELECTED'));
  if (hasSelectedQuote) return 'QUOTED';

  return 'ESTIMATE';
}
