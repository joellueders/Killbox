## ADDED Requirements

### Requirement: Award wave-clear economy
The system SHALL award between-wave gold after a wave is cleared.

#### Scenario: Wave is cleared
- **WHEN** the player clears a wave
- **THEN** the player receives wave-clear gold
- **AND** the player can receive reserve interest when eligible
- **AND** the rewards are reflected in the wave summary

### Requirement: Present between-wave progression choices
The system SHALL present progression choices after a cleared wave before the next wave can begin.

#### Scenario: Between-wave choice appears
- **WHEN** a wave is cleared
- **THEN** the system presents available progression options
- **AND** the next wave remains blocked until the player resolves the required choice

### Requirement: Offer eligible permanent upgrades
The system SHALL offer permanent upgrades that are eligible for the player's current loadout and previously selected upgrades.

#### Scenario: Upgrade options are generated
- **WHEN** the between-wave progression screen is shown
- **THEN** the player can receive weapon and defense upgrade options that correspond to eligible loadout items

### Requirement: Offer one-wave modifiers
The system SHALL offer a temporary modifier that affects the next wave only.

#### Scenario: Player selects a one-wave modifier
- **WHEN** the player chooses a temporary wave modifier
- **THEN** the modifier is queued for the next wave
- **AND** the modifier is cleared after that wave ends

### Requirement: Support reward rerolls
The system SHALL allow the player to reroll between-wave reward choices by spending gold when rerolls are affordable.

#### Scenario: Player rerolls rewards
- **WHEN** the player chooses to reroll and has enough gold for the current reroll cost
- **THEN** gold is spent
- **AND** a new set of reward choices is generated
- **AND** the next reroll cost increases or remains at the maximum configured cost

#### Scenario: Player cannot afford reroll
- **WHEN** the player does not have enough gold for the current reroll cost
- **THEN** rerolling is unavailable or rejected

### Requirement: Provide a between-wave shop
The system SHALL provide optional between-wave shop purchases for immediate recovery, economy, or next-wave bonuses.

#### Scenario: Player buys an affordable shop item
- **WHEN** the player purchases an available shop item with sufficient gold
- **THEN** the item effect is applied immediately or queued for the next wave according to the item
- **AND** the player's gold and shop state are updated

#### Scenario: Player attempts unavailable shop purchase
- **WHEN** a shop item is unaffordable, already at its purchase limit, or otherwise unavailable
- **THEN** the purchase is not applied

### Requirement: Apply temporary shop bonuses at wave start
The system SHALL apply queued next-wave shop bonuses when the next combat wave begins.

#### Scenario: Wave starts with queued shop bonuses
- **WHEN** the player starts a wave after buying next-wave shop effects
- **THEN** those effects are applied for that wave
- **AND** one-wave purchase flags are reset according to their limits
