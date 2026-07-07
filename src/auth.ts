import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, EmailAuthProvider, PhoneAuthProvider } from 'firebase/auth';
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCdZBH8bIH__r0Hcd_j86YcK9mxAhuaU3A",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hristo-ec3b1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hristo-ec3b1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hristo-ec3b1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "751250018127",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:751250018127:web:490333ffc29812a2c1ff3a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-6L57QW19Q4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
export const emailProvider = new EmailAuthProvider();
export const phoneProvider = new PhoneAuthProvider(auth);

export default app;
