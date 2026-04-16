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

async function checkData() {
  try {
    const products = await db.collection("products").limit(1).get();
    console.log("Products count:", products.size);
    
    const categories = await db.collection("categories").limit(1).get();
    console.log("Categories count:", categories.size);
  } catch (error: any) {
    console.error("Check failed:", error.message);
  }
}

checkData();
