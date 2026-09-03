# Project Brief

**Task ID:** stryker-v10-upgrade

## Goal

Consolidate and upgrade Stryker Mutator v10 devDependencies, resolving Dependabot PRs #169 and #170 in a single change.

## Requirements

1. In `package.json`, bump:
   - `@stryker-mutator/core`: `^9.6.1` → `^10.0.0`
   - `@stryker-mutator/vitest-runner`: `^9.6.1` → `^10.0.0`
2. Run `npm install` so `package-lock.json` resolves to Stryker 10.
3. Verify `npm run quality:check` passes.
4. Verify `npm test` passes.
5. Verify mutation tooling works under Stryker 10 (`npm run test:mutate:dry` and/or `npm run test:mutate`).
6. Commit with conventional `fix(deps-dev)` prefix naming both packages and `10.0.0`.

## Constraints

- Work only in this worktree; do not modify the parent checkout.
- Do not open a PR; stop at REFLECT COMPLETE (no archive).
- Stryker 10 drops Node.js 20; ensure project engines/CI already require Node 22+.

## Out of Scope

- Opening or merging a PR
- Archiving the memory bank
- Unrelated dependency bumps
