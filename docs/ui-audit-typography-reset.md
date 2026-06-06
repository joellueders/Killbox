# UI Audit: Typography-First Reset

## Scope

This audit covers the major Killbox UI surfaces in `src/killbox.html` before the typography-first production UI pass.

## Informational

- Gameplay HUD: lives, gold, wave, wave archetype, combo, speed label, objective, mission hint, countdowns, wave banners, combo banners.
- War Room status rows: mission state, room state, Core state, objective details, selected item description.
- Loadout title, version, selected-item inspector text, loadout stats, helper copy.
- Between-wave summary, clear countdown, modal subtitles.

Findings:

- These elements were frequently presented inside bronze panels, framed boxes, or heavy gradient containers even when they were not clickable.
- HUD information competed visually with the game field because each datum looked like a control.
- Objective and status text did not have a clear priority over decorative framing.

## Interactive

- Build hotbar cards and hotkeys.
- Loadout picker tiles, loadout category tabs, selected loadout rail slots.
- Mission choices, arena/expedition selects, start/play buttons.
- War Room buttons, debug controls, guide modal tabs, guide close button.
- Between-wave reward cards, Quartermaster shop items, clear/continue/restart buttons.

Findings:

- These elements need visible boundaries because they are clickable or draggable.
- Most interactive containers were retained, but their surrounding decorative parent panels were reduced where possible.

## Decorative

- Stat chip backgrounds and borders.
- HUD wrapper borders, separators, and panel-like countdown rows.
- Loadout masthead frame, version plate, catalog/inspector wrapper chrome, loadout rail title bar.
- War Room panel background, sticky header slab, details-section boxes.
- Wave/combo banner frames and heavy gradient backgrounds.
- Informational selected-item cards in the War Room and loadout inspector.

Findings:

- The decorative layer was the main cause of the "wall of bronze panels" effect.
- Removing or reducing these containers did not remove functionality.

## Retained Containers

- Build hotbar cards: interactive build selection.
- Loadout picker tiles: interactive selection.
- Loadout rail slots: draggable/clickable loadout state.
- Mission choice cards: interactive mission selection.
- Buttons, selects, guide tabs, reward cards, and shop items: interactive controls.
- Modal cards: blocking decision surfaces that need a bounded reading area.

## Remaining Heavy Elements To Revisit

- Between-wave reward cards still have a strong stylized treatment.
- Quartermaster chest/shop remains visually heavy.
- Guide modal still uses a framed layout because it is a secondary reference surface.
- Build cards remain chunky to preserve touch targets and combat clarity.
