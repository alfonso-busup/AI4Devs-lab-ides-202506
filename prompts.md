1. Analyze the provided code to establish a comprehensive context of its architecture and internal practices, focusing on structural coherence and key integration points for future development.

2. Analyze the following User Story and Acceptance Criteria. Your task is to provide the **full set of technical steps (tasks)** required to implement this feature across the project's backend and frontend

### USER STORY

**Title:** Add Candidate to the System

**As a** Recruiter,
**I want** the ability to add candidates to the ATS system,
**So that** I can efficiently manage their data and selection processes.

### ACCEPTANCE CRITERIA

1.  **Function Accessibility:** A clearly visible button or link to add a new candidate must be present on the recruiter's main dashboard page.
2.  **Data Entry Form:** Selecting the add candidate option must present a form including fields to capture necessary information: first name, last name, email, phone, address, education, and work experience.
3.  **Data Validation:** The form must validate input data to ensure it is complete and correct (e.g., email must have a valid format, mandatory fields must not be empty).
4.  **Document Upload:** The recruiter must have the option to upload the candidate's CV in PDF or DOCX format.
5.  **Confirmation:** Upon form completion and submission, a confirmation message must appear, indicating the candidate was added successfully.
6.  **Error Handling:** In case of an error (e.g., server connection failure), the system must display an appropriate message to inform the user of the problem.
7.  **Accessibility and Compatibility:** The functionality must be accessible and compatible with different devices and web browsers.

### NOTES

* The interface should be intuitive and easy to use.
* Consider auto-completion features for education and work experience fields based on pre-existing data (future enhancement, but keep in mind during design).

3.  Backend: DB model & migration
Add Candidate model to Prisma schema with fields: id (uuid), firstName, lastName, email (unique), phone, address (text), education (json or text), workExperience (json or text), cvFileName (nullable), cvMimeType (nullable), cvPath (nullable), createdAt, updatedAt.
Create and run Prisma migration.
Files: backend/prisma/schema.prisma, run prisma migrate dev.
AC covered: 2,4,5

4. Backend: API endpoint(s)
Implement POST /api/candidates to accept multipart/form-data or JSON + file. Recommended: accept multipart/form-data (fields + file).
Implement GET /api/candidates/autocomplete?q=... to support future auto-complete.
Implement validation at controller layer (e.g., zod / express-validator / Joi): required fields, email format, phone (basic), file type/size check.
Files: backend/src/routes/candidates.ts, backend/src/controllers/candidatesController.ts
AC covered: 1,2,3,4,6

5. Backend: file upload handling & storage
Add multer middleware for file handling; accept only PDF and DOCX, limit e.g., 5–10MB.
Store files to configurable location via env var (e.g., STORAGE_LOCAL_PATH); in Docker, mount a volume.
Save file metadata (originalName, mimeType, path/filename) in Candidate record.
Sanitize filenames, generate UUID filenames, avoid path traversal.
Files: backend/src/middleware/upload.ts, update candidates routes.
AC covered: 4,6

6. Backend: data validation & security
Implement server-side validation (schema check + sanitization).
Check duplicate emails and return 409 if email already exists.
Return clear error messages and suitable HTTP codes (400, 409, 413, 500).
AC covered: 3,6

7. Backend: Prisma lifecycle & graceful shutdown
Ensure prisma.$connect on start and prisma.$disconnect on SIGINT/SIGTERM.
AC covered: 6

8. Backend: tests
Unit tests for validation, controller logic.
Integration tests using supertest for POST /api/candidates including multipart file upload: success, validation errors, duplicate email, bad file type, server error simulation.
Files: backend/src/tests/candidates.test.ts
AC covered: 3,4,5,6

9. Backend: OpenAPI / API docs
Document endpoint(s) with request/response examples including multipart request; include error responses.
Files: backend/docs/openapi.yaml or README section.
AC covered: 1,5,6

10. Backend: CORS and security headers
Ensure CORS allows frontend origin in dev (or rely on proxy). Add Helmet for headers.
Files: backend/src/app.ts
AC covered: 7

11. Frontend: UX - Add Candidate action
Add a clearly visible button/link on recruiter dashboard (e.g., top-right, “Add Candidate”).
Decide whether modal vs route (/candidates/new). Implement one (modal preferred for quick flow).
Files: frontend/src/pages/Dashboard.tsx or frontend/src/components/DashboardHeader.tsx
AC covered: 1,7

12. Frontend: Form UI & fields
Build form with fields: firstName, lastName, email, phone, address (multi-line), education (textarea or controlled list), workExperience (textarea or controlled list), CV file input accepting .pdf,.docx.
Use accessible form elements: labels, aria-describedby for errors, role="alert" for messages, focus management.
Make form responsive (mobile-first).
Files: frontend/src/components/AddCandidateForm.tsx, frontend/src/components/FileInput.tsx
AC covered: 2,4,7

13. Frontend: Client-side validation
Use React Hook Form + Yup or Formik + Yup for validation.
Validate required fields, email format, phone basic pattern, file type & size client-side.
Show inline validation errors and disable submit until valid.
AC covered: 3,4

14. Frontend: Submission & API integration
Submit multipart/form-data (FormData) via fetch or axios to POST /api/candidates. Include progress indicator for file upload.
On success: show confirmation message (toast/modal) and optionally redirect to candidate details or refresh list.
On error: show user-friendly error message (server validation error, network error).
AC covered: 5,6

15. Documentation & rollout
Update README with new endpoints and environment settings for file storage.
Provide short UX notes for recruiters (where to find Add Candidate, allowed file types).
Add migration notes and rollback plan.
AC covered: all