import React from 'react';
import { auth } from '../../auth';
import { GoogleAuthProvider, OAuthProvider, signInWithPopup, multiFactor } from 'firebase/auth';
import { useAuthStore } from '../../store/authStore';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { databaseService } from '../../services/databaseService';

export const SocialLogin: React.FC = () => {
  const { login } = useAuthStore();
  const [error, setError] = React.useState<string | null>(null);
  const [googleLogo, setGoogleLogo] = React.useState<string>('');

  React.useEffect(() => {
    // Use a reliable CDN for the Google logo instead of missing storage file
    setGoogleLogo('https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg');
  }, []);

  const handleSocialLogin = async (providerName: 'google' | 'apple') => {
    setError(null);
    try {
      const provider = providerName === 'google' 
        ? new GoogleAuthProvider() 
        : new OAuthProvider('apple.com');
      
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const token = await firebaseUser.getIdToken();

      // Sync user to SQL instead of Firestore using PUT (upsert)
      const res = await fetch(`/api/users/${firebaseUser.uid}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: firebaseUser.displayName || 'User',
          email: firebaseUser.email,
          role: 'user'
        })
      });

      let userData = null;
      if (res.ok) {
        userData = await res.json();
      }

      console.log("Login successful, user data synced to SQL");

      login(token, {
        id: firebaseUser.uid,
        username: userData?.username || firebaseUser.displayName || 'User',
        email: firebaseUser.email || '',
        role: userData?.role || 'user',
        isEmailVerified: firebaseUser.emailVerified,
        isMfaEnabled: multiFactor(firebaseUser).enrolledFactors.length > 0,
        linkedProviders: firebaseUser.providerData.map(p => p.providerId)
      });
    } catch (err: any) {
      console.error(`${providerName} Login Error:`, err);
      console.error("Error Code:", err.code);
      console.error("Error Message:", err.message);
      if (err.code === 'auth/operation-not-allowed') {
        setError(`Sign-in method "${providerName}" is not enabled in Firebase Console. Please enable it in Authentication -> Sign-in method.`);
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("This domain is not authorized. Add this URL to 'Authorized domains' in Firebase Console.");
      } else if (err.code === 'auth/firebase-app-check-token-is-invalid') {
        setError("App Check is blocking this request. Please disable App Check enforcement in the Firebase Console or configure the App Check SDK.");
      } else if (err.code === 'auth/internal-error') {
        setError("Internal Auth Error. This often happens if the provider is not configured correctly or App Check is enforced.");
      } else {
        setError(getAuthErrorMessage(err.code));
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-zinc-950 px-2 text-zinc-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleSocialLogin('google')}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white text-black rounded-lg font-bold hover:bg-zinc-200 transition-colors"
        >
          {googleLogo ? (
            <img src={googleLogo} alt="Google" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          Google
        </button>
        <button
          onClick={() => handleSocialLogin('apple')}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 text-white rounded-lg font-bold hover:bg-zinc-800 border border-zinc-800 transition-colors"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512">
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
          </svg>
          Apple
        </button>
      </div>
      {error && <p className="text-red-500 text-xs text-center mt-2">{error}</p>}
    </div>
  );
};
