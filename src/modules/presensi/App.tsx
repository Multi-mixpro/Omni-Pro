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
import { UnifiedLoginPage } from './components/UnifiedLoginPage';
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
  // User Authentication & Session State with LocalStorage Persistence
  const [currentUser, setCurrentUser] = useState<{
    role: 'ADMIN' | 'EMPLOYEE';
    employee?: Employee;
    adminName?: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('presensi_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLoginSuccess = (user: {
    role: 'ADMIN' | 'EMPLOYEE';
    employee?: Employee;
    adminName?: string;
  }) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('presensi_user_session', JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user session', e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('presensi_user_session');
    } catch (e) {
      console.error('Failed to clear user session', e);
    }
  };

  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedUnit, setSelectedUnit] = useState<UnitType>('ALL');
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Date Selection
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // App Core State
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
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#070e1b';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
    }
  }, [darkMode]);

  // Load Real-time Data from Supabase
  const loadSupabaseData = async () => {
    setIsLoadingData(true);
    setDataError(null);

    const [unitRes, shiftRes, employeeRes, recordRes] = await Promise.all([
      presensiRepository.listUnits(),
      presensiRepository.listShifts(),
      presensiRepository.listEmployees(),
      presensiRepository.listAttendance(),
    ]);

    const firstError =
      unitRes.error || shiftRes.error || employeeRes.error || recordRes.error;
    if (firstError) setDataError(firstError);

    setBusinessUnits(unitRes.data);
    setShifts(shiftRes.data);
    setEmployees(employeeRes.data);
    setRecords(recordRes.data);
    setIsLoadingData(false);
  };

  useEffect(() => {
    loadSupabaseData();
  }, []);

  // Unit Configuration Update Handler (Persistent to Supabase)
  const handleUpdateUnit = async (updatedUnit: BusinessUnit) => {
    setBusinessUnits((prev) => prev.map((u) => (u.id === updatedUnit.id ? updatedUnit : u)));
    const res = await presensiRepository.saveUnit(updatedUnit);
    if (res.error) {
      console.error('Gagal menyimpan unit ke Supabase:', res.error);
    } else {
      await loadSupabaseData();
    }
  };

  // Record Update Handler (Persistent to Supabase)
  const handleUpdateRecordStatus = async (
    recordId: string,
    newStatus: AttendanceStatus,
    notes?: string
  ) => {
    const targetRecord = records.find((r) => r.id === recordId);
    if (!targetRecord) return;
    const updated = { ...targetRecord, status: newStatus, notes: notes || targetRecord.notes };

    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? updated : r))
    );

    await presensiRepository.saveAttendanceRecord(updated);

    // Add Audit Log
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
  };

  // Clock In Success Handler from Mobile Simulator (Persistent to Supabase)
  const handleClockInSuccess = async (newRecord: AttendanceRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
    await presensiRepository.saveAttendanceRecord(newRecord);

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

  // Shift Management Handlers (Persistent to Supabase)
  const handleAddShift = async (newShift: Shift) => {
    setShifts((prev) => [...prev, newShift]);
    await presensiRepository.saveShift(newShift);
  };

  const handleUpdateShift = async (updatedShift: Shift) => {
    setShifts((prev) => prev.map((s) => (s.id === updatedShift.id ? updatedShift : s)));
    await presensiRepository.saveShift(updatedShift);
  };

  const handleDeleteShift = async (shiftId: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
    await presensiRepository.deleteShift(shiftId);
  };

  // Employee Management Handlers (Persistent to Supabase)
  const handleAddEmployee = async (newEmp: Employee) => {
    setEmployees((prev) => [newEmp, ...prev]);
    const res = await presensiRepository.saveEmployee(newEmp);
    if (res.error) {
      console.error('Gagal menyimpan karyawan ke Supabase:', res.error);
    } else {
      await loadSupabaseData();
    }
  };

  const handleUpdateEmployee = async (updatedEmp: Employee) => {
    setEmployees((prev) => prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)));
    const res = await presensiRepository.saveEmployee(updatedEmp);
    if (res.error) {
      console.error('Gagal memperbarui karyawan ke Supabase:', res.error);
    } else {
      await loadSupabaseData();
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
    const res = await presensiRepository.deleteEmployee(employeeId);
    if (res.error) {
      console.error('Gagal menghapus karyawan dari Supabase:', res.error);
    } else {
      await loadSupabaseData();
    }
  };

  const handleAssignShiftToEmployee = async (employeeId: string, shiftId: string) => {
    const target = employees.find((e) => e.id === employeeId);
    if (target) {
      const updated = { ...target, shiftId };
      setEmployees((prev) => prev.map((e) => (e.id === employeeId ? updated : e)));
      await presensiRepository.saveEmployee(updated);
    }
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
      notifiedVia: ['PUSH'],
    };
    setAlerts((prev) => [newAlert, ...prev]);
    handleSendPushAlert(newAlert);
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const referenceData = { businessUnits, shifts, employees };

  // 1. Unauthenticated View -> Show Login Page
  if (!currentUser) {
    return (
      <UnifiedLoginPage
        businessUnits={businessUnits}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // 2. Employee View -> Show Dedicated & Isolated Attendance Portal
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
        onLogout={handleLogout}
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
          onLogout={handleLogout}
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
        />

        {/* Global Right Notification Drawer */}
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
      </div>
    </PresensiDataProvider>
  );
}
