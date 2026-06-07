
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import TransactionModal from './components/TransactionModal';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import ScheduledTransactions from './pages/ScheduledTransactions';
import ScheduleDetails from './pages/ScheduleDetails';
import Configuration from './pages/Configuration';
import Budget from './pages/Budget';
import InvestmentPlanner from './pages/InvestmentPlanner';
import CreditCards from './pages/CreditCards';
import CreditCardDetails from './pages/CreditCardDetails';
import TransactionDetails from './pages/TransactionDetails';
import Account from './pages/Account';
import Loans from './pages/Loans';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Transaction, TransactionType } from './types';
import { ToastProvider, useToast } from './components/ToastContext';
import { ThemeProvider } from './components/ThemeContext';
import { personalizationSync } from './services/personalizationSync';
import { DashboardSkeleton, FormSkeleton } from './components/Skeleton';
import { getUserTimeZone } from './services/dateUtils';

const PrivateRoute: React.FC<{ children: React.ReactNode; isAuthenticated: boolean | null }> = ({ children, isAuthenticated }) => {
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
        <div className="max-w-[1400px] mx-auto">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

const PublicRoute: React.FC<{ children: React.ReactNode; isAuthenticated: boolean | null }> = ({ children, isAuthenticated }) => {
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 w-full px-4 pt-10">
          <FormSkeleton />
        </div>
      </div>
    );
  }
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
};

const Logout: React.FC<{ onLogout: () => Promise<void> }> = ({ onLogout }) => {
  useEffect(() => {
    onLogout();
  }, [onLogout]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-slate-300 dark:border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Signing out...</p>
      </div>
    </div>
  );
};

const GringottsApp: React.FC = () => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<TransactionType | undefined>(undefined);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [username, setUsername] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [hasRecoveryEmail, setHasRecoveryEmail] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/v1/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUsername(data.username);
        setDisplayName(data.displayName || '');
        setProfilePicture(data.profilePicture || '');
        setHasRecoveryEmail(data.hasRecoveryEmail === 'true');
        await personalizationSync.syncFromBackend();
        
        // Detect and save timezone if not already set
        if (!localStorage.getItem('gringotts-timezone')) {
          const currentTz = getUserTimeZone();
          personalizationSync.save('UI', 'TIMEZONE', currentTz);
        }

        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
      localStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      console.error("Failed to logout:", error);
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const handleEditTransaction = async (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setModalDefaultType(undefined);
    setIsModalOpen(true);
  }

  const handleAddTransaction = (type?: TransactionType) => {
    setSelectedTransaction(null);
    setModalDefaultType(type);
    setIsModalOpen(true);
  }

  const handleTransactionSuccess = (_savedType?: TransactionType, _savedId?: number) => {
    setRefreshKey(prev => prev + 1);
  };

  const handleImportSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
    setModalDefaultType(undefined);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PublicRoute isAuthenticated={isAuthenticated}><Login onLoginSuccess={fetchUser} /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute isAuthenticated={isAuthenticated}><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute isAuthenticated={isAuthenticated}><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute isAuthenticated={isAuthenticated}><ResetPassword /></PublicRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/*" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <Layout
              userName={username}
              displayName={displayName}
              profilePicture={profilePicture}
              hasRecoveryEmail={hasRecoveryEmail}
              onLogout={handleLogout}
              onImportSuccess={handleImportSuccess}
            >
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions onEdit={handleEditTransaction} onAdd={handleAddTransaction} refreshTrigger={refreshKey} />} />
                <Route path="/transaction/:id" element={<TransactionDetails />} />
                <Route path="/schedules" element={<ScheduledTransactions />} />
                <Route path="/schedules/:id" element={<ScheduleDetails />} />
                <Route path="/budget" element={<Budget />} />
                <Route path="/investment-planner" element={<InvestmentPlanner />} />
                <Route path="/loans" element={<Loans />} />
                <Route path="/credit-cards" element={<CreditCards />} />
                <Route path="/credit-cards/:id" element={<CreditCardDetails />} />

                <Route path="/account" element={<Account onProfileUpdate={fetchUser} />} />
                <Route path="/logout" element={<Logout onLogout={handleLogout} />} />
                <Route path="*" element={
                  <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <h1 className="text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-300 dark:from-slate-700 to-slate-400 dark:to-slate-500">404</h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 mt-4">Page not found</p>
                  </div>
                } />
              </Routes>
            </Layout>
            <TransactionModal
              isOpen={isModalOpen}
              onClose={handleModalClose}
              onSuccess={handleTransactionSuccess}
              transaction={selectedTransaction}
              defaultType={modalDefaultType}
            />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <GringottsApp />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
