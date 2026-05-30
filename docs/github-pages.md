# GitHub Pages Publishing

This repository publishes the playable game to GitHub Pages from GitHub Actions on every push.

Repository settings must allow GitHub Pages deployment from GitHub Actions:

1. Open Settings > Pages.
2. Set Source to GitHub Actions.

The workflow publishes the static site from `src/`, with `src/index.html` forwarding visitors to `src/killbox.html`.
