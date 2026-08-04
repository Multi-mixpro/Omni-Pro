import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthGate } from '@/core/auth/AuthGate';
import { useAuth } from '@/core/auth/useAuth';
import PatenApp from '@/modules/launch/paten/App';
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

  if (pathname === '/' || pathname === '') {
    return <Navigate to="/launch/login" replace />;
  }

  if (pathname === '/launch' || pathname === '/launch/' || pathname === '/launch/login') {
    return <AuthGate />;
  }

  if (pathname === '/launch/app/settings' || pathname === '/launch/app/settings/') {
    return <ProtectedSettingsPage />;
  }

  if (pathname === '/launch/app' || pathname === '/launch/app/') {
    return <Navigate to="/launch/app/today" replace />;
  }

  if (pathname.startsWith('/launch/app/')) {
    return <ProtectedPatenApp />;
  }

  return <Navigate to="/launch/login" replace />;
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
