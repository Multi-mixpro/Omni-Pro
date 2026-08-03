/**
 * Product Launch OS 3.0 - Calculation Helpers
 */

import { Article, ArticleBOMItem, MatrixCell } from '../types';

const ARTICLE_STAGES: Article['stage'][] = [
  'Prospect',
  'Specification',
  'Source & Pattern',
  'Sampling',
  'Costing',
  'Production Plan',
  'Production',
  'Launch',
];

export function calculateBOMTotal(items: ArticleBOMItem[]): number {
  return items.reduce((sum, item) => sum + (item.costPerProduct || 0), 0);
}

export function calculateHPP(article: Article): number {
  const bomTotal = calculateBOMTotal(article.materials || []);
  const selectedScenario = (article.scenarios || []).find((scenario) => scenario.isSelectedPlan);
  const productionQuantity = Math.max(1, selectedScenario?.totalQty || 1);
  const otherCosts = (article.costComponents || [])
    .filter((component) => component.isIncluded && component.category !== 'Material')
    .reduce((sum, component) => {
      const amount = Number(component.amount || 0);
      if (component.calculationMethod === 'percentage') {
        return sum + (bomTotal * amount) / 100;
      }
      if (
        component.calculationMethod === 'per_batch'
        || component.calculationMethod === 'fixed'
        || component.calculationMethod === 'fixed_allocated'
      ) {
        return sum + amount / productionQuantity;
      }
      return sum + amount;
    }, 0);

  return Math.round(bomTotal + otherCosts);
}

export function calculateMarginPercent(msrp: number, hpp: number): number {
  if (!msrp || msrp <= 0) return 0;
  return Number((((msrp - hpp) / msrp) * 100).toFixed(1));
}

export function calculateMatrixTotals(matrix: MatrixCell[] = []) {
  let totalQty = 0;
  let totalBudget = 0;
  let totalRevenue = 0;

  matrix.forEach((cell) => {
    totalQty += cell.plannedQty || 0;
    totalBudget += cell.cellBudget || 0;
    totalRevenue += cell.cellRevenue || 0;
  });

  return {
    totalQty,
    totalBudget,
    totalRevenue,
    grossMarginPercent: totalRevenue > 0 ? Number((((totalRevenue - totalBudget) / totalRevenue) * 100).toFixed(1)) : 0,
  };
}

export function calculateArticleCompleteness(article: Article): number {
  const checks = [
    Boolean(article.name && article.category && article.briefIntent),
    Boolean(article.targetUserDescription && article.acceptanceCriteria),
    Boolean(article.references?.length || article.galleryImages?.length),
    Boolean(article.materials?.length),
    Boolean(article.colorways?.length),
    Boolean(article.sizeSet?.length && article.sizeChart?.length),
    Boolean(article.patternSpecification?.patternMaker),
    Boolean(article.sampleIterations?.length),
    calculateHPP(article) > 0,
    Boolean(article.scenarios?.some((scenario) => scenario.totalQty > 0)),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function deriveArticleIndicators(article: Article): Article {
  const calculatedHPP = calculateHPP(article);
  const stageIndex = Math.max(0, ARTICLE_STAGES.indexOf(article.stage));
  const workflowProgressPercent = Math.round((stageIndex / (ARTICLE_STAGES.length - 1)) * 100);
  const today = new Date().toISOString().slice(0, 10);
  const target = article.targetReleaseDate || article.targetSampleDate;
  const daysRemaining = target
    ? Math.ceil((new Date(target).getTime() - new Date(today).getTime()) / 86_400_000)
    : null;
  const scheduleHealth = article.blockerCount > 0
    ? 'At Risk'
    : daysRemaining !== null && daysRemaining < 0
      ? 'Overdue'
      : daysRemaining !== null && daysRemaining <= 7 && workflowProgressPercent < 80
        ? 'At Risk'
        : 'On Track';
  const readiness = article.readinessChecklist || [];
  const criticalReady = readiness
    .filter((item) => item.isCritical)
    .every((item) => item.isCompleted);
  const readinessComplete = readiness.length > 0
    && readiness.every((item) => item.isCompleted);
  const productionReadiness = readinessComplete
    ? 'Approved'
    : criticalReady && readiness.some((item) => item.isCompleted)
      ? 'Conditional'
      : 'Not Ready';
  const goldenSampleApproved = article.sampleIterations?.some(
    (sample) => sample.isGoldenSample && sample.status === 'Approved',
  );
  const costConfidence = article.costConfidence === 'Locked - Production'
    ? article.costConfidence
    : goldenSampleApproved
      ? 'High - Sample Verified'
      : calculatedHPP > 0
        ? 'Medium - Quoted'
        : 'Low - Estimate';

  return {
    ...article,
    calculatedHPP,
    workflowProgressPercent,
    dataCompletenessPercent: calculateArticleCompleteness({ ...article, calculatedHPP }),
    scheduleHealth,
    productionReadiness,
    costConfidence,
  };
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDateIndonesian(dateString?: string): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
