# SOP Task Manager

Simple internal SOP and task management web app for Phase 1 organization workflows.

## What It Includes

- Dashboard KPI cards for total, in-progress, waiting, completed, overdue, and recent updated tasks
- Project CRUD with owner, department, dates, status, and priority
- Task CRUD with project link, SOP reference, assigned user, status, progress, attachment URL, created/updated dates
- SOP Library CRUD with readable instruction-page view
- Enterprise SOP controls for reviewer, approver, approval status, review cycle, controlled copy location, risk, retention, distribution, and training audience
- Current-level responsibility model from L1 user/staff through L7 auditor, with responsible user, process owner, control owner, reviewer, approver, and auditor fields
- SOP approval evidence and training acknowledgement APIs for audit-ready history
- Process architecture fields for business unit, process group, process name, sub-process, upstream/downstream processes, related policies, controls, and systems
- Control and compliance fields for control objective, frequency, evidence required, risk mitigated, compliance requirement, audit owner, exception handling, and required approvals
- Lifecycle audit events, evidence records, exception records, and governance dashboard metrics
- Transformation Discovery workspace for workflow mapping, pain points, AI use cases, implementation plans, and training needs
- Task comments and activity log history
- Reports for status, priority, department, and overdue tasks
- Settings page with local demo login and SharePoint List mapping placeholder
- SQLite local demo database seeded on first run

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: SQLite using Node's built-in `node:sqlite` for local demo, Supabase Postgres for portfolio deployment
- Hosting: Vercel static Vite build with Supabase Auth and data

Node.js 24 or newer is recommended because the backend uses the built-in SQLite module.

## Setup

From this folder:

```powershell
npm install
```

## Run Live Dev Server

```powershell
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

The API runs at:

```text
http://127.0.0.1:5174
```

## Demo Login

```text
Email: admin@example.com
Password: admin123
```

The current UI shows the seeded user in the shell. The login API exists for Phase 1 local authentication and can be connected to a login screen later.

## Portfolio Deployment: Firebase Hosting + Supabase

The hosted portfolio version runs the Vite frontend on Firebase Hosting and switches the data layer from local Express/SQLite to Supabase Auth + Postgres.

1. Create a Supabase project.
2. Run the SQL migration in `supabase/migrations/20260619000000_portfolio_schema.sql`.
3. Run `supabase/seed.sql` for portfolio demo data.
4. In Supabase Auth, enable Google and Azure providers.
5. Add the Firebase Hosting production URL to the Supabase Auth redirect URLs.
6. Create or select a Firebase project.
7. Add these environment variables before building:

```text
VITE_DATA_BACKEND=supabase
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

`firebase.json` deploys the built Vite app from `client/dist` and rewrites all routes to `/index.html` for the single-page app.

Deploy commands:

```powershell
supabase link --project-ref your-supabase-project-ref
npm run deploy:supabase
firebase use your-firebase-project-id
npm run deploy:firebase
```

Keep `.firebaserc` local unless you want to lock this repo to one Firebase project.

## Alternative Deployment: Vercel + Supabase

The hosted portfolio version runs the Vite frontend on Vercel and switches the data layer from local Express/SQLite to Supabase Auth + Postgres.

1. Create a Supabase project.
2. Run the SQL migration in `supabase/migrations/20260619000000_portfolio_schema.sql`.
3. Run `supabase/seed.sql` for portfolio demo data.
4. In Supabase Auth, enable Google and Azure providers.
5. Add the Vercel production URL to the Supabase Auth redirect URLs.
6. Import this folder as the Vercel project root.
7. Add these Vercel environment variables:

```text
VITE_DATA_BACKEND=supabase
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

`vercel.json` is configured for this monorepo-style folder:

```text
Build Command: npm run build --workspace client
Output Directory: client/dist
Install Command: npm install
```

For local Express/SQLite development, keep `VITE_DATA_BACKEND=local` or omit the variable.

## Database

The local SQLite file is created at:

```text
server/data/sop-task-manager.sqlite
```

To reset sample data, stop the server and delete that file. It will be recreated on the next run.

## Tests And Build

```powershell
npm test
npm run build
npm audit --audit-level=moderate
```

## API Summary

- `GET /api/dashboard`
- `GET /api/projects`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/tasks/:id/comments`
- `GET /api/sops`
- `POST /api/sops`
- `PUT /api/sops/:id`
- `DELETE /api/sops/:id`
- `GET /api/sops/:id/approvals`
- `POST /api/sops/:id/approvals`
- `GET /api/sops/:id/training-acknowledgements`
- `POST /api/sops/:id/training-acknowledgements`
- `GET /api/sops/:id/lifecycle-events`
- `POST /api/sops/:id/lifecycle-events`
- `GET /api/sops/:id/evidence`
- `POST /api/sops/:id/evidence`
- `GET /api/sops/:id/exceptions`
- `POST /api/sops/:id/exceptions`
- `GET /api/sops/:id/governance`
- `GET /api/transformations`
- `POST /api/transformations`
- `GET /api/reports`
- `GET /api/settings`
- `POST /api/login`

## Enterprise SOP Model

The SOP Library now includes a practical controlled-document layer inspired by enterprise SOP guidance:

- EPA QA/G-6 emphasizes SOP identification, purpose, scope, approval signatures, revision history, and document-control practices.
- ISO 9001 documented-information practice emphasizes controlled availability, protection, retention, and suitability before use.
- Regulated quality systems commonly require written procedures to be reviewed, approved, revised under control, and supported by personnel training.

For Phase 1 this is intentionally lightweight: the app stores the control fields, approval records, and training acknowledgements without turning the tool into a full QMS or ERP.

## SharePoint Future Extension

SharePoint integration is prepared as a boundary in:

```text
server/src/sharepointAdapter.js
```

Phase 1 writes to SQLite. A later phase can replace or mirror repository operations with SharePoint List calls while keeping the API shape stable.
