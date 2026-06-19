# Gap Analysis

Reviewed: 2026-06-20

Status values: **EXISTS**, **PARTIAL**, **MISSING**, **BLOCKED**, **NOT_RECOMMENDED**.

| Requirement | Status | Current files/tables | Required change |
| --- | --- | --- | --- |
| Organization, location, department membership | MISSING | `profiles` only | Add organizations, locations, memberships and tenant keys with backfill migration. |
| Server-enforced role/location authorization | PARTIAL | `server/src/app.js`, permissive Supabase policies | Add local authorization service and Supabase RLS helpers/policies. |
| SOP metadata | PARTIAL | `sops` has governance fields | Add immutable-version metadata, summary, language, scope/location and ownership IDs. |
| Draft, review, approval, publication lifecycle | PARTIAL | `sop_approvals`, `sop_lifecycle_events` | Add version statuses and approval request records. |
| Immutable published version | MISSING | Mutable `sops` row | Add `sop_versions` and publication guards. |
| Version comparison/restore | MISSING | None | Add version snapshots and compare/clone endpoints. |
| Workflow runs pinned to versions | MISSING | Generic `tasks` only | Add runs, step instances, responses, evidence metadata and executor endpoints. |
| Required steps/evidence | MISSING | SOP evidence is document-level | Enforce required step completion before run completion. |
| Protected evidence | MISSING | `evidence_url` text | Use private storage keys and authorization policy. |
| Assignments/recurrence | PARTIAL | Generic task assignment and due date | Add workflow assignments and recurrence schedule records. |
| Review reminders | PARTIAL | Stored review dates and report calculation | Add durable review schedules; notification delivery remains blocked without provider. |
| Conditional logic | MISSING | None | Add version-scoped conditions after execution core. |
| Training and competency | PARTIAL | Acknowledgements only | Add version-scoped assignments, quiz/practice completion and verification. |
| Analytics | PARTIAL | Task and governance report counters | Add run/step event-derived metrics. |
| AI drafting/assistant | NOT_RECOMMENDED | Transformation AI use-case notes | Defer until published-version permissions and audit guarantees exist. |

## Blocking Dependencies

1. Existing Supabase RLS policies must be replaced before hosted tenant-safe writes can be trusted.
2. The local client-to-Supabase CRUD model cannot safely perform privileged publication; publication must be implemented as a security-definer RPC or trusted server boundary.
3. Email/SMS reminder delivery needs a configured provider. This release stores due review state and audit events but does not send external notifications.
4. Browser-direct evidence URLs are not a safe file-storage solution. This release stores authorization-ready metadata; private bucket deployment is documented as a manual Supabase operation.

