import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkData() {
  try {
    const q = query(collection(db, "products"), limit(1));
    const products = await getDocs(q);
    console.log("Products count:", products.size);
  } catch (error: any) {
    console.error("Check failed:", error.message);
  }
}

checkData();
