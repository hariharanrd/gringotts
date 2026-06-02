import React, { useState, useEffect } from 'react';
import { 
  X, 
  Tag, 
  Upload, 
  Download, 
  Palette, 
  Check, 
  Sun, 
  Moon, 
  FileSpreadsheet, 
  FileText, 
  Info,
  Layers,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Pencil
} from 'lucide-react';
import { useTheme, THEME_LIBRARY } from './ThemeContext';
import { api } from '../services/api';
import { useToast } from './ToastContext';
import Configuration from '../pages/Configuration';

interface SetupPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

type TabType = 'categories' | 'import' | 'export' | 'appearance';

const SetupPanel: React.FC<SetupPanelProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const { showToast } = useToast();
  const { theme, setTheme, isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [menuOpen, setMenuOpen] = useState(false);

  // --- Import States ---
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<string>('HDFC');
  const [importLoading, setImportLoading] = useState(false);

  // --- Export States ---
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('xlsx');
  const [exportRangeType, setExportRangeType] = useState<'all' | 'custom'>('all');
  const [exportType, setExportType] = useState<string>('all');
  const [exportStartDate, setExportStartDate] = useState<string>('');
  const [exportEndDate, setExportEndDate] = useState<string>('');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Initialize export dates to 30 days ago and today
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
      };
      
      setExportStartDate(formatDate(thirtyDaysAgo));
      setExportEndDate(formatDate(today));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // --- Import Action ---
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      showToast('Please select a file', 'error');
      return;
    }

    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('type', importType);

    try {
      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      showToast('Transactions imported successfully', 'success');
      onImportSuccess();
      setImportFile(null);
    } catch (error) {
      console.error(error);
      showToast('Failed to import transactions', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  // --- Export Action ---
  const handleExportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (exportRangeType === 'custom') {
      if (!exportStartDate || !exportEndDate) {
        showToast('Please select start and end dates', 'error');
        return;
      }
      if (new Date(exportStartDate) > new Date(exportEndDate)) {
        showToast('Start date cannot be after end date', 'error');
        return;
      }
    }

    setExportLoading(true);

    try {
      const typeParam = exportType === 'all' ? undefined : exportType;
      
      const blob = await api.exportTransactions({
        format: exportFormat,
        type: typeParam,
        startDate: exportRangeType === 'custom' ? exportStartDate : undefined,
        endDate: exportRangeType === 'custom' ? exportEndDate : undefined,
        filters: [], // Global export from setup page doesn't have page filters
      });

      // Trigger file download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const todayStr = new Date().toISOString().split('T')[0];
      const filename = `${exportType}_export_${todayStr}.${exportFormat}`;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast(`Exported successfully as ${exportFormat.toUpperCase()}`, 'success');
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Failed to export transactions', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'categories', label: 'Categories & Items', icon: Tag },
    { id: 'import', label: 'Import Statement', icon: Download },
    { id: 'export', label: 'Export Data', icon: Upload },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-full max-w-3xl h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Vault Setup</h2>
              <p className="text-xs text-slate-400 mt-0.5">Customize preferences, import data, and configure elements.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-all"
            title="Close Setup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Segmented Bar (Desktop) & Select Dropdown (Mobile) */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          {/* Mobile Tab Select Dropdown */}
          <div className="sm:hidden relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = tabs.find(t => t.id === activeTab)?.icon || Tag;
                  return <Icon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
                })()}
                <span className="text-slate-800 dark:text-slate-200">
                  {tabs.find(t => t.id === activeTab)?.label}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all
                        ${isActive
                          ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Tab Navigation Segments */}
          <div className="hidden sm:block overflow-x-auto scrollbar-none">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl gap-1 min-w-max">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                      isActive 
                        ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <TabIcon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="animate-in fade-in duration-200">
              <Configuration isPanel={true} />
            </div>
          )}

          {/* IMPORT TAB */}
          {activeTab === 'import' && (
            <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Import Statement</h3>
                <p className="text-xs text-slate-400 mt-0.5">Upload a bank statement in CSV or Excel format to bulk import transaction records.</p>
              </div>

              <form onSubmit={handleImportSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Statement Source</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none text-slate-900 dark:text-white text-sm"
                    value={importType}
                    onChange={(e) => setImportType(e.target.value)}
                  >
                    <option value="HDFC">HDFC Bank</option>
                    <option value="APayCC">Amazon Pay ICICI</option>
                    <option value="HDFCCC">HDFC Credit Card</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Statement File</label>
                  <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/20 hover:border-cyan-500/30 transition-all group cursor-pointer">
                    <input
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      onChange={handleImportFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                      {importFile ? (
                        <>
                          <FileSpreadsheet className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
                          <span className="text-sm font-semibold text-emerald-500 dark:text-emerald-400 break-all px-4">{importFile.name}</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-10 h-10 text-slate-400 dark:text-slate-600 group-hover:scale-105 transition-transform" />
                          <div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Click or drag file here</span>
                            <p className="text-xs text-slate-400 mt-1">Supports CSV, XLSX, XLS files up to 10MB</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={importLoading || !importFile}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20 hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {importLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Import Statement
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* EXPORT TAB */}
          {activeTab === 'export' && (
            <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Export Data</h3>
                <p className="text-xs text-slate-400 mt-0.5">Download your financial transaction records locally in Excel or CSV formats.</p>
              </div>

              <form onSubmit={handleExportSubmit} className="space-y-5">
                
                {/* Format selection */}
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">File Format</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setExportFormat('xlsx')}
                      className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                        exportFormat === 'xlsx'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                      <span>XLSX (Excel)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportFormat('csv')}
                      className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                        exportFormat === 'csv'
                          ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <FileText className="w-5 h-5 text-blue-500" />
                      <span>CSV (Text)</span>
                    </button>
                  </div>
                </div>

                {/* Transaction Type selection */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Transaction Type</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none text-slate-900 dark:text-white text-sm"
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value)}
                  >
                    <option value="all">All Transactions</option>
                    <option value="expense">Expenses Only</option>
                    <option value="income">Incomes Only</option>
                    <option value="saving">Savings Only</option>
                  </select>
                </div>

                {/* Date range type */}
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Date Range</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setExportRangeType('all')}
                      className={`px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                        exportRangeType === 'all'
                          ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      All Data
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportRangeType('custom')}
                      className={`px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                        exportRangeType === 'custom'
                          ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      Custom Range
                    </button>
                  </div>
                </div>

                {/* Date custom inputs */}
                {exportRangeType === 'custom' && (
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 animate-in slide-in-from-top-3 duration-200">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Start Date</label>
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                        value={exportStartDate}
                        onChange={(e) => setExportStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">End Date</label>
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                        value={exportEndDate}
                        onChange={(e) => setExportEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Important note */}
                <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15 text-amber-700 dark:text-amber-400">
                  <Info className="w-5 h-5 mt-0.5 shrink-0 text-amber-500" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-bold text-amber-800 dark:text-amber-300">Important Limit Note</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      Maximum 3,000 rows will be exported. If your selected data exceeds this, only the latest 3,000 transactions will be included. Use date filters to export larger history in chunks.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={exportLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20 hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {exportLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Export Transactions
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Theme Library</h3>
                <p className="text-xs text-slate-400 mt-0.5">Select a design theme to personalize your dashboard. Your selection is automatically applied and saved.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {THEME_LIBRARY.map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`group relative text-left rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
                        isSelected
                          ? 'ring-2 shadow-lg scale-[1.01]'
                          : 'hover:ring-1 border border-slate-200 dark:border-slate-800'
                      }`}
                      style={{
                        background: t.colors.bg,
                        borderColor: isSelected ? t.colors.accent : t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                        ['--tw-ring-color' as any]: t.colors.accent,
                        boxShadow: isSelected ? `0 4px 20px ${t.colors.accent}30` : undefined,
                        ...(isSelected ? { outline: `2px solid ${t.colors.accent}`, outlineOffset: '1px' } : {}),
                      }}
                    >
                      {/* Selected indicator */}
                      {isSelected && (
                        <div
                          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center shadow-md z-10 animate-in zoom-in"
                          style={{ background: t.colors.accent }}
                        >
                          <Check className="w-3.5 h-3.5" style={{ color: t.isDark && t.id !== 'neo-pop' ? '#fff' : t.colors.bg }} />
                        </div>
                      )}

                      {/* Mini preview bar */}
                      <div className="flex gap-1.5 mb-3">
                        <div className="h-8 flex-1 rounded-lg" style={{ background: t.colors.surface, border: `1px solid ${t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }} />
                        <div className="h-8 w-10 rounded-lg" style={{ background: `linear-gradient(135deg, ${t.colors.accent}, ${t.colors.accentSecondary})` }} />
                      </div>

                      {/* Color swatches */}
                      <div className="flex gap-1.5 mb-3">
                        {[t.colors.bg, t.colors.surface, t.colors.accent, t.colors.accentSecondary, t.colors.text].map((c, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-full shadow-sm"
                            style={{ background: c, border: `1px solid ${t.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}
                          />
                        ))}
                      </div>

                      {/* Name & description */}
                      <h3 className="text-sm font-bold" style={{ color: t.colors.text }}>{t.name}</h3>
                      <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: t.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }}>
                        {t.description}
                      </p>

                      {/* Vibe tag */}
                      <span
                        className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          background: `${t.colors.accent}18`,
                          color: t.colors.accent,
                        }}
                      >
                        {t.vibe}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/35 border border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Quick Theme Switch</p>
                  <p className="mt-0.5">Toggle between dark and light modes quickly.</p>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center gap-2 py-2 px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-105 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition-all"
                >
                  {isDark ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Switch Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-blue-500" />
                      <span>Switch Dark</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default SetupPanel;
