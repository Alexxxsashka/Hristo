import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
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
          error = 'Username is ';
        } else if (value.length < 3) {
          error = 'Username must be at least 3 characters';
        } else if (value.length > 50) {
          error = 'Username must be less than 50 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          error = 'Username can only contain letters, numbers, and underscores';
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email is ';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        } else if (value.length > 255) {
          error = 'Email must be less than 255 characters';
        }
        break;
      case 'password':
        if (!value) {
          error = 'Password is ';
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters';
        } else if (value.length > 128) {
          error = 'Password must be less than 128 characters';
        } else if (!/[A-Z]/.test(value)) {
          error = 'Password must contain at least one uppercase letter';
        } else if (!/[a-z]/.test(value)) {
          error = 'Password must contain at least one lowercase letter';
        } else if (!/[0-9]/.test(value)) {
          error = 'Password must contain at least one number';
        } else if (!/[^A-Za-z0-9]/.test(value)) {
          error = 'Password must contain at least one special character';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm your password';
        } else if (value !== password) {
          error = 'Passwords do not match';
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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-red-600/20">
              <UserPlus className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Join the Squad</h1>
            <p className="text-zinc-500 text-sm mt-2">Create your account to start customizing</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text" 
                  value={username}
                  onChange={e => handleFieldChange('username', e.target.value)}
                  className={`w-full bg-zinc-800/50 border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-red-600 transition-colors text-zinc-100 ${
                    fieldErrors.username ? 'border-red-500' : 'border-zinc-700'
                  }`}
                  placeholder="johndoe"
                  maxLength={50}
                />
              </div>
              {fieldErrors.username && (
                <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => handleFieldChange('email', e.target.value)}
                  className={`w-full bg-zinc-800/50 border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-red-600 transition-colors text-zinc-100 ${
                    fieldErrors.email ? 'border-red-500' : 'border-zinc-700'
                  }`}
                  placeholder="name@example.com"
                  maxLength={255}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => handleFieldChange('password', e.target.value)}
                  className={`w-full bg-zinc-800/50 border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-red-600 transition-colors text-zinc-100 ${
                    fieldErrors.password ? 'border-red-500' : 'border-zinc-700'
                  }`}
                  placeholder="••••••••"
                  maxLength={128}
                />
              </div>
              <PasswordStrength password={password} />
              {fieldErrors.password && (
                <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={e => handleFieldChange('confirmPassword', e.target.value)}
                  className={`w-full bg-zinc-800/50 border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-red-600 transition-colors text-zinc-100 ${
                    fieldErrors.confirmPassword ? 'border-red-500' : 'border-zinc-700'
                  }`}
                  placeholder="••••••••"
                  maxLength={128}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-600/20 uppercase tracking-widest mt-4"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <div className="mt-8">
            <SocialLogin />
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-800 text-center">
            <p className="text-zinc-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-red-500 hover:text-red-400 font-bold transition-colors">
                Login Now
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
