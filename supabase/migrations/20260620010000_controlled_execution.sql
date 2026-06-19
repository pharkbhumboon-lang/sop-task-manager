-- Controlled SOP execution core. This migration is additive and backfills the
-- existing portfolio data into one default organization before RLS is tightened.

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'Asia/Bangkok',
  default_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.organizations (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Portfolio Organization', 'portfolio')
on conflict (id) do nothing;

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text not null,
  timezone text not null default 'Asia/Bangkok',
  is_active boolean not null default true,
  unique (organization_id, code)
);

insert into public.locations (id, organization_id, name, code)
values ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Global', 'GLOBAL')
on conflict (id) do nothing;

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('Admin', 'Process Owner', 'Author', 'Approver', 'Supervisor', 'Executor', 'Viewer', 'Auditor')),
  department text not null default 'Operations',
  location_id uuid references public.locations(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

alter table public.profiles add column if not exists organization_id uuid references public.organizations(id);
alter table public.profiles add column if not exists default_location_id uuid references public.locations(id);
alter table public.profiles alter column organization_id set default '00000000-0000-0000-0000-000000000001';
alter table public.profiles alter column default_location_id set default '00000000-0000-0000-0000-000000000002';
update public.profiles set organization_id = '00000000-0000-0000-0000-000000000001' where organization_id is null;
update public.profiles set default_location_id = '00000000-0000-0000-0000-000000000002' where default_location_id is null;

insert into public.memberships (organization_id, user_id, role, department, location_id)
select
  '00000000-0000-0000-0000-000000000001',
  id,
  case role
    when 'Admin' then 'Admin'
    when 'Manager' then 'Supervisor'
    else 'Executor'
  end,
  department,
  '00000000-0000-0000-0000-000000000002'
from public.profiles
on conflict (organization_id, user_id) do nothing;

create or replace function public.create_profile_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.memberships (organization_id, user_id, role, department, location_id)
  values (
    coalesce(new.organization_id, '00000000-0000-0000-0000-000000000001'),
    new.id,
    case new.role when 'Admin' then 'Admin' when 'Manager' then 'Supervisor' else 'Executor' end,
    new.department,
    coalesce(new.default_location_id, '00000000-0000-0000-0000-000000000002')
  )
  on conflict (organization_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_profile_membership on public.profiles;
create trigger create_profile_membership after insert on public.profiles
for each row execute function public.create_profile_membership();

create or replace function public.current_membership_role(target_organization_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.memberships
  where organization_id = target_organization_id
    and user_id = auth.uid()
    and is_active
  limit 1;
$$;

create or replace function public.can_read_organization(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where organization_id = target_organization_id
      and user_id = auth.uid()
      and is_active
  );
$$;

create or replace function public.can_mutate_sop(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_membership_role(target_organization_id) in ('Admin', 'Process Owner', 'Author');
$$;

create or replace function public.can_approve_sop(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_membership_role(target_organization_id) in ('Admin', 'Approver');
$$;

create or replace function public.can_execute_run(target_organization_id uuid, target_assignee uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = target_assignee
    or public.current_membership_role(target_organization_id) in ('Admin', 'Supervisor');
$$;

alter table public.sops add column if not exists organization_id uuid references public.organizations(id);
alter table public.sops add column if not exists location_id uuid references public.locations(id);
alter table public.projects add column if not exists organization_id uuid references public.organizations(id);
alter table public.tasks add column if not exists organization_id uuid references public.organizations(id);
alter table public.sop_folders add column if not exists organization_id uuid references public.organizations(id);
alter table public.transformations add column if not exists organization_id uuid references public.organizations(id);
alter table public.sops alter column organization_id set default '00000000-0000-0000-0000-000000000001';
alter table public.projects alter column organization_id set default '00000000-0000-0000-0000-000000000001';
alter table public.tasks alter column organization_id set default '00000000-0000-0000-0000-000000000001';
alter table public.sop_folders alter column organization_id set default '00000000-0000-0000-0000-000000000001';
alter table public.transformations alter column organization_id set default '00000000-0000-0000-0000-000000000001';

update public.sops set organization_id = '00000000-0000-0000-0000-000000000001' where organization_id is null;
update public.projects set organization_id = '00000000-0000-0000-0000-000000000001' where organization_id is null;
update public.tasks set organization_id = '00000000-0000-0000-0000-000000000001' where organization_id is null;
update public.sop_folders set organization_id = '00000000-0000-0000-0000-000000000001' where organization_id is null;
update public.transformations set organization_id = '00000000-0000-0000-0000-000000000001' where organization_id is null;

create or replace function public.can_read_sop(target_sop_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_read_organization(organization_id) from public.sops where id = target_sop_id;
$$;

create or replace function public.can_mutate_task(target_task_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_membership_role(organization_id) in ('Admin', 'Supervisor') from public.tasks where id = target_task_id;
$$;

create table if not exists public.sop_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sop_id bigint not null references public.sops(id) on delete cascade,
  version_number text not null,
  status text not null check (status in ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'SUPERSEDED', 'ARCHIVED')) default 'DRAFT',
  content_snapshot jsonb not null,
  change_summary text not null default '',
  change_reason text not null default '',
  based_on_version_id uuid references public.sop_versions(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz,
  approved_at timestamptz,
  published_at timestamptz,
  effective_at timestamptz,
  created_at timestamptz not null default now(),
  unique (sop_id, version_number)
);

insert into public.sop_versions (organization_id, sop_id, version_number, status, content_snapshot, change_summary, change_reason, published_at, effective_at)
select
  coalesce(organization_id, '00000000-0000-0000-0000-000000000001'),
  id,
  coalesce(nullif(version, ''), '1.0'),
  case when status in ('Published', 'Active') then 'PUBLISHED' else 'DRAFT' end,
  to_jsonb(sops),
  change_summary,
  change_reason,
  case when status in ('Published', 'Active') then created_date else null end,
  effective_date::timestamptz
from public.sops
on conflict (sop_id, version_number) do nothing;

alter table public.sops add column if not exists current_published_version_id uuid references public.sop_versions(id);
update public.sops s set current_published_version_id = v.id
from public.sop_versions v
where v.sop_id = s.id and v.status = 'PUBLISHED' and s.current_published_version_id is null;

create table if not exists public.sop_steps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sop_version_id uuid not null references public.sop_versions(id) on delete cascade,
  step_type text not null default 'instruction',
  title text not null,
  instructions text not null default '',
  is_required boolean not null default false,
  requires_approval boolean not null default false,
  configuration jsonb not null default '{}'::jsonb,
  sort_order integer not null,
  unique (sop_version_id, sort_order)
);

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sop_version_id uuid not null references public.sop_versions(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  assigned_approver_id uuid references auth.users(id) on delete set null,
  status text not null check (status in ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')) default 'PENDING',
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decision_comment text not null default ''
);

create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sop_id bigint not null references public.sops(id) on delete restrict,
  sop_version_id uuid not null references public.sop_versions(id) on delete restrict,
  location_id uuid references public.locations(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  supervisor_id uuid references auth.users(id) on delete set null,
  status text not null check (status in ('SCHEDULED', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED', 'CANCELLED')) default 'SCHEDULED',
  scheduled_at timestamptz,
  due_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  verified_at timestamptz,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_step_instances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workflow_run_id uuid not null references public.workflow_runs(id) on delete cascade,
  sop_step_id uuid references public.sop_steps(id) on delete set null,
  step_definition_snapshot jsonb not null,
  sort_order integer not null,
  status text not null check (status in ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED')) default 'PENDING',
  is_required_snapshot boolean not null default false,
  skipped_reason text not null default '',
  failure_reason text not null default '',
  completed_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  unique (workflow_run_id, sort_order)
);

create table if not exists public.workflow_step_responses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workflow_step_instance_id uuid not null references public.workflow_step_instances(id) on delete cascade,
  response_type text not null,
  value jsonb not null default '{}'::jsonb,
  submitted_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz not null default now()
);

create table if not exists public.workflow_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workflow_run_id uuid not null references public.workflow_runs(id) on delete cascade,
  workflow_step_instance_id uuid references public.workflow_step_instances(id) on delete cascade,
  storage_key text not null,
  file_name text not null,
  mime_type text not null,
  file_size bigint not null default 0,
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  unique (organization_id, storage_key)
);

create table if not exists public.workflow_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workflow_run_id uuid not null references public.workflow_runs(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  reason text not null default ''
);

create table if not exists public.review_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sop_id bigint not null references public.sops(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete set null,
  review_due_at timestamptz not null,
  status text not null check (status in ('CURRENT', 'DUE_SOON', 'OVERDUE', 'COMPLETED')) default 'CURRENT',
  completed_at timestamptz
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id text not null,
  event_type text not null,
  previous_values jsonb not null default '{}'::jsonb,
  new_values jsonb not null default '{}'::jsonb,
  reason text not null default '',
  request_id uuid,
  created_at timestamptz not null default now()
);

create or replace function public.prevent_published_version_mutation()
returns trigger language plpgsql as $$
begin
  if old.status = 'PUBLISHED' then
    raise exception 'published SOP versions are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_published_version_mutation on public.sop_versions;
create trigger prevent_published_version_mutation before update or delete on public.sop_versions
for each row execute function public.prevent_published_version_mutation();

create or replace function public.prevent_workflow_run_version_change()
returns trigger language plpgsql as $$
begin
  if new.sop_version_id is distinct from old.sop_version_id then
    raise exception 'workflow run SOP version cannot change after creation';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_workflow_run_version_change on public.workflow_runs;
create trigger prevent_workflow_run_version_change before update on public.workflow_runs
for each row execute function public.prevent_workflow_run_version_change();

create or replace function public.ensure_required_steps_completed()
returns trigger language plpgsql as $$
begin
  if new.status in ('AWAITING_REVIEW', 'COMPLETED') and exists (
    select 1 from public.workflow_step_instances
    where workflow_run_id = new.id
      and is_required_snapshot
      and status <> 'COMPLETED'
  ) then
    raise exception 'required step responses are incomplete';
  end if;
  return new;
end;
$$;

drop trigger if exists ensure_required_steps_completed on public.workflow_runs;
create trigger ensure_required_steps_completed before update on public.workflow_runs
for each row execute function public.ensure_required_steps_completed();

create index if not exists memberships_org_user_idx on public.memberships (organization_id, user_id) where is_active;
create index if not exists sops_organization_updated_idx on public.sops (organization_id, updated_date desc);
create index if not exists sop_versions_org_sop_idx on public.sop_versions (organization_id, sop_id, created_at desc);
create index if not exists workflow_runs_org_assignee_status_idx on public.workflow_runs (organization_id, assigned_to, status, due_at);
create index if not exists workflow_step_instances_run_idx on public.workflow_step_instances (workflow_run_id, sort_order);
create index if not exists audit_events_org_entity_idx on public.audit_events (organization_id, entity_type, entity_id, created_at desc);
create index if not exists review_schedules_org_due_idx on public.review_schedules (organization_id, review_due_at);

alter table public.organizations enable row level security;
alter table public.locations enable row level security;
alter table public.memberships enable row level security;
alter table public.sop_versions enable row level security;
alter table public.sop_steps enable row level security;
alter table public.approval_requests enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.workflow_step_instances enable row level security;
alter table public.workflow_step_responses enable row level security;
alter table public.workflow_evidence enable row level security;
alter table public.workflow_assignments enable row level security;
alter table public.review_schedules enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists "sops portfolio crud" on public.sops;
drop policy if exists "projects portfolio crud" on public.projects;
drop policy if exists "tasks portfolio crud" on public.tasks;
drop policy if exists "sop folders portfolio crud" on public.sop_folders;
drop policy if exists "transformations portfolio crud" on public.transformations;
drop policy if exists "profiles read authenticated" on public.profiles;
drop policy if exists "profiles insert own row" on public.profiles;
drop policy if exists "profiles update own row" on public.profiles;
drop policy if exists "sop files portfolio crud" on public.sop_files;
drop policy if exists "sop approvals portfolio crud" on public.sop_approvals;
drop policy if exists "sop training portfolio crud" on public.sop_training_acknowledgements;
drop policy if exists "sop lifecycle portfolio crud" on public.sop_lifecycle_events;
drop policy if exists "sop evidence portfolio crud" on public.sop_evidence;
drop policy if exists "sop exceptions portfolio crud" on public.sop_exceptions;
drop policy if exists "task comments portfolio crud" on public.task_comments;
drop policy if exists "activity logs portfolio crud" on public.activity_logs;

create policy "profiles tenant read" on public.profiles for select to authenticated using (
  id = auth.uid() or public.can_read_organization(organization_id)
);
create policy "profiles insert own row" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update own row" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "organizations member read" on public.organizations for select to authenticated using (public.can_read_organization(id));
create policy "locations member read" on public.locations for select to authenticated using (public.can_read_organization(organization_id));
create policy "memberships member read" on public.memberships for select to authenticated using (public.can_read_organization(organization_id));
create policy "projects tenant read" on public.projects for select to authenticated using (public.can_read_organization(organization_id));
create policy "projects tenant mutate" on public.projects for all to authenticated using (public.current_membership_role(organization_id) in ('Admin', 'Supervisor')) with check (public.current_membership_role(organization_id) in ('Admin', 'Supervisor'));
create policy "tasks tenant read" on public.tasks for select to authenticated using (public.can_read_organization(organization_id));
create policy "tasks tenant mutate" on public.tasks for all to authenticated using (public.current_membership_role(organization_id) in ('Admin', 'Supervisor')) with check (public.current_membership_role(organization_id) in ('Admin', 'Supervisor'));
create policy "sop folders tenant read" on public.sop_folders for select to authenticated using (public.can_read_organization(organization_id));
create policy "sop folders tenant mutate" on public.sop_folders for all to authenticated using (public.can_mutate_sop(organization_id)) with check (public.can_mutate_sop(organization_id));
create policy "transformations tenant read" on public.transformations for select to authenticated using (public.can_read_organization(organization_id));
create policy "transformations tenant mutate" on public.transformations for all to authenticated using (public.current_membership_role(organization_id) in ('Admin', 'Supervisor')) with check (public.current_membership_role(organization_id) in ('Admin', 'Supervisor'));
create policy "sop files tenant access" on public.sop_files for all to authenticated using (sop_id is not null and public.can_read_sop(sop_id)) with check (sop_id is not null and public.can_read_sop(sop_id));
create policy "sop approvals tenant read" on public.sop_approvals for select to authenticated using (public.can_read_sop(sop_id));
create policy "sop approvals tenant approve" on public.sop_approvals for insert to authenticated with check (public.can_approve_sop((select organization_id from public.sops where id = sop_id)));
create policy "sop training tenant access" on public.sop_training_acknowledgements for all to authenticated using (public.can_read_sop(sop_id)) with check (public.can_read_sop(sop_id));
create policy "sop lifecycle tenant read" on public.sop_lifecycle_events for select to authenticated using (public.can_read_sop(sop_id));
create policy "sop lifecycle tenant author" on public.sop_lifecycle_events for insert to authenticated with check (public.can_mutate_sop((select organization_id from public.sops where id = sop_id)));
create policy "sop evidence tenant access" on public.sop_evidence for all to authenticated using (public.can_read_sop(sop_id)) with check (public.can_read_sop(sop_id));
create policy "sop exceptions tenant access" on public.sop_exceptions for all to authenticated using (public.can_read_sop(sop_id)) with check (public.can_read_sop(sop_id));
create policy "task comments tenant access" on public.task_comments for all to authenticated using (public.can_read_organization((select organization_id from public.tasks where id = task_id))) with check (public.can_read_organization((select organization_id from public.tasks where id = task_id)));
create policy "activity logs tenant read" on public.activity_logs for select to authenticated using (public.can_read_organization((select organization_id from public.tasks where id = task_id)));

create policy "sops tenant read" on public.sops for select to authenticated using (public.can_read_organization(organization_id));
create policy "sops tenant author" on public.sops for insert to authenticated with check (public.can_mutate_sop(organization_id));
create policy "sops tenant edit" on public.sops for update to authenticated using (public.can_mutate_sop(organization_id)) with check (public.can_mutate_sop(organization_id));
create policy "workflow runs tenant read" on public.workflow_runs for select to authenticated using (public.can_read_organization(organization_id));
create policy "workflow runs tenant execute" on public.workflow_runs for update to authenticated using (public.can_execute_run(organization_id, assigned_to)) with check (public.can_execute_run(organization_id, assigned_to));
create policy "workflow runs tenant create" on public.workflow_runs for insert to authenticated with check (public.current_membership_role(organization_id) in ('Admin', 'Supervisor'));
create policy "workflow steps tenant access" on public.workflow_step_instances for all to authenticated using (public.can_read_organization(organization_id)) with check (public.can_execute_run(organization_id, (select assigned_to from public.workflow_runs where id = workflow_run_id)));
create policy "workflow responses tenant access" on public.workflow_step_responses for all to authenticated using (public.can_read_organization(organization_id)) with check (public.can_read_organization(organization_id));
create policy "workflow evidence tenant access" on public.workflow_evidence for all to authenticated using (public.can_read_organization(organization_id)) with check (public.can_read_organization(organization_id));
create policy "sop versions tenant read" on public.sop_versions for select to authenticated using (public.can_read_organization(organization_id));
create policy "sop versions tenant author" on public.sop_versions for insert to authenticated with check (public.can_mutate_sop(organization_id));
create policy "sop versions tenant edit" on public.sop_versions for update to authenticated using (public.can_mutate_sop(organization_id) and status <> 'PUBLISHED') with check (public.can_mutate_sop(organization_id));
create policy "approval requests tenant read" on public.approval_requests for select to authenticated using (public.can_read_organization(organization_id));
create policy "approval requests tenant approve" on public.approval_requests for update to authenticated using (public.can_approve_sop(organization_id)) with check (public.can_approve_sop(organization_id));
create policy "audit events tenant read" on public.audit_events for select to authenticated using (public.current_membership_role(organization_id) in ('Admin', 'Auditor', 'Process Owner', 'Supervisor'));
create policy "audit events append" on public.audit_events for insert to authenticated with check (public.can_read_organization(organization_id));
