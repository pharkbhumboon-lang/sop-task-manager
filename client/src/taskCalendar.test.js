import assert from "node:assert/strict";
import test from "node:test";
import { buildTaskDeadlineCalendar } from "./taskCalendar.js";

test("builds month weeks and attaches task deadlines to due date cells", () => {
  const calendar = buildTaskDeadlineCalendar(
    [
      { id: 1, taskId: "TASK-001", taskTitle: "Check invoices", dueDate: "2026-06-20", priority: "High", status: "In Progress", sopId: 1, sopName: "Invoice Approval" },
      { id: 2, taskId: "TASK-002", taskTitle: "Collect bank forms", dueDate: "2026-06-18", priority: "Urgent", status: "Waiting", sopId: 1, sopName: "Invoice Approval" },
      { id: 3, taskId: "TASK-003", taskTitle: "Future task", dueDate: "2026-07-01", priority: "Low", status: "Not Started" }
    ],
    { month: "2026-06", today: "2026-06-19" }
  );

  assert.equal(calendar.label, "June 2026");
  assert.equal(calendar.weeks.length, 5);
  const dueCell = calendar.weeks.flat().find((day) => day.date === "2026-06-18");
  assert.equal(dueCell.tasks.length, 1);
  assert.equal(dueCell.tasks[0].taskId, "TASK-002");
  assert.equal(dueCell.tasks[0].isOverdue, true);
  assert.equal(calendar.weeks.flat().find((day) => day.date === "2026-06-19").isToday, true);
});

test("sorts urgent and overdue deadlines first inside each calendar day", () => {
  const calendar = buildTaskDeadlineCalendar(
    [
      { id: 1, taskId: "TASK-LOW", taskTitle: "Low priority", dueDate: "2026-06-18", priority: "Low", status: "In Progress" },
      { id: 2, taskId: "TASK-DONE", taskTitle: "Completed task", dueDate: "2026-06-18", priority: "Urgent", status: "Completed" },
      { id: 3, taskId: "TASK-URG", taskTitle: "Urgent blocker", dueDate: "2026-06-18", priority: "Urgent", status: "Waiting" }
    ],
    { month: "2026-06", today: "2026-06-19" }
  );

  const dueCell = calendar.weeks.flat().find((day) => day.date === "2026-06-18");
  assert.deepEqual(dueCell.tasks.map((task) => task.taskId), ["TASK-URG", "TASK-LOW", "TASK-DONE"]);
});
