import { createClient } from "@supabase/supabase-js";

const viteEnv = import.meta.env ?? {};
const nodeEnv = globalThis.process?.env ?? {};
const portfolioSupabaseUrl = "https://prnshqbcwwimcdqnocwi.supabase.co";
const portfolioSupabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybnNocWJjd3dpbWNkcW5vY3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3OTYzMTAsImV4cCI6MjA5NzM3MjMxMH0.6HSpSBiArexxHMXrz5Ikizm3_Z6qU_kXXID30OJS4hg";
const supabaseUrl = viteEnv.VITE_SUPABASE_URL ?? nodeEnv.VITE_SUPABASE_URL ?? (viteEnv.PROD ? portfolioSupabaseUrl : "");
const supabaseAnonKey = viteEnv.VITE_SUPABASE_ANON_KEY ?? nodeEnv.VITE_SUPABASE_ANON_KEY ?? (viteEnv.PROD ? portfolioSupabaseAnonKey : "");

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isSupabaseMode = viteEnv.VITE_DATA_BACKEND === "supabase" || nodeEnv.VITE_DATA_BACKEND === "supabase" || (viteEnv.PROD && isSupabaseConfigured);
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

const ROLE_LEVELS = { Admin: 1, Manager: 2, User: 3, Member: 3 };

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  return supabase;
}

function levelForRole(role) {
  return ROLE_LEVELS[role] ?? 3;
}

function list(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value).split(",").map((entry) => entry.trim()).filter(Boolean);
  }
}

function withDefaults(row = {}) {
  return row ?? {};
}

export function providerForMicrosoft() {
  return "azure";
}

export function mapProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role ?? "User",
    department: row.department ?? "Operations",
    userLevel: levelForRole(row.role)
  };
}

export function mapProject(row) {
  row = withDefaults(row);
  return {
    id: row.id,
    projectId: row.project_code,
    projectName: row.project_name,
    description: row.description ?? "",
    owner: row.owner,
    department: row.department,
    startDate: row.start_date,
    dueDate: row.due_date,
    status: row.status,
    priority: row.priority,
    createdDate: row.created_date,
    updatedDate: row.updated_date
  };
}

export function mapTask(row) {
  row = withDefaults(row);
  return {
    id: row.id,
    taskId: row.task_code,
    taskTitle: row.task_title,
    projectId: row.project_id,
    projectName: row.project_name ?? row.projects?.project_name ?? "",
    workDetail: row.work_detail ?? "",
    sopId: row.sop_id,
    sopName: row.sop_name ?? row.sops?.sop_name ?? "",
    assignedTo: row.assigned_to ?? "",
    priority: row.priority ?? "Medium",
    startDate: row.start_date ?? "",
    dueDate: row.due_date ?? "",
    status: row.status ?? "Not Started",
    progressPercent: row.progress_percent ?? 0,
    attachmentUrl: row.attachment_url ?? "",
    createdBy: row.created_by ?? "",
    createdDate: row.created_date,
    updatedDate: row.updated_date
  };
}

function mapComment(row) {
  return {
    id: row.id,
    taskId: row.task_id,
    userName: row.user_name,
    comment: row.comment,
    createdDate: row.created_date
  };
}

function mapActivity(row) {
  return {
    id: row.id,
    taskId: row.task_id,
    userName: row.user_name,
    action: row.action,
    details: row.details,
    createdDate: row.created_date
  };
}

