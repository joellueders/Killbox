# Multi-Agent Multiplayer Validation

This method validates authoritative multiplayer behavior with isolated player
roles on one machine. It strengthens the existing server tests and two-browser
smoke test by preventing the player roles from coordinating through shared
browser state or hidden server data.

The generated run manifest is authoritative for endpoints, scenarios, roles,
and artifact paths.

## Supported Claims and Evidence Boundary

A passing run supports these claims:

- Independent `p1` and `p2` clients joined distinct slots through isolated
  browser contexts or processes.
- Valid, invalid, and near-concurrent commands were resolved by the
  authoritative server as recorded by the evidence trace.
- The isolated clients converged on the expected player-visible session state.
- Both players participated in at least one completed cooperative wave.
- The tested disconnect, empty-room cleanup, fresh-room, and bounded local
  fault behaviors met their assertions.
- Temporary credentials, ports, processes, and browser contexts were cleaned
  up while configured evidence was retained.

**A passing run does not validate real Tailscale routing, DNS, ACLs, firewall
rules, NAT traversal, latency, packet loss, or any cross-machine behavior.**
Loopback traffic and local fault injection cannot support those claims. Use the
remote play flow in [tailscale-multiplayer.md](./tailscale-multiplayer.md) for a
separate real-network playtest.

## Roles and Isolation

Each run assigns these roles:

- `host` starts the authoritative server and client surface on dynamic loopback
  ports, records advertised endpoints, and observes service and room lifecycle.
- `p1` and `p2` each operate one isolated client and act only through visible
  client controls or the normal client protocol.
- `fault` applies only approved invalid-input, disconnect, timing, delay, or
  process-interruption profiles.
- `adjudicator` reviews retained evidence after execution and maps assertions
  to passed, failed, or not-executed results.
- The coordinator creates the run, distributes filtered role briefs, signals
  phase barriers, manages lifecycle, and collects artifacts.

`p1` and `p2` must not share browser storage, cookies, page handles, screenshots,
in-memory state, role actions, or direct gameplay-state messages. Player roles
must not read server memory or the authoritative event trace while choosing
actions. Control-plane barriers may say that a phase can advance, but must not
include resources, commands, hidden state, or another player's observations.

The adjudicator may read all redacted artifacts after scenario execution. The
fault role may know its approved fault profile and target, but must not use
hidden player or server state to decide when or how to act.

## Run a Validation

Before a run:

1. Install the repository dependencies.
2. Select a deterministic worker adapter for the baseline, or an agent adapter
   that implements the same role and evidence contracts.
3. Select the scenario matrix and a seed.
4. Choose an empty artifact root. Do not choose fixed client or server ports.

Run the deterministic isolated-process baseline:

```sh
npm run validate:multiplayer-agents
```

Use `--seed <integer>` to choose a seed and `--artifacts <directory>` to choose
an artifact root:

```sh
npm run validate:multiplayer-agents -- --seed 26060604 --artifacts .cache/multiplayer-validation
```

A conforming coordinator must:

1. Create a unique, isolated run directory.
2. Allocate dynamic loopback ports and temporary room credentials.
3. Write the manifest before role execution.
4. Start and monitor the server, client surface, and role workers.
5. Give every role a filtered brief and enforce coordination-only barriers.
6. Run the configured efficacy, lifecycle, and fault scenarios.
7. Retain redacted evidence and produce an adjudicated final report.
8. Stop spawned resources and release temporary credentials and ports on
   success, failure, or interruption.

Do not treat `npm run smoke:multiplayer` as a multi-agent validation run. It is
a useful two-browser comparison baseline, but one script controls both players.

## Comparison With Existing Tests

The shared Vitest suite validates deterministic game rules without transport or
client isolation. The Colyseus integration test validates room protocol and
server behavior with two SDK clients controlled by one test process. The
Playwright smoke test validates the rendered two-browser workflow, but one
script owns both browser contexts.

The multi-agent method adds separate player processes, filtered briefs,
control-plane-only barriers, authoritative event ordering, retained
player-action evidence, bounded fault behavior, and final adjudication. It does
not replace the focused suites; use all of them because each detects failures
at a different boundary.

## Review Run Artifacts

Start with the manifest. It identifies the run ID, seed, dynamic endpoints, room
identifier, scenario list, role assignments, allowed tools, claim boundary, and
the actual paths of all other artifacts.

A complete schema version `1.0` run retains:

- `manifest.json`, which points to every retained artifact.
- Filtered role briefs showing what each role was allowed to know.
- `roles/<role>-actions.jsonl` records showing actions, timing, phase barriers,
  and outcomes.
