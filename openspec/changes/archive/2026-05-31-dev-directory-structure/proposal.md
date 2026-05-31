## Why

Future work needs a stable directory contract so coding agents and contributors know where to put source changes, specifications, and project-specific agent guidance. Without that contract, stale copies, ad hoc notes, misplaced specs, and private global memories can compete with the project source of truth.

## What Changes

- Document `src/` as the location for source code and runtime asset changes.
- Document `openspec/` as the location for specifications, change proposals, designs, and task plans.
- Document that project-specific AI-agent guidance belongs in the repository, under source control, rather than only in global user-directory memory files.
- Require `AGENTS.md` to reference OpenSpec as augmented memory for detailed project requirements and active changes.
- Avoid tying the directory contract to any single current source filename.

## Capabilities

### New Capabilities
- `development-directory-structure`: Defines where contributors and AI coding agents place source changes, OpenSpec artifacts, and source-controlled project agent guidance.

### Modified Capabilities

## Impact

- Affected files: `AGENTS.md`, `openspec/`, and source files under `src/`.
- Affected workflows: future AI coding-agent orientation, OpenSpec change creation, source-code edits, and project-specific memory updates.
- Runtime behavior should not change.
