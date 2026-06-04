import { readFile } from "node:fs/promises";
import { Client, type Room } from "@colyseus/sdk";
import type { CommandResult } from "../shared/commands";
import { GameState, type PlayerId } from "../shared/schema";
import { validateRoleBrief, type RoleBrief } from "./contracts";
import { digestGameState } from "./evidence";
import type { WorkerAction, WorkerObservation, WorkerResponse } from "./adapters";

const briefPath = process.env.KILLBOX_VALIDATION_BRIEF;
const secret = process.env.KILLBOX_VALIDATION_SECRET;
if (!briefPath || !secret) throw new Error("validation worker requires brief path and secret");

const brief = JSON.parse(await readFile(briefPath, "utf8")) as RoleBrief;
validateRoleBrief(brief);
if ((brief.role !== "p1" && brief.role !== "p2") || !brief.connection) {
  throw new Error("deterministic player worker requires a player role brief");
}

let room: Room<unknown, GameState>;
let assignedSlot: PlayerId | undefined;
const commandResults: CommandResult[] = [];
const commandWaiters: Array<(result: CommandResult) => void> = [];

function send(message: unknown) {
  process.send?.(message);
}

function observation(): WorkerObservation {
  const state = room.state;
  if (!assignedSlot) throw new Error("worker has no assigned slot");
  return {
    assignedSlot,
    digest: digestGameState(state),
    phase: state.phase,
    tick: state.tick,
    baseHealth: state.baseHealth,
    outcome: state.outcome,
    wave: { number: state.wave.number, completed: state.wave.completed },
    players: Object.fromEntries(
      [...state.players.entries()].map(([id, player]) => [
        id,
        { connected: player.connected, ready: player.ready, resources: player.resources },
      ]),
    ),
    towers: [...state.towers.values()].map((tower) => ({
      id: tower.id,
      ownerId: tower.ownerId,
      siteId: tower.siteId,
      level: tower.level,
    })),
    enemies: state.enemies.size,
  };
}

async function waitForCommandResult(): Promise<CommandResult> {
  const queued = commandResults.shift();
  if (queued) return queued;
  return await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("command result timed out")), 5_000);
    commandWaiters.push((result) => {
      clearTimeout(timer);
      resolve(result);
    });
  });
}

async function execute(action: WorkerAction): Promise<WorkerResponse> {
  switch (action.action) {
    case "observe":
      return { ok: true, observation: observation() };
    case "ready":
      room.send("command", { type: "ready", ready: action.ready });
      return { ok: true, commandResult: await waitForCommandResult(), observation: observation() };
    case "build":
      room.send("command", { type: "build_tower", siteId: action.siteId, towerType: action.towerType });
      return { ok: true, commandResult: await waitForCommandResult(), observation: observation() };
    case "start-wave":
      room.send("command", { type: "start_wave" });
      return { ok: true, commandResult: await waitForCommandResult(), observation: observation() };
    case "delay":
      await new Promise((resolve) => setTimeout(resolve, action.milliseconds));
      return { ok: true, observation: observation() };
    case "leave":
      await room.leave();
      return { ok: true };
  }
}

try {
  const client = new Client(brief.connection.serverUrl);
  room = await client.joinById(brief.connection.roomId, { roomSecret: secret }, GameState);
  room.onMessage("assigned_slot", ({ playerId }: { playerId: PlayerId }) => {
    assignedSlot = playerId;
  });
  room.onMessage("command_result", (result: CommandResult) => {
    const waiter = commandWaiters.shift();
    if (waiter) waiter(result);
    else commandResults.push(result);
  });
  const deadline = Date.now() + 5_000;
  while (!assignedSlot && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  if (!assignedSlot) throw new Error("assigned slot was not received");

  process.on("message", async (message: { type?: string; id?: string; action?: WorkerAction }) => {
    if (message.type !== "action" || !message.id || !message.action) return;
    try {
      send({ type: "response", id: message.id, response: await execute(message.action) });
    } catch (error) {
      send({
        type: "response",
        id: message.id,
        response: { ok: false, error: error instanceof Error ? error.message : String(error) },
      });
    }
  });
  send({ type: "ready", role: brief.role });
} catch (error) {
  send({ type: "fatal", error: error instanceof Error ? error.message : String(error) });
  process.exitCode = 1;
}
