## Purpose

Provide a shared directory structure contract so contributors and AI coding agents put source changes, specifications, project-specific guidance, and non-source artifacts in the repository locations that form the shared source of truth.

## Requirements

### Requirement: Source changes live under src
The repository SHALL direct source code and runtime asset changes to `src/`.

#### Scenario: Contributor changes runtime behavior
- **WHEN** a contributor or AI coding agent changes gameplay, UI, styles, runtime JavaScript, or runtime-loaded assets
- **THEN** the change is made under `src/`
- **AND** the guidance does not require targeting a single current source filename

#### Scenario: Contributor creates new runtime files
- **WHEN** a contributor or AI coding agent introduces a new runtime source or asset file
- **THEN** the file is created under `src/`
- **AND** it follows the existing source or asset organization unless an accepted spec defines a new structure

#### Scenario: Contributor avoids parallel runtime trees
- **WHEN** a contributor or AI coding agent changes runtime source or assets
- **THEN** the contributor or agent does not create root-level playable source files
- **AND** the contributor or agent does not create or restore a root-level runtime asset tree

### Requirement: Specifications live under openspec
The repository SHALL direct specifications, proposals, designs, and task plans to `openspec/`.

#### Scenario: Contributor records requirements
- **WHEN** a contributor or AI coding agent records durable requirements, design rationale, or implementation tasks
- **THEN** the contributor or agent uses `openspec/`
- **AND** active change artifacts are placed under `openspec/changes/<change-name>/`
- **AND** accepted long-lived specifications are represented under `openspec/specs/`

### Requirement: Project-specific agent guidance is source controlled
The repository SHALL keep project-specific AI-agent guidance in source control so contributors share the same project memory.

#### Scenario: Contributor records project agent guidance
- **WHEN** a contributor or AI coding agent needs to record project-specific guidance for future AI agents
- **THEN** the guidance is added to a source-controlled project file such as `AGENTS.md`
- **AND** it remains concise enough for first-contact orientation

#### Scenario: Contributor avoids private project memory
- **WHEN** guidance is specific to this repository
- **THEN** the guidance is not stored only in a global user-directory memory file
- **AND** the shared source-controlled project guidance remains the source of truth

#### Scenario: Agent consults augmented memory
- **WHEN** an AI coding agent reads `AGENTS.md` before working
- **THEN** `AGENTS.md` directs the agent to consult `openspec/` as augmented memory for detailed requirements, active changes, designs, and task plans

#### Scenario: Agent avoids duplicating specs in memory
- **WHEN** detailed requirements already belong in OpenSpec
- **THEN** `AGENTS.md` references the relevant OpenSpec location or workflow
- **AND** it does not duplicate full requirement bodies from OpenSpec

### Requirement: Non-source artifacts stay out of source control
The repository SHALL avoid tracking generated archives, local backup snapshots, duplicate root-level runtime copies, macOS metadata, and scratch files as source.

#### Scenario: Contributor encounters duplicate runtime files
- **WHEN** a duplicate runtime file exists outside `src/`
- **THEN** it is not treated as canonical source
- **AND** it is removed from version control unless another spec explicitly requires it

#### Scenario: Contributor encounters generated local artifacts
- **WHEN** generated archives, local backup snapshots, `.bak-*` files, `.DS_Store` files, scratch files, or root-level duplicate asset trees are present
- **THEN** they are not treated as source
- **AND** they are removed from version control before cleanup is considered complete

### Requirement: Project control surfaces stay separate from runtime source
The repository SHALL keep project control files in their designated non-runtime locations and SHALL NOT use them as substitutes for runtime source paths.

#### Scenario: Contributor routes project metadata changes
- **WHEN** a contributor or AI coding agent needs to change OpenSpec artifacts, GitHub Actions workflows, repository documentation, or agent tooling
- **THEN** the contributor or agent writes those changes under `openspec/`, `.github/workflows/`, `docs/`, `.codex/`, `.claude/`, or `.github/skills/` as appropriate
- **AND** runtime source and assets remain under `src/`
