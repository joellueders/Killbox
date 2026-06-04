## ADDED Requirements

### Requirement: Separate multiplayer client, server, and shared logic
The repository SHALL keep multiplayer client rendering, authoritative server behavior, and shared game or network logic in distinct source modules under `src/`, and server simulation logic SHALL NOT depend on Phaser runtime objects.

#### Scenario: Contributor changes authoritative simulation
- **WHEN** a contributor changes multiplayer simulation or command-validation logic
- **THEN** the logic is implemented in server or shared source modules under `src/`
- **AND** the logic can run without a Phaser runtime

#### Scenario: Contributor changes multiplayer rendering
- **WHEN** a contributor changes the multiplayer Phaser client
- **THEN** the client consumes synchronized state and shared message types
- **AND** the client does not become authoritative for gameplay outcomes

### Requirement: Provide multiplayer developer commands
The repository SHALL provide developer commands for starting the server, client, same-machine multiplayer mode, and Tailscale multiplayer mode.

#### Scenario: Developer starts only the server
- **WHEN** the developer runs `npm run dev:server`
- **THEN** the Colyseus multiplayer server starts with local development defaults

#### Scenario: Developer starts only the client
- **WHEN** the developer runs `npm run dev:client`
- **THEN** the Phaser multiplayer client development server starts

#### Scenario: Developer starts same-machine multiplayer
- **WHEN** the developer runs `npm run dev:multiplayer`
- **THEN** the required local client and server processes start for a two-browser smoke test

#### Scenario: Developer starts Tailscale multiplayer
- **WHEN** the developer runs `npm run dev:tailscale`
- **THEN** the required multiplayer services bind to explicitly configured network-reachable interfaces
- **AND** the command prints a Tailscale-reachable client join URL or equivalent connection hint

### Requirement: Configure multiplayer networking without source edits
The multiplayer prototype SHALL support environment-based configuration for server binding, public connection information, room access, and Tailscale mode.

#### Scenario: Developer configures a Tailscale-reachable server
- **WHEN** `KILLBOX_SERVER_HOST`, `KILLBOX_SERVER_PORT`, `KILLBOX_PUBLIC_URL`, `KILLBOX_ROOM_SECRET`, and `KILLBOX_MODE` are supplied
- **THEN** the server uses those values without requiring source changes
- **AND** the advertised connection information identifies the configured public endpoint

#### Scenario: Developer does not enable network-reachable mode
- **WHEN** the server starts with local development defaults
- **THEN** it binds to a loopback interface
- **AND** it does not silently expose the multiplayer server on all host interfaces

#### Scenario: Browser connects to configured server
- **WHEN** the multiplayer client is given the configured Colyseus endpoint, room identifier, and required room access value
- **THEN** the client attempts to join that room using the supplied runtime configuration

### Requirement: Restrict prototype room access
The multiplayer server SHALL validate the configured development room secret before assigning a player slot, and committed browser assets SHALL NOT contain a reusable room secret.

#### Scenario: Client supplies the configured room secret
- **WHEN** a client attempts to join with the configured development room secret
- **THEN** the server permits room joining subject to available player slots

#### Scenario: Client supplies an invalid room secret
- **WHEN** a client attempts to join without the configured room secret or with a different value
- **THEN** the server rejects the join attempt
- **AND** no player slot is assigned

### Requirement: Support same-machine multiplayer validation
The multiplayer development flow SHALL support two isolated browser clients joining the same local authoritative room.

#### Scenario: Developer performs local multiplayer smoke test
- **WHEN** the developer starts same-machine multiplayer and opens the advertised client URL in two isolated browser contexts
- **THEN** the clients receive distinct `p1` and `p2` slots
- **AND** a valid tower placement is synchronized to both clients
- **AND** an invalid command leaves both clients synchronized
- **AND** a server-simulated wave is visible to both clients

### Requirement: Document Tailscale remote play
The repository SHALL document how one developer hosts the prototype and another developer joins it over a private Tailscale network.

#### Scenario: Developers prepare a remote playtest
- **WHEN** developers follow the Tailscale multiplayer documentation
- **THEN** they can identify the host machine's Tailscale name or IP
- **AND** confirm the configured server endpoint is reachable
- **AND** open the advertised join URL from a remote Tailscale-connected machine

#### Scenario: Two remote clients play
- **WHEN** two eligible remote browser clients join the advertised room over Tailscale
- **THEN** both clients can send server-validated gameplay commands
- **AND** both clients receive synchronized authoritative game state
- **AND** the players can complete at least one cooperative wave without external persistent infrastructure
