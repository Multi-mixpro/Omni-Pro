import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  ShieldAlert,
  Building2,
  Save,
  X,
} from 'lucide-react';
import { Shift, UnitType, Employee } from '../types';
import { useBusinessUnits, useEmployees, useShifts } from '../data/PresensiDataContext';

interface ShiftManagementViewProps {
  shifts: Shift[];
  onAddShift: (newShift: Shift) => void;
  onUpdateShift: (updatedShift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  employees: Employee[];
  onAssignShiftToEmployee: (employeeId: string, shiftId: string) => void;
}

export const ShiftManagementView: React.FC<ShiftManagementViewProps> = ({
  shifts,
  onAddShift,
  onUpdateShift,
  onDeleteShift,
  employees,
  onAssignShiftToEmployee,
}) => {
  // Data referensi nyata dari schema presensi (menggantikan konstanta mock).
  const BUSINESS_UNITS = useBusinessUnits();
  // Data referensi nyata dari schema presensi (menggantikan konstanta mock).
  const EMPLOYEES = useEmployees();
  // Data referensi nyata dari schema presensi (menggantikan konstanta mock).
  const SHIFTS = useShifts();
  const [selectedUnit, setSelectedUnit] = useState<UnitType>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  // Form State
  const [formUnitId, setFormUnitId] = useState<UnitType>('GG_SUPPLY');
  const [formName, setFormName] = useState('');
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('17:00');
  const [formTolerance, setFormTolerance] = useState(15);
  const [formDescription, setFormDescription] = useState('');

  // Assign Modal
  const [assigningEmpId, setAssigningEmpId] = useState<string | null>(null);
  const [assignShiftId, setAssignShiftId] = useState<string>('');

  const filteredShifts =
    selectedUnit === 'ALL'
      ? shifts
      : shifts.filter((s) => s.unitId === selectedUnit);

  const openCreateModal = () => {
    setEditingShift(null);
    setFormName('');
    setFormStartTime('08:00');
    setFormEndTime('17:00');
    setFormTolerance(15);
    setFormDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: Shift) => {
    setEditingShift(s);
    setFormUnitId(s.unitId);
    setFormName(s.name);
    setFormStartTime(s.startTime);
    setFormEndTime(s.endTime);
    setFormTolerance(s.toleranceMinutes);
    setFormDescription(s.description);
    setIsModalOpen(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingShift) {
      const updated: Shift = {
        ...editingShift,
        unitId: formUnitId,
        name: formName,
        startTime: formStartTime,
        endTime: formEndTime,
        toleranceMinutes: formTolerance,
        description: formDescription,
      };
      onUpdateShift(updated);
    } else {
      const newShift: Shift = {
        id: `SHIFT_${Date.now()}`,
        unitId: formUnitId,
        name: formName,
        startTime: formStartTime,
        endTime: formEndTime,
        toleranceMinutes: formTolerance,
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        description: formDescription,
      };
      onAddShift(newShift);
    }

    setIsModalOpen(false);
  };

  const handleSaveAssignment = () => {
    if (assigningEmpId && assignShiftId) {
      onAssignShiftToEmployee(assigningEmpId, assignShiftId);
      setAssigningEmpId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white/90 dark:bg-[#0f1a30] p-6 rounded-3xl border border-slate-200/90 dark:border-[#1a2847] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-cyan-300 border border-blue-200/60 dark:border-blue-800">
              Shift Scheduler
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Pengaturan Jam Kerja & Toleransi
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Kelola Jadwal Shift Jam Kerja
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Atur jam masuk, jam pulang, dan toleransi keterlambatan untuk setiap unit usaha.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Shift Baru</span>
        </button>
      </div>

      {/* Unit Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedUnit('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            selectedUnit === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white/80 dark:bg-[#0f1a30] text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-[#1a2847] hover:bg-slate-100 dark:hover:bg-[#152342]'
          }`}
        >
          Semua Shift Unit
        </button>
        {BUSINESS_UNITS.map((unit) => (
          <button
            key={unit.id}
            onClick={() => setSelectedUnit(unit.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedUnit === unit.id
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white/80 dark:bg-[#0f1a30] text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-[#1a2847] hover:bg-slate-100 dark:hover:bg-[#152342]'
            }`}
          >
            {unit.name}
          </button>
        ))}
      </div>

      {/* Shift Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShifts.map((s) => {
          const unit = BUSINESS_UNITS.find((u) => u.id === s.unitId);
          const assignedEmps = employees.filter((e) => e.shiftId === s.id);

          return (
            <div
              key={s.id}
              className="bg-white/90 dark:bg-[#0f1a30] rounded-3xl p-5 border border-slate-200/90 dark:border-[#1a2847] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-cyan-300 border border-blue-200/60 dark:border-blue-800">
                    {unit?.name || 'Unit'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a2847] transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteShift(s.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a2847] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {s.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 mb-4">
                  {s.description}
                </p>

                {/* Hours & Tolerance */}
                <div className="bg-slate-50/80 dark:bg-[#070e1b] p-3.5 rounded-2xl space-y-2 text-xs border border-slate-200/80 dark:border-[#1a2847] mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      Jam Operasional:
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {s.startTime} - {s.endTime} WIB
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400">Toleransi Late:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {s.toleranceMinutes} Menit Grace Period
                    </span>
                  </div>
                </div>

                {/* Assigned Employees */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      Karyawan Ditugaskan ({assignedEmps.length})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {assignedEmps.map((emp) => (
                      <span
                        key={emp.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      >
                        {emp.name}
                      </span>
                    ))}
                    {assignedEmps.length === 0 && (
                      <span className="text-[11px] text-slate-400 italic">
                        Belum ada karyawan ditugaskan
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Assign Action */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setAssignShiftId(s.id);
                    setAssigningEmpId(employees[0]?.id || null);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
                >
                  + Penugasan Shift Karyawan
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Shift */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingShift ? 'Edit Jadwal Shift' : 'Tambah Shift Jam Kerja Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Unit Usaha
                </label>
                <select
                  value={formUnitId}
                  onChange={(e) => setFormUnitId(e.target.value as UnitType)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="GG_SUPPLY">GG Supply (Logistik)</option>
                  <option value="GDSKUY">Gdskuy (Warehouse)</option>
                  <option value="BAKSO_UJO">Bakso Ujo (F&B / Outlet)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Shift
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Shift Pagi Warehouse"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Masuk
                  </label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Pulang
                  </label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Toleransi Keterlambatan (Menit)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={formTolerance}
                  onChange={(e) => setFormTolerance(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi / Keterangan Shift
                </label>
                <input
                  type="text"
                  placeholder="Keterangan singkat operasional"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  Simpan Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Assign Shift */}
      {assigningEmpId && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Penugasan Shift Ke Karyawan
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Karyawan
                </label>
                <select
                  value={assigningEmpId}
                  onChange={(e) => setAssigningEmpId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setAssigningEmpId(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveAssignment}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Tugaskan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
