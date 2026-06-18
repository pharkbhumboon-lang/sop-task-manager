import cors from "cors";
import express from "express";
import {
  addComment,
  createDatabase,
  createProject,
  createSopApproval,
  createSop,
  createSopEvidence,
  createSopException,
  createSopFile,
  createSopFolder,
  createSopLifecycleEvent,
  createSopTrainingAcknowledgement,
  createTask,
  createTransformation,
  createUser,
  deleteProject,
  deleteSop,
  deleteTask,
  getDashboard,
  getProject,
  getReports,
  getSettings,
  getSop,
  getSopGovernance,
  getTaskDetail,
  getUser,
  listSopApprovals,
  listSopEvidence,
  listSopExceptions,
  listProjects,
  listSopFiles,
  listSopFolders,
  listSops,
  listSopTrainingAcknowledgements,
  listSopLifecycleEvents,
  listTasks,
  listTransformations,
  listUsers,
  login,
  updateProject,
  updateSop,
  updateTask
} from "./db.js";
import { getSharePointIntegrationStatus } from "./sharepointAdapter.js";

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function notFound(res, message = "Record not found") {
  return res.status(404).json({ error: message });
}

function requireAdmin(db, req, res) {
  const userId = Number(req.get("x-user-id"));
  const user = Number.isFinite(userId) ? getUser(db, userId) : null;
  if (!user || user.role !== "Admin") {
    res.status(403).json({ error: "Admin role required" });
    return null;
  }
  return user;
}

function requireUserLevel(db, req, res, maxLevel) {
  const userId = Number(req.get("x-user-id"));
  const user = Number.isFinite(userId) ? getUser(db, userId) : null;
  if (!user || user.userLevel > maxLevel) {
    res.status(403).json({ error: `User level ${maxLevel} or above required` });
    return null;
  }
  return user;
}

