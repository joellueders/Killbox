import net from "node:net";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

async function availablePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitForUrl(url, timeout = 20000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

const serverPort = await availablePort();
const clientPort = await availablePort();
const serverUrl = `http://127.0.0.1:${serverPort}`;
const clientUrl = `http://127.0.0.1:${clientPort}`;
const secret = "smoke-secret";
const env = {
  ...process.env,
  KILLBOX_SERVER_HOST: "127.0.0.1",
  KILLBOX_SERVER_PORT: String(serverPort),
  KILLBOX_PUBLIC_URL: serverUrl,
  KILLBOX_ROOM_SECRET: secret,
  KILLBOX_CLIENT_HOST: "127.0.0.1",
  KILLBOX_CLIENT_PORT: String(clientPort),
  KILLBOX_CLIENT_PUBLIC_URL: clientUrl,
};
const processes = [
  spawn("./node_modules/.bin/tsx", ["src/multiplayer/server/main.ts"], { env, stdio: "pipe" }),
  spawn("./node_modules/.bin/vite", ["--config", "vite.multiplayer.config.ts"], { env, stdio: "pipe" }),
];

let browser;
try {
  const configResponse = await waitForUrl(`${serverUrl}/config`);
  const { roomId } = await configResponse.json();
  await waitForUrl(clientUrl);

  browser = await chromium.launch({ headless: true });
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  const browserErrors = [];
  for (const page of [page1, page2]) {
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
  }
  const joinUrl = `${clientUrl}/?server=${encodeURIComponent(serverUrl)}&room=${encodeURIComponent(roomId)}&secret=${encodeURIComponent(secret)}&autoconnect=1`;
  await Promise.all([page1.goto(joinUrl), page2.goto(joinUrl)]);
  await Promise.all([
    page1.getByTestId("connection-status").waitFor({ state: "visible" }),
    page2.getByTestId("connection-status").waitFor({ state: "visible" }),
  ]);
  await page1.waitForFunction(() => document.querySelectorAll("#players .connected").length === 2);
  await page2.waitForFunction(() => document.querySelectorAll("#players .connected").length === 2);
  await page1.waitForFunction(() => document.querySelector("#players .local")?.textContent?.includes("p1"));
  await page2.waitForFunction(() => document.querySelector("#players .local")?.textContent?.includes("p2"));
  await page1.getByTestId("ready").click();
  await page2.getByTestId("ready").click();
  await page1.waitForFunction(() => document.querySelectorAll("#players .player").length === 2 && document.querySelector("#players")?.textContent?.match(/ready/g)?.length === 2);

  await page1.getByTestId("build-arrow").click();
  await page1.waitForFunction(() => document.querySelector("#session-status")?.textContent?.includes("Towers 1"));
  await page2.waitForFunction(() => document.querySelector("#session-status")?.textContent?.includes("Towers 1"));

  await page1.getByTestId("build-cannon").click();
  await page1.getByTestId("build-cannon").click();
  await page1.waitForFunction(() => document.querySelector("#command-result")?.textContent?.includes("not enough resources"));
  await page1.getByTestId("start-wave").click();
  await page1.waitForFunction(() => document.querySelector("#session-status")?.textContent?.includes("Phase combat"));
  await page2.waitForFunction(() => document.querySelector("#session-status")?.textContent?.includes("Phase combat"));
  await page1.waitForFunction(() => document.querySelector("#session-status")?.textContent?.includes("Outcome victory"), null, { timeout: 30000 });
  await page2.waitForFunction(() => document.querySelector("#session-status")?.textContent?.includes("Outcome victory"), null, { timeout: 30000 });

  await context2.close();
  await page1.waitForFunction(() => document.querySelector('[data-player-id="p2"]')?.textContent?.includes("disconnected"));
  if (browserErrors.length) throw new Error(`Browser errors: ${browserErrors.join(" | ")}`);
  console.log("Killbox multiplayer smoke passed");
  console.log(JSON.stringify({ serverUrl, clientUrl, roomId }, null, 2));
} finally {
  await browser?.close();
  for (const child of processes) child.kill("SIGTERM");
}
