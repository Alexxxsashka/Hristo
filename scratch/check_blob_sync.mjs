import pg from 'pg';
import { list } from '@vercel/blob';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const blobToken = process.env.HR_STORAGE_TOKEN;

if (!connectionString || !blobToken) {
    console.error('DATABASE_URL or HR_STORAGE_TOKEN is missing');
    process.exit(1);
}

const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function checkSync() {
    try {
        console.log('--- FETCHING DATABASE URLs ---');
        
        const products = await pool.query("SELECT id, name, image_url, images, model_3d_url FROM products");
        const categories = await pool.query("SELECT id, name, image_url FROM categories");
        const posts = await pool.query("SELECT id, title, image_url FROM blog_posts");

        const dbUrls = new Set();
        const externalUrls = [];
        const urlToDetails = new Map();

        const addUrl = (url, type, id, name) => {
            if (!url) return;
            if (url.includes('blob.vercel-storage.com')) {
                dbUrls.add(url);
                if (!urlToDetails.has(url)) {
                    urlToDetails.set(url, []);
                }
                urlToDetails.get(url).push({ type, id, name });
            } else if (url.startsWith('http')) {
                externalUrls.push({ url, type, id, name });
            }
        };

        products.rows.forEach(p => {
            addUrl(p.image_url, 'product-image', p.id, p.name);
            addUrl(p.model_3d_url, 'product-model', p.id, p.name);
            if (p.images) {
                const images = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
                if (Array.isArray(images)) {
                    images.forEach(img => addUrl(img, 'product-gallery', p.id, p.name));
                }
            }
        });

        categories.rows.forEach(c => {
            addUrl(c.image_url, 'category-image', c.id, c.name);
        });

        posts.rows.forEach(p => {
            addUrl(p.image_url, 'blog-image', p.id, p.title);
        });

        console.log(`Found ${dbUrls.size} unique blob URLs in the database.`);

        console.log('\n--- FETCHING BLOB STORE CONTENT ---');
        const { blobs } = await list({ token: blobToken });
        const blobUrls = new Set(blobs.map(b => b.url));
        console.log(`Found ${blobUrls.size} blobs in the storage.`);

        console.log('\n--- ANALYSIS ---');

        const orphans = [];
        blobs.forEach(b => {
            if (!dbUrls.has(b.url)) {
                orphans.push(b);
            }
        });

        const broken = [];
        dbUrls.forEach(url => {
            if (!blobUrls.has(url)) {
                broken.push(url);
            }
        });

        console.log(`\nOrphaned Blobs (in store but NOT in DB): ${orphans.length}`);
        if (orphans.length > 0) {
            orphans.slice(0, 10).forEach(o => console.log(` - ${o.url} (${o.size} bytes)`));
            if (orphans.length > 10) console.log(` ... and ${orphans.length - 10} more`);
        }

        console.log(`\nExternal URLs (not in Blob store): ${externalUrls.length}`);
        if (externalUrls.length > 0) {
            externalUrls.slice(0, 10).forEach(e => console.log(` - ${e.url} (Used as ${e.type} by ${e.id})`));
            if (externalUrls.length > 10) console.log(` ... and ${externalUrls.length - 10} more`);
        }

    } catch (e) {
        console.error('Error during sync check:', e);
    } finally {
        await pool.end();
    }
}

checkSync();
