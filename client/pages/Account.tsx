import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../components/ToastContext';
import {
  User, KeyRound, Trash2, Camera, Save, Eye, EyeOff, AlertTriangle, X, Check
} from 'lucide-react';

interface AccountProps {
  onProfileUpdate: () => void;
}

type Section = 'profile' | 'security' | 'danger';

const SECTION_TABS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: KeyRound },
  { id: 'account', label: 'Account', icon: User },
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
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [section, setSection] = useState<Section>('profile');
  const [loading, setLoading] = useState(true);

  // Profile section
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profilePicture, setPicture] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Security section
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // Danger section
  const [showDeleteModal, setDeleteModal] = useState(false);

  useEffect(() => {
    api.getProfile()
      .then(p => {
        setUsername(p.username);
        setDisplayName(p.displayName);
        setPicture(p.profilePicture);
      })
      .finally(() => setLoading(false));
  }, []);

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
    setProfileSaving(true);
    try {
      await api.updateProfile(displayName, profilePicture);
      await onProfileUpdate();
      showToast('Profile updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save profile', 'error');
    } finally {
      setProfileSaving(false);
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
    } catch (err: any) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  // ── Delete handler ─────────────────────────────────────────────────────────

  const handleDeleteAccount = async (password: string) => {
    await api.deleteAccount(password);
    navigate('/login');
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

        {/* ── Sidebar tabs ── */}
        <aside className="md:w-52 shrink-0">
          <nav className="flex md:flex-col gap-2">
            {SECTION_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
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

              {/* Username (read-only) */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-sm cursor-not-allowed"
                />
                <p className="mt-1 text-[11px] text-slate-400">Username cannot be changed.</p>
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

              <div className="pt-2">
                <button
                  onClick={handleProfileSave}
                  disabled={profileSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-60 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all"
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
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Change Password</h2>
                <p className="text-xs text-slate-400 mt-0.5">Verify your current password before setting a new one.</p>
              </div>

              {/* Current password */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
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
              </div>

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

              <div className="pt-1">
                <button
                  onClick={handlePasswordReset}
                  disabled={pwSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-60 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all"
                >
                  {pwSaving
                    ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <KeyRound className="w-4 h-4" />
                  }
                  Change Password
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

export default Account;
