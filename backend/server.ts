import { app } from './app.js';
import { testConnection } from './services/db.service.js';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PORT = parseInt(process.env.PORT || '3000');

async function startServer() {
  try {
    // 1. Initialize Database
    await testConnection();

    // 2. Vite Integration for Development
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
        root: rootDir
      });
      app.use(vite.middlewares);

      app.get('*', async (req, res, next) => {
        const url = req.originalUrl;
        if (url.startsWith('/api')) return next(); // Let API routes handle it

        try {
          let template = fs.readFileSync(path.resolve(rootDir, 'index.html'), 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e: any) {
          vite.ssrFixStacktrace(e);
          res.status(500).end(e.stack);
        }
      });
    } else {
      // Production setup
      if (!process.env.VERCEL) {
        const distPath = path.resolve(rootDir, 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          if (req.originalUrl.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
          res.sendFile(path.resolve(distPath, 'index.html'));
        });
      }
    }

    // 3. Listen
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Modular Server ready at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

import express from 'express'; // Needed for express.static
startServer();
