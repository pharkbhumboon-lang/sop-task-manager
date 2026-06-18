import { DatabaseSync } from "node:sqlite";

const STATUSES = ["Not Started", "In Progress", "Waiting", "Completed"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const DEPARTMENTS = ["Operations", "Finance", "HR", "IT", "Sales"];
const ROLE_LEVELS = {
  Admin: 1,
  Manager: 2,
  Member: 3,
  User: 3
};

function nowIso() {
  return new Date().toISOString();
}

function rowToProject(row) {
  return {
    id: row.id,
    projectId: row.project_code,
    projectName: row.project_name,
    description: row.description,
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

function rowToSop(row) {
  return {
    id: row.id,
    sopId: row.sop_code,
    sopName: row.sop_name,
    documentType: row.document_type ?? "Procedure",
    category: row.category ?? "",
    department: row.department,
    purpose: row.purpose,
    scope: row.scope,
    steps: row.steps,
    content: row.content ?? row.steps,
    tags: parseJsonList(row.tags),
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
    relatedPolicies: parseJsonList(row.related_policies),
    relatedControls: parseJsonList(row.related_controls),
    relatedSystems: parseJsonList(row.related_systems),
    upstreamProcess: row.upstream_process ?? "",
    downstreamProcess: row.downstream_process ?? "",
    controlObjective: row.control_objective ?? "",
    controlFrequency: row.control_frequency ?? "",
    evidenceRequired: parseJsonList(row.evidence_required),
    riskMitigated: row.risk_mitigated ?? "",
    complianceRequirement: row.compliance_requirement ?? "",
    auditOwner: row.audit_owner ?? "",
    auditor: row.auditor ?? "",
    exceptionHandling: row.exception_handling ?? "",
    requiredApprovals: parseJsonList(row.required_approvals),
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
    distributionList: parseJsonList(row.distribution_list),
    trainingRequired: Boolean(row.training_required),
    trainingAudience: parseJsonList(row.training_audience),
    controlledCopyLocation: row.controlled_copy_location ?? "",
    version: row.version,
    effectiveDate: row.effective_date,
    status: row.status,
    attachmentUrl: row.attachment_url,
    imageUrls: parseJsonList(row.image_urls),
    folderId: row.folder_id,
    folderName: row.folder_name ?? null,
    createdDate: row.created_date,
    updatedDate: row.updated_date
  };
}

function rowToSopLifecycleEvent(row) {
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

function rowToSopEvidence(row) {
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

function rowToSopException(row) {
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

function rowToSopApproval(row) {
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

function rowToSopTrainingAcknowledgement(row) {
  return {
    id: row.id,
    sopId: row.sop_id,
    userName: row.user_name,
    role: row.role,
    note: row.note,
    acknowledgedDate: row.acknowledged_date
  };
}

function rowToTask(row) {
  return {
    id: row.id,
    taskId: row.task_code,
    taskTitle: row.task_title,
    projectId: row.project_id,
    projectName: row.project_name,
    workDetail: row.work_detail,
    sopId: row.sop_id,
    sopName: row.sop_name,
    assignedTo: row.assigned_to,
    priority: row.priority,
    startDate: row.start_date,
    dueDate: row.due_date,
    status: row.status,
    progressPercent: row.progress_percent,
    attachmentUrl: row.attachment_url,
    createdBy: row.created_by,
    createdDate: row.created_date,
    updatedDate: row.updated_date
  };
}

function rowToComment(row) {
  return {
    id: row.id,
    taskId: row.task_id,
    userName: row.user_name,
    comment: row.comment,
    createdDate: row.created_date
  };
}

function rowToActivity(row) {
  return {
    id: row.id,
    taskId: row.task_id,
    userName: row.user_name,
    action: row.action,
    details: row.details,
    createdDate: row.created_date
  };
}

function rowToSopFolder(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdDate: row.created_date,
    updatedDate: row.updated_date
  };
}

function rowToSopFile(row) {
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

function rowToTransformation(row) {
  return {
    id: row.id,
    discoveryId: row.discovery_code,
    clientName: row.client_name,
    department: row.department,
    currentWorkflow: row.current_workflow,
    painPoints: parseJsonList(row.pain_points),
    repetitiveTasks: parseJsonList(row.repetitive_tasks),
    documentsUsed: parseJsonList(row.documents_used),
    stakeholders: parseJsonList(row.stakeholders),
    aiUseCases: parseJsonList(row.ai_use_cases),
    proposedSolution: row.proposed_solution,
    implementationPlan: row.implementation_plan,
    trainingNeeded: row.training_needed,
    status: row.status,
    owner: row.owner,
    createdDate: row.created_date,
    updatedDate: row.updated_date
  };
}

function userLevel(role) {
  return ROLE_LEVELS[role] ?? 3;
}

function rowToUser(row, options = {}) {
  const user = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    department: row.department,
    userLevel: userLevel(row.role)
  };
  if (options.includePassword) user.password = row.password;
  return user;
}

function parseJsonList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value).split(",").map((entry) => entry.trim()).filter(Boolean);
  }
}

function stringifyList(value) {
  if (Array.isArray(value)) return JSON.stringify(value.map(String).map((entry) => entry.trim()).filter(Boolean));
  if (!value) return JSON.stringify([]);
  return JSON.stringify(String(value).split(",").map((entry) => entry.trim()).filter(Boolean));
}

function setFields(payload, mapping) {
  const columns = [];
  const values = [];
  Object.entries(mapping).forEach(([apiField, column]) => {
    if (Object.prototype.hasOwnProperty.call(payload, apiField)) {
      columns.push(`${column} = ?`);
      values.push(payload[apiField]);
    }
  });
  values.push(nowIso());
  columns.push("updated_date = ?");
  return { sql: columns.join(", "), values };
}

export function createDatabase(databasePath = "data/sop-task-manager.sqlite") {
  const db = new DatabaseSync(databasePath);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_code TEXT NOT NULL UNIQUE,
      project_name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      owner TEXT NOT NULL,
      department TEXT NOT NULL,
      start_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      created_date TEXT NOT NULL,
      updated_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sop_code TEXT NOT NULL UNIQUE,
      sop_name TEXT NOT NULL,
      document_type TEXT NOT NULL DEFAULT 'Procedure',
      category TEXT NOT NULL DEFAULT '',
      department TEXT NOT NULL,
      purpose TEXT NOT NULL,
      scope TEXT NOT NULL,
      steps TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      owner TEXT NOT NULL,
      responsibility_level TEXT NOT NULL DEFAULT 'L1 User / Staff',
      responsible_user TEXT NOT NULL DEFAULT '',
      process_owner TEXT NOT NULL DEFAULT '',
      control_owner TEXT NOT NULL DEFAULT '',
      business_criticality TEXT NOT NULL DEFAULT 'Medium',
      expiry_date TEXT NOT NULL DEFAULT '',
      business_unit TEXT NOT NULL DEFAULT '',
      process_group TEXT NOT NULL DEFAULT '',
      process_name TEXT NOT NULL DEFAULT '',
      sub_process TEXT NOT NULL DEFAULT '',
      related_policies TEXT NOT NULL DEFAULT '[]',
      related_controls TEXT NOT NULL DEFAULT '[]',
      related_systems TEXT NOT NULL DEFAULT '[]',
      upstream_process TEXT NOT NULL DEFAULT '',
      downstream_process TEXT NOT NULL DEFAULT '',
      control_objective TEXT NOT NULL DEFAULT '',
      control_frequency TEXT NOT NULL DEFAULT '',
      evidence_required TEXT NOT NULL DEFAULT '[]',
      risk_mitigated TEXT NOT NULL DEFAULT '',
      compliance_requirement TEXT NOT NULL DEFAULT '',
      audit_owner TEXT NOT NULL DEFAULT '',
      auditor TEXT NOT NULL DEFAULT '',
      exception_handling TEXT NOT NULL DEFAULT '',
      required_approvals TEXT NOT NULL DEFAULT '[]',
      reviewer TEXT NOT NULL DEFAULT '',
      approver TEXT NOT NULL DEFAULT '',
      approval_status TEXT NOT NULL DEFAULT 'Draft',
      review_cycle_months INTEGER NOT NULL DEFAULT 12,
      next_review_date TEXT NOT NULL DEFAULT '',
      change_summary TEXT NOT NULL DEFAULT '',
      change_reason TEXT NOT NULL DEFAULT '',
      risk_level TEXT NOT NULL DEFAULT 'Medium',
      access_level TEXT NOT NULL DEFAULT 'Internal',
      retention_period TEXT NOT NULL DEFAULT '',
      distribution_list TEXT NOT NULL DEFAULT '[]',
      training_required INTEGER NOT NULL DEFAULT 0,
      training_audience TEXT NOT NULL DEFAULT '[]',
      controlled_copy_location TEXT NOT NULL DEFAULT '',
      version TEXT NOT NULL,
      effective_date TEXT NOT NULL,
      status TEXT NOT NULL,
      attachment_url TEXT NOT NULL DEFAULT '',
      image_urls TEXT NOT NULL DEFAULT '[]',
      folder_id INTEGER REFERENCES sop_folders(id) ON DELETE SET NULL,
      created_date TEXT NOT NULL,
      updated_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sop_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      created_date TEXT NOT NULL,
      updated_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sop_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sop_id INTEGER REFERENCES sops(id) ON DELETE CASCADE,
      folder_id INTEGER REFERENCES sop_folders(id) ON DELETE SET NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_url TEXT NOT NULL,
      created_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sop_approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sop_id INTEGER NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
      reviewer TEXT NOT NULL,
      approver TEXT NOT NULL,
      decision TEXT NOT NULL,
      comment TEXT NOT NULL DEFAULT '',
      created_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sop_training_acknowledgements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sop_id INTEGER NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
      user_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      acknowledged_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sop_lifecycle_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sop_id INTEGER NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      user_name TEXT NOT NULL,
      reason TEXT NOT NULL DEFAULT '',
      created_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sop_evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sop_id INTEGER NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
      evidence_name TEXT NOT NULL,
      evidence_type TEXT NOT NULL,
      evidence_url TEXT NOT NULL DEFAULT '',
      control_reference TEXT NOT NULL DEFAULT '',
      uploaded_by TEXT NOT NULL,
      created_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sop_exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sop_id INTEGER NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
      exception_code TEXT NOT NULL UNIQUE,
      reason TEXT NOT NULL,
      impact TEXT NOT NULL DEFAULT '',
      workaround TEXT NOT NULL DEFAULT '',
      owner TEXT NOT NULL,
      due_date TEXT NOT NULL,
      approval_required INTEGER NOT NULL DEFAULT 0,
      closure_evidence TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      created_date TEXT NOT NULL,
      updated_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_code TEXT NOT NULL UNIQUE,
      task_title TEXT NOT NULL,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      work_detail TEXT NOT NULL,
      sop_id INTEGER REFERENCES sops(id) ON DELETE SET NULL,
      assigned_to TEXT NOT NULL,
      priority TEXT NOT NULL,
      start_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL,
      progress_percent INTEGER NOT NULL DEFAULT 0,
      attachment_url TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL,
      created_date TEXT NOT NULL,
      updated_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_name TEXT NOT NULL,
      comment TEXT NOT NULL,
      created_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      created_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transformations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discovery_code TEXT NOT NULL UNIQUE,
      client_name TEXT NOT NULL,
      department TEXT NOT NULL,
      current_workflow TEXT NOT NULL,
      pain_points TEXT NOT NULL DEFAULT '[]',
      repetitive_tasks TEXT NOT NULL DEFAULT '[]',
      documents_used TEXT NOT NULL DEFAULT '[]',
      stakeholders TEXT NOT NULL DEFAULT '[]',
      ai_use_cases TEXT NOT NULL DEFAULT '[]',
      proposed_solution TEXT NOT NULL DEFAULT '',
      implementation_plan TEXT NOT NULL DEFAULT '',
      training_needed TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      owner TEXT NOT NULL,
      created_date TEXT NOT NULL,
      updated_date TEXT NOT NULL
    );
  `);

  ensureColumn(db, "sops", "document_type", "TEXT NOT NULL DEFAULT 'Procedure'");
  ensureColumn(db, "sops", "category", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "content", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "tags", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "sops", "responsibility_level", "TEXT NOT NULL DEFAULT 'L1 User / Staff'");
  ensureColumn(db, "sops", "responsible_user", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "process_owner", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "control_owner", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "business_criticality", "TEXT NOT NULL DEFAULT 'Medium'");
  ensureColumn(db, "sops", "expiry_date", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "business_unit", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "process_group", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "process_name", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "sub_process", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "related_policies", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "sops", "related_controls", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "sops", "related_systems", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "sops", "upstream_process", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "downstream_process", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "control_objective", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "control_frequency", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "evidence_required", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "sops", "risk_mitigated", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "compliance_requirement", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "audit_owner", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "auditor", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "exception_handling", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "required_approvals", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "sops", "reviewer", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "approver", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "approval_status", "TEXT NOT NULL DEFAULT 'Draft'");
  ensureColumn(db, "sops", "review_cycle_months", "INTEGER NOT NULL DEFAULT 12");
  ensureColumn(db, "sops", "next_review_date", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "change_summary", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "change_reason", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "risk_level", "TEXT NOT NULL DEFAULT 'Medium'");
  ensureColumn(db, "sops", "access_level", "TEXT NOT NULL DEFAULT 'Internal'");
  ensureColumn(db, "sops", "retention_period", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "distribution_list", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "sops", "training_required", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "sops", "training_audience", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "sops", "controlled_copy_location", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "sops", "image_urls", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "sops", "folder_id", "INTEGER REFERENCES sop_folders(id) ON DELETE SET NULL");
  db.prepare("UPDATE sops SET content = steps WHERE content = ''").run();
  db.prepare("UPDATE users SET role = 'User' WHERE role = 'Member'").run();
  seedDatabase(db);
  seedEnterpriseSopControlData(db);
  seedTransformationData(db);
  return db;
}

function ensureColumn(db, table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all().map((entry) => entry.name);
  if (!columns.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function insertProject(db, project) {
  const stamp = nowIso();
  const result = db.prepare(`
    INSERT INTO projects (
      project_code, project_name, description, owner, department, start_date,
      due_date, status, priority, created_date, updated_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    project.projectId,
    project.projectName,
    project.description ?? "",
    project.owner,
    project.department,
    project.startDate,
    project.dueDate,
    project.status,
    project.priority,
    stamp,
    stamp
  );
  return getProject(db, Number(result.lastInsertRowid));
}

function insertSop(db, sop) {
  const stamp = nowIso();
  const result = db.prepare(`
    INSERT INTO sops (
      sop_code, sop_name, document_type, category, department, purpose, scope,
      steps, content, tags, owner, reviewer, approver, approval_status,
      review_cycle_months, next_review_date, change_summary, change_reason,
      risk_level, access_level, retention_period, distribution_list,
      training_required, training_audience, controlled_copy_location,
      version, effective_date, status,
      attachment_url, image_urls, folder_id, created_date, updated_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sop.sopId,
    sop.sopName,
    sop.documentType ?? "Procedure",
    sop.category ?? "",
    sop.department,
    sop.purpose,
    sop.scope,
    sop.steps,
    sop.content ?? sop.steps,
    stringifyList(sop.tags),
    sop.owner,
    sop.reviewer ?? "",
    sop.approver ?? "",
    sop.approvalStatus ?? (sop.status === "Published" || sop.status === "Active" ? "Approved" : "Draft"),
    Number(sop.reviewCycleMonths ?? 12),
    sop.nextReviewDate ?? "",
    sop.changeSummary ?? "",
    sop.changeReason ?? "",
    sop.riskLevel ?? "Medium",
    sop.accessLevel ?? "Internal",
    sop.retentionPeriod ?? "",
    stringifyList(sop.distributionList),
    sop.trainingRequired ? 1 : 0,
    stringifyList(sop.trainingAudience),
    sop.controlledCopyLocation ?? "",
    sop.version,
    sop.effectiveDate,
    sop.status,
    sop.attachmentUrl ?? "",
    stringifyList(sop.imageUrls),
    sop.folderId ? Number(sop.folderId) : null,
    stamp,
    stamp
  );
  const id = Number(result.lastInsertRowid);
  updateSopGovernanceFields(db, id, sop);
  return getSop(db, id);
}

function updateSopGovernanceFields(db, id, payload) {
  const mapping = {
    responsibilityLevel: "responsibility_level",
    responsibleUser: "responsible_user",
    processOwner: "process_owner",
    controlOwner: "control_owner",
    businessCriticality: "business_criticality",
    expiryDate: "expiry_date",
    businessUnit: "business_unit",
    processGroup: "process_group",
    processName: "process_name",
    subProcess: "sub_process",
    upstreamProcess: "upstream_process",
    downstreamProcess: "downstream_process",
    controlObjective: "control_objective",
    controlFrequency: "control_frequency",
    riskMitigated: "risk_mitigated",
    complianceRequirement: "compliance_requirement",
    auditOwner: "audit_owner",
    auditor: "auditor",
    exceptionHandling: "exception_handling"
  };
  const listMapping = {
    relatedPolicies: "related_policies",
    relatedControls: "related_controls",
    relatedSystems: "related_systems",
    evidenceRequired: "evidence_required",
    requiredApprovals: "required_approvals"
  };
  const columns = [];
  const values = [];
  Object.entries(mapping).forEach(([apiField, column]) => {
    if (Object.prototype.hasOwnProperty.call(payload, apiField)) {
      columns.push(`${column} = ?`);
      values.push(payload[apiField] ?? "");
    }
  });
  Object.entries(listMapping).forEach(([apiField, column]) => {
    if (Object.prototype.hasOwnProperty.call(payload, apiField)) {
      columns.push(`${column} = ?`);
      values.push(stringifyList(payload[apiField]));
    }
  });
  if (!columns.length) return;
  columns.push("updated_date = ?");
  values.push(nowIso(), id);
  db.prepare(`UPDATE sops SET ${columns.join(", ")} WHERE id = ?`).run(...values);
}

function insertTask(db, task) {
  const stamp = nowIso();
  const result = db.prepare(`
    INSERT INTO tasks (
      task_code, task_title, project_id, work_detail, sop_id, assigned_to,
      priority, start_date, due_date, status, progress_percent, attachment_url,
      created_by, created_date, updated_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    task.taskId,
    task.taskTitle,
    task.projectId,
    task.workDetail,
    task.sopId ?? null,
    task.assignedTo,
    task.priority,
    task.startDate,
    task.dueDate,
    task.status,
    Number(task.progressPercent ?? 0),
    task.attachmentUrl ?? "",
    task.createdBy,
    stamp,
    stamp
  );
  addActivity(db, Number(result.lastInsertRowid), task.createdBy, "Task created", task.taskTitle);
  return getTask(db, Number(result.lastInsertRowid));
}

function insertTransformation(db, discovery) {
  const stamp = nowIso();
  const result = db.prepare(`
    INSERT INTO transformations (
      discovery_code, client_name, department, current_workflow, pain_points,
      repetitive_tasks, documents_used, stakeholders, ai_use_cases,
      proposed_solution, implementation_plan, training_needed, status, owner,
      created_date, updated_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    discovery.discoveryId,
    discovery.clientName,
    discovery.department,
    discovery.currentWorkflow,
    stringifyList(discovery.painPoints),
    stringifyList(discovery.repetitiveTasks),
    stringifyList(discovery.documentsUsed),
    stringifyList(discovery.stakeholders),
    JSON.stringify(discovery.aiUseCases ?? []),
    discovery.proposedSolution ?? "",
    discovery.implementationPlan ?? "",
    discovery.trainingNeeded ?? "",
    discovery.status,
    discovery.owner,
    stamp,
    stamp
  );
  return getTransformation(db, Number(result.lastInsertRowid));
}

function seedDatabase(db) {
  const count = db.prepare("SELECT COUNT(*) AS total FROM users").get().total;
  if (count > 0) return;

  [
    ["Admin User", "admin@example.com", "admin123", "Admin", "Operations"],
    ["Nok", "nok@example.com", "task123", "User", "Finance"],
    ["Mina", "mina@example.com", "task123", "Manager", "HR"],
    ["Tan", "tan@example.com", "task123", "User", "IT"]
  ].forEach((user) => {
    db.prepare("INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)").run(...user);
  });

  const projects = [
    insertProject(db, {
      projectId: "PRJ-001",
      projectName: "Finance Month-End Close",
      description: "Track recurring month-end finance controls.",
      owner: "Nok",
      department: "Finance",
      startDate: "2026-06-01",
      dueDate: "2026-06-30",
      status: "In Progress",
      priority: "High"
    }),
    insertProject(db, {
      projectId: "PRJ-002",
      projectName: "Employee Onboarding Refresh",
      description: "Simplify onboarding steps for new staff.",
      owner: "Mina",
      department: "HR",
      startDate: "2026-05-20",
      dueDate: "2026-07-05",
      status: "Waiting",
      priority: "Medium"
    }),
    insertProject(db, {
      projectId: "PRJ-003",
      projectName: "IT Access Review",
      description: "Review active tools, owners, and access levels.",
      owner: "Tan",
      department: "IT",
      startDate: "2026-05-01",
      dueDate: "2026-06-05",
      status: "In Progress",
      priority: "Urgent"
    })
  ];

  const sops = [
    insertSop(db, {
      sopId: "SOP-001",
      sopName: "Invoice Approval",
      documentType: "Procedure",
      category: "Finance Controls",
      department: "Finance",
      purpose: "Make invoice approval consistent and auditable.",
      scope: "All vendor invoices before payment.",
      steps: "1. Match invoice to purchase request\n2. Confirm receiver approval\n3. Check tax details\n4. Submit payment approval",
      content: "<p>Match invoice details, approvals, tax evidence, and payment authorization before payment.</p>",
      tags: ["finance", "approval", "controlled"],
      owner: "Nok",
      reviewer: "Finance Manager",
      approver: "Operations Director",
      approvalStatus: "Approved",
      reviewCycleMonths: 12,
      nextReviewDate: "2027-06-01",
      changeSummary: "Initial controlled invoice approval workflow.",
      changeReason: "Create consistent payment evidence and audit trail.",
      riskLevel: "High",
      accessLevel: "Internal",
      retentionPeriod: "7 years",
      distributionList: ["Finance", "Operations"],
      trainingRequired: true,
      trainingAudience: ["Finance"],
      controlledCopyLocation: "SharePoint / SOP Library / Finance Controls",
      version: "1.0",
      effectiveDate: "2026-06-01",
      status: "Published",
      attachmentUrl: "https://intranet.example/sop/invoice-approval"
    }),
    insertSop(db, {
      sopId: "SOP-002",
      sopName: "New Employee Setup",
      documentType: "Procedure",
      category: "HR Onboarding",
      department: "HR",
      purpose: "Help new staff get ready before day one.",
      scope: "All full-time employee onboarding.",
      steps: "1. Confirm signed documents\n2. Request laptop and email\n3. Schedule orientation\n4. Record probation plan",
      tags: ["onboarding", "hr", "training"],
      owner: "Mina",
      reviewer: "HR Manager",
      approver: "People Lead",
      approvalStatus: "Approved",
      reviewCycleMonths: 12,
      nextReviewDate: "2027-05-15",
      changeSummary: "Controlled onboarding checklist and training evidence.",
      changeReason: "Reduce missed setup tasks before day one.",
      riskLevel: "Medium",
      accessLevel: "Internal",
      retentionPeriod: "Employee lifecycle plus 2 years",
      distributionList: ["HR", "Hiring Managers", "IT"],
      trainingRequired: true,
      trainingAudience: ["HR", "Hiring Managers"],
      controlledCopyLocation: "SharePoint / SOP Library / HR Onboarding",
      version: "1.2",
      effectiveDate: "2026-05-15",
      status: "Published",
      attachmentUrl: ""
    }),
    insertSop(db, {
      sopId: "SOP-003",
      sopName: "User Access Review",
      documentType: "Procedure",
      category: "IT Controls",
      department: "IT",
      purpose: "Reduce access risk by reviewing permissions.",
      scope: "Critical internal systems and shared drives.",
      steps: "1. Export active users\n2. Ask owners to confirm access\n3. Remove unused accounts\n4. Save evidence",
      tags: ["access", "review", "security"],
      owner: "Tan",
      reviewer: "IT Manager",
      approver: "Operations Director",
      approvalStatus: "Pending Review",
      reviewCycleMonths: 6,
      nextReviewDate: "2026-12-10",
      changeSummary: "Draft review control for user access.",
      changeReason: "Reduce access risk and preserve review evidence.",
      riskLevel: "High",
      accessLevel: "Restricted",
      retentionPeriod: "3 years",
      distributionList: ["IT", "Operations"],
      trainingRequired: true,
      trainingAudience: ["IT Support"],
      controlledCopyLocation: "SharePoint / SOP Library / IT Controls",
      version: "0.9",
      effectiveDate: "2026-06-10",
      status: "Draft",
      attachmentUrl: ""
    })
  ];

  [
    {
      taskId: "TASK-001",
      taskTitle: "Check June vendor invoices",
      projectId: projects[0].id,
      workDetail: "Review pending invoices and confirm approval evidence.",
      sopId: sops[0].id,
      assignedTo: "Nok",
      priority: "High",
      startDate: "2026-06-03",
      dueDate: "2026-06-12",
      status: "In Progress",
      progressPercent: 55,
      attachmentUrl: "https://intranet.example/invoices/june",
      createdBy: "Admin"
    },
    {
      taskId: "TASK-002",
      taskTitle: "Publish onboarding checklist",
      projectId: projects[1].id,
      workDetail: "Finalize the readable checklist for HR and managers.",
      sopId: sops[1].id,
      assignedTo: "Mina",
      priority: "Medium",
      startDate: "2026-06-01",
      dueDate: "2026-06-20",
      status: "Waiting",
      progressPercent: 35,
      attachmentUrl: "",
      createdBy: "Admin"
    },
    {
      taskId: "TASK-003",
      taskTitle: "Remove inactive shared drive access",
      projectId: projects[2].id,
      workDetail: "Use access review export and remove inactive accounts.",
      sopId: sops[2].id,
      assignedTo: "Tan",
      priority: "Urgent",
      startDate: "2026-05-22",
      dueDate: "2026-06-07",
      status: "In Progress",
      progressPercent: 70,
      attachmentUrl: "",
      createdBy: "Admin"
    },
    {
      taskId: "TASK-004",
      taskTitle: "Archive paid invoice evidence",
      projectId: projects[0].id,
      workDetail: "Save approval evidence for the last completed payment run.",
      sopId: sops[0].id,
      assignedTo: "Nok",
      priority: "Low",
      startDate: "2026-05-20",
      dueDate: "2026-06-02",
      status: "Completed",
      progressPercent: 100,
      attachmentUrl: "",
      createdBy: "Admin"
    },
    {
      taskId: "TASK-005",
      taskTitle: "Collect missing bank forms",
      projectId: projects[0].id,
      workDetail: "Ask two vendors for updated bank confirmation forms.",
      sopId: sops[0].id,
      assignedTo: "Mina",
      priority: "High",
      startDate: "2026-05-25",
      dueDate: "2026-06-04",
      status: "Not Started",
      progressPercent: 0,
      attachmentUrl: "",
      createdBy: "Admin"
    }
  ].forEach((task) => insertTask(db, task));

  addComment(db, 1, "Admin", "Please use the latest invoice approval SOP.");

  seedTransformationData(db);
}

function seedTransformationData(db) {
  const count = db.prepare("SELECT COUNT(*) AS total FROM transformations").get().total;
  if (count > 0) return;

  [
    {
      discoveryId: "DISC-001",
      clientName: "Finance Operations Discovery",
      department: "Finance",
      currentWorkflow: "Vendor invoices arrive through email, approvals happen in chat, and evidence is saved manually after payment.",
      painPoints: ["Missing approval evidence", "Unclear invoice owner", "Month-end status is hard to summarize"],
      repetitiveTasks: ["Check invoice details", "Ask owners for approval", "Prepare month-end progress report"],
      documentsUsed: ["Vendor invoice", "Approval chat", "Payment evidence", "Invoice Approval SOP"],
      stakeholders: ["Finance owner", "Department approver", "Operations admin"],
      aiUseCases: [
        {
          title: "Invoice Evidence Summary",
          tool: "ChatGPT or Gemini",
          impact: "Summarize invoice context and missing approval evidence before payment",
          difficulty: "Medium",
          status: "Ready for pilot"
        },
        {
          title: "Month-End Progress Brief",
          tool: "ChatGPT",
          impact: "Turn task and comment history into a manager-ready update",
          difficulty: "Low",
          status: "Backlog"
        }
      ],
      proposedSolution: "Centralize invoice tasks, SOP reference, due date ownership, evidence links, and comments in one operating board.",
      implementationPlan: "Discovery > Workflow Map > SOP Cleanup > AI Summary Pilot > User Training > Rollout",
      trainingNeeded: "Train finance users to attach evidence, update task status, and use AI summaries as draft support.",
      status: "In Progress",
      owner: "Admin"
    },
    {
      discoveryId: "DISC-002",
      clientName: "HR Onboarding Workflow",
      department: "HR",
      currentWorkflow: "New employee setup steps are tracked across messages, spreadsheets, and manager reminders.",
      painPoints: ["Laptop and email requests are easy to miss", "Managers lack one onboarding checklist", "Probation plan reminders are manual"],
      repetitiveTasks: ["Create onboarding checklist", "Send orientation reminders", "Summarize missing documents"],
      documentsUsed: ["Employee setup SOP", "Orientation agenda", "Probation plan"],
      stakeholders: ["HR manager", "Hiring manager", "IT support"],
      aiUseCases: [
        {
          title: "Onboarding Checklist Draft",
          tool: "Notion AI or ChatGPT",
          impact: "Generate a role-specific checklist from SOP steps",
          difficulty: "Low",
          status: "Ready for pilot"
        }
      ],
      proposedSolution: "Use SOP-driven task templates with assigned owners, due dates, comments, and training material.",
      implementationPlan: "Discovery > SOP Review > Checklist Pilot > Manager Training > Rollout",
      trainingNeeded: "Train HR and managers on checklist ownership and AI-assisted onboarding notes.",
      status: "Discovery",
      owner: "Mina"
    }
  ].forEach((entry) => insertTransformation(db, entry));
}

function seedEnterpriseSopControlData(db) {
  [
    {
      sopId: "SOP-001",
      documentType: "Procedure",
      category: "Finance Controls",
      content: "<p>Match invoice details, approvals, tax evidence, and payment authorization before payment.</p>",
      tags: ["finance", "approval", "controlled"],
      reviewer: "Finance Manager",
      approver: "Operations Director",
      approvalStatus: "Approved",
      reviewCycleMonths: 12,
      nextReviewDate: "2027-06-01",
      changeSummary: "Initial controlled invoice approval workflow.",
      changeReason: "Create consistent payment evidence and audit trail.",
      riskLevel: "High",
      accessLevel: "Internal",
      retentionPeriod: "7 years",
      distributionList: ["Finance", "Operations"],
      trainingRequired: true,
      trainingAudience: ["Finance"],
      controlledCopyLocation: "SharePoint / SOP Library / Finance Controls",
      status: "Published"
    },
    {
      sopId: "SOP-002",
      documentType: "Procedure",
      category: "HR Onboarding",
      content: "<p>Confirm employee documents, equipment, orientation, and manager follow-up before the first working day.</p>",
      tags: ["onboarding", "hr", "training"],
      reviewer: "HR Manager",
      approver: "People Lead",
      approvalStatus: "Approved",
      reviewCycleMonths: 12,
      nextReviewDate: "2027-05-15",
      changeSummary: "Controlled onboarding checklist and training evidence.",
      changeReason: "Reduce missed setup tasks before day one.",
      riskLevel: "Medium",
      accessLevel: "Internal",
      retentionPeriod: "Employee lifecycle plus 2 years",
      distributionList: ["HR", "Hiring Managers", "IT"],
      trainingRequired: true,
      trainingAudience: ["HR", "Hiring Managers"],
      controlledCopyLocation: "SharePoint / SOP Library / HR Onboarding",
      status: "Published"
    },
    {
      sopId: "SOP-003",
      documentType: "Procedure",
      category: "IT Controls",
      content: "<p>Review user access, collect owner confirmation, remove unused access, and save control evidence.</p>",
      tags: ["access", "review", "security"],
      reviewer: "IT Manager",
      approver: "Operations Director",
      approvalStatus: "Pending Review",
      reviewCycleMonths: 6,
      nextReviewDate: "2026-12-10",
      changeSummary: "Draft review control for user access.",
      changeReason: "Reduce access risk and preserve review evidence.",
      riskLevel: "High",
      accessLevel: "Restricted",
      retentionPeriod: "3 years",
      distributionList: ["IT", "Operations"],
      trainingRequired: true,
      trainingAudience: ["IT Support"],
      controlledCopyLocation: "SharePoint / SOP Library / IT Controls"
    }
  ].forEach((sop) => {
    db.prepare(`
      UPDATE sops
      SET document_type = ?,
          category = CASE WHEN category = '' THEN ? ELSE category END,
          content = CASE WHEN content = '' OR content = steps THEN ? ELSE content END,
          tags = CASE WHEN tags = '[]' THEN ? ELSE tags END,
          reviewer = CASE WHEN reviewer = '' THEN ? ELSE reviewer END,
          approver = CASE WHEN approver = '' THEN ? ELSE approver END,
          approval_status = CASE WHEN approval_status = 'Draft' THEN ? ELSE approval_status END,
          review_cycle_months = CASE WHEN review_cycle_months = 12 THEN ? ELSE review_cycle_months END,
          next_review_date = CASE WHEN next_review_date = '' THEN ? ELSE next_review_date END,
          change_summary = CASE WHEN change_summary = '' THEN ? ELSE change_summary END,
          change_reason = CASE WHEN change_reason = '' THEN ? ELSE change_reason END,
          risk_level = CASE WHEN risk_level = 'Medium' THEN ? ELSE risk_level END,
          access_level = CASE WHEN access_level = 'Internal' THEN ? ELSE access_level END,
          retention_period = CASE WHEN retention_period = '' THEN ? ELSE retention_period END,
          distribution_list = CASE WHEN distribution_list = '[]' THEN ? ELSE distribution_list END,
          training_required = CASE WHEN training_required = 0 THEN ? ELSE training_required END,
          training_audience = CASE WHEN training_audience = '[]' THEN ? ELSE training_audience END,
          controlled_copy_location = CASE WHEN controlled_copy_location = '' THEN ? ELSE controlled_copy_location END,
          status = CASE WHEN status = 'Active' THEN ? ELSE status END,
          updated_date = ?
      WHERE sop_code = ?
    `).run(
      sop.documentType,
      sop.category,
      sop.content ?? "",
      stringifyList(sop.tags),
      sop.reviewer,
      sop.approver,
      sop.approvalStatus,
      sop.reviewCycleMonths,
      sop.nextReviewDate,
      sop.changeSummary,
      sop.changeReason,
      sop.riskLevel,
      sop.accessLevel,
      sop.retentionPeriod,
      stringifyList(sop.distributionList),
      sop.trainingRequired ? 1 : 0,
      stringifyList(sop.trainingAudience),
      sop.controlledCopyLocation,
      sop.status ?? "Draft",
      nowIso(),
      sop.sopId
    );
  });
}

export function getSettings() {
  return {
    statuses: STATUSES,
    priorities: PRIORITIES,
    departments: DEPARTMENTS,
    quickTaskDefaults: {
      status: "Not Started",
      priority: "Medium",
      progressPercent: 0
    }
  };
}

export function getProject(db, id) {
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  return row ? rowToProject(row) : null;
}

export function listProjects(db) {
  return db.prepare("SELECT * FROM projects ORDER BY updated_date DESC").all().map(rowToProject);
}

export function createProject(db, payload) {
  return insertProject(db, payload);
}

export function updateProject(db, id, payload) {
  const { sql, values } = setFields(payload, {
    projectId: "project_code",
    projectName: "project_name",
    description: "description",
    owner: "owner",
    department: "department",
    startDate: "start_date",
    dueDate: "due_date",
    status: "status",
    priority: "priority"
  });
  db.prepare(`UPDATE projects SET ${sql} WHERE id = ?`).run(...values, id);
  return getProject(db, id);
}

export function deleteProject(db, id) {
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);
}

export function getSop(db, id) {
  const row = db.prepare(`
    SELECT sops.*, sop_folders.name AS folder_name
    FROM sops
    LEFT JOIN sop_folders ON sop_folders.id = sops.folder_id
    WHERE sops.id = ?
  `).get(id);
  return row ? rowToSop(row) : null;
}

export function listSops(db, filters = {}) {
  const q = String(filters.q ?? "").trim().toLowerCase();
  const rows = db.prepare(`
    SELECT sops.*, sop_folders.name AS folder_name
    FROM sops
    LEFT JOIN sop_folders ON sop_folders.id = sops.folder_id
    ORDER BY sops.updated_date DESC
  `).all().map(rowToSop);
  if (!q) return rows;
  const terms = q.split(/\s+/).filter(Boolean);
  return rows.filter((sop) => {
    const approvals = listSopApprovals(db, sop.id);
    const haystack = [
      sop.sopId,
      sop.sopName,
      sop.documentType,
      sop.category,
      sop.department,
      sop.purpose,
      sop.scope,
      sop.steps,
      sop.content,
      sop.owner,
      sop.status,
      sop.folderName,
      sop.responsibilityLevel,
      sop.responsibleUser,
      sop.processOwner,
      sop.controlOwner,
      sop.businessCriticality,
      sop.expiryDate,
      sop.businessUnit,
      sop.processGroup,
      sop.processName,
      sop.subProcess,
      sop.upstreamProcess,
      sop.downstreamProcess,
      sop.controlObjective,
      sop.controlFrequency,
      sop.riskMitigated,
      sop.complianceRequirement,
      sop.auditOwner,
      sop.auditor,
      sop.exceptionHandling,
      ...(sop.relatedPolicies ?? []),
      ...(sop.relatedControls ?? []),
      ...(sop.relatedSystems ?? []),
      ...(sop.evidenceRequired ?? []),
      ...(sop.requiredApprovals ?? []),
      sop.reviewer,
      sop.approver,
      sop.approvalStatus,
      sop.nextReviewDate,
      sop.changeSummary,
      sop.changeReason,
      sop.riskLevel,
      sop.accessLevel,
      sop.retentionPeriod,
      sop.controlledCopyLocation ? "controlled copy" : "",
      sop.controlledCopyLocation,
      ...approvals.flatMap((entry) => [entry.reviewer, entry.approver, entry.decision, entry.comment]),
      ...(sop.distributionList ?? []),
      ...(sop.trainingAudience ?? []),
      ...(sop.tags ?? [])
    ].join(" ").toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

export function createSop(db, payload) {
  return insertSop(db, payload);
}

export function updateSop(db, id, payload) {
  const { sql, values } = setFields(payload, {
    sopId: "sop_code",
    sopName: "sop_name",
    documentType: "document_type",
    category: "category",
    department: "department",
    purpose: "purpose",
    scope: "scope",
    steps: "steps",
    content: "content",
    owner: "owner",
    processOwner: "process_owner",
    businessCriticality: "business_criticality",
    expiryDate: "expiry_date",
    businessUnit: "business_unit",
    processGroup: "process_group",
    processName: "process_name",
    subProcess: "sub_process",
    upstreamProcess: "upstream_process",
    downstreamProcess: "downstream_process",
    controlObjective: "control_objective",
    controlFrequency: "control_frequency",
    riskMitigated: "risk_mitigated",
    complianceRequirement: "compliance_requirement",
    auditOwner: "audit_owner",
    exceptionHandling: "exception_handling",
    reviewer: "reviewer",
    approver: "approver",
    approvalStatus: "approval_status",
    reviewCycleMonths: "review_cycle_months",
    nextReviewDate: "next_review_date",
    changeSummary: "change_summary",
    changeReason: "change_reason",
    riskLevel: "risk_level",
    accessLevel: "access_level",
    retentionPeriod: "retention_period",
    controlledCopyLocation: "controlled_copy_location",
    version: "version",
    effectiveDate: "effective_date",
    status: "status",
    attachmentUrl: "attachment_url",
    folderId: "folder_id"
  });
  if (Object.prototype.hasOwnProperty.call(payload, "tags")) {
    sql && values;
  }
  db.prepare(`UPDATE sops SET ${sql} WHERE id = ?`).run(...values, id);
  if (Object.prototype.hasOwnProperty.call(payload, "tags")) {
    db.prepare("UPDATE sops SET tags = ?, updated_date = ? WHERE id = ?").run(stringifyList(payload.tags), nowIso(), id);
  }
  updateSopGovernanceFields(db, id, payload);
  if (Object.prototype.hasOwnProperty.call(payload, "distributionList")) {
    db.prepare("UPDATE sops SET distribution_list = ?, updated_date = ? WHERE id = ?").run(stringifyList(payload.distributionList), nowIso(), id);
  }
  if (Object.prototype.hasOwnProperty.call(payload, "trainingRequired")) {
    db.prepare("UPDATE sops SET training_required = ?, updated_date = ? WHERE id = ?").run(payload.trainingRequired ? 1 : 0, nowIso(), id);
  }
  if (Object.prototype.hasOwnProperty.call(payload, "trainingAudience")) {
    db.prepare("UPDATE sops SET training_audience = ?, updated_date = ? WHERE id = ?").run(stringifyList(payload.trainingAudience), nowIso(), id);
  }
  if (Object.prototype.hasOwnProperty.call(payload, "imageUrls")) {
    db.prepare("UPDATE sops SET image_urls = ?, updated_date = ? WHERE id = ?").run(stringifyList(payload.imageUrls), nowIso(), id);
  }
  return getSop(db, id);
}

export function deleteSop(db, id) {
  db.prepare("DELETE FROM sops WHERE id = ?").run(id);
}

export function listSopApprovals(db, sopId) {
  return db.prepare("SELECT * FROM sop_approvals WHERE sop_id = ? ORDER BY created_date DESC").all(Number(sopId)).map(rowToSopApproval);
}

export function createSopApproval(db, sopId, payload) {
  const stamp = nowIso();
  const result = db.prepare(`
    INSERT INTO sop_approvals (sop_id, reviewer, approver, decision, comment, created_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(Number(sopId), payload.reviewer ?? "", payload.approver ?? "", payload.decision, payload.comment ?? "", stamp);

  if (payload.decision === "Approved") {
    db.prepare("UPDATE sops SET approval_status = 'Approved', status = 'Published', updated_date = ? WHERE id = ?").run(stamp, Number(sopId));
  } else if (payload.decision) {
    db.prepare("UPDATE sops SET approval_status = ?, updated_date = ? WHERE id = ?").run(payload.decision, stamp, Number(sopId));
  }

  return rowToSopApproval(db.prepare("SELECT * FROM sop_approvals WHERE id = ?").get(Number(result.lastInsertRowid)));
}

export function listSopTrainingAcknowledgements(db, sopId) {
  return db.prepare("SELECT * FROM sop_training_acknowledgements WHERE sop_id = ? ORDER BY acknowledged_date DESC").all(Number(sopId)).map(rowToSopTrainingAcknowledgement);
}

export function createSopTrainingAcknowledgement(db, sopId, payload) {
  const stamp = nowIso();
  const result = db.prepare(`
    INSERT INTO sop_training_acknowledgements (sop_id, user_name, role, note, acknowledged_date)
    VALUES (?, ?, ?, ?, ?)
  `).run(Number(sopId), payload.userName, payload.role ?? "", payload.note ?? "", stamp);
  return rowToSopTrainingAcknowledgement(db.prepare("SELECT * FROM sop_training_acknowledgements WHERE id = ?").get(Number(result.lastInsertRowid)));
}

export function listSopLifecycleEvents(db, sopId) {
  return db.prepare("SELECT * FROM sop_lifecycle_events WHERE sop_id = ? ORDER BY created_date DESC").all(Number(sopId)).map(rowToSopLifecycleEvent);
}

export function createSopLifecycleEvent(db, sopId, payload) {
  const stamp = nowIso();
  const result = db.prepare(`
    INSERT INTO sop_lifecycle_events (sop_id, from_status, to_status, user_name, reason, created_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(Number(sopId), payload.fromStatus ?? "", payload.toStatus, payload.userName, payload.reason ?? "", stamp);
  db.prepare("UPDATE sops SET status = ?, updated_date = ? WHERE id = ?").run(payload.toStatus, stamp, Number(sopId));
  return rowToSopLifecycleEvent(db.prepare("SELECT * FROM sop_lifecycle_events WHERE id = ?").get(Number(result.lastInsertRowid)));
}

export function listSopEvidence(db, sopId) {
  return db.prepare("SELECT * FROM sop_evidence WHERE sop_id = ? ORDER BY created_date DESC").all(Number(sopId)).map(rowToSopEvidence);
}

export function createSopEvidence(db, sopId, payload) {
  const stamp = nowIso();
  const result = db.prepare(`
    INSERT INTO sop_evidence (sop_id, evidence_name, evidence_type, evidence_url, control_reference, uploaded_by, created_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    Number(sopId),
    payload.evidenceName,
    payload.evidenceType ?? "document",
    payload.evidenceUrl ?? "",
    payload.controlReference ?? "",
    payload.uploadedBy,
    stamp
  );
  return rowToSopEvidence(db.prepare("SELECT * FROM sop_evidence WHERE id = ?").get(Number(result.lastInsertRowid)));
}

export function listSopExceptions(db, sopId) {
  return db.prepare("SELECT * FROM sop_exceptions WHERE sop_id = ? ORDER BY updated_date DESC").all(Number(sopId)).map(rowToSopException);
}

export function createSopException(db, sopId, payload) {
  const stamp = nowIso();
  const result = db.prepare(`
    INSERT INTO sop_exceptions (
      sop_id, exception_code, reason, impact, workaround, owner, due_date,
      approval_required, closure_evidence, status, created_date, updated_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    Number(sopId),
    payload.exceptionId,
    payload.reason,
    payload.impact ?? "",
    payload.workaround ?? "",
    payload.owner,
    payload.dueDate,
    payload.approvalRequired ? 1 : 0,
    payload.closureEvidence ?? "",
    payload.status ?? "Open",
    stamp,
    stamp
  );
  return rowToSopException(db.prepare("SELECT * FROM sop_exceptions WHERE id = ?").get(Number(result.lastInsertRowid)));
}

export function getSopGovernance(db, sopId) {
  const sop = getSop(db, Number(sopId));
  if (!sop) return null;
  return {
    sop,
    lifecycleEvents: listSopLifecycleEvents(db, sopId),
    approvals: listSopApprovals(db, sopId),
    trainingAcknowledgements: listSopTrainingAcknowledgements(db, sopId),
    evidence: listSopEvidence(db, sopId),
    exceptions: listSopExceptions(db, sopId)
  };
}

export function listSopFolders(db) {
  return db.prepare("SELECT * FROM sop_folders ORDER BY name ASC").all().map(rowToSopFolder);
}

export function createSopFolder(db, payload) {
  const stamp = nowIso();
  const result = db.prepare(`
    INSERT INTO sop_folders (name, description, created_date, updated_date)
    VALUES (?, ?, ?, ?)
  `).run(payload.name, payload.description ?? "", stamp, stamp);
  return rowToSopFolder(db.prepare("SELECT * FROM sop_folders WHERE id = ?").get(Number(result.lastInsertRowid)));
}

export function listSopFiles(db, filters = {}) {
  const where = [];
  const values = [];
  if (filters.sopId) {
    where.push("sop_id = ?");
    values.push(Number(filters.sopId));
  }
  if (filters.folderId) {
    where.push("folder_id = ?");
    values.push(Number(filters.folderId));
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return db.prepare(`SELECT * FROM sop_files ${clause} ORDER BY created_date DESC`).all(...values).map(rowToSopFile);
}

export function createSopFile(db, payload) {
  const stamp = nowIso();
  const result = db.prepare(`
    INSERT INTO sop_files (sop_id, folder_id, file_name, file_type, file_url, created_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    payload.sopId ? Number(payload.sopId) : null,
    payload.folderId ? Number(payload.folderId) : null,
    payload.fileName,
    payload.fileType,
    payload.fileUrl,
    stamp
  );
  return rowToSopFile(db.prepare("SELECT * FROM sop_files WHERE id = ?").get(Number(result.lastInsertRowid)));
}

export function getTransformation(db, id) {
  const row = db.prepare("SELECT * FROM transformations WHERE id = ?").get(id);
  return row ? rowToTransformation(row) : null;
}

export function listTransformations(db, filters = {}) {
  const q = String(filters.q ?? "").trim().toLowerCase();
  const department = String(filters.department ?? "").trim();
  let rows = db.prepare("SELECT * FROM transformations ORDER BY updated_date DESC").all().map(rowToTransformation);
  if (department) rows = rows.filter((entry) => entry.department === department);
  if (!q) return rows;
  const terms = q.split(/\s+/).filter(Boolean);
  return rows.filter((entry) => {
    const haystack = [
      entry.discoveryId,
      entry.clientName,
      entry.department,
      entry.currentWorkflow,
      entry.proposedSolution,
      entry.implementationPlan,
      entry.trainingNeeded,
      entry.status,
      entry.owner,
      ...entry.painPoints,
      ...entry.repetitiveTasks,
      ...entry.documentsUsed,
      ...entry.stakeholders,
      ...entry.aiUseCases.flatMap((useCase) => Object.values(useCase ?? {}))
    ].join(" ").toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

export function createTransformation(db, payload) {
  return insertTransformation(db, payload);
}

function taskSelectSql() {
  return `
    SELECT tasks.*, projects.project_name, sops.sop_name
    FROM tasks
    JOIN projects ON projects.id = tasks.project_id
    LEFT JOIN sops ON sops.id = tasks.sop_id
  `;
}

export function getTask(db, id) {
  const row = db.prepare(`${taskSelectSql()} WHERE tasks.id = ?`).get(id);
  return row ? rowToTask(row) : null;
}

export function listTasks(db, filters = {}) {
  const where = [];
  const values = [];
  if (filters.status) {
    where.push("tasks.status = ?");
    values.push(filters.status);
  }
  if (filters.priority) {
    where.push("tasks.priority = ?");
    values.push(filters.priority);
  }
  if (filters.assignedTo) {
    where.push("tasks.assigned_to = ?");
    values.push(filters.assignedTo);
  }
  if (filters.projectId) {
    where.push("tasks.project_id = ?");
    values.push(Number(filters.projectId));
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return db.prepare(`${taskSelectSql()} ${clause} ORDER BY tasks.updated_date DESC`).all(...values).map(rowToTask);
}

export function createTask(db, payload) {
  return insertTask(db, payload);
}

export function updateTask(db, id, payload) {
  const { sql, values } = setFields(payload, {
    taskId: "task_code",
    taskTitle: "task_title",
    projectId: "project_id",
    workDetail: "work_detail",
    sopId: "sop_id",
    assignedTo: "assigned_to",
    priority: "priority",
    startDate: "start_date",
    dueDate: "due_date",
    status: "status",
    progressPercent: "progress_percent",
    attachmentUrl: "attachment_url",
    createdBy: "created_by"
  });
  db.prepare(`UPDATE tasks SET ${sql} WHERE id = ?`).run(...values, id);
  addActivity(db, id, payload.updatedBy ?? "System", "Task updated", Object.keys(payload).join(", "));
  return getTask(db, id);
}

export function deleteTask(db, id) {
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
}

export function addComment(db, taskId, userName, comment) {
  const stamp = nowIso();
  const result = db.prepare(`
    INSERT INTO task_comments (task_id, user_name, comment, created_date)
    VALUES (?, ?, ?, ?)
  `).run(taskId, userName, comment, stamp);
  db.prepare("UPDATE tasks SET updated_date = ? WHERE id = ?").run(stamp, taskId);
  addActivity(db, taskId, userName, "Comment added", comment);
  return rowToComment(db.prepare("SELECT * FROM task_comments WHERE id = ?").get(Number(result.lastInsertRowid)));
}

function addActivity(db, taskId, userName, action, details) {
  db.prepare(`
    INSERT INTO activity_logs (task_id, user_name, action, details, created_date)
    VALUES (?, ?, ?, ?, ?)
  `).run(taskId, userName, action, details, nowIso());
}

export function getTaskDetail(db, id) {
  const task = getTask(db, id);
  if (!task) return null;
  const comments = db.prepare("SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_date DESC").all(id).map(rowToComment);
  const activityLog = db.prepare("SELECT * FROM activity_logs WHERE task_id = ? ORDER BY created_date DESC").all(id).map(rowToActivity);
  return { ...task, comments, activityLog };
}

export function getDashboard(db) {
  const tasks = listTasks(db);
  const today = new Date().toISOString().slice(0, 10);
  const metrics = {
    totalTasks: tasks.length,
    inProgressTasks: tasks.filter((task) => task.status === "In Progress").length,
    waitingTasks: tasks.filter((task) => task.status === "Waiting").length,
    completedTasks: tasks.filter((task) => task.status === "Completed").length,
    overdueTasks: tasks.filter((task) => task.status !== "Completed" && task.dueDate < today).length
  };
  return {
    metrics,
    recentTasks: tasks.slice(0, 5)
  };
}

export function getReports(db) {
  const today = new Date().toISOString().slice(0, 10);
  const plus30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const sops = listSops(db);
  const tasks = listTasks(db);
  const openExceptions = db.prepare("SELECT COUNT(*) AS total FROM sop_exceptions WHERE status != 'Closed'").get().total;
  const acknowledgedSopIds = new Set(db.prepare("SELECT DISTINCT sop_id FROM sop_training_acknowledgements").all().map((row) => row.sop_id));
  const evidenceRows = db.prepare("SELECT DISTINCT sop_id, control_reference FROM sop_evidence").all();
  const evidenceKeys = new Set(evidenceRows.map((row) => `${row.sop_id}:${row.control_reference}`));
  const controlsWithoutEvidence = sops.reduce((total, sop) => {
    return total + (sop.relatedControls ?? []).filter((control) => !evidenceKeys.has(`${sop.id}:${control}`)).length;
  }, 0);

  return {
    byStatus: db.prepare("SELECT status AS label, COUNT(*) AS total FROM tasks GROUP BY status ORDER BY total DESC").all(),
    byPriority: db.prepare("SELECT priority AS label, COUNT(*) AS total FROM tasks GROUP BY priority ORDER BY total DESC").all(),
    byDepartment: db.prepare(`
      SELECT projects.department AS label, COUNT(tasks.id) AS total
      FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      GROUP BY projects.department
      ORDER BY total DESC
    `).all(),
    overdue: tasks.filter((task) => task.status !== "Completed" && task.dueDate < today),
    governance: {
      sopsPendingReview: sops.filter((sop) => ["Draft", "In Review", "Under Review", "Changes Requested"].includes(sop.status) || sop.approvalStatus === "Pending Review").length,
      sopsExpiringSoon: sops.filter((sop) => sop.expiryDate && sop.expiryDate <= plus30).length,
      expiredSops: sops.filter((sop) => sop.expiryDate && sop.expiryDate < today).length,
      highRiskSops: sops.filter((sop) => ["High", "Critical"].includes(sop.riskLevel) || sop.businessCriticality === "Critical").length,
      missingOwner: sops.filter((sop) => !sop.owner || !sop.processOwner).length,
      missingApproval: sops.filter((sop) => !sop.approver || sop.approvalStatus !== "Approved").length,
      openExceptions,
      overdueAcknowledgements: sops.filter((sop) => sop.trainingRequired && !acknowledgedSopIds.has(sop.id)).length,
      tasksWithoutSopReference: tasks.filter((task) => !task.sopId).length,
      controlsWithoutEvidence
    }
  };
}

export function login(db, email, password) {
  const user = db.prepare("SELECT id, name, email, role, department FROM users WHERE email = ? AND password = ?").get(email, password);
  return user ? rowToUser(user) : null;
}

export function getUser(db, id) {
  const user = db.prepare("SELECT id, name, email, role, department FROM users WHERE id = ?").get(id);
  return user ? rowToUser(user) : null;
}

export function listUsers(db) {
  return db.prepare("SELECT id, name, email, password, role, department FROM users ORDER BY name ASC").all().map((row) => rowToUser(row, { includePassword: true }));
}

export function createUser(db, payload) {
  const role = payload.role ?? "User";
  const result = db.prepare(`
    INSERT INTO users (name, email, password, role, department)
    VALUES (?, ?, ?, ?, ?)
  `).run(payload.name, payload.email, payload.password, role, payload.department);
  return getUser(db, Number(result.lastInsertRowid));
}
