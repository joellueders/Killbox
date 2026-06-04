export const VALIDATION_SCHEMA_VERSION = "1.0";

export const VALIDATION_ROLES = ["host", "p1", "p2", "fault", "adjudicator"] as const;
export type ValidationRole = (typeof VALIDATION_ROLES)[number];

export const DEFAULT_SCENARIOS = [
  "slot-assignment",
  "independent-readiness",
  "valid-command-synchronization",
  "invalid-command-rejection",
  "near-concurrent-command-resolution",
  "cooperative-wave-completion",
  "bounded-control-plane-delay",
  "disconnect-visibility",
  "room-cleanup",
] as const;

export type ScenarioId = (typeof DEFAULT_SCENARIOS)[number];
export type ResultStatus = "passed" | "failed" | "not-executed";

export type ClaimBoundary = {
  supported: string[];
  excluded: string[];
};

export type ArtifactPaths = {
  manifest: string;
  events: string;
  assertions: string;
  report: string;
  roleActions: Record<ValidationRole, string>;
  roleBriefs: Record<ValidationRole, string>;
  diagnostics: string;
};

export type RunManifest = {
  schemaVersion: typeof VALIDATION_SCHEMA_VERSION;
  runId: string;
  seed: number;
  createdAt: string;
  ports: { server: number; client: number };
  endpoints: { server: string; client: string };
  roomId: string;
  scenarios: ScenarioId[];
  roles: Record<ValidationRole, { adapter: string; briefPath: string; actionPath: string }>;
  claimBoundary: ClaimBoundary;
  artifacts: ArtifactPaths;
};

export type RoleBrief = {
  schemaVersion: typeof VALIDATION_SCHEMA_VERSION;
  runId: string;
  role: ValidationRole;
  adapter: string;
  objective: string;
  allowedObservations: string[];
  prohibitedDisclosures: string[];
  controlPlane: { barriersOnly: true };
  connection?: { serverUrl: string; roomId: string; secretSource: "environment" };
};

export type ValidationEvent = {
  schemaVersion: typeof VALIDATION_SCHEMA_VERSION;
  sequence: number;
  timestamp: string;
  tick: number;
  eventType: string;
  actor?: "p1" | "p2" | "system" | "fault";
  commandType?: string;
  accepted?: boolean;
  stateDigest?: string;
  metadata?: Record<string, unknown>;
};

export type RoleAction = {
  schemaVersion: typeof VALIDATION_SCHEMA_VERSION;
  sequence: number;
  timestamp: string;
  role: ValidationRole;
  action: string;
  barrier?: string;
  observation?: Record<string, unknown>;
};

export type AssertionResult = {
  schemaVersion: typeof VALIDATION_SCHEMA_VERSION;
  id: string;
  scenario: ScenarioId;
  status: ResultStatus;
  message: string;
  evidence: string[];
};

export type ScenarioResult = {
  scenario: ScenarioId;
  status: ResultStatus;
  assertions: string[];
};

export type ValidationReport = {
  schemaVersion: typeof VALIDATION_SCHEMA_VERSION;
  runId: string;
  generatedAt: string;
  status: ResultStatus;
  adapterTrial: { adapter: string; status: ResultStatus; evidence: string[] };
  environment: { machineCount: 1; transport: "loopback"; seed: number };
  claimBoundary: ClaimBoundary;
  scenarios: ScenarioResult[];
  discrepancies: string[];
  artifacts: ArtifactPaths;
};

