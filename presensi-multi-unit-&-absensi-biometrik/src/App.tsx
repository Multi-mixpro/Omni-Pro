import React, { useState, useEffect } from 'react';
import { Topbar } from './components/Topbar';
import { UnitTabNavigation } from './components/UnitTabNavigation';
import { MonitoringDashboard } from './components/MonitoringDashboard';
import { AttendanceTableModal } from './components/AttendanceTableModal';
import { MobileAttendanceSimulator } from './components/MobileAttendanceSimulator';
import { ShiftManagementView } from './components/ShiftManagementView';
import { EmployeeManagementView } from './components/EmployeeManagementView';
import { EmployeeDetailModal } from './components/EmployeeDetailModal';
import { AnalyticsDashboardView } from './components/AnalyticsDashboardView';
import { SecurityAudit2FAView } from './components/SecurityAudit2FAView';
import { PayrollApiView } from './components/PayrollApiView';
import { NotificationCenter } from './components/NotificationCenter';
import { UnitConfigurationModal } from './components/UnitConfigurationModal';
import { LoginPage } from './components/LoginPage';
import { EmployeeAttendancePortal } from './components/EmployeeAttendancePortal';

import {
  UnitType,
  AttendanceRecord,
  Shift,
  Employee,
  SuddenAbsenceAlert,
  AuditLog,
  NotificationItem,
  AttendanceStatus,
  BusinessUnit,
} from './types';

import { presensiRepository } from './data/presensiRepository';
import { PresensiDataProvider } from './data/PresensiDataContext';