function mapSop(row) {
  row = withDefaults(row);
  return {
    id: row.id,
    sopId: row.sop_code,
    sopName: row.sop_name,
    documentType: row.document_type ?? "Procedure",
    category: row.category ?? "",
    department: row.department,
    purpose: row.purpose ?? "",
    scope: row.scope ?? "",
    steps: row.steps ?? "",
    content: row.content ?? row.steps ?? "",
    tags: list(row.tags),
    owner: row.owner,
    responsibilityLevel: row.responsibility_level ?? "L1 User / Staff",
    responsibleUser: row.responsible_user ?? "",
    processOwner: row.process_owner ?? "",
    controlOwner: row.control_owner ?? "",
    businessCriticality: row.business_criticality ?? "Medium",
    expiryDate: row.expiry_date ?? "",
    businessUnit: row.business_unit ?? "",
    processGroup: row.process_group ?? "",
    processName: row.process_name ?? "",
    subProcess: row.sub_process ?? "",
    relatedPolicies: list(row.related_policies),
    relatedControls: list(row.related_controls),
    relatedSystems: list(row.related_systems),
    upstreamProcess: row.upstream_process ?? "",
    downstreamProcess: row.downstream_process ?? "",
    controlObjective: row.control_objective ?? "",
    controlFrequency: row.control_frequency ?? "",
    evidenceRequired: list(row.evidence_required),
    riskMitigated: row.risk_mitigated ?? "",
    complianceRequirement: row.compliance_requirement ?? "",
    auditOwner: row.audit_owner ?? "",
    auditor: row.auditor ?? "",
    exceptionHandling: row.exception_handling ?? "",
    requiredApprovals: list(row.required_approvals),
    reviewer: row.reviewer ?? "",
    approver: row.approver ?? "",
    approvalStatus: row.approval_status ?? "Draft",
    reviewCycleMonths: row.review_cycle_months ?? 12,
    nextReviewDate: row.next_review_date ?? "",
    changeSummary: row.change_summary ?? "",
    changeReason: row.change_reason ?? "",
    riskLevel: row.risk_level ?? "Medium",
    accessLevel: row.access_level ?? "Internal",
    retentionPeriod: row.retention_period ?? "",
    distributionList: list(row.distribution_list),
    trainingRequired: Boolean(row.training_required),
    trainingAudience: list(row.training_audience),
    controlledCopyLocation: row.controlled_copy_location ?? "",
    version: row.version,
    effectiveDate: row.effective_date,
    status: row.status,
    attachmentUrl: row.attachment_url ?? "",
    imageUrls: list(row.image_urls),
    folderId: row.folder_id,
    folderName: row.sop_folders?.name ?? row.folder_name ?? null,
    createdDate: row.created_date,
    updatedDate: row.updated_date
  };
}

function mapSopFolder(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    createdDate: row.created_date,
    updatedDate: row.updated_date
  };
}

function mapSopFile(row) {
  return {
    id: row.id,
    sopId: row.sop_id,
    folderId: row.folder_id,
    fileName: row.file_name,
    fileType: row.file_type,
    fileUrl: row.file_url,
    createdDate: row.created_date
  };
}

function mapLifecycle(row) {
  return {
    id: row.id,
    sopId: row.sop_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    userName: row.user_name,
    reason: row.reason,
    createdDate: row.created_date
  };
}

function mapEvidence(row) {
  return {
    id: row.id,
    sopId: row.sop_id,
    evidenceName: row.evidence_name,
    evidenceType: row.evidence_type,
    evidenceUrl: row.evidence_url,
    controlReference: row.control_reference,
    uploadedBy: row.uploaded_by,
    createdDate: row.created_date
  };
}

function mapException(row) {
  return {
    id: row.id,
    sopId: row.sop_id,
    exceptionId: row.exception_code,
    reason: row.reason,
    impact: row.impact,
    workaround: row.workaround,
    owner: row.owner,
    dueDate: row.due_date,
    approvalRequired: Boolean(row.approval_required),
    closureEvidence: row.closure_evidence,
    status: row.status,
    createdDate: row.created_date,
    updatedDate: row.updated_date
  };
}

function mapApproval(row) {
  return {
    id: row.id,
    sopId: row.sop_id,
    reviewer: row.reviewer,
    approver: row.approver,
    decision: row.decision,
    comment: row.comment,
    createdDate: row.created_date
  };
}

function mapTraining(row) {
  return {
    id: row.id,
    sopId: row.sop_id,
    userName: row.user_name,
    role: row.role,
    note: row.note,
    acknowledgedDate: row.acknowledged_date
  };
}

function mapTransformation(row) {
  return {
    id: row.id,
    discoveryId: row.discovery_code,
    clientName: row.client_name,
    department: row.department,
    currentWorkflow: row.current_workflow,
    painPoints: list(row.pain_points),
    repetitiveTasks: list(row.repetitive_tasks),
    documentsUsed: list(row.documents_used),
    stakeholders: list(row.stakeholders),
    aiUseCases: list(row.ai_use_cases),
    proposedSolution: row.proposed_solution,
    implementationPlan: row.implementation_plan,
    trainingNeeded: row.training_needed,
    status: row.status,
    owner: row.owner,
    createdDate: row.created_date,
    updatedDate: row.updated_date
  };
}

