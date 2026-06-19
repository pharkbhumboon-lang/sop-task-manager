import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(import.meta.dirname, "..");
const configSource = readFileSync(join(projectRoot, "tailwind.config.js"), "utf8");
const componentSource = readFileSync(join(import.meta.dirname, "components.jsx"), "utf8");
const appSource = readFileSync(join(import.meta.dirname, "App.jsx"), "utf8");

test("uses the Premium SaaS blue and emerald design tokens", () => {
  assert.match(configSource, /500:\s*"#3B82F6"/);
  assert.match(configSource, /good:\s*"#10B981"/);
  assert.match(configSource, /appbg:\s*"#3A3A3C"/);
  assert.match(configSource, /panel:\s*"#1A1A1C"/);
});

test("uses blue primary actions instead of the old white action treatment", () => {
  assert.match(componentSource, /bg-action/);
  assert.doesNotMatch(componentSource, /bg-white px-6 py-3\.5 text-sm font-semibold text-secondary-500/);
  assert.doesNotMatch(appSource, /bg-white px-6 py-3\.5 text-base font-semibold text-secondary-500/);
});
