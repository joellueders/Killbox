## Context

The project currently stores the browser-playable app and assets under `src/`, with no checked-in package manifest or build script. GitHub Pages can publish static files directly through the official Actions Pages flow, which fits the current repository shape and keeps deployment independent from local machine state.

This change should make pushed commits publish automatically from GitHub Actions. Because GitHub Pages has one active deployment per repository, pushes from different branches can replace one another when the workflow is configured for all push events.

## Goals / Non-Goals

**Goals:**

- Publish GitHub Pages automatically for each successful push event to the origin repository.
- Use GitHub Actions' Pages deployment path rather than requiring a manual deploy command.
- Package the static site from the repository in a reproducible way on the Actions runner.
- Make deployment status visible as a GitHub check for the pushed commit.

**Non-Goals:**

- Add a JavaScript bundler, package manifest, or new build system.
- Change game behavior or asset organization beyond what is needed for Pages publication.
- Manage custom domains, DNS, or repository settings outside versioned workflow files.

## Decisions

- Use a GitHub Actions workflow triggered by `push`.
  Rationale: the requested behavior is tied to commits pushed to `origin`, and a push-triggered workflow is the native GitHub mechanism for that event. Alternative considered: deploying only from the default branch, which avoids branch races but does not satisfy every pushed commit.

- Deploy with `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages`.
  Rationale: the official Pages actions handle artifact shape, permissions, and deployment environment consistently. Alternative considered: force-pushing to a `gh-pages` branch, which adds branch state and token handling complexity.

- Treat `src/` as the publishable static site source unless implementation discovers an existing generated output directory.
  Rationale: the repository has static HTML, JavaScript, and assets in `src/` with no build metadata. Alternative considered: adding a build command, which would create new tooling without a current need.

- Add workflow concurrency for the Pages deployment group.
  Rationale: multiple pushes can happen close together; concurrency prevents older in-flight deployments from winning after a newer commit has started. Alternative considered: allowing all runs to finish independently, which risks stale Pages output.

## Risks / Trade-offs

- Any-branch push can publish over the current Pages site -> The workflow should document this behavior clearly and use concurrency so the newest successful run wins.
- Repository Pages settings might not be configured for GitHub Actions -> The workflow can be versioned, but repository settings may still need to be enabled once.
- Static root entry point may not match GitHub Pages defaults -> Implementation should ensure the deployed artifact has a usable root entry point for the app.
