
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import TransactionModal from './components/TransactionModal';
import ImportModal from './components/ImportModal';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Incomes from './pages/Incomes';
import Savings from './pages/Savings';
import Configuration from './pages/Configuration';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { api } from './services/api';
import { Transaction, TransactionType } from './types';
import { ToastProvider, useToast } from './components/ToastContext';
import { ThemeProvider } from './components/ThemeContext';
import { DashboardSkeleton, FormSkeleton } from './components/Skeleton';

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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<TransactionType | undefined>(undefined);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchAllTransactions = async () => {
    setIsLoading(true);
    try {
      const [expensesRes, incomesRes, savingsRes] = await Promise.all([
        api.getExpenses(1),
        api.getIncomes(1),
        api.getSavings(1),
      ]);
      setTransactions([...expensesRes.data, ...incomesRes.data, ...savingsRes.data]);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/v1/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUsername(data.username);
        setIsAuthenticated(true);
        fetchAllTransactions();
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
      window.location.href = '/login';
    } catch (error) {
      console.error("Failed to logout:", error);
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

  const handleTransactionSuccess = () => {
    fetchAllTransactions();
    setRefreshKey(prev => prev + 1);
  };

  const handleImportSuccess = () => {
    fetchAllTransactions();
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
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/*" element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <Layout 
              userName={username}
              onLogout={handleLogout}
              onImport={() => setIsImportModalOpen(true)}
            >
              {isLoading ? (
                <DashboardSkeleton />
              ) : (
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/expenses" element={<Expenses onEdit={handleEditTransaction} onAdd={() => handleAddTransaction(TransactionType.EXPENSE)} refreshTrigger={refreshKey} />} />
                  <Route path="/incomes" element={<Incomes onEdit={handleEditTransaction} onAdd={() => handleAddTransaction(TransactionType.INCOME)} refreshTrigger={refreshKey} />} />
                  <Route path="/savings" element={<Savings onEdit={handleEditTransaction} onAdd={() => handleAddTransaction(TransactionType.SAVING)} refreshTrigger={refreshKey} />} />
                  <Route path="/configuration" element={<Configuration />} />
                  <Route path="/logout" element={<Logout onLogout={handleLogout} />} />
                  <Route path="*" element={
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                      <h1 className="text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-300 dark:from-slate-700 to-slate-400 dark:to-slate-500">404</h1>
                      <p className="text-lg text-slate-500 dark:text-slate-400 mt-4">Page not found</p>
                    </div>
                  } />
                </Routes>
              )}
            </Layout>
            <TransactionModal
              isOpen={isModalOpen}
              onClose={handleModalClose}
              onSuccess={handleTransactionSuccess}
              transaction={selectedTransaction}
              defaultType={modalDefaultType}
            />
            <ImportModal
              isOpen={isImportModalOpen}
              onClose={() => setIsImportModalOpen(false)}
              onSuccess={handleImportSuccess}
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
