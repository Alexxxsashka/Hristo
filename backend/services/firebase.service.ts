import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase Config
const authConfigPath = path.resolve(process.cwd(), 'auth-config.json');
let firebaseConfig: any = {};
if (fs.existsSync(authConfigPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(authConfigPath, 'utf-8'));
}

let db: any = null;
let bucket: any = null;

const initializeFirebase = () => {
  if (!firebaseConfig.projectId) return;

  try {
    let credential;
    const keyPath = path.resolve(process.cwd(), 'key.json');

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
    } else if (fs.existsSync(keyPath)) {
      credential = admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, 'utf-8')));
    } else {
      try {
        credential = admin.credential.applicationDefault();
      } catch (e) {
        credential = null;
      }
    }

    const initOptions: any = {
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket || `${firebaseConfig.projectId}.firebasestorage.app`
    };
    if (credential) initOptions.credential = credential;

    if (admin.apps.length === 0) {
      const adminApp = admin.initializeApp(initOptions);
      db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId || '(default)');
      bucket = admin.storage().bucket();
    } else {
      db = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId || '(default)');
      bucket = admin.storage().bucket();
    }
    
    console.log("✅ Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error);
  }
};

initializeFirebase();

export { admin, db, bucket };
