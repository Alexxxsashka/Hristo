## Vercel-Only Storage and Database Notes

### Target Architecture
- Auth: Firebase Auth only.
- Database: Vercel Neon (`DATABASE_URL`).
- File Storage: Vercel Blob.

### What Was Removed
- Firebase Storage usage from `src/services/firebaseService.ts`.
- Firebase Storage initialization/export from `src/firebase.ts`.
- Admin text references to Google Cloud/Firebase Storage in `src/components/admin/MediaManager.tsx`.

### Database Safety Guard
- Added a startup guard in `api/index.ts`:
  - If `DATABASE_URL` (or supported fallback var) is missing, API returns a clear configuration error.
  - This prevents silently connecting to an unintended database and showing empty data.

### Required Vercel Environment Variables
- `DATABASE_URL` (recommended) or `POSTGRES_URL`
- `BLOB_READ_WRITE_TOKEN` (or `hrstorage_READ_WRITE_TOKEN`)
- `JWT_SECRET`
- Optional: `ADMIN_EMAILS` for Firebase token admin fallback
