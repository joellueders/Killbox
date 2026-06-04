import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import net from "node:net";
import path from "node:path";
import { startMultiplayerServer, type RunningMultiplayerServer } from "../server/server";
import { digestGameState } from "./evidence";
import { DeterministicProcessAdapter, type AgentAdapter, type RoleWorker, type WorkerObservation } from "./adapters";
import {
  CLAIM_BOUNDARY,
  DEFAULT_SCENARIOS,
  VALIDATION_ROLES,
  VALIDATION_SCHEMA_VERSION,
  createRoleBrief,
  validateReport,
  validateRunManifest,
  type ArtifactPaths,
  type AssertionResult,
  type ResultStatus,
  type RunManifest,
  type ScenarioId,
  type ScenarioResult,
  type ValidationReport,
  type ValidationRole,
} from "./contracts";
import { EvidenceWriter } from "./evidence";
import { FaultWorker, HostWorker } from "./control-workers";

export type ValidationRunOptions = {
  adapter?: AgentAdapter;
  artifactRoot?: string;
  seed?: number;
  simulationIntervalMs?: number;
  forcedFailureScenario?: ScenarioId;
};

export type ValidationRunResult = {
  runDir: string;
  manifest: RunManifest;
  report: ValidationReport;
};

type AssertionInput = Omit<AssertionResult, "schemaVersion" | "status"> & {
  condition: boolean;
};

type ScenarioTracker = {
  assertions: AssertionResult[];
  discrepancies: string[];
};

const POLL_INTERVAL_MS = 20;

async function availablePort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function waitFor<T>(
  description: string,
  read: () => Promise<T>,
  accept: (value: T) => boolean,
  timeoutMs = 8_000,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let last: T;
  do {
    last = await read();
    if (accept(last)) return last;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  } while (Date.now() < deadline);
  throw new Error(`timed out waiting for ${description}`);
}

