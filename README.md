# LTI - Sistema de Seguimiento de Talento

This project is a full‑stack app (React frontend + Express + Prisma backend). This README has been extended with API, storage, UX and migration notes related to the "Add Candidate" feature.

## Quick start

- Frontend: [frontend](frontend/)
  - Dev: cd frontend && npm install && npm start
- Backend: [backend](backend/)
  - Dev: cd backend && npm install && npm run dev
- Database (Postgres): docker-compose.yml (service `db`) — run docker-compose up -d

## New API (Candidates)

- POST /api/candidates — create a candidate (fields + optional CV upload)
  - Implemented at: [`/api/candidates` routes](backend/src/routes/candidates.ts) and handled by controller [`createCandidate`](backend/src/controllers/candidatesController.ts).
  - Accepts multipart/form-data (preferred) or JSON (no file).
  - Validates required fields, email format, phone, file type & size.
  - Returns:
    - 201 Created + created record
    - 400 Validation or upload error
    - 409 Duplicate email
    - 413 Payload too large (file exceeds configured limit)
    - 500 Internal server error
  - API docs/spec: [backend/docs/openapi.yaml](backend/docs/openapi.yaml)

- GET /api/candidates/autocomplete?q=term — autocomplete helper
  - Implemented at: [`autocompleteCandidates`](backend/src/controllers/candidatesController.ts)

Files:
- Router: [backend/src/routes/candidates.ts](backend/src/routes/candidates.ts)
- Controller: [backend/src/controllers/candidatesController.ts](backend/src/controllers/candidatesController.ts)
- Upload middleware: [backend/src/middleware/upload.ts](backend/src/middleware/upload.ts)

## File storage & environment variables

- Configurable via environment variables (see [backend/.env](backend/.env)):
  - STORAGE_LOCAL_PATH — local directory to store uploaded CVs (default: `./backend/uploads`)
  - STORAGE_MAX_FILE_SIZE_MB — max file size in MB (default: `5`)
  - FRONTEND_ORIGIN — allowed CORS origin in dev (default: `http://localhost:3000`)
- Upload policy:
  - Allowed types: PDF / DOC / DOCX (see [`upload` middleware](backend/src/middleware/upload.ts))
  - Filenames are sanitized and replaced by UUID names to avoid traversal/collisions.
- When running backend in Docker, mount STORAGE_LOCAL_PATH as a volume to persist files.

## UX notes for recruiters

- "Add Candidate" button is on the recruiter dashboard header (top-right):
  - Frontend component: [frontend/src/components/DashboardHeader.tsx](frontend/src/components/DashboardHeader.tsx)
  - Opens a modal with accessible, responsive form: [frontend/src/components/NewCandidateModal.tsx](frontend/src/components/NewCandidateModal.tsx)
  - The accessible form component with client-side validation is at: [frontend/src/components/AddCandidateForm.tsx](frontend/src/components/AddCandidateForm.tsx)
- Allowed CV file types: .pdf, .doc, .docx; max size controlled by STORAGE_MAX_FILE_SIZE_MB
- On success: confirmation message shown in UI; parent callback `onSuccess` can refresh candidate list or navigate to details
- On error: user-friendly messages for validation, duplicate email and upload issues

## Migration & rollback (DB)

Prisma schema is at: [backend/prisma/schema.prisma](backend/prisma/schema.prisma).
A migration adding the Candidate model exists in: [backend/prisma/migrations/20251118195350_add_candidate_model](backend/prisma/migrations/20251118195350_add_candidate_model).

Apply migration (development):
```sh
# from repository root
cd backend
# ensure DATABASE_URL points to your dev DB (see backend/.env)
npx prisma migrate dev --name add_candidate_model
```

Notes:
- `prisma migrate dev` creates a new migration and updates your local DB. Use only on development/test databases.
- For production use `prisma migrate deploy` after preparing and reviewing migrations.

Rollback / recovery options:
- Development/test:
  - `npx prisma migrate reset` — resets local DB and reapplies migrations (destroys data). Use only when safe.
- To undo a committed migration:
  - Revert the migration commit in git (git revert) and then run `npx prisma migrate deploy` / reapply migrations against the target DB, or restore DB from backup.
- Best practice:
  - Always take a DB backup before applying production migrations.
  - Test migrations locally and in staging before production deploy.

Reference migration SQL: [backend/prisma/migrations/20251118195350_add_candidate_model/migration.sql](backend/prisma/migrations/20251118195350_add_candidate_model/migration.sql)

## Testing

- Backend integration/unit tests (Jest + Supertest) are in: [backend/src/tests/](backend/src/tests/)
- Frontend tests (React Testing Library) are in: [frontend/src/tests/](frontend/src/tests/)

## Security & lifecycle

- CORS and security headers are applied in app bootstrap: [backend/src/app.ts](backend/src/app.ts)
- Prisma lifecycle (connect/disconnect + graceful shutdown) managed in: [backend/src/index.ts](backend/src/index.ts)
- Uploads are ignored in git via .gitignore (see project root .gitignore)

## Useful links (workspace)
- Backend app: [backend/src/app.ts](backend/src/app.ts)  
- Server bootstrap: [backend/src/index.ts](backend/src/index.ts)  
- Candidates router: [backend/src/routes/candidates.ts](backend/src/routes/candidates.ts)  
- Upload middleware: [backend/src/middleware/upload.ts](backend/src/middleware/upload.ts)  
- Controller: [`createCandidate`](backend/src/controllers/candidatesController.ts) — [backend/src/controllers/candidatesController.ts](backend/src/controllers/candidatesController.ts)  
- OpenAPI: [backend/docs/openapi.yaml](backend/docs/openapi.yaml)  
- Prisma schema: [backend/prisma/schema.prisma](backend/prisma/schema.prisma)

## Rollout checklist

1. Ensure migrations tested locally and in staging.
2. Backup production DB.
3. Deploy backend with STORAGE_LOCAL_PATH mounted (or cloud storage configured).
4. Run migrations on production (prisma migrate deploy).
5. Monitor logs for upload errors, duplicate email conflicts and validation issues.
6. Communicate to recruiters: Add Candidate is available on dashboard, CV formats allowed and size limit.

If you want, I can create a small `docs/DEPLOYMENT.md` with step-by-step commands and a sample `docker-compose.override.yml` for mounting the uploads folder.