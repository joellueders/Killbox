## ADDED Requirements

### Requirement: Snapshot combat wave state
The system SHALL create a restart snapshot when a combat wave begins.

#### Scenario: Combat wave starts
- **WHEN** the system starts a combat wave
- **THEN** it records enough run state to restore the wave start

### Requirement: Offer limited wave restart recovery
The system SHALL offer a limited number of wave restarts after player defeat when a restart snapshot is available.

#### Scenario: Player is defeated with restart available
- **WHEN** the player is defeated and has restart recovery remaining
- **THEN** the player is offered a restart of the current wave
- **AND** accepting the restart restores the saved wave-start state

#### Scenario: Player is defeated without restart available
- **WHEN** the player is defeated and no restart recovery remains
- **THEN** the system presents the final run outcome

### Requirement: Generate a password save
The system SHALL generate a shareable password representing the current resumable run state.

#### Scenario: Player creates a password
- **WHEN** the player requests a password save
- **THEN** the system serializes the supported run state
- **AND** the system includes an integrity check
- **AND** the player receives a password string

### Requirement: Validate password saves before loading
The system SHALL validate password format and integrity before restoring a run.

#### Scenario: Player enters a valid password
- **WHEN** the player loads a password with a supported prefix and valid integrity check
- **THEN** the saved run state is restored

#### Scenario: Player enters an invalid password
- **WHEN** the player loads a malformed, unsupported, or corrupted password
- **THEN** the run is not restored
- **AND** the player receives invalid-password feedback

### Requirement: Restore supported run state from password
The system SHALL restore supported arena, economy, wave, hero, defense, modifier, and boss progression state from a valid password.

#### Scenario: Valid password is loaded
- **WHEN** the system restores a run from a valid password
- **THEN** the saved arena is applied
- **AND** saved economy, wave, score, hero, defense, modifier, and boss progression state is restored
- **AND** transient combat entities and visual effects are reset to a resumable build state
