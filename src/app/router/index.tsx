import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/core/auth/AuthProvider';
import { AppLayout } from '@/app/layouts/AppLayout';
import { PureSimulationPage } from '@/app/pages/PureSimulationPage';

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
            {/* Pure Simulation Main Route */}
            <Route element={<AppLayout />}>
              <Route path="/app/dashboard" element={<PureSimulationPage />} />
              <Route path="/app/launch/work-orders" element={<PureSimulationPage />} />
              <Route path="/app/monitor" element={<PureSimulationPage />} />
              <Route path="/app/brands" element={<PureSimulationPage />} />
              <Route path="/app/suppliers" element={<PureSimulationPage />} />
              <Route path="/app/hpp-sheet" element={<PureSimulationPage />} />
              <Route path="/app/sampling" element={<PureSimulationPage />} />
              <Route path="/app/size-chart" element={<PureSimulationPage />} />
              <Route path="/app/reports" element={<PureSimulationPage />} />
              <Route path="/app/access-settings" element={<PureSimulationPage />} />
            </Route>

            {/* Fallback Redirect */}
            <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
