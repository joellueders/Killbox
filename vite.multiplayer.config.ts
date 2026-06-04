import { defineConfig } from "vite";
import { resolve } from "node:path";

const host = process.env.KILLBOX_CLIENT_HOST ?? "127.0.0.1";
const port = Number(process.env.KILLBOX_CLIENT_PORT ?? 5173);

export default defineConfig({
  root: resolve("src/multiplayer/client"),
  server: {
    host,
    port,
    strictPort: true,
    fs: {
      allow: [resolve(".")],
    },
  },
  preview: {
    host,
    port,
    strictPort: true,
  },
  build: {
    outDir: resolve("dist/multiplayer-client"),
    emptyOutDir: true,
  },
});
