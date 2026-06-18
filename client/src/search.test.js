import test from "node:test";
import assert from "node:assert/strict";
import { rankSopMatches } from "./search.js";

const sops = [
  {
    sopId: "SOP-001",
    sopName: "Invoice Approval",
    documentType: "Procedure",
    category: "Finance",
    owner: "Nok",
    purpose: "Make invoice approval consistent",
    tags: ["control"]
  },
  {
    sopId: "SOP-002",
    sopName: "New Employee Setup",
    documentType: "Checklist",
    category: "HR",
    owner: "Mina",
    purpose: "Prepare account and laptop",
    tags: ["onboarding"]
  }
];

test("ranks exact SOP title matches first", () => {
  const result = rankSopMatches(sops, "invoice");
  assert.equal(result[0].sopId, "SOP-001");
});

test("matches body metadata while typing", () => {
  const result = rankSopMatches(sops, "onboard");
  assert.equal(result[0].sopId, "SOP-002");
});

test("returns fuzzy matches for imperfect typing", () => {
  const result = rankSopMatches(sops, "invce");
  assert.equal(result[0].sopId, "SOP-001");
});

test("matches enterprise SOP control metadata", () => {
  const result = rankSopMatches([
    ...sops,
    {
      sopId: "SOP-010",
      sopName: "Complaint Handling",
      documentType: "Procedure",
      category: "Customer Operations",
      department: "Operations",
      owner: "Operations Lead",
      reviewer: "Quality Manager",
      approver: "COO",
      approvalStatus: "Pending Review",
      riskLevel: "High",
      accessLevel: "Internal",
      retentionPeriod: "7 years",
      controlledCopyLocation: "SharePoint / SOP Library / Customer Operations",
      trainingAudience: ["Customer Service"],
      distributionList: ["Operations"],
      purpose: "Handle customer complaints.",
      scope: "Customer service teams.",
      content: "",
      steps: "",
      tags: []
    }
  ], "controlled copy customer service");

  assert.equal(result[0].sopId, "SOP-010");
});

test("matches process architecture and compliance metadata", () => {
  const result = rankSopMatches([
    ...sops,
    {
      sopId: "SOP-011",
      sopName: "Enterprise Control Procedure",
      documentType: "Procedure",
      category: "Enterprise Controls",
      department: "Operations",
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
      controlObjective: "Ensure control evidence is complete.",
      controlFrequency: "Monthly",
      evidenceRequired: ["Signed checklist"],
      riskMitigated: "Uncontrolled process execution",
      complianceRequirement: "Internal control framework",
      auditOwner: "Internal Audit",
      auditor: "Audit Viewer",
      exceptionHandling: "Log and approve workaround.",
      requiredApprovals: ["Process Owner"],
      purpose: "Control enterprise process.",
      scope: "Enterprise operators.",
      content: "",
      steps: "",
      tags: []
    }
  ], "control owner audit viewer");

  assert.equal(result[0].sopId, "SOP-011");
});

test("returns no matches for empty queries", () => {
  assert.deepEqual(rankSopMatches(sops, "   "), []);
});
