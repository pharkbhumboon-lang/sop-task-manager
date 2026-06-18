import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const appSource = readFileSync(join(import.meta.dirname, "App.jsx"), "utf8");

test("public Supabase login uses email password fields instead of disabled OAuth buttons", () => {
  assert.match(appSource, /TextInput label="Email"/);
  assert.match(appSource, /TextInput label="Password"/);
  assert.doesNotMatch(appSource, /Continue with Google/);
  assert.doesNotMatch(appSource, /Continue with Microsoft/);
  assert.doesNotMatch(appSource, /Demo accounts/);
  assert.doesNotMatch(appSource, /signInProvider/);
});
