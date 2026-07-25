import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthProvider';
import '@/styles/simulation.css';

export const AppLayout: React.FC = () => {
  const { currentUser, users, isOwner, switchUser } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('work-orders')) return 'Perintah Kerja';
    if (path.includes('monitor')) return 'Kelola & Pantau';
    if (path.includes('brands')) return 'GG Supply & GUDSKUY';
    if (path.includes('suppliers')) return 'Supplier & Bahan';
    if (path.includes('hpp-sheet')) return 'Lembar HPP';
    if (path.includes('sampling')) return 'Sampling';
    if (path.includes('size-chart')) return 'Size Chart';
    if (path.includes('reports')) return 'Laporan & Evaluasi';
    if (path.includes('access-settings')) return 'Pengaturan Akses';
    return 'Dashboard';
  };

  return (
    <div className="app-simulation">
      {/* Sidebar matching HTML exactly */}
      <aside className="side-sim">
        <div className="brand-sim">
          <div className="logo-sim">GG</div>
          <div>
            <b>GG Workspace</b>
            <small>Product Launch OS</small>
          </div>
        </div>

        <div className="navlabel-sim">Workspace</div>
        <div className="nav-sim">
          <NavLink to="/app/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i>⌂</i>Dashboard
          </NavLink>
          <NavLink to="/app/launch/work-orders" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i>▣</i>Perintah Kerja <span className="badge-sim">3</span>
          </NavLink>
          {isOwner && (
            <NavLink to="/app/monitor" className={({ isActive }) => (isActive ? 'active' : '')}>
              <i>◉</i>Kelola & Pantau
            </NavLink>
          )}
        </div>

        <div className="navlabel-sim">Produksi</div>
        <div className="nav-sim">
          <NavLink to="/app/brands" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i>◆</i>GG Supply & GUDSKUY
          </NavLink>
          <NavLink to="/app/suppliers" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i>⌁</i>Supplier & Bahan
          </NavLink>
          <NavLink to="/app/hpp-sheet" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i>Rp</i>Lembar HPP
          </NavLink>
          <NavLink to="/app/sampling" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i>✂</i>Sampling
          </NavLink>
          <NavLink to="/app/size-chart" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i>↔</i>Size Chart
          </NavLink>
        </div>

        <div className="navlabel-sim">Administrasi</div>
        <div className="nav-sim">
          <NavLink to="/app/reports" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i>▤</i>Laporan & Evaluasi
          </NavLink>
          {isOwner && (
            <NavLink to="/app/access-settings" className={({ isActive }) => (isActive ? 'active' : '')}>
              <i>⚙</i>Pengaturan Akses
            </NavLink>
          )}
        </div>

        <div className="sidefoot-sim">
          <div className="launch-sim">
            <small style={{ fontSize: '10px', color: '#9eabc0' }}>Kesiapan Launching 60 Hari</small>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <b style={{ fontSize: '12px' }}>65%</b>
              <small style={{ fontSize: '10px', color: '#9eabc0' }}>2 perusahaan</small>
            </div>
            <div className="bar-sim">
              <span style={{ width: '65%' }}></span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-sim">
        {/* Topbar matching HTML */}
        <header className="top-sim">
          <div className="topl-sim">
            <div className="crumb-sim">
              GG Workspace / <b>{getPageTitle()}</b>
            </div>
          </div>

          <div className="topr-sim">
            <button className="ibtn-sim" onClick={toggleTheme} title="Toggle Theme">
              ◐
            </button>
            <button className="ibtn-sim" onClick={() => window.print()} title="Print">
              ⎙
            </button>
            <div className="switch-sim">
              <div className="av-sim">{currentUser.ini}</div>
              <select
                value={currentUser.id}
                onChange={(e) => switchUser(e.target.value)}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-sim">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
