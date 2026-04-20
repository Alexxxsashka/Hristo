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
  const [googleLogo, setGoogleLogo] = useState<string>('');

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const url = await databaseService.getFileURL('site/2d/Google__G__logo.svg.png');
        setGoogleLogo(url);
      } catch (err) {
        console.error('Failed to fetch Google logo:', err);
      }
    };
    fetchLogo();
  }, []);

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
        <h2 className="text-3xl font-black tracking-tighter uppercase">{t('security_and_auth')}</h2>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">{t('protect_account_manage_access')}</p>
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
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center">
              <Lock className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-widest text-sm">{t('password')}</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{t('last_changed_recently')}</p>
            </div>
          </div>
          <button 
            onClick={handlePasswordReset}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
          >
            {t('change_password')}
          </button>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center">
              <Smartphone className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-widest text-sm">{t('two_factor_auth')}</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                {t('status')}: <span className={user?.isMfaEnabled ? 'text-green-500' : 'text-red-500'}>
                  {user?.isMfaEnabled ? t('enabled') : t('disabled')}
                </span>
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSecurityMessage({ type: 'error', text: 'MFA setup requires phone verification. Please contact support for assistance.' })}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
          >
            {user?.isMfaEnabled ? t('manage_mfa') : t('enable_mfa')}
          </button>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
        <h3 className="font-black uppercase tracking-widest text-sm mb-6">{t('linked_accounts')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center overflow-hidden">
                {googleLogo ? (
                  <img src={googleLogo} alt="Google" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <Shield size={20} className="text-zinc-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest">Google</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  {user?.linkedProviders.includes('google.com') ? t('connected') : t('not_connected')}
                </p>
              </div>
            </div>
            {user?.linkedProviders.includes('google.com') ? (
              <button 
                onClick={() => handleUnlinkProvider('google.com')}
                className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest"
              >
                {t('unlink')}
              </button>
            ) : (
              <button 
                onClick={() => handleLinkProvider('google')}
                className="text-[10px] font-black text-zinc-400 hover:text-white uppercase tracking-widest"
              >
                {t('link')}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
                <Shield size={20} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest">Apple</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  {user?.linkedProviders.includes('apple.com') ? t('connected') : t('not_connected')}
                </p>
              </div>
            </div>
            {user?.linkedProviders.includes('apple.com') ? (
              <button 
                onClick={() => handleUnlinkProvider('apple.com')}
                className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest"
              >
                {t('unlink')}
              </button>
            ) : (
              <button 
                onClick={() => handleLinkProvider('apple')}
                className="text-[10px] font-black text-zinc-400 hover:text-white uppercase tracking-widest"
              >
                {t('link')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-red-600/5 border border-red-600/20 rounded-3xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <AlertCircle className="text-red-600" size={24} />
          <h3 className="font-black uppercase tracking-widest text-sm">{t('danger_zone')}</h3>
        </div>
        <p className="text-sm text-zinc-400 mb-6">{t('delete_account_warning')}</p>
        
        {!showDeleteConfirm ? (
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-3 bg-red-600/10 text-red-500 font-black uppercase tracking-widest text-[10px] rounded-xl border border-red-600/20 hover:bg-red-600/20 transition-all"
          >
            {t('delete_account')}
          </button>
        ) : (
          <div className="space-y-4 max-w-sm">
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest">{t('confirm_deletion_password')}</p>
            <input 
              type="password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              placeholder={t('confirm_password')}
              className="w-full bg-zinc-950 border border-red-600/50 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600 transition-colors"
            />
            {deleteError && <p className="text-red-500 text-[10px] font-bold uppercase">{deleteError}</p>}
            <div className="flex gap-3">
              <button 
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all"
              >
                {deleteLoading ? t('deleting') : t('confirm_delete')}
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-zinc-800 text-zinc-400 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-zinc-700 transition-all"
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
