
import React, { useEffect, useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';
import { Transaction, TransactionType } from '../types';
import { getFinancialInsights } from '../services/geminiService';

interface DashboardProps {
  transactions: Transaction[];
}

const COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f43f5e', '#f59e0b'];

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [aiInsight, setAiInsight] = useState<string>("Analyzing your spending...");

  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.transaction_time);
    return transactionDate >= lastMonth && transactionDate <= lastMonthEnd;
  });

  useEffect(() => {
    if (filteredTransactions.length > 0) {
      getFinancialInsights(filteredTransactions).then(setAiInsight);
    }
  }, [filteredTransactions]);

  const totalIncome = filteredTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.value, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.value, 0);

  const totalSavings = filteredTransactions
    .filter(t => t.type === TransactionType.SAVING)
    .reduce((sum, t) => sum + t.value, 0);

  const balance = totalIncome - totalExpense;

  const chartData = [
    { name: 'Income', amount: totalIncome },
    { name: 'Expense', amount: totalExpense },
    { name: 'Savings', amount: totalSavings },
  ];

  const pieData = filteredTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc: any[], t) => {
      const existing = acc.find(a => a.name === t.description);
      if (existing) existing.value += t.value;
      else acc.push({ name: t.description, value: t.value });
      return acc;
    }, []);

  return (
    <div className="space-y-8">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Current Balance" 
          value={`₹${balance.toLocaleString()}`} 
          icon={Wallet} 
          gradient="from-cyan-500 to-blue-600"
          shadowColor="shadow-cyan-500/10"
        />
        <StatCard 
          title="Total Income" 
          value={`₹${totalIncome.toLocaleString()}`} 
          icon={ArrowUpRight} 
          gradient="from-emerald-500 to-teal-600"
          shadowColor="shadow-emerald-500/10"
        />
        <StatCard 
          title="Total Expense" 
          value={`₹${totalExpense.toLocaleString()}`} 
          icon={ArrowDownRight} 
          gradient="from-rose-500 to-pink-600"
          shadowColor="shadow-rose-500/10"
        />
        <StatCard 
          title="Total Savings" 
          value={`₹${totalSavings.toLocaleString()}`} 
          icon={TrendingUp} 
          gradient="from-violet-500 to-purple-600"
          shadowColor="shadow-violet-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-semibold text-white text-lg">Overview</h3>
            <span className="text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg font-medium">Last 30 Days</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: '1px solid rgba(148,163,184,0.15)', backgroundColor: 'rgba(15,23,42,0.95)', color: '#e2e8f0', backdropFilter: 'blur(12px)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'}}
                  labelStyle={{color: '#94a3b8'}}
                />
                <Area type="monotone" dataKey="amount" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight Card */}
        <div className="relative rounded-2xl p-6 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-slate-900 to-cyan-600/20 rounded-2xl"></div>
          <div className="absolute inset-[1px] bg-slate-900 rounded-2xl"></div>
          <div className="relative z-10">
            <Sparkles className="absolute top-0 right-0 text-violet-400/20 w-12 h-12 group-hover:scale-110 transition-transform" />
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-white">
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">AI Insights</span>
            </h3>
            <div className="space-y-4">
              <p className="text-slate-300/90 text-sm leading-relaxed whitespace-pre-line">
                {aiInsight}
              </p>
              <div className="pt-4 border-t border-slate-700/50">
                <button className="w-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 py-2.5 rounded-xl text-xs font-semibold transition-all text-slate-300 hover:text-white">
                  Generate New Insight
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Distribution */}
        <div className="glass-card rounded-2xl p-6">
           <h3 className="font-semibold text-white mb-6 text-lg">Spending Distribution</h3>
           <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.length > 0 ? pieData : [{name: 'No Expenses', value: 1}]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{borderRadius: '12px', border: '1px solid rgba(148,163,184,0.15)', backgroundColor: 'rgba(15,23,42,0.95)', color: '#e2e8f0'}}
                  />
                </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Recent Activity List */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-6 text-lg">Recent Transactions</h3>
          <div className="space-y-3">
            {filteredTransactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-700/30 rounded-xl transition-all duration-200 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    t.type === TransactionType.EXPENSE ? 'bg-rose-500/10 text-rose-400' :
                    t.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-400' :
                    'bg-violet-500/10 text-violet-400'
                  }`}>
                    {t.type === TransactionType.EXPENSE ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{t.description}</p>
                    <p className="text-xs text-slate-500">{new Date(t.transaction_time).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${
                  t.type === TransactionType.EXPENSE ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {t.type === TransactionType.EXPENSE ? '-' : '+'}₹{t.value.toLocaleString()}
                </p>
              </div>
            ))}
            {filteredTransactions.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">No transactions this period</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: any;
  gradient: string;
  shadowColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, gradient, shadowColor }) => {
  return (
    <div className={`glass-card rounded-2xl p-6 group hover:border-slate-600/30 transition-all duration-300 ${shadowColor}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`bg-gradient-to-br ${gradient} p-2.5 rounded-xl shadow-lg ${shadowColor} transition-transform group-hover:scale-110 duration-300`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-slate-400 text-sm font-medium">{title}</p>
      <h4 className="text-2xl font-bold text-white mt-1">{value}</h4>
    </div>
  );
};

export default Dashboard;
