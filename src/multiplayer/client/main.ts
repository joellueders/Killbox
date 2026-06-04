import Phaser from "phaser";
import { Client, type Room } from "@colyseus/sdk";
import type { CommandResult, GameCommand } from "../shared/commands";
import { GameState, type PlayerId } from "../shared/schema";
import { GameScene } from "./GameScene";

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const serverInput = byId<HTMLInputElement>("server-url");
const roomInput = byId<HTMLInputElement>("room-id");
const secretInput = byId<HTMLInputElement>("room-secret");
const connectionStatus = byId<HTMLDivElement>("connection-status");
const sessionStatus = byId<HTMLDivElement>("session-status");
const players = byId<HTMLDivElement>("players");
const commandResult = byId<HTMLDivElement>("command-result");
const connectButton = byId<HTMLButtonElement>("connect");
const params = new URLSearchParams(location.search);

serverInput.value = params.get("server") ?? "http://127.0.0.1:2567";
roomInput.value = params.get("room") ?? "";
secretInput.value = params.get("secret") ?? "";

const scene = new GameScene();
new Phaser.Game({
  type: Phaser.AUTO,
  width: 1100,
  height: 520,
  parent: "game",
  backgroundColor: "#201813",
  scene,
  render: { antialias: true },
});

let room: Room | undefined;
let localPlayerId: PlayerId | undefined;
let latestState: GameState | undefined;

function setConnection(text: string, online = false) {
  connectionStatus.textContent = text;
  connectionStatus.classList.toggle("online", online);
  connectionStatus.classList.toggle("offline", !online);
}

function showResult(result: CommandResult) {
  commandResult.textContent = result.ok
    ? `Accepted: ${result.commandType}`
    : `Rejected: ${result.reason ?? result.commandType}`;
  commandResult.classList.toggle("error", !result.ok);
}

function updateHud(state: GameState) {
  latestState = state;
  scene.setAuthoritativeState(state);
  sessionStatus.textContent =
    `Phase ${state.phase} | Tick ${state.tick} | Wave ${state.wave.number} | ` +
    `Base ${state.baseHealth} | Towers ${state.towers.size} | Enemies ${state.enemies.size} | ` +
    `Outcome ${state.outcome || "pending"}`;

  players.replaceChildren();
  state.players.forEach((player) => {
    const card = document.createElement("div");
    card.className = `player ${player.connected ? "connected" : ""} ${player.id === localPlayerId ? "local" : ""}`;
    card.dataset.playerId = player.id;
    card.textContent =
      `${player.id}${player.id === localPlayerId ? " (you)" : ""}: ` +
      `${player.connected ? "connected" : "disconnected"}, ` +
      `${player.ready ? "ready" : "not ready"}, ${player.resources} supplies`;
    players.append(card);
  });
}

async function resolveRoomId(serverUrl: string): Promise<string> {
  if (roomInput.value.trim()) return roomInput.value.trim();
  const response = await fetch(`${serverUrl.replace(/\/$/, "")}/config`);
  if (!response.ok) throw new Error(`Server config failed: ${response.status}`);
  const config = (await response.json()) as { roomId: string };
  roomInput.value = config.roomId;
  return config.roomId;
}

async function connect() {
  connectButton.disabled = true;
  setConnection("Connecting...");
  try {
    const serverUrl = serverInput.value.trim();
    const roomId = await resolveRoomId(serverUrl);
    const client = new Client(serverUrl);
    room = await client.joinById(roomId, { roomSecret: secretInput.value }, GameState);
    setConnection(`Connected to ${roomId}`, true);
    room.onMessage("assigned_slot", ({ playerId }: { playerId: PlayerId }) => {
      localPlayerId = playerId;
      if (latestState) updateHud(latestState);
    });
    room.onMessage("command_result", (result: CommandResult) => showResult(result));
    room.onStateChange((state) => updateHud(state as GameState));
    room.onLeave((_code, reason) => {
      setConnection(`Disconnected${reason ? `: ${reason}` : ""}`);
      room = undefined;
    });
  } catch (error) {
    setConnection(`Join failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    connectButton.disabled = false;
  }
}

function firstAvailableSite(): string | undefined {
  let result: string | undefined;
  latestState?.buildSites.forEach((site) => {
    if (!result && !site.occupiedTowerId) result = site.id;
  });
  return result;
}

function firstOwnedTower(): string | undefined {
  let result: string | undefined;
  latestState?.towers.forEach((tower) => {
    if (!result && tower.ownerId === localPlayerId) result = tower.id;
  });
  return result;
}

function firstReward(): string | undefined {
  let result: string | undefined;
  latestState?.rewards.forEach((reward) => {
    if (!result && !reward.claimed) result = reward.id;
  });
  return result;
}

function send(command: GameCommand | undefined) {
  if (!room || !command) {
    showResult({ ok: false, commandType: command?.type ?? "unknown", reason: "no valid target or room" });
    return;
  }
  room.send("command", command);
}

connectButton.addEventListener("click", connect);
document.querySelectorAll<HTMLButtonElement>("[data-command]").forEach((button) => {
  button.addEventListener("click", () => {
    switch (button.dataset.command) {
      case "ready":
        send({ type: "ready", ready: true });
        break;
      case "start_wave":
        send({ type: "start_wave" });
        break;
      case "build_arrow":
        send(firstAvailableSite() ? { type: "build_tower", siteId: firstAvailableSite()!, towerType: "arrow" } : undefined);
        break;
      case "build_cannon":
        send(firstAvailableSite() ? { type: "build_tower", siteId: firstAvailableSite()!, towerType: "cannon" } : undefined);
        break;
      case "upgrade_tower":
        send(firstOwnedTower() ? { type: "upgrade_tower", towerId: firstOwnedTower()! } : undefined);
        break;
      case "sell_tower":
        send(firstOwnedTower() ? { type: "sell_tower", towerId: firstOwnedTower()! } : undefined);
        break;
      case "cast_ability":
        send({ type: "cast_ability", abilityId: "volley" });
        break;
      case "choose_reward":
        send(firstReward() ? { type: "choose_reward", rewardId: firstReward()! } : undefined);
        break;
    }
  });
});

if (params.get("autoconnect") === "1" && secretInput.value) {
  connect();
}
