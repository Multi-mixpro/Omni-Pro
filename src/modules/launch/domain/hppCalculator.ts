import { HppItem } from './stageTypes';

/**
 * Menghitung Total Direct Cost (Penjumlahan seluruh komponen item HPP)
 */
export function calculateDirectCost(items: HppItem[]): number {
  return items.reduce((sum, item) => sum + (item.total_cost || 0), 0);
}

/**
 * Menghitung Reject Cost = Direct Cost * Reject Pct / 100
 */
export function calculateRejectCost(directCost: number, rejectPct: number): number {
  if (rejectPct < 0) throw new Error('Reject percentage tidak boleh negatif');
  return (directCost * rejectPct) / 100;
}

/**
 * Menghitung Overhead Cost = (Direct Cost + Reject Cost) * Overhead Pct / 100
 */
export function calculateOverheadCost(
  directCost: number,
  rejectCost: number,
  overheadPct: number
): number {
  if (overheadPct < 0) throw new Error('Overhead percentage tidak boleh negatif');
  return ((directCost + rejectCost) * overheadPct) / 100;
}

/**
 * Menghitung HPP Total = Direct Cost + Reject Cost + Overhead Cost
 */
export function calculateHppTotal(
  directCost: number,
  rejectCost: number,
  overheadCost: number
): number {
  return directCost + rejectCost + overheadCost;
}

/**
 * Menghitung Suggested Selling Price = HPP Total / (1 - Margin Pct / 100)
 */
export function calculateSuggestedSellingPrice(hppTotal: number, targetMarginPct: number): number {
  if (targetMarginPct >= 100 || targetMarginPct < 0) {
    throw new Error('Target margin harus antara 0% dan 99%');
  }
  return hppTotal / (1 - targetMarginPct / 100);
}
