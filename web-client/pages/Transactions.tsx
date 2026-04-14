import React from 'react';
import { Transaction } from '../types';

interface TransactionsProps {
  onEdit: (transaction: Transaction) => void;
  onAdd: () => void;
  refreshTrigger: number;
}

const Transactions: React.FC<TransactionsProps> = ({ onEdit, onAdd, refreshTrigger }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-serif">
      <h1 className="text-3xl font-bold text-amber-900">Transactions</h1>
    </div>
  );
};

export default Transactions;
