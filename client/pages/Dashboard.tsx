
import React, { useEffect, useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Sparkles,
  TrendingUp,
  CreditCard
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

const COLORS = ['#b45309', '#059669', '#d97706', '#be123c', '#7c3aed']; // Amber, Emerald, Gold, Rose, Violet

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [aiInsight, setAiInsight] = useState<string>("Analyzing your spending...");

  useEffect(() => {
    if (transactions.length > 0) {
      getFinancialInsights(transactions).then(setAiInsight);
    }
  }, [transactions]);

  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.value, 0);

  const totalExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.value, 0);

  const totalSavings = transactions
    .filter(t => t.type === TransactionType.SAVING)
    .reduce((sum, t) => sum + t.value, 0);

  const balance = totalIncome - totalExpense;

  // Formatting for Charts
  const chartData = [
    { name: 'Income', amount: totalIncome },
    { name: 'Expense', amount: totalExpense },
    { name: 'Savings', amount: totalSavings },
  ];

  const pieData = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc: any[], t) => {
      const existing = acc.find(a => a.name === t.description); // Simplified for mock
      if (existing) existing.value += t.value;
      else acc.push({ name: t.description, value: t.value });
      return acc;
    }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-serif">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Current Balance" 
          value={`₹${balance.toLocaleString()}`} 
          icon={Wallet} 
          color="blue"
          trend="+2.5% vs last month"
        />
        <StatCard 
          title="Total Income" 
          value={`₹${totalIncome.toLocaleString()}`} 
          icon={ArrowUpRight} 
          color="emerald" 
          trend="Increasing"
        />
        <StatCard 
          title="Total Expense" 
          value={`₹${totalExpense.toLocaleString()}`} 
          icon={ArrowDownRight} 
          color="rose" 
          trend="-12% vs last month"
        />
        <StatCard 
          title="Total Savings" 
          value={`₹${totalSavings.toLocaleString()}`} 
          icon={TrendingUp} 
          color="amber" 
          trend="Goal: $10,000"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-amber-50 p-6 rounded-2xl shadow-sm border border-amber-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-amber-900 text-lg">Vault Overview</h3>
            <select className="bg-amber-100 border-none text-sm font-semibold text-amber-900 rounded-lg px-3 py-1 outline-none cursor-pointer hover:bg-amber-200 transition-colors">
              <option>Last 30 Days</option>
              <option>Year to Date</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fde68a" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78350f', fontSize: 12, fontFamily: 'serif'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#78350f', fontSize: 12, fontFamily: 'serif'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: '2px solid #d97706', backgroundColor: '#fffbeb', color: '#78350f', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="amount" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl text-amber-50 relative overflow-hidden group border-2 border-amber-700">
          <Sparkles className="absolute top-4 right-4 text-white/20 w-12 h-12 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            Goblin Financial Advisor
          </h3>
          <div className="space-y-4">
             <p className="text-amber-100/90 text-sm leading-relaxed whitespace-pre-line italic font-serif">
              "{aiInsight}"
            </p>
            <div className="pt-4 border-t border-amber-500/30">
              <button className="w-full bg-amber-900/50 hover:bg-amber-900/70 border border-amber-700/50 py-2 rounded-xl text-xs font-semibold transition-colors text-amber-200">
                Consult the Prophecy
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Distribution */}
        <div className="bg-amber-50 p-6 rounded-2xl shadow-sm border border-amber-200">
           <h3 className="font-bold text-amber-900 mb-6 text-lg">Spending Distribution</h3>
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
                  <Tooltip />
                </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-amber-50 p-6 rounded-2xl shadow-sm border border-amber-200">
          <h3 className="font-bold text-amber-900 mb-6 text-lg">Recent Ledger Entries</h3>
          <div className="space-y-4">
            {transactions.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 hover:bg-amber-100/50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-amber-200">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    t.type === TransactionType.EXPENSE ? 'bg-rose-100 text-rose-700' :
                    t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {t.type === TransactionType.EXPENSE ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-900">{t.description}</p>
                    <p className="text-xs text-amber-700/70">{new Date(t.transaction_time).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className={`text-sm font-bold ${
                  t.type === TransactionType.EXPENSE ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {t.type === TransactionType.EXPENSE ? '-' : '+'}₹{t.value}
                </p>
              </div>
            ))}
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
  color: 'blue' | 'emerald' | 'rose' | 'amber';
  trend: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  const colors = {
    blue: 'bg-amber-100 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-100 text-rose-700 border-rose-200',
    amber: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  };

  return (
    <div className="bg-amber-50 p-6 rounded-2xl shadow-sm border border-amber-200 group hover:shadow-md transition-shadow hover:border-amber-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colors[color]} transition-transform group-hover:scale-110`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-xs font-medium text-amber-800/60">{trend}</span>
      </div>
      <p className="text-amber-800/70 text-sm font-medium">{title}</p>
      <h4 className="text-2xl font-bold text-amber-900 mt-1">{value}</h4>
    </div>
  );
};

export default Dashboard;
