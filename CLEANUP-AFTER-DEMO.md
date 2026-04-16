# Post-Demo Cleanup Checklist

Things to revert/secure before going to production or after finishing the demo presentation.

## Cloud SQL (Google Cloud Console > SQL > hristo-airsoft)

### Authorized Networks
- **Remove** the `Allow all (0.0.0.0/0)` network entry
- Keep only specific IPs that need access (e.g. the Cloud Run service IP)
- Path: Connections > Networking > Authorized networks

### Postgres Password
- Change the `postgres` user password to something strong (20+ chars, random)
- Path: Users > three dots next to `postgres` > Change password

## .env File

- Replace `JWT_SECRET=local-dev-secret-change-me-in-production-1234567890` with a real random secret
- Update `DB_PASSWORD` to match the new strong password

## Firebase Storage Rules

- If you set permissive rules (`allow read, write: if true`) during testing, tighten them:
  ```
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      match /{allPaths=**} {
        allow read: if true;
        allow write: if request.auth != null;
      }
    }
  }
  ```

## Code

- The `key.json` service account key is committed in the project root. For production, move it out of the repo and use environment variables or Secret Manager instead.
- The admin seed credentials (`admin@test.com / admin123` in server.ts) should be changed.
