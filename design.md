# SOP Task Manager Design

## Phase 2 Implemented Slice: SOP Knowledge Base

This implementation slice moves the SOP Library from a simple record list into a searchable SOP knowledge base.

Added capabilities:

- Whole-SOP search across title, document type, category, department, purpose, scope, steps, content, owner, status, folder, and tags.
- SOP folders/categories with create support.
- SOP file records for document/image/url attachments.
- Richer SOP document fields:
  - Title
  - Document type
  - Category/folder
  - Status: Draft, Published, Archived
  - Tags
  - URL attachment
  - Image URLs and local image data URL upload
  - Content body in a compose-style editor area
- Every SOP document remains editable.
- Admin users can publish or archive Draft SOPs from the reader.
- The app keeps the dark glass command-center layout while making the SOP page more document-centric.

This slice intentionally does not implement full binary file storage, approval workflows, or SharePoint sync yet. File/image support is stored as URLs or data URLs for the local demo, with the existing SharePoint adapter boundary remaining the future integration point.

## Proposed Style Slice: SOP Deadline Calendar

The next visual slice should add a calendar-style deadline view without changing the current app layout. It should sit inside the existing SOP and task surfaces as a styled panel, using the same dark glass, muted border, compact typography, and lime action color already used by the dashboard.

Purpose:

- Show task deadlines connected to SOP work.
- Help non-technical users see what is due this week or month without reading every task card.
- Make SOP pages feel operational, not just document storage.

Style rules:

- Keep the existing sidebar, page header, card grid, and form layout unchanged.
- Add only component-level styling for the calendar panel and deadline chips.
- Use dark glass panels, subtle borders, compact day cells, and lime highlights for active due dates.
- Use red only for overdue indicators and keep it small.
- Do not introduce a full scheduling product, drag-and-drop planning, or recurring task engine in this slice.

Visual direction:

- Month grid with 7 columns.
- Each day cell has a small date number, then up to two compact task deadline chips.
- Chips show task code, short title, priority, and SOP reference when available.
- Overdue tasks use a thin red outline or red dot, not a large warning block.
- Today uses a soft lime ring.
- Empty days stay quiet so the calendar remains readable.

Example visual language:

