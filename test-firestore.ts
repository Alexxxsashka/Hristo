import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfigPath = path.join(__dirname, "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));

if (!firebaseConfig.projectId) {
  console.error("No project ID found");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = getFirestore(firebaseConfig.firestoreDatabaseId || '(default)');

async function testWrite() {
  console.log(`Testing write to database: ${firebaseConfig.firestoreDatabaseId || '(default)'}`);
  try {
    const testRef = db.collection('_connection_test_').doc('ping');
    await testRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      message: "Server-side test write"
    });
    console.log("✅ Server-side write successful!");
    
    const doc = await testRef.get();
    console.log("✅ Server-side read successful:", doc.data());
  } catch (error: any) {
    console.error("❌ Server-side operation failed:", error.message);
  }
}

testWrite();
