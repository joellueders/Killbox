## ADDED Requirements

### Requirement: Present a run setup flow
The system SHALL present a setup flow before a new run begins so the player can choose an arena and assemble a loadout.

#### Scenario: Player opens the game
- **WHEN** the application loads before a run has started
- **THEN** the player is shown controls for choosing an arena and selecting loadout items

### Requirement: Require a playable loadout
The system SHALL require the selected loadout to contain at least one weapon before a run can start.

#### Scenario: Loadout has no weapon
- **WHEN** the player attempts to start a run with no selected weapon
- **THEN** the run does not start
- **AND** the player receives feedback that a weapon is required

#### Scenario: Loadout has a weapon
- **WHEN** the player attempts to start a run with at least one selected weapon
- **THEN** the run is allowed to start

### Requirement: Limit active loadout size
The system SHALL limit the active run loadout to eight ordered slots.

#### Scenario: Player adds items to loadout
- **WHEN** the player selects loadout items
- **THEN** the system records the selected items in slot order up to eight slots

#### Scenario: Player attempts to exceed loadout capacity
- **WHEN** the player attempts to add another item after all eight slots are filled
- **THEN** the item is not added
- **AND** the player receives capacity feedback

### Requirement: Support loadout ordering
The system SHALL allow the player to inspect and reorder selected loadout items before starting a run.

#### Scenario: Player reorders selected items
- **WHEN** the player moves a selected loadout item to a different valid slot
- **THEN** the system updates the loadout order
- **AND** the preview reflects the new order

### Requirement: Apply setup choices when the run starts
The system SHALL apply the selected arena, primary weapon, loadout, and passive trinket effects when the player starts a run.

#### Scenario: Player starts a valid run
- **WHEN** the player starts a run from setup with valid selections
- **THEN** the setup overlay closes
- **AND** the selected arena is loaded
- **AND** the hero uses the first selected weapon as the active weapon
- **AND** selected passive trinket effects are applied

### Requirement: Map loadout slots to in-run controls
The system SHALL map ordered loadout slots to in-run hotbar controls.

#### Scenario: Player presses a loadout slot key during a run
- **WHEN** the player activates a numbered slot that contains a weapon, buildable, or trinket
- **THEN** a weapon is equipped, a buildable is selected, or a trinket is used according to the item type
