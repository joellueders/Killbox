import { fork, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { RoleBrief, ValidationRole } from "./contracts";

export type WorkerAction =
  | { action: "observe" }
  | { action: "ready"; ready: boolean }
  | { action: "build"; siteId: string; towerType: "arrow" | "cannon" }
  | { action: "start-wave" }
  | { action: "delay"; milliseconds: number }
  | { action: "leave" };

export type WorkerObservation = {
  assignedSlot: "p1" | "p2";
  digest: string;
  phase: string;
  tick: number;
  baseHealth: number;
  outcome: string;
  wave: { number: number; completed: boolean };
  players: Record<string, { connected: boolean; ready: boolean; resources: number }>;
  towers: Array<{ id: string; ownerId: string; siteId: string; level: number }>;
  enemies: number;
};

export type WorkerResponse = {
  ok: boolean;
  commandResult?: { ok: boolean; commandType: string; reason?: string };
  observation?: WorkerObservation;
  error?: string;
};

export interface RoleWorker {
  role: ValidationRole;
  act(action: WorkerAction): Promise<WorkerResponse>;
  interrupt(): Promise<void>;
  close(): Promise<void>;
}

export interface AgentAdapter {
  readonly name: string;
  createPlayerWorker(briefPath: string, role: "p1" | "p2", secret: string): Promise<RoleWorker>;
  createTrialPrompt(brief: RoleBrief): string;
}

type PendingResponse = {
  resolve: (response: WorkerResponse) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
};

class ProcessRoleWorker implements RoleWorker {
  private readonly pending = new Map<string, PendingResponse>();
  private ready: Promise<void>;
  private hasLeft = false;

  constructor(
    readonly role: "p1" | "p2",
    private readonly child: ChildProcess,
  ) {
    this.ready = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${role} worker did not become ready`)), 10_000);
      child.on("message", (message: { type?: string; id?: string; response?: WorkerResponse; error?: string }) => {
        if (message.type === "ready") {
          clearTimeout(timer);
          resolve();
          return;
        }
        if (message.type === "fatal") {
          clearTimeout(timer);
          reject(new Error(message.error ?? `${role} worker failed`));
          return;
        }
        if (message.type === "response" && message.id) {
          const pending = this.pending.get(message.id);
          if (!pending) return;
          clearTimeout(pending.timer);
          this.pending.delete(message.id);
          pending.resolve(message.response ?? { ok: false, error: "worker returned no response" });
        }
      });
      child.once("exit", (code) => {
        const error = new Error(`${role} worker exited with code ${code}`);
        reject(error);
        for (const pending of this.pending.values()) {
          clearTimeout(pending.timer);
          pending.reject(error);
        }
        this.pending.clear();
      });
    });
  }

  async act(action: WorkerAction): Promise<WorkerResponse> {
    await this.ready;
    const id = randomUUID();
    const response = await new Promise<WorkerResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${this.role} action ${action.action} timed out`));
      }, action.action === "start-wave" ? 15_000 : 8_000);
      this.pending.set(id, { resolve, reject, timer });
      this.child.send?.({ type: "action", id, action });
    });
    if (action.action === "leave" && response.ok) this.hasLeft = true;
    return response;
  }

  async close(): Promise<void> {
    if (this.child.killed || this.child.exitCode !== null) return;
    if (!this.hasLeft) {
      try {
        await this.act({ action: "leave" });
      } catch {
        // A failed worker still needs to be terminated.
      }
    }
    this.child.kill("SIGTERM");
  }

  async interrupt(): Promise<void> {
    if (this.child.killed || this.child.exitCode !== null) return;
    this.child.kill("SIGTERM");
    await Promise.race([
      new Promise<void>((resolve) => this.child.once("exit", () => resolve())),
      new Promise<void>((resolve) => setTimeout(resolve, 2_000)),
    ]);
  }
}

export class DeterministicProcessAdapter implements AgentAdapter {
  readonly name = "deterministic-process";

  async createPlayerWorker(briefPath: string, role: "p1" | "p2", secret: string): Promise<RoleWorker> {
    const workerPath = path.resolve("src/multiplayer/validation/role-worker.ts");
    const child = fork(workerPath, [], {
      execArgv: ["--import", "tsx"],
      env: {
        ...process.env,
        KILLBOX_VALIDATION_BRIEF: briefPath,
        KILLBOX_VALIDATION_SECRET: secret,
      },
      stdio: ["ignore", "pipe", "pipe", "ipc"],
    });
    return new ProcessRoleWorker(role, child);
  }

  createTrialPrompt(brief: RoleBrief): string {
    return [
      `Role: ${brief.role}`,
      brief.objective,
      `Allowed observations: ${brief.allowedObservations.join("; ")}`,
      `Prohibited disclosures: ${brief.prohibitedDisclosures.join("; ")}`,
      "Return only the next role action and the evidence it is allowed to observe.",
    ].join("\n");
  }
}
