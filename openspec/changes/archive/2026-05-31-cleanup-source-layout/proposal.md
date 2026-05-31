## Why

The repository currently contains both the publishable game under `src/` and many root-level copies, backups, zip archives, and generated clutter. This makes it unclear which files are source of truth and increases the risk of editing or publishing stale game code.

## What Changes

- Define `src/` as the canonical static site source directory for every playable game change.
- Define `src/killbox.html` as the main playable game file, with `src/index.html` as the GitHub Pages landing redirect.
- Define `src/assets/` as the only checked-in asset tree used by the published game.
- Define root-level files and directories as project control surfaces only, not game implementation locations.
- Remove root-level duplicate game files, backup snapshots, generated archives, macOS metadata, and stray scratch files from version control.
- Preserve OpenSpec, GitHub Actions, docs, tool config, and agent guidance files.

## Capabilities

### New Capabilities
- `repository-source-layout`: Describes where publishable source code and assets live, and which repository files are intentionally non-source.

### Modified Capabilities
- `github-pages-publishing`: Clarifies that Pages packages the static site from `src/`.

## Impact

- Affected source tree: `src/`, root-level duplicate files, `assets/`, `backups/`, generated archives, and scratch files.
- Future coding-agent behavior: gameplay HTML/CSS/JS changes go in `src/killbox.html`; shared game constants/helpers go in existing files under `src/`; game assets go in `src/assets/`; root-level duplicates and backup files must not be created.
- Affected documentation/specs: OpenSpec records for source layout and GitHub Pages publishing.
- Runtime behavior should not change; GitHub Pages already uploads `src/`.
