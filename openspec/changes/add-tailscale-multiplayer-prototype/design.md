## Context

Killbox is currently a static browser game centered on `src/killbox.html`, with supporting JavaScript under `src/` and no application server, module build, or authoritative multiplayer runtime. GitHub Pages publishes the `src/` tree directly. The multiplayer prototype must preserve that single-player surface while proving that two remote players can join one private session, issue commands, observe synchronized state, and complete a server-simulated wave.

The repository contract requires runtime source to remain under `src/`. The prototype therefore needs clear client, server, and shared-code boundaries inside that tree. Tailscale supplies private reachability between development machines, but it is not part of the game protocol and is not a substitute for server-side command validation.

## Goals / Non-Goals

**Goals:**
- Prove a two-player cooperative tower defense session across separate Tailscale-connected machines.
- Make Colyseus the authority for room lifecycle, player slots, commands, game state, and simulation.
- Use Phaser only to collect input and render the latest synchronized state.
- Keep shared state, command, validation, and simulation logic independent of Phaser runtime objects.
- Provide repeatable same-machine, automated, and remote manual validation flows.
- Preserve the existing single-player game and public Pages deployment while the prototype is evaluated.

**Non-Goals:**
- Production matchmaking, accounts, public internet discovery, or durable persistence.
- Supporting more than one active cooperative session or more than two active players.
- Full parity with every system, asset, balance rule, and interaction in the existing single-player game.
- Host migration, rollback networking, anti-cheat beyond authoritative validation, or adversarial security hardening.
- Production TLS termination, Tailscale installation automation, or Tailscale ACL administration.
- Replacing the existing single-player implementation during this prototype.

## Decisions

1. Add a separate TypeScript multiplayer prototype under `src/multiplayer/`.

   Runtime code will be split into `src/multiplayer/client/`, `src/multiplayer/server/`, and `src/multiplayer/shared/`. The client will have a separate entry page and Phaser scene rather than modifying the existing single-player page. Shared modules will contain command types, serializable game concepts, validation helpers, and fixed-tick simulation logic without importing Phaser. The server will own Colyseus room and schema integration.

   A root-level `apps/` and `packages/` workspace was considered, but it conflicts with the repository's canonical `src/` source-tree contract. Directly refactoring the existing single-file game was also considered, but it would expand the prototype's blast radius before the multiplayer model is proven.

2. Run one discoverable singleton cooperative room with two stable slots.

   The server will create or expose one cooperative room and print a join URL containing the server endpoint and room identifier. Both clients use that same URL. Room state will always represent `p1` and `p2` slots with connection and readiness status. The first eligible connection receives `p1`; the second receives `p2`; further connections are rejected rather than silently creating a separate session.

   A disconnected slot remains visible as disconnected so the remaining player observes the lifecycle change. A short Colyseus reconnection grace period may preserve the slot for transient failures; after that period the slot can become available. The room is disposed after no active clients remain.

3. Represent player actions as validated discrete commands.

   The client sends typed command envelopes for `ready`, `start_wave`, `build_tower`, `upgrade_tower`, `sell_tower`, `cast_ability`, and `choose_reward`. The room derives the issuing player slot from the Colyseus client session and does not trust a client-supplied player identifier. Each handler validates phase, ownership, resources, cooldowns, targets, and current state before applying a mutation.

   Invalid commands produce a structured rejection response for client feedback and do not mutate authoritative state. Commands are serialized through the room's event loop, avoiding client-side prediction or conflicting concurrent mutations in the prototype.

4. Keep the authoritative game model intentionally small but complete.

   The shared model will include room phase, simulation tick, two player slots, readiness and per-player resources, shared base health, wave state, build sites, towers, enemies, transient attack effects, rewards, and game outcome. Entities use stable IDs and plain game-domain values so Colyseus schemas can synchronize them and Phaser can render them without becoming authoritative.

   The prototype will implement a narrow set of tower, enemy, ability, and reward definitions sufficient to build defenses and complete at least one wave. Reusing all current single-player mechanics was considered, but the current implementation is tightly coupled to browser rendering and would delay validation of the multiplayer architecture.

