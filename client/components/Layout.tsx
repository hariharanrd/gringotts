
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Settings, 
  PlusCircle, 
  Menu, 
  X,
  Wallet,
  TrendingUp,
  PieChart
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onAddClick: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'transactions', label: 'Transactions', icon: ReceiptText, path: '/transactions' },
  { id: 'configuration', label: 'Configuration', icon: Settings, path: '/configuration' },
];

const Layout: React.FC<LayoutProps> = ({ children, onAddClick }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const activeTab = location.pathname.replace('/', '');

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3 border-b border-slate-100">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Wallet className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gringotts</h1>
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
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <button 
              onClick={onAddClick}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md shadow-blue-200"
            >
              <PlusCircle className="w-5 h-5" />
              New Transaction
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <button 
            className="md:hidden text-slate-600"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-slate-800 capitalize">{activeTab}</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right">
              <span className="text-xs text-slate-500 font-medium">Logged in as</span>
              <span className="text-sm font-semibold text-slate-900 uppercase">Demo User</span>
            </div>
            <img 
              src="https://picsum.photos/40/40" 
              alt="Profile" 
              className="w-10 h-10 rounded-full border border-slate-200"
            />
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
