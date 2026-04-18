## Blob Upload Fix

### Problem
- Uploading product images to Vercel Blob sometimes failed with HTTP `413 Payload Too Large`.
- The failing request was `POST /api/admin/upload?filename=...`.

### Root Cause
- Vercel serverless functions have strict request body limits.
- Large images could exceed the limit before the upload completed.

### Implemented Fix
- Added automatic client-side image compression in `src/services/firebaseService.ts`.
- Images larger than a safe threshold are converted to WebP and reduced in quality until they fit.
- Added a size guard to stop uploads that still exceed the function limit and return a clear error.
- When conversion happens, upload path extension is changed to `.webp`.

### Result
- Large product image uploads no longer hit `413` in normal admin usage.
- Frontend build succeeds after the change.
