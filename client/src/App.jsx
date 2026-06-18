import { useEffect, useMemo, useState } from "react";
import { api, isSupabaseMode } from "./api.js";
import { rankSopMatches } from "./search.js";
import { buildTaskDeadlineCalendar } from "./taskCalendar.js";
import {
  EmptyState,
  Field,
  FilterBar,
  KpiCard,
  PageHeader,
  Panel,
  PriorityBadge,
  Shell,
  SolarIcon,
  StatusBadge,
  dateShort,
  defaultProjectForm,
  defaultSopForm,
  defaultTaskForm,
  defaultTransformationForm,
  inputClass,
  isOverdue,
  kpiIcons,
  textareaClass
} from "./components.jsx";

const statusOptions = ["Not Started", "In Progress", "Waiting", "Completed"];
const priorityOptions = ["Low", "Medium", "High", "Urgent"];
const departmentOptions = ["Operations", "Finance", "HR", "IT", "Sales"];
const roleOptions = ["User", "Manager", "Admin"];
const documentTypeOptions = ["Policy", "Procedure", "Checklist", "Guide", "Template"];
const sopStatusOptions = ["Draft", "Published", "Archived"];
const approvalStatusOptions = ["Draft", "Pending Review", "Approved", "Changes Requested", "Retired"];
const riskOptions = ["Low", "Medium", "High", "Critical"];
const criticalityOptions = ["Low", "Medium", "High", "Critical"];
const accessOptions = ["Public", "Internal", "Restricted"];
const lifecycleStatusOptions = ["Draft", "In Review", "Changes Requested", "Approved", "Published", "Under Review", "Retired"];
const controlFrequencyOptions = ["Event-based", "Daily", "Weekly", "Monthly", "Quarterly", "Annually"];
const responsibilityLevelOptions = [
  "L1 User / Staff",
  "L2 Task Owner",
  "L3 Process Owner",
  "L4 Reviewer",
  "L5 Approver / Manager",
  "L6 Admin",
  "L7 Auditor"
];
const people = ["Admin", "Nok", "Mina", "Tan"];
const defaultUserForm = {
  name: "",
  email: "",
  password: "",
  role: "User",
  department: "Operations"
};

function levelForRole(role) {
  return role === "Admin" ? 1 : role === "Manager" ? 2 : 3;
}

function normalizeUser(user) {
  return user ? { ...user, userLevel: user.userLevel ?? levelForRole(user.role) } : null;
}