export const CLAIM_BOUNDARY: ClaimBoundary = {
  supported: [
    "Authoritative cooperative behavior with isolated player workers on one machine",
    "Distinct slot assignment and synchronized client-visible state",
    "Server-side command acceptance, rejection, ordering, lifecycle, and cleanup",
  ],
  excluded: [
    "Real Tailscale routing, DNS, ACL, firewall, NAT traversal, or cross-machine behavior",
    "Real wide-area latency, jitter, packet loss, or device-specific browser behavior",
  ],
};

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function validateRunManifest(value: RunManifest): void {
  requireCondition(value.schemaVersion === VALIDATION_SCHEMA_VERSION, "manifest schema version mismatch");
  requireCondition(Boolean(value.runId), "manifest runId is required");
  requireCondition(Number.isInteger(value.seed), "manifest seed must be an integer");
  requireCondition(value.ports.server > 0 && value.ports.client > 0, "manifest ports must be allocated");
  requireCondition(value.ports.server !== value.ports.client, "manifest ports must be distinct");
  requireCondition(Boolean(value.roomId), "manifest roomId is required");
  for (const role of VALIDATION_ROLES) requireCondition(Boolean(value.roles[role]), `missing role ${role}`);
  for (const role of VALIDATION_ROLES) {
    requireCondition(Boolean(value.artifacts.roleActions[role]), `missing ${role} action artifact`);
    requireCondition(Boolean(value.artifacts.roleBriefs[role]), `missing ${role} brief artifact`);
  }
  for (const scenario of value.scenarios) {
    requireCondition(DEFAULT_SCENARIOS.includes(scenario), `unknown scenario ${scenario}`);
  }
  requireCondition(
    value.claimBoundary.excluded.some((claim) => claim.includes("Tailscale")),
    "manifest must explicitly exclude real Tailscale validation",
  );
}

export function validateRoleBrief(value: RoleBrief): void {
  requireCondition(value.schemaVersion === VALIDATION_SCHEMA_VERSION, "role brief schema version mismatch");
  requireCondition(VALIDATION_ROLES.includes(value.role), "role brief has unknown role");
  requireCondition(value.controlPlane.barriersOnly === true, "role brief must restrict control plane to barriers");
  requireCondition(value.prohibitedDisclosures.length > 0, "role brief must define prohibited disclosures");
}

export function validateReport(value: ValidationReport): void {
  requireCondition(value.schemaVersion === VALIDATION_SCHEMA_VERSION, "report schema version mismatch");
  requireCondition(value.environment.machineCount === 1, "report must declare one machine");
  requireCondition(value.environment.transport === "loopback", "report must declare loopback transport");
  requireCondition(
    value.claimBoundary.excluded.some((claim) => claim.includes("Tailscale")),
    "report must explicitly exclude real Tailscale validation",
  );
  requireCondition(value.scenarios.length > 0, "report must include scenarios");
  for (const scenario of value.scenarios) {
    requireCondition(DEFAULT_SCENARIOS.includes(scenario.scenario), `report has unknown scenario ${scenario.scenario}`);
    requireCondition(["passed", "failed", "not-executed"].includes(scenario.status), "report has invalid scenario status");
  }
  requireCondition(["passed", "failed", "not-executed"].includes(value.status), "report has invalid status");
  if (value.status === "passed") {
    requireCondition(value.scenarios.every((scenario) => scenario.status === "passed"), "passing report has incomplete scenarios");
    requireCondition(value.discrepancies.length === 0, "passing report has discrepancies");
  }
}

export function createRoleBrief(
  runId: string,
  role: ValidationRole,
  adapter: string,
  serverUrl: string,
  roomId: string,
): RoleBrief {
  const player = role === "p1" || role === "p2";
  return {
    schemaVersion: VALIDATION_SCHEMA_VERSION,
    runId,
    role,
    adapter,
    objective:
      player
        ? `Operate only the ${role} client and report player-visible observations.`
        : `${role} validates its assigned control-plane responsibility without disclosing hidden gameplay state.`,
    allowedObservations:
      player
        ? ["own client protocol state", "own command results", "own assigned slot"]
        : ["run manifest metadata", "phase barriers", "retained evidence after execution"],
    prohibitedDisclosures: [
      "another player's private observations",
      "hidden authoritative state before adjudication",
      "gameplay values through control-plane barriers",
      "reusable room secret in retained artifacts",
    ],
    controlPlane: { barriersOnly: true },
    connection: player ? { serverUrl, roomId, secretSource: "environment" } : undefined,
  };
}
