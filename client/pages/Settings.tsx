import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { api } from '../services/api';
import { useToast } from '../components/ToastContext';
import { useTheme, THEME_LIBRARY, ThemeId } from '../components/ThemeContext';
import {
  User, KeyRound, Trash2, Camera, Save, Eye, EyeOff, AlertTriangle, X, Check, Palette, Sun, Moon, ChevronDown, Loader2, Info, RefreshCcw, Globe, Monitor, LogOut, QrCode, Copy, CheckCircle2, Lock, Tag, Upload, Download, FileSpreadsheet, FileText, Layers, Plus, Pencil, FolderHeart, History
} from 'lucide-react';
import Configuration from './Configuration';
import { UserSession, QuickFilter, ImportJob, ImportStrategy, ImportColumnMapping, ImportPreviewResult, ImportFailedRow } from '../types';
import { personalizationSync } from '../services/personalizationSync';
import { getUserTimeZone, getTimezoneOffset } from '../services/dateUtils';
import { loadUserQuickFilters, saveUserQuickFilters } from '../services/quickFilters';

interface SettingsProps {
  onProfileUpdate: () => void;
  onImportSuccess: () => void;
}

type Section = 'profile' | 'security' | 'sessions' | 'account' | 'preferences' | 'categories' | 'import' | 'export' | 'appearance' | 'quick_filters';

const SETTINGS_GROUPS = [
  {
    title: 'Account Settings',
    items: [
      { id: 'profile' as Section, label: 'Profile', icon: User },
      { id: 'preferences' as Section, label: 'Regional', icon: Globe },
      { id: 'security' as Section, label: 'Security', icon: KeyRound },
      { id: 'sessions' as Section, label: 'Active Sessions', icon: Monitor },
      { id: 'account' as Section, label: 'Account', icon: User }
    ]
  },
  {
    title: 'Vault Configuration',
    items: [
       { id: 'appearance' as Section, label: 'Appearance', icon: Palette },
      { id: 'categories' as Section, label: 'Categories & Items', icon: Tag },
      { id: 'quick_filters' as Section, label: 'Quick Filters', icon: FolderHeart },
      { id: 'import' as Section, label: 'Import Transactions', icon: Download },
      { id: 'export' as Section, label: 'Export Data', icon: Upload }
     
    ]
  }
];

// Helper to get all tabs
const SECTION_TABS = SETTINGS_GROUPS.flatMap(g => g.items);

// ── Helpers ────────────────────────────────────────────────────────────────────

