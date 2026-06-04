import { createHash } from "node:crypto";
import { appendFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GameState } from "../shared/schema";
import {
  VALIDATION_SCHEMA_VERSION,
  type AssertionResult,
  type RoleAction,
  type RunManifest,
  type ValidationEvent,
  type ValidationReport,
  type ValidationRole,
} from "./contracts";

export function digestGameState(state: GameState): string {
  const stable = {
    phase: state.phase,
    tick: state.tick,
    baseHealth: state.baseHealth,
    outcome: state.outcome,
    wave: {
      number: state.wave.number,
      spawned: state.wave.spawned,
      total: state.wave.total,
      alive: state.wave.alive,
      completed: state.wave.completed,
    },
    players: [...state.players.entries()].map(([id, player]) => ({
      id,
      connected: player.connected,
      ready: player.ready,
      resources: player.resources,
    })),
    towers: [...state.towers.entries()].map(([id, tower]) => ({
      id,
      type: tower.type,
      ownerId: tower.ownerId,
      siteId: tower.siteId,
      level: tower.level,
    })),
    enemies: [...state.enemies.entries()].map(([id, enemy]) => ({
      id,
      hp: enemy.hp,
      progress: Number(enemy.progress.toFixed(6)),
    })),
  };
  return createHash("sha256").update(JSON.stringify(stable)).digest("hex").slice(0, 20);
}

function redact(value: unknown, secrets: string[]): unknown {
  if (typeof value === "string") {
    let result = value;
    for (const secret of secrets) {
      if (secret) result = result.split(secret).join("[REDACTED]");
    }
    return result;
  }
  if (Array.isArray(value)) return value.map((entry) => redact(entry, secrets));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        key.toLowerCase().includes("secret") ? "[REDACTED]" : redact(entry, secrets),
      ]),
    );
  }
  return value;
}

export class EvidenceWriter {
  private eventSequence = 0;
  private actionSequence = 0;
  private writeQueue = Promise.resolve();

  constructor(
    readonly runDir: string,
    private readonly secrets: string[],
  ) {}

  async initialize(): Promise<void> {
    await mkdir(this.runDir, { recursive: true });
    await mkdir(path.join(this.runDir, "roles"), { recursive: true });
    await mkdir(path.join(this.runDir, "diagnostics"), { recursive: true });
  }

  async writeJson(relativePath: string, value: unknown): Promise<void> {
    await this.enqueue(async () => {
      const target = path.join(this.runDir, relativePath);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, `${JSON.stringify(redact(value, this.secrets), null, 2)}\n`, "utf8");
    });
  }

  async appendJsonl(relativePath: string, value: unknown): Promise<void> {
    await this.enqueue(async () => {
      const target = path.join(this.runDir, relativePath);
      await mkdir(path.dirname(target), { recursive: true });
      await appendFile(target, `${JSON.stringify(redact(value, this.secrets))}\n`, "utf8");
    });
  }

  async event(
    event: Omit<ValidationEvent, "schemaVersion" | "sequence" | "timestamp">,
  ): Promise<ValidationEvent> {
    const record: ValidationEvent = {
      schemaVersion: VALIDATION_SCHEMA_VERSION,
      sequence: ++this.eventSequence,
      timestamp: new Date().toISOString(),
      ...event,
    };
    await this.appendJsonl("events.jsonl", record);
    return record;
  }

  async roleAction(
    role: ValidationRole,
    action: Omit<RoleAction, "schemaVersion" | "sequence" | "timestamp" | "role">,
  ): Promise<RoleAction> {
    const record: RoleAction = {
      schemaVersion: VALIDATION_SCHEMA_VERSION,
      sequence: ++this.actionSequence,
      timestamp: new Date().toISOString(),
      role,
      ...action,
    };
    await this.appendJsonl(`roles/${role}-actions.jsonl`, record);
    return record;
  }

  async assertion(result: AssertionResult): Promise<void> {
    await this.appendJsonl("assertions.jsonl", result);
  }

  async manifest(manifest: RunManifest): Promise<void> {
    await this.writeJson("manifest.json", manifest);
  }

  async report(report: ValidationReport): Promise<void> {
    await this.writeJson("report.json", report);
  }

  async scanForSecrets(relativePaths: string[]): Promise<string[]> {
    await this.writeQueue;
    const findings: string[] = [];
    for (const relativePath of relativePaths) {
      const content = await readFile(path.join(this.runDir, relativePath), "utf8");
      for (const secret of this.secrets) {
        if (secret && content.includes(secret)) findings.push(relativePath);
      }
    }
    return findings;
  }

  async scanAllForSecrets(): Promise<string[]> {
    const relativePaths: string[] = [];
    const visit = async (directory: string) => {
      for (const entry of await readdir(path.join(this.runDir, directory), { withFileTypes: true })) {
        const relativePath = path.join(directory, entry.name);
        if (entry.isDirectory()) await visit(relativePath);
        else if (entry.isFile()) relativePaths.push(relativePath);
      }
    };
    await visit(".");
    return await this.scanForSecrets(relativePaths);
  }

  async flush(): Promise<void> {
    await this.writeQueue;
  }

  private async enqueue(write: () => Promise<void>): Promise<void> {
    const next = this.writeQueue.then(write);
    this.writeQueue = next.catch(() => undefined);
    await next;
  }
}
