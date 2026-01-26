
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Settings, 
  Menu, 
  X,
  Wallet,
  LogOut
} from 'lucide-react';

interface LayoutProps {
  userName: string;
  children: React.ReactNode;
  onLogout: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'transactions', label: 'Transactions', icon: ReceiptText, path: '/transactions' },
  { id: 'configuration', label: 'Configuration', icon: Settings, path: '/configuration' },
];

const Layout: React.FC<LayoutProps> = ({ userName, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const activeTab = location.pathname.replace('/', '');

  return (
    <div className="flex h-screen overflow-hidden font-serif bg-stone-900">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-amber-50 border-r-4 border-double border-amber-900 transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3 border-b border-amber-200">
            <div className="bg-amber-800 p-2 rounded-lg shadow-lg">
              <Wallet className="text-amber-50 w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-amber-900 tracking-tight">Gringotts</h1>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                  ${activeTab === item.id 
                    ? 'bg-amber-200 text-amber-900 shadow-inner' 
                    : 'text-amber-800 hover:bg-amber-100 hover:text-amber-900'}
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-stone-900 relative bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-amber-50/90 backdrop-blur-md border-b-4 border-double border-amber-900 px-6 py-4 flex items-center justify-between shadow-md">
          <button 
            className="md:hidden text-amber-900"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="hidden md:block">
            <h2 className="text-lg font-bold text-amber-900 capitalize font-serif">{activeTab}</h2>
          </div>

          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-4 hover:bg-amber-100 p-2 rounded-xl transition-colors text-right"
            >
              <div className="flex flex-col">
                <span className="text-xs text-amber-800 font-medium">Vault Keeper</span>
                <span className="text-sm font-bold text-amber-900 uppercase">{userName}</span>
              </div>
              <img 
                src="https://picsum.photos/40/40" 
                alt="Profile" 
                className="w-10 h-10 rounded-full border-2 border-amber-700"
              />
            </button>

            {isProfileOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-amber-50 rounded-xl shadow-xl border-2 border-amber-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                <Link to="/logout" className="flex items-center gap-2 px-4 py-2 text-sm text-rose-700 hover:bg-rose-100 transition-colors w-full font-bold">
                  <LogOut className="w-4 h-4" />
                  Logout
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
