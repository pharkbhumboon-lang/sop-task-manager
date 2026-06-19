# Implementation Plan

Reviewed: 2026-06-20

## Release 1: Controlled SOP Execution Core

1. Add organization/location/membership tables and backfill the default portfolio organization.
2. Add SOP versions, approval requests, immutable publication state, and append-only audit events.
3. Add version-pinned workflow runs, step instances, responses, evidence metadata, assignments, and review schedules.
4. Add tenant-aware RLS helper functions and policies for hosted mode.
5. Extend the local SQLite/Express demo with the same core invariants and authorization checks.
6. Add authoring version actions and a mobile-first executor route/view.
7. Add tests for tenant denial, role denial, immutable publication, version pinning, required steps, and audit events.

## Release 2: Operational Automation

1. Recurrence scheduler and idempotency keys.
2. Review reminders and overdue escalation through a configured notification provider.
3. Conditional step logic and corrective-action generation.
4. Change requests linked to draft versions.

## Release 3: Competency and Insights

1. Version-specific training assignments, quizzes, practice runs, and supervisor sign-off.
2. Run/step analytics and location comparison.
3. QR launch, localization, and offline executor queue.

## Release 4: AI With Governance

1. Draft-only SOP generation.
2. Permission-filtered retrieval across published versions only.
3. Audited AI requests with source citations and human approval before publication.

## Migration Recovery Notes

- All Release 1 schema changes are additive.
- Existing SOP rows are backfilled into version `1.0` snapshots before publication rules are enforced.
- Existing portfolio rows are assigned to the default organization and global location.
- Do not drop existing tables or columns during this migration.
- Rollback is performed by disabling new UI routes and policies only after exporting audit/run data; version/run history must not be deleted.

