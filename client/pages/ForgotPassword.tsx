import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, ArrowRight, ChevronLeft, MailOpen, ShieldAlert, KeyRound, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await api.initiateForgotPasswordPublic(username.trim().toLowerCase());
      if (res.status === 'success') {
        setMaskedEmail(res.maskedEmail);
        setStep(2);
      } else {
        setError('This username does not exist or has no verified recovery email configured.');
      }
    } catch (err: any) {
      setError(err.message || 'This username does not exist or has no verified recovery email configured.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await api.confirmForgotPasswordPublic(username.trim().toLowerCase(), recoveryEmail.trim());
      setSuccess(true);
      setSuccessMessage(res.message || 'If the entered email is correct, a recovery link has been sent to it.');
    } catch (err: any) {
      // Per security design, confirm step should not reveal failure, but if there's a connection/system error we handle it
      setError(err.message || 'An error occurred while confirming password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setError('');
    setRecoveryEmail('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Background decoration with animated feel */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl transition-transform duration-1000 animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl transition-transform duration-1000 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="glass rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 p-8 border border-white/10 backdrop-blur-md">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-2xl shadow-lg shadow-cyan-500/25 mb-4 transform transition-transform hover:scale-105 duration-300">
              {success ? (
                <MailOpen className="text-white w-7 h-7" />
              ) : step === 2 ? (
                <KeyRound className="text-white w-7 h-7" />
              ) : (
                <Landmark className="text-white w-7 h-7" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white transition-all duration-300">
              {success ? 'Link Dispatched' : step === 2 ? 'Security Verification' : 'Reset Password'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center leading-relaxed">
              {success
                ? 'Check your recovery inbox for instructions'
                : step === 2
                  ? 'Provide the complete verified recovery email to unlock the link.'
                  : 'Enter your username to begin the secure password recovery process.'
              }
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 dark:text-rose-400 text-sm text-center font-medium flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="space-y-6">
              <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm text-center font-medium leading-relaxed flex flex-col items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <span>{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          ) : step === 1 ? (
            /* STEP 1: Enter Username */
            <form onSubmit={handleNextStep} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
                  placeholder="e.g. johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-2 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to login
              </button>
            </form>
          ) : (
            /* STEP 2: Enter Recovery Email with Masked Hint */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 transition-all duration-300">
                <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Verified Recovery Email
                </div>
                <div className="font-mono text-center text-sm md:text-base text-cyan-600 dark:text-cyan-400 bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/20 py-2.5 px-3 rounded-xl select-all font-semibold overflow-x-auto whitespace-nowrap scrollbar-thin">
                  {maskedEmail}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300" htmlFor="recoveryEmail">
                  Confirm Full Recovery Email
                </label>
                <input
                  id="recoveryEmail"
                  type="email"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
                  placeholder="Confirm the full email address"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBackToStep1}
                  disabled={isLoading}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700/50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
