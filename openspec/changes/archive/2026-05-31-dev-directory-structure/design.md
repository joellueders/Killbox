## Context

This repository is a static game project with runtime files under `src/`, OpenSpec files under `openspec/`, and root-level `AGENTS.md` as the first file AI coding agents are likely to read. Recent cleanup work showed that agents need directory-level guidance instead of guidance tied to one current implementation filename.

## Goals / Non-Goals

**Goals:**
- Establish a durable directory structure contract for contributors and AI coding agents.
- Direct source code and runtime asset changes to `src/`.
- Direct specifications, proposals, designs, and task plans to `openspec/`.
- Direct project-specific AI-agent guidance into the repository under source control instead of only global user-directory memory files.
- Make `AGENTS.md` reference OpenSpec as augmented memory for detailed requirements and active changes.
- Avoid over-fitting guidance to the current game entry file name.

**Non-Goals:**
- No gameplay, publishing, or build-system changes.
- No requirement that all future source code live in one HTML file.
- No duplication of full OpenSpec requirements inside `AGENTS.md`.
- No replacement of OpenSpec with agent notes.

## Decisions

- Define `src/` as the source-change boundary.
  Rationale: the published game and runtime assets are under `src/`; future implementation may split files within `src/`, so the contract should name the directory, not a single file. Alternative considered: naming the current game HTML file as the primary target, which becomes stale if the implementation is reorganized.

- Define `openspec/` as the specification and change-planning boundary.
  Rationale: OpenSpec already stores accepted specs and active changes. Alternative considered: putting specs in root docs, which fragments the requirements record.

- Keep project-specific agent guidance in source control.
  Rationale: repository-specific memories need to be shared by all contributors and agents, not stranded in one user's global memory files. `AGENTS.md` should hold high-signal project guidance and point to OpenSpec for detailed requirements. Alternative considered: storing project guidance only in user-directory memory, which creates divergent private context between contributors.

- Treat OpenSpec as augmented memory referenced from `AGENTS.md`.
  Rationale: OpenSpec can hold more detailed, versioned requirements than root guidance should. `AGENTS.md` should tell agents to consult `openspec/specs/` and relevant `openspec/changes/` before planning or editing.

## Risks / Trade-offs

- Project guidance could become too broad -> Keep `AGENTS.md` as orientation and routing guidance, with detailed requirements staying in OpenSpec.
- Agents may still over-fit to the current HTML entry file -> Use `src/` language consistently and mention current files only as examples when necessary.
- Multiple active OpenSpec changes may overlap -> Agents should inspect relevant active changes before creating new specs or implementation work.
