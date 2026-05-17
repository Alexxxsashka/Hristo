import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Shield, 
  Mail, 
  Key, 
  Trash2, 
  FileText, 
  UserCheck, 
  AlertTriangle,
  RefreshCw,
  Phone,
  Calendar,
  Lock,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { databaseService } from '../../services/databaseService';
import { generateUsersReport } from '../../utils/reportGenerator';
import { TableRowSkeleton } from '../Skeleton';

interface RolesManagerProps {
  users: any[];
  onUpdate: () => void;
  onNotify: (message: string, type: 'success' | 'error') => void;
  onConfirm: (message: string, onConfirm: () => void) => void;
}

export const RolesManager: React.FC<RolesManagerProps> = ({ 
  users, 
  onUpdate, 
  onNotify, 
  onConfirm 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager' | 'user'>('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  
  // Modals / Dialogs state
  const [resetResult, setResetResult] = useState<{ 
    isOpen: boolean; 
    email: string; 
    method: string; 
    tempPassword?: string; 
    resetLink?: string; 
  } | null>(null);

  const [emailModal, setEmailModal] = useState<{ 
    isOpen: boolean; 
    userId: string; 
    currentEmail: string; 
    newEmail: string; 
  } | null>(null);

  // Search & Filter Logic
  const filteredUsers = users.filter(u => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (u.username || '').toLowerCase().includes(searchLower) ||
      (u.email || '').toLowerCase().includes(searchLower) ||
      (u.phone || '').toLowerCase().includes(searchLower) ||
      (u.id || '').toLowerCase().includes(searchLower);

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // 1. Update Role in Real Time
  const handleRoleChange = async (userId: string, newRole: string) => {
    setIsUpdating(userId);
    try {
      await databaseService.updateUserRole(userId, newRole);
      onNotify(`User privileges updated successfully to ${newRole.toUpperCase()}`, 'success');
      onUpdate(); // refresh users list
    } catch (err: any) {
      console.error(err);
      onNotify(err.message || 'Failed to update user role', 'error');
    } finally {
      setIsUpdating(null);
    }
  };

  // 2. Reset Password
  const handlePasswordReset = async (user: any) => {
    onConfirm(
      `Are you sure you want to trigger a password reset for ${user.username || user.email}?`,
      async () => {
        try {
          const res = await databaseService.resetUserPassword(user.id);
          setResetResult({
            isOpen: true,
            email: user.email,
            method: res.data.method,
            tempPassword: res.data.tempPassword,
            resetLink: res.data.resetLink
          });
          onNotify('Password reset triggered successfully', 'success');
          onUpdate();
        } catch (err: any) {
          onNotify(err.message || 'Failed to reset password', 'error');
        }
      }
    );
  };

  // 3. Update Email Modal trigger & execution
  const handleEmailUpdateTrigger = (user: any) => {
    setEmailModal({
      isOpen: true,
      userId: user.id,
      currentEmail: user.email,
      newEmail: ''
    });
  };

  const handleEmailUpdateSubmit = async () => {
    if (!emailModal || !emailModal.newEmail.includes('@')) {
      onNotify('Please enter a valid email address', 'error');
      return;
    }
    const { userId, newEmail } = emailModal;
    try {
      await databaseService.resetUserEmail(userId, newEmail);
      onNotify(`User email successfully updated to ${newEmail}`, 'success');
      setEmailModal(null);
      onUpdate();
    } catch (err: any) {
      onNotify(err.message || 'Failed to update email address', 'error');
    }
  };

  // 4. Delete Account
  const handleUserDelete = (user: any) => {
    onConfirm(
      `⚠️ CRITICAL DANGER: Are you sure you want to permanently DELETE the account of ${user.username || user.email}? This action is irreversible and deletes records from both Neon SQL and Firebase Auth!`,
      async () => {
        try {
          await databaseService.deleteUser(user.id);
          onNotify('Account successfully expunged from the system', 'success');
          onUpdate();
        } catch (err: any) {
          onNotify(err.message || 'Failed to delete account', 'error');
        }
      }
    );
  };

  // 5. Generate PDF Report
  const handleExportPDF = () => {
    try {
      generateUsersReport(filteredUsers);
      onNotify(`Users audit report generated successfully for ${filteredUsers.length} records`, 'success');
    } catch (err) {
      onNotify('Failed to generate PDF report', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tighter flex items-center gap-3">
            <Users className="text-red-600" size={32} />
            User Roles & Access Control
          </h2>
          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">
            Real-time privileges management and account vectors audit
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-[var(--border-color)] shadow-sm self-start sm:self-auto"
        >
          <FileText size={18} />
          Report (PDF)
        </button>
      </div>

      {/* Stats Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)]">
          <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Total Accounts</div>
          <div className="text-2xl font-black mt-2 text-[var(--text-primary)]">{users.length}</div>
        </div>
        <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)]">
          <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Administrators</div>
          <div className="text-2xl font-black mt-2 text-red-500">{users.filter(u => u.role === 'admin').length}</div>
        </div>
        <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)]">
          <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Managers</div>
          <div className="text-2xl font-black mt-2 text-blue-500">{users.filter(u => u.role === 'manager').length}</div>
        </div>
        <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)]">
          <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Customers</div>
          <div className="text-2xl font-black mt-2 text-[var(--text-secondary)]">{users.filter(u => u.role !== 'admin' && u.role !== 'manager').length}</div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
            <input
              type="text"
              placeholder="Search by Name, Email, Phone, or UID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-2xl outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium"
            />
          </div>
          <div className="relative">
            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as any)}
              className="pl-12 pr-10 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-2xl outline-none focus:ring-2 focus:ring-red-600 appearance-none font-bold text-xs uppercase tracking-widest min-w-[160px]"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="manager">Managers</option>
              <option value="user">Customers</option>
            </select>
          </div>
        </div>
        <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
          Found {filteredUsers.length} records
        </div>
      </div>

      {/* Users Roles Table */}
      <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
              <tr>
                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">User Profile</th>
                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Contact Info</th>
                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Privilege Group</th>
                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Loyalty Level</th>
                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Created</th>
                <th className="px-6 py-4 font-semibold text-[var(--text-secondary)] text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => {
                  const initials = (user.username || user.email || 'U').substring(0, 2).toUpperCase();
                  const isUserUpdating = isUpdating === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                      {/* Name / Profile avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center font-bold text-red-500">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                              {user.username || 'Anonymous User'}
                            </div>
                            <div className="text-[10px] font-mono text-[var(--text-secondary)]">
                              UID: {user.id.substring(0, 12)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact: Email & Phone */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <div className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                            <Mail size={12} className="text-[var(--text-secondary)]" />
                            {user.email}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                            <Phone size={12} />
                            {user.phone || <span className="opacity-40 italic">No phone registered</span>}
                          </div>
                        </div>
                      </td>

                      {/* Privilege (Role Selector) */}
                      <td className="px-6 py-4">
                        <div className="relative inline-flex items-center min-w-[130px]">
                          {isUserUpdating ? (
                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
                              <RefreshCw className="animate-spin text-red-600" size={14} />
                              Syncing...
                            </div>
                          ) : (
                            <div className="relative w-full group">
                              <select
                                value={user.role || 'user'}
                                onChange={e => handleRoleChange(user.id, e.target.value)}
                                className={`w-full appearance-none pl-3 pr-8 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl outline-none focus:ring-1 focus:ring-red-600 transition-all font-bold text-xs uppercase tracking-wider cursor-pointer text-center
                                  ${user.role === 'admin' ? 'text-red-500 border-red-600/30 bg-red-600/5' : ''}
                                  ${user.role === 'manager' ? 'text-blue-500 border-blue-600/30 bg-blue-600/5' : ''}
                                  ${user.role === 'user' || !user.role ? 'text-[var(--text-secondary)]' : ''}
                                `}
                              >
                                <option value="user">User</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                              </select>
                              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Loyalty info */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                            {user.rank || 'Recruit'}
                          </span>
                          <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                            {user.points || 0} Loyalty Points
                          </span>
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className="px-6 py-4">
                        <span className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                          <Calendar size={12} />
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePasswordReset(user)}
                            title="Reset Credentials / Reset Password"
                            className="p-2.5 text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all border border-transparent hover:border-amber-500/20"
                          >
                            <Key size={16} />
                          </button>
                          <button
                            onClick={() => handleEmailUpdateTrigger(user)}
                            title="Update Profile Email Address"
                            className="p-2.5 text-[var(--text-secondary)] hover:text-blue-500 hover:bg-blue-50/10 rounded-xl transition-all border border-transparent hover:border-blue-500/20"
                          >
                            <UserCheck size={16} />
                          </button>
                          <button
                            onClick={() => handleUserDelete(user)}
                            title="Permanently Expunge Account"
                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-500/20"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-[var(--text-secondary)]">
                      <Users size={48} className="mb-4 opacity-20" />
                      <p className="font-black uppercase tracking-widest text-xs">No users matching current filters found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals & Portals */}
      <AnimatePresence>
        {/* Reset credentials dialog */}
        {resetResult && resetResult.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 rounded-[32px] max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">User Password Reset Link</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Credentials generated successfully for {resetResult.email}</p>
              </div>

              {resetResult.method === 'firebase' && resetResult.resetLink ? (
                <div className="space-y-4">
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    A Firebase reset link was generated. Provide this link to the user so they can reset their password securely:
                  </p>
                  <textarea
                    readOnly
                    value={resetResult.resetLink}
                    onClick={e => (e.target as HTMLTextAreaElement).select()}
                    className="w-full p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-mono rounded-xl outline-none h-24 select-all cursor-pointer focus:ring-1 focus:ring-red-600"
                  />
                  <div className="text-[10px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={12} />
                    Copy this link and provide it to the client.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    The user account relies on database credentials. A new secure password has been generated:
                  </p>
                  <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] text-red-500 font-mono text-center text-lg font-bold rounded-xl select-all select-text selection:bg-red-600 selection:text-white">
                    {resetResult.tempPassword}
                  </div>
                  <div className="text-[10px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={12} />
                    Provide this temporary key immediately. It is encrypted in SQL.
                  </div>
                </div>
              )}

              <button
                onClick={() => setResetResult(null)}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-red-600/20 active:scale-95"
              >
                Close Dialog
              </button>
            </motion.div>
          </div>
        )}

        {/* Change email modal */}
        {emailModal && emailModal.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 rounded-[32px] max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Update User Email</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Changes are synced directly across PostgreSQL and Firebase.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-2">Current Address</label>
                  <input
                    type="text"
                    disabled
                    value={emailModal.currentEmail}
                    className="w-full px-4 py-3 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl outline-none opacity-60 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-2">New Email Address</label>
                  <input
                    type="email"
                    value={emailModal.newEmail}
                    onChange={e => setEmailModal({ ...emailModal, newEmail: e.target.value })}
                    placeholder="Enter new email..."
                    className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setEmailModal(null)}
                  className="flex-1 py-4 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-2xl font-bold transition-all border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmailUpdateSubmit}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-red-600/20 active:scale-95"
                >
                  Update Email
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