export function createApp(options = {}) {
  const app = express();
  const db = createDatabase(options.databasePath);

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, app: "SOP Task Manager" });
  });

  app.post("/api/login", asyncRoute((req, res) => {
    const user = login(db, req.body.email, req.body.password);
    if (!user) return res.status(401).json({ error: "Invalid email or password" });
    return res.json({ user });
  }));

  app.get("/api/users", asyncRoute((req, res) => {
    if (!requireAdmin(db, req, res)) return;
    return res.json(listUsers(db));
  }));

  app.post("/api/users", asyncRoute((req, res) => {
    if (!requireAdmin(db, req, res)) return;
    return res.status(201).json(createUser(db, req.body));
  }));

  app.get("/api/dashboard", asyncRoute((_req, res) => {
    res.json(getDashboard(db));
  }));

  app.get("/api/projects", asyncRoute((_req, res) => {
    res.json(listProjects(db));
  }));

  app.post("/api/projects", asyncRoute((req, res) => {
    res.status(201).json(createProject(db, req.body));
  }));

  app.put("/api/projects/:id", asyncRoute((req, res) => {
    const project = updateProject(db, Number(req.params.id), req.body);
    return project ? res.json(project) : notFound(res);
  }));

  app.delete("/api/projects/:id", asyncRoute((req, res) => {
    if (!getProject(db, Number(req.params.id))) return notFound(res);
    deleteProject(db, Number(req.params.id));
    return res.status(204).end();
  }));

  app.get("/api/sops", asyncRoute((req, res) => {
    res.json(listSops(db, req.query));
  }));

  app.post("/api/sops", asyncRoute((req, res) => {
    res.status(201).json(createSop(db, req.body));
  }));

  app.put("/api/sops/:id", asyncRoute((req, res) => {
    const sop = updateSop(db, Number(req.params.id), req.body);
    return sop ? res.json(sop) : notFound(res);
  }));

  app.delete("/api/sops/:id", asyncRoute((req, res) => {
    if (!getSop(db, Number(req.params.id))) return notFound(res);
    deleteSop(db, Number(req.params.id));
    return res.status(204).end();
  }));

  app.get("/api/sops/:id/approvals", asyncRoute((req, res) => {
    if (!getSop(db, Number(req.params.id))) return notFound(res);
    res.json(listSopApprovals(db, Number(req.params.id)));
  }));

  app.post("/api/sops/:id/approvals", asyncRoute((req, res) => {
    if (!getSop(db, Number(req.params.id))) return notFound(res);
    res.status(201).json(createSopApproval(db, Number(req.params.id), req.body));
  }));

  app.get("/api/sops/:id/training-acknowledgements", asyncRoute((req, res) => {
    if (!getSop(db, Number(req.params.id))) return notFound(res);
    res.json(listSopTrainingAcknowledgements(db, Number(req.params.id)));
  }));

  app.post("/api/sops/:id/training-acknowledgements", asyncRoute((req, res) => {
    if (!getSop(db, Number(req.params.id))) return notFound(res);
    res.status(201).json(createSopTrainingAcknowledgement(db, Number(req.params.id), req.body));
  }));

  app.get("/api/sops/:id/lifecycle-events", asyncRoute((req, res) => {
    if (!getSop(db, Number(req.params.id))) return notFound(res);
    res.json(listSopLifecycleEvents(db, Number(req.params.id)));
  }));

  app.post("/api/sops/:id/lifecycle-events", asyncRoute((req, res) => {
    if (!getSop(db, Number(req.params.id))) return notFound(res);
    res.status(201).json(createSopLifecycleEvent(db, Number(req.params.id), req.body));
  }));

  app.get("/api/sops/:id/evidence", asyncRoute((req, res) => {
    if (!getSop(db, Number(req.params.id))) return notFound(res);
    res.json(listSopEvidence(db, Number(req.params.id)));
  }));

  app.post("/api/sops/:id/evidence", asyncRoute((req, res) => {
    if (!getSop(db, Number(req.params.id))) return notFound(res);
    res.status(201).json(createSopEvidence(db, Number(req.params.id), req.body));
  }));

  app.get("/api/sops/:id/exceptions", asyncRoute((req, res) => {
    if (!getSop(db, Number(req.params.id))) return notFound(res);
    res.json(listSopExceptions(db, Number(req.params.id)));
  }));

  app.post("/api/sops/:id/exceptions", asyncRoute((req, res) => {
    if (!getSop(db, Number(req.params.id))) return notFound(res);
    res.status(201).json(createSopException(db, Number(req.params.id), req.body));
  }));

  app.get("/api/sops/:id/governance", asyncRoute((req, res) => {
    const governance = getSopGovernance(db, Number(req.params.id));
    return governance ? res.json(governance) : notFound(res);
  }));

  app.get("/api/sop-folders", asyncRoute((_req, res) => {
    res.json(listSopFolders(db));
  }));

  app.post("/api/sop-folders", asyncRoute((req, res) => {
    res.status(201).json(createSopFolder(db, req.body));
  }));

  app.get("/api/sop-files", asyncRoute((req, res) => {
    res.json(listSopFiles(db, req.query));
  }));

  app.post("/api/sop-files", asyncRoute((req, res) => {
    res.status(201).json(createSopFile(db, req.body));
  }));

  app.get("/api/tasks", asyncRoute((req, res) => {
    res.json(listTasks(db, req.query));
  }));

  app.post("/api/tasks", asyncRoute((req, res) => {
    if (!requireUserLevel(db, req, res, 2)) return;
    res.status(201).json(createTask(db, req.body));
  }));

  app.get("/api/tasks/:id", asyncRoute((req, res) => {
    const task = getTaskDetail(db, Number(req.params.id));
    return task ? res.json(task) : notFound(res);
  }));

  app.put("/api/tasks/:id", asyncRoute((req, res) => {
    const task = updateTask(db, Number(req.params.id), req.body);
    return task ? res.json(task) : notFound(res);
  }));

  app.delete("/api/tasks/:id", asyncRoute((req, res) => {
    const task = getTaskDetail(db, Number(req.params.id));
    if (!task) return notFound(res);
    deleteTask(db, Number(req.params.id));
    return res.status(204).end();
  }));

  app.post("/api/tasks/:id/comments", asyncRoute((req, res) => {
    const task = getTaskDetail(db, Number(req.params.id));
    if (!task) return notFound(res);
    const comment = addComment(db, Number(req.params.id), req.body.userName, req.body.comment);
    return res.status(201).json(comment);
  }));

  app.get("/api/transformations", asyncRoute((req, res) => {
    res.json(listTransformations(db, req.query));
  }));

  app.post("/api/transformations", asyncRoute((req, res) => {
    res.status(201).json(createTransformation(db, req.body));
  }));

  app.get("/api/reports", asyncRoute((_req, res) => {
    res.json(getReports(db));
  }));

  app.get("/api/settings", asyncRoute((_req, res) => {
    res.json({
      ...getSettings(),
      sharePointIntegration: getSharePointIntegrationStatus()
    });
  }));

  app.use((err, _req, res, _next) => {
    res.status(400).json({ error: err.message });
  });

  app.locals.db = db;
  return app;
}
