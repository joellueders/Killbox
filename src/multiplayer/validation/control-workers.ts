import type { EvidenceWriter } from "./evidence";
import type { RoleWorker } from "./adapters";

export class HostWorker {
  constructor(private readonly evidence: EvidenceWriter) {}

  async servicesStarted(serverUrl: string, clientUrl: string, roomId: string): Promise<void> {
    await this.evidence.roleAction("host", {
      action: "services-started",
      observation: { serverUrl, clientUrl, roomId },
    });
  }

  async freshRoomCreated(roomId: string): Promise<void> {
    await this.evidence.roleAction("host", {
      action: "fresh-room-created",
      observation: { roomId },
    });
  }
}

export class FaultWorker {
  constructor(private readonly evidence: EvidenceWriter) {}

  async releaseNearConcurrentBuild(barrier: string): Promise<void> {
    await this.evidence.roleAction("fault", { action: "release-near-concurrent-build", barrier });
  }

  async boundedDelay(target: "p1" | "p2", milliseconds: number): Promise<void> {
    await this.evidence.roleAction("fault", {
      action: "bounded-control-plane-delay",
      observation: { target, milliseconds },
    });
  }

  async invalidInput(target: "p1" | "p2", profile: string): Promise<void> {
    await this.evidence.roleAction("fault", {
      action: "invalid-input",
      observation: { target, profile },
    });
  }

  async disconnect(target: "p1" | "p2"): Promise<void> {
    await this.evidence.roleAction("fault", {
      action: "disconnect",
      observation: { target },
    });
  }

  async interruptPlayer(target: "p1" | "p2", worker: RoleWorker): Promise<void> {
    await this.evidence.roleAction("fault", {
      action: "bounded-process-interruption",
      observation: { target, signal: "SIGTERM" },
    });
    await worker.interrupt();
  }
}
