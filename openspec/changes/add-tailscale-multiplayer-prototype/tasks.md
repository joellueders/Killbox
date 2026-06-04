## 1. Multiplayer Project Setup

- [x] 1.1 Add the Phaser, Colyseus server/client, schema, TypeScript, client-development-server, test, and concurrent-process dependencies required by the prototype.
- [x] 1.2 Add TypeScript and package configuration for distinct browser-client, Node-server, shared-module, and test execution targets.
- [x] 1.3 Create the `src/multiplayer/client/`, `src/multiplayer/server/`, and `src/multiplayer/shared/` source boundaries without changing the existing single-player entrypoint.
- [x] 1.4 Implement environment-based multiplayer configuration with loopback defaults and explicit `KILLBOX_SERVER_HOST`, `KILLBOX_SERVER_PORT`, `KILLBOX_PUBLIC_URL`, `KILLBOX_ROOM_SECRET`, and `KILLBOX_MODE` handling.

## 2. Shared State, Commands, and Simulation

- [x] 2.1 Define typed command envelopes and payloads for `ready`, `start_wave`, `build_tower`, `upgrade_tower`, `sell_tower`, `cast_ability`, and `choose_reward`.
- [x] 2.2 Define the synchronized authoritative state and Colyseus schemas for room phase, tick, player slots, readiness, resources, base health, wave, build sites, towers, enemies, attack effects, rewards, and outcome.
- [x] 2.3 Implement initial cooperative game-state creation with stable entity identifiers, two player slots, build sites, minimal tower and enemy definitions, an ability, and reward choices.
- [x] 2.4 Implement server-side validation and mutations for readiness, wave start, tower build, tower upgrade, tower sell, ability cast, and reward selection.
- [x] 2.5 Implement the fixed-step shared simulation for enemy spawning and movement, tower targeting and attacks, damage resolution, deaths and resource rewards, base damage, wave completion, and phase transitions without Phaser dependencies.
- [x] 2.6 Add unit tests for valid and rejected commands, simulation progression, wave completion, and defeat outcomes.

## 3. Authoritative Colyseus Room

- [x] 3.1 Implement the Colyseus server entrypoint and one advertised singleton cooperative room with a maximum of two active clients.
- [x] 3.2 Implement room-secret validation, `p1` and `p2` slot assignment, connection and readiness status, disconnect handling, optional reconnection grace, and empty-room disposal.
- [x] 3.3 Register typed command handlers that derive player identity from the sending connection, invoke shared validation, and return structured rejection feedback without invalid mutations.
- [x] 3.4 Run the authoritative fixed simulation tick in the room and synchronize resulting schema state to all connected clients.
- [x] 3.5 Add Colyseus integration tests for singleton room access, slot assignment, synchronized state, accepted and rejected commands, disconnect visibility, and room cleanup.

## 4. Phaser Multiplayer Client

- [x] 4.1 Create a standalone Phaser multiplayer prototype page and scene that accepts runtime server endpoint, room identifier, and room-secret configuration.
- [x] 4.2 Implement the Colyseus client connection lifecycle, join failure feedback, assigned-slot display, connection status, readiness status, and command rejection feedback.
- [x] 4.3 Render synchronized build sites, towers, enemies, attack effects, player resources, base health, room phase, wave, rewards, and game outcome from authoritative state.
- [x] 4.4 Add client controls for all initial gameplay commands without directly mutating authoritative gameplay state.
- [x] 4.5 Handle remote player disconnect updates and render smoothly between authoritative state patches without changing simulation outcomes.

## 5. Developer Commands and Tailscale Flow

- [x] 5.1 Add `npm run dev:server`, `npm run dev:client`, and `npm run dev:multiplayer` commands for isolated and same-machine development.
- [x] 5.2 Add `npm run dev:tailscale` to start explicitly network-reachable multiplayer services and print the configured Tailscale client join URL and Colyseus endpoint.
- [x] 5.3 Ensure committed browser-delivered assets do not contain a reusable room secret and clearly display the active bind and advertised addresses.
- [x] 5.4 Document same-machine setup, environment configuration, Tailscale host and join steps, reachability checks, Tailscale IP fallback, room-secret handling, and shutdown behavior under `docs/`.

## 6. End-to-End Validation

- [x] 6.1 Add an automated two-browser multiplayer smoke test that verifies distinct slots, synchronized valid tower placement, rejected invalid placement, server-simulated wave state, and disconnect status.
- [x] 6.2 Run type checking, shared unit tests, Colyseus integration tests, and the automated two-browser multiplayer smoke test.
- [x] 6.3 Run the existing single-player smoke test and verify the existing Pages entrypoints remain functional.
- [x] 6.4 Perform the documented same-machine two-client flow and complete one cooperative wave.
- [ ] 6.5 Perform the documented remote Tailscale flow from two Tailscale-connected machines, verify synchronized commands and state, and complete one cooperative wave.
- [x] 6.6 Run OpenSpec validation for `add-tailscale-multiplayer-prototype` and resolve all reported issues.
