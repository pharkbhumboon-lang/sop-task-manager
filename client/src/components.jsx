import { Icon } from "@iconify/react";

export const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "solar:chart-square-linear" },
  { id: "tasks", label: "My Tasks", icon: "solar:pulse-linear" },
  { id: "projects", label: "Projects", icon: "solar:server-square-update-linear" },
  { id: "sops", label: "SOP Library", icon: "solar:book-bookmark-linear" },
  { id: "transformations", label: "Transformation", icon: "solar:route-linear" },
  { id: "reports", label: "Reports", icon: "solar:graph-new-up-linear" },
  { id: "settings", label: "Settings", icon: "solar:settings-linear" }
];

export function SolarIcon({ icon, size = 18, className = "" }) {
  return <Icon icon={icon} width={size} height={size} className={className} />;
}

function SenySymbol() {
  return (
    <span className="seny-symbol" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <span key={row} className="seny-symbol-row">
          <span className="seny-symbol-bar w-3" />
          <span className="seny-symbol-bar w-5" />
        </span>
      ))}
    </span>
  );
}

export function Shell({ activePage, setActivePage, user, onLogout, children }) {
  return (
    <div className="min-h-screen bg-appbg p-3 text-ink lg:grid lg:grid-cols-[244px_1fr] lg:gap-3">
      <aside className="glass-dark flex flex-col rounded-[24px] border border-white/10 lg:min-h-[calc(100vh-24px)]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:block">
          <div>
            <div className="flex items-center gap-2">
              <SenySymbol />
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-action">Internal SOP</p>
            </div>
            <h1 className="mt-5 text-2xl font-semibold leading-tight text-white">SOP Control</h1>
          </div>
          <div className="flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70 lg:mt-5">
            <SolarIcon icon="solar:user-linear" size={15} />
            <span className="min-w-0 flex-1 truncate">{user?.name ?? "Current User"} / L{user?.userLevel ?? "-"}</span>
            <button type="button" onClick={onLogout} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-secondary-500">
              Log out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-3 pb-3 lg:grid lg:px-3">
          {navItems.map((item) => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePage(item.id)}
                className={`motion-interactive flex min-h-10 items-center gap-2.5 whitespace-nowrap rounded-full px-3 text-sm font-bold ${
                  active ? "bg-white text-secondary-500 shadow-glow" : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                }`}
                title={item.label}
              >
                <SolarIcon icon={item.icon} size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto hidden border-t border-white/10 px-4 py-4 text-[11px] font-semibold uppercase text-white/35 lg:flex lg:items-center lg:justify-between">
          <span>ERP SOP</span>
          <span>2026</span>
        </div>
      </aside>
      <main className="workspace-surface min-h-[calc(100vh-24px)] overflow-hidden rounded-[28px] border border-white/10 p-4 lg:p-6">{children}</main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, actionLabel, onAction }) {
  return (
    <header className="intro-panel mb-5 grid gap-4 rounded-[24px] p-6 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-action">{eyebrow}</p>
        <h2 className="text-balance text-4xl font-semibold leading-none text-white sm:text-5xl">{title}</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-white/62">{subtitle}</p>
      </div>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="motion-interactive inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-secondary-500 shadow-lift hover:bg-primary-100"
        >
          <SolarIcon icon="solar:arrow-right-linear" size={17} />
          {actionLabel}
        </button>
      ) : null}
    </header>
  );
}