function snakeList(value) {
  return Array.isArray(value) ? value : list(value);
}

function projectPayload(payload) {
  return {
    project_code: payload.projectId,
    project_name: payload.projectName,
    description: payload.description ?? "",
    owner: payload.owner,
    department: payload.department,
    start_date: payload.startDate,
    due_date: payload.dueDate,
    status: payload.status,
    priority: payload.priority
  };
}

function taskPayload(payload, user) {
  return {
    task_code: payload.taskId,
    task_title: payload.taskTitle,
    project_id: Number(payload.projectId),
    work_detail: payload.workDetail,
    sop_id: payload.sopId ? Number(payload.sopId) : null,
    assigned_to: payload.assignedTo,
    priority: payload.priority,
    start_date: payload.startDate,
    due_date: payload.dueDate,
    status: payload.status,
    progress_percent: Number(payload.progressPercent ?? 0),
    attachment_url: payload.attachmentUrl ?? "",
    created_by: payload.createdBy ?? user?.name ?? "Portfolio User"
  };
}

function sopPayload(payload) {
  return {
    sop_code: payload.sopId,
    sop_name: payload.sopName,
    document_type: payload.documentType,
    category: payload.category ?? "",
    department: payload.department,
    purpose: payload.purpose,
    scope: payload.scope,
    steps: payload.steps ?? payload.content ?? "",
    content: payload.content ?? payload.steps ?? "",
    tags: snakeList(payload.tags),
    owner: payload.owner,
    responsibility_level: payload.responsibilityLevel,
    responsible_user: payload.responsibleUser ?? "",
    process_owner: payload.processOwner ?? "",
    control_owner: payload.controlOwner ?? "",
    business_criticality: payload.businessCriticality ?? "Medium",
    expiry_date: payload.expiryDate ?? "",
    business_unit: payload.businessUnit ?? "",
    process_group: payload.processGroup ?? "",
    process_name: payload.processName ?? "",
    sub_process: payload.subProcess ?? "",
    related_policies: snakeList(payload.relatedPolicies),
    related_controls: snakeList(payload.relatedControls),
    related_systems: snakeList(payload.relatedSystems),
    upstream_process: payload.upstreamProcess ?? "",
    downstream_process: payload.downstreamProcess ?? "",
    control_objective: payload.controlObjective ?? "",
    control_frequency: payload.controlFrequency ?? "",
    evidence_required: snakeList(payload.evidenceRequired),
    risk_mitigated: payload.riskMitigated ?? "",
    compliance_requirement: payload.complianceRequirement ?? "",
    audit_owner: payload.auditOwner ?? "",
    auditor: payload.auditor ?? "",
    exception_handling: payload.exceptionHandling ?? "",
    required_approvals: snakeList(payload.requiredApprovals),
    reviewer: payload.reviewer ?? "",
    approver: payload.approver ?? "",
    approval_status: payload.approvalStatus ?? "Draft",
    review_cycle_months: Number(payload.reviewCycleMonths ?? 12),
    next_review_date: payload.nextReviewDate ?? "",
    change_summary: payload.changeSummary ?? "",
    change_reason: payload.changeReason ?? "",
    risk_level: payload.riskLevel ?? "Medium",
    access_level: payload.accessLevel ?? "Internal",
    retention_period: payload.retentionPeriod ?? "",
    distribution_list: snakeList(payload.distributionList),
    training_required: Boolean(payload.trainingRequired),
    training_audience: snakeList(payload.trainingAudience),
    controlled_copy_location: payload.controlledCopyLocation ?? "",
    version: payload.version,
    effective_date: payload.effectiveDate,
    status: payload.status,
    attachment_url: payload.attachmentUrl ?? "",
    image_urls: snakeList(payload.imageUrls),
    folder_id: payload.folderId ? Number(payload.folderId) : null
  };
}

