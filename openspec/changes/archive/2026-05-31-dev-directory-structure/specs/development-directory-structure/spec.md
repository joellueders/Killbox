## ADDED Requirements

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
