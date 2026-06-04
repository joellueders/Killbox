export type MultiplayerConfig = {
  host: string;
  port: number;
  publicUrl: string;
  roomSecret: string;
  mode: "local" | "tailscale";
  clientHost: string;
  clientPort: number;
  clientPublicUrl: string;
};

export function loadMultiplayerConfig(
  overrides: Partial<MultiplayerConfig> = {},
): MultiplayerConfig {
  const mode = overrides.mode ?? (process.env.KILLBOX_MODE === "tailscale" ? "tailscale" : "local");
  const port = overrides.port ?? Number(process.env.KILLBOX_SERVER_PORT ?? 2567);
  const host =
    overrides.host ??
    process.env.KILLBOX_SERVER_HOST ??
    (mode === "tailscale" ? "0.0.0.0" : "127.0.0.1");
  const publicUrl =
    overrides.publicUrl ??
    process.env.KILLBOX_PUBLIC_URL ??
    `http://127.0.0.1:${port}`;
  const clientHost =
    overrides.clientHost ??
    process.env.KILLBOX_CLIENT_HOST ??
    (mode === "tailscale" ? "0.0.0.0" : "127.0.0.1");
  const clientPort = overrides.clientPort ?? Number(process.env.KILLBOX_CLIENT_PORT ?? 5173);
  const clientPublicUrl =
    overrides.clientPublicUrl ??
    process.env.KILLBOX_CLIENT_PUBLIC_URL ??
    `http://127.0.0.1:${clientPort}`;

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid KILLBOX_SERVER_PORT: ${port}`);
  }
  if (!Number.isInteger(clientPort) || clientPort <= 0 || clientPort > 65535) {
    throw new Error(`Invalid KILLBOX_CLIENT_PORT: ${clientPort}`);
  }
  if (mode === "tailscale" && !process.env.KILLBOX_PUBLIC_URL && !overrides.publicUrl) {
    throw new Error("KILLBOX_PUBLIC_URL is required in tailscale mode");
  }
  if (mode === "tailscale" && !process.env.KILLBOX_CLIENT_PUBLIC_URL && !overrides.clientPublicUrl) {
    throw new Error("KILLBOX_CLIENT_PUBLIC_URL is required in tailscale mode");
  }

  return {
    host,
    port,
    publicUrl,
    roomSecret: overrides.roomSecret ?? process.env.KILLBOX_ROOM_SECRET ?? "dev-secret",
    mode,
    clientHost,
    clientPort,
    clientPublicUrl,
  };
}
