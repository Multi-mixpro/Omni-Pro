import { ArticleStage } from '../types';

interface StageStyle {
  badge: string;
  dot: string;
}

const STAGE_STYLES: Record<ArticleStage, StageStyle> = {
  'Prospect': { badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  'Specification': { badge: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  'Source & Pattern': { badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  'Sampling': { badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  'Costing': { badge: 'bg-fuchsia-100 text-fuchsia-700', dot: 'bg-fuchsia-500' },
  'Production Plan': { badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  'Production': { badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  'Launch': { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
};

export function stageBadgeClass(stage: ArticleStage): string {
  return STAGE_STYLES[stage]?.badge || 'bg-[#DDF4F1] text-[#087E79]';
}

export function stageDotClass(stage: ArticleStage): string {
  return STAGE_STYLES[stage]?.dot || 'bg-[#087E79]';
}
