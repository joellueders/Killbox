import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLAIM_BOUNDARY,
  DEFAULT_SCENARIOS,
  VALIDATION_ROLES,
  VALIDATION_SCHEMA_VERSION,
  createRoleBrief,
  validateReport,
  validateRoleBrief,
  validateRunManifest,
  type ArtifactPaths,
  type RunManifest,
  type ValidationReport,
  type ValidationRole,
} from "../../src/multiplayer/validation/contracts";
import { EvidenceWriter } from "../../src/multiplayer/validation/evidence";

function artifacts(): ArtifactPaths {
  return {
    manifest: "manifest.json",
    events: "events.jsonl",
    assertions: "assertions.jsonl",
    report: "report.json",
    roleActions: Object.fromEntries(VALIDATION_ROLES.map((role) => [role, `roles/${role}-actions.jsonl`])) as Record<ValidationRole, string>,
    roleBriefs: Object.fromEntries(VALIDATION_ROLES.map((role) => [role, `roles/${role}-brief.json`])) as Record<ValidationRole, string>,
    diagnostics: "diagnostics",
  };
}

function manifest(): RunManifest {
  const files = artifacts();
  return {
    schemaVersion: VALIDATION_SCHEMA_VERSION,
    runId: "validation-test",
    seed: 42,
    createdAt: new Date(0).toISOString(),
    ports: { server: 41001, client: 41002 },
    endpoints: { server: "http://127.0.0.1:41001", client: "http://127.0.0.1:41002" },
    roomId: "room-test",
    scenarios: [...DEFAULT_SCENARIOS],
    roles: Object.fromEntries(VALIDATION_ROLES.map((role) => [role, {
      adapter: role === "p1" || role === "p2" ? "deterministic-process" : "coordinator",
      briefPath: files.roleBriefs[role],
      actionPath: files.roleActions[role],
    }])) as RunManifest["roles"],
    claimBoundary: CLAIM_BOUNDARY,
    artifacts: files,
  };
}

describe("multi-agent validation contracts", () => {
  it("validates manifests, filtered role briefs, and passing reports", () => {
    const runManifest = manifest();
    expect(() => validateRunManifest(runManifest)).not.toThrow();
    for (const role of VALIDATION_ROLES) {
      expect(() => validateRoleBrief(createRoleBrief("validation-test", role, "test", runManifest.endpoints.server, runManifest.roomId))).not.toThrow();
    }
    const report: ValidationReport = {
      schemaVersion: VALIDATION_SCHEMA_VERSION,
      runId: runManifest.runId,
      generatedAt: new Date(0).toISOString(),
      status: "passed",
      adapterTrial: { adapter: "deterministic-process", status: "passed", evidence: ["roles/p1-actions.jsonl"] },
      environment: { machineCount: 1, transport: "loopback", seed: 42 },
      claimBoundary: CLAIM_BOUNDARY,
      scenarios: DEFAULT_SCENARIOS.map((scenario) => ({ scenario, status: "passed", assertions: [`${scenario}.test`] })),
      discrepancies: [],
      artifacts: runManifest.artifacts,
    };
    expect(() => validateReport(report)).not.toThrow();
  });

  it("rejects a passing report that broadens the claim or skips scenarios", () => {
    const runManifest = manifest();
    const report = {
      schemaVersion: VALIDATION_SCHEMA_VERSION,
      runId: runManifest.runId,
      generatedAt: new Date(0).toISOString(),
      status: "passed",
      adapterTrial: { adapter: "test", status: "passed", evidence: [] },
      environment: { machineCount: 1, transport: "loopback", seed: 42 },
      claimBoundary: { supported: [], excluded: ["cross-machine behavior"] },
      scenarios: [{ scenario: "slot-assignment", status: "not-executed", assertions: [] }],
      discrepancies: [],
      artifacts: runManifest.artifacts,
    } as ValidationReport;
    expect(() => validateReport(report)).toThrow();
  });

  it("redacts temporary credentials from every retained artifact", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "killbox-validation-"));
    const secret = "temporary-room-secret";
    const writer = new EvidenceWriter(directory, [secret]);
    await writer.initialize();
    await writer.writeJson("manifest.json", { roomSecret: secret, nested: { value: secret } });
    await writer.appendJsonl("events.jsonl", { message: `contains ${secret}` });
    expect(await writer.scanAllForSecrets()).toEqual([]);
    expect(await readFile(path.join(directory, "events.jsonl"), "utf8")).toContain("[REDACTED]");
  });
});
