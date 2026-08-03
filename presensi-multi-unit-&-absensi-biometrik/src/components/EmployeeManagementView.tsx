import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  Mail,
  Phone,
  Clock,
  ShieldCheck,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Camera,
  KeyRound,
  Lock,
  Unlock,
  Copy,
  Check,
  Send,
  RefreshCw,
  Smartphone,
  Share2,
  MessageCircle,
} from 'lucide-react';
import { Employee, Shift, UnitType } from '../types';
import { useBusinessUnits } from '../data/PresensiDataContext';
import { getWhatsAppLink, WA_TEMPLATES } from '../utils/whatsapp';

interface EmployeeManagementViewProps {
  employees: Employee[];
  shifts: Shift[];
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employeeId: string) => void;
  onSelectEmployeeForDetail: (employee: Employee) => void;
  selectedUnit: UnitType;
}

export const EmployeeManagementView: React.FC<EmployeeManagementViewProps> = ({
  employees = [],
  shifts = [],
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onSelectEmployeeForDetail,
  selectedUnit,
}) => {
  // Data referensi nyata dari schema presensi (menggantikan konstanta mock).
  const BUSINESS_UNITS = useBusinessUnits();
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState<UnitType>(selectedUnit);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State for Add / Edit Employee
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Modal State for Quick Credential Management
  const [credentialModalEmp, setCredentialModalEmp] = useState<Employee | null>(null);
  const [showModalPassword, setShowModalPassword] = useState(false);

  // Modal State for Bulk Credential Management
  const [isBulkCredentialModalOpen, setIsBulkCredentialModalOpen] = useState(false);
  const [bulkSearchTerm, setBulkSearchTerm] = useState('');

  // Toast / Copy notification
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Form State for Add / Edit Employee
  const [formData, setFormData] = useState({
    employeeCode: '',
    name: '',
    role: '',
    unitId: 'GG_SUPPLY' as Exclude<UnitType, 'ALL'>,
    email: '',
    phone: '',
    shiftId: '',
    faceRegistered: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    username: '',
    password: '',
    portalAccessEnabled: true,
  });

  const [showFormPassword, setShowFormPassword] = useState(false);

  const triggerCopied = (text: string) => {
    setCopiedNotice(text);
    setTimeout(() => {
      setCopiedNotice(null);
    }, 2500);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.username && emp.username.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesUnit = unitFilter === 'ALL' ? true : emp.unitId === unitFilter;
    const matchesStatus = statusFilter === 'ALL' ? true : emp.status === statusFilter;

    return matchesSearch && matchesUnit && matchesStatus;
  });

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `PASS@${rand}`;
  };

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    const code = `EMP_${Math.floor(100 + Math.random() * 900)}`;
    setFormData({
      employeeCode: code,
      name: '',
      role: '',
      unitId: unitFilter === 'ALL' ? 'GG_SUPPLY' : (unitFilter as any),
      email: '',
      phone: '0812-',
      shiftId: shifts[0]?.id || '',
      faceRegistered: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      username: '',
      password: generateRandomPassword(),
      portalAccessEnabled: true,
    });
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      employeeCode: emp.employeeCode,
      name: emp.name,
      role: emp.role,
      unitId: emp.unitId,
      email: emp.email,
      phone: emp.phone,
      shiftId: emp.shiftId,
      faceRegistered: emp.faceRegistered,
      avatar: emp.avatar,
      username: emp.username || emp.name.toLowerCase().replace(/\s+/g, '.'),
      password: emp.password || generateRandomPassword(),
      portalAccessEnabled: emp.portalAccessEnabled !== false,
    });
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role) return;

    const usernameFinal =
      formData.username.trim() ||
      formData.name.toLowerCase().replace(/[^a-z0-9]/g, '.');

    if (editingEmployee) {
      const updated: Employee = {
        ...editingEmployee,
        ...formData,
        username: usernameFinal,
      };
      onUpdateEmployee(updated);
      triggerCopied(`Data & kredensial ${updated.name} berhasil diperbarui.`);
    } else {
      const newEmp: Employee = {
        id: `EMP_${Date.now()}`,
        ...formData,
        username: usernameFinal,
        registeredDate: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
      };
      onAddEmployee(newEmp);
      triggerCopied(`Karyawan baru ${newEmp.name} ditambahkan dengan Username: @${newEmp.username}`);
    }

    setIsModalOpen(false);
  };

  const handleSaveCredentialQuickModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialModalEmp) return;

    onUpdateEmployee(credentialModalEmp);
    triggerCopied(`Kredensial login @${credentialModalEmp.username} berhasil disimpan.`);
    setCredentialModalEmp(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerCopied(`${label} tersalin ke clipboard!`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {copiedNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-blue-600 px-4 py-3 rounded-2xl shadow-xl border border-slate-700/80 flex items-center gap-2.5 text-xs font-bold animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copiedNotice}</span>
        </div>
      )}

      {/* iOS Styled Top Banner */}
      <div className="bg-white/90 dark:bg-[#0f1a30] rounded-3xl p-6 border border-slate-200/90 dark:border-[#1a2847] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-cyan-300">
              Sistem Kelola Karyawan
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1">
              <KeyRound className="w-3 h-3" />
              Pengaturan Username & Password Absen
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1.5">
            Direktori Tim & Akses Portal Karyawan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola profil karyawan, tautkan shift kerja, atur Username & Password akun absen mobile, serta kontrol hak akses portal self-service.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          <button
            onClick={() => setIsBulkCredentialModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#1a2847] hover:bg-slate-200 dark:hover:bg-[#25375c] text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-[#25375c] transition-all shrink-0"
          >
            <KeyRound className="w-4 h-4 text-indigo-500" />
            <span>Kelola Kredensial Tim</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Karyawan Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white/90 dark:bg-[#0f1a30] p-4 rounded-3xl border border-slate-200/90 dark:border-[#1a2847] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, NIK, username absen, jabatan, atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl border border-slate-200 dark:border-[#1a2847] bg-slate-50 dark:bg-[#070e1b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Business Unit Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setUnitFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                unitFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-slate-50 dark:bg-[#070e1b] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#1a2847] hover:bg-slate-100 dark:hover:bg-[#152342]'
              }`}
            >
              Semua Unit ({employees.length})
            </button>

            {BUSINESS_UNITS.map((u) => {
              const count = employees.filter((e) => e.unitId === u.id).length;
              return (
                <button
                  key={u.id}
                  onClick={() => setUnitFilter(u.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    unitFilter === u.id
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'bg-slate-50 dark:bg-[#070e1b] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#1a2847] hover:bg-slate-100 dark:hover:bg-[#152342]'
                  }`}
                >
                  {u.name} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Employee Cards Grid (iOS Card Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => {
          const empShift = shifts.find((s) => s.id === emp.shiftId);
          const usernameVal = emp.username || emp.name.toLowerCase().replace(/\s+/g, '.');
          const portalEnabled = emp.portalAccessEnabled !== false;

          return (
            <div
              key={emp.id}
              className="bg-white/90 dark:bg-[#0f1a30] rounded-3xl p-5 border border-slate-200/90 dark:border-[#1a2847] shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header Profile Row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/20 group-hover:scale-105 transition-transform"
                    />
                    <div>
                      <button
                        onClick={() => onSelectEmployeeForDetail(emp)}
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left transition-colors flex items-center gap-1.5"
                      >
                        <span>{emp.name}</span>
                        <Eye className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {emp.role}
                      </p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                        NIK: {emp.employeeCode}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      emp.unitId === 'GG_SUPPLY'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : emp.unitId === 'GUDSKUY'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {emp.unitId.replace('_', ' ')}
                  </span>
                </div>

                {/* Credential Spotlight Card */}
                <div className="mb-3 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase">
                        Username Login Absen
                      </p>
                      <p className="font-bold text-slate-800 dark:text-slate-100 font-mono">
                        @{usernameVal}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowModalPassword(false);
                      setCredentialModalEmp(emp);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-[10px] border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3 text-emerald-500" />
                    <span>Atur Credential</span>
                  </button>
                </div>

                {/* Details list */}
                <div className="space-y-2 py-2.5 border-t border-b border-slate-100 dark:border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      Shift Kerja:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {empShift ? empShift.name : 'Shift Belum Set'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                      Akses Portal Absen:
                    </span>
                    <span
                      className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                        portalEnabled
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {portalEnabled ? '✓ Portal Aktif' : '✕ Nonaktif'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Camera className="w-3.5 h-3.5 text-emerald-500" />
                      Biometrik Wajah:
                    </span>
                    <span
                      className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                        emp.faceRegistered
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {emp.faceRegistered ? '✓ Terdaftar' : 'Belum Scan'}
                    </span>
                  </div>

                  {/* WhatsApp Direct Contact Button */}
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      No. WhatsApp:
                    </span>
                    <a
                      href={getWhatsAppLink(emp.phone, `Halo ${emp.name}, ini pesan resmi dari Tim HR & Management Presensi.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] hover:bg-emerald-200 dark:hover:bg-emerald-900 transition flex items-center gap-1"
                      title="Klik untuk membuka chat WhatsApp (wa.me)"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{emp.phone || 'Formati No'}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Bottom Card Action Footer */}
              <div className="mt-4 pt-2 flex items-center justify-between">
                <button
                  onClick={() => onSelectEmployeeForDetail(emp)}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Lihat Tabel Kehadiran</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setShowModalPassword(false);
                      setCredentialModalEmp(emp);
                    }}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Pengaturan Password / PIN Absen"
                  >
                    <KeyRound className="w-4 h-4 text-indigo-500" />
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(emp)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit Profil Karyawan"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteEmployee(emp.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Hapus Karyawan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal 1: Add / Edit Employee Dialog (Including Credential Settings) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                {editingEmployee ? 'Edit Profil & Credential Karyawan' : 'Tambah Karyawan Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Rizky"
                  value={formData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    const autoUser = newName.toLowerCase().replace(/[^a-z0-9]/g, '.');
                    setFormData({
                      ...formData,
                      name: newName,
                      username: formData.username || autoUser,
                    });
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NIK / Kode Karyawan
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unit Usaha
                  </label>
                  <select
                    value={formData.unitId}
                    onChange={(e) =>
                      setFormData({ ...formData, unitId: e.target.value as any })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="GG_SUPPLY">GG Supply</option>
                    <option value="GUDSKUY">Gudskuy</option>
                    <option value="BAKSO_UJO">Bakso Ujo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jabatan / Role
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kurir / Admin"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Shift Kerja
                  </label>
                  <select
                    value={formData.shiftId}
                    onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="karyawan@perusahaan.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Dedicated Credential Section */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300 text-xs">
                    <KeyRound className="w-4 h-4 text-indigo-600" />
                    <span>Akun Login Portal Absen Mobile</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Gunakan untuk login halaman karyawan</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Username Absen
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                      <input
                        type="text"
                        required
                        placeholder="username.karyawan"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full pl-7 pr-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">
                        Password / PIN Absen
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, password: generateRandomPassword() })
                        }
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Acak
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showFormPassword ? 'text' : 'password'}
                        required
                        placeholder="Password login..."
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        {showFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="portalAccess"
                    checked={formData.portalAccessEnabled}
                    onChange={(e) =>
                      setFormData({ ...formData, portalAccessEnabled: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="portalAccess"
                    className="font-semibold text-slate-800 dark:text-slate-200 text-xs"
                  >
                    Aktifkan Hak Akses Login Portal & Mobile Absensi
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="faceReg"
                  checked={formData.faceRegistered}
                  onChange={(e) =>
                    setFormData({ ...formData, faceRegistered: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label
                  htmlFor="faceReg"
                  className="font-semibold text-slate-800 dark:text-slate-200"
                >
                  Registrasi Biometrik Pindaian Wajah Aktif
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  Simpan Data Karyawan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Quick Credential & Password Manager for Single Employee */}
      {credentialModalEmp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Kelola Username & Password
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Akses portal absen {credentialModalEmp.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCredentialModalEmp(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* Profile Brief */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <img
                src={credentialModalEmp.avatar}
                alt={credentialModalEmp.name}
                className="w-11 h-11 rounded-xl object-cover ring-2 ring-blue-500/20"
              />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  {credentialModalEmp.name}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {credentialModalEmp.role} • NIK: {credentialModalEmp.employeeCode}
                </p>
                <span className="inline-block mt-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  Unit: {credentialModalEmp.unitId.replace('_', ' ')}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveCredentialQuickModal} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Username Login Portal Absen
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                  <input
                    type="text"
                    required
                    value={credentialModalEmp.username || ''}
                    onChange={(e) =>
                      setCredentialModalEmp({
                        ...credentialModalEmp,
                        username: e.target.value,
                      })
                    }
                    className="w-full pl-8 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(`@${credentialModalEmp.username}`, 'Username')
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title="Salin Username"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Password / PIN Absen
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCredentialModalEmp({
                        ...credentialModalEmp,
                        password: generateRandomPassword(),
                      })
                    }
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset Password
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    required
                    value={credentialModalEmp.password || ''}
                    onChange={(e) =>
                      setCredentialModalEmp({
                        ...credentialModalEmp,
                        password: e.target.value,
                      })
                    }
                    className="w-full pl-3 pr-16 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-bold"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      title="Lihat / Sembunyikan Password"
                    >
                      {showModalPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(credentialModalEmp.password || '', 'Password')
                      }
                      className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      title="Salin Password"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Toggle Access */}
              <div className="flex items-center justify-between p-3 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs">
                    Status Akses Portal
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Izinkan karyawan login ke aplikasi mobile & web
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCredentialModalEmp({
                      ...credentialModalEmp,
                      portalAccessEnabled: credentialModalEmp.portalAccessEnabled === false ? true : false,
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    credentialModalEmp.portalAccessEnabled !== false
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {credentialModalEmp.portalAccessEnabled !== false ? 'Aktif' : 'Non-Aktif'}
                </button>
              </div>

              {/* Action helper buttons */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `Halo ${credentialModalEmp.name},\nBerikut data akun portal absen Anda:\nUsername: @${credentialModalEmp.username}\nPassword: ${credentialModalEmp.password}\nSilakan login pada aplikasi absensi multi-unit.`;
                    copyToClipboard(text, 'Info Kredensial Lengkap');
                  }}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Salin Format WA</span>
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCredentialModalEmp(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
                >
                  Simpan Kredensial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Bulk Team Credential Directory */}
      {isBulkCredentialModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[85vh] p-6 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Direktori Username & Password Karyawan Multi-Unit
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Daftar akun login portal absensi karyawan. Manajemen kredensial terpusat untuk HR & Supervisor.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkCredentialModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Search filter in bulk modal */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari karyawan, NIK, atau username..."
                  value={bulkSearchTerm}
                  onChange={(e) => setBulkSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={() => {
                  const bulkSummary = employees
                    .map(
                      (e) =>
                        `• ${e.name} (${e.employeeCode}) - Username: @${e.username || e.name.toLowerCase().replace(/\s+/g, '.')} | Password: ${e.password || 'PASS@2026'}`
                    )
                    .join('\n');
                  copyToClipboard(bulkSummary, 'Rekap Kredensial Semua Karyawan');
                }}
                className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
              >
                <Copy className="w-4 h-4" />
                <span>Salin Rekap Semua Kredensial</span>
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200/80 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0 backdrop-blur-md">
                    <th className="p-3.5">Karyawan</th>
                    <th className="p-3.5">Unit Usaha</th>
                    <th className="p-3.5">Username Portal</th>
                    <th className="p-3.5">Password / PIN</th>
                    <th className="p-3.5 text-center">Status Portal</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {employees
                    .filter(
                      (e) =>
                        e.name.toLowerCase().includes(bulkSearchTerm.toLowerCase()) ||
                        e.employeeCode.toLowerCase().includes(bulkSearchTerm.toLowerCase()) ||
                        (e.username && e.username.toLowerCase().includes(bulkSearchTerm.toLowerCase()))
                    )
                    .map((emp) => {
                      const uname = emp.username || emp.name.toLowerCase().replace(/\s+/g, '.');
                      const pwd = emp.password || 'PASS@2026';
                      const active = emp.portalAccessEnabled !== false;

                      return (
                        <tr
                          key={emp.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={emp.avatar}
                                alt={emp.name}
                                className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                              />
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">
                                  {emp.name}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  NIK: {emp.employeeCode}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {emp.unitId.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                            @{uname}
                          </td>

                          <td className="p-3.5 font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {pwd}
                          </td>

                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                active
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {active ? 'Aktif' : 'Non-aktif'}
                            </span>
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setIsBulkCredentialModalOpen(false);
                                  setShowModalPassword(true);
                                  setCredentialModalEmp(emp);
                                }}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors font-bold text-xs"
                                title="Edit Credential Individual"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end shrink-0">
              <button
                onClick={() => setIsBulkCredentialModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
