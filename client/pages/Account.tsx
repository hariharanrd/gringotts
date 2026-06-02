import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { api } from '../services/api';
import { useToast } from '../components/ToastContext';
import { useTheme, THEME_LIBRARY, ThemeId } from '../components/ThemeContext';
import {
  User, KeyRound, Trash2, Camera, Save, Eye, EyeOff, AlertTriangle, X, Check, Palette, Sun, Moon, ChevronDown, Loader2, Info, RefreshCcw, Globe, Monitor, LogOut, QrCode, Copy, CheckCircle2, Lock
} from 'lucide-react';
import { UserSession } from '../types';
import { personalizationSync } from '../services/personalizationSync';
import { getUserTimeZone, getTimezoneOffset } from '../services/dateUtils';

interface AccountProps {
  onProfileUpdate: () => void;
}

type Section = 'profile' | 'security' | 'sessions' | 'danger' | 'account' | 'preferences';

const SECTION_TABS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Regional', icon: Globe },
  { id: 'security', label: 'Security', icon: KeyRound },
  { id: 'sessions', label: 'Active Sessions', icon: Monitor },
  { id: 'account', label: 'Account', icon: User }
];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 border border-rose-500/20 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4 mb-5">
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

        <div className="flex gap-3 mt-5">
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

const Account: React.FC<AccountProps> = ({ onProfileUpdate }) => {
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [section, setSection] = useState<Section>(() => {
    const tab = searchParams.get('tab') as Section;
    return (tab && SECTION_TABS.some(t => t.id === tab)) ? tab : 'profile';
  });
  const [loading, setLoading] = useState(true);

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
  const [menuOpen, setMenuOpen] = useState(false);

  // Preferences section
  const [timezone, setTimezone] = useState(localStorage.getItem('gringotts-timezone') || 'UTC');
  const [availableTimezones, setAvailableTimezones] = useState<string[]>([]);

  // Sessions section
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

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
    <div className="max-w-4xl mx-auto">
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
          <nav className="hidden md:flex md:flex-col gap-2">
            {SECTION_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleSectionChange(id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left
                  ${section === id
                    ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-600 dark:text-cyan-400'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </button>
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
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all disabled:opacity-60"
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

export default Account;