function nextCode(prefix, rows, field) {
  const max = rows.reduce((highest, row) => {
    const number = Number(String(row[field] ?? "").replace(`${prefix}-`, ""));
    return Number.isFinite(number) ? Math.max(highest, number) : highest;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

function useAppData(user) {
  const [data, setData] = useState({
    dashboard: null,
    tasks: [],
    projects: [],
    sops: [],
    sopFolders: [],
    sopFiles: [],
    transformations: [],
    reports: null,
    settings: null,
    users: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(filters = {}) {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [dashboard, tasks, projects, sops, sopFolders, sopFiles, transformations, reports, settings, users] = await Promise.all([
        api.dashboard(),
        api.tasks(filters),
        api.projects(),
        api.sops(),
        api.sopFolders(),
        api.sopFiles(),
        api.transformations(),
        api.reports(),
        api.settings(),
        user.role === "Admin" ? api.users(user) : Promise.resolve([])
      ]);
      setData({ dashboard, tasks, projects, sops, sopFolders, sopFiles, transformations, reports, settings, users });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user?.id]);

  return { data, loading, error, load };
}

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [filters, setFilters] = useState({ status: "", projectId: "", assignedTo: "", priority: "" });
  const [user, setUser] = useState(() => {
    if (isSupabaseMode) return null;
    const saved = localStorage.getItem("sop-task-user");
    return saved ? normalizeUser(JSON.parse(saved)) : null;
  });
  const [authReady, setAuthReady] = useState(!isSupabaseMode);
  const { data, loading, error, load } = useAppData(user);

  useEffect(() => {
    if (!isSupabaseMode) return undefined;
    let active = true;
    api.currentUser()
      .then((signedInUser) => {
        if (active) setUser(normalizeUser(signedInUser));
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return api.onAuthStateChange((signedInUser) => {
      setUser(normalizeUser(signedInUser));
      setAuthReady(true);
    });
  }, []);

  if (!authReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-appbg p-3 text-white">
        <section className="glass-dark motion-pop rounded-glass p-6 text-center shadow-lift">
          <p className="text-xs font-semibold uppercase text-action">SOP Control</p>
          <h1 className="mt-3 text-2xl font-normal">Checking session</h1>
        </section>
      </main>
    );
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  async function refresh(nextFilters = filters) {
    await load(nextFilters);
  }

  async function logout() {
    if (isSupabaseMode) await api.logout();
    localStorage.removeItem("sop-task-user");
    setUser(null);
    setActivePage("dashboard");
  }

  const pageProps = { data, filters, setFilters, refresh, loading, user };

  return (
    <Shell activePage={activePage} setActivePage={setActivePage} user={user} onLogout={logout}>
      {error ? (
        <div className="mb-4 rounded-glass border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
          {error}
        </div>
      ) : null}
      <div key={activePage} className="motion-page">
        {activePage === "dashboard" && <DashboardPage {...pageProps} setActivePage={setActivePage} />}
        {activePage === "tasks" && <TasksPage {...pageProps} />}
        {activePage === "projects" && <ProjectsPage {...pageProps} />}
        {activePage === "sops" && <SopsPage {...pageProps} />}
        {activePage === "transformations" && <TransformationsPage {...pageProps} />}
        {activePage === "reports" && <ReportsPage {...pageProps} />}
        {activePage === "settings" && <SettingsPage {...pageProps} />}
      </div>
    </Shell>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const response = await api.login({ email, password });
      const signedInUser = normalizeUser(response.user);
      localStorage.setItem("sop-task-user", JSON.stringify(signedInUser));
      onLogin(signedInUser);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-appbg p-3">
      <section className="grid w-full max-w-2xl gap-4">
        <div className="glass-dark rounded-glass p-6 shadow-lift">
          <p className="text-xs font-semibold uppercase text-white/60">Internal SOP</p>
          <h1 className="mt-8 text-balance text-5xl font-normal leading-none text-white">Task Manager Login</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-white/70">
            ERP-grade operating workspace for SOP workflow control, approvals, evidence, and audit-ready execution.
          </p>
          <form onSubmit={submit} className="mt-6 grid gap-3">
            {isSupabaseMode ? (
              <>
                <TextInput label="Email" value={email} onChange={setEmail} type="email" required />
                <TextInput label="Password" value={password} onChange={setPassword} type="password" required />
              </>
            ) : (
              <>
                <TextInput label="Email" value={email} onChange={setEmail} type="email" required />
                <TextInput label="Password" value={password} onChange={setPassword} type="password" required />
              </>
            )}
            {error ? <div className="rounded-glass border border-danger/20 bg-danger/10 px-3 py-2 text-sm font-bold text-danger">{error}</div> : null}
            <button type="submit" className="motion-interactive inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-semibold text-secondary-500 shadow-lift hover:bg-primary-100">
              <SolarIcon icon="solar:arrow-right-linear" size={18} />
              Sign in
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function DashboardPage({ data, loading, setActivePage }) {
  const metrics = data.dashboard?.metrics ?? {};

  return (
    <>
      <PageHeader
        eyebrow="Simple internal workspace"
        title="SOP and Task Dashboard"
        subtitle="A lightweight operating board for projects, assigned work, readable SOPs, and follow-up history."
        actionLabel="New task"
        onAction={() => setActivePage("tasks")}
      />
      <section className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total tasks" value={metrics.totalTasks ?? "-"} helper="All active records" icon={kpiIcons.total} />
        <KpiCard label="In progress" value={metrics.inProgressTasks ?? "-"} helper="Being worked now" icon={kpiIcons.progress} />
        <KpiCard label="Waiting" value={metrics.waitingTasks ?? "-"} helper="Blocked or pending" tone="warn" icon={kpiIcons.waiting} />
        <KpiCard label="Completed" value={metrics.completedTasks ?? "-"} helper="Closed tasks" tone="good" icon={kpiIcons.completed} />
        <KpiCard label="Overdue" value={metrics.overdueTasks ?? "-"} helper="Needs attention" tone="danger" icon={kpiIcons.overdue} />
      </section>
      <section className="grid gap-4">
        <Panel title="Dashboard Placeholder" subtitle="Reserved for the next dashboard module">
        <div className="rounded-[22px] border border-dashed border-white/10 bg-secondary-500/75 px-4 py-12 text-center">
            <div className="operation-lines mx-auto mb-6 h-10 max-w-md rounded-full" />
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-action">Coming next</p>
            <h3 className="mt-2 text-2xl font-black text-white">Operational overview placeholder</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/70">
              This area is intentionally empty for now and ready for the next dashboard feature.
            </p>
          </div>
        </Panel>
      </section>
    </>
  );
}

function TasksPage({ data, filters, setFilters, refresh, loading, user }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [comment, setComment] = useState("");
  const [form, setForm] = useState(defaultTaskForm);
  const [calendarMonth, setCalendarMonth] = useState(new Date().toISOString().slice(0, 7));
  const canCreateTasks = (user?.userLevel ?? 3) <= 2;

  useEffect(() => {
    if (showForm && !editing) {
      setForm({
        ...defaultTaskForm,
        taskId: nextCode("TASK", data.tasks, "taskId"),
        projectId: data.projects[0]?.id ?? "",
        sopId: data.sops[0]?.id ?? ""
      });
    }
  }, [showForm, editing, data.tasks, data.projects, data.sops]);

  async function applyFilters(next) {
    const clean = Object.fromEntries(Object.entries(next).filter(([, value]) => value));
    setFilters(next);
    await refresh(clean);
  }

  function editTask(task) {
    if (!canCreateTasks) return;
    setEditing(task);
    setForm({
      ...task,
      projectId: task.projectId ?? "",
      sopId: task.sopId ?? ""
    });
    setShowForm(true);
  }

  async function saveTask(event) {
    event.preventDefault();
    const payload = {
      ...form,
      projectId: Number(form.projectId),
      sopId: form.sopId ? Number(form.sopId) : null,
      progressPercent: Number(form.progressPercent)
    };
    if (editing) {
      await api.updateTask(editing.id, { ...payload, updatedBy: user?.name ?? "System" }, user);
    } else {
      await api.createTask({ ...payload, createdBy: user?.name ?? payload.createdBy }, user);
    }
    setShowForm(false);
    setEditing(null);
    await refresh(Object.fromEntries(Object.entries(filters).filter(([, value]) => value)));
  }

  async function removeTask(task) {
    if (!canCreateTasks) return;
    await api.deleteTask(task.id);
    await refresh(Object.fromEntries(Object.entries(filters).filter(([, value]) => value)));
  }

  async function openDetail(task) {
    setDetail(await api.task(task.id));
    setComment("");
  }

  async function addComment(event) {
    event.preventDefault();
    if (!comment.trim()) return;
    await api.addComment(detail.id, { userName: user?.name ?? "User", comment });
    setDetail(await api.task(detail.id));
    setComment("");
    await refresh(Object.fromEntries(Object.entries(filters).filter(([, value]) => value)));
  }

  async function changeTaskStatus(task, status) {
    await api.updateTask(task.id, { status, updatedBy: user?.name ?? "User" }, user);
    if (detail?.id === task.id) setDetail(await api.task(task.id));
    await refresh(Object.fromEntries(Object.entries(filters).filter(([, value]) => value)));
  }

  return (
    <>
      <PageHeader
        eyebrow="My Tasks"
        title="Task Cards"
        subtitle="Create, filter, update, comment, and close work without a complex ERP flow."
        actionLabel={canCreateTasks ? "New task" : ""}
        onAction={() => {
          setEditing(null);
          setShowForm(true);
        }}
      />
      <FilterBar>
        <Select label="Status" value={filters.status} onChange={(value) => applyFilters({ ...filters, status: value })} options={["", ...statusOptions]} />
        <Select label="Project" value={filters.projectId} onChange={(value) => applyFilters({ ...filters, projectId: value })} options={["", ...data.projects.map((project) => ({ value: project.id, label: project.projectName }))]} />
        <Select label="Assigned user" value={filters.assignedTo} onChange={(value) => applyFilters({ ...filters, assignedTo: value })} options={["", ...people]} />
        <Select label="Priority" value={filters.priority} onChange={(value) => applyFilters({ ...filters, priority: value })} options={["", ...priorityOptions]} />
      </FilterBar>
      {!canCreateTasks ? (
        <div className="mb-4 rounded-glass border border-white/10 bg-secondary-500/75 px-4 py-3 text-sm font-bold text-white/70">
          Your level is L{user?.userLevel ?? 3}. Task creation is available for Admin and Manager only.
        </div>
      ) : null}
      {showForm && canCreateTasks ? (
        <TaskForm
          form={form}
          setForm={setForm}
          projects={data.projects}
          sops={data.sops}
          editing={editing}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={saveTask}
        />
      ) : null}
      <TaskDeadlineCalendar tasks={data.tasks} month={calendarMonth} setMonth={setCalendarMonth} onOpen={openDetail} />
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel title="Task Board" subtitle={`${data.tasks.length} tasks shown`}>
          {loading ? <EmptyState label="Loading tasks..." /> : <TaskList tasks={data.tasks} onEdit={canCreateTasks ? editTask : null} onDelete={canCreateTasks ? removeTask : null} onOpen={openDetail} onStatusChange={changeTaskStatus} />}
        </Panel>
        <TaskDetailPanel detail={detail} comment={comment} setComment={setComment} addComment={addComment} />
      </section>
    </>
  );
}

function TaskDeadlineCalendar({ tasks, month, setMonth, onOpen }) {
  const calendar = useMemo(() => buildTaskDeadlineCalendar(tasks, { month }), [tasks, month]);
  const deadlineCount = calendar.weeks.flat().reduce((total, day) => total + day.tasks.length, 0);

  return (
    <Panel title="SOP Deadline Calendar" subtitle={`${deadlineCount} task deadlines in ${calendar.label}`} className="mb-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-action">
          <SolarIcon icon="solar:calendar-mark-linear" size={17} />
          {calendar.label}
        </div>
        <label className="grid gap-1 text-xs font-extrabold uppercase text-white/60 sm:w-48">
          Month
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className={inputClass} />
        </label>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[720px] rounded-[20px] border border-white/10 bg-[#171717]/55 p-2">
          <div className="grid grid-cols-7 gap-1 pb-2">
            {calendar.weekdays.map((weekday) => (
              <div key={weekday} className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white/45">
                {weekday}
              </div>
            ))}
          </div>
          <div className="grid gap-1">
            {calendar.weeks.map((week) => (
              <div key={week[0].date} className="grid grid-cols-7 gap-1">
                {week.map((day) => (
                  <div
                    key={day.date}
                    className={`min-h-28 rounded-[16px] border p-2 transition-colors ${
                      day.isToday
                        ? "border-action/70 bg-action/10 shadow-glow"
                        : day.isCurrentMonth
                          ? "border-white/10 bg-secondary-500/60"
                          : "border-white/[0.04] bg-white/[0.02] text-white/35"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className={`text-xs font-extrabold ${day.isCurrentMonth ? "text-white/70" : "text-white/30"}`}>{day.dayNumber}</span>
                      {day.tasks.some((task) => task.isOverdue) ? <span className="h-2 w-2 rounded-full bg-danger" title="Overdue deadline" /> : null}
                    </div>
                    <div className="grid gap-1">
                      {day.tasks.slice(0, 2).map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => onOpen(task)}
                          className={`motion-interactive min-h-9 rounded-[12px] border px-2 py-1 text-left ${
                            task.isOverdue
                              ? "border-danger/35 bg-danger/10 text-danger"
                              : task.priority === "Urgent"
                                ? "border-action/40 bg-action/10 text-action"
                                : "border-white/10 bg-white/[0.04] text-white/78"
                          }`}
                        >
                          <span className="block truncate text-[11px] font-black">{task.taskId}</span>
                          <span className="block truncate text-[11px] font-semibold opacity-80">{task.taskTitle}</span>
                          {task.sopName ? <span className="block truncate text-[10px] font-bold opacity-60">{task.sopName}</span> : null}
                        </button>
                      ))}
                      {day.tasks.length > 2 ? (
                        <div className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-center text-[10px] font-extrabold text-white/50">
                          +{day.tasks.length - 2} more
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function TaskList({ tasks, onEdit, onDelete, onOpen, onStatusChange, compact = false }) {
  if (!tasks.length) return <EmptyState label="No tasks found." />;

  return (
    <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
      {tasks.map((task, index) => (
        <article key={task.id} className="motion-list-item motion-interactive rounded-[22px] border border-white/10 bg-secondary-500/80 p-4 shadow-lift" style={{ animationDelay: `${Math.min(120, index * 24)}ms` }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase text-white/70">{task.taskId}</p>
              <h3 className="mt-1 text-base font-black text-white">{task.taskTitle}</h3>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isOverdue(task) ? <span className="rounded-full bg-danger/10 px-2 py-1 text-xs font-extrabold text-danger">Overdue</span> : null}
              {onOpen ? <IconButton label="Open" onClick={() => onOpen(task)} icon="solar:maximize-square-linear" /> : null}
              {onEdit ? <IconButton label="Edit" onClick={() => onEdit(task)} icon="solar:pen-linear" /> : null}
              {onDelete ? <IconButton label="Delete" onClick={() => onDelete(task)} icon="solar:trash-bin-trash-linear" danger /> : null}
            </div>
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/70">{task.workDetail}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge value={task.status} />
            <PriorityBadge value={task.priority} />
          </div>
          {onStatusChange ? (
            <div className="mt-3">
              <Select label="Change Status" value={task.status} onChange={(value) => onStatusChange(task, value)} options={statusOptions} />
            </div>
          ) : null}
          <div className="mt-4 grid gap-2 text-sm font-semibold text-white/70">
            <div className="flex justify-between gap-3"><span>Project</span><strong className="text-white">{task.projectName}</strong></div>
            <div className="flex justify-between gap-3"><span>Assigned</span><strong className="text-white">{task.assignedTo}</strong></div>
            <div className="flex justify-between gap-3"><span>Due</span><strong className="text-white">{dateShort(task.dueDate)}</strong></div>
          </div>
        </article>
      ))}
    </div>
  );
}

function TaskForm({ form, setForm, projects, sops, editing, onCancel, onSubmit }) {
  return (
    <Panel title={editing ? "Edit Task" : "Create Task"} subtitle="Required fields are kept together for fast entry." className="motion-dialog mb-4">
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-4">
        <TextInput label="Task ID" value={form.taskId} onChange={(value) => setForm({ ...form, taskId: value })} required />
        <TextInput label="Title" value={form.taskTitle} onChange={(value) => setForm({ ...form, taskTitle: value })} required className="md:col-span-2" />
        <Select label="Assigned To" value={form.assignedTo} onChange={(value) => setForm({ ...form, assignedTo: value })} options={people} />
        <Select label="Project" value={form.projectId} onChange={(value) => setForm({ ...form, projectId: value })} options={projects.map((project) => ({ value: project.id, label: project.projectName }))} />
        <Select label="SOP Reference" value={form.sopId} onChange={(value) => setForm({ ...form, sopId: value })} options={["", ...sops.map((sop) => ({ value: sop.id, label: sop.sopName }))]} />
        <Select label="Priority" value={form.priority} onChange={(value) => setForm({ ...form, priority: value })} options={priorityOptions} />
        <Select label="Status" value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={statusOptions} />
        <TextInput label="Start Date" type="date" value={form.startDate} onChange={(value) => setForm({ ...form, startDate: value })} />
        <TextInput label="Due Date" type="date" value={form.dueDate} onChange={(value) => setForm({ ...form, dueDate: value })} />
        <TextInput label="Progress %" type="number" value={form.progressPercent} onChange={(value) => setForm({ ...form, progressPercent: value })} min="0" max="100" />
        <TextInput label="Attachment URL" value={form.attachmentUrl} onChange={(value) => setForm({ ...form, attachmentUrl: value })} />
        <TextArea label="Work Detail" value={form.workDetail} onChange={(value) => setForm({ ...form, workDetail: value })} required className="md:col-span-4" />
        <div className="flex gap-2 md:col-span-4">
          <button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-secondary-500 px-4 text-sm font-extrabold text-action"><SolarIcon icon="solar:diskette-linear" size={16} />Save task</button>
          <button type="button" onClick={onCancel} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-secondary-500/75 px-4 text-sm font-extrabold text-white/70"><SolarIcon icon="solar:close-circle-linear" size={16} />Cancel</button>
        </div>
      </form>
    </Panel>
  );
}

function TaskDetailPanel({ detail, comment, setComment, addComment }) {
  return (
    <Panel title="Task Comments / Activity Log" subtitle="History stays attached to the task">
      {!detail ? (
        <EmptyState label="Open a task to view comments." />
      ) : (
        <div className="grid gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase text-white/70">{detail.taskId}</p>
            <h3 className="mt-1 text-lg font-black text-white">{detail.taskTitle}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/70">{detail.workDetail}</p>
          </div>
          <form onSubmit={addComment} className="grid gap-2">
            <textarea className={textareaClass} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add comment" />
            <button type="submit" className="min-h-10 rounded-full bg-secondary-500 px-4 text-sm font-extrabold text-action">Add comment</button>
          </form>
          <div className="grid gap-2">
            {detail.comments.map((entry) => (
              <div key={entry.id} className="rounded-glass bg-secondary-500/75 p-3 text-sm">
                <div className="flex justify-between gap-2 font-extrabold text-white"><span>{entry.userName}</span><span>{dateShort(entry.createdDate)}</span></div>
                <p className="mt-1 leading-6 text-white/70">{entry.comment}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-2">
            {detail.activityLog.map((entry) => (
              <div key={entry.id} className="flex justify-between gap-3 border-t border-white/10 pt-2 text-xs font-bold text-white/70">
                <span>{entry.action}</span>
                <span>{dateShort(entry.createdDate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

function ProjectsPage({ data, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultProjectForm);

  function startCreate() {
    setEditing(null);
    setForm({ ...defaultProjectForm, projectId: nextCode("PRJ", data.projects, "projectId") });
    setShowForm(true);
  }

  async function saveProject(event) {
    event.preventDefault();
    if (editing) await api.updateProject(editing.id, form);
    else await api.createProject(form);
    setShowForm(false);
    await refresh();
  }

  return (
    <>
      <PageHeader eyebrow="Projects" title="Project Management" subtitle="Small project records with owners, dates, status, and priority." actionLabel="New project" onAction={startCreate} />
      {showForm ? <ProjectForm form={form} setForm={setForm} editing={editing} onSubmit={saveProject} onCancel={() => setShowForm(false)} /> : null}
      <Panel title="Projects" subtitle={`${data.projects.length} records`}>
        <Table
          columns={["ID", "Name", "Owner", "Department", "Due", "Status", "Priority", "Actions"]}
          rows={data.projects.map((project) => [
            project.projectId,
            project.projectName,
            project.owner,
            project.department,
            dateShort(project.dueDate),
            <StatusBadge value={project.status} />,
            <PriorityBadge value={project.priority} />,
            <RowActions onEdit={() => { setEditing(project); setForm(project); setShowForm(true); }} onDelete={async () => { await api.deleteProject(project.id); await refresh(); }} />
          ])}
        />
      </Panel>
    </>
  );
}

function ProjectForm({ form, setForm, editing, onSubmit, onCancel }) {
  return (
    <Panel title={editing ? "Edit Project" : "Create Project"} className="motion-dialog mb-4">
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-4">
        <TextInput label="Project ID" value={form.projectId} onChange={(value) => setForm({ ...form, projectId: value })} required />
        <TextInput label="Project Name" value={form.projectName} onChange={(value) => setForm({ ...form, projectName: value })} required className="md:col-span-2" />
        <TextInput label="Owner" value={form.owner} onChange={(value) => setForm({ ...form, owner: value })} required />
        <Select label="Department" value={form.department} onChange={(value) => setForm({ ...form, department: value })} options={departmentOptions} />
        <TextInput label="Start Date" type="date" value={form.startDate} onChange={(value) => setForm({ ...form, startDate: value })} />
        <TextInput label="Due Date" type="date" value={form.dueDate} onChange={(value) => setForm({ ...form, dueDate: value })} />
        <Select label="Status" value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={statusOptions} />
        <Select label="Priority" value={form.priority} onChange={(value) => setForm({ ...form, priority: value })} options={priorityOptions} />
        <TextArea label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} className="md:col-span-4" />
        <FormButtons submitLabel="Save project" onCancel={onCancel} />
      </form>
    </Panel>
  );
}

function SopsPage({ data, refresh, user }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultSopForm);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [folderForm, setFolderForm] = useState({ name: "", description: "" });
  const isAdmin = user?.role === "Admin";
  const sops = searchResults ?? data.sops;
  const liveMatches = useMemo(() => rankSopMatches(data.sops, query, 4), [data.sops, query]);
  const hasLiveQuery = query.trim().length > 0;

  function startCreate() {
    setEditing(null);
    setForm({
      ...defaultSopForm,
      sopId: nextCode("SOP", data.sops, "sopId"),
      folderId: data.sopFolders[0]?.id ?? "",
      category: data.sopFolders[0]?.name ?? "Operations"
    });
    setShowForm(true);
  }

  async function searchSops(event) {
    event.preventDefault();
    const result = await api.sops(query ? { q: query } : {});
    setSearchResults(query ? result : null);
  }

  async function saveSop(event) {
    event.preventDefault();
    const payload = {
      ...form,
      folderId: form.folderId ? Number(form.folderId) : null,
      reviewCycleMonths: Number(form.reviewCycleMonths ?? 12),
      relatedPolicies: linesToList(form.relatedPolicies),
      relatedControls: linesToList(form.relatedControls),
      relatedSystems: linesToList(form.relatedSystems),
      evidenceRequired: linesToList(form.evidenceRequired),
      requiredApprovals: linesToList(form.requiredApprovals),
      distributionList: linesToList(form.distributionList),
      trainingAudience: linesToList(form.trainingAudience),
      trainingRequired: Boolean(form.trainingRequired)
    };
    if (editing) await api.updateSop(editing.id, payload);
    else await api.createSop(payload);
    setShowForm(false);
    setEditing(null);
    await refresh();
  }

  async function saveFolder(event) {
    event.preventDefault();
    await api.createSopFolder(folderForm);
    setFolderForm({ name: "", description: "" });
    await refresh();
  }

  async function changeSopStatus(status) {
    if (!selected || !isAdmin) return;
    const updated = await api.updateSop(selected.id, { status });
    setSelected(updated);
    await refresh();
  }

  async function approveSelectedSop() {
    if (!selected || !isAdmin) return;
    await api.createSopApproval(selected.id, {
      reviewer: selected.reviewer || user?.name || "Admin",
      approver: selected.approver || user?.name || "Admin",
      decision: "Approved",
      comment: "Approved from SOP control center."
    });
    const refreshed = await api.sops({ q: selected.sopId });
    setSelected(refreshed[0] ?? selected);
    await refresh();
  }

  async function acknowledgeSelectedSop() {
    if (!selected) return;
    await api.createSopTrainingAcknowledgement(selected.id, {
      userName: user?.name ?? "Admin",
      role: user?.role ?? "User",
      note: "Acknowledged from SOP reader."
    });
    await refresh();
  }

  async function moveSelectedSop(toStatus) {
    if (!selected) return;
    await api.createSopLifecycleEvent(selected.id, {
      fromStatus: selected.status,
      toStatus,
      userName: user?.name ?? "System",
      reason: `Moved to ${toStatus} from SOP governance panel.`
    });
    const refreshed = await api.sops({ q: selected.sopId });
    setSelected(refreshed[0] ?? selected);
    await refresh();
  }

  async function addSelectedEvidence() {
    if (!selected) return;
    await api.createSopEvidence(selected.id, {
      evidenceName: selected.evidenceRequired?.[0] ?? "Control evidence",
      evidenceType: "document",
      evidenceUrl: selected.attachmentUrl || "https://intranet.example/evidence",
      controlReference: selected.relatedControls?.[0] ?? "",
      uploadedBy: user?.name ?? "System"
    });
    await refresh();
  }

  async function logSelectedException() {
    if (!selected) return;
    await api.createSopException(selected.id, {
      exceptionId: `EXC-${Date.now().toString().slice(-6)}`,
      reason: "Process exception logged from SOP reader.",
      impact: "Requires owner review.",
      workaround: selected.exceptionHandling || "Use approved temporary workaround.",
      owner: selected.processOwner || selected.owner,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      approvalRequired: true,
      closureEvidence: "",
      status: "Open"
    });
    await refresh();
  }

  return (
    <>
      <PageHeader eyebrow="SOP Control Center" title="Searchable SOP Library" subtitle="Find procedures, publish controlled documents, and attach folders, files, links, and images." actionLabel="New SOP" onAction={startCreate} />
      <form onSubmit={searchSops} className="mb-4 grid gap-3 rounded-[22px] border border-white/10 bg-secondary-500/80 p-4 shadow-lift md:grid-cols-[1fr_auto]">
        <div className="grid gap-2">
          <TextInput label="Search whole SOP" value={query} onChange={setQuery} placeholder="Search title, content, tags, category, owner, or description" />
          {hasLiveQuery ? (
            <div className="motion-pop rounded-glass border border-action/20 bg-secondary-500/70 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold uppercase text-white/60">
                <span>Live matches for "{query}"</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-secondary-500">{liveMatches.length ? `${liveMatches.length} found` : "No match"}</span>
              </div>
              {liveMatches.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {liveMatches.map((sop) => (
                    <button
                      key={sop.id}
                      type="button"
                      onClick={() => {
                        setSelected(sop);
                        setSearchResults([sop]);
                      }}
                      className="motion-interactive rounded-glass border border-white/10 bg-secondary-500/75 px-3 py-2 text-left text-sm font-semibold text-white/70 hover:border-action/40 hover:text-white"
                    >
                      <span className="block text-xs font-extrabold uppercase text-action">{sop.sopId} / {sop.documentType}</span>
                      <span className="block font-black text-white">{sop.sopName}</span>
                      <span className="block truncate">{sop.category || sop.folderName || sop.owner}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-semibold text-white/70">Keep typing or try another word from the SOP title, owner, tag, or description.</p>
              )}
            </div>
          ) : null}
        </div>
        <button type="submit" className="motion-interactive inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-extrabold text-secondary-500 md:self-end">
          <SolarIcon icon="solar:magnifer-linear" size={17} />
          Search
        </button>
      </form>
      {showForm ? (
        <SopForm
          form={form}
          setForm={setForm}
          folders={data.sopFolders}
          editing={editing}
          onSubmit={saveSop}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      ) : null}
      <section className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <div className="grid gap-4">
          <Panel title="Folders / Categories" subtitle="Add a folder before assigning documents">
            <form onSubmit={saveFolder} className="grid gap-2">
              <TextInput label="Category Name" value={folderForm.name} onChange={(value) => setFolderForm({ ...folderForm, name: value })} required />
              <TextInput label="Description" value={folderForm.description} onChange={(value) => setFolderForm({ ...folderForm, description: value })} />
              <button type="submit" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-secondary-500 px-4 text-sm font-extrabold text-action">
                <SolarIcon icon="solar:folder-plus-linear" size={16} />
                Add category
              </button>
            </form>
            <div className="mt-3 grid gap-2">
              {data.sopFolders.map((folder) => (
                <div key={folder.id} className="motion-list-item rounded-glass bg-secondary-500/75 px-3 py-2 text-sm font-semibold text-white/70">
                  <strong className="text-white">{folder.name}</strong>
                  <div>{folder.description}</div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="SOP List" subtitle={`${sops.length} documents shown`}>
          <div className="grid gap-3">
            {sops.map((sop, index) => (
              <article key={sop.id} className="motion-list-item motion-interactive rounded-[22px] border border-white/10 bg-secondary-500/80 p-4 shadow-lift" style={{ animationDelay: `${Math.min(120, index * 24)}ms` }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase text-white/70">{sop.sopId} / {sop.documentType}</p>
                    <h3 className="mt-1 text-base font-black text-white">{sop.sopName}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/70">{sop.purpose}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-extrabold text-white/70">{sop.category || sop.folderName || "Uncategorized"}</span>
                      {(sop.tags ?? []).slice(0, 3).map((tag) => <span key={tag} className="rounded-full border border-action/20 px-2.5 py-1 text-xs font-extrabold text-action">{tag}</span>)}
                    </div>
                  </div>
                  <StatusBadge value={sop.status} />
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setSelected(sop)} className="motion-interactive min-h-10 flex-1 rounded-full border border-white/10 bg-secondary-500/75 px-3 text-sm font-extrabold text-white hover:bg-secondary-400/80">Read</button>
                  <IconButton label="Edit" icon="solar:pen-linear" onClick={() => { setEditing(sop); setForm(sop); setShowForm(true); }} />
                  <IconButton label="Delete" icon="solar:trash-bin-trash-linear" danger onClick={async () => { await api.deleteSop(sop.id); await refresh(); }} />
                </div>
              </article>
            ))}
            {!sops.length ? <EmptyState label="No SOP documents found." /> : null}
          </div>
          </Panel>
        </div>
        <div className="grid gap-4">
          <Panel title="Instruction Page" subtitle="Readable document preview">
            {!selected ? (
              <EmptyState label="Select an SOP to read." />
            ) : (
              <SopReader
                sop={selected}
                isAdmin={isAdmin}
                onStatusChange={changeSopStatus}
                onApprove={approveSelectedSop}
                onAcknowledge={acknowledgeSelectedSop}
                onMoveStatus={moveSelectedSop}
                onAddEvidence={addSelectedEvidence}
                onLogException={logSelectedException}
              />
            )}
          </Panel>
        </div>
      </section>
    </>
  );
}

function SopForm({ form, setForm, folders, editing, onSubmit, onCancel }) {
  function setTags(value) {
    setForm({ ...form, tags: value.split(",").map((tag) => tag.trim()).filter(Boolean) });
  }

  function setImageUrls(value) {
    setForm({ ...form, imageUrls: value.split(",").map((url) => url.trim()).filter(Boolean) });
  }

  function setListField(field, value) {
    setForm({ ...form, [field]: value.split(",").map((entry) => entry.trim()).filter(Boolean) });
  }

  function setDistributionList(value) {
    setForm({ ...form, distributionList: value.split(",").map((entry) => entry.trim()).filter(Boolean) });
  }

  function setTrainingAudience(value) {
    setForm({ ...form, trainingAudience: value.split(",").map((entry) => entry.trim()).filter(Boolean) });
  }

  function attachImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm({ ...form, imageUrls: [...(form.imageUrls ?? []), String(reader.result)] });
    reader.readAsDataURL(file);
  }

  return (
    <Panel title={editing ? "Edit SOP Document" : "Create SOP Document"} subtitle="Compose the SOP like an internal email: title, metadata, body, links, images, then publish." className="motion-dialog mb-4">
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-4">
        <TextInput label="SOP ID" value={form.sopId} onChange={(value) => setForm({ ...form, sopId: value })} required />
        <TextInput label="Title" value={form.sopName} onChange={(value) => setForm({ ...form, sopName: value })} required className="md:col-span-3" />
        <Select label="Document Type" value={form.documentType} onChange={(value) => setForm({ ...form, documentType: value })} options={documentTypeOptions} />
        <Select label="Category" value={form.folderId} onChange={(value) => {
          const folder = folders.find((entry) => String(entry.id) === String(value));
          setForm({ ...form, folderId: value, category: folder?.name ?? form.category });
        }} options={["", ...folders.map((folder) => ({ value: folder.id, label: folder.name }))]} />
        <Select label="Department" value={form.department} onChange={(value) => setForm({ ...form, department: value })} options={departmentOptions} />
        <TextInput label="Owner" value={form.owner} onChange={(value) => setForm({ ...form, owner: value })} required />
        <Select label="Responsibility Level" value={form.responsibilityLevel ?? "L1 User / Staff"} onChange={(value) => setForm({ ...form, responsibilityLevel: value })} options={responsibilityLevelOptions} />
        <TextInput label="Responsible User" value={form.responsibleUser ?? ""} onChange={(value) => setForm({ ...form, responsibleUser: value })} />
        <TextInput label="Process Owner" value={form.processOwner ?? ""} onChange={(value) => setForm({ ...form, processOwner: value })} />
        <TextInput label="Control Owner" value={form.controlOwner ?? ""} onChange={(value) => setForm({ ...form, controlOwner: value })} />
        <TextInput label="Reviewer" value={form.reviewer ?? ""} onChange={(value) => setForm({ ...form, reviewer: value })} />
        <TextInput label="Approver" value={form.approver ?? ""} onChange={(value) => setForm({ ...form, approver: value })} />
        <TextInput label="Version" value={form.version} onChange={(value) => setForm({ ...form, version: value })} />
        <TextInput label="Effective Date" type="date" value={form.effectiveDate} onChange={(value) => setForm({ ...form, effectiveDate: value })} />
        <TextInput label="Expiry Date" type="date" value={form.expiryDate ?? ""} onChange={(value) => setForm({ ...form, expiryDate: value })} />
        <Select label="Status" value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={sopStatusOptions} />
        <TextInput label="Tags" value={(form.tags ?? []).join(", ")} onChange={setTags} placeholder="finance, onboarding, control" />
        <div className="rounded-glass border border-white/10 bg-secondary-500/75 p-3 md:col-span-4">
          <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3 text-sm font-black text-white">
            <SolarIcon icon="solar:hierarchy-square-linear" size={17} className="text-action" />
            Process Architecture
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <TextInput label="Business Unit" value={form.businessUnit ?? ""} onChange={(value) => setForm({ ...form, businessUnit: value })} />
            <TextInput label="Process Group" value={form.processGroup ?? ""} onChange={(value) => setForm({ ...form, processGroup: value })} />
            <TextInput label="Process Name" value={form.processName ?? ""} onChange={(value) => setForm({ ...form, processName: value })} />
            <TextInput label="Sub-process" value={form.subProcess ?? ""} onChange={(value) => setForm({ ...form, subProcess: value })} />
            <TextInput label="Upstream Process" value={form.upstreamProcess ?? ""} onChange={(value) => setForm({ ...form, upstreamProcess: value })} />
            <TextInput label="Downstream Process" value={form.downstreamProcess ?? ""} onChange={(value) => setForm({ ...form, downstreamProcess: value })} />
            <TextInput label="Related Policies" value={(form.relatedPolicies ?? []).join(", ")} onChange={(value) => setListField("relatedPolicies", value)} />
            <TextInput label="Related Systems" value={(form.relatedSystems ?? []).join(", ")} onChange={(value) => setListField("relatedSystems", value)} />
          </div>
        </div>
        <div className="rounded-glass border border-white/10 bg-secondary-500/75 p-3 md:col-span-4">
          <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3 text-sm font-black text-white">
            <SolarIcon icon="solar:checklist-minimalistic-linear" size={17} className="text-action" />
            Control And Compliance
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Select label="Business Criticality" value={form.businessCriticality ?? "Medium"} onChange={(value) => setForm({ ...form, businessCriticality: value })} options={criticalityOptions} />
            <Select label="Control Frequency" value={form.controlFrequency ?? "Monthly"} onChange={(value) => setForm({ ...form, controlFrequency: value })} options={controlFrequencyOptions} />
            <TextInput label="Audit Owner" value={form.auditOwner ?? ""} onChange={(value) => setForm({ ...form, auditOwner: value })} />
            <TextInput label="Auditor" value={form.auditor ?? ""} onChange={(value) => setForm({ ...form, auditor: value })} />
            <TextInput label="Related Controls" value={(form.relatedControls ?? []).join(", ")} onChange={(value) => setListField("relatedControls", value)} />
            <TextArea label="Control Objective" value={form.controlObjective ?? ""} onChange={(value) => setForm({ ...form, controlObjective: value })} className="md:col-span-2" />
            <TextArea label="Risk Mitigated" value={form.riskMitigated ?? ""} onChange={(value) => setForm({ ...form, riskMitigated: value })} className="md:col-span-2" />
            <TextInput label="Evidence Required" value={(form.evidenceRequired ?? []).join(", ")} onChange={(value) => setListField("evidenceRequired", value)} className="md:col-span-2" />
            <TextInput label="Required Approvals" value={(form.requiredApprovals ?? []).join(", ")} onChange={(value) => setListField("requiredApprovals", value)} className="md:col-span-2" />
            <TextArea label="Compliance Requirement" value={form.complianceRequirement ?? ""} onChange={(value) => setForm({ ...form, complianceRequirement: value })} className="md:col-span-2" />
            <TextArea label="Exception Handling" value={form.exceptionHandling ?? ""} onChange={(value) => setForm({ ...form, exceptionHandling: value })} className="md:col-span-2" />
          </div>
        </div>
        <div className="rounded-glass border border-white/10 bg-secondary-500/75 p-3 md:col-span-4">
          <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3 text-sm font-black text-white">
            <SolarIcon icon="solar:shield-check-linear" size={17} className="text-action" />
            Document Control
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Select label="Approval Status" value={form.approvalStatus ?? "Draft"} onChange={(value) => setForm({ ...form, approvalStatus: value })} options={approvalStatusOptions} />
            <TextInput label="Review Cycle Months" type="number" value={form.reviewCycleMonths ?? 12} onChange={(value) => setForm({ ...form, reviewCycleMonths: value })} />
            <TextInput label="Next Review Date" type="date" value={form.nextReviewDate ?? ""} onChange={(value) => setForm({ ...form, nextReviewDate: value })} />
            <Select label="Risk Level" value={form.riskLevel ?? "Medium"} onChange={(value) => setForm({ ...form, riskLevel: value })} options={riskOptions} />
            <Select label="Access Level" value={form.accessLevel ?? "Internal"} onChange={(value) => setForm({ ...form, accessLevel: value })} options={accessOptions} />
            <TextInput label="Retention Period" value={form.retentionPeriod ?? ""} onChange={(value) => setForm({ ...form, retentionPeriod: value })} placeholder="3 years, 7 years" />
            <TextInput label="Distribution List" value={(form.distributionList ?? []).join(", ")} onChange={setDistributionList} placeholder="Finance, Operations" />
            <TextInput label="Training Audience" value={(form.trainingAudience ?? []).join(", ")} onChange={setTrainingAudience} placeholder="Finance, Managers" />
            <TextInput label="Controlled Copy Location" value={form.controlledCopyLocation ?? ""} onChange={(value) => setForm({ ...form, controlledCopyLocation: value })} className="md:col-span-2" placeholder="SharePoint / SOP Library" />
            <Field label="Training Required">
              <label className="flex min-h-12 items-center gap-3 rounded-full border border-white/10 bg-secondary-500/75 px-4 text-sm font-extrabold text-white">
                <input type="checkbox" checked={Boolean(form.trainingRequired)} onChange={(event) => setForm({ ...form, trainingRequired: event.target.checked })} />
                Required before rollout
              </label>
            </Field>
            <TextArea label="Change Summary" value={form.changeSummary ?? ""} onChange={(value) => setForm({ ...form, changeSummary: value })} className="md:col-span-2" />
            <TextArea label="Change Reason" value={form.changeReason ?? ""} onChange={(value) => setForm({ ...form, changeReason: value })} className="md:col-span-2" />
          </div>
        </div>
        <TextArea label="Purpose" value={form.purpose} onChange={(value) => setForm({ ...form, purpose: value })} className="md:col-span-2" />
        <TextArea label="Scope" value={form.scope} onChange={(value) => setForm({ ...form, scope: value })} className="md:col-span-2" />
        <div className="rounded-glass border border-white/10 bg-secondary-500/75 p-3 md:col-span-4">
          <div className="mb-3 flex flex-wrap gap-2 border-b border-white/10 pb-3 text-xs font-extrabold uppercase text-white/70">
            <span className="rounded-full border border-white/10 px-2.5 py-1">To: SOP Library</span>
            <span className="rounded-full border border-white/10 px-2.5 py-1">Subject: {form.sopName || "Untitled SOP"}</span>
            <span className="rounded-full border border-action/20 px-2.5 py-1 text-action">{form.status}</span>
          </div>
          <TextArea label="Content" value={form.content} onChange={(value) => setForm({ ...form, content: value })} className="md:col-span-4" placeholder="<p>Write the SOP body, notes, and rich instructions here.</p>" />
        </div>
        <TextArea label="Description" value={form.steps} onChange={(value) => setForm({ ...form, steps: value })} className="md:col-span-4" />
        <div className="rounded-glass border border-white/10 bg-secondary-500/75 p-3 md:col-span-4">
          <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3 text-sm font-black text-white">
            <SolarIcon icon="solar:paperclip-linear" size={17} className="text-action" />
            Files And Images
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <TextInput label="Attachment URL" value={form.attachmentUrl} onChange={(value) => setForm({ ...form, attachmentUrl: value })} className="md:col-span-2" />
            <TextInput label="Image URLs" value={(form.imageUrls ?? []).join(", ")} onChange={setImageUrls} className="md:col-span-2" />
            <Field label="Upload Image">
              <input className={inputClass} type="file" accept="image/*" onChange={attachImage} />
            </Field>
          </div>
        </div>
        <FormButtons submitLabel="Save SOP" onCancel={onCancel} />
      </form>
    </Panel>
  );
}

function SopReader({ sop, isAdmin, onStatusChange, onApprove, onAcknowledge, onMoveStatus, onAddEvidence, onLogException }) {
  return (
    <article className="grid gap-4">
      <div>
        <p className="text-xs font-extrabold uppercase text-white/70">{sop.sopId} / {sop.documentType} / Version {sop.version}</p>
        <h3 className="mt-1 text-2xl font-black text-white">{sop.sopName}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge value={sop.status} />
          <span className="rounded-full border border-white/10 bg-secondary-500/75 px-2.5 py-1 text-xs font-extrabold text-white/70">{sop.department}</span>
          <span className="rounded-full border border-white/10 bg-secondary-500/75 px-2.5 py-1 text-xs font-extrabold text-white/70">{sop.category || sop.folderName || "Uncategorized"}</span>
          {(sop.tags ?? []).map((tag) => <span key={tag} className="rounded-full border border-action/20 px-2.5 py-1 text-xs font-extrabold text-action">{tag}</span>)}
        </div>
        {isAdmin && sop.status === "Draft" ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => onStatusChange("Published")} className="rounded-full bg-white px-3 py-2 text-xs font-extrabold text-secondary-500">Publish</button>
            <button type="button" onClick={() => onStatusChange("Archived")} className="rounded-full border border-white/10 bg-secondary-500/75 px-3 py-2 text-xs font-extrabold text-white/70">Archive</button>
          </div>
        ) : null}
      </div>
      <div className="rounded-glass border border-white/10 bg-secondary-500/75 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase text-action">Responsibility Matrix</p>
            <h4 className="mt-1 text-lg font-black text-white">{sop.responsibilityLevel || "L1 User / Staff"}</h4>
          </div>
          <span className="rounded-full border border-action/20 bg-action/10 px-3 py-1 text-xs font-extrabold text-action">
            Current Level
          </span>
        </div>
        <div className="mt-4 grid gap-3 text-sm font-semibold text-white/70 md:grid-cols-2">
          <ControlLine label="Responsible User" value={sop.responsibleUser || "-"} />
          <ControlLine label="Document Owner" value={sop.owner || "-"} />
          <ControlLine label="Task / Control Owner" value={sop.controlOwner || "-"} />
          <ControlLine label="Process Owner" value={sop.processOwner || "-"} />
          <ControlLine label="Reviewer" value={sop.reviewer || "-"} />
          <ControlLine label="Approver / Manager" value={sop.approver || "-"} />
          <ControlLine label="Admin Control" value="Admin manages settings, archive, and deletion" />
          <ControlLine label="Auditor" value={sop.auditor || sop.auditOwner || "-"} />
        </div>
      </div>
      <div className="rounded-glass border border-white/10 bg-secondary-500/75 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase text-action">Controlled Document</p>
            <h4 className="mt-1 text-lg font-black text-white">Approval, review, distribution, and training</h4>
          </div>
          <StatusBadge value={sop.approvalStatus || "Draft"} />
        </div>
        <div className="mt-4 grid gap-3 text-sm font-semibold text-white/70 md:grid-cols-2">
          <ControlLine label="Reviewer" value={sop.reviewer || "-"} />
          <ControlLine label="Approver" value={sop.approver || "-"} />
          <ControlLine label="Next Review" value={dateShort(sop.nextReviewDate)} />
          <ControlLine label="Review Cycle" value={`${sop.reviewCycleMonths ?? 12} months`} />
          <ControlLine label="Risk / Access" value={`${sop.riskLevel || "Medium"} / ${sop.accessLevel || "Internal"}`} />
          <ControlLine label="Retention" value={sop.retentionPeriod || "-"} />
          <ControlLine label="Distribution" value={(sop.distributionList ?? []).join(", ") || "-"} />
          <ControlLine label="Training Audience" value={(sop.trainingAudience ?? []).join(", ") || "-"} />
          <ControlLine label="Controlled Copy" value={sop.controlledCopyLocation || "-"} className="md:col-span-2" />
        </div>
        {(sop.changeSummary || sop.changeReason) ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {sop.changeSummary ? <SopSection title="Change Summary" body={sop.changeSummary} /> : null}
            {sop.changeReason ? <SopSection title="Change Reason" body={sop.changeReason} /> : null}
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {isAdmin && sop.approvalStatus !== "Approved" ? (
            <button type="button" onClick={onApprove} className="motion-interactive rounded-full bg-white px-3 py-2 text-xs font-extrabold text-secondary-500">Approve SOP</button>
          ) : null}
          {lifecycleStatusOptions.filter((status) => status !== sop.status).slice(0, 4).map((status) => (
            <button key={status} type="button" onClick={() => onMoveStatus(status)} className="motion-interactive rounded-full border border-white/10 bg-secondary-500/75 px-3 py-2 text-xs font-extrabold text-white/70">
              Move: {status}
            </button>
          ))}
          {sop.trainingRequired ? (
            <button type="button" onClick={onAcknowledge} className="motion-interactive rounded-full border border-action/30 bg-action/10 px-3 py-2 text-xs font-extrabold text-action">Acknowledge training</button>
          ) : null}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-glass border border-white/10 bg-secondary-500/75 p-4">
          <p className="text-xs font-extrabold uppercase text-action">Process Architecture</p>
          <h4 className="mt-1 text-lg font-black text-white">{sop.processName || "Process not mapped"}</h4>
          <div className="mt-3 grid gap-2 text-sm font-semibold text-white/70">
            <ControlLine label="Business Unit" value={sop.businessUnit || "-"} />
            <ControlLine label="Process Group" value={sop.processGroup || "-"} />
            <ControlLine label="Sub-process" value={sop.subProcess || "-"} />
            <ControlLine label="Upstream / Downstream" value={`${sop.upstreamProcess || "-"} -> ${sop.downstreamProcess || "-"}`} />
            <ControlLine label="Policies" value={(sop.relatedPolicies ?? []).join(", ") || "-"} />
            <ControlLine label="Systems" value={(sop.relatedSystems ?? []).join(", ") || "-"} />
          </div>
        </div>
        <div className="rounded-glass border border-white/10 bg-secondary-500/75 p-4">
          <p className="text-xs font-extrabold uppercase text-action">Control And Compliance</p>
          <h4 className="mt-1 text-lg font-black text-white">{sop.controlObjective || "Control objective not set"}</h4>
          <div className="mt-3 grid gap-2 text-sm font-semibold text-white/70">
            <ControlLine label="Criticality / Frequency" value={`${sop.businessCriticality || "Medium"} / ${sop.controlFrequency || "-"}`} />
            <ControlLine label="Controls" value={(sop.relatedControls ?? []).join(", ") || "-"} />
            <ControlLine label="Evidence Required" value={(sop.evidenceRequired ?? []).join(", ") || "-"} />
            <ControlLine label="Risk Mitigated" value={sop.riskMitigated || "-"} />
            <ControlLine label="Compliance" value={sop.complianceRequirement || "-"} />
            <ControlLine label="Audit Owner" value={sop.auditOwner || "-"} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={onAddEvidence} className="motion-interactive rounded-full bg-white px-3 py-2 text-xs font-extrabold text-secondary-500">Add evidence</button>
            <button type="button" onClick={onLogException} className="motion-interactive rounded-full border border-danger/20 bg-danger/10 px-3 py-2 text-xs font-extrabold text-danger">Log exception</button>
          </div>
        </div>
      </div>
      <SopSection title="Purpose" body={sop.purpose} />
      <SopSection title="Scope" body={sop.scope} />
      <SopSection title="Content" body={sop.content} />
      <div>
        <h4 className="mb-2 text-sm font-black text-white">Description</h4>
        <ol className="grid gap-2">
          {sop.steps.split("\n").filter(Boolean).map((step, index) => (
            <li key={`${step}-${index}`} className="rounded-glass bg-secondary-500/75 p-3 text-sm font-semibold leading-6 text-white">{step.replace(/^\d+\.\s*/, "")}</li>
          ))}
        </ol>
      </div>
      <div className="grid gap-1 text-sm font-semibold text-white/70">
        <span>Owner: <strong className="text-white">{sop.owner}</strong></span>
        <span>Effective Date: <strong className="text-white">{dateShort(sop.effectiveDate)}</strong></span>
        {sop.attachmentUrl ? <a className="font-extrabold text-action" href={sop.attachmentUrl}>URL / Attachment</a> : null}
      </div>
      {sop.imageUrls?.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {sop.imageUrls.map((url) => <img key={url.slice(0, 64)} src={url} alt={sop.sopName} className="max-h-48 rounded-glass border border-white/10 object-cover" />)}
        </div>
      ) : null}
    </article>
  );
}

function ControlLine({ label, value, className = "" }) {
  return (
    <div className={`rounded-glass bg-secondary-500/70 px-3 py-2 ${className}`}>
      <span className="block text-[11px] font-extrabold uppercase text-white/45">{label}</span>
      <strong className="mt-1 block text-white">{value}</strong>
    </div>
  );
}

function SopSection({ title, body }) {
  return (
    <div>
      <h4 className="mb-1 text-sm font-black text-white">{title}</h4>
      <p className="whitespace-pre-wrap text-sm font-semibold leading-6 text-white/70">{body}</p>
    </div>
  );
}

function linesToList(value) {
  if (Array.isArray(value)) return value;
  return String(value ?? "").split(/\n|,/).map((entry) => entry.trim()).filter(Boolean);
}

function useCasesFromText(value) {
  if (Array.isArray(value)) return value;
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, tool, impact, difficulty, status] = line.split("|").map((part) => part?.trim() ?? "");
      return {
        title: title || "AI Use Case",
        tool: tool || "ChatGPT",
        impact: impact || "Improve repeatable work",
        difficulty: difficulty || "Medium",
        status: status || "Backlog"
      };
    });
}

function listToText(value) {
  return Array.isArray(value) ? value.join("\n") : String(value ?? "");
}

function useCasesToText(value) {
  return Array.isArray(value)
    ? value.map((entry) => [entry.title, entry.tool, entry.impact, entry.difficulty, entry.status].join(" | ")).join("\n")
    : String(value ?? "");
}

function TransformationsPage({ data, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultTransformationForm);
  const [selected, setSelected] = useState(data.transformations[0] ?? null);
  const [query, setQuery] = useState("");
  const visible = data.transformations.filter((entry) => {
    const haystack = [
      entry.discoveryId,
      entry.clientName,
      entry.department,
      entry.currentWorkflow,
      entry.proposedSolution,
      entry.implementationPlan,
      ...entry.painPoints,
      ...entry.repetitiveTasks,
      ...entry.documentsUsed,
      ...entry.stakeholders,
      ...entry.aiUseCases.flatMap((useCase) => Object.values(useCase ?? {}))
    ].join(" ").toLowerCase();
    return !query.trim() || query.toLowerCase().split(/\s+/).every((term) => haystack.includes(term));
  });

  function startCreate() {
    setForm({
      ...defaultTransformationForm,
      discoveryId: nextCode("DISC", data.transformations, "discoveryId")
    });
    setShowForm(true);
  }

  async function saveTransformation(event) {
    event.preventDefault();
    const payload = {
      ...form,
      painPoints: linesToList(form.painPoints),
      repetitiveTasks: linesToList(form.repetitiveTasks),
      documentsUsed: linesToList(form.documentsUsed),
      stakeholders: linesToList(form.stakeholders),
      aiUseCases: useCasesFromText(form.aiUseCases)
    };
    const created = await api.createTransformation(payload);
    setSelected(created);
    setShowForm(false);
    await refresh();
  }

  return (
    <>
      <PageHeader
        eyebrow="Transformation Discovery"
        title="Workflow and AI Opportunity Map"
        subtitle="Capture client workflow, pain points, repetitive tasks, AI use cases, implementation steps, and training needs in one project-ready view."
        actionLabel="New discovery"
        onAction={startCreate}
      />
      {showForm ? (
        <TransformationForm
          form={form}
          setForm={setForm}
          onSubmit={saveTransformation}
          onCancel={() => setShowForm(false)}
        />
      ) : null}
      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="grid gap-4">
          <Panel title="Discovery Records" subtitle={`${visible.length} workflow maps shown`}>
            <div className="mb-3">
              <TextInput label="Search workflow, pain point, or AI use case" value={query} onChange={setQuery} placeholder="invoice, onboarding, workshop, summary" />
            </div>
            <div className="grid gap-3">
              {visible.map((entry, index) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelected(entry)}
                  className={`motion-list-item motion-interactive rounded-[22px] border p-4 text-left shadow-lift ${selected?.id === entry.id ? "border-action/40 bg-white/[0.07]" : "border-white/10 bg-secondary-500/80"}`}
                  style={{ animationDelay: `${Math.min(120, index * 24)}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase text-action">{entry.discoveryId} / {entry.department}</p>
                      <h3 className="mt-1 text-base font-black text-white">{entry.clientName}</h3>
                    </div>
                    <StatusBadge value={entry.status} />
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/70">{entry.currentWorkflow}</p>
                  <div className="mt-3 grid gap-2 text-xs font-bold text-white/60 sm:grid-cols-3">
                    <span>{entry.painPoints.length} pain points</span>
                    <span>{entry.aiUseCases.length} AI ideas</span>
                    <span>Owner: {entry.owner}</span>
                  </div>
                </button>
              ))}
              {!visible.length ? <EmptyState label="No transformation discovery records found." /> : null}
            </div>
          </Panel>
        </div>
        <TransformationDetail entry={selected} />
      </section>
    </>
  );
}

function TransformationForm({ form, setForm, onSubmit, onCancel }) {
  return (
    <Panel title="Create Transformation Discovery" subtitle="Use this as a workshop capture sheet: workflow, pain points, AI opportunities, implementation plan, and training needs." className="motion-dialog mb-4">
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-4">
        <TextInput label="Discovery ID" value={form.discoveryId} onChange={(value) => setForm({ ...form, discoveryId: value })} required />
        <TextInput label="Client / Department Name" value={form.clientName} onChange={(value) => setForm({ ...form, clientName: value })} required className="md:col-span-2" />
        <Select label="Department" value={form.department} onChange={(value) => setForm({ ...form, department: value })} options={departmentOptions} />
        <TextArea label="Current Workflow" value={form.currentWorkflow} onChange={(value) => setForm({ ...form, currentWorkflow: value })} required className="md:col-span-2" />
        <TextArea label="Pain Points" value={listToText(form.painPoints)} onChange={(value) => setForm({ ...form, painPoints: value })} className="md:col-span-2" />
        <TextArea label="Repetitive Tasks" value={listToText(form.repetitiveTasks)} onChange={(value) => setForm({ ...form, repetitiveTasks: value })} className="md:col-span-2" />
        <TextArea label="Documents Used" value={listToText(form.documentsUsed)} onChange={(value) => setForm({ ...form, documentsUsed: value })} className="md:col-span-2" />
        <TextArea label="Stakeholders" value={listToText(form.stakeholders)} onChange={(value) => setForm({ ...form, stakeholders: value })} className="md:col-span-2" />
        <TextArea
          label="AI Use Cases"
          value={useCasesToText(form.aiUseCases)}
          onChange={(value) => setForm({ ...form, aiUseCases: value })}
          placeholder="Title | Tool | Impact | Difficulty | Status"
          className="md:col-span-2"
        />
        <TextArea label="Proposed Solution" value={form.proposedSolution} onChange={(value) => setForm({ ...form, proposedSolution: value })} required className="md:col-span-2" />
        <TextArea label="Implementation Plan" value={form.implementationPlan} onChange={(value) => setForm({ ...form, implementationPlan: value })} className="md:col-span-2" />
        <TextArea label="Training Needed" value={form.trainingNeeded} onChange={(value) => setForm({ ...form, trainingNeeded: value })} className="md:col-span-2" />
        <Select label="Status" value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={["Discovery", "In Progress", "Pilot", "Training", "Rolled Out"]} />
        <TextInput label="Owner" value={form.owner} onChange={(value) => setForm({ ...form, owner: value })} />
        <FormButtons submitLabel="Save discovery" onCancel={onCancel} />
      </form>
    </Panel>
  );
}

function TransformationDetail({ entry }) {
  if (!entry) {
    return (
      <Panel title="Transformation Detail" subtitle="Select a discovery record to review.">
        <EmptyState label="No workflow selected." />
      </Panel>
    );
  }

  return (
    <div className="grid gap-4">
      <Panel title="Workflow Map" subtitle={`${entry.discoveryId} / ${entry.department}`}>
        <div className="grid gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase text-action">Current workflow</p>
            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-white/75">{entry.currentWorkflow}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <MiniList title="Pain Points" items={entry.painPoints} tone="danger" />
            <MiniList title="Repetitive Tasks" items={entry.repetitiveTasks} />
            <MiniList title="Documents Used" items={entry.documentsUsed} />
            <MiniList title="Stakeholders" items={entry.stakeholders} />
          </div>
          <div className="rounded-[22px] border border-white/10 bg-secondary-500/75 p-4">
            <p className="text-xs font-extrabold uppercase text-action">Proposed solution</p>
            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-white/75">{entry.proposedSolution}</p>
          </div>
        </div>
      </Panel>
      <Panel title="AI Use Case List" subtitle="Practical ideas for document, analysis, summary, checking, planning, and repetitive operation work">
        <div className="grid gap-3">
          {entry.aiUseCases.map((useCase, index) => (
            <article key={`${useCase.title}-${index}`} className="motion-list-item rounded-[18px] border border-white/10 bg-secondary-500/75 p-3" style={{ animationDelay: `${index * 24}ms` }}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-black text-white">{useCase.title}</h4>
                  <p className="mt-1 text-xs font-bold uppercase text-action">{useCase.tool}</p>
                </div>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-extrabold text-white/60">{useCase.difficulty} / {useCase.status}</span>
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/70">{useCase.impact}</p>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Implementation And Training" subtitle="Use this as the client-facing rollout skeleton">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-[18px] border border-white/10 bg-secondary-500/75 p-3">
            <p className="text-xs font-extrabold uppercase text-action">Implementation plan</p>
            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-white/70">{entry.implementationPlan}</p>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-secondary-500/75 p-3">
            <p className="text-xs font-extrabold uppercase text-action">Training needed</p>
            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-white/70">{entry.trainingNeeded}</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function MiniList({ title, items, tone = "action" }) {
  const color = tone === "danger" ? "text-danger" : "text-action";
  return (
    <div className="rounded-[18px] border border-white/10 bg-secondary-500/75 p-3">
      <p className={`text-xs font-extrabold uppercase ${color}`}>{title}</p>
      <div className="mt-2 grid gap-2">
        {items.map((item) => (
          <div key={item} className="rounded-full border border-white/10 px-3 py-2 text-sm font-semibold text-white/70">{item}</div>
        ))}
      </div>
    </div>
  );
}

function ReportsPage({ data }) {
  const reports = data.reports;
  const governance = reports?.governance ?? {};
  const governanceCards = [
    ["Pending review", governance.sopsPendingReview],
    ["Expiring soon", governance.sopsExpiringSoon],
    ["Expired SOPs", governance.expiredSops],
    ["High-risk SOPs", governance.highRiskSops],
    ["Missing owner", governance.missingOwner],
    ["Missing approval", governance.missingApproval],
    ["Open exceptions", governance.openExceptions],
    ["Overdue acknowledgements", governance.overdueAcknowledgements],
    ["Tasks without SOP", governance.tasksWithoutSopReference],
    ["Controls without evidence", governance.controlsWithoutEvidence]
  ];
  return (
    <>
      <PageHeader eyebrow="Enterprise Governance" title="Process Control Dashboard" subtitle="Review lifecycle, risk, ownership, exception, acknowledgement, and evidence gaps across the SOP operating model." />
      <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {governanceCards.map(([label, value]) => (
          <KpiCard key={label} label={label} value={value ?? 0} helper="Governance metric" icon="solar:shield-check-linear" tone={Number(value ?? 0) > 0 ? "warn" : "good"} />
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <ReportPanel title="By Status" rows={reports?.byStatus ?? []} />
        <ReportPanel title="By Priority" rows={reports?.byPriority ?? []} />
        <ReportPanel title="By Department" rows={reports?.byDepartment ?? []} />
      </section>
      <Panel title="Overdue Tasks" subtitle="Open items past due date" className="mt-4">
        <TaskList tasks={reports?.overdue ?? []} compact />
      </Panel>
    </>
  );
}

function ReportPanel({ title, rows }) {
  const max = Math.max(1, ...rows.map((row) => row.total));
  return (
    <Panel title={title}>
      <div className="grid gap-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex justify-between text-sm font-extrabold text-white"><span>{row.label}</span><span>{row.total}</span></div>
              <div className="h-2 rounded-full bg-secondary-400/25"><div className="h-2 rounded-full bg-action" style={{ width: `${(row.total / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SettingsPage({ data, user, refresh }) {
  const settings = data.settings;
  const [form, setForm] = useState(defaultUserForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const isAdmin = user?.role === "Admin";
  const filteredUsers = data.users.filter((account) =>
    account.name.toLowerCase().includes(userSearch.trim().toLowerCase())
  );

  async function addUser(event) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      await api.createUser(form, user);
      setForm(defaultUserForm);
      setNotice("User added. They can sign in with the password you set.");
      await refresh();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Settings" title="Phase 1 Configuration" subtitle="Local login, local SQLite storage, and prepared SharePoint list mapping." />
      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="User Management" subtitle={isAdmin ? "Admins can add local users" : "Admin role required"}>
          {isAdmin ? (
            <div className="motion-pop grid gap-4">
              <form onSubmit={addUser} className="grid gap-3 md:grid-cols-2">
                <TextInput label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
                <TextInput label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} type="email" required />
                <TextInput label="Password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} type="password" required />
                <Select label="Role" value={form.role} onChange={(value) => setForm({ ...form, role: value })} options={roleOptions} />
                <Select label="Department" value={form.department} onChange={(value) => setForm({ ...form, department: value })} options={departmentOptions} className="md:col-span-2" />
                <button type="submit" disabled={saving} className="motion-interactive inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-extrabold text-secondary-500 disabled:opacity-60 md:col-span-2">
                  <SolarIcon icon="solar:user-plus-linear" size={16} />
                  {saving ? "Adding user..." : "Add user"}
                </button>
              </form>
              {notice ? <div className="motion-pop rounded-glass border border-white/10 bg-secondary-500/75 px-3 py-2 text-sm font-bold text-white/80">{notice}</div> : null}
              <div className="grid gap-2">
                {data.users.map((account) => (
                  <div key={account.id} className="motion-list-item grid gap-1 rounded-glass bg-secondary-500/75 px-3 py-3 text-sm font-semibold text-white/70 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <strong className="text-white">{account.name}</strong>
                      <div>{account.email}</div>
                    </div>
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-extrabold text-action">L{account.userLevel} / {account.role} / {account.department}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="motion-pop rounded-glass border border-white/10 bg-secondary-500/75 px-4 py-6 text-sm font-semibold leading-6 text-white/70">
              Sign in with an admin account to add users. Your current role is <strong className="text-white">{user?.role ?? "Unknown"}</strong>.
            </div>
          )}
        </Panel>
        <Panel title="Local Demo Login" subtitle={isAdmin ? "Search by user name" : "Current login"}>
          {isAdmin ? (
            <div className="grid gap-3">
              <TextInput label="Search Name" value={userSearch} onChange={setUserSearch} placeholder="Type a user name" />
              <div className="grid gap-2">
                {filteredUsers.map((account) => (
                  <div key={account.id} className="motion-list-item grid gap-1 rounded-glass bg-secondary-500/75 px-3 py-3 text-sm font-semibold text-white/70">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-white">{account.name}</strong>
                      <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-extrabold text-action">Level {account.userLevel}</span>
                    </div>
                    <span>Email: <strong className="text-white">{account.email}</strong></span>
                    <span>Password: <strong className="text-white">{account.password}</strong></span>
                  </div>
                ))}
                {!filteredUsers.length ? <EmptyState label="No user found." /> : null}
              </div>
            </div>
          ) : (
            <div className="grid gap-2 text-sm font-semibold text-white/70">
              <span>Name: <strong className="text-white">{user?.name}</strong></span>
              <span>Email: <strong className="text-white">{user?.email}</strong></span>
              <span>Role: <strong className="text-white">L{user?.userLevel} / {user?.role}</strong></span>
            </div>
          )}
        </Panel>
        <Panel title="SharePoint Future Extension" subtitle={settings?.sharePointIntegration?.status ?? "prepared"}>
          <div className="grid gap-2 text-sm font-semibold text-white/70">
            {Object.entries(settings?.sharePointIntegration?.listMapping ?? {}).map(([key, value]) => (
              <div key={key} className="motion-list-item flex justify-between gap-3 rounded-glass bg-secondary-500/75 px-3 py-2">
                <span>{key}</span>
                <strong className="text-white">{value}</strong>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </>
  );
}

function Table({ columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} className="border-b border-white/10 px-3 py-3 text-left text-xs font-extrabold uppercase text-white/70">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="motion-list-item border-b border-white/10 last:border-b-0" style={{ animationDelay: `${Math.min(120, rowIndex * 24)}ms` }}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="px-3 py-3 font-semibold text-white">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RowActions({ onEdit, onDelete }) {
  return (
    <div className="flex gap-2">
      <IconButton label="Edit" icon="solar:pen-linear" onClick={onEdit} />
      <IconButton label="Delete" icon="solar:trash-bin-trash-linear" danger onClick={onDelete} />
    </div>
  );
}

function IconButton({ label, icon: Icon, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`motion-interactive inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-extrabold ${
        danger ? "border-danger/20 bg-danger/10 text-danger hover:bg-danger/20" : "border-white/10 bg-secondary-500/75 text-white/70 hover:bg-secondary-400/80 hover:text-white"
      }`}
    >
      <SolarIcon icon={Icon} size={16} />
    </button>
  );
}

function FormButtons({ submitLabel, onCancel }) {
  return (
    <div className="flex gap-2 md:col-span-4">
      <button type="submit" className="motion-interactive inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-extrabold text-secondary-500"><SolarIcon icon="solar:diskette-linear" size={16} />{submitLabel}</button>
      <button type="button" onClick={onCancel} className="motion-interactive inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-secondary-500/75 px-4 text-sm font-extrabold text-white/70"><SolarIcon icon="solar:close-circle-linear" size={16} />Cancel</button>
    </div>
  );
}

function TextInput({ label, value, onChange, className = "", type = "text", ...props }) {
  return (
    <div className={className}>
      <Field label={label}>
        <input className={inputClass} type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} {...props} />
      </Field>
    </div>
  );
}

function TextArea({ label, value, onChange, className = "", ...props }) {
  return (
    <div className={className}>
      <Field label={label}>
        <textarea className={textareaClass} value={value ?? ""} onChange={(event) => onChange(event.target.value)} {...props} />
      </Field>
    </div>
  );
}

function Select({ label, value, onChange, options, className = "" }) {
  return (
    <div className={className}>
      <Field label={label}>
        <select className={inputClass} value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => {
            const normalized = typeof option === "object" ? option : { value: option, label: option || "All" };
            return <option key={`${normalized.value}-${normalized.label}`} value={normalized.value}>{normalized.label}</option>;
          })}
        </select>
      </Field>
    </div>
  );
}
