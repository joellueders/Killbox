import net from "node:net";
import { Client, type Room } from "@colyseus/sdk";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GameState } from "../../src/multiplayer/shared/schema";
import { startMultiplayerServer, type RunningMultiplayerServer } from "../../src/multiplayer/server/server";

let running: RunningMultiplayerServer;
let endpoint: string;

async function availablePort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function waitFor(predicate: () => boolean | Promise<boolean>, timeout = 5000) {
  const deadline = Date.now() + timeout;
  while (!(await predicate())) {
    if (Date.now() > deadline) throw new Error("timed out waiting for synchronized state");
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

async function join(roomId: string, secret = "integration-secret"): Promise<Room<unknown, GameState>> {
  return await new Client(endpoint).joinById(roomId, { roomSecret: secret }, GameState);
}

beforeAll(async () => {
  const port = await availablePort();
  endpoint = `http://127.0.0.1:${port}`;
  running = await startMultiplayerServer({
    host: "127.0.0.1",
    port,
    publicUrl: endpoint,
    roomSecret: "integration-secret",
  });
});

afterAll(async () => {
  await running?.close();
});

describe("Colyseus cooperative room", () => {
  it("rejects invalid secrets", async () => {
    await expect(join(running.roomId, "wrong-secret")).rejects.toThrow();
  });

  it("assigns two slots, synchronizes commands, rejects overflow, and exposes disconnects", async () => {
    const p1 = await join(running.roomId);
    const p2 = await join(running.roomId);
    await waitFor(() => p1.state.players.get("p1")?.connected === true && p1.state.players.get("p2")?.connected === true);

    expect(p1.state.players.get("p1")!.connected).toBe(true);
    expect(p1.state.players.get("p2")!.connected).toBe(true);
    await expect(join(running.roomId)).rejects.toThrow();

    p1.send("command", { type: "ready", ready: true });
    p2.send("command", { type: "ready", ready: true });
    await waitFor(() => p1.state.players.get("p1")?.ready === true && p1.state.players.get("p2")?.ready === true);

    p1.send("command", { type: "build_tower", siteId: "site-1", towerType: "arrow" });
    await waitFor(() => p1.state.towers.size === 1 && p2.state.towers.size === 1);
    expect([...p1.state.towers.values()][0].ownerId).toBe("p1");
    p2.send("command", { type: "build_tower", siteId: "site-2", towerType: "arrow" });
    await waitFor(() => p1.state.towers.size === 2 && p2.state.towers.size === 2);
    expect([...p1.state.towers.values()].some((tower) => tower.ownerId === "p2")).toBe(true);
    const resources = p1.state.players.get("p1")!.resources;
    p1.send("command", { type: "build_tower", siteId: "site-1", towerType: "arrow" });
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(p1.state.towers.size).toBe(2);
    expect(p1.state.players.get("p1")!.resources).toBe(resources);

    p1.send("command", { type: "start_wave" });
    await waitFor(() => p1.state.phase === "combat" && p2.state.phase === "combat");
    await p2.leave();
    await waitFor(() => p1.state.players.get("p2")?.connected === false);
    await p1.leave();
  });

  it("creates a new singleton room after the previous room becomes empty", async () => {
    let roomId = running.roomId;
    await waitFor(async () => {
      const response = await fetch(`${endpoint}/config`);
      const config = (await response.json()) as { roomId: string };
      roomId = config.roomId;
      return roomId !== running.roomId;
    });
    expect(roomId).not.toBe(running.roomId);
    running.roomId = roomId;
  });
});
