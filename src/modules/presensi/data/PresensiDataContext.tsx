/**
 * Sumber data referensi Presensi (unit, shift, karyawan).
 *
 * Sebelumnya komponen mengimpor konstanta BUSINESS_UNITS/SHIFTS/EMPLOYEES dari
 * data/mockData.ts, sehingga tampilan selalu menunjukkan data contoh apa pun
 * isi database. Context ini menyalurkan data nyata yang dimuat App dari schema
 * `presensi`, tanpa perlu mengoper props melewati banyak lapis komponen.
 */

import React, { createContext, useContext } from 'react';
import type { BusinessUnit, Employee, Shift } from '../types';

export interface PresensiReferenceData {
  businessUnits: BusinessUnit[];
  shifts: Shift[];
  employees: Employee[];
}

const PresensiDataContext = createContext<PresensiReferenceData>({
  businessUnits: [],
  shifts: [],
  employees: [],
});

export function PresensiDataProvider({
  value,
  children,
}: {
  value: PresensiReferenceData;
  children: React.ReactNode;
}) {
  return (
    <PresensiDataContext.Provider value={value}>
      {children}
    </PresensiDataContext.Provider>
  );
}

/** Seluruh data referensi yang sedang aktif. */
export function usePresensiData(): PresensiReferenceData {
  return useContext(PresensiDataContext);
}

/** Daftar unit bisnis nyata — pengganti konstanta BUSINESS_UNITS. */
export function useBusinessUnits(): BusinessUnit[] {
  return useContext(PresensiDataContext).businessUnits;
}

/** Daftar shift nyata — pengganti konstanta SHIFTS. */
export function useShifts(): Shift[] {
  return useContext(PresensiDataContext).shifts;
}

/** Daftar karyawan nyata — pengganti konstanta EMPLOYEES. */
export function useEmployees(): Employee[] {
  return useContext(PresensiDataContext).employees;
}
