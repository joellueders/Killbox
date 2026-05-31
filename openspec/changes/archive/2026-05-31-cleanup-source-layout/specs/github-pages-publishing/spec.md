## MODIFIED Requirements

### Requirement: Deploy only successful site artifacts
The system SHALL publish to GitHub Pages only after preparing a valid static site artifact from the repository's `src/` directory.

#### Scenario: Static site artifact is prepared
- **WHEN** the publication workflow runs for a pushed commit
- **THEN** it packages the repository's `src/` static site files into a GitHub Pages artifact
- **AND** it deploys that artifact only if preparation succeeds

#### Scenario: Static site artifact preparation fails
- **WHEN** the publication workflow cannot prepare a valid static site artifact from `src/`
- **THEN** the workflow fails
- **AND** GitHub Pages is not updated by that failed workflow run
