import { isSupabaseMode, supabaseApi } from "./supabaseApi.js";

async function request(path, options = {}) {
  const { headers = {}, ...requestOptions } = options;
  const response = await fetch(path, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });

  if (response.status === 204) return null;

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }
  return payload;
}

function userHeader(user) {
  return user?.id ? { "x-user-id": String(user.id) } : {};
}

const localApi = {
  dashboard: () => request("/api/dashboard"),
  login: (payload) => request("/api/login", { method: "POST", body: JSON.stringify(payload) }),
  reports: () => request("/api/reports"),
  settings: () => request("/api/settings"),
  users: (user) => request("/api/users", { headers: userHeader(user) }),
  createUser: (payload, user) => request("/api/users", { method: "POST", headers: userHeader(user), body: JSON.stringify(payload) }),
  projects: () => request("/api/projects"),
  createProject: (payload) => request("/api/projects", { method: "POST", body: JSON.stringify(payload) }),
  updateProject: (id, payload) => request(`/api/projects/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteProject: (id) => request(`/api/projects/${id}`, { method: "DELETE" }),
  sops: (params = {}) => request(`/api/sops?${new URLSearchParams(params).toString()}`),
  createSop: (payload) => request("/api/sops", { method: "POST", body: JSON.stringify(payload) }),
  updateSop: (id, payload) => request(`/api/sops/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteSop: (id) => request(`/api/sops/${id}`, { method: "DELETE" }),
  sopApprovals: (id) => request(`/api/sops/${id}/approvals`),
  createSopApproval: (id, payload) => request(`/api/sops/${id}/approvals`, { method: "POST", body: JSON.stringify(payload) }),
  sopTrainingAcknowledgements: (id) => request(`/api/sops/${id}/training-acknowledgements`),
  createSopTrainingAcknowledgement: (id, payload) => request(`/api/sops/${id}/training-acknowledgements`, { method: "POST", body: JSON.stringify(payload) }),
  sopGovernance: (id) => request(`/api/sops/${id}/governance`),
  createSopLifecycleEvent: (id, payload) => request(`/api/sops/${id}/lifecycle-events`, { method: "POST", body: JSON.stringify(payload) }),
  createSopEvidence: (id, payload) => request(`/api/sops/${id}/evidence`, { method: "POST", body: JSON.stringify(payload) }),
  createSopException: (id, payload) => request(`/api/sops/${id}/exceptions`, { method: "POST", body: JSON.stringify(payload) }),
  sopFolders: () => request("/api/sop-folders"),
  createSopFolder: (payload) => request("/api/sop-folders", { method: "POST", body: JSON.stringify(payload) }),
  sopFiles: (params = {}) => request(`/api/sop-files?${new URLSearchParams(params).toString()}`),
  createSopFile: (payload) => request("/api/sop-files", { method: "POST", body: JSON.stringify(payload) }),
  tasks: (params = {}) => request(`/api/tasks?${new URLSearchParams(params).toString()}`),
  task: (id) => request(`/api/tasks/${id}`),
  createTask: (payload, user) => request("/api/tasks", { method: "POST", headers: userHeader(user), body: JSON.stringify(payload) }),
  updateTask: (id, payload, user) => request(`/api/tasks/${id}`, { method: "PUT", headers: userHeader(user), body: JSON.stringify(payload) }),
  deleteTask: (id) => request(`/api/tasks/${id}`, { method: "DELETE" }),
  addComment: (id, payload) => request(`/api/tasks/${id}/comments`, { method: "POST", body: JSON.stringify(payload) }),
  transformations: (params = {}) => request(`/api/transformations?${new URLSearchParams(params).toString()}`),
  createTransformation: (payload) => request("/api/transformations", { method: "POST", body: JSON.stringify(payload) })
};

export { isSupabaseMode };
export const api = isSupabaseMode ? supabaseApi : localApi;
