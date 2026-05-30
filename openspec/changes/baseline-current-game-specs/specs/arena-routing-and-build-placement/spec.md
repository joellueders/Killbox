## ADDED Requirements

### Requirement: Provide multiple arenas
The system SHALL provide multiple playable arenas, each with defined roads, blocked terrain, enemy spawn points, a goal, and a hero spawn.

#### Scenario: Player chooses an arena
- **WHEN** the player selects a supported arena before starting a run
- **THEN** the run uses that arena's roads, blocked terrain, spawn points, goal, and hero spawn

### Requirement: Maintain enemy path validity
The system SHALL maintain at least one valid enemy route from each active spawn point to the goal.

#### Scenario: Arena is loaded
- **WHEN** an arena is applied
- **THEN** the system computes enemy routes from spawn points to the goal
- **AND** the arena is considered playable only when required routes exist

### Requirement: Restrict build placement to valid cells
The system SHALL reject build placement outside the arena, on blocked terrain, on spawn cells, on the goal cell, or on occupied cells.

#### Scenario: Player attempts invalid placement
- **WHEN** the player attempts to place a buildable on an invalid or occupied cell
- **THEN** the buildable is not placed
- **AND** the player's gold is not spent

### Requirement: Enforce buildable placement roles
The system SHALL enforce placement rules based on the selected buildable's role.

#### Scenario: Player places a road-only buildable
- **WHEN** the player places a road-only buildable such as a blocker, explosive, or trap
- **THEN** the placement is accepted only on a valid road cell

#### Scenario: Player places a non-road defense
- **WHEN** the player places a defense that is not road-only
- **THEN** the placement is accepted only when the target cell satisfies that defense's placement rules

### Requirement: Prevent complete route blocking
The system SHALL reject placements that would remove all valid enemy routes from spawn points to the goal.

#### Scenario: Player attempts to fully block the route
- **WHEN** the player places a blocker or road-obstructing defense that would make the goal unreachable
- **THEN** the placement is reverted
- **AND** enemy pathing remains valid
- **AND** the player's gold is not spent for that rejected placement

### Requirement: Charge only successful placement
The system SHALL spend gold only when a buildable is successfully placed.

#### Scenario: Player successfully places a buildable
- **WHEN** the selected buildable is valid for the target cell and the player can afford it
- **THEN** the buildable appears in the arena
- **AND** the player's gold decreases by the buildable cost

#### Scenario: Player cannot afford selected buildable
- **WHEN** the player attempts to place a buildable without enough gold
- **THEN** the buildable is not placed
- **AND** the player receives affordability feedback
