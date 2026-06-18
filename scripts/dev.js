import { spawn } from "node:child_process";

const commands = [
  { name: "api", command: "npm run dev --workspace server" },
  { name: "web", command: "npm run dev --workspace client" }
];

const children = commands.map(({ name, command }) => {
  const child = spawn("cmd.exe", ["/d", "/s", "/c", command], {
    cwd: process.cwd(),
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });

  child.stdout.on("data", (data) => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on("data", (data) => process.stderr.write(`[${name}] ${data}`));
  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
      process.exitCode = code;
      children.forEach((running) => running.kill());
    }
  });
  return child;
});

process.on("SIGINT", () => {
  children.forEach((child) => child.kill("SIGINT"));
  process.exit(0);
});
