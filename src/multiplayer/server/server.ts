import cors from "cors";
import { Server, WebSocketTransport, matchMaker } from "colyseus";
import {
  CoopRoom,
  COOP_ROOM_NAME,
  configureRoomSecret,
  configureSimulationInterval,
  SIMULATION_INTERVAL_MS,
} from "./CoopRoom";
import { loadMultiplayerConfig, type MultiplayerConfig } from "./config";
import { configureValidationObserver, type ValidationObserver } from "./validationObserver";

export type RunningMultiplayerServer = {
  gameServer: Server;
  config: MultiplayerConfig;
  roomId: string;
  close: () => Promise<void>;
};

export type MultiplayerServerOptions = Partial<MultiplayerConfig> & {
  simulationIntervalMs?: number;
  validationObserver?: ValidationObserver;
};

let pendingRoom: Promise<string> | undefined;

async function ensureCoopRoom(): Promise<string> {
  if (pendingRoom) return pendingRoom;
  pendingRoom = (async () => {
    const existing = await matchMaker.query({ name: COOP_ROOM_NAME });
    if (existing[0]) return existing[0].roomId;
    const room = await matchMaker.createRoom(COOP_ROOM_NAME, {});
    return room.roomId;
  })();
  try {
    return await pendingRoom;
  } finally {
    pendingRoom = undefined;
  }
}

export async function startMultiplayerServer(
  overrides: MultiplayerServerOptions = {},
): Promise<RunningMultiplayerServer> {
  const config = loadMultiplayerConfig(overrides);
  configureRoomSecret(config.roomSecret);
  configureSimulationInterval(overrides.simulationIntervalMs ?? SIMULATION_INTERVAL_MS);
  configureValidationObserver(overrides.validationObserver);

  const transport = new WebSocketTransport();
  const gameServer = new Server({
    transport,
    greet: false,
    express: (app) => {
      app.use(cors());
      app.get("/health", (_request, response) => {
        response.json({ ok: true, mode: config.mode });
      });
      app.get("/config", async (_request, response, next) => {
        try {
          const roomId = await ensureCoopRoom();
          response.json({
            serverUrl: config.publicUrl,
            roomId,
            mode: config.mode,
          });
        } catch (error) {
          next(error);
        }
      });
    },
  });
  gameServer.define(COOP_ROOM_NAME, CoopRoom);
  await gameServer.listen(config.port, config.host);
  const roomId = await ensureCoopRoom();

  return {
    gameServer,
    config,
    roomId,
    close: async () => {
      await gameServer.gracefullyShutdown(false);
      configureValidationObserver(undefined);
      configureSimulationInterval(SIMULATION_INTERVAL_MS);
    },
  };
}

export function multiplayerJoinUrl(config: MultiplayerConfig, roomId: string): string {
  const query = new URLSearchParams({
    server: config.publicUrl,
    room: roomId,
  });
  return `${config.clientPublicUrl}/?${query.toString()}`;
}