```text
┌─────────────────────────────────────────────┐
│ SOP Deadline Calendar        Jun 2026       │
├─────┬─────┬─────┬─────┬─────┬─────┬─────┤
│ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 15  │ 16  │ 17  │ 18  │ 19  │ 20  │ 21  │
│     │     │     │●T002│◎Today│T001 │     │
│     │     │     │SOP1 │      │SOP1 │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

Recommended placement:

- Add it as a calendar panel inside the existing My Tasks page first.
- Add an SOP-specific mini deadline list inside the SOP reader later if needed.
- Do not add a new sidebar navigation item yet.

Acceptance criteria:

- Users can see task due dates by month.
- Deadlines are derived from existing task `dueDate` and `sopId` fields.
- Calendar uses current design tokens and motion classes.
- Local mode and Supabase mode both use the same mapped task data.
- No layout restructuring is required.

## Phase 1 Baseline

Phase 1 is a lightweight internal SOP and task tracker. It proves the core surface:

- Dashboard metrics for total, in-progress, waiting, completed, overdue, and recent tasks.
- Projects, tasks, SOP documents, comments, activity log, reports, settings, and local login.
- React and Tailwind frontend, Express API, SQLite local database.
- SharePoint adapter boundary for future integration.

Phase 1 is useful as a demo, but it is not yet a real ERP workflow module. It records work after humans decide what happened. Phase 2 must help the system decide what should happen next, who is accountable, what evidence is required, and whether the process is compliant.

## Phase 2 Goal

Turn the app into an ERP-grade SOP and task workflow system for real internal operations.

The product should manage controlled procedures, recurring operational work, approvals, evidence, exceptions, responsibilities, escalation, audit trails, and cross-system integration. It should stop being only a task list and become the workflow authority for SOP-driven execution.

## Weakest Assumption

The weakest Phase 1 assumption is that a task status is enough to describe reality.

In real work, "Waiting" is not useful unless the system knows:

- Waiting for whom.
- Waiting for what.
- What dependency blocks the task.
- When escalation should happen.
- Whether evidence is missing.
- Whether the current SOP version is still valid.
- Whether the task can legally or operationally move to the next state.

Phase 2 should replace loose statuses with controlled workflow states, transition rules, required evidence, and accountable roles.

## Main Failure Mode

The main failure mode is creating a prettier task database that still depends on people remembering the process.

If Phase 2 only adds more fields, it will become more complex without becoming more reliable. ERP-grade value comes from control:

- Required approvals before completion.
- Required attachments before submission.
- Automatic recurring tasks from SOP schedules.
- Escalation when work is blocked or late.
- Version-controlled SOP acknowledgement.
- Audit logs that prove who changed what, when, and why.
- Role-based permissions for who can approve, edit, close, or retire a record.

## Recommended Phase 2 Approach

Use a modular ERP workflow core:

1. Controlled SOP lifecycle.
2. Workflow engine for tasks and approvals.
3. Evidence and audit module.
4. Recurring schedule and notification module.
5. Exception and corrective-action module.
6. Integration layer for SharePoint, ERP master data, and identity.
7. Reporting and compliance dashboard.

This is larger than Phase 1, but it is still structured. The system should be built as modules around a shared workflow and audit model, not as one giant form.

## ERP-Grade Workflow Model

### SOP Lifecycle

SOP documents should move through controlled states:

- Draft
- In Review
- Changes Requested
- Approved
- Active
- Retired
- Superseded

Rules:

- Only SOP owners can submit a draft for review.
- Reviewers can approve or request changes.
- A SOP cannot become Active without an approved version.
- A new version supersedes the prior active version.
- Tasks generated from a SOP must store the SOP version used at the time of execution.
- Users assigned to SOP-driven tasks may need to acknowledge the active SOP version before completing related work.

Required SOP fields:

- SOP ID
- Name
- Department
- Process owner
- Document owner
- Reviewer group
- Approver group
- Purpose
- Scope
- Policy references
- Risk category
- Control category
- Step-by-step procedure
- Required evidence
- Related forms/templates
- Effective date
- Review cycle
- Next review date
- Version
- Status
- Retired reason
- Attachment links

### Task Workflow

Tasks should use controlled workflow states:

- Draft
- Ready
- Assigned
- In Progress
- Blocked
- Waiting Approval
- Changes Requested
- Completed
- Closed
- Cancelled

Rules:

- A task cannot move to Ready unless required fields are complete.
- A task cannot move to Completed if required evidence is missing.
- A task that needs approval moves to Waiting Approval before Completed.
- An approver can approve, reject, or request changes.
- A task can be Closed only after completion and any required review.
- Blocked tasks require blocker type, blocker owner, blocker reason, and expected unblock date.

Required task fields:

- Task ID
- Title
- Project
- SOP reference
- SOP version
- Work detail
- Assigned user
- Accountable owner
- Department
- Priority
- Risk level
- Start date
- Due date
- SLA target
- Status
- Progress percent
- Blocked reason
- Blocked by
- Dependency task
- Required evidence checklist
- Attachment records
- Created by
- Created date
- Updated date
- Submitted date
- Approved date
- Closed date

### Project Workflow

Projects should become containers for workflow governance, not just groups of tasks.

Project fields:

- Project ID
- Project name
- Description
- Sponsor
- Owner
- Department
- Start date
- Due date
- Status
- Priority
- Risk level
- Budget code or cost center
- Related ERP object
- Completion criteria
- Approval matrix

Project states:

- Proposed
- Approved
- In Progress
- On Hold
- Completed
- Closed
- Cancelled

### Approval Matrix

Approval should be rule-driven.

Approval rules can be based on:

- Department
- SOP category
- Risk level
- Task type
- Project type
- Amount threshold, reserved for a finance-control release
- User role

Approval records should store:

- Approval step
- Approver user or group
- Decision
- Decision date
- Comment
- Delegated approver, if any
- SLA breached flag

### Evidence Management

ERP-grade SOP work needs evidence, not only comments.

Evidence records should store:

- Evidence ID
- Task ID
- Evidence type
- Required or optional
- File/link
- Uploaded by
- Uploaded date
- Verified by
- Verified date
- Verification status
- Notes

Evidence types:

- Document
- Screenshot
- Spreadsheet
- System export
- Approval email
- Checklist confirmation
- External link

### Exception And CAPA Workflow

Real SOP systems need a path for work that cannot follow procedure.

Exception states:

- Raised
- Under Review
- Accepted
- Rejected
- Corrective Action Required
- Closed

Exception fields:

- Exception ID
- Related task
- Related SOP
- Description
- Root cause
- Risk impact
- Temporary workaround
- Corrective action
- Preventive action
- Owner
- Due date
- Approver
- Status

### Recurring Work

SOPs should generate tasks automatically.

Schedule fields:

- Schedule ID
- SOP ID
- Frequency
- Start date
- End date
- Next run date
- Assigned role or user
- Department
- Due offset
- Evidence template
- Active flag

Examples:

- Daily opening checklist.
- Weekly cash reconciliation.
- Monthly finance close.
- Quarterly user access review.
- Annual policy review.

### Notifications And Escalations

Notifications should be event-driven.

Events:

- New task assigned
- Due soon
- Overdue
- Blocked too long
- Approval waiting
- Changes requested
- SOP version updated
- SOP acknowledgement required
- Exception raised

Escalation rules:

- Notify assignee before due date.
- Notify owner when overdue.
- Notify manager after SLA breach.
- Notify process owner when high-risk exceptions are raised.

## Data Model Additions

New core tables:

- roles
- permissions
- user_roles
- departments
- workflow_definitions
- workflow_states
- workflow_transitions
- approval_rules
- approval_requests
- evidence_requirements
- evidence_records
- sop_versions
- sop_acknowledgements
- task_dependencies
- task_blockers
- recurring_schedules
- notifications
- exception_cases
- audit_events
- integration_jobs

Phase 1 tables can remain, but they should be extended rather than replaced immediately.

## UI Design

Phase 2 should add ERP-grade views:

- Command Center dashboard
- My Work inbox
- Approval inbox
- Blocked work board
- SOP control center
- SOP reader with acknowledgement
- Evidence checklist panel
- Exception/CAPA case page
- Workflow designer or admin rules page
- Audit timeline
- Compliance reports
- Integration monitor

Important UI principle:

Keep each page focused on a job. The system can be powerful, but each user should only see the controls relevant to their role and current workflow state.

## Backend Design

The backend should move away from only direct CRUD routes and add domain services:

- `workflowService`
- `approvalService`
- `sopVersionService`
- `evidenceService`
- `recurrenceService`
- `notificationService`
- `exceptionService`
- `auditService`
- `integrationService`

Every state-changing action should pass through services that:

1. Validate permissions.
2. Validate workflow transition rules.
3. Validate required fields and evidence.
4. Write the data change.
5. Write an audit event.
6. Trigger notifications or integration jobs.

## Integration Design

Phase 2 should prepare these integration boundaries:

- Identity provider: users, groups, roles.
- SharePoint Lists: SOP documents, attachments, comments, and evidence.
- ERP master data: departments, cost centers, vendors, employees, inventory, locations.
- Email or Teams: notifications and approvals.
- File storage: evidence and SOP attachments.

The first real integration should be SharePoint because Phase 1 already created the adapter boundary.

## Reporting Design

ERP-grade reporting should answer:

- Which SOPs are expired or due for review?
- Which tasks missed SLA?
- Which departments have the most blocked work?
- Which users have pending approvals?
- Which SOP versions were used for completed tasks?
- Which tasks were completed without required evidence?
- Which exceptions are open?
- Which recurring tasks failed to generate?

Report export is outside the first Phase 2 implementation slice. The first Phase 2 reporting target is dashboard views and API endpoints.

## Testing And Verification

Phase 2 should require tests for:

- Workflow transitions.
- Permission checks.
- Approval routing.
- Evidence requirements.
- SOP versioning.
- Recurring task generation.
- Notification creation.
- Audit event creation.
- Exception workflow.
- Migration from Phase 1 records.

No workflow rule should exist only in frontend code. Backend tests should prove the rule.

## Suggested Phase 2 Release Slices

### Slice 1: Workflow And Audit Core

- Workflow states and transitions.
- Audit events for all task and SOP changes.
- Backend transition validation.
- UI timeline.

### Slice 2: Approvals And Evidence

- Approval requests.
- Approval inbox.
- Required evidence checklist.
- Evidence upload/link records.
- Completion blocked until required evidence is satisfied.

### Slice 3: SOP Versioning And Acknowledgement

- SOP version history.
- Active/superseded versions.
- User acknowledgements.
- Task stores SOP version at creation time.

### Slice 4: Blockers, Dependencies, And Escalations

- Dependency tasks.
- Blocker records.
- Escalation dashboard.
- Notification records.

### Slice 5: Recurring Work And Exceptions

- Recurring schedules.
- Generated task instances.
- Exception/CAPA workflow.
- Compliance reports.

### Slice 6: SharePoint And ERP Integration Prep

- SharePoint list mapping.
- Integration job logs.
- Import/export sync strategy.
- ERP master-data reference tables.

## Acceptance Criteria

Phase 2 design is ready when:

- The workflow states and transition rules are explicit.
- The system can prove who did what, when, and why.
- SOP versioning and acknowledgement are defined.
- Tasks cannot be completed without required evidence when evidence is required.
- Approvals are role/rule-driven, not just comments.
- Recurring work can be generated from SOP schedules.
- Exceptions have their own lifecycle.
- Integration boundaries are clear enough to implement without rewriting the app.
- The implementation can be split into testable release slices.

## Recommendation

Build Phase 2 as "SOP Workflow Control", not as "more task fields".

The first implementation plan should focus on Slice 1 and Slice 2 together only if the scope stays manageable. If implementation risk feels high, start with Slice 1 alone: workflow transitions plus audit events. That gives the system a real ERP backbone before adding approvals, evidence, and recurrence.
