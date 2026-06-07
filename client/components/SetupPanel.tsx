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
  Pencil,
  Database,
  Loader2,
  AlertTriangle,
  RefreshCcw,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  Copy
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

type TabType = 'categories' | 'import' | 'export' | 'integrations' | 'appearance';

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

  // --- Zoho Integration States ---
  const [zohoStatus, setZohoStatus] = useState<any>(null);
  const [zohoLoading, setZohoLoading] = useState(false);
  const [zohoSaving, setZohoSaving] = useState(false);
  const [zohoSyncing, setZohoSyncing] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);

  const [zohoClientId, setZohoClientId] = useState('');
  const [zohoClientSecret, setZohoClientSecret] = useState('');
  const [zohoRefreshToken, setZohoRefreshToken] = useState('');
  const [zohoWorkspaceName, setZohoWorkspaceName] = useState('');
  const [zohoDataCenter, setZohoDataCenter] = useState('com');

  const fetchZohoStatus = async () => {
    setZohoLoading(true);
    try {
      const status = await (api as any).getZohoStatus();
      setZohoStatus(status);
      if (status.connected) {
        setZohoWorkspaceName(status.workspaceName || '');
        setZohoDataCenter(status.dataCenter || 'com');
      }
    } catch (err) {
      console.error('Failed to fetch Zoho status', err);
    } finally {
      setZohoLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'integrations' && isOpen) {
      fetchZohoStatus();
    }
  }, [activeTab, isOpen]);

  const handleConnectZoho = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zohoClientId || !zohoClientSecret || !zohoRefreshToken || !zohoWorkspaceName) {
      showToast('Please fill in all connection details', 'error');
      return;
    }
    setZohoSaving(true);
    try {
      await (api as any).connectZoho({
        clientId: zohoClientId,
        clientSecret: zohoClientSecret,
        refreshToken: zohoRefreshToken,
        workspaceName: zohoWorkspaceName,
        dataCenter: zohoDataCenter
      });
      showToast('Successfully connected to Zoho Analytics', 'success');
      await fetchZohoStatus();
    } catch (err: any) {
      showToast(err.message || 'Connection failed', 'error');
    } finally {
      setZohoSaving(false);
    }
  };

  const handleSyncZoho = async () => {
    setZohoSyncing(true);
    try {
      await (api as any).syncZoho();
      showToast('Synchronization completed successfully', 'success');
      await fetchZohoStatus();
    } catch (err: any) {
      showToast(err.message || 'Synchronization failed', 'error');
      await fetchZohoStatus();
    } finally {
      setZohoSyncing(false);
    }
  };

  const handleDisconnectZoho = async () => {
    if (!confirm('Are you sure you want to disconnect Zoho Analytics? Your credentials will be removed.')) {
      return;
    }
    try {
      await (api as any).disconnectZoho();
      showToast('Disconnected successfully', 'success');
      setZohoClientId('');
      setZohoClientSecret('');
      setZohoRefreshToken('');
      setZohoWorkspaceName('');
      setZohoDataCenter('com');
      await fetchZohoStatus();
    } catch (err: any) {
      showToast(err.message || 'Disconnection failed', 'error');
    }
  };

  const [scopesCopied, setScopesCopied] = useState(false);

  const handleCopyScopes = async () => {
    try {
      await navigator.clipboard.writeText('ZohoAnalytics.metadata.all, ZohoAnalytics.data.all');
      setScopesCopied(true);
      setTimeout(() => setScopesCopied(false), 2000);
      showToast('Scopes copied to clipboard', 'success');
    } catch (err) {
      showToast('Failed to copy scopes', 'error');
    }
  };

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
    { id: 'integrations', label: 'Integrations', icon: Database },
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

          {/* INTEGRATIONS TAB */}
          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">External Integrations</h3>
                <p className="text-xs text-slate-400 mt-0.5">Connect your Gringotts account to external analytics platforms for advanced dashboarding.</p>
              </div>

              {zohoLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                </div>
              ) : zohoStatus?.connected ? (
                // CONNECTED VIEW
                <div className="space-y-6">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Connected to Zoho Analytics</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                        {zohoStatus.dataCenter ? zohoStatus.dataCenter.toUpperCase() : 'COM'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400">Workspace</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{zohoStatus.workspaceName}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Last Synced</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {zohoStatus.lastSyncedAt ? new Date(zohoStatus.lastSyncedAt).toLocaleString() : 'Never'}
                        </p>
                      </div>
                    </div>

                    {zohoStatus.lastSyncError && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-lg flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-rose-800 dark:text-rose-400">
                          <p className="font-semibold">Last Sync Error:</p>
                          <p className="mt-0.5">{zohoStatus.lastSyncError}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Automatically Syncing Everyday:</p>
                    <p>Gringotts runs a background task once everyday at 1:00 AM to automatically append your latest transactions, categories, subcategories, and items to Zoho.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={handleSyncZoho}
                      disabled={zohoSyncing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-lg shadow-cyan-500/20"
                    >
                      {zohoSyncing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Syncing Data...
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="w-4 h-4" />
                          Sync Now
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDisconnectZoho}
                      className="px-4 py-2.5 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 text-sm font-semibold transition-all"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                // CONNECT FORM
                <form onSubmit={handleConnectZoho} className="space-y-4">
                  <div className="p-4 bg-cyan-50 dark:bg-cyan-950/10 border border-cyan-100 dark:border-cyan-900/30 rounded-xl text-xs text-cyan-800 dark:text-cyan-400 leading-relaxed">
                    <p className="font-semibold mb-1">Before connecting:</p>
                    <p className="mb-2">You need to register a "Self Client" in your Zoho API Console and generate credentials.</p>
                    <div className="mb-2">
                      <strong className="font-bold">Required Scopes:</strong> When generating your code/refresh token, you must request the following scopes:
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 p-1.5 bg-cyan-100/50 dark:bg-cyan-950/50 rounded font-mono select-all text-[10px] border border-cyan-200/30 truncate">
                          ZohoAnalytics.metadata.all, ZohoAnalytics.data.all
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyScopes}
                          className="p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white transition-all shadow-sm shrink-0 flex items-center justify-center"
                          title="Copy scopes to clipboard"
                        >
                          {scopesCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <a
                      href="https://api-console.zoho.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 font-semibold inline-flex items-center gap-1"
                    >
                      Open Zoho API Console <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Client ID
                      </label>
                      <input
                        type="text"
                        value={zohoClientId}
                        onChange={e => setZohoClientId(e.target.value)}
                        placeholder="Paste your Zoho Client ID"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all focus:bg-white dark:focus:bg-slate-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Data Center
                      </label>
                      <div className="relative">
                        <select
                          value={zohoDataCenter}
                          onChange={e => setZohoDataCenter(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all appearance-none focus:bg-white dark:focus:bg-slate-900"
                        >
                          <option value="com">US (.com)</option>
                          <option value="eu">Europe (.eu)</option>
                          <option value="in">India (.in)</option>
                          <option value="com.au">Australia (.com.au)</option>
                          <option value="jp">Japan (.jp)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Client Secret
                      </label>
                      <div className="relative">
                        <input
                          type={showSecret ? 'text' : 'password'}
                          value={zohoClientSecret}
                          onChange={e => setZohoClientSecret(e.target.value)}
                          placeholder="Paste your Zoho Client Secret"
                          className="w-full px-4 py-2.5 pr-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all focus:bg-white dark:focus:bg-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Workspace Name
                      </label>
                      <input
                        type="text"
                        value={zohoWorkspaceName}
                        onChange={e => setZohoWorkspaceName(e.target.value)}
                        placeholder="e.g. Gringotts Reports"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all focus:bg-white dark:focus:bg-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Refresh Token
                    </label>
                    <div className="relative">
                      <input
                        type={showRefresh ? 'text' : 'password'}
                        value={zohoRefreshToken}
                        onChange={e => setZohoRefreshToken(e.target.value)}
                        placeholder="Paste your Zoho OAuth Refresh Token"
                        className="w-full px-4 py-2.5 pr-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all focus:bg-white dark:focus:bg-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRefresh(!showRefresh)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showRefresh ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={zohoSaving}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-lg shadow-cyan-500/20"
                  >
                    {zohoSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Connecting to Zoho Analytics...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Connect Zoho Workspace
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default SetupPanel;
