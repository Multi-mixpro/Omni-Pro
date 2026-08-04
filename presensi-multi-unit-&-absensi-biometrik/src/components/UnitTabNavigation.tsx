import React from 'react';
import { Truck, Warehouse, Utensils, Layers, MapPin, Settings2 } from 'lucide-react';
import { UnitType, AttendanceRecord, BusinessUnit } from '../types';

import { useBusinessUnits } from '../data/PresensiDataContext';

interface UnitTabNavigationProps {
  selectedUnit: UnitType;
  onSelectUnit: (unit: UnitType) => void;
  todayRecords: AttendanceRecord[];
  units?: BusinessUnit[];
  onOpenUnitConfig?: () => void;
}

export const UnitTabNavigation: React.FC<UnitTabNavigationProps> = ({
  selectedUnit,
  onSelectUnit,
  todayRecords,
  units: unitsProp,
  onOpenUnitConfig,
}) => {
  // Data referensi nyata dari schema presensi (menggantikan konstanta mock).
  const BUSINESS_UNITS = useBusinessUnits();
  const rawUnits = unitsProp ?? BUSINESS_UNITS;
  const units = rawUnits.filter((u, index, self) => index === self.findIndex((t) => t.id === u.id));
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Truck':
        return Truck;
      case 'Warehouse':
        return Warehouse;
      case 'Utensils':
        return Utensils;
      default:
        return Layers;
    }
  };

  const getUnitMetrics = (unitId: UnitType) => {
    const records =
      unitId === 'ALL'
        ? todayRecords
        : todayRecords.filter((r) => r.unitId === unitId);

    const hadir = records.filter((r) => r.status === 'HADIR' || r.status === 'TERLAMBAT').length;
    const terlambat = records.filter((r) => r.status === 'TERLAMBAT').length;
    const alpha = records.filter((r) => r.status === 'ALPHA').length;
    return { hadir, terlambat, alpha, totalRecords: records.length };
  };

  return (
    <div className="bg-slate-100 dark:bg-[#091224] border-b border-slate-200 dark:border-[#182847] py-2.5 px-4 sm:px-6 lg:px-8 w-full transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Business Unit Pill Tabs Container */}
        <div className="overflow-x-auto no-scrollbar w-full sm:w-auto">
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/90 dark:bg-[#071126] border border-slate-200/90 dark:border-[#1a2d54]">
            {/* All Units Tab */}
            <button
              onClick={() => onSelectUnit('ALL')}
              className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 whitespace-nowrap ${
                selectedUnit === 'ALL'
                  ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm shadow-blue-500/25'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-[#0f1d3a]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua Unit Usaha</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  selectedUnit === 'ALL'
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-cyan-300 border border-blue-200/50 dark:border-blue-800'
                }`}
              >
                {getUnitMetrics('ALL').hadir}
              </span>
            </button>

            {/* Individual Business Units */}
            {units.map((unit) => {
              const Icon = getIcon(unit.iconName);
              const isSelected = selectedUnit === unit.id;
              const metrics = getUnitMetrics(unit.id);

              return (
                <button
                  key={unit.id}
                  onClick={() => onSelectUnit(unit.id)}
                  className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 whitespace-nowrap ${
                    isSelected
                      ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm shadow-blue-500/25'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-[#0f1d3a]'
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: unit.color }}
                  />
                  <Icon className="w-3.5 h-3.5" />
                  <span>{unit.name}</span>

                  <div className="flex items-center gap-1">
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-[#172542] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {metrics.hadir}/{unit.totalEmployees}
                    </span>

                    {metrics.alpha > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Peringatan Ketidakhadiran!" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Unit Tagline & Quick Config Action Button */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {selectedUnit === 'ALL'
                ? `Monitoring gabungan ${units.length} divisi (${units.reduce((s, u) => s + (u.totalEmployees || 0), 0)} Karyawan Total)`
                : units.find((u) => u.id === selectedUnit)?.tagline}
            </span>
          </div>

          {onOpenUnitConfig && (
            <button
              onClick={onOpenUnitConfig}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all shrink-0"
              title="Atur Alamat, GPS Lat-Lng, Radius Geofence, & Wi-Fi Unit"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Kelola Geofence & Unit</span>
              <Settings2 className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
