import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PureSimulationPage } from '@/app/pages/PureSimulationPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pure Simulation Routes */}
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

        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
