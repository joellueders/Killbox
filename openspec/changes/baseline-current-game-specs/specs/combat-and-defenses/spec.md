## ADDED Requirements

### Requirement: Support direct hero combat
The system SHALL allow the player to directly fight enemies with the equipped hero weapon.

#### Scenario: Player attacks during combat
- **WHEN** the player fires the equipped weapon during combat
- **THEN** the weapon produces its defined attack behavior
- **AND** eligible enemies hit by the attack take damage or applicable status effects

### Requirement: Support distinct weapon roles
The system SHALL provide weapons with distinct combat roles such as rapid fire, piercing shots, close-range blasts, chained lightning, and freezing attacks.

#### Scenario: Player changes active weapon from loadout
- **WHEN** the player selects a different weapon from the active loadout
- **THEN** subsequent hero attacks use that weapon's behavior

### Requirement: Support defense roles
The system SHALL support buildable defenses with distinct roles including direct damage, area damage, slowing, blocking, pushing, poison, burning, chaining, contact traps, and manual explosives.

#### Scenario: Defense engages enemies
- **WHEN** an enemy enters a defense's effective conditions
- **THEN** the defense applies its role-specific damage, control, status, or blocking behavior

### Requirement: Support enemy archetypes
The system SHALL support enemy archetypes with different movement, durability, ranged, support, and priority-targeting behaviors.

#### Scenario: Specialized enemy spawns
- **WHEN** a specialized enemy archetype enters combat
- **THEN** it behaves according to its role, such as moving quickly, attacking from range, protecting allies, healing allies, attacking defenses, or pressuring the hero

### Requirement: Attribute combat outcomes
The system SHALL track combat outcomes by source for hero, defense, and other damage or kills.

#### Scenario: Enemy is defeated
- **WHEN** an enemy dies from hero, defense, or other damage
- **THEN** the system records the kill under the appropriate source category
- **AND** wave and run statistics are updated

### Requirement: Reward enemy defeats
The system SHALL award score and gold when enemies are defeated.

#### Scenario: Enemy dies during a wave
- **WHEN** an enemy is defeated
- **THEN** the player's score increases
- **AND** the player's gold increases according to the active economy modifiers

### Requirement: Track player survival
The system SHALL track hero health and run lives during combat.

#### Scenario: Hero takes damage
- **WHEN** the hero is hit by enemy damage and is not protected by an active defensive effect
- **THEN** hero health decreases
- **AND** damage taken is reflected in wave statistics

#### Scenario: Enemy reaches the goal
- **WHEN** an enemy successfully leaks through the route to the goal
- **THEN** run lives decrease
- **AND** leak statistics are updated

### Requirement: Handle player defeat
The system SHALL end or interrupt the run when the hero is defeated or the run can no longer continue.

#### Scenario: Hero is defeated
- **WHEN** hero health reaches zero
- **THEN** the active combat state is interrupted
- **AND** the player is offered the available recovery or final run outcome
