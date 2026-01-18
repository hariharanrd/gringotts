
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import TransactionModal from './components/TransactionModal';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Configuration from './pages/Configuration';
import { api } from './services/api';
import { Expense, Income, Saving, Transaction, TransactionType } from './types';

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllTransactions = async () => {
    setIsLoading(true);
    try {
      const [expensesData, incomesData, savingsData] = await Promise.all([
        api.getExpenses(),
        api.getIncomes(),
        api.getSavings(),
      ]);
      setExpenses(expensesData);
      setIncomes(incomesData);
      setSavings(savingsData);
      setTransactions([...expensesData, ...incomesData, ...savingsData]);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  const handleDeleteTransaction = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      await api.deleteTransaction(id)
      setTransactions(prev => prev.filter(t => t.id !== id));
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
      <Layout 
        onAddClick={() => setIsModalOpen(true)}
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard transactions={transactions} />} />
            <Route path="/transactions" element={<Transactions transactions={transactions} onDelete={handleDeleteTransaction} onEdit={handleEditTransaction} />} />
            <Route path="/configuration" element={<Configuration />} />
          </Routes>
        )}
      </Layout>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        onSuccess={fetchAllTransactions}
        transaction={selectedTransaction}
      />
    </Router>
  );
};

export default App;
