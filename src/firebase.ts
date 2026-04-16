import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, EmailAuthProvider, PhoneAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
export const emailProvider = new EmailAuthProvider();
export const phoneProvider = new PhoneAuthProvider(auth);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const storage = getStorage(app);

// Test connection to Firestore
if (typeof window !== 'undefined') {
  const testConnection = async () => {
    try {
      // Try to fetch a non-existent doc just to check connectivity
      await getDocFromServer(doc(db, '_connection_test_', 'ping'));
      console.log("✅ Firebase Connection: Success (Database: " + firebaseConfig.firestoreDatabaseId + ")");
    } catch (error: any) {
      console.warn("⚠️ Firebase Connection Notice:", error.message);
      if (error.message.includes('permission-denied')) {
        console.error("❌ Access Denied: Check if Firestore Rules are deployed to '" + firebaseConfig.firestoreDatabaseId + "'");
      }
    }
  };
  testConnection();
}

export default app;
