## Context

The repo has two Playwright smoke tests (`tests/playwright/killbox-smoke.mjs` and `multiplayer-smoke.mjs`) that already use OS-assigned ports (`listen(0)` / a `net.createServer` probe). However, the `mise.toml` serve task (`mise run serve`) still hardcodes port `4173`, so it fails silently when that port is occupied. There is also no automated step to install Playwright browser binaries, so a fresh checkout requires an undocumented manual command.

## Goals / Non-Goals

**Goals:**
- Replace the hardcoded `4173` in the serve task with a script that binds on port `0` (OS-assigned) and prints the resulting URL so contributors know where to connect.
- Add a `playwright-install` task to `mise.toml` so `mise run playwright-install` fetches browser binaries and the full bootstrap is `mise install && mise run playwright-install`.
- Add `openspec/specs/dev-environment/spec.md` documenting these two contracts.

**Non-Goals:**
- Changing the smoke test scripts (they already use dynamic ports correctly).
- Changing production or CI serving logic outside `mise.toml`.
- Adding port discovery to the Vite dev server (it already handles that).

## Decisions

### Decision: Use a small Node.js helper script for the serve task

**Rationale:** Python's `http.server` does support `--bind` and port `0`, but it prints an inconsistent log line format across Python versions, making it unreliable to extract the assigned port. A one-file Node.js script (`scripts/serve-local.mjs`) can bind on port `0`, log a clean `Serving at http://127.0.0.1:<port>/killbox.html` line, and use the same `http` module pattern already in `killbox-smoke.mjs`.

**Alternatives considered:**
- `python3 -m http.server 0`: Works but port discovery from stdout is fragile across versions.
- Keeping port `4173` but documenting the conflict risk: Does not solve the problem.

### Decision: `mise run playwright-install` as a separate explicit task

**Rationale:** Playwright browser downloads are large (~200 MB per browser). Bundling them into `mise install` would surprise users who only need the game server. Making it an explicit `mise run playwright-install` task matches the Playwright project's own recommendation (`npx playwright install --with-deps`) and keeps `mise install` fast.

## Risks / Trade-offs

- **Dynamic port breaks stable bookmarks** → Mitigation: The serve task always prints the URL at startup; contributors bookmark nothing and read stdout.
- **Script adds a new file (`scripts/serve-local.mjs`)** → This is intentional; it gives a clear, inspectable entry point rather than an inline shell one-liner.

## Migration Plan

1. Add `scripts/serve-local.mjs` with dynamic-port HTTP server.
2. Update `[tasks.serve]` in `mise.toml` to call the new script.
3. Add `[tasks.playwright-install]` to `mise.toml`.
4. Write `openspec/specs/dev-environment/spec.md`.
5. No rollback needed — the old Python command can be restored in one line if required.
