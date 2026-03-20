import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { ChevronLeft, ChevronRight, ChevronDown, LogOut, Menu } from 'lucide-react';
import './AppShell.css';

interface SubTab {
  id: string;
  label: string;
  path: string;
}

const NAV_ITEMS = [
  { to: '/', label: 'OVERVIEW', end: true },
  { to: '/clients', label: 'CLIENTS', end: false },
  { to: '/costs', label: 'COSTS', end: false },
  { to: '/playbook', label: 'PLAYBOOK', end: false },
  { to: '/network', label: 'NETWORK', end: false },
  { to: '/flags', label: 'FEATURE FLAGS', end: false },
  { to: '/widget-flags', label: 'WIDGET FLAGS', end: false },
  { to: '/cards', label: 'CARDS', end: false },
];

const sectionSubTabs: Record<string, SubTab[]> = {
  playbook: [
    { id: 'prompts', label: 'Prompts', path: '/playbook' },
    { id: 'segments', label: 'Segments', path: '/playbook/segments' },
    { id: 'funnel', label: 'Funnel', path: '/playbook/funnel' },
  ],
};

const WORDMARK = 'https://s3.us-east-2.amazonaws.com/beta.mira.ml/terraWordmark.png';
const WORDMARK_VERTICAL = 'https://s3.us-east-2.amazonaws.com/beta.mira.ml/WORDMARK_HORIZONTAL_(PURPLE).svg';
const ORB_BLACK = 'https://s3.us-east-2.amazonaws.com/beta.mira.ml/ORB-BLACK.svg';
const ORB_WHITE = 'https://s3.us-east-2.amazonaws.com/beta.mira.ml/ORB-WHITE.svg';
const MOAI = 'https://s3.us-east-2.amazonaws.com/beta.mira.ml/3D_MOAI_ROCK-PURPLE.svg';

const AppShell: React.FC = () => {
  const { user, logout } = useAuth0();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  const activeNav = NAV_ITEMS.find(n =>
    n.end ? location.pathname === '/' : location.pathname.startsWith(n.to)
  );
  const sectionLabel = activeNav?.label ?? 'WORLD';

  // Determine active section key for sub-tabs (e.g., "playbook")
  const sectionKey = activeNav?.to?.replace('/', '') || '';
  const subTabs = sectionSubTabs[sectionKey] || [];

  return (
    <div className="app-shell">
      {mobileOpen && (
        <div className="app-shell__overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`app-shell__sidebar${collapsed ? ' app-shell__sidebar--collapsed' : ''}${mobileOpen ? ' app-shell__sidebar--mobile-open' : ''}`}>
        <div className="app-shell__logo">
          <NavLink to="/" className="app-shell__logo-link">
            <img src={WORDMARK} alt="Mira" className="app-shell__logo-wordmark" />
            <img src={WORDMARK_VERTICAL} alt="Mira" className="app-shell__logo-vertical" />
          </NavLink>
        </div>

        <nav className="app-shell__nav">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `app-shell__nav-item${isActive ? ' app-shell__nav-item--active' : ''}`}
              title={collapsed ? label : undefined}
            >
              {({ isActive }) => (
                <>
                  <img src={isActive ? ORB_WHITE : ORB_BLACK} alt="" className="app-shell__nav-orb" />
                  <span className="app-shell__nav-label">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="app-shell__sidebar-bottom">
          <button
            className="app-shell__collapse-toggle"
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      <div className={`app-shell__main-wrapper${collapsed ? ' app-shell__main-wrapper--expanded' : ''}`}>
        <header className="app-shell__topnav">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className="app-shell__mobile-toggle" onClick={() => setMobileOpen(v => !v)}>
              <span className="app-shell__hamburger" />
            </button>
            <span className="app-shell__section-title">{sectionLabel}</span>
            {subTabs.length > 0 && (
              <nav className="app-shell__sub-tabs">
                {subTabs.map(tab => {
                  const isActive = tab.path === '/playbook'
                    ? location.pathname === '/playbook' || location.pathname === '/playbook/'
                    : location.pathname.startsWith(tab.path);
                  return (
                    <NavLink
                      key={tab.id}
                      to={tab.path}
                      end={tab.path === '/playbook'}
                      className={`app-shell__sub-tab${isActive ? ' app-shell__sub-tab--active' : ''}`}
                    >
                      {tab.label}
                    </NavLink>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="app-shell__user-menu">
            <button className="app-shell__user-trigger" onClick={() => setUserMenuOpen(v => !v)}>
              <img src={MOAI} alt="" style={{ width: 24, height: 24 }} />
              <span className="app-shell__user-name">{user?.name ?? user?.email ?? 'Mira'}</span>
              <ChevronDown size={12} style={{ color: 'var(--color-text-muted)', marginLeft: 2 }} />
            </button>

            {userMenuOpen && (
              <>
                <div className="app-shell__user-menu-backdrop" onClick={() => setUserMenuOpen(false)} />
                <div className="app-shell__user-dropdown">
                  <div className="app-shell__user-dropdown-info">
                    <div className="app-shell__user-dropdown-name">{user?.name ?? 'Team Member'}</div>
                    <div className="app-shell__user-dropdown-email">{user?.email}</div>
                  </div>
                  <hr className="app-shell__user-dropdown-divider" />
                  <button
                    className="app-shell__user-dropdown-item app-shell__user-dropdown-item--danger"
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
