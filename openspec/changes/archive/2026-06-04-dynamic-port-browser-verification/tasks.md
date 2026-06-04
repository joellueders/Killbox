## 1. Add dynamic-port local serve script

- [x] 1.1 Create `scripts/serve-local.mjs` — a Node.js HTTP server that binds on port `0`, serves files from `src/`, and prints `Serving at http://127.0.0.1:<port>/killbox.html` to stdout on startup

## 2. Update mise.toml

- [x] 2.1 Replace the `[tasks.serve]` run command with `node scripts/serve-local.mjs` (remove the hardcoded `4173` and the `python3 -m http.server` invocation)
- [x] 2.2 Remove the `dir = "src"` line from `[tasks.serve]` (the script resolves its own root)
- [x] 2.3 Add a new `[tasks.playwright-install]` task with `run = "npx playwright install --with-deps"` and a description

## 3. Write the dev-environment spec

- [x] 3.1 Archive the delta spec from `openspec/changes/dynamic-port-browser-verification/specs/dev-environment/spec.md` to `openspec/specs/dev-environment/spec.md` with a `## Purpose` header and the ADDED requirements promoted to top-level requirements (run `/opsx:archive` or follow the archive workflow)

## 4. Verify

- [x] 4.1 Run `mise run serve` and confirm it starts on a non-fixed port and prints the URL
- [x] 4.2 Run `mise run serve` a second time concurrently and confirm both instances start on different ports without error
- [x] 4.3 Run `npm run smoke:killbox` and confirm it passes (relies on dynamic port in script — already implemented)
