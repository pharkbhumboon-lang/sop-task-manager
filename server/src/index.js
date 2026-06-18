import { mkdirSync } from "node:fs";
import path from "node:path";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 5174);
const databasePath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "sop-task-manager.sqlite");

mkdirSync(path.dirname(databasePath), { recursive: true });

const app = createApp({ databasePath });

app.listen(port, () => {
  console.log(`SOP Task Manager API running at http://localhost:${port}`);
});
