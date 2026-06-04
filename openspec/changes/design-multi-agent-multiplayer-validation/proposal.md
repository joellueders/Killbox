## Why

Requiring a second physical computer makes multiplayer efficacy validation difficult to repeat, automate, and delegate to coding agents. The project needs a rigorous single-machine method where multiple independent agents can exercise distinct player roles, validate authoritative behavior, and produce inspectable evidence without claiming to prove the Tailscale transport path itself.

## What Changes

- Design a reproducible multi-agent validation method for the multiplayer prototype introduced by `add-tailscale-multiplayer-prototype`.
- Define independent agent roles for server operation, `p1`, `p2`, adversarial or fault-injection behavior, and evidence review.
- Define isolation requirements so player agents do not share browser context, local client state, or direct coordination channels that bypass the authoritative server.
- Define scenario orchestration for joining, commands, synchronization, invalid-command rejection, wave completion, disconnects, reconnects, and room cleanup.
- Define machine-readable event traces, assertions, artifacts, and a final validation report that distinguish observed evidence from inference.
- Document which multiplayer properties the single-machine method can validate and which Tailscale or cross-machine properties remain outside its evidence boundary.

## Capabilities

### New Capabilities
- `multi-agent-multiplayer-validation`: Covers reproducible isolated-agent orchestration, multiplayer efficacy scenarios, fault injection, evidence capture, and validation reporting on one machine.

### Modified Capabilities
- None.

## Impact

- Adds design and validation artifacts related to the multiplayer prototype under `openspec/`, tests, scripts, or `docs/`.
- May add an agent-orchestration harness and structured validation-report format.
- Uses dynamic loopback ports and isolated browser contexts or processes so multiple agent runs can coexist.
- Does not replace Tailscale reachability documentation and does not claim to validate real cross-machine latency, routing, ACLs, or firewall behavior.