- `events.jsonl`, an append-only authoritative trace with ordered sequence IDs,
  simulation ticks or timestamps, event types, redacted actor identities,
  command acceptance or rejection, and relevant state digests.
- `assertions.jsonl`, which maps expected authoritative and client-visible
  behavior to evidence references.
- Diagnostic artifacts such as service logs, browser errors, fault parameters,
  and permitted screenshots.
- `report.json`, with environment details, per-scenario results, discrepancies,
  supported claims, unsupported claims, and adapter-trial status.

Artifact filenames may differ between adapters. Follow the paths in the
manifest rather than assuming a directory layout.

Review artifacts in this order:

1. Confirm the final report states the single-machine claim boundary and marks
   every scenario and assertion passed, failed, or not executed.
2. Follow failed assertion references into role actions and the event trace.
3. Check sequence IDs and state digests for ordering and convergence.
4. Compare player-visible assertions with authoritative outcomes without using
   authoritative evidence to excuse a missing client-visible result.
5. Confirm fault parameters and timing match the approved profile.
6. Confirm retained logs and reports do not expose the room secret.

## Failure Diagnosis

For startup or coordinator failures:

- Check that the manifest was written and contains distinct dynamic ports.
- Check service logs and advertised endpoints, then probe the server's
  loopback `/health` and `/config` endpoints.
- Check whether an interrupted prior run left a process or browser context
  alive. Do not work around conflicts by switching the harness to fixed ports.

For join, slot, or isolation failures:

- Compare the filtered `p1` and `p2` briefs and role-action records.
- Confirm each player used a separate browser context or process and received a
  distinct slot.
- Treat shared storage, screenshots, page handles, or gameplay-state messages
  as an invalid run even if gameplay assertions passed.

For command or convergence failures:

- Locate the command in the player role-action record and authoritative trace.
- Verify whether the command was accepted or rejected and whether rejected
  commands left authoritative state unchanged.
- Compare the final authoritative state digest with both client-visible
  assertion results.
- Use sequence IDs and ticks to diagnose near-concurrent command ordering.

For lifecycle or fault failures:

- Verify the recorded fault profile, target, timing, and expected outcome.
- Confirm the remaining client observed a disconnect and the trace recorded the
  lifecycle transition.
- Confirm all players left, the room was disposed, and the fresh-room phase
  received a new cooperative room.
- Mark unstable or unapproved fault behavior as a validation failure, not as
  evidence of network resilience.

For missing or unsafe evidence:

- Fail the run if required artifacts are absent, unordered, mutable, or cannot
  be mapped to report assertions.
- Fail the run if a reusable room secret appears in retained artifacts.
- Use `npm run test:server` and `npm run smoke:multiplayer` to determine whether
  a failure is also reproducible in the focused integration or browser baseline.
- To verify failed-run retention deliberately, run
  `npm run validate:multiplayer-agents -- --force-failure slot-assignment`; the
  command must fail while retaining a report and referenced evidence.

## Adapter Integration

An adapter may use deterministic workers, AI agents, or a mixture. It must not
change the validation contract or broaden the report's claim boundary.

A conforming adapter must:

- Accept the coordinator's role assignment, filtered brief, allowed tools,
  seed, timeouts, and phase barriers.
- Keep player execution and observations isolated.
- Emit structured role actions and assertion evidence with stable references.
- Prevent player roles from reading authoritative traces or another player's
  observations before execution ends.
- Record prompts, model or worker identity, seeds, actions, timeouts, and
  retries when behavior may be nondeterministic.
- Obey bounded fault profiles and the coordinator's cleanup signal.
- Redact temporary credentials before artifacts reach the adjudicator or final
  report.

Validate a new adapter against the deterministic worker baseline. Run the same
seed and scenario matrix repeatedly, compare assertion and trace outcomes, and
reject the adapter if it leaks gameplay state, skips required evidence, or
requires different success criteria.

An initial AI-agent adapter trial used only a generated `p1` brief. The agent
proposed a p1 connection action, cited only its own protocol state, command
results, and assigned slot as permitted evidence, and confirmed it did not read
authoritative or peer artifacts. Repeat this isolation check whenever an agent
provider, model, prompt, or allowed-tool policy changes.

## Cleanup

The coordinator owns cleanup on every terminal path, including interruption:

- Stop the host services and all role workers.
- Close every browser page, context, and process.
- Release allocated loopback ports.
- Invalidate and remove temporary room credentials.
- Retain the configured manifest, redacted evidence, diagnostics, and report.

After a run, verify that no spawned process remains, the recorded ports are
available, and retained artifacts pass the secret scan. If automatic cleanup
fails, stop only the processes identified by that run's manifest and logs.
Do not delete failed-run artifacts until diagnosis is complete.
