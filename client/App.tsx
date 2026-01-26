
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import TransactionModal from './components/TransactionModal';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Configuration from './pages/Configuration';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { api } from './services/api';
import { Transaction } from './types';
import { ToastProvider, useToast } from './components/ToastContext';

const PrivateRoute: React.FC<{ children: React.ReactNode; isAuthenticated: boolean | null }> = ({ children, isAuthenticated }) => {
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode; isAuthenticated: boolean | null }> = ({ children, isAuthenticated }) => {
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
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
      <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
};

const GringottsApp: React.FC = () => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const fetchAllTransactions = async () => {
    setIsLoading(true);
    try {
      const [expensesData, incomesData, savingsData] = await Promise.all([
        api.getExpenses(),
        api.getIncomes(),
        api.getSavings(),
      ]);
      setTransactions([...expensesData, ...incomesData, ...savingsData]);
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

  const handleDeleteTransaction = async (id: number) => {
    try {
      await api.deleteTransaction(id)
      setTransactions(prev => prev.filter(t => t.id !== id));
      showToast('Transaction deleted successfully', 'success');
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      showToast('Failed to delete transaction', 'error');
    }
  };

  const handleEditTransaction = async (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true); 
  }

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
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
            >
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading your finances...</p>
                  </div>
                </div>
              ) : (
                <Routes>
                  <Route path="/dashboard" element={<Dashboard transactions={transactions} />} />
                  <Route path="/transactions" element={<Transactions transactions={transactions} onDelete={handleDeleteTransaction} onEdit={handleEditTransaction} onAdd={() => setIsModalOpen(true)} />} />
                  <Route path="/configuration" element={<Configuration />} />
                  <Route path="/logout" element={<Logout onLogout={handleLogout} />} />
                  <Route path="*" element={
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                      <h1 className="text-6xl font-bold text-slate-200">404</h1>
                      <p className="text-xl text-slate-600 mt-4">Page not found</p>
                    </div>
                  } />
                </Routes>
              )}
            </Layout>
            <TransactionModal
              isOpen={isModalOpen}
              onClose={handleModalClose}
              onSuccess={fetchAllTransactions}
              transaction={selectedTransaction}
            />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <GringottsApp />
    </ToastProvider>
  );
};

export default App;
