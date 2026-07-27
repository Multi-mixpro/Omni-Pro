import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/app/layouts/AppLayout';
import { SystemPortal } from '@/app/pages/SystemPortal';
import { AuthGate } from '@/core/auth/AuthGate';
import { ModuleLoginPreview } from '@/core/auth/ModuleLoginPreview';
import { useAuth } from '@/core/auth/useAuth';
import { LibraryPage, NewProjectPage, ProjectDetailPage, ProjectsPage, TeamPage, TodayPage } from '@/modules/launch/pages';
import { Navigate, RouterProvider, useLocation } from './simpleRouter';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } } });

function BootScreen() {
  return <div className="boot-screen" role="status" aria-live="polite"><div className="brand-mark">GG</div><div className="boot-line" /><p>Menyiapkan ruang kerja…</p></div>;
}

function ProtectedLaunchApp({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (auth.isLoading) return <BootScreen />;
  const hasLaunchAccess = auth.data?.permissions.includes('launch.view') || auth.data?.permissions.includes('launch.admin');
  if (!auth.data?.session || !auth.data.profile || !hasLaunchAccess) return <AuthGate />;
  return <AppLayout>{children}</AppLayout>;
}

function RouteView() {
  const { pathname } = useLocation();

  if (pathname === '/') return <SystemPortal />;
  if (pathname === '/launch' || pathname === '/launch/' || pathname === '/launch/login') return <AuthGate />;
  if (pathname === '/attendance' || pathname === '/attendance/' || pathname === '/attendance/login') return <ModuleLoginPreview system="Attendance" />;
  if (pathname === '/pos' || pathname === '/pos/' || pathname === '/pos/login') return <ModuleLoginPreview system="POS Seller" />;

  // Keep old bookmarks working while the active application moves into its own namespace.
  if (pathname === '/login') return <Navigate to="/launch/login" replace />;
  if (pathname === '/app' || pathname === '/app/') return <Navigate to="/launch/app/today" replace />;
  if (pathname.startsWith('/app/')) return <Navigate to={`/launch${pathname}`} replace />;
  if (pathname === '/launch/app' || pathname === '/launch/app/') return <Navigate to="/launch/app/today" replace />;

  let page: ReactNode;
  if (pathname === '/launch/app/today') page = <TodayPage />;
  else if (pathname === '/launch/app/projects') page = <ProjectsPage />;
  else if (pathname === '/launch/app/projects/new') page = <NewProjectPage />;
  else if (/^\/launch\/app\/projects\/[^/]+\/?$/.test(pathname)) page = <ProjectDetailPage />;
  else if (pathname === '/launch/app/library') page = <LibraryPage />;
  else if (pathname === '/launch/app/team') page = <TeamPage />;
  else return <Navigate to="/" replace />;

  return <ProtectedLaunchApp>{page}</ProtectedLaunchApp>;
}

export function AppRouter() {
  return <QueryClientProvider client={queryClient}><RouterProvider><RouteView /></RouterProvider></QueryClientProvider>;
}
