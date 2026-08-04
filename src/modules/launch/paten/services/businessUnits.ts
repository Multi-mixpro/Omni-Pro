/**
 * Product Launch OS 3.0 - Dynamic Business Units Storage & Management
 */

export interface BusinessUnitItem {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'Aktif Utama' | 'Aktif';
}

export const INITIAL_BUSINESS_UNITS: BusinessUnitItem[] = [
  { id: 'bu-1', name: 'GUDSKUY', code: 'GUDSKUY', description: 'Unit Bisnis utama koleksi streetwear & merchandise.', status: 'Aktif Utama' },
  { id: 'bu-2', name: 'GG Supply', code: 'GG_SUPPLY', description: 'Unit Bisnis divisi supply, apparel & manufacturing.', status: 'Aktif Utama' },
  { id: 'bu-3', name: 'Mainline Studio', code: 'MAINLINE', description: 'Unit Bisnis studio rilis lini utama.', status: 'Aktif' },
  { id: 'bu-4', name: 'Streetwear Co', code: 'STREETWEAR', description: 'Lini koleksi spesialis streetwear.', status: 'Aktif' },
  { id: 'bu-5', name: 'Activewear Lab', code: 'ACTIVEWEAR', description: 'Lini koleksi sportswear & activewear.', status: 'Aktif' },
];

/** Nilai sentinel untuk filter "tampilkan semua unit bisnis". */
export const ALL_BUSINESS_UNITS = 'Semua Unit Bisnis';

/**
 * True bila filter unit sedang dalam mode "tampilkan semua".
 *
 * Dipakai di beberapa tempat (App, Pipeline, Dashboard) supaya artikel tidak
 * hilang saat unit aktif = "Semua Unit Bisnis". Juga menerima 'Semua' lama dan
 * nilai kosong agar aman terhadap data/preferensi lama.
 */
export function isAllBusinessUnits(unit?: string | null): boolean {
  const value = (unit ?? '').trim();
  return value === '' || value === ALL_BUSINESS_UNITS || value === 'Semua';
}

const STORAGE_KEY = 'launch_os_business_units_v1';

export function loadStoredBusinessUnits(): BusinessUnitItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load stored business units:', err);
  }
  return INITIAL_BUSINESS_UNITS;
}

export function saveStoredBusinessUnits(units: BusinessUnitItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
  } catch (err) {
    console.warn('Failed to save business units:', err);
  }
}
