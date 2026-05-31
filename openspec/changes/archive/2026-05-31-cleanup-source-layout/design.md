## Context

The game is published by GitHub Actions from the `src/` directory. The current repository also contains root-level copies of the game, duplicate root-level assets, backup HTML snapshots, generated zip archives, macOS metadata, and scratch files. Those files are not used by the publish workflow and compete with `src/killbox.html` as an apparent source of truth.

## Goals / Non-Goals

**Goals:**
- Make `src/` the only publishable static site source directory.
- Make `src/killbox.html` the main game file for gameplay changes.
- Keep `src/index.html`, `src/.nojekyll`, and `src/assets/` as the Pages-ready static site wrapper and assets.
- Give future AI coding agents concrete path routing rules before they edit or create files.
- Remove non-source duplicates and generated clutter from version control.
- Record the source-layout decision in OpenSpec so future cleanup and publishing work has a clear contract.

**Non-Goals:**
- No gameplay, balance, art, or UI changes.
- No deployment workflow redesign beyond documenting and preserving the current `src/` artifact path.
- No migration to a build system or package manager.
- No deletion of OpenSpec, GitHub Actions, docs, tool config, or agent guidance files.

## Agent Path Routing

Future AI coding agents should treat this section as the repository map before making changes:

- Put playable game behavior, UI, styles, and inline runtime code in `src/killbox.html` unless a later accepted spec introduces a new `src/` module.
- Put shared constants or helper modules only in existing `src/*.js` files when the code is already imported or referenced from `src/killbox.html`.
- Put runtime-loadable images, SVGs, audio, and other static game assets under `src/assets/`, preserving the existing category layout when possible.
- Keep `src/index.html` limited to entry/redirect behavior for GitHub Pages unless a publishing spec changes the entry-point contract.
- Keep `src/.nojekyll` as publishing metadata.
- Put OpenSpec change artifacts only under `openspec/changes/<change-name>/`; put accepted long-lived specs under `openspec/specs/` through the OpenSpec archive/sync flow.
- Put GitHub Actions workflow changes under `.github/workflows/`.
- Put repository documentation under `docs/`.
- Put local agent instructions or skill definitions under `.codex/`, `.claude/`, or `.github/skills/` only when the task is explicitly about agent tooling.
- Do not create root-level playable HTML files, root-level JavaScript copies, a root-level `assets/` tree, `backups/`, `*.bak-*`, zip archives, `.DS_Store`, scratch files such as `1`, or other generated/local artifacts.

## Decisions

- Treat `src/` as canonical source and publication input.
  Rationale: `.github/workflows/pages.yml` already validates `src/index.html` and `src/killbox.html`, then uploads `src` as the Pages artifact. Alternative considered: publishing from the repository root, which would expose backups and duplicate files and weaken the source-of-truth boundary.

- Treat `src/killbox.html` as the main game implementation.
  Rationale: the latest gameplay commits modify that file and Pages requires it. Alternative considered: retaining root-level HTML copies as parallel entry points, which makes accidental edits likely.

- Remove duplicate root assets instead of keeping two asset trees.
  Rationale: `src/assets/` is the asset tree available to the published site. The root `assets/` directory is larger and not referenced by the Pages artifact. Alternative considered: syncing both trees, which adds maintenance work without changing published behavior.

- Remove backup snapshots, `.bak-*` files, archives, `.DS_Store`, and scratch files from version control.
  Rationale: these are historical or generated artifacts, not source. Git history and future tags are the release record. Alternative considered: moving backups into docs or archive folders, which still keeps stale playable code in the repository.

- Preserve tooling and documentation directories while keeping them separate from game source.
  Rationale: `.codex/`, `.claude/`, `.github/`, `openspec/`, and `docs/` help agents, workflows, and contributors operate the project, but they are not runtime game code. Alternative considered: placing guidance in ad hoc root files, which makes routing less clear.

## Risks / Trade-offs

- Removing a file that someone used as a personal reference -> Mitigation: the files remain recoverable from git history, and the OpenSpec change documents which files are source going forward.
- A root-level file was being loaded outside GitHub Pages -> Mitigation: the published workflow uses `src/`; validate that `src/index.html` and `src/killbox.html` remain present and that the source assets referenced by `src/killbox.html` exist.
- Future accidental generated files may return -> Mitigation: retain `.gitignore` coverage for `.DS_Store` and `.bak-*`; require cleanup review to check for forbidden root-level artifacts before merging.
