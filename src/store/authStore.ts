import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '../auth';
import { 
  onAuthStateChanged, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup, 
  OAuthProvider, 
  linkWithPopup, 
  unlink, 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  reauthenticateWithCredential, 
  EmailAuthProvider, 
  deleteUser,
  User as FirebaseUser,
  multiFactor
} from 'firebase/auth';
import { databaseService } from '../services/databaseService';

export interface User {
  id: string;
  username: string;
  displayName?: string;
  email: string;
  role: 'user' | 'admin';
  callsign?: string;
  teamName?: string;
  isEmailVerified: boolean;
  isMfaEnabled: boolean;
  linkedProviders: string[];
  points?: number;
  rank?: string;
  discountLevel?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  initialize: () => void;
  sendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  linkGoogle: () => Promise<void>;
  linkApple: () => Promise<void>;
  unlinkProvider: (providerId: string) => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  updateProfile: (data: { callsign?: string; teamName?: string; displayName?: string }) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false,
      login: (token, user) => {
        set({ token, user, isAuthenticated: true });
      },
      logout: async () => {
        await signOut(auth);
        set({ token: null, user: null, isAuthenticated: false });
      },
      refreshProfile: async () => {
        const { user } = get();
        if (!user || !user.id) return;
        try {
          const userData = await databaseService.getUserProfile(user.id);
          if (userData) {
            set((state) => ({
              user: state.user ? {
                ...state.user,
                points: userData.points ?? state.user.points,
                rank: userData.rank ?? state.user.rank,
                discountLevel: userData.discountLevel ?? state.user.discountLevel,
                username: userData.username ?? state.user.username,
                callsign: userData.callsign ?? state.user.callsign,
                teamName: userData.teamName ?? state.user.teamName,
              } : null
            }));
          }
        } catch (error) {
          console.error("AuthStore: Failed to refresh profile:", error);
        }
      },
      initialize: () => {
        onAuthStateChanged(auth, async (firebaseUser) => {
          try {
            if (firebaseUser) {
              const token = await firebaseUser.getIdToken();
              let userData: any = null;
              try {
                userData = await databaseService.getUserProfile(firebaseUser.uid);
              } catch (fsError) {
                console.warn("AuthStore: Could not fetch user profile:", fsError);
              }
              
              const user: User = {
                id: firebaseUser.uid,
                username: userData?.username || firebaseUser.displayName || 'User',
                email: firebaseUser.email || '',
                role: userData?.role === 'admin' ? 'admin' : 'user',
                callsign: userData?.callsign,
                teamName: userData?.teamName,
                isEmailVerified: firebaseUser.emailVerified,
                isMfaEnabled: multiFactor(firebaseUser).enrolledFactors.length > 0,
                linkedProviders: firebaseUser.providerData.map(p => p.providerId),
                points: userData?.points || 0,
                rank: userData?.rank || 'Recruit',
                discountLevel: userData?.discountLevel || 0
              };
              
              set({ user, token, isAuthenticated: true, isInitialized: true });
            } else {
              set({ user: null, token: null, isAuthenticated: false, isInitialized: true });
            }
          } catch (error) {
            console.error("AuthStore initialization error:", error);
            set({ isInitialized: true });
          }
        });
      },
      sendVerificationEmail: async () => {
        if (auth.currentUser) {
          await sendEmailVerification(auth.currentUser);
        }
      },
      resetPassword: async (email: string) => {
        console.log('Attempting to send password reset email to:', email);
        try {
          await sendPasswordResetEmail(auth, email);
          console.log('Password reset email sent successfully');
        } catch (error) {
          console.error('Firebase sendPasswordResetEmail error:', error);
          throw error;
        }
      },
      linkGoogle: async () => {
        if (!auth.currentUser) throw new Error('Not authenticated');
        const provider = new GoogleAuthProvider();
        await linkWithPopup(auth.currentUser, provider);
        // State will be updated by onAuthStateChanged
      },
      linkApple: async () => {
        if (!auth.currentUser) throw new Error('Not authenticated');
        const provider = new OAuthProvider('apple.com');
        await linkWithPopup(auth.currentUser, provider);
        // State will be updated by onAuthStateChanged
      },
      unlinkProvider: async (providerId: string) => {
        if (!auth.currentUser) throw new Error('Not authenticated');
        await unlink(auth.currentUser, providerId);
        // State will be updated by onAuthStateChanged
      },
      deleteAccount: async (password?: string) => {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) throw new Error('Not authenticated');

        // Re-authenticate if password is provided
        if (password && firebaseUser.email) {
          const credential = EmailAuthProvider.credential(firebaseUser.email, password);
          await reauthenticateWithCredential(firebaseUser, credential);
        }

        // Delete from SQL
        try {
          // Add delete user endpoint in server.ts if needed, 
          // but for now we'll just sign out and delete the Auth account.
          // If we want to strictly follow "Remove all interactions with Firestore", 
          // we should NOT use deleteDoc.
        } catch (e) {
          console.error("Failed to delete user data:", e);
        }
        
        // Delete from Auth
        await deleteUser(firebaseUser);
        set({ user: null, token: null, isAuthenticated: false });
      },
      reauthenticate: async (password: string) => {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser || !firebaseUser.email) throw new Error('Not authenticated');
        const credential = EmailAuthProvider.credential(firebaseUser.email, password);
        await reauthenticateWithCredential(firebaseUser, credential);
      },
      updateEmail: async (newEmail: string) => {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) throw new Error('Not authenticated');
        // This requires recent login
        await sendEmailVerification(firebaseUser); // Optional: verify old email? 
        // Firebase updateEmail is deprecated in favor of verifyBeforeUpdateEmail
        // but verifyBeforeUpdateEmail is better for security
        const { verifyBeforeUpdateEmail } = await import('firebase/auth');
        await verifyBeforeUpdateEmail(firebaseUser, newEmail);
      },
      updateProfile: async (data: { callsign?: string; teamName?: string; displayName?: string }) => {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) throw new Error('Not authenticated');

        if (data.displayName) {
          const { updateProfile: updateFirebaseProfile } = await import('firebase/auth');
          await updateFirebaseProfile(firebaseUser, { displayName: data.displayName });
        }

        // Update SQL
        await databaseService.updateProfile(firebaseUser.uid, data);

        // Refresh local state
        const userData = await databaseService.getUserProfile(firebaseUser.uid);
        
        set((state) => ({
          user: state.user ? {
            ...state.user,
            callsign: userData?.callsign || state.user?.callsign,
            teamName: userData?.teamName || state.user?.teamName,
            username: userData?.username || firebaseUser.displayName || state.user?.username,
          } : null
        }));
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
