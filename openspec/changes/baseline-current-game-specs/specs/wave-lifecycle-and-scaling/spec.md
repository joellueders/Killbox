## ADDED Requirements

### Requirement: Alternate between build and combat phases
The system SHALL run gameplay through build phases and combat phases.

#### Scenario: Run begins
- **WHEN** a valid run starts
- **THEN** the game enters a build phase before the first combat wave

#### Scenario: Wave begins
- **WHEN** the player starts an eligible wave
- **THEN** the game enters combat phase
- **AND** wave enemies are queued for spawning

### Requirement: Gate wave start
The system SHALL prevent a wave from starting while the run is not ready for combat.

#### Scenario: Upgrade choice is unresolved
- **WHEN** a between-wave upgrade choice is pending
- **THEN** the next wave cannot start
- **AND** the player receives feedback to choose a reward first

#### Scenario: Wave is already active
- **WHEN** a combat wave is already active
- **THEN** another wave cannot start

### Requirement: Show next wave preview
The system SHALL show a preview of the next wave's enemy composition before the wave starts.

#### Scenario: Player is between waves
- **WHEN** the run is in a build phase
- **THEN** the UI displays the upcoming wave number and enemy composition summary

### Requirement: Scale waves over time
The system SHALL increase wave pressure over time by scaling enemy count, enemy durability, and available enemy archetypes.

#### Scenario: Later wave is generated
- **WHEN** the system generates a later wave
- **THEN** the wave can include more enemies and more specialized enemy archetypes than earlier waves

### Requirement: Spawn enemies from arena spawn points
The system SHALL spawn wave enemies from the active arena's spawn points and route them toward the goal.

#### Scenario: Enemy enters combat
- **WHEN** an enemy is spawned for the active wave
- **THEN** it starts near one of the arena spawn points
- **AND** it follows a valid route toward the goal unless affected by enemy behavior or gameplay effects

### Requirement: Complete waves after active threats end
The system SHALL complete a wave when all queued and active wave threats have been resolved.

#### Scenario: Wave threats are resolved
- **WHEN** the enemy queue is empty and no active enemies remain
- **THEN** the wave ends
- **AND** the run returns to a build or between-wave progression state
- **AND** wave-clear rewards and summary stats are presented
