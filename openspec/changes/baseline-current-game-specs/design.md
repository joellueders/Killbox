## Context

The current application is a static browser game centered on `src/killbox.html`, with some arena and grid constants also present in `src/constants.js` and `src/grid.js`. The existing OpenSpec baseline only covers GitHub Pages publishing, so most gameplay behavior has no durable requirements record.

This change documents the current player-facing game contract. It intentionally treats the implementation as evidence, not as the specification itself.

The resulting specs are provisional. Joel, as the original developer, must review and approve them before they are archived into the main spec set.

## Goals / Non-Goals

**Goals:**
- Capture baseline requirements for the current run setup, arena routing, building, waves, combat, progression, economy, and save/recovery behavior.
- Write specs that are stable enough for future gameplay changes to modify.
- Keep requirements testable through player-visible scenarios.
- Avoid encoding incidental implementation details such as object shapes, function names, rendering techniques, console logs, or exact balance formulas.
- Preserve a clear approval gate so inferred requirements do not become authoritative without Joel's review.

**Non-Goals:**
- No runtime code changes.
- No asset, UI redesign, dependency, or deployment changes.
- No balance pass.
- No baseline requirement coverage for hidden developer tools or prototype-only co-op UI that is not exposed to players.
- No guarantee that future specs must keep the current single-file implementation structure.

## Decisions

1. Treat this as baseline documentation, not a feature change.

   The specs use `ADDED Requirements` because the capabilities are new to OpenSpec, even though the behavior already exists in the application.

2. Require original developer approval before archive.

   These specs are inferred from implementation behavior and may miss intent, historical context, or planned direction. They should remain tentative until Joel confirms they match the application's intended requirements.

3. Split requirements by product capability.

   Separate specs are easier to modify later than one broad game spec. The proposed boundaries follow player workflows: setup, arena/building, waves, combat, progression/economy, and recovery/save.

4. Specify behavior, not tuning.

   Requirements capture invariants such as "the loadout must include a weapon" and "a placement must not remove all valid enemy routes." They avoid exact cooldowns, costs, damage values, formulas, or enemy counts unless a value is part of the user-facing contract.

5. Exclude hidden prototype surfaces.

   Manual-code co-op and developer tooling are present in the codebase, but the co-op UI is hidden and development controls are not normal player capabilities. These can become specs later if they are intentionally productized.

## Risks / Trade-offs

- Baseline drift -> If implementation changes before this proposal is applied, the specs may capture slightly stale behavior. Mitigate by verifying against the latest code immediately before archive.
- Inferred intent mismatch -> The specs may describe what the code currently does while missing what Joel intended it to require. Mitigate by requiring Joel's approval before archive.
- Underspecified balance -> Avoiding exact numbers means specs will not catch all balance regressions. Mitigate by adding narrower balance requirements only when tuning becomes intentional product behavior.
- Broad initial surface -> Six capabilities create more artifact volume than one spec. Mitigate by keeping each capability focused and making future changes modify only the affected spec.
