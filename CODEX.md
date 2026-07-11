# Repository Agent Guide

## Scope

Maintain Slime Quest as a fast, dependency-light browser game. Preserve keyboard and touch parity, accessibility, and static-host compatibility.

## Required checks

Run `npm run check` for every behavior change. Add or update tests for pure logic in `src/logic.js` and persistence behavior in `src/storage.js`.

## Design rules

- Keep game simulation and collision logic separate from DOM rendering.
- Do not add client-side Secrets or tracking.
- Keep production deployable from the repository root without a build step.
- Update README and architecture docs when runtime components or delivery flow change.
