# Agent Notes

This repo is a tower defense game published to github pages.

## Repository Memory and Structure

- Store project-specific AI-agent guidance in this repo so all contributors share the same source of truth. Do not keep repo-specific memory only in global user-directory files.
- Treat `openspec/` as augmented memory for detailed requirements, active changes, designs, and task plans. Check relevant `openspec/specs/` and `openspec/changes/` entries before planning or implementing substantial work.
- Put source code and runtime asset changes under `src/`. Do not create parallel root-level source files or duplicate runtime asset trees.
- Put OpenSpec proposals, specs, designs, and task plans under `openspec/`.

## Release Versioning

- This repository uses semantic versioning for releases.
- Every release version should be tagged in git.
- Use annotated tags named `vMAJOR.MINOR.PATCH`, for example `v7.6.0`.

## Dependency Tooling

- This project uses mise for tool dependencies.
- Install mise before working with OpenSpec here; `mise.toml` provides the OpenSpec CLI via `npm:@fission-ai/openspec`.
