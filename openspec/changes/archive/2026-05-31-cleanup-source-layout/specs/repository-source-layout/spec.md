## ADDED Requirements

### Requirement: Canonical static site source
The repository SHALL store the publishable static game source under `src/`.

#### Scenario: Contributor locates source
- **WHEN** a contributor needs to edit the playable game
- **THEN** the contributor uses files under `src/`
- **AND** the main game implementation is `src/killbox.html`

#### Scenario: Coding agent routes gameplay changes
- **WHEN** an AI coding agent needs to change gameplay behavior, game UI, game styles, or inline runtime code
- **THEN** the agent modifies `src/killbox.html` unless an accepted spec explicitly introduces another `src/` runtime module
- **AND** the agent does not create root-level playable HTML or JavaScript copies

#### Scenario: Contributor locates published assets
- **WHEN** a contributor needs to edit assets loaded by the published game
- **THEN** the contributor uses assets under `src/assets/`

#### Scenario: Coding agent routes asset changes
- **WHEN** an AI coding agent needs to add or replace an asset loaded by the published game
- **THEN** the agent stores that asset under `src/assets/`
- **AND** the agent preserves the existing asset category layout when practical
- **AND** the agent does not create or restore a root-level `assets/` tree

### Requirement: Non-source artifacts remain out of version control
The repository SHALL avoid tracking generated archives, local backup snapshots, duplicate root-level game copies, macOS metadata, and scratch files as source.

#### Scenario: Cleanup removes duplicate game files
- **WHEN** a duplicate game file exists outside `src/`
- **THEN** it is not treated as canonical source
- **AND** it is removed from version control unless another spec explicitly requires it

#### Scenario: Cleanup rejects generated local artifacts
- **WHEN** generated archives, local backup snapshots, `.bak-*` files, `.DS_Store` files, scratch files, or root-level duplicate asset trees are present
- **THEN** they are not treated as source
- **AND** they are removed from version control before the cleanup is considered complete

#### Scenario: Cleanup preserves project control files
- **WHEN** the repository is cleaned
- **THEN** OpenSpec files, GitHub workflow files, documentation, tool configuration, and agent guidance remain available

### Requirement: Project control surfaces stay separate from game source
The repository SHALL keep project control files in their designated non-runtime locations and SHALL NOT use them as substitutes for game source paths.

#### Scenario: Coding agent routes project metadata changes
- **WHEN** an AI coding agent needs to change OpenSpec artifacts, GitHub Actions workflows, repository documentation, or agent tooling
- **THEN** the agent writes those changes under `openspec/`, `.github/workflows/`, `docs/`, `.codex/`, `.claude/`, or `.github/skills/` as appropriate
- **AND** the agent keeps playable game implementation under `src/`
