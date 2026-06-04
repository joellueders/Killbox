## ADDED Requirements

### Requirement: Tool installation via mise
The repository SHALL declare all developer tooling in `mise.toml` so that `mise install` installs every non-browser dependency required to run the game locally or execute tests.

#### Scenario: Fresh checkout tool setup
- **WHEN** a contributor runs `mise install` on a fresh clone
- **THEN** all tools declared in `mise.toml` are installed
- **AND** no additional manual tool-installation steps are required before `mise run serve` or `mise run playwright-install`

### Requirement: Playwright browser installation task
The repository SHALL provide a `mise run playwright-install` task that installs the Playwright browser binaries required by the smoke tests.

#### Scenario: Contributor sets up browser binaries
- **WHEN** a contributor runs `mise run playwright-install`
- **THEN** the Playwright browser binaries needed by `tests/playwright/` are downloaded and ready
- **AND** subsequent `npm run smoke:killbox` and `npm run smoke:multiplayer` runs succeed without a missing-browser error

### Requirement: Dynamic loopback port for local preview server
The local preview server launched by `mise run serve` SHALL bind to an OS-assigned loopback port rather than a fixed port number, so it succeeds even when common ports are already occupied.

#### Scenario: Serve starts while default port is occupied
- **WHEN** a contributor runs `mise run serve` and port `4173` (or any other fixed port) is already in use
- **THEN** the serve task binds on a different available port assigned by the OS
- **AND** the task prints the resulting URL to stdout so the contributor knows where to open the game

#### Scenario: Serve URL is always discoverable
- **WHEN** `mise run serve` starts successfully
- **THEN** a line containing the full loopback URL (e.g. `http://127.0.0.1:<port>/killbox.html`) is written to standard output

### Requirement: Dynamic loopback port for Playwright smoke tests
Local Playwright verification SHALL select and reuse an available loopback port per run rather than requiring a fixed preview port, so smoke tests pass even when another server already occupies a common port.

#### Scenario: Smoke test runs while default port is occupied
- **WHEN** `npm run smoke:killbox` is invoked and the port that would otherwise be used is already bound
- **THEN** the smoke test selects a different available port
- **AND** the test completes without a port-conflict error

#### Scenario: Smoke test reports its URL
- **WHEN** a smoke test run completes (pass or fail)
- **THEN** the URL that was tested is included in the test output
