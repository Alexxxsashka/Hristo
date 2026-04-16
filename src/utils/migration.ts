import { db } from "../firebase";
import { collection, doc, writeBatch } from "firebase/firestore";

export async function migrateData() {
  const collections = [
    { url: "/api/products", name: "products" },
    { url: "/api/categories", name: "categories" },
    { url: "/api/blog", name: "blog_posts" },
    { url: "/api/policies", name: "policies" },
    { url: "/api/users", name: "users" },
  ];

  for (const item of collections) {
    try {
      console.log(`Fetching ${item.name}...`);
      const response = await fetch(item.url);
      let data = await response.json();
      
      // Handle blog response structure
      if (item.name === "blog_posts" && data.posts) {
        data = data.posts;
      }

      if (!Array.isArray(data)) {
        console.warn(`Data for ${item.name} is not an array:`, data);
        continue;
      }

      console.log(`Migrating ${data.length} items to ${item.name}...`);
      const batch = writeBatch(db);
      
      data.forEach((docData: any) => {
        const docId = docData.id || docData.uid || undefined;
        const docRef = docId ? doc(db, item.name, String(docId)) : doc(collection(db, item.name));
        batch.set(docRef, docData);
      });

      await batch.commit();
      console.log(`Successfully migrated ${item.name}`);
    } catch (error) {
      console.error(`Failed to migrate ${item.name}:`, error);
    }
  }
  
  console.log("Migration finished!");
}