5. Advance gameplay on a server-owned fixed tick and render independently.

   The room will run a fixed-step simulation, initially targeting 20 ticks per second. Each tick advances spawning, enemy movement, tower targeting and attacks, damage resolution, deaths and resource rewards, base damage, wave completion, and phase transitions. Colyseus state patches distribute authoritative changes. Phaser renders the latest received snapshot and may visually interpolate between updates, but interpolation never changes authoritative state.

   The simulation will avoid wall-clock and Phaser APIs in shared logic. Seeded or server-owned randomness will be used where randomness affects authoritative outcomes.

6. Use explicit development configuration and network-safe defaults.

   The server defaults to loopback for local work and only binds to a network-reachable interface when explicitly configured or started through `dev:tailscale`. Configuration will support `KILLBOX_SERVER_HOST`, `KILLBOX_SERVER_PORT`, `KILLBOX_PUBLIC_URL`, `KILLBOX_ROOM_SECRET`, and `KILLBOX_MODE`, with additional client-host or client-port settings if needed to print a usable browser URL.

   `dev:server`, `dev:client`, and `dev:multiplayer` support local development. `dev:tailscale` starts the required network-reachable services and prints the client join URL and Colyseus endpoint using the configured Tailscale machine name or IP. The browser receives a room secret at runtime through developer input or the private join flow; the secret is not committed or embedded in public static client assets. The room secret prevents accidental joins but is not treated as a production security boundary.

7. Validate the prototype at multiple layers.

   Shared simulation and validation rules will have unit tests. Colyseus room integration tests will verify slots, synchronization, accepted and rejected commands, disconnects, and cleanup. A browser smoke test will connect two isolated client contexts to the same local room and exercise a synchronized build and wave. This change verifies that Tailscale mode starts with network-reachable configuration and documents the remote flow, but it does not require execution from a second computer. A related follow-up change will design a multi-agent, single-machine method for stronger multiplayer-efficacy validation.

## Risks / Trade-offs

- [The prototype duplicates some single-player game concepts] -> Keep the multiplayer model deliberately narrow, document parity as a non-goal, and evaluate extraction only after the architecture is proven.
- [Server source under `src/` is included in the current Pages artifact] -> Keep secrets and environment-specific values out of source, treat server files as inert prototype source, and revisit Pages artifact filtering if the prototype becomes permanent.
- [A development server bound to `0.0.0.0` is reachable beyond loopback] -> Require explicit Tailscale mode, print the active bind address, use a room secret, and document Tailscale ACL and host-firewall expectations.
- [Tailscale name resolution or ACL configuration can block remote play] -> Document IP-address fallback and concrete reachability checks before debugging game code.
- [Fixed-tick load or state volume can grow quickly] -> Use a small entity count, synchronize stable compact state, and keep transient effects bounded for the prototype.
- [A disconnected player can stall readiness or wave progression] -> Surface connection state and define server rules that clear readiness and permit the remaining session to continue or wait explicitly.
- [No persistent infrastructure means all progress is lost on server exit] -> Treat in-memory room state as an intentional prototype constraint.

## Migration Plan

1. Add dependencies, scripts, and the isolated multiplayer source tree without changing the existing single-player entrypoint.
2. Implement and test the singleton room, shared state, and command path.
3. Add the minimal authoritative wave simulation and Phaser rendering adapter.
4. Validate two local browser clients before enabling network-reachable Tailscale mode.
5. Document the private remote play flow and create the related multi-agent validation-design follow-up.

Rollback consists of removing the isolated multiplayer source, scripts, dependencies, tests, and documentation; the existing single-player game remains the unchanged fallback.

## Open Questions

- Should the prototype's room secret be entered in the client UI or supplied only through a generated private join URL?
- After the prototype succeeds, should shared multiplayer concepts be used to incrementally replace parts of the existing single-player simulation?
