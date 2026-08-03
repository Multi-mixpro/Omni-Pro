import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthGate } from '@/core/auth/AuthGate';
import { useAuth } from '@/core/auth/useAuth';
import PatenApp from '@/modules/launch/paten/App';
import PresensiApp from '@/modules/presensi/App';
import { SettingsPage } from '@/modules/launch/settings/SettingsPage';
import { SystemGateway } from '@/app/pages/SystemGateway';
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
      <p>Menyiapkan Product Launch OS…</p>
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

  // Gerbang masuk: pilih Product Launch OS atau Presensi.
  if (pathname === '/' || pathname === '') {
    return <SystemGateway />;
  }

  // Presensi punya login sendiri di dalam aplikasinya, memakai schema presensi
  // dan hak akses terpisah dari Product Launch.
  if (pathname === '/presensi' || pathname.startsWith('/presensi/')) {
    return <PresensiApp />;
  }

  if (pathname === '/launch' || pathname === '/launch/' || pathname === '/launch/login') {
    return <AuthGate />;
  }

  // Pengaturan tim dipisah dari PATEN karena memakai sistem style aplikasi utama.
  if (pathname === '/launch/app/settings' || pathname === '/launch/app/settings/') {
    return <ProtectedSettingsPage />;
  }

  if (pathname === '/launch/app' || pathname === '/launch/app/') {
    return <Navigate to="/launch/app/today" replace />;
  }

  if (pathname.startsWith('/launch/app/')) {
    return <ProtectedPatenApp />;
  }

  // Rute tak dikenal dikembalikan ke gerbang masuk agar pengguna dapat memilih
  // sistem, bukan dipaksa ke salah satunya.
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
