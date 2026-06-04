## ADDED Requirements

### Requirement: Keep multiplayer game state authoritative on the server
The multiplayer server SHALL own all state that determines cooperative gameplay outcomes, and the Phaser client SHALL render synchronized state without directly mutating authoritative game state.

#### Scenario: Client receives game state
- **WHEN** the server synchronizes room phase, simulation tick, player slots, readiness, player resources, base health, wave state, build sites, towers, enemies, attack effects, available rewards, or game outcome
- **THEN** the Phaser client renders the received values
- **AND** client rendering does not become the authority for those values

#### Scenario: Client attempts a local-only mutation
- **WHEN** a client changes a local rendering or input value without sending an accepted command
- **THEN** authoritative room state remains unchanged

### Requirement: Accept discrete gameplay commands
The multiplayer server SHALL accept typed player-intent commands for `ready`, `start_wave`, `build_tower`, `upgrade_tower`, `sell_tower`, `cast_ability`, and `choose_reward`.

#### Scenario: Player sends a gameplay command
- **WHEN** a connected player sends a supported command with a valid payload
- **THEN** the server associates the command with the issuing player's assigned slot
- **AND** the server validates the command against current authoritative state before mutation

#### Scenario: Client claims another player slot
- **WHEN** a client payload claims to act as a different player slot
- **THEN** the server ignores the claimed identity
- **AND** validates the command using the slot assigned to the sending connection

### Requirement: Reject invalid gameplay commands
The multiplayer server SHALL reject or ignore commands that fail authoritative validation without mutating game state.

#### Scenario: Player cannot afford a tower
- **WHEN** a player sends `build_tower` without enough resources
- **THEN** the server does not add the tower
- **AND** authoritative resources remain unchanged
- **AND** both clients remain synchronized

#### Scenario: Player targets an invalid build site
- **WHEN** a player sends `build_tower` for an unavailable or invalid build site
- **THEN** the server does not add the tower
- **AND** the build site remains unchanged

#### Scenario: Player sends a command in an invalid phase
- **WHEN** a player sends a command that is not allowed in the current room phase
- **THEN** the server rejects or ignores the command
- **AND** authoritative state remains unchanged

### Requirement: Apply valid defense commands authoritatively
The multiplayer server SHALL validate and apply valid tower build, upgrade, and sell commands.

#### Scenario: Player builds a tower
- **WHEN** a player with sufficient resources sends a valid `build_tower` command for an available build site
- **THEN** the server deducts the authoritative cost
- **AND** adds the tower to authoritative state with ownership and a stable identifier
- **AND** both clients receive the new tower state

#### Scenario: Player upgrades a tower
- **WHEN** a player sends a valid `upgrade_tower` command for an eligible tower
- **THEN** the server applies the authoritative upgrade and cost
- **AND** both clients receive the upgraded tower state

#### Scenario: Player sells a tower
- **WHEN** a player sends a valid `sell_tower` command for a sellable tower
- **THEN** the server removes the tower and applies the authoritative refund
- **AND** both clients receive the resulting state

### Requirement: Gate wave starts on authoritative readiness
The multiplayer server SHALL determine whether a cooperative wave can start from authoritative room phase, connection, and readiness state.

#### Scenario: Both connected players are ready
- **WHEN** both active player slots are connected and ready and a valid `start_wave` command is received
- **THEN** the server starts the next wave
- **AND** both clients receive the combat phase and wave state

#### Scenario: Required player is not ready
- **WHEN** a `start_wave` command is received while an active connected player is not ready
- **THEN** the server does not start the wave

### Requirement: Advance tower defense gameplay on a fixed server tick
The multiplayer server SHALL run a fixed-step authoritative simulation independently from client rendering.

#### Scenario: Active wave advances
- **WHEN** the room is in an active wave phase and a simulation tick occurs
- **THEN** the server advances enemy spawning and movement
- **AND** advances tower targeting and attacks
- **AND** resolves attack effects, damage, and enemy deaths
- **AND** applies resource rewards and base damage
- **AND** evaluates wave completion and phase transitions

#### Scenario: Client rendering rate differs
- **WHEN** clients render at different frame rates or between synchronized patches
- **THEN** the authoritative simulation tick and outcomes remain server-owned
- **AND** both clients converge on the synchronized state

### Requirement: Validate abilities and rewards authoritatively
The multiplayer server SHALL determine whether abilities can be cast and rewards can be selected.

#### Scenario: Player casts an available ability
- **WHEN** a player sends a valid `cast_ability` command for an available ability and valid target
- **THEN** the server applies the authoritative ability effect and cooldown or cost
- **AND** both clients receive the resulting state

#### Scenario: Player selects an available reward
- **WHEN** a player sends a valid `choose_reward` command for a currently available reward
- **THEN** the server applies the reward to authoritative state
- **AND** removes or resolves the relevant reward choice
- **AND** both clients receive the resulting state

### Requirement: Complete a cooperative wave
The multiplayer prototype SHALL allow two connected players to complete at least one shared server-simulated tower defense wave.

#### Scenario: Players defeat the wave
- **WHEN** the players build defenses, start a wave, and the server resolves all wave enemies without reducing base health to zero
- **THEN** the server marks the wave complete
- **AND** transitions the room to the next non-combat phase
- **AND** both clients render the same completed-wave state

#### Scenario: Base is defeated
- **WHEN** authoritative base health reaches zero during a wave
- **THEN** the server records a defeat outcome
- **AND** both clients render the same outcome
