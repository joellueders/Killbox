import type { Client } from "colyseus";
import { Room } from "colyseus";
import type { CommandResult, GameCommand } from "../shared/commands";
import { isGameCommand } from "../shared/commands";
import { applyCommand, simulationTick } from "../shared/game";
import { GameState, createInitialGameState, type PlayerId } from "../shared/schema";

export const COOP_ROOM_NAME = "killbox_coop";
export const SIMULATION_INTERVAL_MS = 50;

let expectedRoomSecret = "dev-secret";

export function configureRoomSecret(secret: string) {
  expectedRoomSecret = secret;
}

export class CoopRoom extends Room<{ state: GameState }> {
  maxClients = 2;
  private playerBySession = new Map<string, PlayerId>();
  private hasAcceptedPlayer = false;

  onCreate() {
    this.autoDispose = false;
    this.setState(createInitialGameState());
    this.onMessage("command", (client, payload: unknown) => {
      this.handleCommand(client, payload);
    });
    this.setSimulationInterval(() => simulationTick(this.state), SIMULATION_INTERVAL_MS);
  }

  onAuth(_client: Client, options: { roomSecret?: string }) {
    return options?.roomSecret === expectedRoomSecret;
  }

  onJoin(client: Client) {
    const playerId = this.firstAvailablePlayer();
    if (!playerId) {
      client.leave(4000, "room is full");
      return;
    }
    this.playerBySession.set(client.sessionId, playerId);
    const slot = this.state.players.get(playerId);
    if (slot) {
      slot.connected = true;
      slot.ready = false;
    }
    this.hasAcceptedPlayer = true;
    this.autoDispose = true;
    client.send("assigned_slot", { playerId });
  }

  onLeave(client: Client) {
    const playerId = this.playerBySession.get(client.sessionId);
    if (!playerId) return;
    this.playerBySession.delete(client.sessionId);
    const slot = this.state.players.get(playerId);
    if (slot) {
      slot.connected = false;
      slot.ready = false;
    }
  }

  canDispose() {
    return this.hasAcceptedPlayer && this.clients.length === 0;
  }

  private firstAvailablePlayer(): PlayerId | undefined {
    for (const id of ["p1", "p2"] as const) {
      if (!this.state.players.get(id)?.connected) return id;
    }
    return undefined;
  }

  private handleCommand(client: Client, payload: unknown) {
    const playerId = this.playerBySession.get(client.sessionId);
    let result: CommandResult;
    if (!playerId) {
      result = { ok: false, commandType: "unknown", reason: "client has no player slot" };
    } else if (!isGameCommand(payload)) {
      result = { ok: false, commandType: "unknown", reason: "unsupported command" };
    } else {
      result = applyCommand(this.state, playerId, payload as GameCommand);
    }
    client.send("command_result", result);
  }
}
