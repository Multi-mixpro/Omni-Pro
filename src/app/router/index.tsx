import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SystemPortal } from '@/app/pages/SystemPortal';
import { AuthGate } from '@/core/auth/AuthGate';
import { ModuleLoginPreview } from '@/core/auth/ModuleLoginPreview';
import { useAuth } from '@/core/auth/useAuth';
import PatenApp from '../../../PATEN/src/App';
import { SettingsPage } from '@/modules/launch/settings/SettingsPage';
import { Navigate, RouterProvider, useLocation } from './simpleRouter';
import { LoginPage } from '@/modules/attendance/pages/LoginPage';
import { TodayPage } from '@/modules/attendance/pages/TodayPage';
import { HistoryPage, LeavePage, SchedulePage, ProfilePage } from '@/modules/attendance/pages/HistoryPage';
import { AdminDashboardPage } from '@/modules/attendance/pages/AdminDashboardPage';
import { AttendanceGuard } from '@/modules/attendance/components/AttendanceGuard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function BootScreen() {
  return (
    <div className="boot-screen" role="status" aria-live="polite">
      <div className="brand-mark">GG</div>
      <div className="boot-line" />
      <p>Menyiapkan PATEN workspace…</p>
    </div>
  );
}

function ProtectedPatenApp() {
  const auth = useAuth();
  if (auth.isLoading) return <BootScreen />;

  const hasLaunchAccess =
    auth.data?.permissions.includes('launch.view') ||
    auth.data?.permissions.includes('launch.admin');

  if (!auth.data?.session || !auth.data.profile || !hasLaunchAccess) {
    return <AuthGate />;
  }

  return (
    <PatenApp
      currentUser={{
        id: auth.data.profile.id,
        name: auth.data.profile.full_name,
        jobTitle: auth.data.profile.job_title,
        avatarUrl: auth.data.profile.avatar_url,
      }}
      permissions={auth.data.permissions}
    />
  );
}

/** Pengaturan tim & hak akses — hanya untuk admin/owner. */
function ProtectedSettingsPage() {
  const auth = useAuth();
  if (auth.isLoading) return <BootScreen />;

  const hasLaunchAccess =
    auth.data?.permissions.includes('launch.view') ||
    auth.data?.permissions.includes('launch.admin');

  if (!auth.data?.session || !auth.data.profile || !hasLaunchAccess) {
    return <AuthGate />;
  }

  return (
    <div className="paten-shell min-h-screen text-slate-900 font-sans antialiased">
      <main className="py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <a
            href="/launch/app/today"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-2xs transition-colors"
          >
            ← Kembali ke Product Launch OS
          </a>
        </div>
        <SettingsPage />
      </main>
    </div>
  );
}

function RouteView() {
  const { pathname } = useLocation();

  if (pathname === '/') return <SystemPortal />;
  if (pathname === '/launch' || pathname === '/launch/' || pathname === '/launch/login') {
    return <AuthGate />;
  }
  if (pathname === '/attendance' || pathname === '/attendance/' || pathname === '/attendance/login') {
    return <LoginPage />;
  }
  // Seluruh layar Attendance wajib melewati AttendanceGuard: sesi aktif DAN
  // terdaftar di attendance_memberships. Akun Product Launch tidak otomatis
  // memperoleh akses ke sini.
  if (pathname === '/attendance/today') return <AttendanceGuard><TodayPage /></AttendanceGuard>;
  if (pathname === '/attendance/schedule') return <AttendanceGuard><SchedulePage /></AttendanceGuard>;
  if (pathname === '/attendance/history') return <AttendanceGuard><HistoryPage /></AttendanceGuard>;
  if (pathname === '/attendance/leave') return <AttendanceGuard><LeavePage /></AttendanceGuard>;
  if (pathname === '/attendance/profile') return <AttendanceGuard><ProfilePage /></AttendanceGuard>;
  if (pathname.startsWith('/attendance/admin')) return <AttendanceGuard><AdminDashboardPage /></AttendanceGuard>;

  if (pathname === '/pos' || pathname === '/pos/' || pathname === '/pos/login') {
    return <ModuleLoginPreview system="POS Seller" />;
  }

  // Preserve every old Product Launch bookmark while PATEN owns the full UI.
  if (pathname === '/login') return <Navigate to="/launch/login" replace />;
  if (pathname === '/app' || pathname === '/app/') {
    return <Navigate to="/launch/app/today" replace />;
  }
  if (pathname.startsWith('/app/')) {
    return <Navigate to={`/launch${pathname}`} replace />;
  }
  if (pathname === '/launch/app' || pathname === '/launch/app/') {
    return <Navigate to="/launch/app/today" replace />;
  }
  // Pengaturan tim dipisah dari PATEN karena memakai sistem style aplikasi utama.
  if (pathname === '/launch/app/settings' || pathname === '/launch/app/settings/') {
    return <ProtectedSettingsPage />;
  }
  if (pathname.startsWith('/launch/app/')) return <ProtectedPatenApp />;

  return <Navigate to="/" replace />;
}

export function AppRouter() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider>
        <RouteView />
      </RouterProvider>
    </QueryClientProvider>
  );
}
