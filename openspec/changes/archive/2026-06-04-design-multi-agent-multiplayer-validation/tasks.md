## 1. Validation Contract Design

- [x] 1.1 Define the versioned run-manifest schema with run ID, seed, dynamic ports, room identifier, scenarios, role assignments, claim boundary, and artifact paths.
- [x] 1.2 Define filtered role-brief schemas for `host`, `p1`, `p2`, `fault`, and `adjudicator`, including prohibited gameplay-state disclosures.
- [x] 1.3 Define append-only event-trace, assertion-result, role-action, and final-report schemas with room-secret redaction rules.
- [x] 1.4 Document the supported efficacy claims and the excluded Tailscale, cross-machine, and network-path claims.

## 2. Provider-Neutral Coordinator

- [x] 2.1 Implement a coordinator that creates isolated run directories, allocates dynamic loopback ports, generates temporary credentials, and writes the run manifest.
- [x] 2.2 Implement lifecycle management for starting, monitoring, and stopping the multiplayer server, client surface, role workers, and retained evidence.
- [x] 2.3 Implement control-plane phase barriers that coordinate scenario timing without disclosing gameplay state between player roles.
- [x] 2.4 Ensure interrupted and failed runs release processes, browser contexts, ports, and temporary credentials while retaining configured diagnostics.

## 3. Independent Role Workers

- [x] 3.1 Implement deterministic baseline workers for `p1` and `p2` using separate browser contexts or processes and only role-brief-authorized observations.
- [x] 3.2 Implement a host worker that records advertised endpoints and room lifecycle without giving player workers hidden authoritative state.
- [x] 3.3 Implement a bounded fault worker for invalid input, disconnect, timing, and interruption profiles.
- [x] 3.4 Define and implement an adapter interface so available AI-agent or multi-agent tooling can assume roles without changing the validation contract.

## 4. Evidence and Adjudication

- [x] 4.1 Add a test-only authoritative observer or room trace that emits ordered, redacted JSONL validation events and state digests.
- [x] 4.2 Capture role actions and player-visible assertions without sharing one player's observations with another player worker.
- [x] 4.3 Implement the adjudicator that maps scenario assertions to evidence and produces passed, failed, or not-executed results.
- [x] 4.4 Add secret scanning and claim-boundary checks before a report can be marked complete.

## 5. Efficacy Scenario Matrix

- [x] 5.1 Implement independent slot-assignment, readiness, valid-command synchronization, and invalid-command rejection scenarios.
- [x] 5.2 Implement near-concurrent command resolution and client/server convergence scenarios.
- [x] 5.3 Implement one complete cooperative wave scenario with both player workers participating.
- [x] 5.4 Implement disconnect visibility, empty-room cleanup, and fresh-room lifecycle scenarios.
- [x] 5.5 Implement at least one stable bounded local delay or interruption scenario and document what it does and does not model.

## 6. Validation and Documentation

- [x] 6.1 Run the deterministic multi-agent method repeatedly and verify that successful reports are reproducible and failed assertions retain useful evidence.
- [x] 6.2 Compare multi-agent findings with the existing shared, Colyseus integration, and two-browser smoke tests.
- [x] 6.3 Run one available AI-agent-adapter trial and verify it obeys role isolation and evidence contracts.
- [x] 6.4 Document operation, artifact review, failure diagnosis, adapter integration, cleanup, and the explicit non-claim for real Tailscale behavior.
- [x] 6.5 Run type checking, automated tests, secret scans, report-schema validation, and strict OpenSpec validation.
