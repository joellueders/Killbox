## ADDED Requirements

### Requirement: Host one cooperative multiplayer room
The multiplayer prototype SHALL expose one active cooperative room with at most two active player connections and SHALL assign each eligible connection to the first available player slot.

#### Scenario: First client joins the cooperative room
- **WHEN** the multiplayer server is running and the first eligible client joins the advertised room
- **THEN** the server assigns the client to player slot `p1`
- **AND** the room records `p1` as connected

#### Scenario: Second client joins the cooperative room
- **WHEN** a second eligible client joins the same advertised room
- **THEN** the server assigns the client to player slot `p2`
- **AND** both clients remain in the same room

#### Scenario: Additional client attempts to join
- **WHEN** both player slots are occupied and another client attempts to join
- **THEN** the server rejects the additional active player connection
- **AND** the server does not create a separate cooperative session for that connection

#### Scenario: Client joins after a slot becomes available
- **WHEN** one player slot is available and an eligible client joins the advertised room
- **THEN** the server assigns that client to the first available player slot
- **AND** both connected clients receive the updated slot status

### Requirement: Synchronize room state to both clients
The multiplayer room SHALL synchronize the authoritative session state to every connected player.

#### Scenario: Client finishes joining
- **WHEN** a client is assigned a player slot
- **THEN** the client receives the current authoritative room state
- **AND** the client can identify its assigned slot and the status of the other slot

#### Scenario: Authoritative state changes
- **WHEN** the server mutates synchronized room state
- **THEN** both connected clients receive the resulting state update
- **AND** both clients can render the same current session

### Requirement: Track player connection and readiness status
The multiplayer room SHALL expose connection and readiness status for both player slots.

#### Scenario: Player changes readiness
- **WHEN** a connected player sends a valid readiness command
- **THEN** the server updates that player's readiness in authoritative state
- **AND** both clients receive the updated readiness status

#### Scenario: Player disconnects
- **WHEN** one connected player disconnects or leaves
- **THEN** the room records that player's slot as disconnected
- **AND** the remaining client receives the updated connection status
- **AND** the disconnected player's readiness no longer counts toward starting a wave

### Requirement: Clean up empty rooms
The multiplayer server SHALL eventually dispose of the cooperative room after no active clients remain.

#### Scenario: Last active client leaves
- **WHEN** the final active client leaves the cooperative room
- **THEN** the room is disposed after any configured reconnection grace period
- **AND** its in-memory authoritative state is released