async function stopProcess(child: ChildProcess | undefined): Promise<void> {
  if (!child || child.killed || child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise<void>((resolve) => child.once("exit", () => resolve())),
    new Promise<void>((resolve) => setTimeout(resolve, 2_000)),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

function artifactPaths(): ArtifactPaths {
  return {
    manifest: "manifest.json",
    events: "events.jsonl",
    assertions: "assertions.jsonl",
    report: "report.json",
    roleActions: Object.fromEntries(
      VALIDATION_ROLES.map((role) => [role, `roles/${role}-actions.jsonl`]),
    ) as Record<ValidationRole, string>,
    roleBriefs: Object.fromEntries(
      VALIDATION_ROLES.map((role) => [role, `roles/${role}-brief.json`]),
    ) as Record<ValidationRole, string>,
    diagnostics: "diagnostics",
  };
}

function scenarioStatus(assertions: AssertionResult[]): ResultStatus {
  if (assertions.length === 0) return "not-executed";
  return assertions.every((assertion) => assertion.status === "passed") ? "passed" : "failed";
}

async function observe(worker: RoleWorker): Promise<WorkerObservation> {
  const response = await worker.act({ action: "observe" });
  if (!response.ok || !response.observation) throw new Error(response.error ?? `${worker.role} observation failed`);
  return response.observation;
}

async function converged(p1: RoleWorker, p2: RoleWorker, timeoutMs = 8_000): Promise<[WorkerObservation, WorkerObservation]> {
  return await waitFor(
    "player state convergence",
    async () => [await observe(p1), await observe(p2)] as [WorkerObservation, WorkerObservation],
    ([left, right]) => left.digest === right.digest,
    timeoutMs,
  );
}

export async function runMultiAgentValidation(options: ValidationRunOptions = {}): Promise<ValidationRunResult> {
  const adapter = options.adapter ?? new DeterministicProcessAdapter();
  const runId = `${new Date().toISOString().replaceAll(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
  const seed = options.seed ?? 26_060_604;
  const runDir = path.resolve(options.artifactRoot ?? ".cache/multiplayer-validation", runId);
  const [serverPort, clientPort] = await Promise.all([availablePort(), availablePort()]);
  const serverUrl = `http://127.0.0.1:${serverPort}`;
  const clientUrl = `http://127.0.0.1:${clientPort}`;
  const roomSecret = `validation-${randomBytes(24).toString("hex")}`;
  const artifacts = artifactPaths();
  const evidence = new EvidenceWriter(runDir, [roomSecret]);
  const host = new HostWorker(evidence);
  const fault = new FaultWorker(evidence);
  const tracker: ScenarioTracker = { assertions: [], discrepancies: [] };
  let server: RunningMultiplayerServer | undefined;
  let clientSurface: ChildProcess | undefined;
  let p1: RoleWorker | undefined;
  let p2: RoleWorker | undefined;
  let manifest: RunManifest | undefined;
  let report: ValidationReport | undefined;
  let cleanupPromise: Promise<void> | undefined;
  let interruptSignal: NodeJS.Signals | undefined;

  const cleanup = async () => {
    if (cleanupPromise) return await cleanupPromise;
    const workers = [p1, p2];
    const surface = clientSurface;
    const runningServer = server;
    p1 = undefined;
    p2 = undefined;
    clientSurface = undefined;
    server = undefined;
    cleanupPromise = (async () => {
      await Promise.allSettled(workers.map((worker) => worker?.close()));
      await stopProcess(surface);
      await runningServer?.close();
      await evidence.flush();
    })();
    try {
      await cleanupPromise;
    } finally {
      cleanupPromise = undefined;
    }
  };
  const handleInterrupt = (signal: NodeJS.Signals) => {
    if (interruptSignal) return;
    interruptSignal = signal;
    tracker.discrepancies.push(`validation interrupted by ${signal}; cleanup requested`);
    void cleanup();
  };
  const ensureActive = () => {
    if (interruptSignal) throw new Error(`validation interrupted by ${interruptSignal}`);
  };
  const handleSigint = () => handleInterrupt("SIGINT");
  const handleSigterm = () => handleInterrupt("SIGTERM");
  process.once("SIGINT", handleSigint);
  process.once("SIGTERM", handleSigterm);

  const barrier = async (name: string, roles: ValidationRole[]) => {
    await Promise.all(roles.map((role) => evidence.roleAction(role, { action: "barrier", barrier: name })));
  };

  const assert = async (input: AssertionInput) => {
    const forcedFailure = input.scenario === options.forcedFailureScenario;
    const result: AssertionResult = {
      schemaVersion: VALIDATION_SCHEMA_VERSION,
      id: input.id,
      scenario: input.scenario,
      status: input.condition && !forcedFailure ? "passed" : "failed",
      message: forcedFailure ? `${input.message} (forced failure for evidence validation)` : input.message,
      evidence: input.evidence,
    };
    tracker.assertions.push(result);
    if (result.status === "failed") tracker.discrepancies.push(`${result.id}: ${result.message}`);
    await evidence.assertion(result);
    return result;
  };

  const recordWorkerAction = async (
    worker: RoleWorker,
    action: Parameters<RoleWorker["act"]>[0],
  ) => {
    const startedAt = Date.now();
    const response = await worker.act(action);
    await evidence.roleAction(worker.role, {
      action: action.action,
      observation: {
        durationMs: Date.now() - startedAt,
        ok: response.ok,
        commandResult: response.commandResult,
        digest: response.observation?.digest,
      },
    });
    return response;
  };

  try {
    await evidence.initialize();
    ensureActive();
    server = await startMultiplayerServer({
      host: "127.0.0.1",
      port: serverPort,
      publicUrl: serverUrl,
      roomSecret,
      clientHost: "127.0.0.1",
      clientPort,
      clientPublicUrl: clientUrl,
      simulationIntervalMs: options.simulationIntervalMs ?? 5,
      validationObserver: {
        record: async (event, state) => {
          await evidence.event({ ...event, tick: state.tick, stateDigest: digestGameState(state) });
        },
      },
    });
    const runningServer = server;
    ensureActive();

    clientSurface = spawn(path.resolve("node_modules/.bin/vite"), ["--config", "vite.multiplayer.config.ts"], {
      cwd: path.resolve("."),
      env: {
        ...process.env,
        KILLBOX_CLIENT_HOST: "127.0.0.1",
        KILLBOX_CLIENT_PORT: String(clientPort),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    clientSurface.stdout?.on("data", (chunk) => void evidence.appendJsonl("diagnostics/client-surface.jsonl", {
      stream: "stdout",
      message: String(chunk).trim(),
    }));
    clientSurface.stderr?.on("data", (chunk) => void evidence.appendJsonl("diagnostics/client-surface.jsonl", {
      stream: "stderr",
      message: String(chunk).trim(),
    }));
    await waitFor("client surface", async () => fetch(clientUrl).then((response) => response.ok).catch(() => false), Boolean);
    ensureActive();

    manifest = {
      schemaVersion: VALIDATION_SCHEMA_VERSION,
      runId,
      seed,
      createdAt: new Date().toISOString(),
      ports: { server: serverPort, client: clientPort },
      endpoints: { server: serverUrl, client: clientUrl },
      roomId: runningServer.roomId,
      scenarios: [...DEFAULT_SCENARIOS],
      roles: Object.fromEntries(
        VALIDATION_ROLES.map((role) => [
          role,
          { adapter: role === "p1" || role === "p2" ? adapter.name : "coordinator", briefPath: artifacts.roleBriefs[role], actionPath: artifacts.roleActions[role] },
        ]),
      ) as RunManifest["roles"],
      claimBoundary: CLAIM_BOUNDARY,
      artifacts,
    };
    validateRunManifest(manifest);
    await evidence.manifest(manifest);
    await Promise.all(
      VALIDATION_ROLES.map((role) => evidence.writeJson(
        artifacts.roleBriefs[role],
        createRoleBrief(runId, role, role === "p1" || role === "p2" ? adapter.name : "coordinator", serverUrl, runningServer.roomId),
      )),
    );
    await Promise.all(
      VALIDATION_ROLES.map((role) => evidence.roleAction(role, { action: "brief-issued", barrier: "setup" })),
    );
    await host.servicesStarted(serverUrl, clientUrl, runningServer.roomId);

    p1 = await adapter.createPlayerWorker(path.join(runDir, artifacts.roleBriefs.p1), "p1", roomSecret);
    p2 = await adapter.createPlayerWorker(path.join(runDir, artifacts.roleBriefs.p2), "p2", roomSecret);
    ensureActive();

    await barrier("players-joined", ["host", "p1", "p2"]);
    const [joinedP1, joinedP2] = await converged(p1, p2);
    await assert({
      id: "slot-assignment.distinct",
      scenario: "slot-assignment",
      condition: joinedP1.assignedSlot === "p1" && joinedP2.assignedSlot === "p2",
      message: "isolated workers received distinct p1 and p2 slots",
      evidence: ["roles/p1-actions.jsonl", "roles/p2-actions.jsonl", "events.jsonl"],
    });

    await barrier("readiness-p1", ["p1", "p2"]);
    const readyP1 = await recordWorkerAction(p1, { action: "ready", ready: true });
    const readinessMidpoint = await waitFor("independent p1 readiness", () => observe(p2!), (value) =>
      value.players.p1?.ready === true && value.players.p2?.ready === false,
    );
    await assert({
      id: "independent-readiness.p1-only",
      scenario: "independent-readiness",
      condition: readyP1.commandResult?.ok === true && readinessMidpoint.players.p2?.ready === false,
      message: "p1 readiness synchronized without changing p2 readiness",
      evidence: ["roles/p1-actions.jsonl", "roles/p2-actions.jsonl", "events.jsonl"],
    });
    const readyP2 = await recordWorkerAction(p2, { action: "ready", ready: true });
    await waitFor("both players ready", () => observe(p1!), (value) => value.players.p1?.ready === true && value.players.p2?.ready === true);
    await assert({
      id: "independent-readiness.both",
      scenario: "independent-readiness",
      condition: readyP2.commandResult?.ok === true,
      message: "p2 independently set readiness",
      evidence: ["roles/p2-actions.jsonl", "events.jsonl"],
    });

    const build = await recordWorkerAction(p1, { action: "build", siteId: "site-1", towerType: "arrow" });
    const [builtP1, builtP2] = await waitFor(
      "valid build synchronization",
      async () => [await observe(p1!), await observe(p2!)] as [WorkerObservation, WorkerObservation],
      ([left, right]) => left.towers.length === 1 && right.towers.length === 1 && left.digest === right.digest,
    );
    await assert({
      id: "valid-build.synchronized",
      scenario: "valid-command-synchronization",
      condition: build.commandResult?.ok === true && builtP1.towers[0]?.ownerId === "p1" && builtP2.towers[0]?.ownerId === "p1",
      message: "accepted p1 tower build converged on both workers",
      evidence: ["roles/p1-actions.jsonl", "roles/p2-actions.jsonl", "events.jsonl"],
    });

    const beforeInvalid = {
      towerCount: builtP1.towers.length,
      p1Resources: builtP1.players.p1?.resources,
    };
    await fault.invalidInput("p1", "duplicate occupied build site");
    const invalid = await recordWorkerAction(p1, { action: "build", siteId: "site-1", towerType: "arrow" });
    const [invalidP1, invalidP2] = await converged(p1, p2);
    await assert({
      id: "invalid-build.rejected",
      scenario: "invalid-command-rejection",
      condition:
        invalid.commandResult?.ok === false &&
        invalidP1.towers.length === beforeInvalid.towerCount &&
        invalidP2.towers.length === beforeInvalid.towerCount &&
        invalidP1.players.p1?.resources === beforeInvalid.p1Resources &&
        invalidP2.players.p1?.resources === beforeInvalid.p1Resources,
      message: "duplicate-site build was rejected without authoritative mutation",
      evidence: ["roles/p1-actions.jsonl", "events.jsonl"],
    });

    await barrier("near-concurrent-build", ["p1", "p2", "fault"]);
    await fault.releaseNearConcurrentBuild("near-concurrent-build");
    const [concurrentP1, concurrentP2] = await Promise.all([
      recordWorkerAction(p1, { action: "build", siteId: "site-2", towerType: "arrow" }),
      recordWorkerAction(p2, { action: "build", siteId: "site-2", towerType: "arrow" }),
    ]);
    const [afterConcurrentP1, afterConcurrentP2] = await waitFor(
      "near-concurrent command convergence",
      async () => [await observe(p1!), await observe(p2!)] as [WorkerObservation, WorkerObservation],
      ([left, right]) => left.towers.length === 2 && right.towers.length === 2 && left.digest === right.digest,
    );
    await assert({
      id: "near-concurrent.single-winner",
      scenario: "near-concurrent-command-resolution",
      condition:
        Number(concurrentP1.commandResult?.ok === true) + Number(concurrentP2.commandResult?.ok === true) === 1 &&
        afterConcurrentP1.digest === afterConcurrentP2.digest,
      message: "near-concurrent builds produced one authoritative winner and converged",
      evidence: ["roles/p1-actions.jsonl", "roles/p2-actions.jsonl", "events.jsonl"],
    });

    const p2Contribution = await recordWorkerAction(p2, { action: "build", siteId: "site-3", towerType: "arrow" });
    await waitFor(
      "both players contributing towers",
      () => observe(p1!),
      (value) => value.towers.some((tower) => tower.ownerId === "p1") && value.towers.some((tower) => tower.ownerId === "p2"),
    );

    await barrier("bounded-delay", ["p1", "p2", "fault"]);
    await fault.boundedDelay("p2", 125);
    const delayed = recordWorkerAction(p2, { action: "delay", milliseconds: 125 });
    const unaffected = await recordWorkerAction(p1, { action: "observe" });
    await delayed;
    const [afterDelayP1, afterDelayP2] = await converged(p1, p2);
    await assert({
      id: "bounded-delay.converged",
      scenario: "bounded-control-plane-delay",
      condition: unaffected.ok && afterDelayP1.digest === afterDelayP2.digest,
      message: "bounded local worker delay did not prevent later convergence",
      evidence: ["roles/fault-actions.jsonl", "roles/p1-actions.jsonl", "roles/p2-actions.jsonl"],
    });

    const startWave = await recordWorkerAction(p1, { action: "start-wave" });
    const [completedP1, completedP2] = await waitFor(
      "cooperative wave completion",
      async () => [await observe(p1!), await observe(p2!)] as [WorkerObservation, WorkerObservation],
      ([left, right]) => left.wave.completed && right.wave.completed && left.digest === right.digest,
      20_000,
    );
    await assert({
      id: "cooperative-wave.completed",
      scenario: "cooperative-wave-completion",
      condition:
        p2Contribution.commandResult?.ok === true &&
        startWave.commandResult?.ok === true &&
        completedP1.towers.some((tower) => tower.ownerId === "p1") &&
        completedP1.towers.some((tower) => tower.ownerId === "p2") &&
        completedP1.outcome === "victory" &&
        completedP2.outcome === "victory",
      message: "both isolated workers contributed towers and observed one completed authoritative cooperative wave",
      evidence: ["roles/p1-actions.jsonl", "roles/p2-actions.jsonl", "events.jsonl"],
    });

    await barrier("disconnect-p2", ["p1", "p2", "fault"]);
    await fault.disconnect("p2");
    await fault.interruptPlayer("p2", p2);
    const afterDisconnect = await waitFor("p2 disconnect visibility", () => observe(p1!), (value) => value.players.p2?.connected === false);
    await assert({
      id: "disconnect.visible",
      scenario: "disconnect-visibility",
      condition: afterDisconnect.players.p2?.connected === false,
      message: "remaining p1 worker observed p2 disconnect",
      evidence: ["roles/p1-actions.jsonl", "roles/p2-actions.jsonl", "events.jsonl"],
    });

    await recordWorkerAction(p1, { action: "leave" });
    const freshRoomId = await waitFor(
      "empty-room cleanup and fresh room",
      async () => {
        const response = await fetch(`${serverUrl}/config`);
        return (await response.json() as { roomId: string }).roomId;
      },
      (roomId) => roomId !== manifest!.roomId,
    );
    await host.freshRoomCreated(freshRoomId);
    await assert({
      id: "room-cleanup.fresh-room",
      scenario: "room-cleanup",
      condition: freshRoomId !== manifest.roomId,
      message: "empty room disposed and next config request created a fresh room",
      evidence: ["roles/host-actions.jsonl", "events.jsonl"],
    });
  } catch (error) {
    tracker.discrepancies.push(error instanceof Error ? error.stack ?? error.message : String(error));
    await evidence.writeJson("diagnostics/coordinator-error.json", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  } finally {
    process.removeListener("SIGINT", handleSigint);
    process.removeListener("SIGTERM", handleSigterm);
    await cleanup();
  }

  if (!manifest) throw new Error(`validation run failed before manifest creation; evidence retained at ${runDir}`);

  const scenarios: ScenarioResult[] = DEFAULT_SCENARIOS.map((scenario) => {
    const assertions = tracker.assertions.filter((assertion) => assertion.scenario === scenario);
    return { scenario, status: scenarioStatus(assertions), assertions: assertions.map((assertion) => assertion.id) };
  });
  const secretFindings = await evidence.scanAllForSecrets();
  if (secretFindings.length > 0) tracker.discrepancies.push(`room secret found in retained artifacts: ${secretFindings.join(", ")}`);

  report = {
    schemaVersion: VALIDATION_SCHEMA_VERSION,
    runId,
    generatedAt: new Date().toISOString(),
    status: scenarios.every((scenario) => scenario.status === "passed") && tracker.discrepancies.length === 0 ? "passed" : "failed",
    adapterTrial: { adapter: adapter.name, status: "passed", evidence: ["roles/p1-actions.jsonl", "roles/p2-actions.jsonl"] },
    environment: { machineCount: 1, transport: "loopback", seed },
    claimBoundary: CLAIM_BOUNDARY,
    scenarios,
    discrepancies: tracker.discrepancies,
    artifacts,
  };
  validateReport(report);
  await evidence.roleAction("adjudicator", {
    action: "report-adjudicated",
    observation: { status: report.status, scenarioCount: report.scenarios.length, discrepancyCount: report.discrepancies.length },
  });
  await evidence.report(report);
  const reportSecretFindings = await evidence.scanAllForSecrets();
  if (reportSecretFindings.length > 0) throw new Error(`room secret found in final report at ${runDir}`);
  return { runDir, manifest, report };
}
