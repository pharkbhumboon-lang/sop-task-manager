function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function fuzzyIncludes(text, query) {
  if (!query) return false;
  let queryIndex = 0;
  for (const char of text) {
    if (char === query[queryIndex]) queryIndex += 1;
    if (queryIndex === query.length) return true;
  }
  return false;
}

function sopSearchText(sop) {
  return normalize([
    sop.sopId,
    sop.sopName,
    sop.documentType,
    sop.category,
    sop.folderName,
    sop.department,
    sop.owner,
    sop.responsibilityLevel,
    sop.responsibleUser,
    sop.processOwner,
    sop.controlOwner,
    sop.businessCriticality,
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
    sop.purpose,
    sop.scope,
    sop.content,
    sop.steps,
    ...(sop.relatedPolicies ?? []),
    ...(sop.relatedControls ?? []),
    ...(sop.relatedSystems ?? []),
    ...(sop.evidenceRequired ?? []),
    ...(sop.requiredApprovals ?? []),
    ...(sop.distributionList ?? []),
    ...(sop.trainingAudience ?? []),
    ...(sop.tags ?? [])
  ].join(" "));
}

export function rankSopMatches(sops, query, limit = 5) {
  const cleanQuery = normalize(query);
  if (!cleanQuery) return [];

  return sops
    .map((sop) => {
      const haystack = sopSearchText(sop);
      const title = normalize(`${sop.sopId} ${sop.sopName}`);
      const exactTitle = title.includes(cleanQuery);
      const exactBody = haystack.includes(cleanQuery);
      const fuzzy = fuzzyIncludes(haystack.replace(/\s/g, ""), cleanQuery.replace(/\s/g, ""));
      const score = exactTitle ? 3 : exactBody ? 2 : fuzzy ? 1 : 0;
      return { sop, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || String(a.sop.sopId).localeCompare(String(b.sop.sopId)))
    .slice(0, limit)
    .map((entry) => entry.sop);
}
