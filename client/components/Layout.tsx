
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  Menu,
  X,
  LogOut,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  Landmark,
  Upload,
  Sun,
  Moon,
  RefreshCw,
  Target,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { useTheme } from './ThemeContext';

interface LayoutProps {
  userName: string;
  children: React.ReactNode;
  onLogout: () => void;
  onImport?: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'transactions', label: 'Transactions', icon: Landmark, path: '/transactions' },
  { id: 'budget', label: 'Budget', icon: Target, path: '/budget' },
  { id: 'goals', label: 'Goals', icon: TrendingUp, path: '/goals' },
  { id: 'configuration', label: 'Settings', icon: Settings, path: '/configuration' },
];


const Layout: React.FC<LayoutProps> = ({ userName, children, onImport }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const activeTab = location.pathname.replace('/', '');
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 ${isPinned ? 'w-64' : 'w-20'} bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-700/50 transform transition-all duration-300 ease-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className={`flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 transition-all duration-300 ${isPinned ? 'p-6' : 'p-2 flex-col gap-4 py-6'}`}>
            <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${!isPinned && 'justify-center w-full'}`}>
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl shrink-0 shadow-sm">
                <img src="/favicon.png" alt="Gringotts" className={`${isPinned ? 'w-10 h-10' : 'w-12 h-12'} object-contain rounded-lg transition-all duration-300`} />
              </div>
              {isPinned && (
                <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Gringotts</h1>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-medium">Vault</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsPinned(!isPinned)}
              className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${isPinned ? 'hidden md:flex' : 'flex'}`}
            >
              {isPinned ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    w-full flex items-center ${isPinned ? 'gap-3 px-4' : 'justify-center px-0'} py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group
                    ${isActive
                      ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-600 dark:text-cyan-400 shadow-inner'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200'}
                  `}
                >
                  {isActive && (
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r-full shadow-lg shadow-cyan-500/30 ${!isPinned && 'left-1'}`} />
                  )}
                  <item.icon className={`w-5 h-5 transition-transform duration-200 shrink-0 ${isActive ? '' : 'group-hover:scale-110'}`} />
                  {isPinned && <span className="animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Bottom user section */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700/50">
            <div className={`flex items-center ${isPinned ? 'gap-3 px-3' : 'justify-center px-0'} py-2`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/20 shrink-0">
                {userName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              {isPinned && (
                <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{userName}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Vault Keeper</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 relative">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/60 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">{activeTab}</h2>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-amber-500 dark:hover:text-amber-400 transition-all"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {onImport && (
              <button
                onClick={onImport}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
              </button>
            )}
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800/60 p-2 pr-4 rounded-xl transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-violet-500/20">
                {userName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 hidden sm:block">{userName}</span>
            </button>

            {isProfileOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 glass rounded-xl shadow-2xl shadow-black/20 dark:shadow-black/40 py-2 z-50">
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