function transformationPayload(payload) {
  return {
    discovery_code: payload.discoveryId,
    client_name: payload.clientName,
    department: payload.department,
    current_workflow: payload.currentWorkflow,
    pain_points: snakeList(payload.painPoints),
    repetitive_tasks: snakeList(payload.repetitiveTasks),
    documents_used: snakeList(payload.documentsUsed),
    stakeholders: snakeList(payload.stakeholders),
    ai_use_cases: snakeList(payload.aiUseCases),
    proposed_solution: payload.proposedSolution ?? "",
    implementation_plan: payload.implementationPlan ?? "",
    training_needed: payload.trainingNeeded ?? "",
    status: payload.status,
    owner: payload.owner
  };
}

async function run(query) {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

async function profileForSession(sessionUser) {
  if (!sessionUser) return null;
  const client = requireSupabase();
  let profile = await run(client.from("profiles").select("*").eq("id", sessionUser.id).maybeSingle());
  if (!profile) {
    const name = sessionUser.user_metadata?.full_name ?? sessionUser.email?.split("@")[0] ?? "Portfolio User";
    profile = await run(client.from("profiles").upsert({
      id: sessionUser.id,
      name,
      email: sessionUser.email,
      role: "User",
      department: "Operations"
    }).select("*").single());
  }
  return mapProfile(profile);
}

async function currentUser() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return profileForSession(data.user);
}

async function fetchTasks(filters = {}) {
  const client = requireSupabase();
  let query = client
    .from("tasks")
    .select("*, projects(project_name), sops(sop_name)")
    .order("updated_date", { ascending: false });
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.projectId) query = query.eq("project_id", Number(filters.projectId));
  if (filters.assignedTo) query = query.eq("assigned_to", filters.assignedTo);
  if (filters.priority) query = query.eq("priority", filters.priority);
  return (await run(query)).map(mapTask);
}

export function buildDashboard(tasks, today = new Date().toISOString().slice(0, 10)) {
  const sorted = [...tasks].sort((a, b) => String(b.updatedDate ?? "").localeCompare(String(a.updatedDate ?? "")));
  return {
    metrics: {
      totalTasks: tasks.length,
      inProgressTasks: tasks.filter((task) => task.status === "In Progress").length,
      waitingTasks: tasks.filter((task) => task.status === "Waiting").length,
      completedTasks: tasks.filter((task) => task.status === "Completed").length,
      overdueTasks: tasks.filter((task) => task.status !== "Completed" && task.dueDate && task.dueDate < today).length
    },
    recentTasks: sorted.slice(0, 5)
  };
}

