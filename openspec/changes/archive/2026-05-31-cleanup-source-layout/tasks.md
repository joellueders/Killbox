## 1. Source Tree Cleanup

- [x] 1.1 Confirm the publish workflow packages `src/` and requires `src/index.html` plus `src/killbox.html`.
- [x] 1.2 Remove root-level duplicate game HTML and JavaScript files that are not part of the Pages artifact.
- [x] 1.3 Remove root-level duplicate asset trees, backup snapshots, generated archives, macOS metadata, and scratch files.
- [x] 1.4 Preserve the canonical publishable game files under `src/`.

## 2. Verification

- [x] 2.1 Verify `src/index.html`, `src/killbox.html`, and referenced `src/assets/` files remain present.
- [x] 2.2 Validate the OpenSpec change.
- [x] 2.3 Review the final git diff for cleanup scope.
- [x] 2.4 Document explicit AI coding-agent path routing rules for future changes.
- [x] 2.5 Verify the final tree does not contain root-level game copies, backup snapshots, duplicate root assets, generated archives, `.DS_Store`, `.bak-*`, or scratch files.
