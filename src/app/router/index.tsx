import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SystemPortal } from '@/app/pages/SystemPortal';
import { AuthGate } from '@/core/auth/AuthGate';
import { ModuleLoginPreview } from '@/core/auth/ModuleLoginPreview';
import { useAuth } from '@/core/auth/useAuth';
import PatenApp from '../../../PATEN/src/App';
import { SettingsPage } from '@/modules/launch/settings/SettingsPage';
import { Navigate, RouterProvider, useLocation } from './simpleRouter';

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
    <div className="settings-standalone">
      <div className="page-container">
        <a href="/launch/app/today" className="settings-back-link">
          ← Kembali ke Product Launch OS
        </a>
        <SettingsPage />
      </div>
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
    return <ModuleLoginPreview system="Attendance" />;
  }
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
