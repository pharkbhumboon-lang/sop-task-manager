import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migration = readFileSync(join(import.meta.dirname, "../../supabase/migrations/20260620010000_controlled_execution.sql"), "utf8");

test("adds tenant-aware controlled SOP execution schema", () => {
  for (const table of ["organizations", "locations", "memberships", "sop_versions", "workflow_runs", "workflow_step_instances", "workflow_step_responses", "audit_events", "review_schedules"]) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
  }
  assert.match(migration, /sop_version_id uuid not null references public\.sop_versions/);
  assert.match(migration, /prevent_published_version_mutation/);
  assert.match(migration, /required step responses are incomplete/);
  assert.match(migration, /enable row level security/);
});

test("contains tenant and role checks for protected mutations", () => {
  assert.match(migration, /current_membership_role/);
  assert.match(migration, /can_mutate_sop/);
  assert.match(migration, /can_execute_run/);
  assert.match(migration, /create policy "workflow runs tenant read"/);
});
