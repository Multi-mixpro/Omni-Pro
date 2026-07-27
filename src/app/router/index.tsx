import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/app/layouts/AppLayout';
import { AuthGate } from '@/core/auth/AuthGate';
import { useAuth } from '@/core/auth/useAuth';
import { LibraryPage, NewProjectPage, ProjectDetailPage, ProjectsPage, TeamPage, TodayPage } from '@/modules/launch/pages';
import { Navigate, RouterProvider, useLocation } from './simpleRouter';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } } });
function BootScreen() { return <div className="boot-screen" role="status" aria-live="polite"><div className="brand-mark">GG</div><div className="boot-line" /><p>Menyiapkan ruang kerja…</p></div>; }

function ProtectedApp({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (auth.isLoading) return <BootScreen />;
  if (!auth.data?.session || !auth.data.profile) return <AuthGate />;
  return <AppLayout>{children}</AppLayout>;
}

function RouteView() {
  const { pathname } = useLocation();
  if (pathname === '/login') return <AuthGate />;
  if (pathname === '/' || pathname === '/app' || pathname === '/app/') return <Navigate to="/app/today" replace />;
  let page: ReactNode;
  if (pathname === '/app/today') page = <TodayPage />;
  else if (pathname === '/app/projects') page = <ProjectsPage />;
  else if (pathname === '/app/projects/new') page = <NewProjectPage />;
  else if (/^\/app\/projects\/[^/]+\/?$/.test(pathname)) page = <ProjectDetailPage />;
  else if (pathname === '/app/library') page = <LibraryPage />;
  else if (pathname === '/app/team') page = <TeamPage />;
  else return <Navigate to="/app/today" replace />;
  return <ProtectedApp>{page}</ProtectedApp>;
}

export function AppRouter() { return <QueryClientProvider client={queryClient}><RouterProvider><RouteView /></RouterProvider></QueryClientProvider>; }
