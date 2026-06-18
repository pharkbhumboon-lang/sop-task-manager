const priorityRank = {
  Urgent: 0,
  High: 1,
  Medium: 2,
  Low: 3
};

function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function mondayStart(date) {
  const day = date.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(date, offset);
}

function monthLabel(monthStartDate) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(monthStartDate);
}

function compareTaskDeadline(a, b) {
  if (a.status === "Completed" && b.status !== "Completed") return 1;
  if (a.status !== "Completed" && b.status === "Completed") return -1;
  if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
  return (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9);
}

export function buildTaskDeadlineCalendar(tasks, options = {}) {
  const month = options.month ?? new Date().toISOString().slice(0, 7);
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const monthStartDate = new Date(`${month}-01T00:00:00.000Z`);
  const nextMonthStart = new Date(Date.UTC(monthStartDate.getUTCFullYear(), monthStartDate.getUTCMonth() + 1, 1));
  const firstVisibleDay = mondayStart(monthStartDate);
  const lastVisibleDay = addDays(mondayStart(addDays(nextMonthStart, -1)), 6);
  const tasksByDate = tasks.reduce((days, task) => {
    if (!task.dueDate?.startsWith(month)) return days;
    const date = task.dueDate.slice(0, 10);
    const deadline = {
      ...task,
      dueDate: date,
      isOverdue: task.status !== "Completed" && date < today
    };
    days.set(date, [...(days.get(date) ?? []), deadline]);
    return days;
  }, new Map());

  const days = [];
  for (let date = firstVisibleDay; date <= lastVisibleDay; date = addDays(date, 1)) {
    const key = toDateOnly(date);
    days.push({
      date: key,
      dayNumber: date.getUTCDate(),
      isCurrentMonth: key.startsWith(month),
      isToday: key === today,
      tasks: [...(tasksByDate.get(key) ?? [])].sort(compareTaskDeadline)
    });
  }

  const weeks = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return {
    month,
    label: monthLabel(monthStartDate),
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    weeks
  };
}
