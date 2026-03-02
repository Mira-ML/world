import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  MessageSquare,
  Network,
  ToggleLeft,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/clients', label: 'Clients', icon: Users, end: false },
  { to: '/costs', label: 'Costs', icon: DollarSign, end: false },
  { to: '/prompts', label: 'Prompts', icon: MessageSquare, end: false },
  { to: '/network', label: 'Network', icon: Network, end: false },
  { to: '/flags', label: 'Feature Flags', icon: ToggleLeft, end: false },
];

const AppShell: React.FC = () => {
  const { user, logout } = useAuth0();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-white/10 text-white font-medium'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-white/10 transition-all duration-200 ${
          sidebarOpen ? 'w-52' : 'w-14'
        }`}
        style={{ flexShrink: 0 }}
      >
        {/* Logo / toggle */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-white/10 h-[52px]">
          {sidebarOpen && (
            <span className="text-sm font-semibold text-white tracking-tight">Mira World</span>
          )}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="text-gray-500 hover:text-white transition-colors ml-auto"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass} title={!sidebarOpen ? label : undefined}>
              <Icon size={16} className="shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-white/10 px-3 py-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium shrink-0">
                {user?.email?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-300 truncate">{user?.email}</div>
              </div>
              <button
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                className="text-gray-600 hover:text-gray-300 transition-colors"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="text-gray-600 hover:text-gray-300 transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
