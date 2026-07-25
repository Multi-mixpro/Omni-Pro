import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/core/auth/AuthProvider';
import { AuthGuard } from '@/app/guards/AuthGuard';
import { AppLayout } from '@/app/layouts/AppLayout';
import { LoginPage } from '@/app/pages/LoginPage';
import { DashboardPage } from '@/app/pages/DashboardPage';
import { AccessSettingsPage } from '@/app/pages/AccessSettingsPage';
import { BrandsOverviewPage } from '@/app/pages/BrandsOverviewPage';
import { WorkOrderListPage } from '@/modules/launch/pages/WorkOrderListPage';
import { NewWorkOrderPage } from '@/modules/launch/pages/NewWorkOrderPage';
import { WorkOrderDetailPage } from '@/modules/launch/pages/WorkOrderDetailPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const AppRouter: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route element={<AuthGuard />}>
              <Route element={<AppLayout />}>
                <Route path="/app/dashboard" element={<DashboardPage />} />
                
                {/* Product Launch Routes */}
                <Route path="/app/launch/work-orders" element={<WorkOrderListPage />} />
                <Route path="/app/launch/work-orders/new" element={<NewWorkOrderPage />} />
                <Route path="/app/launch/work-orders/:id" element={<WorkOrderDetailPage />} />
                <Route path="/app/monitor" element={<WorkOrderListPage />} />

                {/* Brand & Production Routes */}
                <Route path="/app/brands" element={<BrandsOverviewPage />} />
                <Route path="/app/suppliers" element={<DashboardPage />} />
                <Route path="/app/hpp-sheet" element={<DashboardPage />} />
                <Route path="/app/sampling" element={<DashboardPage />} />
                <Route path="/app/size-chart" element={<DashboardPage />} />

                {/* Administrasi Routes */}
                <Route path="/app/reports" element={<DashboardPage />} />
                <Route path="/app/access-settings" element={<AccessSettingsPage />} />

                {/* Placeholders */}
                <Route path="/app/catalog/products" element={<DashboardPage />} />
                <Route path="/app/settings/users" element={<AccessSettingsPage />} />
              </Route>
            </Route>

            {/* Fallback Redirect */}
            <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
