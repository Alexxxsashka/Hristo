import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfigPath = path.join(__dirname, "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function testClientRead() {
  console.log(`Testing client-side read from database: ${firebaseConfig.firestoreDatabaseId}`);
  try {
    const docRef = doc(db, 'products', 'test');
    await getDoc(docRef);
    console.log("✅ Client-side read call finished (might be empty but no permission error)");
  } catch (error: any) {
    console.error("❌ Client-side read failed:", error.message);
  }
}

testClientRead();
