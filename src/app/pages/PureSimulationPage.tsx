import React, { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import simulationHtmlRaw from '../../../Sistem_Operasional_GG_Supply_GUDSKUY_UIUX_Simulation.html?raw';
import {
  loadSimulationState,
  saveSimulationState,
} from './simulationBridge';

type BridgeApi = {
  loadState: () => Promise<unknown>;
  saveState: (state: unknown) => Promise<unknown>;
  getInitialPage: () => string;
  syncPage: (page: string) => void;
};

declare global {
  interface Window {
    __GG_SIMULATION_BRIDGE__?: BridgeApi;
  }
}

const PAGE_TO_ROUTE: Record<string, string> = {
  dashboard: '/app/dashboard',
  commands: '/app/launch/work-orders',
  monitor: '/app/monitor',
  brands: '/app/brands',
  supplier: '/app/suppliers',
  hpp: '/app/hpp-sheet',
  sample: '/app/sampling',
  size: '/app/size-chart',
  reports: '/app/reports',
  access: '/app/access-settings',
};

function getPageFromPath(pathname: string) {
  if (pathname.includes('/launch/work-orders')) return 'commands';
  if (pathname.includes('/monitor')) return 'monitor';
  if (pathname.includes('/brands')) return 'brands';
  if (pathname.includes('/suppliers')) return 'supplier';
  if (pathname.includes('/hpp-sheet')) return 'hpp';
  if (pathname.includes('/sampling')) return 'sample';
  if (pathname.includes('/size-chart')) return 'size';
  if (pathname.includes('/reports')) return 'reports';
  if (pathname.includes('/access-settings')) return 'access';
  return 'dashboard';
}

function buildSrcDoc(html: string) {
  const bridgeScript = `
<script>
(function () {
  function getBridge() {
    try {
      return window.parent && window.parent.__GG_SIMULATION_BRIDGE__;
    } catch (error) {
      return null;
    }
  }

  const originalSave = save;
  save = function () {
    try {
      originalSave();
    } catch (error) {}

    const bridge = getBridge();
    if (bridge && typeof bridge.saveState === 'function') {
      const snapshot = JSON.parse(JSON.stringify(S));
      Promise.resolve(bridge.saveState(snapshot)).catch(function (error) {
        console.warn('Gagal sinkron state simulasi.', error);
      });
    }
  };

  const originalPage = page;
  page = function (p, b) {
    originalPage(p, b);

    const bridge = getBridge();
    if (bridge && typeof bridge.syncPage === 'function') {
      bridge.syncPage(p);
    }
  };

  const bridge = getBridge();
  const initialPage = bridge && typeof bridge.getInitialPage === 'function'
    ? bridge.getInitialPage()
    : 'dashboard';

  if (bridge && typeof bridge.loadState === 'function') {
    Promise.resolve(bridge.loadState())
      .then(function (state) {
        if (state) {
          S = state;
          init();
        }

        const btn = document.querySelector('[data-p="' + initialPage + '"]');
        if (btn) {
          page(initialPage, btn);
        }
      })
      .catch(function (error) {
        console.warn('Gagal memuat state bridge simulasi.', error);
      });
  } else {
    const btn = document.querySelector('[data-p="' + initialPage + '"]');
    if (btn) {
      page(initialPage, btn);
    }
  }
})();
</script>`;

  return html.includes('</body>')
    ? html.replace('</body>', `${bridgeScript}</body>`)
    : `${html}${bridgeScript}`;
}

export const PureSimulationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    window.__GG_SIMULATION_BRIDGE__ = {
      loadState: loadSimulationState,
      saveState: saveSimulationState,
      getInitialPage: () => getPageFromPath(location.pathname),
      syncPage: (page) => {
        const nextRoute = PAGE_TO_ROUTE[page];
        if (nextRoute && nextRoute !== location.pathname) {
          navigate(nextRoute, { replace: true });
        }
      },
    };

    return () => {
      delete window.__GG_SIMULATION_BRIDGE__;
    };
  }, [location.pathname, navigate]);

  const srcDoc = useMemo(() => buildSrcDoc(simulationHtmlRaw), []);

  return (
    <iframe
      ref={iframeRef}
      title="GG Workspace Simulation"
      srcDoc={srcDoc}
      style={{
        display: 'block',
        width: '100%',
        height: '100vh',
        border: 0,
        background: '#f4f6fa',
      }}
    />
  );
};
