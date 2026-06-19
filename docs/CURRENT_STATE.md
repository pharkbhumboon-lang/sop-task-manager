# Current State

Reviewed: 2026-06-20

## Stack

- **Frontend:** React 18, Vite 8, Tailwind CSS 3, Iconify Solar icons.
- **Local API:** Express 4 with Node 24 `node:sqlite`.
- **Hosted data:** Supabase Postgres accessed directly from the browser through `@supabase/supabase-js`.
- **Authentication:** Supabase Auth email/password in the hosted build; local seeded email/password login in the Express demo.
- **Authorization:** Local mode gates a small number of actions by `x-user-id`. Hosted mode relies on Supabase RLS, but the current policies are permissive.
- **Tenant model:** None. Profiles have role and department only; there is no organization or location scoping.
- **Storage:** URL/data-URL fields only. There is no protected object-storage bucket or evidence download authorization.
- **Background jobs:** None. Review/reminder calculations are queried on demand.
- **Tests:** Node's built-in test runner; server API tests plus client source/unit tests. No typecheck, lint, E2E, or CI workflow.
- **Deployment:** Vercel static Vite deployment and Supabase. Firebase config also exists as an alternative hosting target.

## Existing Domain Support

| Area | Current support | Key files |
| --- | --- | --- |
| SOP documents | Single mutable `sops` record with enterprise metadata | `server/src/db.js`, `client/src/App.jsx`, `supabase/migrations/20260619000000_portfolio_schema.sql` |
| Approval evidence | Append-only approval rows, not an approval state machine | `sop_approvals`, `sop_lifecycle_events` |
| Training acknowledgement | Basic acknowledgement rows | `sop_training_acknowledgements` |
| Evidence and exceptions | URL-based records attached to SOPs | `sop_evidence`, `sop_exceptions` |
| Tasks | Generic project tasks optionally referencing an SOP | `tasks`, `task_comments`, `activity_logs` |
| Workflow runs | Missing | None |
| Versions and immutable publication | Missing; published SOP rows remain updateable | `sops` CRUD routes and permissive Supabase update policy |
| Organizations and locations | Missing | None |
| Audit | Task activity plus SOP lifecycle rows; no common immutable audit ledger | `activity_logs`, `sop_lifecycle_events` |

## Production-Sensitive Findings

- The existing Supabase migration enables RLS but gives every authenticated user full CRUD access through `using (true)` / `with check (true)` policies.
- Hosted CRUD is sent directly from the browser to Supabase. A protected evidence feature requires RLS-aware tables and private storage rather than public URLs.
- Local SQLite data is seeded and should be backfilled non-destructively before adding workflow/version invariants.
- The existing `sops` table must remain readable for current UI and historic portfolio data while versioned records are introduced.

