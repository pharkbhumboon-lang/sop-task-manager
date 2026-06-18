import request from "supertest";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createApp } from "../src/app.js";

function testApp() {
  return createApp({ databasePath: ":memory:" });
}

describe("SOP task manager API", () => {
  test("returns dashboard metrics and recent updated tasks", async () => {
    const app = testApp();

    const response = await request(app).get("/api/dashboard").expect(200);

    assert.ok(response.body.metrics.totalTasks >= 5);
    assert.ok(response.body.metrics.inProgressTasks >= 1);
    assert.ok(response.body.metrics.waitingTasks >= 1);
    assert.ok(response.body.metrics.completedTasks >= 1);
    assert.ok(response.body.metrics.overdueTasks >= 1);
    assert.ok(response.body.recentTasks.length > 0);
    assert.ok(Object.prototype.hasOwnProperty.call(response.body.recentTasks[0], "updatedDate"));
  });

  test("creates, updates, and deletes a project", async () => {
    const app = testApp();
    const createResponse = await request(app)
      .post("/api/projects")
      .send({
        projectId: "PRJ-900",
        projectName: "Warehouse SOP Rollout",
        description: "Standardize warehouse receiving steps.",
        owner: "Mina",
        department: "Operations",
        startDate: "2026-06-11",
        dueDate: "2026-07-15",
        status: "In Progress",
        priority: "High"
      })
      .expect(201);

    assert.equal(createResponse.body.projectName, "Warehouse SOP Rollout");

    const updateResponse = await request(app)
      .put(`/api/projects/${createResponse.body.id}`)
      .send({ status: "Waiting", priority: "Medium" })
      .expect(200);

    assert.equal(updateResponse.body.status, "Waiting");
    assert.equal(updateResponse.body.priority, "Medium");

    await request(app).delete(`/api/projects/${createResponse.body.id}`).expect(204);
    const listResponse = await request(app).get("/api/projects").expect(200);
    assert.equal(listResponse.body.some((project) => project.projectId === "PRJ-900"), false);
  });

  test("creates a task in one request and supports filters", async () => {
    const app = testApp();
    const projects = await request(app).get("/api/projects").expect(200);
    const sops = await request(app).get("/api/sops").expect(200);
    const admin = await request(app).post("/api/login").send({ email: "admin@example.com", password: "admin123" }).expect(200);

    const createResponse = await request(app)
      .post("/api/tasks")
      .set("x-user-id", String(admin.body.user.id))
      .send({
        taskId: "TASK-900",
        taskTitle: "Confirm payroll approval checklist",
        projectId: projects.body[0].id,
        workDetail: "Check approval owners and publish the payroll checklist.",
        sopId: sops.body[0].id,
        assignedTo: "Nok",
        priority: "High",
        startDate: "2026-06-11",
        dueDate: "2026-06-18",
        status: "In Progress",
        progressPercent: 25,
        attachmentUrl: "https://intranet.example/tasks/payroll",
        createdBy: "Admin"
      })
      .expect(201);

    assert.equal(createResponse.body.taskTitle, "Confirm payroll approval checklist");
    assert.match(createResponse.body.createdDate, /^\d{4}-\d{2}-\d{2}/);

    const filtered = await request(app)
      .get("/api/tasks?status=In%20Progress&priority=High&assignedTo=Nok")
      .expect(200);

    assert.equal(filtered.body.some((task) => task.taskId === "TASK-900"), true);
  });

  test("updates and deletes SOP documents", async () => {
    const app = testApp();

    const createResponse = await request(app)
      .post("/api/sops")
      .send({
        sopId: "SOP-900",
        sopName: "New Vendor Registration",
        department: "Finance",
        purpose: "Make vendor onboarding consistent.",
        scope: "All local suppliers.",
        steps: "1. Collect tax ID\n2. Verify bank account\n3. Save approval record",
        owner: "Finance Lead",
        version: "1.0",
        effectiveDate: "2026-06-11",
        status: "Draft",
        attachmentUrl: ""
      })
      .expect(201);

    const updateResponse = await request(app)
      .put(`/api/sops/${createResponse.body.id}`)
      .send({ status: "Active", version: "1.1" })
      .expect(200);

    assert.equal(updateResponse.body.status, "Active");
    assert.equal(updateResponse.body.version, "1.1");

    await request(app).delete(`/api/sops/${createResponse.body.id}`).expect(204);
  });

  test("creates searchable phase 2 SOP documents with folders and files", async () => {
    const app = testApp();

    const folder = await request(app)
      .post("/api/sop-folders")
      .send({ name: "Finance Controls", description: "Month-end SOP folder" })
      .expect(201);

    assert.equal(folder.body.name, "Finance Controls");

    const createResponse = await request(app)
      .post("/api/sops")
      .send({
        sopId: "SOP-901",
        sopName: "Refund Exception Handling",
        documentType: "Procedure",
        category: "Finance Controls",
        department: "Finance",
        purpose: "Control customer refund exceptions.",
        scope: "Refunds above manager threshold.",
        steps: "1. Check request\n2. Attach approval\n3. Publish refund decision",
        content: "<p>Use this SOP for escalated refund exceptions and supporting evidence.</p>",
        tags: ["refund", "exception", "finance"],
        owner: "Nok",
        version: "1.0",
        effectiveDate: "2026-06-11",
        status: "Draft",
        attachmentUrl: "https://intranet.example/refund-form",
        imageUrls: ["https://intranet.example/refund-screen.png"],
        folderId: folder.body.id
      })
      .expect(201);

    assert.equal(createResponse.body.documentType, "Procedure");
    assert.equal(createResponse.body.category, "Finance Controls");
    assert.deepEqual(createResponse.body.tags, ["refund", "exception", "finance"]);
    assert.equal(createResponse.body.imageUrls[0].includes("refund-screen"), true);

    const files = await request(app)
      .post("/api/sop-files")
      .send({
        sopId: createResponse.body.id,
        folderId: folder.body.id,
        fileName: "refund-proof.png",
        fileType: "image",
        fileUrl: "https://intranet.example/refund-proof.png"
      })
      .expect(201);

    assert.equal(files.body.fileName, "refund-proof.png");

    const search = await request(app).get("/api/sops?q=refund%20exceptions").expect(200);
    assert.equal(search.body.some((sop) => sop.sopId === "SOP-901"), true);

    const folders = await request(app).get("/api/sop-folders").expect(200);
    assert.equal(folders.body.some((entry) => entry.name === "Finance Controls"), true);

    const listedFiles = await request(app).get(`/api/sop-files?sopId=${createResponse.body.id}`).expect(200);
    assert.equal(listedFiles.body.some((entry) => entry.fileName === "refund-proof.png"), true);

    const updated = await request(app)
      .put(`/api/sops/${createResponse.body.id}`)
      .send({ status: "Published", content: "<p>Published refund procedure.</p>" })
      .expect(200);

    assert.equal(updated.body.status, "Published");
    assert.equal(updated.body.content.includes("Published refund"), true);
  });

  test("manages enterprise SOP controls, approvals, and training evidence", async () => {
    const app = testApp();

    const createResponse = await request(app)
      .post("/api/sops")
      .send({
        sopId: "SOP-902",
        sopName: "Controlled Customer Complaint Handling",
        documentType: "Procedure",
        category: "Customer Operations",
        department: "Operations",
        purpose: "Standardize complaint intake, escalation, closure, and evidence retention.",
        scope: "All customer complaints received by service teams.",
        steps: "1. Log complaint\n2. Classify severity\n3. Assign owner\n4. Resolve and save evidence",
        content: "<p>Use controlled complaint handling steps and save closure evidence.</p>",
        tags: ["complaint", "customer", "controlled"],
        owner: "Operations Lead",
        reviewer: "Quality Manager",
        approver: "COO",
        approvalStatus: "Pending Review",
        reviewCycleMonths: 12,
        nextReviewDate: "2027-06-11",
        changeSummary: "Initial controlled enterprise template.",
        changeReason: "Create audit-ready complaint procedure.",
        riskLevel: "High",
        accessLevel: "Internal",
        retentionPeriod: "7 years",
        distributionList: ["Customer Service", "Operations", "Management"],
        trainingRequired: true,
        trainingAudience: ["Customer Service", "Operations"],
        controlledCopyLocation: "SharePoint / SOP Library / Customer Operations",
        version: "1.0",
        effectiveDate: "2026-06-11",
        status: "Draft",
        attachmentUrl: ""
      })
      .expect(201);

    assert.equal(createResponse.body.approvalStatus, "Pending Review");
    assert.equal(createResponse.body.reviewer, "Quality Manager");
    assert.equal(createResponse.body.reviewCycleMonths, 12);
    assert.deepEqual(createResponse.body.distributionList, ["Customer Service", "Operations", "Management"]);
    assert.equal(createResponse.body.trainingRequired, true);
    assert.equal(createResponse.body.controlledCopyLocation.includes("SharePoint"), true);

    const approval = await request(app)
      .post(`/api/sops/${createResponse.body.id}/approvals`)
      .send({
        reviewer: "Quality Manager",
        approver: "COO",
        decision: "Approved",
        comment: "Approved for pilot rollout after training."
      })
      .expect(201);

    assert.equal(approval.body.decision, "Approved");

    const approvedSop = await request(app).get("/api/sops?q=approved%20pilot").expect(200);
    const approvedEntry = approvedSop.body.find((sop) => sop.sopId === "SOP-902");
    assert.equal(approvedEntry.approvalStatus, "Approved");
    assert.equal(approvedEntry.status, "Published");

    const acknowledgement = await request(app)
      .post(`/api/sops/${createResponse.body.id}/training-acknowledgements`)
      .send({
        userName: "Nok",
        role: "Customer Service",
        note: "Completed complaint handling training."
      })
      .expect(201);

    assert.equal(acknowledgement.body.userName, "Nok");
    assert.match(acknowledgement.body.acknowledgedDate, /^\d{4}-\d{2}-\d{2}/);

    const evidence = await request(app)
      .get(`/api/sops/${createResponse.body.id}/training-acknowledgements`)
      .expect(200);

    assert.equal(evidence.body.some((entry) => entry.note.includes("complaint handling")), true);

    const search = await request(app).get("/api/sops?q=controlled%20copy%20customer").expect(200);
    assert.equal(search.body.some((sop) => sop.sopId === "SOP-902"), true);
  });

  test("manages process governance, lifecycle audit, evidence, and exceptions", async () => {
    const app = testApp();

    const created = await request(app)
      .post("/api/sops")
      .send({
        sopId: "SOP-903",
        sopName: "Enterprise Control Procedure",
        documentType: "Procedure",
        category: "Enterprise Controls",
        department: "Operations",
        purpose: "Control a cross-functional enterprise process.",
        scope: "Enterprise process owners and control operators.",
        steps: "1. Execute control\n2. Save evidence\n3. Escalate exception",
        content: "<p>Execute the control, retain evidence, and escalate exceptions.</p>",
        owner: "Document Owner",
        responsibilityLevel: "L3 Process Owner",
        responsibleUser: "Mina",
        processOwner: "Process Owner",
        controlOwner: "Control Owner",
        businessCriticality: "Critical",
        businessUnit: "Enterprise Operations",
        processGroup: "Governance",
        processName: "Control Execution",
        subProcess: "Evidence Retention",
        relatedPolicies: ["Policy-001"],
        relatedControls: ["CTRL-001"],
        relatedSystems: ["Core System"],
        upstreamProcess: "Policy Management",
        downstreamProcess: "Audit Review",
        controlObjective: "Ensure control evidence is complete and reviewable.",
        controlFrequency: "Monthly",
        evidenceRequired: ["Signed checklist", "System export"],
        riskMitigated: "Uncontrolled process execution",
        complianceRequirement: "Internal control framework",
        auditOwner: "Internal Audit",
        auditor: "Audit Viewer",
        exceptionHandling: "Log exception, assign owner, approve workaround, close with evidence.",
        requiredApprovals: ["Process Owner", "Audit Owner"],
        reviewer: "Reviewer",
        approver: "Approver",
        approvalStatus: "Draft",
        riskLevel: "High",
        accessLevel: "Restricted",
        retentionPeriod: "7 years",
        distributionList: ["Enterprise Operations"],
        trainingRequired: true,
        trainingAudience: ["Control Operators"],
        controlledCopyLocation: "Controlled Repository / Enterprise Controls",
        version: "1.0",
        effectiveDate: "2026-06-19",
        expiryDate: "2027-06-19",
        nextReviewDate: "2027-03-19",
        status: "Draft",
        attachmentUrl: ""
      })
      .expect(201);

    assert.equal(created.body.processOwner, "Process Owner");
    assert.equal(created.body.responsibilityLevel, "L3 Process Owner");
    assert.equal(created.body.responsibleUser, "Mina");
    assert.equal(created.body.controlOwner, "Control Owner");
    assert.equal(created.body.auditor, "Audit Viewer");
    assert.equal(created.body.businessCriticality, "Critical");
    assert.equal(created.body.processName, "Control Execution");
    assert.deepEqual(created.body.relatedControls, ["CTRL-001"]);
    assert.deepEqual(created.body.evidenceRequired, ["Signed checklist", "System export"]);
    assert.equal(created.body.auditOwner, "Internal Audit");
    assert.equal(created.body.expiryDate, "2027-06-19");

    const transition = await request(app)
      .post(`/api/sops/${created.body.id}/lifecycle-events`)
      .send({
        fromStatus: "Draft",
        toStatus: "In Review",
        userName: "Reviewer",
        reason: "Ready for control review."
      })
      .expect(201);

    assert.equal(transition.body.toStatus, "In Review");
    assert.equal(transition.body.reason.includes("control review"), true);

    const events = await request(app).get(`/api/sops/${created.body.id}/lifecycle-events`).expect(200);
    assert.equal(events.body.some((event) => event.toStatus === "In Review"), true);

    const evidence = await request(app)
      .post(`/api/sops/${created.body.id}/evidence`)
      .send({
        evidenceName: "Signed checklist",
        evidenceType: "document",
        evidenceUrl: "https://intranet.example/evidence/checklist",
        controlReference: "CTRL-001",
        uploadedBy: "Control Operator"
      })
      .expect(201);

    assert.equal(evidence.body.controlReference, "CTRL-001");

    const exception = await request(app)
      .post(`/api/sops/${created.body.id}/exceptions`)
      .send({
        exceptionId: "EXC-903",
        reason: "Evidence export unavailable",
        impact: "Monthly review delayed",
        workaround: "Use supervisor sign-off until export is restored",
        owner: "Process Owner",
        dueDate: "2026-07-01",
        approvalRequired: true,
        closureEvidence: "",
        status: "Open"
      })
      .expect(201);

    assert.equal(exception.body.approvalRequired, true);
    assert.equal(exception.body.status, "Open");

    const detail = await request(app).get(`/api/sops/${created.body.id}/governance`).expect(200);
    assert.equal(detail.body.lifecycleEvents.length, 1);
    assert.equal(detail.body.evidence.length, 1);
    assert.equal(detail.body.exceptions.length, 1);

    const reports = await request(app).get("/api/reports").expect(200);
    assert.ok(reports.body.governance.sopsPendingReview >= 1);
    assert.ok(reports.body.governance.highRiskSops >= 1);
    assert.ok(reports.body.governance.openExceptions >= 1);
    assert.ok(reports.body.governance.controlsWithoutEvidence >= 0);

    const search = await request(app).get("/api/sops?q=control%20owner%20audit%20viewer").expect(200);
    assert.equal(search.body.some((sop) => sop.sopId === "SOP-903"), true);
  });

  test("adds task comments and records activity history", async () => {
    const app = testApp();
    const tasks = await request(app).get("/api/tasks").expect(200);
    const task = tasks.body[0];

    const commentResponse = await request(app)
      .post(`/api/tasks/${task.id}/comments`)
      .send({ userName: "Admin", comment: "Please update the SOP link before Friday." })
      .expect(201);

    assert.ok(commentResponse.body.comment.includes("SOP link"));

    const detailResponse = await request(app).get(`/api/tasks/${task.id}`).expect(200);
    assert.equal(detailResponse.body.comments.some((entry) => entry.comment.includes("SOP link")), true);
    assert.equal(detailResponse.body.activityLog.some((entry) => entry.action === "Comment added"), true);
  });

  test("reports and settings expose simple phase one metadata", async () => {
    const app = testApp();

    const reports = await request(app).get("/api/reports").expect(200);
    assert.ok(reports.body.byStatus.length > 0);
    assert.ok(reports.body.byDepartment.length > 0);

    const settings = await request(app).get("/api/settings").expect(200);
    assert.equal(settings.body.sharePointIntegration.status, "prepared");
    assert.ok(settings.body.statuses.includes("Waiting"));
  });

  test("manages transformation discovery records with AI use cases", async () => {
    const app = testApp();

    const seeded = await request(app).get("/api/transformations").expect(200);
    assert.ok(seeded.body.length >= 2);
    assert.ok(seeded.body[0].painPoints.length > 0);
    assert.ok(seeded.body[0].aiUseCases.length > 0);
    assert.ok(seeded.body[0].implementationPlan.includes("Discovery"));

    const created = await request(app)
      .post("/api/transformations")
      .send({
        discoveryId: "DISC-900",
        clientName: "BrandBoost Demo Client",
        department: "Operations",
        currentWorkflow: "Workshop requests are collected through chat and scattered sheets.",
        painPoints: ["No single owner", "Workshop notes are hard to reuse"],
        repetitiveTasks: ["Summarize workshop notes", "Prepare progress reports"],
        documentsUsed: ["Google Slides", "Google Sheets", "SOP drafts"],
        stakeholders: ["Client owner", "Project specialist", "Internal delivery team"],
        aiUseCases: [
          {
            title: "Workshop Summary Assistant",
            tool: "ChatGPT",
            impact: "Faster workshop recap and clearer next steps",
            difficulty: "Low",
            status: "Pilot"
          }
        ],
        proposedSolution: "Create a structured discovery board with SOPs, AI use cases, and implementation tasks.",
        implementationPlan: "Discovery > Workflow Map > AI Use Case Pilot > Training > Rollout",
        trainingNeeded: "Basic AI prompt workshop for client operations team.",
        status: "In Progress",
        owner: "Admin"
      })
      .expect(201);

    assert.equal(created.body.discoveryId, "DISC-900");
    assert.equal(created.body.aiUseCases[0].title, "Workshop Summary Assistant");

    const search = await request(app).get("/api/transformations?q=workshop%20assistant").expect(200);
    assert.equal(search.body.some((entry) => entry.discoveryId === "DISC-900"), true);

    const department = await request(app).get("/api/transformations?department=Operations").expect(200);
    assert.equal(department.body.some((entry) => entry.clientName === "BrandBoost Demo Client"), true);
  });

  test("login accepts seeded local users", async () => {
    const app = testApp();

    const response = await request(app)
      .post("/api/login")
      .send({ email: "admin@example.com", password: "admin123" })
      .expect(200);

    assert.equal(response.body.user.name, "Admin User");
    assert.equal(response.body.user.userLevel, 1);
  });

  test("only admins can create local users", async () => {
    const app = testApp();

    const adminLogin = await request(app)
      .post("/api/login")
      .send({ email: "admin@example.com", password: "admin123" })
      .expect(200);

    const memberLogin = await request(app)
      .post("/api/login")
      .send({ email: "nok@example.com", password: "task123" })
      .expect(200);
    const managerLogin = await request(app)
      .post("/api/login")
      .send({ email: "mina@example.com", password: "task123" })
      .expect(200);

    await request(app)
      .post("/api/users")
      .set("x-user-id", String(memberLogin.body.user.id))
      .send({
        name: "Pim",
        email: "pim@example.com",
        password: "task123",
        role: "User",
        department: "Sales"
      })
      .expect(403);

    await request(app)
      .post("/api/users")
      .set("x-user-id", String(managerLogin.body.user.id))
      .send({
        name: "Manager Blocked",
        email: "manager-blocked@example.com",
        password: "task123",
        role: "User",
        department: "Sales"
      })
      .expect(403);

    const created = await request(app)
      .post("/api/users")
      .set("x-user-id", String(adminLogin.body.user.id))
      .send({
        name: "Pim",
        email: "pim@example.com",
        password: "task123",
        role: "User",
        department: "Sales"
      })
      .expect(201);

    assert.equal(created.body.email, "pim@example.com");
    assert.equal(created.body.role, "User");
    assert.equal(created.body.userLevel, 3);
    assert.equal(Object.prototype.hasOwnProperty.call(created.body, "password"), false);

    const users = await request(app)
      .get("/api/users")
      .set("x-user-id", String(adminLogin.body.user.id))
      .expect(200);

    const createdUser = users.body.find((user) => user.email === "pim@example.com");
    assert.equal(createdUser.userLevel, 3);
    assert.equal(createdUser.password, "task123");

    await request(app)
      .post("/api/login")
      .send({ email: "pim@example.com", password: "task123" })
      .expect(200);
  });

  test("task creation is limited to user level 2 and above", async () => {
    const app = testApp();
    const projects = await request(app).get("/api/projects").expect(200);
    const sops = await request(app).get("/api/sops").expect(200);
    const manager = await request(app).post("/api/login").send({ email: "mina@example.com", password: "task123" }).expect(200);
    const member = await request(app).post("/api/login").send({ email: "nok@example.com", password: "task123" }).expect(200);

    const payload = {
      taskId: "TASK-901",
      taskTitle: "Manager-created task",
      projectId: projects.body[0].id,
      workDetail: "Manager can create operational tasks.",
      sopId: sops.body[0].id,
      assignedTo: "Nok",
      priority: "Medium",
      startDate: "2026-06-11",
      dueDate: "2026-06-18",
      status: "Not Started",
      progressPercent: 0,
      attachmentUrl: "",
      createdBy: "Mina"
    };

    await request(app)
      .post("/api/tasks")
      .set("x-user-id", String(member.body.user.id))
      .send(payload)
      .expect(403);

    const created = await request(app)
      .post("/api/tasks")
      .set("x-user-id", String(manager.body.user.id))
      .send(payload)
      .expect(201);

    assert.equal(manager.body.user.userLevel, 2);
    assert.equal(member.body.user.userLevel, 3);
    assert.equal(created.body.taskTitle, "Manager-created task");
  });
});
