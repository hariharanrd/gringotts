import React, { useEffect, useState } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  Copy,
  ChevronRight,
  AlertCircle,
  Save,
  X,
  PlusCircle,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { Budget, BudgetCategoryAllocation, Category, BudgetUtilization } from '../types';
import { useToast } from '../components/ToastContext';
import ConfirmationDialog from '../components/ConfirmationDialog';

const BudgetPage: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Budget>>({
    name: '',
    total_amount: 0,
    estimated_savings: 0,
    is_master: false,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    allocations: []
  });

  const [activeTab, setActiveTab] = useState<'details' | 'allocations'>('details');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (selectId?: number) => {
    setLoading(true);
    try {
      const [budgetsRes, categoriesRes] = await Promise.all([
        api.getBudgets(),
        api.getCategories()
      ]);
      const newBudgets = budgetsRes.data;
      setBudgets(newBudgets);
      // Only keep expense/saving/revolving categories (not income)
      setCategories(categoriesRes.filter(c => c.type !== 'INCOME'));

      if (newBudgets.length > 0) {
        const idToSelect = selectId || selectedBudget?.id;
        const updatedSelection = newBudgets.find((b: Budget) => b.id === idToSelect) || newBudgets[0];
        setSelectedBudget(updatedSelection);
      }
    } catch (error) {
      showToast('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (budget: Budget) => {
    setFormData({ ...budget });
    setIsEditing(true);
    setActiveTab('details');
  };

  const handleAddNew = (isMaster: boolean = false) => {
    const nextMonth = new Date().getMonth() + 1;
    const nextYear = new Date().getFullYear();

    if (isMaster) {
      setFormData({
        name: 'Master Budget',
        total_amount: 0,
        estimated_savings: 0,
        is_master: true,
        allocations: []
      });
    } else {
      const masterBudget = budgets.find(b => b.is_master);
      if (masterBudget) {
        setFormData({
          name: `${masterBudget.name} — ${nextMonth}/${nextYear}`,
          total_amount: masterBudget.total_amount,
          estimated_savings: masterBudget.estimated_savings,
          is_master: false,
          month: nextMonth,
          year: nextYear,
          allocations: masterBudget.allocations?.map(a => ({
            category: a.category,
            allocated_amount: a.allocated_amount
          })) || []
        });
      } else {
        setFormData({
          name: `Budget ${nextMonth}/${nextYear}`,
          total_amount: 0,
          estimated_savings: 0,
          is_master: false,
          month: nextMonth,
          year: nextYear,
          allocations: []
        });
      }
    }
    setIsEditing(true);
    setActiveTab('details');
  };

  const handleClone = async (budget: Budget) => {
    const nextMonth = (budget.month || new Date().getMonth() + 1) % 12 + 1;
    const nextYear = nextMonth === 1 ? (budget.year || new Date().getFullYear()) + 1 : (budget.year || new Date().getFullYear());

    try {
      if (budget.id) {
        await api.createBudgetVersion(budget.id, nextMonth, nextYear);
        showToast('Budget cloned successfully', 'success');
        fetchData();
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to clone budget', 'error');
    }
  };

  const handleDelete = (id: number) => {
    setBudgetToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!budgetToDelete) return;
    try {
      await api.deleteBudget(budgetToDelete);
      showToast('Budget deleted', 'success');
      if (selectedBudget?.id === budgetToDelete) setSelectedBudget(null);
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete', 'error');
    } finally {
      setIsConfirmOpen(false);
      setBudgetToDelete(null);
    }
  };

  const handleSave = async () => {
    try {
      let savedId = formData.id;
      if (formData.id) {
        await api.updateBudget(formData.id, formData);
        showToast('Budget updated', 'success');
      } else {
        const data = await api.createBudget(formData);
        savedId = data.id;
        showToast('Budget created', 'success');
      }
      setIsEditing(false);
      fetchData(savedId);
    } catch (error: any) {
      showToast(error.message || 'Failed to save', 'error');
    }
  };

  const addAllocation = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    if (formData.allocations?.some(a => a.category.id === categoryId)) {
      showToast('Category already allocated', 'info');
      return;
    }

    setFormData({
      ...formData,
      allocations: [
        ...(formData.allocations || []),
        { category, allocated_amount: 0 }
      ]
    });
  };

  const updateAllocation = (index: number, amount: number) => {
    const newAllocations = [...(formData.allocations || [])];
    newAllocations[index].allocated_amount = amount;
    setFormData({ ...formData, allocations: newAllocations });
  };

  const removeAllocation = (index: number) => {
    const newAllocations = [...(formData.allocations || [])];
    newAllocations.splice(index, 1);
    setFormData({ ...formData, allocations: newAllocations });
  };

  const totalAllocated = formData.allocations?.reduce((sum, a) => sum + a.allocated_amount, 0) || 0;
  const isOverAllocated = totalAllocated > (formData.total_amount || 0);

  if (loading && budgets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Target className="w-7 h-7 text-cyan-500" />
            Budget Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Set goals and track your spending limits</p>
        </div>
        {!isEditing && (
          <div className="flex gap-3">
            <button
              onClick={() => handleAddNew(true)}
              disabled={budgets.some(b => b.is_master)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Master Template
            </button>
            <button
              onClick={() => handleAddNew(false)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              New Monthly Budget
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar: Budget List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider ml-1">Templates & Versions</h3>
          <div className="space-y-2">
            {budgets.map(budget => (
              <div
                key={budget.id}
                onClick={() => !isEditing && setSelectedBudget(budget)}
                className={`
                  group p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden
                  ${selectedBudget?.id === budget.id
                    ? 'bg-white dark:bg-slate-900 border-cyan-500/50 shadow-xl shadow-cyan-500/5 ring-1 ring-cyan-500/20'
                    : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}
                  ${isEditing ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                {budget.is_master && (
                  <div className="absolute top-0 right-0 p-1.5 bg-cyan-500 text-white transform rotate-0 rounded-bl-xl shadow-lg">
                    <Target className="w-3 h-3" />
                  </div>
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${budget.is_master ? 'text-cyan-500' : 'text-slate-400'}`}>
                    {budget.is_master ? 'Master Template' : `${budget.year} • Month ${budget.month}`}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(budget); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-500 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!budget.is_master && (
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(budget.id!); }} className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg text-slate-400 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white truncate pr-6">{budget.name}</h4>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-200">₹{(budget.total_amount || 0).toLocaleString()}</span>
                  <span className="text-xs text-slate-400">allocated</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {isEditing ? (
            <div className="glass-card rounded-3xl p-8 border-cyan-500/20 shadow-2xl shadow-cyan-500/5 mt-9">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <Edit2 className="w-5 h-5 text-cyan-500" />
                  {formData.id ? 'Edit Budget' : 'Configure New Budget'}
                </h2>
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'details' ? 'bg-white dark:bg-slate-700 shadow-md text-cyan-600 dark:text-cyan-400' : 'text-slate-500'}`}
                  >
                    Header
                  </button>
                  <button
                    onClick={() => setActiveTab('allocations')}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'allocations' ? 'bg-white dark:bg-slate-700 shadow-md text-cyan-600 dark:text-cyan-400' : 'text-slate-500'}`}
                  >
                    Allocations
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {activeTab === 'details' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Budget Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                        placeholder="e.g. Dream Life Budget"
                      />
                    </div>

                    {!formData.is_master && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Month</label>
                          <select
                            value={formData.month}
                            onChange={e => setFormData({ ...formData, month: parseInt(e.target.value) })}
                            className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-900 dark:text-white"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                              <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Year</label>
                          <input
                            type="number"
                            value={formData.year}
                            onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                            className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-900 dark:text-white"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Monthly Cap (₹)</label>
                      <input
                        type="number"
                        value={formData.total_amount}
                        onChange={e => setFormData({ ...formData, total_amount: parseFloat(e.target.value) })}
                        className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Savings Target (₹) <span className="lowercase font-normal text-slate-500">(auto-calculated)</span></label>
                      <input
                        type="number"
                        readOnly
                        value={formData.allocations?.filter(a => a.category.type === 'SAVING').reduce((sum, a) => sum + a.allocated_amount, 0) || 0}
                        className="w-full bg-slate-100/20 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-500 cursor-not-allowed font-bold"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Notes</label>
                      <textarea
                        value={formData.notes || ''}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-900 dark:text-white h-24"
                        placeholder="Strategy for this month..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category Allocations</p>
                        <p className="text-xs text-slate-500">Distribute your cap among categories</p>
                      </div>
                      <div className={`px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 ${isOverAllocated ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {isOverAllocated ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        ₹{totalAllocated.toLocaleString()} / ₹{(formData.total_amount || 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {formData.allocations?.map((alloc, idx) => (
                        <div key={alloc.category.id} className="flex items-center gap-4 bg-slate-100/30 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 group">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{alloc.category.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{alloc.category.type}</p>
                          </div>
                          <div className="w-40 relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                            <input
                              type="number"
                              value={alloc.allocated_amount}
                              onChange={e => updateAllocation(idx, parseFloat(e.target.value) || 0)}
                              className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm font-bold text-slate-900 dark:text-white"
                            />
                          </div>
                          <button onClick={() => removeAllocation(idx)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {formData.allocations?.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
                          No categories allocated yet
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Add Category</p>
                      <div className="flex flex-wrap gap-2">
                        {categories
                          .filter(cat => !formData.allocations?.some(a => a.category.id === cat.id))
                          .map(cat => (
                            <button
                              key={cat.id}
                              onClick={() => addAllocation(cat.id)}
                              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-cyan-500 hover:border-cyan-500 hover:text-white transition-all flex items-center gap-1.5"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              {cat.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!formData.name || (formData.total_amount || 0) <= 0 || isOverAllocated}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold rounded-2xl shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
                  >
                    <Save className="w-4 h-4" />
                    {formData.id ? 'Save Updates' : 'Create Budget'}
                  </button>
                </div>
              </div>
            </div>
          ) : selectedBudget ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 mt-9">
              <div className="glass-card rounded-3xl p-8 overflow-hidden relative border-cyan-500/5 shadow-2xl shadow-black/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-32 -mt-32" />

                <div className="relative flex items-start justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${selectedBudget.is_master ? 'bg-cyan-500/10 text-cyan-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {selectedBudget.is_master ? 'Active Template' : `${new Date(2000, (selectedBudget.month || 1) - 1).toLocaleString('default', { month: 'long' })} ${selectedBudget.year}`}
                      </span>
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{selectedBudget.name}</h2>
                    </div>
                    {selectedBudget.notes && <p className="text-slate-500 dark:text-slate-400 max-w-lg mt-2 italic">“{selectedBudget.notes}”</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleClone(selectedBudget)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:shadow-lg transition-all">
                      <Copy className="w-4 h-4" />
                      Clone
                    </button>
                    <button onClick={() => handleEdit(selectedBudget)} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 transition-all font-semibold text-sm">
                      <Edit2 className="w-4 h-4" />
                      Edit Details
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Capacity</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">₹{selectedBudget.total_amount.toLocaleString()}</span>
                      <span className="text-sm font-medium text-slate-500">limit</span>
                    </div>
                  </div>
                  <div className="p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-3xl border border-emerald-500/10">
                    <p className="text-xs font-bold text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-widest mb-1">Savings Objective</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">₹{selectedBudget.estimated_savings.toLocaleString()}</span>
                      <span className="text-sm font-medium text-emerald-500/60 font-bold">🎯</span>
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center justify-between">
                    Budget Split
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">{selectedBudget.allocations.length} categories</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {selectedBudget.allocations.map(alloc => (
                      <div key={alloc.category.id} className="group">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-cyan-500 transition-colors">{alloc.category.name}</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">₹{alloc.allocated_amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                            style={{ width: `${Math.min((alloc.allocated_amount / selectedBudget.total_amount) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {selectedBudget.allocations.length === 0 && (
                      <div className="md:col-span-2 py-8 text-center text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                        No category splits defined for this budget
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-12 bg-white/30 dark:bg-slate-900/10 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800/50 mt-9">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                <Target className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Select a context to begin</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">Choose a budget from the list or create a fresh monthly version to manage your financial limits.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Budget"
        message="Are you sure you want to delete this budget version? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
};

export default BudgetPage;
