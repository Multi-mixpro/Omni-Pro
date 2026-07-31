import { ReactNode, useState } from 'react';
import { Bell, BookOpen, Boxes, CalendarDays, ChevronDown, Command, Grid2X2, Home, LogOut, Menu, Plus, Search, Settings2, Users, X } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from '@/app/router/simpleRouter';
import { signOut, useAuth } from '@/core/auth/useAuth';

const navigation = [
  { to: '/launch/app/today', label: 'Hari ini', icon: Home },
  { to: '/launch/app/projects', label: 'Artikel', icon: Boxes },
  { to: '/launch/app/calendar', label: 'Kalender', icon: CalendarDays },
  { to: '/launch/app/library', label: 'Pustaka', icon: BookOpen },
  { to: '/launch/app/team', label: 'Tim', icon: Users },
];

function pageTitle(pathname: string) {
  if (pathname.includes('/projects/new')) return 'Perintah artikel baru';
  if (/\/projects\/[^/]+/.test(pathname)) return 'Ruang kerja artikel';
  if (pathname.includes('/projects')) return 'Semua artikel';
  if (pathname.includes('/calendar')) return 'Kalender peluncuran';
  if (pathname.includes('/library')) return 'Pustaka sumber daya';
  if (pathname.includes('/team')) return 'Tim peluncuran';
  return 'Fokus hari ini';
}

export function AppLayout({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profile = auth.data?.profile;
  const initials = profile?.full_name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase() ?? 'GG';

  async function handleSignOut() {
    await signOut();
    navigate('/launch/login');
  }

  return (
    <div className="app-shell">
      <aside className={`side-panel ${menuOpen ? 'side-panel-open' : ''}`}>
        <div className="side-brand">
          <span className="brand-mark">GG</span>
          <div><b>Launch OS</b><small>GG Indo Apparel</small></div>
          <button className="icon-button side-close" aria-label="Tutup menu" onClick={() => setMenuOpen(false)}><X size={20} /></button>
        </div>

        <nav className="side-nav" aria-label="Navigasi Product Launch OS">
          {navigation.map(item => (
            <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>
              <item.icon size={20} /><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="side-bottom">
          <button className="rail-action" onClick={() => navigate('/')} title="Portal semua sistem"><Grid2X2 size={19} /><span>Portal</span></button>
          <button className="rail-action" onClick={() => navigate('/launch/app/settings')} title="Pengaturan"><Settings2 size={19} /><span>Pengaturan</span></button>
          <span className="rail-status" title="Product Launch OS aktif"><Command size={17} /><i /></span>
        </div>
      </aside>
      {menuOpen && <button className="menu-scrim" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} />}

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-leading">
            <button className="icon-button menu-trigger" aria-label="Buka menu" onClick={() => setMenuOpen(true)}><Menu size={22} /></button>
            <div><span className="topbar-kicker">GG INDO APPAREL / PRODUCT DEVELOPMENT</span><h1>{pageTitle(location.pathname)}</h1></div>
          </div>
          <div className="topbar-actions">
            <button className="command-search" onClick={() => navigate('/launch/app/projects')}><Search size={18} /><span>Cari artikel atau kode…</span><kbd>⌘ K</kbd></button>
            <button className="icon-button notification-trigger" aria-label="Notifikasi"><Bell size={18} /><i /></button>
            <button className="button button-primary top-create" onClick={() => navigate('/launch/app/projects/new')}><Plus size={18} /><span>Artikel baru</span></button>
            <div className="profile-menu">
              <button className="profile-trigger" onClick={() => setProfileOpen(open => !open)} aria-expanded={profileOpen}>
                <span className="avatar">{initials}</span><span className="profile-copy"><b>{profile?.full_name}</b><small>{profile?.job_title ?? 'Tim Product Launch'}</small></span><ChevronDown size={16} />
              </button>
              {profileOpen && <div className="profile-popover"><button onClick={handleSignOut}><LogOut size={17} /> Keluar dari workspace</button></div>}
            </div>
          </div>
        </header>

        <div className="page-container">{children}</div>
      </div>

      <nav className="mobile-nav" aria-label="Navigasi mobile">
        {navigation.map(item => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'active' : ''}><item.icon size={21} /><span>{item.label}</span></NavLink>
        ))}
      </nav>

      <button className="mobile-fab" onClick={() => navigate('/launch/app/projects/new')} aria-label="Buat artikel baru"><Plus size={23} /></button>
    </div>
  );
}
