## Why

The project needs to validate real two-player cooperative tower defense behavior before investing in production multiplayer infrastructure. A private Tailscale development topology with an authoritative Colyseus server provides a small, inspectable way to test remote play, command validation, synchronization, and a complete wave across the internet.

## What Changes

- Add a private two-player cooperative multiplayer mode with distinct `p1` and `p2` player slots in one shared Colyseus room.
- Add a Phaser multiplayer client that renders synchronized server state, displays connection and player status, and sends gameplay commands without owning authoritative state.
- Add a Colyseus server that owns room lifecycle, command validation, fixed-tick tower defense simulation, and synchronized game state.
- Add shared command, state, schema, and simulation modules that do not depend on Phaser runtime objects.
- Add developer commands and configuration for same-machine multiplayer smoke testing and Tailscale-reachable remote play.
- Add Tailscale setup and validation documentation for hosting and joining a private multiplayer session.
- Preserve the existing single-player game and GitHub Pages publishing behavior while the multiplayer mode remains a development prototype.

## Capabilities

### New Capabilities
- `multiplayer-room-session`: Covers two-player room joining, player slot assignment, synchronized session status, disconnect handling, and room cleanup.
- `authoritative-cooperative-gameplay`: Covers server-validated player commands, authoritative synchronized state, fixed-tick tower defense simulation, and completion of a cooperative wave.
- `private-multiplayer-development`: Covers local and Tailscale development commands, network configuration, private connection guidance, and multiplayer validation flows.

### Modified Capabilities
- None.

## Impact

- Adds multiplayer runtime source under `src/`, separated into client, server, and shared modules.
- Adds Phaser, Colyseus server/client, schema, TypeScript, and development-runner dependencies plus package scripts.
- Adds multiplayer-focused automated tests, a validated same-machine flow, and documented Tailscale remote-operation procedures.
- Adds developer documentation under `docs/` and may extend `mise.toml` with multiplayer shortcuts.
- Introduces a network-reachable development server that must not embed or expose room secrets in browser-delivered client code.
- Does not require external persistent infrastructure or change the existing single-player public game contract.
