import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = join(import.meta.dirname, "..", "..");

test("declares Vercel and Supabase portfolio deployment config", () => {
  const vercelPath = join(root, "vercel.json");
  assert.equal(existsSync(vercelPath), true);

  const vercel = JSON.parse(readFileSync(vercelPath, "utf8"));
  assert.equal(vercel.framework, "vite");
  assert.equal(vercel.outputDirectory, "client/dist");
  assert.match(vercel.buildCommand, /workspace client/);

  const env = readFileSync(join(root, ".env.example"), "utf8");
  assert.match(env, /VITE_DATA_BACKEND=supabase/);
  assert.match(env, /VITE_SUPABASE_URL=/);
  assert.match(env, /VITE_SUPABASE_ANON_KEY=/);
  assert.match(readFileSync(join(root, "package.json"), "utf8"), /npx supabase db push/);
});

test("ships Supabase schema with auth profile and portfolio tables", () => {
  const sql = readFileSync(join(root, "supabase", "migrations", "20260619000000_portfolio_schema.sql"), "utf8");
  for (const table of ["profiles", "projects", "tasks", "sops", "sop_approvals", "task_comments", "transformations"]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`, "i"));
  }
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /create policy/i);
});
