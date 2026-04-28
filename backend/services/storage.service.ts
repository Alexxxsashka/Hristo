import { put, del } from "@vercel/blob";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data and models directories exist
const dataDir = path.resolve(process.cwd(), "data");
const modelsDir = process.env.NODE_ENV === "production" 
  ? path.resolve(process.cwd(), "build", "models")
  : path.resolve(process.cwd(), "public", "models");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });

// Multer configuration for local file uploads (fallback/legacy)
const localDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, modelsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

export const uploadLocal = multer({ storage: localDiskStorage });

// Multer configuration for memory storage (for Vercel Blob)
const memoryStorage = multer.memoryStorage();
export const uploadMemory = multer({ storage: memoryStorage });

export const uploadToVercelBlob = async (file: Express.Multer.File, folder: string) => {
  try {
    const filename = `${folder}/${Date.now()}-${file.originalname}`;
    const blob = await put(filename, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
      token: process.env.HR_STORAGE_TOKEN || process.env.hrstorage_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN
    });
    return blob.url;
  } catch (error) {
    console.error("Vercel Blob upload error:", error);
    return null;
  }
};

export const deleteFromVercelBlob = async (url: string) => {
  if (!url || !url.includes('blob.vercel-storage.com')) return;
  try {
    const token = process.env.HR_STORAGE_TOKEN || process.env.hrstorage_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
    await del(url, { token });
    console.log(`[Storage] Deleted: ${url}`);
  } catch (e) {
    console.error(`[Storage] Failed to delete: ${url}`, e);
  }
};