export default function App() {
  // User Authentication & Session State
  const [currentUser, setCurrentUser] = useState<{
    role: 'ADMIN' | 'EMPLOYEE';
    employee?: Employee;
    adminName?: string;
  } | null>(null);

  // Navigation & Theme (Default light mode for iOS clean style)
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedUnit, setSelectedUnit] = useState<UnitType>('ALL');
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Date Selection
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // App Core State — seluruhnya diisi dari database, bukan data contoh.
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [alerts, setAlerts] = useState<SuddenAbsenceAlert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(true);

  // Modals & Panels
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isUnitConfigModalOpen, setIsUnitConfigModalOpen] = useState<boolean>(false);

  // Employee Detail Modal State
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<Employee | null>(null);
  const [isEmployeeDetailModalOpen, setIsEmployeeDetailModalOpen] = useState<boolean>(false);

  const handleOpenEmployeeDetailByCode = (employeeCode: string) => {
    const foundEmp = employees.find((e) => e.employeeCode === employeeCode || e.id === employeeCode);
    if (foundEmp) {
      setSelectedEmployeeForDetail(foundEmp);
      setIsEmployeeDetailModalOpen(true);
    } else {
      // Fallback: create temporary employee profile from attendance records if needed
      const rec = records.find((r) => r.employeeCode === employeeCode);
      if (rec) {
        const tempEmp: Employee = {
          id: rec.employeeId,
          employeeCode: rec.employeeCode,
          name: rec.employeeName,
          unitId: rec.unitId,
          shiftId: 'SHIFT_01',
          role: 'Karyawan Staff',
          email: `${rec.employeeName.toLowerCase().replace(/\s+/g, '.')}@company.com`,
          phone: '+62 812-3456-7890',
          faceRegistered: rec.faceMatchScore > 0,
          registeredDate: '2024-01-15',
          status: 'ACTIVE',
          avatar: rec.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        };
        setSelectedEmployeeForDetail(tempEmp);
        setIsEmployeeDetailModalOpen(true);
      }
    }
  };

  // Dark Mode Class Management
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Muat data nyata dari schema `presensi`. Tidak ada data contoh: layar akan
  // kosong sampai unit, shift, dan karyawan benar-benar didaftarkan.
  useEffect(() => {
    let active = true;

    (async () => {
      setIsLoadingData(true);
      setDataError(null);

      const [unitRes, shiftRes, employeeRes, recordRes] = await Promise.all([
        presensiRepository.listUnits(),
        presensiRepository.listShifts(),
        presensiRepository.listEmployees(),
        presensiRepository.listAttendance(),
      ]);

      if (!active) return;

      const firstError =
        unitRes.error || shiftRes.error || employeeRes.error || recordRes.error;
      if (firstError) setDataError(firstError);

      setBusinessUnits(unitRes.data);
      setShifts(shiftRes.data);
      setEmployees(employeeRes.data);
      setRecords(recordRes.data);
      setIsLoadingData(false);
    })();

    return () => { active = false; };
  }, []);

  // Record Update Handler
  const handleUpdateRecordStatus = (
    recordId: string,
    newStatus: AttendanceStatus,
    notes?: string
  ) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId ? { ...r, status: newStatus, notes: notes || r.notes } : r
      )
    );

    // Add Audit Log
    const targetRecord = records.find((r) => r.id === recordId);
    if (targetRecord) {
      const newLog: AuditLog = {
        id: `LOG_${Date.now()}`,
        timestamp: new Date().toLocaleString('id-ID'),
        userId: 'USR_ADMIN_01',
        userName: 'Manager Utama',
        userRole: 'General Manager',
        unitId: targetRecord.unitId,
        action: `Koreksi Status Presensi (${targetRecord.employeeName})`,
        category: 'ATTENDANCE',
        ipAddress: '182.253.12.98',
        device: 'Web Console',
        details: `Status diubah dari ${targetRecord.status} menjadi ${newStatus}. Catatan: ${
          notes || 'None'
        }`,
        status: 'SUCCESS',
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    }
  };

  // Clock In Success Handler from Mobile Simulator
  const handleClockInSuccess = (newRecord: AttendanceRecord) => {
    setRecords((prev) => [newRecord, ...prev]);

    // Audit Log
    const newLog: AuditLog = {
      id: `LOG_${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      userId: newRecord.employeeId,
      userName: newRecord.employeeName,
      userRole: 'Karyawan',
      unitId: newRecord.unitId,
      action: 'Clock In Mobile',
      category: 'ATTENDANCE',
      ipAddress: '36.85.120.44',
      device: 'Mobile Web App',
      details: `Presensi Masuk via Face Scan (${newRecord.faceMatchScore}%) & Geofence (${newRecord.distanceMeters}m)`,
      status: newRecord.status === 'HADIR' ? 'SUCCESS' : 'WARNING',
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    // Notification
    const newNotif: NotificationItem = {
      id: `NOTIF_${Date.now()}`,
      timestamp: 'Baru saja',
      title: '✅ Presensi Baru Tercatat',
      message: `${newRecord.employeeName} (${newRecord.unitId.replace(
        '_',
        ' '
      )}) clock-in pukul ${newRecord.checkInTime} WIB.`,
      type: 'SUCCESS',
      unitId: newRecord.unitId,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Shift Management Handlers
  const handleAddShift = (newShift: Shift) => {
    setShifts((prev) => [...prev, newShift]);
  };

  const handleUpdateShift = (updatedShift: Shift) => {
    setShifts((prev) => prev.map((s) => (s.id === updatedShift.id ? updatedShift : s)));
  };

  const handleDeleteShift = (shiftId: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
  };

  // Employee Management Handlers
  const handleAddEmployee = (newEmp: Employee) => {
    setEmployees((prev) => [newEmp, ...prev]);
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    setEmployees((prev) => prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)));
  };

  const handleDeleteEmployee = (employeeId: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
  };

  const handleAssignShiftToEmployee = (employeeId: string, shiftId: string) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === employeeId ? { ...e, shiftId } : e))
    );
  };

  // Sudden Absence Handlers
  const handleSendPushAlert = (alert: SuddenAbsenceAlert) => {
    const newNotif: NotificationItem = {
      id: `PUSH_${Date.now()}`,
      timestamp: 'Baru saja',
      title: '🚨 Push Notification Terkirim!',
      message: `Peringatan ketidakhadiran mendadak dikirim ke HP ${alert.employeeName} (${alert.unitName}).`,
      type: 'ALERT',
      unitId: alert.unitId,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setIsNotifDrawerOpen(true);
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // Trigger simulated sudden absence test
  const handleTestTriggerPush = () => {
    const newAlert: SuddenAbsenceAlert = {
      id: `ALERT_${Date.now()}`,
      employeeId: 'EMP_GG_04',
      employeeName: 'Rian Hidayat',
      unitId: 'GG_SUPPLY',
      unitName: 'GG Supply',
      shiftName: 'Shift Pagi Distribusi',
      scheduledTime: '07:30 WIB',
      detectedAt: 'Sekarang',
      status: 'UNEXPLAINED',
      severity: 'HIGH',
      notifiedVia: ['PUSH', 'EMAIL'],
    };
    setAlerts((prev) => [newAlert, ...prev]);

    const newNotif: NotificationItem = {
      id: `TEST_PUSH_${Date.now()}`,
      timestamp: 'Baru saja',
      title: '🚨 ALERT KETIDAKHADIRAN MENDADAK',
      message: 'Rian Hidayat (GG Supply) terdeteksi belum clock-in jam 07:30 WIB.',
      type: 'ALERT',
      unitId: 'GG_SUPPLY',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Business Unit Configuration Handler
  const handleUpdateUnit = (updatedUnit: BusinessUnit) => {
    setBusinessUnits((prev) =>
      prev.map((u) => (u.id === updatedUnit.id ? updatedUnit : u))
    );

    // Audit Log
    const newLog: AuditLog = {
      id: `LOG_${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      userId: 'USR_ADMIN_01',
      userName: 'Manager Utama',
      userRole: 'General Manager',
      unitId: updatedUnit.id,
      action: `Update Lokasi & Geofence Unit (${updatedUnit.name})`,
      category: 'SECURITY',
      ipAddress: '182.253.12.98',
      device: 'Web Console',
      details: `Koordinat GPS diubah ke (${updatedUnit.latitude}, ${updatedUnit.longitude}), Radius Geofence: ${updatedUnit.radiusMeters}m, Alamat: ${updatedUnit.address}`,
      status: 'SUCCESS',
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    // Notification
    const newNotif: NotificationItem = {
      id: `NOTIF_UNIT_${Date.now()}`,
      timestamp: 'Baru saja',
      title: '📍 Konfigurasi Geofence Diperbarui',
      message: `Titik koordinat (${updatedUnit.latitude}, ${updatedUnit.longitude}) & radius ${updatedUnit.radiusMeters}m untuk ${updatedUnit.name} telah diperbarui.`,
      type: 'INFO',
      unitId: updatedUnit.id,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  // Data referensi disalurkan lewat context agar komponen memakai isi database,
  // bukan konstanta contoh seperti sebelumnya.
  const referenceData = { businessUnits, shifts, employees };

  // 1. Unauthenticated View -> Show Login Page
  if (!currentUser) {
    return (
      <LoginPage
        employees={employees}
        businessUnits={businessUnits}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />
    );
  }

  // 2. Employee View -> Show Dedicated & Isolated Attendance Portal (No Admin Navigation Tabs)
  if (currentUser.role === 'EMPLOYEE' && currentUser.employee) {
    return (
      <EmployeeAttendancePortal
        employee={currentUser.employee}
        units={businessUnits}
        shifts={shifts}
        records={records}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onClockInSuccess={handleClockInSuccess}
        onLogout={() => setCurrentUser(null)}
      />
    );
  }

  // 3. Admin / Manager View -> Show Full Executive Management Dashboard
  return (
    <PresensiDataProvider value={referenceData}>
    <div
      className={`min-h-screen ${
        darkMode
          ? 'dark bg-[#070e1b] text-slate-100'
          : 'bg-slate-50 text-slate-800'
      } font-sans flex flex-col w-full transition-colors duration-300`}
    >
      {/* Top Header & Integrated Navigation Tabs */}
      <Topbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        unreadCount={unreadNotifCount}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        is2FAEnabled={is2FAEnabled}
        onLogout={() => setCurrentUser(null)}
      />

      {/* Business Unit Selector Sub-Nav */}
      <UnitTabNavigation
        selectedUnit={selectedUnit}
        onSelectUnit={setSelectedUnit}
        todayRecords={records}
        units={businessUnits}
        onOpenUnitConfig={() => setIsUnitConfigModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {activeTab === 'dashboard' && (
          <MonitoringDashboard
            selectedUnit={selectedUnit}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            records={records}
            alerts={alerts}
            onOpenTableModal={() => setIsTableModalOpen(true)}
            onSendPushAlert={handleSendPushAlert}
            onResolveAlert={handleResolveAlert}
            onOpenMobilePresensi={() => setActiveTab('mobile_presensi')}
            onSelectEmployeeForDetail={handleOpenEmployeeDetailByCode}
          />
        )}

        {activeTab === 'karyawan' && (
          <EmployeeManagementView
            employees={employees}
            shifts={shifts}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onSelectEmployeeForDetail={(emp) => {
              setSelectedEmployeeForDetail(emp);
              setIsEmployeeDetailModalOpen(true);
            }}
            selectedUnit={selectedUnit}
          />
        )}

        {activeTab === 'mobile_presensi' && (
          <MobileAttendanceSimulator
            onClockInSuccess={handleClockInSuccess}
            selectedUnit={selectedUnit}
            units={businessUnits}
          />
        )}

        {activeTab === 'shifts' && (
          <ShiftManagementView
            shifts={shifts}
            onAddShift={handleAddShift}
            onUpdateShift={handleUpdateShift}
            onDeleteShift={handleDeleteShift}
            employees={employees}
            onAssignShiftToEmployee={handleAssignShiftToEmployee}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboardView
            records={records}
            selectedUnit={selectedUnit}
          />
        )}

        {activeTab === 'security' && (
          <SecurityAudit2FAView
            auditLogs={auditLogs}
            is2FAEnabled={is2FAEnabled}
            onToggle2FA={setIs2FAEnabled}
          />
        )}

        {activeTab === 'payroll_api' && (
          <PayrollApiView records={records} />
        )}
      </main>

      {/* Detailed Rekapitulasi Table Modal */}
      <AttendanceTableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        records={records}
        selectedUnit={selectedUnit}
        onUpdateRecordStatus={handleUpdateRecordStatus}
        onSelectEmployeeForDetail={handleOpenEmployeeDetailByCode}
      />

      {/* Individual Employee Attendance Detail Modal */}
      <EmployeeDetailModal
        employee={selectedEmployeeForDetail}
        attendanceRecords={records}
        shifts={shifts}
        isOpen={isEmployeeDetailModalOpen}
        onClose={() => setIsEmployeeDetailModalOpen(false)}
        onUpdateRecordStatus={handleUpdateRecordStatus}
      />

      {/* Business Unit & Geofence Location Configuration Modal */}
      <UnitConfigurationModal
        isOpen={isUnitConfigModalOpen}
        onClose={() => setIsUnitConfigModalOpen(false)}
        units={businessUnits}
        onUpdateUnit={handleUpdateUnit}
        selectedUnitId={selectedUnit}
      />

      {/* Real-time Notification Center Drawer */}
      <NotificationCenter
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        alerts={alerts}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onTestTriggerPush={handleTestTriggerPush}
      />

      {/* Clean Modern Footer */}
      <footer className="h-11 bg-slate-50/80 dark:bg-[#070e1b]/90 border-t border-slate-200/80 dark:border-[#1a2847] px-6 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium shrink-0 mt-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-[#0f1a30] text-blue-700 dark:text-cyan-400 border border-blue-200 dark:border-[#1a2847] rounded-md text-[10px] font-mono font-bold">
              LIVE SYNC
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Enterprise Biometric Attendance Engine
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold">
          <span>Enterprise v4.2.1</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">● System Operational</span>
        </div>
      </footer>
    </div>
    </PresensiDataProvider>
  );
}
