## Why

The `mise.toml` serve task hardcodes port 4173, causing `mise run serve` to fail when another process already holds that port. Additionally, there is no spec documenting the dynamic-port contract that the Playwright smoke tests already implement, leaving the requirement invisible to contributors and agents.

## What Changes

- Replace the hardcoded `4173` in the `mise.toml` serve task with a port-0 / dynamic-port mechanism so the local HTTP preview server binds to whatever port the OS assigns.
- Add a `playwright-install` or `setup` task to `mise.toml` so a fresh `mise run setup` also installs Playwright browser binaries, making `mise install` + `mise run setup` the complete bootstrap sequence.
- Add a new `dev-environment` spec documenting the dynamic-port requirement and the two-step setup contract.

## Capabilities

### New Capabilities

- `dev-environment`: Documents the local development environment contract: tool installation via `mise install`, browser-binary installation via a setup task, and the requirement that local preview servers and Playwright smoke tests select an available loopback port per run rather than requiring a fixed port.

### Modified Capabilities

<!-- No existing spec-level requirements are changing; the smoke tests already implement dynamic ports correctly. -->

## Impact

- `mise.toml`: serve task run command changed; new setup/playwright-install task added.
- `openspec/specs/dev-environment/spec.md`: new file.
- No changes to `src/` runtime code or existing smoke test scripts.
