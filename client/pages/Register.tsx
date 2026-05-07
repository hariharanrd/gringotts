import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { Landmark, ArrowRight, Copy, Check } from 'lucide-react';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [preAuthToken, setPreAuthToken] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Registration failed');
      }

      const data = await response.json();
      setSecret(data.secret);
      setPreAuthToken(data.preAuthToken);
      const qrUrl = await QRCode.toDataURL(data.otpAuthTotpURL);
      setQrCodeUrl(qrUrl);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/v1/auth/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preAuthToken,
          code: parseInt(code),
          trustBrowser: false
        }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Invalid 2FA code');

      // On success, redirect to dashboard. The session cookie is already set by the backend.
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="glass rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 p-3 rounded-2xl shadow-lg shadow-violet-500/25 mb-4">
              <Landmark className="text-white w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{step === 1 ? 'Create Account' : 'Setup 2FA'}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {step === 1 ? 'Register a new vault account' : 'Scan the QR code with your authenticator app'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 dark:text-rose-400 text-sm text-center font-medium">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Username</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1 px-1">
                  Use lowercase letters, numbers, dots (.), or underscores (_) only.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Confirm Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white py-3 rounded-xl font-semibold hover:from-violet-400 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="bg-white rounded-xl p-4 mx-auto w-fit">
                <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
              </div>

              <div className="bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3">
                {!showManual ? (
                  <button
                    type="button"
                    onClick={() => setShowManual(true)}
                    className="text-xs text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 font-medium flex items-center gap-2 transition-colors mx-auto"
                  >
                    Enter secret manually?
                  </button>
                ) : (
                  <>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1 font-medium">Manual Entry Key</p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-cyan-600 dark:text-cyan-400 font-mono break-all select-all flex-grow">{secret}</p>
                      <button
                        type="button"
                        onClick={copyToClipboard}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400"
                        title="Copy to clipboard"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Enter Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 tracking-[0.3em] text-center font-mono"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-400 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Verify & Complete
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
