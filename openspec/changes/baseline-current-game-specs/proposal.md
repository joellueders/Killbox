## Why

The game has substantial player-facing behavior that exists only in code, making future changes harder to evaluate against stable requirements. This change captures the current application as baseline OpenSpec capabilities so future gameplay work can be proposed, reviewed, and verified against explicit product requirements.

Because these requirements are inferred from the current implementation, they are tentative until Joel, the original developer, reviews and approves them.

## What Changes

- Add baseline specs for the current run setup, loadout, arena, placement, wave, combat, progression, economy, save, and recovery behavior.
- Document observable application requirements without locking incidental implementation details or exact balance constants.
- Exclude hidden developer tooling and prototype-only surfaces from baseline requirements unless they are exposed to players.
- Require Joel's review and approval before these inferred specs are archived or treated as authoritative baseline requirements.
- Leave the existing GitHub Pages publishing capability unchanged.

## Capabilities

### New Capabilities
- `run-setup-and-loadout`: Covers selecting an arena, assembling an ordered loadout, validating start requirements, and mapping loadout slots to in-run controls.
- `arena-routing-and-build-placement`: Covers arena layouts, path validity, valid defense placement, road blocking prevention, and placement cost handling.
- `wave-lifecycle-and-scaling`: Covers build/combat phases, wave previews, wave start gating, enemy wave composition, wave completion, and between-wave transitions.
- `combat-and-defenses`: Covers hero combat, defense roles, enemy archetypes, damage attribution, rewards from kills, player health, lives, and defeat handling.
- `between-wave-progression-and-economy`: Covers between-wave upgrade choices, one-wave modifiers, rerolls, shop purchases, gold rewards, and economy progression.
- `run-recovery-and-password-save`: Covers wave restart snapshots, limited restart recovery, password generation, password validation, and run restoration.

### Modified Capabilities
- None.

## Impact

- Affects OpenSpec artifacts under `openspec/changes/baseline-current-game-specs/`.
- Establishes baseline requirements corresponding to the current static canvas game in `src/killbox.html`, `src/constants.js`, and `src/grid.js`.
- The proposed baseline remains provisional until Joel approves that it accurately reflects the intended application requirements.
- Does not change runtime code, assets, deployment workflows, dependencies, or public URLs.
