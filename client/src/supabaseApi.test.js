import assert from "node:assert/strict";
import test from "node:test";
import { buildDashboard, mapProfile, mapProject, mapTask, providerForMicrosoft, safeHeaderValue } from "./supabaseApi.js";

test("maps a Supabase profile into the app user contract", () => {
  assert.deepEqual(
    mapProfile({
      id: "user-1",
      name: "Admin User",
      email: "admin@example.com",
      role: "Manager",
      department: "Operations"
    }),
    {
      id: "user-1",
      name: "Admin User",
      email: "admin@example.com",
      role: "Manager",
      department: "Operations",
      userLevel: 2
    }
  );
});

test("maps Supabase project and task rows into existing camelCase fields", () => {
  const project = mapProject({
    id: 7,
    project_code: "PRJ-007",
    project_name: "Workflow Reset",
    description: "Fix repeated approvals",
    owner: "Mina",
    department: "Operations",
    start_date: "2026-06-01",
    due_date: "2026-06-30",
    status: "In Progress",
    priority: "High",
    created_date: "2026-06-01T00:00:00.000Z",
    updated_date: "2026-06-02T00:00:00.000Z"
  });
  const task = mapTask({
    id: 11,
    task_code: "TASK-011",
    task_title: "Map current workflow",
    project_id: 7,
    projects: { project_name: "Workflow Reset" },
    work_detail: "Interview department owner",
    sop_id: null,
    sops: null,
    assigned_to: "Nok",
    priority: "High",
    start_date: "2026-06-01",
    due_date: "2026-06-10",
    status: "In Progress",
    progress_percent: 45,
    attachment_url: "",
    created_by: "Admin",
    created_date: "2026-06-01T00:00:00.000Z",
    updated_date: "2026-06-02T00:00:00.000Z"
  });

  assert.equal(project.projectName, "Workflow Reset");
  assert.equal(task.projectName, "Workflow Reset");
  assert.equal(task.progressPercent, 45);
});

test("builds dashboard metrics from Supabase task rows", () => {
  const dashboard = buildDashboard([
    mapTask({ id: 1, task_code: "A", task_title: "A", status: "In Progress", due_date: "2026-06-18", updated_date: "2026-06-18T00:00:00.000Z" }),
    mapTask({ id: 2, task_code: "B", task_title: "B", status: "Waiting", due_date: "2026-06-18", updated_date: "2026-06-17T00:00:00.000Z" }),
    mapTask({ id: 3, task_code: "C", task_title: "C", status: "Completed", due_date: "2026-06-01", updated_date: "2026-06-16T00:00:00.000Z" })
  ], "2026-06-19");

  assert.deepEqual(dashboard.metrics, {
    totalTasks: 3,
    inProgressTasks: 1,
    waitingTasks: 1,
    completedTasks: 1,
    overdueTasks: 2
  });
});

test("uses Supabase Azure provider for Microsoft login", () => {
  assert.equal(providerForMicrosoft(), "azure");
});

test("falls back when a Supabase header value contains pasted unicode", () => {
  assert.equal(safeHeaderValue("abc.def.ghi", "fallback"), "abc.def.ghi");
  assert.equal(safeHeaderValue("abc…def", "fallback"), "fallback");
});
