
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  Menu,
  X,
  LogOut,
  Goal,
  Landmark,
  Upload,
  Sun,
  Moon,
  HandCoins,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  UserCircle2,
  CalendarSync,
  CreditCard,
  Target,
  Clock
} from 'lucide-react';

import { useTheme } from './ThemeContext';

interface LayoutProps {
  userName: string;
  displayName?: string;
  profilePicture?: string;
  children: React.ReactNode;
  onLogout: () => void;
  onImport?: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'transactions', label: 'Transactions', icon: ReceiptText, path: '/transactions' },
  { id: 'budget', label: 'Budget', icon: HandCoins, path: '/budget' },
  { id: 'investment-planner', label: 'Goals', icon: Goal, path: '/investment-planner' },
  { id: 'credit-cards', label: 'Cards', icon: CreditCard, path: '/credit-cards' },
  { id: 'schedules', label: 'Schedules', icon: Clock, path: '/schedules' },
  { id: 'configuration', label: 'Configuration', icon: Settings, path: '/configuration' },
];


const Layout: React.FC<LayoutProps> = ({ userName, displayName, profilePicture, children, onImport }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme, isDark } = useTheme();

  const getPageTitle = (path: string) => {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return 'Dashboard';

    const root = parts[0];
    if (root === 'investment-planner') return 'Goals & Planning';
    if (root === 'account') return 'My Account';
    if (root === 'transaction') return 'Transaction Details';
    if (root === 'schedules' && parts.length > 1) return 'Schedule Details';
    if (root === 'credit-cards' && parts.length > 2 && parts[2] === 'history') return 'Billing History';

    return root.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const displayLabel = displayName && displayName.trim() ? displayName.trim() : userName;
  const avatarInitial = displayLabel?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--theme-bg)' }}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 ${isPinned ? 'w-64' : 'w-20'} backdrop-blur-2xl transform transition-all duration-300 ease-out
          md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: 'var(--theme-sidebar)',
          borderRight: '1px solid var(--theme-border-subtle)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div
            className={`flex items-center justify-between transition-all duration-300 ${isPinned ? 'p-6' : 'p-2 flex-col gap-4 py-6'}`}
            style={{ borderBottom: '1px solid var(--theme-border-subtle)' }}
          >
            <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${!isPinned && 'justify-center w-full'}`}>
              <div className="p-1.5 rounded-xl shrink-0 shadow-sm" style={{ background: 'var(--theme-surface)' }}>
                <img src="/favicon.png" alt="Gringotts" className={`${isPinned ? 'w-10 h-10' : 'w-12 h-12'} object-contain rounded-lg transition-all duration-300`} />
              </div>
              {isPinned && (
                <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                  <h1 className="text-lg font-bold tracking-tight sidebar-brand-text" style={{ color: 'var(--theme-text)' }}>Gringotts</h1>
                  <p className="text-[10px] uppercase tracking-widest font-medium sidebar-brand-sub" style={{ color: 'var(--theme-text-muted)' }}>Vault</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsPinned(!isPinned)}
              className={`p-1.5 rounded-lg transition-all ${isPinned ? 'hidden md:flex' : 'flex'}`}
              style={{
                border: '1px solid var(--theme-border-subtle)',
                color: 'var(--theme-text-muted)',
              }}
            >
              {isPinned ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = item.path === '/dashboard' 
                ? location.pathname === '/dashboard' || location.pathname === '/'
                : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    w-full flex items-center ${isPinned ? 'gap-3 px-4' : 'justify-center px-0'} py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group
                  `}
                  style={isActive ? {
                    background: 'var(--theme-sidebar-active-bg)',
                    color: 'var(--theme-accent)',
                  } : {
                    color: 'var(--theme-text-muted)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--theme-text)';
                      e.currentTarget.style.backgroundColor = 'var(--theme-surface-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--theme-text-muted)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {isActive && (
                    <div
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${!isPinned && 'left-1'}`}
                      style={{
                        background: 'var(--theme-sidebar-indicator)',
                        boxShadow: `0 0 12px rgba(var(--theme-accent-rgb), 0.3)`,
                      }}
                    />
                  )}
                  <item.icon className={`w-5 h-5 transition-transform duration-200 shrink-0 ${isActive ? '' : 'group-hover:scale-110'}`} />
                  {isPinned && <span className="animate-in fade-in slide-in-from-left-2 duration-300 sidebar-nav-text">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Bottom user section */}
          <div className="p-4" style={{ borderTop: '1px solid var(--theme-border-subtle)' }}>
            <div className={`flex items-center ${isPinned ? 'gap-3 px-3' : 'justify-center px-0'} py-2`}>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shrink-0 overflow-hidden"
                style={{
                  background: `linear-gradient(to bottom right, var(--theme-avatar-from), var(--theme-avatar-to))`,
                  boxShadow: `0 4px 14px var(--theme-avatar-shadow)`,
                }}
              >
                {profilePicture
                  ? <img src={profilePicture} alt="avatar" className="w-full h-full object-cover" />
                  : avatarInitial
                }
              </div>
              {isPinned && (
                <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                  <p className="text-sm font-semibold truncate sidebar-user-text" style={{ color: 'var(--theme-text)' }}>{displayLabel}</p>
                  <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>Vault Keeper</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative" style={{ backgroundColor: 'var(--theme-bg)' }}>
        {/* Header */}
        <header
          className="sticky top-0 z-30 backdrop-blur-xl px-6 py-4 flex items-center justify-between"
          style={{
            background: 'var(--theme-header)',
            borderBottom: '1px solid var(--theme-border-subtle)',
          }}
        >
          <div className="flex items-center gap-4">
            <button
              className="md:hidden transition-colors p-1"
              onClick={() => setIsSidebarOpen(true)}
              style={{ color: 'var(--theme-text-muted)' }}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>{getPageTitle(location.pathname)}</h2>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl transition-all hover:scale-105"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{ color: 'var(--theme-text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-surface-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {onImport && (
              <button
                onClick={onImport}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all"
                style={{
                  color: 'var(--theme-text-secondary)',
                  background: 'var(--theme-surface-hover)',
                  border: '1px solid var(--theme-border-subtle)',
                }}
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
              </button>
            )}
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-2 pr-4 rounded-xl transition-all duration-200"
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-surface-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg overflow-hidden"
                style={{
                  background: `linear-gradient(to bottom right, var(--theme-avatar-from), var(--theme-avatar-to))`,
                  boxShadow: `0 4px 14px var(--theme-avatar-shadow)`,
                }}
              >
                {profilePicture
                  ? <img src={profilePicture} alt="avatar" className="w-full h-full object-cover" />
                  : avatarInitial
                }
              </div>
              <span className="text-sm font-medium hidden sm:block" style={{ color: 'var(--theme-text-secondary)' }}>{displayLabel}</span>
            </button>

            {isProfileOpen && (
              <div
                className="absolute top-full right-0 mt-2 w-52 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                style={{
                  background: 'var(--theme-surface)',
                  border: '1px solid var(--theme-border)',
                }}
              >
                <Link
                  to="/account"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors w-full"
                  onClick={() => setIsProfileOpen(false)}
                  style={{ color: 'var(--theme-text-secondary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--theme-surface-hover)';
                    e.currentTarget.style.color = 'var(--theme-text)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--theme-text-secondary)';
                  }}
                >
                  <UserCircle2 className="w-4 h-4" />
                  Account Settings
                </Link>
                <div style={{ borderTop: '1px solid var(--theme-border-subtle)', margin: '4px 0' }} />
                <Link
                  to="/logout"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 transition-colors w-full font-medium"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Link>
              </div>
            )}
          </div>
        </header>

        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
