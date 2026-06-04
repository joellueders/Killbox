import { spawn } from "node:child_process";

const required = ["KILLBOX_PUBLIC_URL", "KILLBOX_CLIENT_PUBLIC_URL", "KILLBOX_ROOM_SECRET"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing required Tailscale configuration: ${missing.join(", ")}`);
  console.error("See docs/tailscale-multiplayer.md for the complete setup.");
  process.exit(1);
}

const env = {
  ...process.env,
  KILLBOX_MODE: "tailscale",
  KILLBOX_SERVER_HOST: process.env.KILLBOX_SERVER_HOST ?? "0.0.0.0",
  KILLBOX_CLIENT_HOST: process.env.KILLBOX_CLIENT_HOST ?? "0.0.0.0",
};

console.log(`[killbox] Tailscale Colyseus endpoint: ${env.KILLBOX_PUBLIC_URL}`);
console.log(`[killbox] Tailscale client URL: ${env.KILLBOX_CLIENT_PUBLIC_URL}`);
console.log("[killbox] The room ID is printed by the server. Share the room secret separately.");

const child = spawn("npm", ["run", "dev:multiplayer"], {
  env,
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => child.kill(signal));
}

child.on("exit", (code) => process.exit(code ?? 0));
