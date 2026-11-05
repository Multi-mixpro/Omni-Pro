export const ALL_BUSINESS_UNITS = 'Semua Unit Bisnis';
export const UNASSIGNED_BUSINESS_UNIT = 'Unit belum ditetapkan';

/** Accept both the current label and legacy calendar/filter values. */
export function isAllBusinessUnits(unit?: string | null): boolean {
  const value = (unit ?? '').trim();
  return value === '' || value === ALL_BUSINESS_UNITS || value === 'Semua';
}
