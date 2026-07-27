import { STAGE_ORDER, type StageCode, type StageStatus } from './types';

export function calculateStageProgress(statuses: Array<Pick<{ status: StageStatus; progress: number }, 'status' | 'progress'>>) {
  if (!statuses.length) return 0;
  const total = statuses.reduce((sum, stage) => sum + (stage.status === 'COMPLETED' ? 100 : Math.max(0, Math.min(100, stage.progress))), 0);
  return Math.round(total / statuses.length);
}

export function getNextStage(completed: StageCode[]) {
  return STAGE_ORDER.find(stage => !completed.includes(stage)) ?? 'PRODUCTION_READY';
}

export function isProductionReady(completed: StageCode[]) {
  return STAGE_ORDER.slice(0, -1).every(stage => completed.includes(stage));
}
