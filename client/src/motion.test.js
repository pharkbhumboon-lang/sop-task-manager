import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const styles = readFileSync(join(import.meta.dirname, "styles.css"), "utf8");

test("defines shared smooth motion classes", () => {
  for (const className of ["motion-page", "motion-panel", "motion-list-item", "motion-pop", "motion-dialog", "motion-interactive"]) {
    assert.match(styles, new RegExp(`\\.${className}\\b`));
  }
});

test("dialog motion uses compositor-safe properties", () => {
  assert.match(styles, /@keyframes motion-dialog-in/);
  assert.match(styles, /\.motion-dialog[\s\S]*animation:\s*motion-dialog-in/);
  assert.match(styles, /@keyframes motion-dialog-in[\s\S]*opacity:\s*0[\s\S]*transform:\s*translate3d\(0,\s*10px,\s*0\)\s*scale\(0\.985\)/);
});

test("keeps reduced motion override for animations and transitions", () => {
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
  assert.match(styles, /animation-duration:\s*1ms\s*!important/);
  assert.match(styles, /transition-duration:\s*1ms\s*!important/);
});
