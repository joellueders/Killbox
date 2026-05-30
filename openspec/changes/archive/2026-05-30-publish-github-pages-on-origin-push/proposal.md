## Why

Publishing the game should be automatic whenever work reaches `origin`, so other people can immediately play the latest version and give feedback. This removes a manual deployment step and makes pushed changes visible quickly and consistently.

## What Changes

- Add an automated GitHub Pages publishing flow that runs for commits pushed to `origin`.
- Package the repository's static game files before deployment.
- Publish the prepared static output to GitHub Pages when packaging succeeds.
- Keep publishing failures visible in GitHub checks so broken deploys block quietly drifting documentation or demos.

## Capabilities

### New Capabilities

- `github-pages-publishing`: Defines the automatic publication behavior for GitHub Pages on pushes to `origin`.

### Modified Capabilities

- None.

## Impact

- Adds or updates GitHub Actions workflow configuration under `.github/workflows/`.
- Requires GitHub Pages deployment permissions and repository Pages settings compatible with Actions-based publishing.
- Uses the existing static files under `src/` without adding a new build system.