function resizeImage(file: File, maxPx = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Avatar ─────────────────────────────────────────────────────────────────────

const Avatar: React.FC<{ src: string; initial: string; size?: 'sm' | 'lg' }> = ({ src, initial, size = 'lg' }) => {
  const dim = size === 'lg' ? 'w-24 h-24 text-3xl' : 'w-10 h-10 text-base';
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/30 overflow-hidden shrink-0`}>
      {src ? <img src={src} alt="avatar" className="w-full h-full object-cover" /> : initial}
    </div>
  );
};

// ── Delete Confirmation Modal ──────────────────────────────────────────────────

const DeleteModal: React.FC<{
  onConfirm: (password: string) => Promise<void>;
  onClose: () => void;
}> = ({ onConfirm, onClose }) => {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!password) { setError('Please enter your password to confirm.'); return; }
    setLoading(true);
    setError('');
    try {
      await onConfirm(password);
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col items-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="my-auto flex flex-col w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 border border-rose-500/20 animate-in zoom-in-95 duration-200 max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)]">
        <div className="flex items-start gap-4 mb-5 shrink-0">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Account Permanently</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              All your transactions, budgets, goals, categories, and settings will be permanently erased. This action <span className="font-semibold text-rose-500">cannot be undone</span>.
            </p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 pr-1 pb-1">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Enter your current password to confirm
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDelete()}
              placeholder="Current password"
              className="w-full px-4 py-2.5 pr-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="mt-2 text-xs text-rose-500 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 shrink-0" />{error}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 shrink-0 mt-auto">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <><Trash2 className="w-4 h-4" />Delete Forever</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const Settings: React.FC<SettingsProps> = ({ onProfileUpdate, onImportSuccess }) => {
  const { showToast } = useToast();
  const { theme, setTheme, isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [section, setSection] = useState<Section>(() => {
    const tab = searchParams.get('tab') as Section;
    return (tab && SECTION_TABS.some(t => t.id === tab)) ? tab : 'profile';
  });
  const [loading, setLoading] = useState(true);
  const [highlightRecovery, setHighlightRecovery] = useState(false);
  const recoveryEmailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get('highlight') === 'recovery') {
      setHighlightRecovery(true);
      setTimeout(() => {
        recoveryEmailInputRef.current?.focus();
      }, 100);
      const timer = setTimeout(() => {
        setHighlightRecovery(false);
        const newParams = new URLSearchParams(window.location.search);
        newParams.delete('highlight');
        setSearchParams(newParams, { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    const tab = searchParams.get('tab') as Section;
    if (tab && SECTION_TABS.some(t => t.id === tab)) {
      setSection(tab);
    }
  }, [searchParams]);

  const handleSectionChange = (newSection: Section) => {
    setSection(newSection);
    setSearchParams({ tab: newSection });
  };

  // Profile section
  const [username, setUsername] = useState('');
  const [initialUsername, setInitialUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profilePicture, setPicture] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [initialRecoveryEmail, setInitialRecoveryEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Recovery Email Verification
  const [verificationStep, setVerificationStep] = useState<'idle' | 'otp_sent'>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Username availability check
  const [availability, setAvailability] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [debouncedUsername, setDebouncedUsername] = useState('');

  // Security section
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // Password Reset / Forgot Password state
  const [isResettingPw, setIsResettingPw] = useState(false);
  const [forgotFlowStep, setForgotFlowStep] = useState<'idle' | 'challenge' | 'sent'>('idle');
  const [forgotChallengeEmail, setForgotChallengeEmail] = useState('');
  const [forgotMaskedEmail, setForgotMaskedEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Reset MFA state
  const [mfaStep, setMfaStep] = useState(1); // 1 = idle/pw, 2 = QR/verify, 3 = success
  const [mfaCurrentPassword, setMfaCurrentPassword] = useState('');
  const [showMfaPw, setShowMfaPw] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaQrCodeUrl, setMfaQrCodeUrl] = useState('');
  const [showMfaManual, setShowMfaManual] = useState(false);
  const [mfaCopied, setMfaCopied] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');

  // Danger section
  const [showDeleteModal, setDeleteModal] = useState(false);

  // Quick Filters section state
  const [qfMap, setQfMap] = useState<Record<string, QuickFilter[]>>({});
  const [editingQfId, setEditingQfId] = useState<string | null>(null);
  const [editingQfName, setEditingQfName] = useState('');
  const [selectedQfTab, setSelectedQfTab] = useState<string>('all');

  const loadAllQuickFilters = () => {
    const tabs = ['all', 'expense', 'income', 'saving', 'revolving'];
    const map: Record<string, QuickFilter[]> = {};
    tabs.forEach(t => {
      map[t] = loadUserQuickFilters(t);
    });
    setQfMap(map);
  };

  useEffect(() => {
    if (section === 'quick_filters') {
      loadAllQuickFilters();
    }
  }, [section]);

  const handleRenameQf = async (tab: string, qfId: string) => {
    if (!editingQfName.trim()) return;
    const tabFilters = qfMap[tab] || [];
    const updated = tabFilters.map(qf => {
      if (qf.id === qfId) {
        return { ...qf, label: editingQfName.trim() };
      }
      return qf;
    });
    
    await saveUserQuickFilters(tab, updated);
    setEditingQfId(null);
    setEditingQfName('');
    loadAllQuickFilters();
    showToast('Quick filter renamed successfully', 'success');
    window.dispatchEvent(new CustomEvent('quick-filters-changed'));
  };

  const handleDeleteQf = async (tab: string, qfId: string, label: string) => {
    if (!window.confirm(`Are you sure you want to delete the quick filter "${label}"?`)) {
      return;
    }
    const tabFilters = qfMap[tab] || [];
    const updated = tabFilters.filter(qf => qf.id !== qfId);
    
    await saveUserQuickFilters(tab, updated);
    loadAllQuickFilters();
    showToast('Quick filter deleted successfully', 'success');
    window.dispatchEvent(new CustomEvent('quick-filters-changed'));
  };

  const [menuOpen, setMenuOpen] = useState(false);

  // Preferences section
  const [timezone, setTimezone] = useState(localStorage.getItem('gringotts-timezone') || 'UTC');
  const [availableTimezones, setAvailableTimezones] = useState<string[]>([]);

  // Sessions section
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // --- Import States ---
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<string>('HDFC');
  const [importLoading, setImportLoading] = useState(false);

  const [importSubTab, setImportSubTab] = useState<'statement' | 'csv_xls'>('statement');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<ImportPreviewResult | null>(null);
  const [csvPreviewLoading, setCsvPreviewLoading] = useState(false);
  const [csvMapping, setCsvMapping] = useState<ImportColumnMapping>({});
  const [csvStrategy, setCsvStrategy] = useState<ImportStrategy>('CREATE_IF_MISSING');
  const [csvSubmitLoading, setCsvSubmitLoading] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [importHistory, setImportHistory] = useState<ImportJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);

  // --- Export States ---
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('xlsx');
  const [exportRangeType, setExportRangeType] = useState<'all' | 'custom'>('all');
  const [exportType, setExportType] = useState<string>('all');
  const [exportStartDate, setExportStartDate] = useState<string>('');
  const [exportEndDate, setExportEndDate] = useState<string>('');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    // Initialize export dates to 30 days ago and today
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    setExportStartDate(formatDate(thirtyDaysAgo));
    setExportEndDate(formatDate(today));
  }, []);

  // --- Import Action ---
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) { showToast('Please select a file', 'error'); return; }
    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('type', importType);
    try {
      const response = await fetch('/api/v1/upload', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload failed');
      showToast('Transactions imported successfully', 'success');
      onImportSuccess();
      setImportFile(null);
    } catch (error) {
      showToast('Failed to import transactions', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.getImportHistory();
      setImportHistory(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (section === 'import') {
      fetchHistory();
    }
  }, [section]);

  useEffect(() => {
    if (section !== 'import') return;
    const hasActiveJobs = importHistory.some(j => j.status === 'PENDING' || j.status === 'PROCESSING');
    if (!hasActiveJobs) return;

    const interval = setInterval(() => {
      api.getImportHistory()
        .then(res => setImportHistory(res.data))
        .catch(e => console.error("Polling history error", e));
    }, 3000);
    return () => clearInterval(interval);
  }, [importHistory, section]);

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCsvFile(file);
      setCsvPreviewLoading(true);
      try {
        const preview = await api.previewImportFile(file);
        setCsvPreview(preview);
        setCsvMapping(preview.suggested_mapping);
        setImportStep(2); // Go to mapping step
      } catch (err: any) {
        showToast(err.message || 'Failed to read headers from file', 'error');
        setCsvFile(null);
      } finally {
        setCsvPreviewLoading(false);
      }
    }
  };

  const handleCsvImportSubmit = async () => {
    if (!csvFile) {
      showToast('Please select a file first', 'error');
      return;
    }
    const required: (keyof ImportColumnMapping)[] = ['date', 'type', 'description', 'amount'];
    const missing = required.filter(field => csvMapping[field] === undefined || csvMapping[field] === -1);
    if (missing.length > 0) {
      showToast(`Please map all required fields: ${missing.map(f => f.toUpperCase()).join(', ')}`, 'error');
      return;
    }

    setCsvSubmitLoading(true);
    try {
      await api.submitImportJob(csvFile, csvStrategy, csvMapping);
      showToast('Import job submitted successfully', 'success');
      setCsvFile(null);
      setCsvPreview(null);
      setCsvMapping({});
      setImportStep(1);
      fetchHistory();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit import job', 'error');
    } finally {
      setCsvSubmitLoading(false);
    }
  };

  // --- Export Action ---
  const handleExportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (exportRangeType === 'custom') {
      if (!exportStartDate || !exportEndDate) { showToast('Please select start and end dates', 'error'); return; }
      if (new Date(exportStartDate) > new Date(exportEndDate)) { showToast('Start date cannot be after end date', 'error'); return; }
    }
    setExportLoading(true);
    try {
      const typeParam = exportType === 'all' ? undefined : exportType;
      const blob = await api.exportTransactions({
        format: exportFormat,
        type: typeParam as any,
        startDate: exportRangeType === 'custom' ? exportStartDate : undefined,
        endDate: exportRangeType === 'custom' ? exportEndDate : undefined,
        filters: [],
      });
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
      showToast(error.message || 'Failed to export transactions', 'error');
    } finally {
      setExportLoading(false);
    }
  };


  useEffect(() => {
    api.getProfile()
      .then(p => {
        setUsername(p.username);
        setInitialUsername(p.username);
        setDisplayName(p.displayName);
        setPicture(p.profilePicture);
        setRecoveryEmail(p.recoveryEmail || '');
        setInitialRecoveryEmail(p.recoveryEmail || '');
      })
      .finally(() => setLoading(false));

    // Get all supported timezones
    try {
      setAvailableTimezones((Intl as any).supportedValuesOf('timeZone'));
    } catch (e) {
      setAvailableTimezones(['UTC', 'Asia/Kolkata', 'America/New_York', 'Europe/London', 'Asia/Tokyo']);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (section === 'sessions' && sessions.length === 0) {
      setSessionsLoading(true);
      api.getSessions()
        .then(res => setSessions(res.data || []))
        .catch(err => showToast('Failed to load sessions', 'error'))
        .finally(() => setSessionsLoading(false));
    }
  }, [section]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  useEffect(() => {
    if (!debouncedUsername || debouncedUsername === initialUsername) {
      setAvailability('idle');
      return;
    }

    if (debouncedUsername.length < 3) {
      setAvailability('invalid');
      return;
    }

    setAvailability('checking');
    api.checkUsernameAvailability(debouncedUsername)
      .then(res => {
        setAvailability(res.available ? 'available' : 'taken');
      })
      .catch(() => setAvailability('idle'));
  }, [debouncedUsername, initialUsername]);

  // ── Profile handlers ───────────────────────────────────────────────────────

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be under 2 MB', 'error'); return;
    }
    const b64 = await resizeImage(file);
    setPicture(b64);
  };

  const handleRemovePhoto = () => {
    setPicture('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleProfileSave = async () => {
    if (availability === 'taken') {
      showToast('This username is already taken', 'error');
      return;
    }
    if (availability === 'invalid') {
      showToast('Username must be at least 3 characters', 'error');
      return;
    }

    setProfileSaving(true);
    try {
      const updated = await api.updateProfile(displayName, profilePicture, username);
      setInitialUsername(updated.username);
      setUsername(updated.username);
      setAvailability('idle');
      await onProfileUpdate();
      showToast('Profile updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save profile', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleInitiateVerification = async () => {
    if (!recoveryEmail || !recoveryEmail.trim()) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recoveryEmail.trim())) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setVerificationLoading(true);
    try {
      const res = await api.initiateRecoveryEmailVerification(recoveryEmail.trim());
      showToast(res.message || 'Verification code sent', 'success');
      setVerificationStep('otp_sent');
      setResendTimer(60);
      setOtpCode('');
    } catch (err: any) {
      showToast(err.message || 'Failed to send verification code', 'error');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleConfirmVerification = async () => {
    if (otpCode.trim().length !== 6) {
      showToast('Verification code must be 6 digits', 'error');
      return;
    }

    setVerificationLoading(true);
    try {
      const res = await api.confirmRecoveryEmailVerification(otpCode.trim());
      showToast(res.message || 'Email verified successfully!', 'success');
      setInitialRecoveryEmail(recoveryEmail.trim());
      setVerificationStep('idle');
      setOtpCode('');
    } catch (err: any) {
      showToast(err.message || 'Verification failed. Please check the code.', 'error');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleClearRecoveryEmail = async () => {
    setVerificationLoading(true);
    try {
      const res = await api.clearRecoveryEmail();
      showToast(res.message || 'Recovery email cleared successfully', 'success');
      setRecoveryEmail('');
      setInitialRecoveryEmail('');
      setVerificationStep('idle');
      setOtpCode('');
    } catch (err: any) {
      showToast(err.message || 'Failed to clear recovery email', 'error');
    } finally {
      setVerificationLoading(false);
    }
  };

  // ── Password handlers ──────────────────────────────────────────────────────

  const handlePasswordReset = async () => {
    if (!currentPw) { showToast('Enter your current password', 'error'); return; }
    if (newPw.length < 8) { showToast('New password must be at least 8 characters', 'error'); return; }
    if (newPw !== confirmPw) { showToast('Passwords do not match', 'error'); return; }
    setPwSaving(true);
    try {
      await api.resetPassword(currentPw, newPw);
      showToast('Password changed successfully', 'success');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setIsResettingPw(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  const handleForgotCurrentPasswordInitiate = async () => {
    if (!initialRecoveryEmail) {
      showToast('You do not have a verified recovery email configured. Please configure and verify one in the Profile tab.', 'error');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await api.initiateForgotPasswordPublic(initialUsername);
      setForgotMaskedEmail(res.maskedEmail);
      setForgotFlowStep('challenge');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to initiate password reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotCurrentPasswordConfirm = async () => {
    if (!forgotChallengeEmail.trim()) {
      showToast('Please enter your full recovery email address', 'error');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      await api.confirmForgotPasswordPublic(initialUsername, forgotChallengeEmail.trim());
      setForgotFlowStep('sent');
      showToast('If the entered email is correct, a recovery link has been sent to it.', 'success');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to confirm recovery email.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ── Reset MFA handlers ─────────────────────────────────────────────────────

  const handleMfaInitiate = async () => {
    if (!mfaCurrentPassword) {
      showToast('Enter your current password to reset MFA', 'error');
      return;
    }
    setMfaLoading(true);
    setMfaError('');
    try {
      const response = await api.initiateResetMfa(mfaCurrentPassword);
      setMfaSecret(response.secret);
      const qrUrl = await QRCode.toDataURL(response.otpAuthTotpURL);
      setMfaQrCodeUrl(qrUrl);
      setMfaStep(2);
      setMfaError('');
    } catch (err: any) {
      setMfaError(err.message || 'Verification failed. Please check your password.');
      showToast(err.message || 'Failed to initiate MFA reset', 'error');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaConfirm = async () => {
    if (!mfaCode || mfaCode.length < 6) {
      showToast('Please enter a valid 6-digit verification code', 'error');
      return;
    }
    setMfaLoading(true);
    setMfaError('');
    try {
      await api.confirmResetMfa(parseInt(mfaCode));
      setMfaStep(3);
      setMfaCode('');
      showToast('MFA Authenticator reset successfully', 'success');
    } catch (err: any) {
      setMfaError(err.message || 'Invalid code. Please try again.');
      showToast(err.message || 'Failed to verify MFA code', 'error');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaCancel = () => {
    setMfaStep(1);
    setMfaCurrentPassword('');
    setMfaCode('');
    setMfaSecret('');
    setMfaQrCodeUrl('');
    setShowMfaManual(false);
    setMfaError('');
  };

  const copyMfaSecretToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mfaSecret);
      setMfaCopied(true);
      setTimeout(() => setMfaCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy secret: ', err);
    }
  };

  // ── Delete handler ─────────────────────────────────────────────────────────

  const handleDeleteAccount = async (password: string) => {
    await api.deleteAccount(password);
    navigate('/login');
  };

  const handleRevokeSession = async (id: string) => {
    try {
      await api.revokeSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      showToast('Session revoked successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke session', 'error');
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const avatarInitial = (displayName?.trim() || username)?.charAt(0)?.toUpperCase() || '?';
  const pwStrength = newPw.length === 0 ? 0 : newPw.length < 8 ? 1 : newPw.length < 12 ? 2 : 3;
  const strengthColor = ['', 'bg-rose-500', 'bg-amber-400', 'bg-emerald-500'][pwStrength];
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][pwStrength];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-300">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Account Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your profile, security, and account preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">

        {/* ── Sidebar tabs (Desktop) / Submenu (Mobile) ── */}
        <aside className="md:w-52 shrink-0">
          {/* Mobile Submenu Dropdown */}
          <div className="md:hidden relative mb-6">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = SECTION_TABS.find(t => t.id === section)?.icon || User;
                  return <Icon className="w-4 h-4 text-cyan-500" />;
                })()}
                <span className="text-slate-900 dark:text-white">
                  {SECTION_TABS.find(t => t.id === section)?.label}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-[30] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {SECTION_TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => { handleSectionChange(id); setMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-all
                      ${section === id
                        ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Sidebar Sidebar */}
          <nav className="hidden md:flex md:flex-col gap-6">
            {SETTINGS_GROUPS.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <h3 className="px-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{group.title}</h3>
                {group.items.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleSectionChange(id)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left
                      ${section === id
                        ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-600 dark:text-cyan-400'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* ── Content panel ── */}
        <div className="flex-1 min-w-0">

          {/* ─ Profile ─ */}
          {section === 'profile' && (
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Profile</h2>
                <p className="text-xs text-slate-400 mt-0.5">Update your display name and profile photo.</p>
              </div>

              {/* Avatar upload */}
              <div className="flex items-center gap-5">
                <div className="relative group">
                  <Avatar src={profilePicture} initial={avatarInitial} />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="Upload photo"
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Upload Photo
                  </button>
                  {profilePicture && (
                    <button
                      onClick={handleRemovePhoto}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-all flex items-center gap-1.5"
                    >
                      <X className="w-3 h-3" /> Remove
                    </button>
                  )}
                  <p className="text-[11px] text-slate-400">JPEG, PNG or WebP · Max 2 MB</p>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                    placeholder="Choose a unique username"
                    className={`w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-100 dark:bg-slate-800 border text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all
                      ${availability === 'available' ? 'border-emerald-500/50 focus:ring-emerald-500/30' :
                        availability === 'taken' || availability === 'invalid' ? 'border-rose-500/50 focus:ring-rose-500/30' :
                          'border-slate-200 dark:border-slate-700 focus:ring-cyan-500/50'}`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    {availability === 'checking' && <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />}
                    {availability === 'available' && <Check className="w-4 h-4 text-emerald-500" />}
                    {(availability === 'taken' || availability === 'invalid') && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                  </div>
                </div>

                {availability === 'taken' && (
                  <p className="mt-1.5 text-[11px] text-rose-500 flex items-center gap-1">
                    <Info className="w-3 h-3" /> This username is already taken.
                  </p>
                )}
                {availability === 'invalid' && (
                  <p className="mt-1.5 text-[11px] text-rose-500 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Username must be at least 3 characters and contain only lowercase letters, numbers, dots, or underscores.
                  </p>
                )}
                {availability === 'available' && (
                  <p className="mt-1.5 text-[11px] text-emerald-500 flex items-center gap-1">
                    <Check className="w-3 h-3" /> This username is available!
                  </p>
                )}
                {availability === 'idle' && username !== initialUsername && username.length >= 3 && (
                  <p className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1">
                    <RefreshCcw className="w-3 h-3 animate-spin" /> Checking availability...
                  </p>
                )}
                <p className="mt-1.5 text-[11px] text-slate-400">
                  {username === initialUsername
                    ? "This is your current username."
                    : "Changing your username will log you out of other sessions."}
                </p>
              </div>

              {/* Display name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="How should we call you?"
                  maxLength={64}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                />
                <p className="mt-1 text-[11px] text-slate-400">Shown in the sidebar and header. Defaults to your username if left blank.</p>
              </div>

              {/* Recovery Email */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Recovery Email
                  </label>
                  {initialRecoveryEmail && recoveryEmail === initialRecoveryEmail && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    ref={recoveryEmailInputRef}
                    type="email"
                    value={recoveryEmail}
                    onChange={e => {
                      setRecoveryEmail(e.target.value);
                      if (verificationStep === 'otp_sent') {
                        setVerificationStep('idle');
                      }
                    }}
                    disabled={verificationStep === 'otp_sent' || verificationLoading}
                    placeholder="Enter your recovery email"
                    maxLength={128}
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all disabled:opacity-60 ${
                      highlightRecovery
                        ? 'border-amber-500 ring-2 ring-amber-500/50 dark:ring-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10 scale-[1.01]'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {initialRecoveryEmail && recoveryEmail === initialRecoveryEmail && (
                    <button
                      type="button"
                      onClick={handleClearRecoveryEmail}
                      disabled={verificationLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-semibold focus:outline-none"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Used for password recovery if you forget your current password.
                </p>

                {/* VERIFICATION BUTTONS / CARDS */}
                {recoveryEmail.trim() !== initialRecoveryEmail && recoveryEmail.trim() !== '' && verificationStep === 'idle' && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleInitiateVerification}
                      disabled={verificationLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-60"
                    >
                      {verificationLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Verify Recovery Email
                    </button>
                  </div>
                )}

                {verificationStep === 'otp_sent' && (
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-4 space-y-4">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <div className="flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                          We sent a 6-digit verification code to <span className="font-bold">{recoveryEmail}</span>. The code will expire in 15 minutes.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Enter 6-Digit OTP
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="000000"
                          className="w-1/3 px-3 py-2 text-sm text-center font-mono font-semibold tracking-widest bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        />
                        <button
                          type="button"
                          onClick={handleConfirmVerification}
                          disabled={verificationLoading}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
                        >
                          {verificationLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setVerificationStep('idle');
                            setOtpCode('');
                          }}
                          disabled={verificationLoading}
                          className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <div>
                        Didn't receive the code?
                      </div>
                      <button
                        type="button"
                        onClick={handleInitiateVerification}
                        disabled={verificationLoading || resendTimer > 0}
                        className="text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50 font-semibold flex items-center gap-1"
                      >
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleProfileSave}
                  disabled={profileSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl disabled:opacity-60 text-white text-sm font-semibold shadow-lg transition-all"
                  style={{
                    background: `linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))`,
                    boxShadow: `0 10px 15px -3px rgba(var(--theme-accent-rgb), 0.2), 0 4px 6px -4px rgba(var(--theme-accent-rgb), 0.2)`
                  }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                >
                  {profileSaving
                    ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <Save className="w-4 h-4" />
                  }
                  Save Profile
                </button>
              </div>
            </div>
          )}



          {/* ─ Security ─ */}
          {section === 'security' && (
            <div className="space-y-6">
              {/* Change Password Card */}
              <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 space-y-5">
                {!isResettingPw ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Lock className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Reset Password</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your password is securely configured.</p>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md w-fit">
                          <Check className="w-3.5 h-3.5" />
                          <span>Password is set</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsResettingPw(true)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700/50 transition-all flex items-center gap-1.5 self-start sm:self-center"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Reset Password
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Reset Password</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Verify your current password before setting a new one.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsResettingPw(false);
                          setCurrentPw('');
                          setNewPw('');
                          setConfirmPw('');
                          setForgotFlowStep('idle');
                          setForgotChallengeEmail('');
                          setForgotError('');
                        }}
                        className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Current password */}
                    <div>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Current Password
                        </label>
                      </div>

                      {forgotFlowStep === 'idle' ? (
                        <div className="space-y-1.5">
                          <div className="relative">
                            <input
                              type={showCur ? 'text' : 'password'}
                              value={currentPw}
                              onChange={e => setCurrentPw(e.target.value)}
                              placeholder="Your current password"
                              className="w-full px-4 py-2.5 pr-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                            />
                            <button type="button" onClick={() => setShowCur(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                              {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <div className="flex justify-start">
                            <button
                              type="button"
                              onClick={handleForgotCurrentPasswordInitiate}
                              disabled={forgotLoading}
                              className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 hover:underline font-semibold focus:outline-none transition-colors"
                            >
                              {forgotLoading ? 'Verifying...' : 'Forgot current password? Verify using recovery mail and reset'}
                            </button>
                          </div>
                        </div>
                      ) : forgotFlowStep === 'challenge' ? (
                        /* FORGOT FLOW INLINE CHALLENGE */
                        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-4 space-y-4">
                          <div className="space-y-1.5">
                            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              Verified Recovery Email
                            </div>
                            <div className="font-mono text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/20 py-2 px-3 rounded-lg overflow-x-auto whitespace-nowrap scrollbar-thin select-all font-semibold">
                              {forgotMaskedEmail}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400" htmlFor="challengeEmail">
                              Enter Full Recovery Email
                            </label>
                            <input
                              id="challengeEmail"
                              type="email"
                              value={forgotChallengeEmail}
                              onChange={e => setForgotChallengeEmail(e.target.value)}
                              placeholder="Confirm the full email address"
                              className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-900 dark:text-white"
                            />
                          </div>

                          {forgotError && (
                            <div className="text-xs text-rose-500 font-medium">
                              {forgotError}
                            </div>
                          )}

                          <div className="flex gap-2.5">
                            <button
                              type="button"
                              onClick={() => { setForgotFlowStep('idle'); setForgotChallengeEmail(''); setForgotError(''); }}
                              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-all"
                            >
                              Cancel Recovery
                            </button>
                            <button
                              type="button"
                              onClick={handleForgotCurrentPasswordConfirm}
                              disabled={forgotLoading}
                              className="px-4 py-1.5 text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg shadow-md hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center gap-1.5"
                            >
                              {forgotLoading && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                              Confirm Recovery
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* RECOVERY LINK SENT SUCCESS VIEW */
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                          <div className="flex items-start gap-2.5">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 leading-relaxed">
                              If the entered email is correct, a recovery email has been sent. Please follow the instructions to reset your password.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setForgotFlowStep('idle'); setForgotChallengeEmail(''); setForgotError(''); }}
                            className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-semibold underline"
                          >
                            Return to Password Reset
                          </button>
                        </div>
                      )}
                    </div>

                    {forgotFlowStep === 'idle' && (
                      <>
                        {/* New password */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showNew ? 'text' : 'password'}
                              value={newPw}
                              onChange={e => setNewPw(e.target.value)}
                              placeholder="At least 8 characters"
                              className="w-full px-4 py-2.5 pr-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                            />
                            <button type="button" onClick={() => setShowNew(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {newPw && (
                            <div className="mt-2 space-y-1">
                              <div className="flex gap-1">
                                {[1, 2, 3].map(i => (
                                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= pwStrength ? strengthColor : 'bg-slate-200 dark:bg-slate-700'}`} />
                                ))}
                              </div>
                              <p className={`text-[11px] font-medium ${['', 'text-rose-500', 'text-amber-500', 'text-emerald-500'][pwStrength]}`}>
                                {strengthLabel}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Confirm password */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showConf ? 'text' : 'password'}
                              value={confirmPw}
                              onChange={e => setConfirmPw(e.target.value)}
                              placeholder="Repeat new password"
                              className={`w-full px-4 py-2.5 pr-11 rounded-xl bg-slate-100 dark:bg-slate-800 border text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all
                                ${confirmPw && confirmPw !== newPw ? 'border-rose-400 focus:ring-rose-400/50' : 'border-slate-200 dark:border-slate-700'}`}
                            />
                            <button type="button" onClick={() => setShowConf(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                              {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            {confirmPw && confirmPw === newPw && (
                              <div className="absolute right-9 top-1/2 -translate-y-1/2">
                                <Check className="w-4 h-4 text-emerald-500" />
                              </div>
                            )}
                          </div>
                          {confirmPw && confirmPw !== newPw && (
                            <p className="mt-1 text-[11px] text-rose-500">Passwords do not match</p>
                          )}
                        </div>

                        <div className="flex gap-3 pt-1">
                          <button
                            onClick={handlePasswordReset}
                            disabled={pwSaving}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl disabled:opacity-60 text-white text-sm font-semibold shadow-lg transition-all"
                            style={{
                              background: `linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))`,
                              boxShadow: `0 10px 15px -3px rgba(var(--theme-accent-rgb), 0.2), 0 4px 6px -4px rgba(var(--theme-accent-rgb), 0.2)`
                            }}
                            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                          >
                            {pwSaving
                              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              : <KeyRound className="w-4 h-4" />
                            }
                            Reset Password
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsResettingPw(false);
                              setCurrentPw('');
                              setNewPw('');
                              setConfirmPw('');
                              setForgotFlowStep('idle');
                              setForgotChallengeEmail('');
                              setForgotError('');
                            }}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 transition-all focus:outline-none"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Reset MFA Card */}
              <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <QrCode className="w-5 h-5 text-violet-500" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">Reset MFA Authenticator</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Replace your existing TOTP secret with a new one. This will invalidate all your trusted browsers.</p>
                  </div>
                </div>

                {mfaError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{mfaError}</span>
                  </div>
                )}

                {mfaStep === 1 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl">
                      <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                          <p className="font-bold mb-1">Important Warning:</p>
                          <p>
                            Resetting MFA generates a completely new authenticator key. The old key will stop working immediately.
                            You must scan the new QR code with your authenticator app to avoid losing access to your account.
                            All trusted browsers will also be cleared.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Confirm Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showMfaPw ? 'text' : 'password'}
                          value={mfaCurrentPassword}
                          onChange={e => setMfaCurrentPassword(e.target.value)}
                          placeholder="Your current password"
                          className="w-full px-4 py-2.5 pr-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                        />
                        <button type="button" onClick={() => setShowMfaPw(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          {showMfaPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={handleMfaInitiate}
                        disabled={mfaLoading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl disabled:opacity-60 text-white text-sm font-semibold shadow-lg transition-all"
                        style={{
                          background: `linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))`,
                          boxShadow: `0 10px 15px -3px rgba(var(--theme-accent-rgb), 0.2), 0 4px 6px -4px rgba(var(--theme-accent-rgb), 0.2)`
                        }}
                        onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                      >
                        {mfaLoading ? (
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <QrCode className="w-4 h-4" />
                        )}
                        Initiate MFA Reset
                      </button>
                    </div>
                  </div>
                )}

                {mfaStep === 2 && (
                  <div className="space-y-5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Scan the QR code with your authenticator app (such as Google Authenticator or Microsoft Authenticator), then enter the 6-digit verification code generated by the app.
                    </p>

                    <div className="bg-white p-4 mx-auto w-fit rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <img src={mfaQrCodeUrl} alt="New MFA QR Code" className="w-44 h-44" />
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3">
                      {!showMfaManual ? (
                        <button
                          type="button"
                          onClick={() => setShowMfaManual(true)}
                          className="text-xs text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 font-medium flex items-center gap-2 transition-colors mx-auto"
                        >
                          Show key for manual entry?
                        </button>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Manual Key</p>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-cyan-600 dark:text-cyan-400 font-mono break-all select-all flex-grow">{mfaSecret}</p>
                            <button
                              type="button"
                              onClick={copyMfaSecretToClipboard}
                              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 shrink-0"
                              title="Copy to clipboard"
                            >
                              {mfaCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        value={mfaCode}
                        onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                        maxLength={6}
                        className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 tracking-[0.3em] text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all"
                      />
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={handleMfaCancel}
                        disabled={mfaLoading}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleMfaConfirm}
                        disabled={mfaLoading || mfaCode.length < 6}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        {mfaLoading ? (
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Verify & Save
                      </button>
                    </div>
                  </div>
                )}

                {mfaStep === 3 && (
                  <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-300">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">New Authenticator Configured!</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Your MFA TOTP authenticator has been successfully reset. Use your new authenticator app codes for future logins.
                      </p>
                    </div>
                    <button
                      onClick={handleMfaCancel}
                      className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-semibold transition-all"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─ Preferences ─ */}
          {section === 'preferences' && (
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Globe className="w-5 h-5 text-cyan-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Regional Settings</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure your preferred timezone for transaction recording and dashboard summaries.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Timezone
                  </label>
                  <div className="relative">
                    <select
                      value={timezone}
                      onChange={(e) => {
                        const newTz = e.target.value;
                        setTimezone(newTz);
                        personalizationSync.save('UI', 'TIMEZONE', newTz);
                        showToast(`Timezone updated to ${newTz}`, 'success');
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all appearance-none"
                    >
                      {availableTimezones.map(tz => (
                        <option key={tz} value={tz}>
                          {tz} ({getTimezoneOffset(tz)})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Your detected browser timezone is <span className="font-medium text-cyan-500">{getUserTimeZone()}</span>.
                  </p>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-amber-500 shrink-0" />
                    <div className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                      <p className="font-bold mb-1">How this affects your data:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>New transactions will default to the current time in this zone.</li>
                        <li>Dashboard summaries (Daily/Monthly) will align with this zone's boundaries.</li>
                        <li>Existing transactions will be displayed based on their original local time.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─ Sessions ─ */}
          {section === 'sessions' && (
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Monitor className="w-5 h-5 text-cyan-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Active Sessions</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review devices where you are currently logged in. Revoke any unrecognized sessions.</p>
                </div>
              </div>

              {sessionsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                  No active sessions found.
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  {sessions.map((session, index) => (
                    <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                          <Monitor className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-slate-900 dark:text-white">
                              {session.user_agent.substring(0, 40)}{session.user_agent.length > 40 ? '...' : ''}
                            </p>
                            {index === 0 && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                This Device
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{session.ip_address}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                            <span>Active: {new Date(session.last_active_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {index !== 0 && (
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          className="self-end sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─ Categories ─ */}
          {section === 'categories' && (
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Categories & Items</h2>
                <p className="text-xs text-slate-400 mt-0.5">Manage transaction categories, sub-categories, and specific items.</p>
              </div>
              <Configuration isPanel={true} />
            </div>
          )}

          {/* ─ Quick Filters ─ */}
          {section === 'quick_filters' && (
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Quick Filters</h2>
                <p className="text-xs text-slate-400 mt-0.5">Manage your user-defined custom quick filters for each transaction tab.</p>
              </div>

              {/* Sub-Tab Selector */}
              <div className="flex border-b border-slate-100 dark:border-slate-800/80 gap-4 overflow-x-auto pb-px">
                {['all', 'expense', 'income', 'saving', 'revolving'].map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      setSelectedQfTab(t);
                      setEditingQfId(null);
                    }}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
                      selectedQfTab === t
                        ? 'text-cyan-500'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    {t === 'all' ? 'All Transactions' : `${t}s`}
                    {selectedQfTab === t && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* List of Custom Filters for Selected Tab */}
              <div className="space-y-3">
                {(!qfMap[selectedQfTab] || qfMap[selectedQfTab].length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <FolderHeart className="w-8 h-8 opacity-30 mb-2 text-rose-500" />
                    <p className="text-sm font-medium">No custom quick filters saved</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      You can save quick filters directly from the Transaction List view's Advanced Filters panel.
                    </p>
                  </div>
                ) : (
                  qfMap[selectedQfTab].map(qf => {
                    const isEditing = editingQfId === qf.id;

                    const getFieldLabel = (field: string) => {
                      switch (field) {
                        case 'transaction_time': return 'Date';
                        case 'description': return 'Description';
                        case 'value': return 'Amount';
                        case 'category.id': return 'Category';
                        case 'subcategory.id': return 'Sub-Category';
                        case 'item.id': return 'Item';
                        case 'notes': return 'Notes';
                        case 'payment_mode': return 'Payment Mode';
                        case 'credit_card.id': return 'Credit Card';
                        case 'is_in': return 'Direction';
                        case 'is_give': return 'Direction';
                        case 'closed': return 'Status';
                        default: return field;
                      }
                    };

                    const getConditionLabel = (cond: string) => {
                      switch (cond) {
                        case 'eq': return 'equals';
                        case 'like': return 'contains';
                        case 'gt': return 'after';
                        case 'ge': return 'on or after';
                        case 'lt': return 'before';
                        case 'le': return 'on or before';
                        default: return cond;
                      }
                    };

                    return (
                      <div
                        key={qf.id}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl gap-4 hover:shadow-sm transition-all"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0 w-full">
                          {isEditing ? (
                            <div className="flex items-center gap-2 max-w-sm">
                              <input
                                type="text"
                                value={editingQfName}
                                onChange={e => setEditingQfName(e.target.value)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-1 focus:ring-cyan-500 w-full dark:text-white"
                                autoFocus
                                maxLength={25}
                              />
                              <button
                                onClick={() => handleRenameQf(selectedQfTab, qf.id)}
                                disabled={!editingQfName.trim()}
                                className="px-3 py-1.5 bg-cyan-500 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-cyan-600 disabled:opacity-50 transition-all shrink-0"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => { setEditingQfId(null); setEditingQfName(''); }}
                                className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase hover:text-slate-700 dark:hover:text-slate-300 shrink-0"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {qf.label}
                              </span>
                            </div>
                          )}

                          {/* Condition Chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {qf.filters.map((filter, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-400 font-bold"
                              >
                                <span className="text-[8px] uppercase text-slate-400 mr-1">
                                  {getFieldLabel(filter.field)}
                                </span>
                                <span className="text-[8px] lowercase text-slate-400 font-normal mr-1">
                                  {getConditionLabel(filter.condition)}
                                </span>
                                <span className="text-cyan-600 dark:text-cyan-400 truncate max-w-[120px]">
                                  "{filter.label || filter.value}"
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        {!isEditing && (
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                            <button
                              onClick={() => {
                                setEditingQfId(qf.id);
                                setEditingQfName(qf.label);
                              }}
                              className="p-1.5 text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 rounded-lg transition-all"
                              title="Rename Filter"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQf(selectedQfTab, qf.id, qf.label)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                              title="Delete Filter"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ─ Import ─ */}
          {section === 'import' && (
            <div className="space-y-6 w-full">
              {/* Header */}
              <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Import Records</h3>
                <p className="text-xs text-slate-400 mt-0.5">Bulk import transaction records from bank statements or CSV/XLSX spreadsheets.</p>

                {/* Sub-tab pills */}
                <div className="flex gap-2 mt-4 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit">
                  <button
                    onClick={() => setImportSubTab('statement')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                      importSubTab === 'statement'
                        ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    Statement Parser
                  </button>
                  <button
                    onClick={() => setImportSubTab('csv_xls')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                      importSubTab === 'csv_xls'
                        ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    CSV / Excel Spreadsheet
                  </button>
                </div>
              </div>

              {/* Sub-tab: Statement */}
              {importSubTab === 'statement' && (
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 space-y-5 max-w-xl animate-in fade-in duration-200">
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
                        <>Import Statement</>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Sub-tab: CSV / XLS Wizard */}
              {importSubTab === 'csv_xls' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                  {/* Left part: Wizard Card */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 space-y-6">
                    {/* Steps Indicator */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Step {importStep} of 3</span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {importStep === 1 && "Upload File"}
                          {importStep === 2 && "Map Spreadsheet Columns"}
                          {importStep === 3 && "Import Configuration"}
                        </h4>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3].map((s) => (
                          <div
                            key={s}
                            className={`h-1.5 w-8 rounded-full transition-all ${
                              s === importStep
                                ? 'bg-cyan-500 w-12'
                                : s < importStep
                                ? 'bg-emerald-500'
                                : 'bg-slate-200 dark:bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Step 1: Upload File */}
                    {importStep === 1 && (
                      <div className="space-y-4">
                        <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center hover:bg-slate-50 dark:hover:bg-slate-800/20 hover:border-cyan-500/30 transition-all group cursor-pointer">
                          <input
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            onChange={handleCsvFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            disabled={csvPreviewLoading}
                          />
                          <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                            {csvPreviewLoading ? (
                              <>
                                <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
                                <span className="text-sm font-semibold text-cyan-500">Reading file headers...</span>
                              </>
                            ) : csvFile ? (
                              <>
                                <FileSpreadsheet className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
                                <span className="text-sm font-semibold text-emerald-500 dark:text-emerald-400 break-all px-4">{csvFile.name}</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-10 h-10 text-slate-400 dark:text-slate-600 group-hover:scale-105 transition-transform" />
                                <div>
                                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Click or drag spreadsheet file</span>
                                  <p className="text-xs text-slate-400 mt-1">Supports CSV, XLSX, XLS formats up to 10MB</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Column Mapper */}
                    {importStep === 2 && csvPreview && (
                      <div className="space-y-4">
                        <p className="text-xs text-slate-400">Map Gringotts database fields to columns detected in your spreadsheet. Required fields must be mapped.</p>
                        <div className="border border-slate-100 dark:border-slate-800/80 rounded-xl overflow-hidden max-h-96 overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Gringotts Field</th>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Your Column Header</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                              {[
                                { key: 'date', label: 'Date', required: true },
                                { key: 'type', label: 'Transaction Type', required: true },
                                { key: 'description', label: 'Description', required: true },
                                { key: 'amount', label: 'Amount', required: true },
                                { key: 'category', label: 'Category', required: false },
                                { key: 'sub_category', label: 'Sub-Category', required: false },
                                { key: 'item', label: 'Item', required: false },
                                { key: 'payment_mode', label: 'Payment Mode', required: false },
                                { key: 'notes', label: 'Notes', required: false },
                                { key: 'direction', label: 'Direction (Saving/Revolving)', required: false },
                                { key: 'status', label: 'Status (Revolving)', required: false },
                                { key: 'reference_no', label: 'Reference Number', required: false },
                                { key: 'include_in_budget', label: 'Include in Budget', required: false }
                              ].map((field) => {
                                const currentMap = csvMapping[field.key as keyof ImportColumnMapping];
                                return (
                                  <tr key={field.key} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                                    <td className="p-3">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{field.label}</span>
                                        {field.required && <span className="text-rose-500 font-bold">*</span>}
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <select
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-cyan-500"
                                        value={currentMap === undefined ? -1 : currentMap}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value);
                                          setCsvMapping(prev => ({
                                            ...prev,
                                            [field.key]: val
                                          }));
                                        }}
                                      >
                                        <option value={-1}>[Do Not Map / Default]</option>
                                        {csvPreview.detected_headers.map((hdr, idx) => (
                                          <option key={idx} value={idx}>
                                            Column {idx + 1}: {hdr || `(Blank)`}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex justify-between pt-2">
                          <button
                            type="button"
                            onClick={() => { setCsvFile(null); setCsvPreview(null); setImportStep(1); }}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm font-semibold transition-all"
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const required: (keyof ImportColumnMapping)[] = ['date', 'type', 'description', 'amount'];
                              const missing = required.filter(k => csvMapping[k] === undefined || csvMapping[k] === -1);
                              if (missing.length > 0) {
                                showToast(`Please map required fields: ${missing.map(f => f.toUpperCase()).join(', ')}`, 'error');
                              } else {
                                setImportStep(3);
                              }
                            }}
                            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
                          >
                            Continue
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Strategy & Action */}
                    {importStep === 3 && (
                      <div className="space-y-5">
                        <div className="space-y-3">
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Choose Missing Category / Item Strategy</label>
                          <p className="text-xs text-slate-400">If a category, sub-category, or item name in your spreadsheet does not exist in your account, what should the system do?</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            {/* Strategy 1: Create & Import */}
                            <button
                              type="button"
                              onClick={() => setCsvStrategy('CREATE_IF_MISSING')}
                              className={`flex flex-col items-start text-left p-4 rounded-xl border-2 transition-all ${
                                csvStrategy === 'CREATE_IF_MISSING'
                                  ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm'
                                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                              }`}
                            >
                              <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                Create & Import
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                Auto-create missing categories, sub-categories, or items, then successfully import the transaction row.
                              </span>
                            </button>

                            {/* Strategy 2: Strict Mode */}
                            <button
                              type="button"
                              onClick={() => setCsvStrategy('STRICT')}
                              className={`flex flex-col items-start text-left p-4 rounded-xl border-2 transition-all ${
                                csvStrategy === 'STRICT'
                                  ? 'border-rose-500 bg-rose-500/5 dark:bg-rose-500/10 shadow-sm'
                                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                              }`}
                            >
                              <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400 text-sm">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                Strict Mode (Fail Rows)
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                Skip and fail any row with missing categories, sub-categories, or items, and report the errors after importing.
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setImportStep(2)}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm font-semibold transition-all"
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={handleCsvImportSubmit}
                            disabled={csvSubmitLoading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                          >
                            {csvSubmitLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>Submit Import Job</>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right part: Guidelines Info */}
                  <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/40 rounded-2xl p-5 space-y-4 h-fit">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                      <Info className="w-4 h-4 text-cyan-500" />
                      Import Guidelines
                    </h5>
                    <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 list-disc list-inside pl-1">
                      <li>Spreadsheets must have a header row first.</li>
                      <li>Required columns: <strong>Date</strong>, <strong>Type</strong> (Expense/Income/Saving/Revolving), <strong>Description</strong>, and <strong>Amount</strong>.</li>
                      <li>System will auto-mark imported transactions with an <code>IsImported</code> tag.</li>
                      <li>ID and Imported fields are ignored.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Import History table (only for CSV / XLS tab) */}
              {importSubTab === 'csv_xls' && (
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <History className="w-4.5 h-4.5 text-slate-400" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Import Log & History</h4>
                    </div>
                    {historyLoading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                  </div>

                  {importHistory.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No import jobs found. Upload a CSV or Excel file above to start.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden border border-slate-100 dark:border-slate-800/80 rounded-xl">
                      {importHistory.map((job) => {
                        const isExpanded = expandedJobId === job.id;
                        let failedRows: ImportFailedRow[] = [];
                        if (job.failed_rows) {
                          try {
                            failedRows = JSON.parse(job.failed_rows);
                          } catch (e) {
                            console.error(e);
                          }
                        }

                        return (
                          <div key={job.id} className="bg-white dark:bg-slate-900/30">
                            <div
                              onClick={() => {
                                if (job.status === 'COMPLETED' || job.status === 'FAILED') {
                                  setExpandedJobId(isExpanded ? null : job.id);
                                }
                              }}
                              className={`flex flex-col md:flex-row md:items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all ${
                                isExpanded ? 'bg-slate-50/30 dark:bg-slate-800/10' : ''
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2.5">
                                  <span className="font-bold text-slate-900 dark:text-white text-xs">{job.file_name}</span>
                                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
                                    {job.format}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-3">
                                  <span>Job ID: {job.id}</span>
                                  <span>•</span>
                                  <span>{new Date(job.created_at).toLocaleString()}</span>
                                  <span>•</span>
                                  <span>Strategy: {job.strategy === 'CREATE_IF_MISSING' ? 'Create CSI' : 'Strict Mode'}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-6 mt-2 md:mt-0">
                                {job.status === 'COMPLETED' && (
                                  <div className="flex gap-3 text-[11px] font-semibold">
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                      +{job.imported_count} Success
                                    </span>
                                    {job.failed_count > 0 && (
                                      <span className="text-rose-500 font-bold">
                                        {job.failed_count} Failed
                                      </span>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center gap-2">
                                  {job.status === 'PENDING' && (
                                    <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">
                                      Pending
                                    </span>
                                  )}
                                  {job.status === 'PROCESSING' && (
                                    <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-full border border-cyan-500/20">
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      Processing
                                    </span>
                                  )}
                                  {job.status === 'COMPLETED' && (
                                    <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                                      <Check className="w-3.5 h-3.5" />
                                      Completed
                                    </span>
                                  )}
                                  {job.status === 'FAILED' && (
                                    <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full border border-rose-500/20">
                                      <X className="w-3.5 h-3.5" />
                                      Failed
                                    </span>
                                  )}

                                  {(job.status === 'COMPLETED' || job.status === 'FAILED') && (
                                    <ChevronDown
                                      className={`w-4 h-4 text-slate-400 transition-transform ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="bg-slate-50/50 dark:bg-slate-900/40 p-4 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2">
                                {job.status === 'FAILED' && job.error_message && (
                                  <div className="p-3 bg-rose-500/5 border border-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                                    <span className="font-bold">Error:</span> {job.error_message}
                                  </div>
                                )}

                                {job.status === 'COMPLETED' && failedRows.length > 0 ? (
                                  <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                                    <div className="font-bold text-slate-700 dark:text-slate-300">Failed Row Details ({job.failed_count} errors):</div>
                                    <div className="max-h-48 overflow-y-auto border border-slate-200/60 dark:border-slate-800 rounded-lg custom-scrollbar">
                                      <table className="w-full text-left border-collapse">
                                        <thead>
                                          <tr className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-400 text-[10px] border-b border-slate-200/60 dark:border-slate-800">
                                            <th className="p-2 w-16">Row #</th>
                                            <th className="p-2">Reason</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                          {failedRows.map((f, idx) => (
                                            <tr key={idx} className="hover:bg-slate-200/10">
                                              <td className="p-2 font-mono text-[10px] text-slate-500">{f.row}</td>
                                              <td className="p-2 text-rose-600 dark:text-rose-400">{f.reason}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-slate-500 dark:text-slate-400 italic text-[11px] py-1 text-center">
                                    Job completed with zero row failures. All records imported successfully!
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─ Export ─ */}
          {section === 'export' && (
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 space-y-6 max-w-xl">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Export Data</h3>
                <p className="text-xs text-slate-400 mt-0.5">Download your financial transaction records locally in Excel or CSV formats.</p>
              </div>

              <form onSubmit={handleExportSubmit} className="space-y-5">
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
                    <>Export Transactions</>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ─ Appearance ─ */}
          {section === 'appearance' && (
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 space-y-6">
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
                      {isSelected && (
                        <div
                          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center shadow-md z-10 animate-in zoom-in"
                          style={{ background: t.colors.accent }}
                        >
                          <Check className="w-3.5 h-3.5" style={{ color: t.isDark && t.id !== 'neo-pop' ? '#fff' : t.colors.bg }} />
                        </div>
                      )}
                      <div className="flex gap-1.5 mb-3">
                        <div className="h-8 flex-1 rounded-lg" style={{ background: t.colors.surface, border: `1px solid ${t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }} />
                        <div className="h-8 w-10 rounded-lg" style={{ background: `linear-gradient(135deg, ${t.colors.accent}, ${t.colors.accentSecondary})` }} />
                      </div>
                      <div className="flex gap-1.5 mb-3">
                        {[t.colors.bg, t.colors.surface, t.colors.accent, t.colors.accentSecondary, t.colors.text].map((c, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-full shadow-sm"
                            style={{ background: c, border: `1px solid ${t.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}
                          />
                        ))}
                      </div>
                      <h3 className="text-sm font-bold" style={{ color: t.colors.text }}>{t.name}</h3>
                      <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: t.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }}>
                        {t.description}
                      </p>
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

          {/* ─ Danger Zone ─ */}
          {section === 'account' && (
            <div className="bg-white dark:bg-slate-900/60 border border-rose-500/30 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Delete Account</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Permanently delete your Gringotts account and all associated data — transactions, budgets, investment goals, categories, and settings. This action <strong className="text-rose-500">cannot be undone</strong>. The following data will be lost:
                  </p>

                  <ul className="mt-3 space-y-1.5">
                    {[
                      'All transactions (expenses, incomes, savings, revolvings)',
                      'All budgets and budget allocations',
                      'All investment goals and progress',
                      'All categories, sub-categories, and items',
                      'Your account and login credentials',
                    ].map(item => (
                      <li key={item} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => setDeleteModal(true)}
                    className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-all shadow-lg shadow-rose-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDeleteAccount}
          onClose={() => setDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default Settings;
