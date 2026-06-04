import { pathToFileURL } from "node:url";
import { multiplayerJoinUrl, startMultiplayerServer } from "./server";

async function main() {
  const running = await startMultiplayerServer();
  const joinUrl = multiplayerJoinUrl(running.config, running.roomId);
  console.log(`[killbox] Colyseus server: ${running.config.publicUrl}`);
  console.log(`[killbox] Bind address: ${running.config.host}:${running.config.port}`);
  console.log(`[killbox] Room: ${running.roomId}`);
  console.log(`[killbox] Client join URL: ${joinUrl}`);
  console.log("[killbox] Enter KILLBOX_ROOM_SECRET in the client; it is not embedded in the URL.");

  const shutdown = async () => {
    await running.close();
    process.exit(0);
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
