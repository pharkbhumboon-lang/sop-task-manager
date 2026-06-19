import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const appSource = readFileSync(join(import.meta.dirname, "App.jsx"), "utf8");
const componentSource = readFileSync(join(import.meta.dirname, "components.jsx"), "utf8");

test("moves SOP Calendar into its own sidebar destination", () => {
  assert.match(componentSource, /\{ id: "calendar", label: "SOP Calendar", icon: "solar:calendar-mark-linear" \}/);
  assert.match(appSource, /activePage === "calendar" && <SopCalendarPage/);
  assert.match(appSource, /function SopCalendarPage/);
  const taskPageSource = appSource.slice(appSource.indexOf("function TasksPage"), appSource.indexOf("function SopCalendarPage"));
  assert.doesNotMatch(taskPageSource, /<TaskDeadlineCalendar/);
});
