import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId);

async function list() {
  try {
    const collections = await db.listCollections();
    console.log("Collections:", collections.map(c => c.id));
  } catch (error: any) {
    console.error("List failed:", error.message);
  }
}

list();
