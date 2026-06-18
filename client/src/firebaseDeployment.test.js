import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = join(import.meta.dirname, "..", "..");

test("declares Firebase Hosting for the Vite production build", () => {
  const firebasePath = join(root, "firebase.json");
  assert.equal(existsSync(firebasePath), true);

  const firebase = JSON.parse(readFileSync(firebasePath, "utf8"));
  assert.equal(firebase.hosting.public, "client/dist");
  assert.deepEqual(firebase.hosting.rewrites, [{ source: "**", destination: "/index.html" }]);
  assert.match(firebase.hosting.ignore.join("\n"), /\*\*\/node_modules\/\*\*/);
});

test("keeps Firebase project selection out of committed config", () => {
  const firebasercPath = join(root, ".firebaserc");
  assert.equal(existsSync(firebasercPath), false);
  assert.match(readFileSync(join(root, ".gitignore"), "utf8"), /\.firebaserc/);
  assert.match(readFileSync(join(root, "package.json"), "utf8"), /npx firebase-tools deploy --only hosting/);
});
