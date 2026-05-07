import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthStore } from '../../store/authStore';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { UserProfile } from '../../types';

interface AccountSettingsProps {
  profile: UserProfile | null;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ profile }) => {
  const { t } = useTranslation();
  const { user, updateProfile, updateEmail, sendVerificationEmail } = useAuthStore();
  const [callsign, setCallsign] = useState(profile?.callsign || '');
  const [teamName, setTeamName] = useState(profile?.teamName || '');
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [newEmail, setNewEmail] = useState('');
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      await updateProfile({ callsign, teamName, displayName });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail) return;
    setLoading(true);
    setEmailError('');
    setEmailSuccess(false);
    try {
      await updateEmail(newEmail);
      setEmailSuccess(true);
      setShowEmailChange(false);
      setNewEmail('');
      setTimeout(() => setEmailSuccess(false), 5000);
    } catch (error: any) {
      setEmailError(error.code ? getAuthErrorMessage(error.code) : (error.message || t('failed_to_update_email')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black tracking-tighter uppercase text-[var(--text-primary)]">{t('profile_center')}</h2>
        <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-[10px] mt-1">{t('manage_operator_identity')}</p>
      </header>

      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-8 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{t('callsign')}</label>
              <input 
                type="text" 
                value={callsign}
                onChange={e => setCallsign(e.target.value)}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-red-600 transition-colors"
                placeholder={t('eg_ghost')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{t('team_name')}</label>
              <input 
                type="text" 
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-red-600 transition-colors"
                placeholder={t('eg_task_force')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{t('display_name')}</label>
              <input 
                type="text" 
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{t('email_address')}</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input 
                    type="email" 
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm text-[var(--text-secondary)] opacity-70 cursor-not-allowed"
                  />
                  {user?.isEmailVerified ? (
                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={16} />
                  ) : (
                    <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-500" size={16} />
                  )}
                </div>
                {!user?.isEmailVerified && (
                  <button 
                    type="button"
                    onClick={() => sendVerificationEmail()}
                    className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
                  >
                    {t('verify')}
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => setShowEmailChange(!showEmailChange)}
                  className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
                >
                  {t('change')}
                </button>
              </div>
              {showEmailChange && (
                <div className="mt-4 p-4 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)] space-y-4">
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{t('new_email_address')}</p>
                  <div className="flex gap-2">
                    <input 
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="new@example.com"
                      className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-2 px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-red-600 transition-colors"
                    />
                    <button 
                      type="button"
                      onClick={handleEmailChange}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all"
                    >
                      {t('update')}
                    </button>
                  </div>
                  {emailError && <p className="text-red-500 text-[10px] font-bold uppercase">{emailError}</p>}
                  <p className="text-[10px] text-[var(--text-secondary)] italic">{t('reauth_note')}</p>
                </div>
              )}
              {emailSuccess && (
                <p className="mt-2 text-green-500 text-[10px] font-bold uppercase flex items-center gap-2">
                  <CheckCircle2 size={12} /> {t('verification_email_sent')}
                </p>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--border-color)] flex justify-between items-center">
            {success && (
              <p className="text-green-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={14} /> {t('profile_updated_successfully')}
              </p>
            )}
            <button 
              type="submit"
              disabled={loading}
              className="ml-auto px-8 py-4 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center gap-2"
            >
              {loading && <RefreshCw size={14} className="animate-spin" />}
              {t('save_changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
