import { ReactNode, useState } from 'react';
import { BarChart3, Bell, CalendarDays, CheckSquare2, ChevronDown, CircleHelp, Database, FileCheck2, Grid2X2, Home, LogOut, Menu, PanelLeftClose, Plus, Search, Settings2, Shirt, Users, X } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from '@/app/router/simpleRouter';
import { signOut, useAuth } from '@/core/auth/useAuth';

const navigation = [
  { to: '/launch/app/today', label: 'Dashboard', icon: Home },
  { to: '/launch/app/projects', label: 'Article Pipeline', icon: Shirt },
  { to: '/launch/app/today#tasks', label: 'Tasks', icon: CheckSquare2 },
  { to: '/launch/app/projects?status=IN_REVIEW', label: 'Approvals', icon: FileCheck2 },
  { to: '/launch/app/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/launch/app/library', label: 'Master Data', icon: Database },
  { to: '/launch/app/team', label: 'Team', icon: Users },
];

function pageTitle(pathname: string) {
  if (pathname.includes('/projects/new')) return 'Create Article';
  if (/\/projects\/[^/]+/.test(pathname)) return 'Article Workspace';
  if (pathname.includes('/projects')) return 'Article Pipeline';
  if (pathname.includes('/calendar')) return 'Launch Calendar';
  if (pathname.includes('/library')) return 'Master Data';
  if (pathname.includes('/team')) return 'Team';
  return 'Operations Dashboard';
}

export function AppLayout({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profile = auth.data?.profile;
  const initials = profile?.full_name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase() ?? 'GG';

  async function handleSignOut() {
    await signOut();
    navigate('/launch/login');
  }

  return (
    <div className={`studio-shell ${collapsed ? 'studio-shell-collapsed' : ''}`}>
      <aside className={`studio-sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="studio-brand">
          <span className="studio-brand-mark">GG</span>
          <div><b>Product Launch OS</b><small>Studio Operations</small></div>
          <button className="studio-mobile-close" aria-label="Tutup menu" onClick={() => setMenuOpen(false)}><X size={19} /></button>
        </div>
        <div className="studio-workspace-select"><span>WORKSPACE</span><button><span className="studio-workspace-logo">GI</span><span><b>GG Indo Apparel</b><small>3 unit terhubung</small></span><ChevronDown size={15} /></button></div>
        <nav className="studio-nav" aria-label="Navigasi Product Launch OS">
          {navigation.map(item => <NavLink key={item.label} to={item.to} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}><item.icon size={19} /><span>{item.label}</span></NavLink>)}
        </nav>
        <div className="studio-sidebar-bottom">
          <button onClick={() => navigate('/launch/app/today')}><BarChart3 size={19} /><span>Reports</span></button>
          <button onClick={() => navigate('/launch/app/settings')}><Settings2 size={19} /><span>Settings</span></button>
          <button onClick={() => navigate('/')}><Grid2X2 size={19} /><span>Portal sistem</span></button>
          <button className="studio-collapse" onClick={() => setCollapsed(value => !value)}><PanelLeftClose size={18} /><span>Ringkas sidebar</span></button>
        </div>
      </aside>
      {menuOpen && <button className="studio-scrim" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} />}

      <div className="studio-main">
        <header className="studio-topbar">
          <div className="studio-topbar-leading">
            <button className="studio-menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Buka menu"><Menu size={21} /></button>
            <div><small>GG INDO APPAREL / PRODUCT DEVELOPMENT</small><h1>{pageTitle(location.pathname)}</h1></div>
          </div>
          <div className="studio-topbar-actions">
            <button className="studio-global-search" onClick={() => navigate('/launch/app/projects')}><Search size={18} /><span>Cari artikel, SKU, atau supplier</span><kbd>⌘ K</kbd></button>
            <button className="studio-icon-button" aria-label="Bantuan"><CircleHelp size={19} /></button>
            <button className="studio-icon-button studio-notification" aria-label="Notifikasi"><Bell size={19} /><i /></button>
            <button className="studio-create-button" onClick={() => navigate('/launch/app/projects/new')}><Plus size={18} /><span>Article</span></button>
            <div className="studio-profile">
              <button onClick={() => setProfileOpen(value => !value)}><span>{initials}</span><div><b>{profile?.full_name}</b><small>{profile?.job_title ?? 'Product team'}</small></div><ChevronDown size={15} /></button>
              {profileOpen && <div><button onClick={handleSignOut}><LogOut size={16} /> Keluar</button></div>}
            </div>
          </div>
        </header>
        <main className="studio-page">{children}</main>
      </div>

      <nav className="studio-mobile-nav">
        <NavLink to="/launch/app/today"><Home size={21} /><span>Home</span></NavLink>
        <NavLink to="/launch/app/projects"><Shirt size={21} /><span>Articles</span></NavLink>
        <button className="studio-mobile-add" onClick={() => navigate('/launch/app/projects/new')}><Plus size={25} /><span>Add</span></button>
        <NavLink to="/launch/app/today#tasks"><CheckSquare2 size={21} /><span>Tasks</span></NavLink>
        <button onClick={() => setMenuOpen(true)}><Menu size={21} /><span>More</span></button>
      </nav>
    </div>
  );
}
