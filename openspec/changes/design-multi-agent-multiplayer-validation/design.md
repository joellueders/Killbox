## Context

The Tailscale multiplayer prototype already has unit tests, real Colyseus integration tests, and a two-browser same-machine smoke test. Those checks prove important mechanics, but a single scripted test owns both players and can accidentally coordinate through shared process state or encode assumptions that a genuinely independent player would not have.

Requiring a second physical computer for every efficacy check makes validation difficult to reproduce and delegate. This follow-up designs a method where multiple independent automation or AI agents operate on one machine while acting as separate participants. The method must produce stronger evidence about player-visible multiplayer behavior without claiming that loopback traffic proves Tailscale routing, ACL, firewall, latency, or cross-machine behavior.

## Goals / Non-Goals

**Goals:**
- Define and implement a provider-neutral method for assigning independent multiplayer validation roles to multiple agents on one machine.
- Keep gameplay-plane observations isolated so player agents learn session state only through their own client UI and server protocol.
- Exercise cooperative success, command rejection, disconnect, cleanup, and selected fault scenarios.
- Produce deterministic, inspectable, machine-readable evidence and a concise adjudicated report.
- Make failures reproducible through dynamic-port discovery, run manifests, seeds, timestamps, and artifact retention.
- State exactly which multiplayer-efficacy claims each run supports.

**Non-Goals:**
- Proving real Tailscale routing, DNS, ACL, firewall, NAT traversal, latency, or packet-loss behavior.
- Requiring a specific AI-agent vendor, multi-agent API, browser controller, or CI provider.
- Letting player agents directly inspect or mutate authoritative server memory.
- Replacing focused unit, integration, or Playwright smoke tests.
- Making agents responsible for production security assessment.

## Decisions

1. Separate the validation control plane from the gameplay plane.

   A coordinator creates a run manifest, starts or delegates service startup, assigns roles, signals scenario phases, and collects artifacts. Player agents use the control plane only for role instructions and phase barriers. They MUST NOT use it to exchange gameplay state, commands, resource values, or hidden server details.

   Direct free-form agent collaboration was considered, but it weakens the evidence because agents can coordinate outside the multiplayer system being tested.

2. Use explicit independent roles.

   Each run defines at least:

   - `host`: starts the authoritative server and client surface using dynamic ports and records advertised endpoints.
   - `p1` and `p2`: each operates a separate browser context or process, receives only its own role brief, and performs assigned player intent through visible client controls.
   - `fault`: triggers approved disconnect, invalid-command, timing, or process-interruption scenarios without reading hidden player state.
   - `adjudicator`: evaluates evidence against assertions after scenario execution and does not participate as a player.

   Roles can be implemented by AI agents, deterministic workers, or a mixture, as long as isolation and evidence contracts are preserved.

3. Represent each run with a deterministic manifest and role briefs.

   The coordinator generates a unique run directory containing a JSON manifest with run ID, seed, dynamic ports, room ID, scenario list, role assignments, allowed tools, claim boundary, and artifact paths. Each role receives a filtered brief containing only the information required for that role.

   Secrets may be supplied to joining player roles but MUST be redacted from retained reports and logs. Fixed ports are rejected because concurrent or stale runs would undermine repeatability.

4. Require isolated client execution and bounded observations.

   `p1` and `p2` use separate browser storage contexts or separate browser processes. They do not share page handles, local storage, cookies, in-memory state, or screenshots. Player evidence comes from visible or protocol-delivered client state. The adjudicator may consume structured server event traces after execution, but player agents cannot use those traces to choose actions.

5. Add a structured authoritative event trace for validation.

   The server or test adapter emits append-only JSONL validation events with sequence number, simulation tick, event type, actor slot when applicable, command acceptance or rejection, state digest, and redacted metadata. The trace records enough information to establish ordering and convergence without exposing reusable secrets.

   Screenshots and prose alone were considered, but they are weak for ordering, mutation, and synchronization assertions.

6. Validate efficacy through a scenario matrix.

   The initial matrix covers:

   - distinct slot assignment and independent readiness;
   - valid player commands visible to both clients;
   - invalid commands rejected without state divergence;
   - concurrent or near-concurrent commands resolved authoritatively;
   - one complete cooperative wave;
   - one player disconnect observed by the remaining client;
   - empty-room cleanup and a subsequent fresh room;
   - selected latency, delay, or interruption injection where the local harness can model it honestly.

   Each scenario defines role actions, barriers, authoritative assertions, client-visible assertions, timeout policy, and required evidence.

7. Make report claims evidence-based and bounded.

   The adjudicator produces a report with per-scenario result, assertion outcomes, artifact references, observed discrepancies, environment details, and supported or unsupported claims. A successful report can claim authoritative multiplayer efficacy under isolated single-machine agents. It MUST state that real Tailscale and cross-machine behavior were not validated.

8. Keep the orchestration interface provider-neutral.

   Repository scripts define role briefs, run-state transitions, evidence schema, and success criteria. An adapter may invoke available multi-agent tooling, but the core method remains runnable with deterministic worker processes. This keeps the validation design usable in CI and by future agent platforms.

## Risks / Trade-offs

- [Agents still share one kernel and network stack] -> Make the claim boundary explicit and do not infer cross-machine or Tailscale transport correctness.
- [Control-plane messages could leak gameplay state] -> Filter role briefs, prohibit gameplay data in barriers, and audit retained control-plane events.
- [AI-agent behavior can be nondeterministic] -> Record prompts, seeds, actions, timeouts, and evidence; keep deterministic worker adapters for baseline comparison.
- [Server traces can make player behavior less independent] -> Withhold traces from player roles until execution ends and give them only to the adjudicator.
- [Fault injection can create flaky tests] -> Define bounded fault profiles, deterministic timing where possible, and explicit retry policy.
- [Evidence artifacts can expose secrets] -> Redact room secrets and scan reports and retained artifacts before marking a run complete.
- [A complex harness could duplicate existing tests] -> Reuse current server/client commands and assertions, and focus the harness on role isolation, coordination boundaries, and evidence aggregation.

## Migration Plan

1. Define the run manifest, role brief, event trace, and final report schemas.
2. Implement a local coordinator using dynamic ports and isolated run directories.
3. Add deterministic role-worker adapters before integrating optional AI-agent adapters.
4. Add the initial efficacy and fault scenario matrix.
5. Validate the method against the existing multiplayer prototype and compare its findings with current automated tests.
6. Document supported claims, unsupported Tailscale claims, operation, and cleanup.

Rollback consists of removing the validation harness and related documentation; the existing multiplayer prototype and tests remain unchanged.

## Open Questions

- Which repository-supported multi-agent adapter should be implemented first after the deterministic worker baseline?
- Should authoritative validation traces be emitted by the room directly or by a test-only observer adapter?
- Which local network fault profiles are stable enough to include in the required scenario matrix?