async function buildReports() {
  const [tasks, projects, sops, exceptions, acknowledgements, evidence] = await Promise.all([
    fetchTasks(),
    supabaseApi.projects(),
    supabaseApi.sops(),
    run(requireSupabase().from("sop_exceptions").select("*")),
    run(requireSupabase().from("sop_training_acknowledgements").select("*")),
    run(requireSupabase().from("sop_evidence").select("*"))
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const plus30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const countBy = (rows, key) => Object.values(rows.reduce((acc, row) => {
    const label = row[key] || "Unassigned";
    acc[label] = acc[label] ?? { label, total: 0 };
    acc[label].total += 1;
    return acc;
  }, {})).sort((a, b) => b.total - a.total);
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const acknowledgedSopIds = new Set(acknowledgements.map((row) => row.sop_id));
  const evidenceKeys = new Set(evidence.map((row) => `${row.sop_id}:${row.control_reference}`));

  return {
    byStatus: countBy(tasks, "status"),
    byPriority: countBy(tasks, "priority"),
    byDepartment: countBy(tasks.map((task) => ({ department: projectById.get(task.projectId)?.department })), "department"),
    overdue: tasks.filter((task) => task.status !== "Completed" && task.dueDate < today),
    governance: {
      sopsPendingReview: sops.filter((sop) => ["Draft", "In Review", "Under Review", "Changes Requested"].includes(sop.status) || sop.approvalStatus === "Pending Review").length,
      sopsExpiringSoon: sops.filter((sop) => sop.expiryDate && sop.expiryDate <= plus30).length,
      expiredSops: sops.filter((sop) => sop.expiryDate && sop.expiryDate < today).length,
      highRiskSops: sops.filter((sop) => ["High", "Critical"].includes(sop.riskLevel) || sop.businessCriticality === "Critical").length,
      missingOwner: sops.filter((sop) => !sop.owner || !sop.processOwner).length,
      missingApproval: sops.filter((sop) => !sop.approver || sop.approvalStatus !== "Approved").length,
      openExceptions: exceptions.filter((entry) => entry.status !== "Closed").length,
      overdueAcknowledgements: sops.filter((sop) => sop.trainingRequired && !acknowledgedSopIds.has(sop.id)).length,
      tasksWithoutSopReference: tasks.filter((task) => !task.sopId).length,
      controlsWithoutEvidence: sops.reduce((total, sop) => total + (sop.relatedControls ?? []).filter((control) => !evidenceKeys.has(`${sop.id}:${control}`)).length, 0)
    }
  };
}

export const supabaseApi = {
  currentUser,
  onAuthStateChange(callback) {
    const client = requireSupabase();
    const { data } = client.auth.onAuthStateChange(async (_event, session) => {
      callback(await profileForSession(session?.user));
    });
    return () => data.subscription.unsubscribe();
  },
  signInWithProvider(provider) {
    const client = requireSupabase();
    const selectedProvider = provider === "microsoft" ? providerForMicrosoft() : provider;
    return run(client.auth.signInWithOAuth({
      provider: selectedProvider,
      options: { redirectTo: window.location.origin }
    }));
  },
  async logout() {
    await requireSupabase().auth.signOut();
  },
  login: async ({ email, password }) => {
    const client = requireSupabase();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    const user = await profileForSession(data.user);
    return { user };
  },
  dashboard: async () => buildDashboard(await fetchTasks()),
  reports: buildReports,
  settings: async () => ({
    sharePointIntegration: "Prepared for future extension. Supabase is active for this portfolio deployment.",
    departments: ["Operations", "Finance", "HR", "IT", "Sales"],
    statuses: ["Not Started", "In Progress", "Waiting", "Completed"],
    priorities: ["Low", "Medium", "High", "Urgent"]
  }),
  users: async () => (await run(requireSupabase().from("profiles").select("*").order("name"))).map(mapProfile),
  createUser: async (payload) => mapProfile(await run(requireSupabase().from("profiles").insert(payload).select("*").single())),
  projects: async () => (await run(requireSupabase().from("projects").select("*").order("updated_date", { ascending: false }))).map(mapProject),
  createProject: async (payload) => mapProject(await run(requireSupabase().from("projects").insert(projectPayload(payload)).select("*").single())),
  updateProject: async (id, payload) => mapProject(await run(requireSupabase().from("projects").update(projectPayload(payload)).eq("id", id).select("*").single())),
  deleteProject: async (id) => run(requireSupabase().from("projects").delete().eq("id", id)),
  sops: async (params = {}) => {
    let query = requireSupabase().from("sops").select("*, sop_folders(name)").order("updated_date", { ascending: false });
    if (params.search) {
      query = query.or(`sop_name.ilike.%${params.search}%,content.ilike.%${params.search}%,category.ilike.%${params.search}%`);
    }
    return (await run(query)).map(mapSop);
  },
  createSop: async (payload) => mapSop(await run(requireSupabase().from("sops").insert(sopPayload(payload)).select("*, sop_folders(name)").single())),
  updateSop: async (id, payload) => mapSop(await run(requireSupabase().from("sops").update(sopPayload(payload)).eq("id", id).select("*, sop_folders(name)").single())),
  deleteSop: async (id) => run(requireSupabase().from("sops").delete().eq("id", id)),
  sopApprovals: async (id) => (await run(requireSupabase().from("sop_approvals").select("*").eq("sop_id", id).order("created_date", { ascending: false }))).map(mapApproval),
  createSopApproval: async (id, payload) => mapApproval(await run(requireSupabase().from("sop_approvals").insert({ sop_id: id, reviewer: payload.reviewer, approver: payload.approver, decision: payload.decision, comment: payload.comment ?? "" }).select("*").single())),
  sopTrainingAcknowledgements: async (id) => (await run(requireSupabase().from("sop_training_acknowledgements").select("*").eq("sop_id", id).order("acknowledged_date", { ascending: false }))).map(mapTraining),
  createSopTrainingAcknowledgement: async (id, payload) => mapTraining(await run(requireSupabase().from("sop_training_acknowledgements").insert({ sop_id: id, user_name: payload.userName, role: payload.role ?? "", note: payload.note ?? "" }).select("*").single())),
  sopGovernance: async (id) => {
    const client = requireSupabase();
    const [lifecycleEvents, evidence, exceptions] = await Promise.all([
      run(client.from("sop_lifecycle_events").select("*").eq("sop_id", id).order("created_date", { ascending: false })),
      run(client.from("sop_evidence").select("*").eq("sop_id", id).order("created_date", { ascending: false })),
      run(client.from("sop_exceptions").select("*").eq("sop_id", id).order("updated_date", { ascending: false }))
    ]);
    return { lifecycleEvents: lifecycleEvents.map(mapLifecycle), evidence: evidence.map(mapEvidence), exceptions: exceptions.map(mapException) };
  },
  createSopLifecycleEvent: async (id, payload) => mapLifecycle(await run(requireSupabase().from("sop_lifecycle_events").insert({ sop_id: id, from_status: payload.fromStatus, to_status: payload.toStatus, user_name: payload.userName, reason: payload.reason ?? "" }).select("*").single())),
  createSopEvidence: async (id, payload) => mapEvidence(await run(requireSupabase().from("sop_evidence").insert({ sop_id: id, evidence_name: payload.evidenceName, evidence_type: payload.evidenceType, evidence_url: payload.evidenceUrl ?? "", control_reference: payload.controlReference ?? "", uploaded_by: payload.uploadedBy }).select("*").single())),
  createSopException: async (id, payload) => mapException(await run(requireSupabase().from("sop_exceptions").insert({ sop_id: id, exception_code: payload.exceptionId, reason: payload.reason, impact: payload.impact ?? "", workaround: payload.workaround ?? "", owner: payload.owner, due_date: payload.dueDate, approval_required: Boolean(payload.approvalRequired), closure_evidence: payload.closureEvidence ?? "", status: payload.status }).select("*").single())),
  sopFolders: async () => (await run(requireSupabase().from("sop_folders").select("*").order("name"))).map(mapSopFolder),
  createSopFolder: async (payload) => mapSopFolder(await run(requireSupabase().from("sop_folders").insert(payload).select("*").single())),
  sopFiles: async (params = {}) => {
    let query = requireSupabase().from("sop_files").select("*").order("created_date", { ascending: false });
    if (params.sopId) query = query.eq("sop_id", Number(params.sopId));
    if (params.folderId) query = query.eq("folder_id", Number(params.folderId));
    return (await run(query)).map(mapSopFile);
  },
  createSopFile: async (payload) => mapSopFile(await run(requireSupabase().from("sop_files").insert({ sop_id: payload.sopId ? Number(payload.sopId) : null, folder_id: payload.folderId ? Number(payload.folderId) : null, file_name: payload.fileName, file_type: payload.fileType, file_url: payload.fileUrl }).select("*").single())),
  tasks: fetchTasks,
  async task(id) {
    const client = requireSupabase();
    const task = mapTask(await run(client.from("tasks").select("*, projects(project_name), sops(sop_name)").eq("id", id).single()));
    const [comments, activityLog] = await Promise.all([
      run(client.from("task_comments").select("*").eq("task_id", id).order("created_date", { ascending: false })),
      run(client.from("activity_logs").select("*").eq("task_id", id).order("created_date", { ascending: false }))
    ]);
    return { ...task, comments: comments.map(mapComment), activityLog: activityLog.map(mapActivity) };
  },
  createTask: async (payload, user) => mapTask(await run(requireSupabase().from("tasks").insert(taskPayload(payload, user)).select("*, projects(project_name), sops(sop_name)").single())),
  updateTask: async (id, payload, user) => mapTask(await run(requireSupabase().from("tasks").update(taskPayload(payload, user)).eq("id", id).select("*, projects(project_name), sops(sop_name)").single())),
  deleteTask: async (id) => run(requireSupabase().from("tasks").delete().eq("id", id)),
  addComment: async (id, payload) => mapComment(await run(requireSupabase().from("task_comments").insert({ task_id: id, user_name: payload.userName, comment: payload.comment }).select("*").single())),
  transformations: async () => (await run(requireSupabase().from("transformations").select("*").order("updated_date", { ascending: false }))).map(mapTransformation),
  createTransformation: async (payload) => mapTransformation(await run(requireSupabase().from("transformations").insert(transformationPayload(payload)).select("*").single()))
};
