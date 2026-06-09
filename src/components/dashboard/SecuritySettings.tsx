import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Smartphone, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthStore } from '../../store/authStore';
import { databaseService } from '../../services/databaseService';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { UserProfile } from '../../types';

interface SecuritySettingsProps {
  profile: UserProfile | null;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ profile }) => {
  const { t } = useTranslation();
  const { user, deleteAccount, resetPassword, linkGoogle, linkApple, unlinkProvider } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  // Google and Apple icons are rendered directly using SVG for absolute reliability

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteAccount(deletePassword);
      window.location.href = '/';
    } catch (error: any) {
      setDeleteError(error.message || 'Failed to delete account. Re-authentication might be required.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (user?.email) {
      try {
        await resetPassword(user.email);
        setSecurityMessage({ type: 'success', text: t('password_reset_email_sent') });
        setTimeout(() => setSecurityMessage(null), 5000);
      } catch (error: any) {
        const errorMessage = error.code ? getAuthErrorMessage(error.code) : (error.message || t('failed_to_send_reset_email'));
        setSecurityMessage({ type: 'error', text: errorMessage });
        setTimeout(() => setSecurityMessage(null), 5000);
      }
    } else {
      setSecurityMessage({ type: 'error', text: t('no_email_associated') });
      setTimeout(() => setSecurityMessage(null), 5000);
    }
  };

  const handleLinkProvider = async (provider: 'google' | 'apple') => {
    try {
      if (provider === 'google') await linkGoogle();
      else await linkApple();
      setSecurityMessage({ type: 'success', text: t('account_linked_successfully') });
    } catch (error: any) {
      setSecurityMessage({ type: 'error', text: error.message || t('failed_to_link_account') });
    }
  };

  const handleUnlinkProvider = async (providerId: string) => {
    try {
      await unlinkProvider(providerId);
      setSecurityMessage({ type: 'success', text: t('account_unlinked_successfully') });
    } catch (error: any) {
      setSecurityMessage({ type: 'error', text: error.message || t('failed_to_unlink_account') });
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black tracking-tighter uppercase text-[var(--text-primary)]">{t('security_and_auth')}</h2>
        <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-[10px] mt-1">{t('protect_account_manage_access')}</p>
      </header>

      {securityMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border ${
            securityMessage.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
          } text-[10px] font-black uppercase tracking-widest flex items-center gap-3`}
        >
          {securityMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {securityMessage.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center">
              <Lock className="text-[#ab1017]" size={24} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-widest text-sm text-[var(--text-primary)]">{t('password')}</h3>
              <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">{t('last_changed_recently')}</p>
            </div>
          </div>
          <button 
            onClick={handlePasswordReset}
            className="w-full py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
          >
            {t('change_password')}
          </button>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center">
              <Smartphone className="text-[#ab1017]" size={24} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-widest text-sm text-[var(--text-primary)]">{t('two_factor_auth')}</h3>
              <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">
                {t('status')}: <span className={user?.isMfaEnabled ? 'text-green-500' : 'text-[#ab1017]'}>
                  {user?.isMfaEnabled ? t('enabled') : t('disabled')}
                </span>
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSecurityMessage({ type: 'error', text: 'MFA setup requires phone verification. Please contact support for assistance.' })}
            className="w-full py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
          >
            {user?.isMfaEnabled ? t('manage_mfa') : t('enable_mfa')}
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-8 shadow-sm">
        <h3 className="font-black uppercase tracking-widest text-sm mb-6 text-[var(--text-primary)]">{t('linked_accounts')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)] shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex items-center justify-center overflow-hidden">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">Google</p>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">
                  {user?.linkedProviders.includes('google.com') ? t('connected') : t('not_connected')}
                </p>
              </div>
            </div>
            {user?.linkedProviders.includes('google.com') ? (
              <button 
                onClick={() => handleUnlinkProvider('google.com')}
                className="text-[10px] font-black text-[#ab1017] hover:text-[#8e0d13] uppercase tracking-widest"
              >
                {t('unlink')}
              </button>
            ) : (
              <button 
                onClick={() => handleLinkProvider('google')}
                className="text-[10px] font-black text-[var(--text-secondary)] hover:text-[var(--text-primary)] uppercase tracking-widest"
              >
                {t('link')}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)] shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 fill-current text-[var(--text-primary)]" viewBox="0 0 384 512">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">Apple</p>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">
                  {user?.linkedProviders.includes('apple.com') ? t('connected') : t('not_connected')}
                </p>
              </div>
            </div>
            {user?.linkedProviders.includes('apple.com') ? (
              <button 
                onClick={() => handleUnlinkProvider('apple.com')}
                className="text-[10px] font-black text-[#ab1017] hover:text-[#8e0d13] uppercase tracking-widest"
              >
                {t('unlink')}
              </button>
            ) : (
              <button 
                onClick={() => handleLinkProvider('apple')}
                className="text-[10px] font-black text-[var(--text-secondary)] hover:text-[var(--text-primary)] uppercase tracking-widest"
              >
                {t('link')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#ab1017]/5 border border-[#ab1017]/20 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <AlertCircle className="text-[#ab1017]" size={24} />
          <h3 className="font-black uppercase tracking-widest text-sm text-[var(--text-primary)]">{t('danger_zone')}</h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{t('delete_account_warning')}</p>
        
        {!showDeleteConfirm ? (
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-3 bg-[#ab1017]/10 text-[#ab1017] font-black uppercase tracking-widest text-[10px] rounded-xl border border-[#ab1017]/20 hover:bg-[#ab1017]/20 transition-all"
          >
            {t('delete_account')}
          </button>
        ) : (
          <div className="space-y-4 max-w-sm">
            <p className="text-xs font-bold text-[#ab1017] uppercase tracking-widest">{t('confirm_deletion_password')}</p>
            <input 
              type="password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              placeholder={t('confirm_password')}
              className="w-full bg-[var(--bg-tertiary)] border border-[#ab1017]/50 rounded-xl py-3 px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#ab1017] transition-colors"
            />
            {deleteError && <p className="text-[#ab1017] text-[10px] font-bold uppercase">{deleteError}</p>}
            <div className="flex gap-3">
              <button 
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 py-3 bg-[#ab1017] text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-[#ab1017]/20 hover:bg-[#8e0d13] transition-all"
              >
                {deleteLoading ? t('deleting') : t('confirm_delete')}
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-[var(--bg-secondary)] transition-all"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
