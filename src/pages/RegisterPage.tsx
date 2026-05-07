import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../hooks/useTranslation';
import { motion } from 'framer-motion';
import { User, Mail, Lock, UserPlus, AlertCircle } from 'lucide-react';
import { auth } from '../auth';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { getAuthErrorMessage } from '../utils/authErrors';
import { SocialLogin } from '../components/auth/SocialLogin';
import { PasswordStrength } from '../components/auth/PasswordStrength';

export const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const isPasswordStrong = (pass: string) => {
    return pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass);
  };

  const validateField = (field: string, value: string) => {
    let error = '';
    switch (field) {
      case 'username':
        if (!value.trim()) {
          error = t('username_required');
        } else if (value.length < 3) {
          error = t('username_min');
        } else if (value.length > 50) {
          error = t('username_max');
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          error = t('username_invalid');
        }
        break;
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
        } else if (value.length < 8) {
          error = t('password_min');
        } else if (value.length > 128) {
          error = t('password_max');
        } else if (!/[A-Z]/.test(value)) {
          error = t('password_uppercase');
        } else if (!/[a-z]/.test(value)) {
          error = t('password_lowercase');
        } else if (!/[0-9]/.test(value)) {
          error = t('password_number');
        } else if (!/[^A-Za-z0-9]/.test(value)) {
          error = t('password_special');
        }
        break;
      case 'confirmPassword':
        if (!value) {
          error = t('confirm_password_prompt');
        } else if (value !== password) {
          error = t('passwords_dont_match');
        }
        break;
    }
    return error;
  };

  const handleFieldChange = (field: string, value: string) => {
    switch (field) {
      case 'username':
        setUsername(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
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
      username: validateField('username', username),
      email: validateField('email', email),
      password: validateField('password', password),
      confirmPassword: validateField('confirmPassword', confirmPassword)
    };

    setFieldErrors(errors);

    // Check if any errors exist
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: username });
      await sendEmailVerification(user);

      // Sync user to SQL instead of Firestore
      const token = await user.getIdToken();
      await fetch(`/api/users/${user.uid}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          uid: user.uid,
          username,
          email,
          role: 'user'
        })
      });

      navigate('/');
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
              <UserPlus className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase text-[var(--text-primary)]">{t('join_squad')}</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-2 text-center">{t('create_account_desc')}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[#ab1017]/10 border border-[#ab1017]/20 rounded-xl flex items-center gap-3 text-[#ab1017] text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5 ml-1">{t('username')}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                <input 
                  type="text" 
                  value={username}
                  onChange={e => handleFieldChange('username', e.target.value)}
                  className={`w-full bg-[var(--bg-tertiary)] border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[#ab1017] transition-colors text-[var(--text-primary)] ${
                    fieldErrors.username ? 'border-[#ab1017]' : 'border-[var(--border-color)]'
                  }`}
                  placeholder="johndoe"
                  maxLength={50}
                />
              </div>
              {fieldErrors.username && (
                <p className="text-[#ab1017] text-xs mt-1 ml-1">{fieldErrors.username}</p>
              )}
            </div>

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
              <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5 ml-1">{t('password')}</label>
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
              <PasswordStrength password={password} />
              {fieldErrors.password && (
                <p className="text-[#ab1017] text-xs mt-1 ml-1">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5 ml-1">{t('confirm_password')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={e => handleFieldChange('confirmPassword', e.target.value)}
                  className={`w-full bg-[var(--bg-tertiary)] border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[#ab1017] transition-colors text-[var(--text-primary)] ${
                    fieldErrors.confirmPassword ? 'border-[#ab1017]' : 'border-[var(--border-color)]'
                  }`}
                  placeholder="••••••••"
                  maxLength={128}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-[#ab1017] text-xs mt-1 ml-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#ab1017] hover:bg-[#8e0d13] disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-[#ab1017]/20 uppercase tracking-widest mt-4"
            >
              {loading ? t('creating_account') : t('register')}
            </button>
          </form>

          <div className="mt-8">
            <SocialLogin />
          </div>

          <div className="mt-8 pt-8 border-t border-[var(--border-color)] text-center">
            <p className="text-[var(--text-secondary)] text-sm">
              {t('already_have_account')}{' '}
              <Link to="/login" className="text-[#ab1017] hover:text-[#8e0d13] font-bold transition-colors">
                {t('login_now')}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
