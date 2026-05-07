import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, Phone, ArrowLeft, RefreshCw } from 'lucide-react';
import { auth } from '../auth';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getAuthErrorMessage } from '../utils/authErrors';
import { SocialLogin } from '../components/auth/SocialLogin';
import { PhoneAuth } from '../components/auth/PhoneAuth';

type LoginMethod = 'email' | 'phone';

export const LoginPage: React.FC = () => {
  const [method, setMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const validateField = (field: string, value: string) => {
    let error = '';
    switch (field) {
      case 'email':
        if (!value.trim()) {
          error = t('email_required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = t('invalid_email');
        } else if (value.length > 255) {
          error = t('email_max_chars');
        }
        break;
      case 'password':
        if (!value) {
          error = t('password_required');
        } else if (value.length > 128) {
          error = t('password_max');
        }
        break;
    }
    return error;
  };

  const handleFieldChange = (field: string, value: string) => {
    switch (field) {
      case 'email':
        setEmail(value);
        break;
      case 'password':
        setPassword(value);
        break;
    }
    const error = validateField(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate all fields
    const errors = {
      email: validateField('email', email),
      password: validateField('password', password)
    };

    setFieldErrors(errors);

    // Check if any errors exist
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError(getAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(t('reset_link_sent'));
    } catch (err: any) {
      setError(getAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#ab1017] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#ab1017]/20">
              <LogIn className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase text-[var(--text-primary)]">
              {showForgot ? t('reset_password_title') : t('welcome_back_title')}
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-2 text-center">
              {showForgot 
                ? t('forgot_password_subtitle') 
                : t('login_subtitle')}
            </p>
          </div>

          <div className="flex gap-2 mb-8 bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-color)]">
            <button
              onClick={() => { setMethod('email'); setShowForgot(false); }}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                method === 'email' ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-lg border border-[var(--border-color)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t('email')}
            </button>
            <button
              onClick={() => { setMethod('phone'); setShowForgot(false); }}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                method === 'phone' ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-lg border border-[var(--border-color)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t('phone_method')}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[#ab1017]/10 border border-[#ab1017]/20 rounded-xl flex items-center gap-3 text-[#ab1017] text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-500 text-sm">
              <RefreshCw size={18} />
              {success}
            </div>
          )}

          <AnimatePresence mode="wait">
            {showForgot ? (
              <motion.form
                key="forgot"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleForgotPassword}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5 ml-1">{t('email_address')}</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => handleFieldChange('email', e.target.value)}
                      className={`w-full bg-[var(--bg-tertiary)] border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[#ab1017] transition-colors text-[var(--text-primary)] ${
                        fieldErrors.email ? 'border-[#ab1017]' : 'border-[var(--border-color)]'
                      }`}
                      placeholder="name@example.com"
                      maxLength={255}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.email}</p>
                  )}
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#ab1017] hover:bg-[#8e0d13] disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-[#ab1017]/20 uppercase tracking-widest"
                >
                  {loading ? t('sending_reset_link') : t('send_reset_link')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="w-full flex items-center justify-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  <ArrowLeft size={14} />
                  {t('back_to_login')}
                </button>
              </motion.form>
            ) : method === 'email' ? (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5 ml-1">{t('email_address')}</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => handleFieldChange('email', e.target.value)}
                      className={`w-full bg-[var(--bg-tertiary)] border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[#ab1017] transition-colors text-[var(--text-primary)] ${
                        fieldErrors.email ? 'border-[#ab1017]' : 'border-[var(--border-color)]'
                      }`}
                      placeholder="name@example.com"
                      maxLength={255}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-[#ab1017] text-xs mt-1 ml-1">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5 ml-1">
                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{t('password')}</label>
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-[10px] font-black text-[#ab1017] uppercase tracking-widest hover:text-[#8e0d13]"
                    >
                      {t('forgot_password')}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={e => handleFieldChange('password', e.target.value)}
                      className={`w-full bg-[var(--bg-tertiary)] border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[#ab1017] transition-colors text-[var(--text-primary)] ${
                        fieldErrors.password ? 'border-[#ab1017]' : 'border-[var(--border-color)]'
                      }`}
                      placeholder="••••••••"
                      maxLength={128}
                    />
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[#ab1017] text-xs mt-1 ml-1">{fieldErrors.password}</p>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#ab1017] hover:bg-[#8e0d13] disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-[#ab1017]/20 uppercase tracking-widest mt-4"
                >
                  {loading ? t('authenticating') : t('login')}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <PhoneAuth />
              </motion.div>
            )}
          </AnimatePresence>

          {!showForgot && (
            <div className="mt-8">
              <SocialLogin />
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-[var(--border-color)] text-center">
            <p className="text-[var(--text-secondary)] text-sm">
              {t('dont_have_account')}{' '}
              <Link to="/register" className="text-[#ab1017] hover:text-[#8e0d13] font-bold transition-colors">
                {t('register_now')}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