export function Panel({ title, subtitle, children, className = "" }) {
  return (
    <section className={`motion-panel rounded-[22px] border border-white/10 bg-secondary-500/80 p-4 shadow-lift ${className}`}>
      <div className="mb-3">
        <h3 className="text-base font-black text-white">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-white/70">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function KpiCard({ label, value, helper, tone = "action", icon = "solar:chart-square-linear" }) {
  const color = {
    action: "text-action",
    good: "text-good",
    warn: "text-warn",
    danger: "text-danger",
    muted: "text-white/60"
  }[tone];

  return (
    <article className="motion-panel grid min-h-32 gap-2 rounded-[22px] border border-white/10 bg-secondary-500/80 p-4 shadow-lift">
      <div className={`flex items-center justify-between ${color}`}>
        <span className="text-xs font-extrabold uppercase text-white/70">{label}</span>
        {typeof icon === "string" ? <SolarIcon icon={icon} size={19} /> : icon}
      </div>
      <strong className="text-3xl font-black text-white">{value}</strong>
      <small className="text-sm text-white/70">{helper}</small>
    </article>
  );
}

export function StatusBadge({ value }) {
  const tone = {
    "Completed": "bg-good/10 text-good border-good/20",
    "Published": "bg-good/10 text-good border-good/20",
    "Approved": "bg-good/10 text-good border-good/20",
    "Archived": "bg-muted/10 text-white/60 border-line",
    "In Progress": "bg-action/10 text-action border-action/20",
    "In Review": "bg-action/10 text-action border-action/20",
    "Under Review": "bg-action/10 text-action border-action/20",
    "Changes Requested": "bg-warn/10 text-warn border-warn/20",
    "Retired": "bg-muted/10 text-white/60 border-line",
    "Waiting": "bg-warn/10 text-warn border-warn/20",
    "Not Started": "bg-muted/10 text-white/60 border-line",
    "Active": "bg-good/10 text-good border-good/20",
    "Draft": "bg-warn/10 text-warn border-warn/20"
  }[value] ?? "bg-muted/10 text-white/60 border-line";

  return <span className={`motion-pop inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${tone}`}>{value}</span>;
}

export function PriorityBadge({ value }) {
  const tone = {
    Urgent: "bg-danger/10 text-danger border-danger/20",
    High: "bg-warn/10 text-warn border-warn/20",
    Medium: "bg-action/10 text-action border-action/20",
    Low: "bg-muted/10 text-white/60 border-line"
  }[value] ?? "bg-muted/10 text-white/60 border-line";

  return <span className={`motion-pop inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${tone}`}>{value}</span>;
}

export function Field({ label, children }) {
  return (
    <label className="grid gap-1.5 text-xs font-extrabold uppercase text-white/70">
      {label}
      {children}
    </label>
  );
}

export const inputClass = "focus-ring min-h-12 w-full rounded-full border border-white/10 bg-[#171717]/70 px-4 text-sm font-semibold text-white shadow-soft placeholder:text-white/35";
export const textareaClass = "focus-ring min-h-24 w-full rounded-[18px] border border-white/10 bg-[#171717]/70 px-4 py-3 text-sm font-semibold text-white shadow-soft placeholder:text-white/35";

export function EmptyState({ label }) {
  return (
    <div className="motion-pop rounded-[22px] border border-dashed border-white/10 bg-secondary-500/75 px-4 py-8 text-center text-sm font-semibold text-white/60">
      {label}
    </div>
  );
}

export function FilterBar({ children }) {
  return (
    <div className="motion-panel mb-4 grid gap-3 rounded-[22px] border border-white/10 bg-secondary-500/80 p-4 shadow-lift md:grid-cols-4">
      <div className="flex items-center gap-2 text-sm font-extrabold text-white/70 md:col-span-4">
        <SolarIcon icon="solar:filter-linear" size={17} />
        Filters
      </div>
      {children}
    </div>
  );
}

export function dateShort(value) {
  if (!value) return "-";
  return value.slice(0, 10);
}

export function isOverdue(task) {
  return task.status !== "Completed" && task.dueDate < new Date().toISOString().slice(0, 10);
}

export const defaultTaskForm = {
  taskId: "",
  taskTitle: "",
  projectId: "",
  workDetail: "",
  sopId: "",
  assignedTo: "Nok",
  priority: "Medium",
  startDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  status: "Not Started",
  progressPercent: 0,
  attachmentUrl: "",
  createdBy: "Admin"
};

export const defaultProjectForm = {
  projectId: "",
  projectName: "",
  description: "",
  owner: "Admin",
  department: "Operations",
  startDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  status: "Not Started",
  priority: "Medium"
};

export const defaultSopForm = {
  sopId: "",
  sopName: "",
  documentType: "Procedure",
  category: "Operations",
  department: "Operations",
  purpose: "",
  scope: "",
  steps: "1. \n2. \n3. ",
  content: "",
  tags: [],
  owner: "Admin",
  responsibilityLevel: "L1 User / Staff",
  responsibleUser: "Assigned User",
  processOwner: "Process Owner",
  controlOwner: "Task Owner",
  businessCriticality: "Medium",
  expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  businessUnit: "Enterprise Operations",
  processGroup: "Governance",
  processName: "",
  subProcess: "",
  relatedPolicies: [],
  relatedControls: [],
  relatedSystems: [],
  upstreamProcess: "",
  downstreamProcess: "",
  controlObjective: "",
  controlFrequency: "Monthly",
  evidenceRequired: [],
  riskMitigated: "",
  complianceRequirement: "",
  auditOwner: "Internal Audit",
  auditor: "Auditor",
  exceptionHandling: "",
  requiredApprovals: [],
  reviewer: "",
  approver: "",
  approvalStatus: "Draft",
  reviewCycleMonths: 12,
  nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  changeSummary: "",
  changeReason: "",
  riskLevel: "Medium",
  accessLevel: "Internal",
  retentionPeriod: "3 years",
  distributionList: [],
  trainingRequired: true,
  trainingAudience: [],
  controlledCopyLocation: "SharePoint / SOP Library",
  version: "1.0",
  effectiveDate: new Date().toISOString().slice(0, 10),
  status: "Draft",
  attachmentUrl: "",
  imageUrls: [],
  folderId: ""
};

export const defaultTransformationForm = {
  discoveryId: "",
  clientName: "",
  department: "Operations",
  currentWorkflow: "",
  painPoints: "Manual follow-up\nScattered documents\nUnclear owner",
  repetitiveTasks: "Summarize notes\nPrepare status update\nCheck missing evidence",
  documentsUsed: "SOP draft\nGoogle Sheet\nProgress report",
  stakeholders: "Client owner\nProject specialist\nInternal team",
  aiUseCases: "Workshop Summary Assistant | ChatGPT | Faster workshop recap and clearer next steps | Low | Pilot",
  proposedSolution: "",
  implementationPlan: "Discovery > Workflow Map > AI Use Case Pilot > Training > Rollout",
  trainingNeeded: "",
  status: "Discovery",
  owner: "Admin"
};

export const kpiIcons = {
  total: "solar:users-group-two-rounded-linear",
  progress: "solar:pulse-linear",
  waiting: "solar:server-square-update-linear",
  completed: "solar:chart-square-linear",
  overdue: "solar:danger-triangle-linear"
};
