## Purpose

Provide automatic GitHub Pages publishing so the latest pushed version of the game is immediately playable for feedback.

## Requirements

### Requirement: Publish on pushed commits
The system SHALL start a GitHub Pages publication workflow for each commit pushed to the origin repository.

#### Scenario: Commit is pushed to origin
- **WHEN** a commit is pushed to the origin repository
- **THEN** a GitHub Actions workflow starts for that pushed commit
- **AND** the workflow attempts to publish the project to GitHub Pages

### Requirement: Deploy only successful site artifacts
The system SHALL publish to GitHub Pages only after preparing a valid static site artifact from the repository.

#### Scenario: Static site artifact is prepared
- **WHEN** the publication workflow runs for a pushed commit
- **THEN** it packages the repository's static site files into a GitHub Pages artifact
- **AND** it deploys that artifact only if preparation succeeds

#### Scenario: Static site artifact preparation fails
- **WHEN** the publication workflow cannot prepare a valid static site artifact
- **THEN** the workflow fails
- **AND** GitHub Pages is not updated by that failed workflow run

### Requirement: Report publication status
The system SHALL expose GitHub Pages publication success or failure as checks on the pushed commit.

#### Scenario: Publication succeeds
- **WHEN** the GitHub Pages deployment completes successfully
- **THEN** the pushed commit shows a passing deployment workflow check

#### Scenario: Publication fails
- **WHEN** the GitHub Pages deployment fails
- **THEN** the pushed commit shows a failing deployment workflow check

### Requirement: Prefer the newest deployment
The system SHALL prevent older in-progress publication runs from overwriting a newer pushed commit's GitHub Pages deployment.

#### Scenario: Multiple pushes happen close together
- **WHEN** a newer pushed commit starts a publication workflow while an older publication workflow is still running
- **THEN** the older in-progress publication workflow is canceled or prevented from publishing after the newer workflow
