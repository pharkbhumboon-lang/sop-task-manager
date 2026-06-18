export function getSharePointIntegrationStatus() {
  return {
    status: "prepared",
    mode: "future-extension",
    listMapping: {
      projects: "Projects",
      tasks: "Tasks",
      sops: "SOP Library",
      comments: "Task Comments"
    },
    note: "Phase 1 stores data in local SQLite. This adapter defines the future SharePoint List boundary."
  };
}
