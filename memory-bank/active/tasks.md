# Task: Stryker v10 upgrade

* Task ID: stryker-v10-upgrade
* Complexity: Level 2
* Type: simple enhancement (devDependency consolidation / major bump)

Consolidate Dependabot PRs #169 and #170 by bumping `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` from `^9.6.1` to `^10.0.0`, refreshing the lockfile, and verifying quality, Vitest, and Stryker mutation tooling under v10.

## Test Plan (TDD)

### Behaviors to Verify

- Declared deps: `package.json` lists both packages at `^10.0.0` → lockfile resolves `@stryker-mutator/core@10.x` and `@stryker-mutator/vitest-runner@10.x`
- Quality gate: `npm run quality:check` → exit 0
- Unit suite: `npm test` → exit 0
- Mutation dry-run: `npm run test:mutate:dry` → exit 0 under Stryker 10 (harness starts, runs dry-run, no crash)
- Optional full mutate: `npm run test:mutate` → exit 0 and score ≥ `thresholds.break` (80), if dry-run is clean and time allows
- Node engines: project `engines.node` remains `>=22` (satisfies Stryker 10 Node floor)

### Edge Cases

- Config compatibility: existing `stryker.config.json` options remain valid under v10 schema (no deprecated keys that become hard errors)
- Lockfile drift: only the two Stryker packages (and their transitive Stryker graph) change; unrelated deps stay put unless npm must bump for peer resolution

### Test Infrastructure

- Framework: Vitest (product tests) + Stryker CLI (mutation harness) + npm quality scripts
- Test location: existing `src/**/*.test.ts` / project scripts — no new Vitest files
- Conventions: verify via `npm run quality:check`, `npm test`, `npm run test:mutate:dry` / `test:mutate` per CONTRIBUTING
- New test files: none (change-detector tests on package.json versions are out of scope; operational verification is the contract)

## Implementation Plan

1. Bump declared versions in `package.json`
   - Files: `package.json`
   - Changes: `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` → `^10.0.0`
2. Refresh lockfile
   - Files: `package-lock.json`, `node_modules/`
   - Changes: `npm install` in this worktree
3. Verify quality
   - Command: `npm run quality:check`
4. Verify unit tests
   - Command: `npm test`
5. Verify Stryker 10 harness
   - Commands: `npm run test:mutate:dry`; if clean, `npm run test:mutate` (or document dry-run-only if full mutate is prohibitively long and dry-run proves the upgrade)
6. Docs touch only if required
   - Files: `memory-bank/techContext.md` / CONTRIBUTING only if version-specific claims become false
   - Default: no prose change if docs already say "StrykerJS" without pinning 9.x
7. Commit product change
   - Message prefix: `fix(deps-dev): bump @stryker-mutator/core and @stryker-mutator/vitest-runner to 10.0.0`

## Technology Validation

No new technology — major version bump of existing Stryker packages already in the repo. Validation = install + dry-run. Confirmed: `engines.node` is `>=22`; local Node is v26.7.0; Stryker 10 only breaking change is dropping Node 20.

## Dependencies

- `@stryker-mutator/core@^10.0.0`
- `@stryker-mutator/vitest-runner@^10.0.0`
- Existing `stryker.config.json` (no planned edits unless schema rejects current options)

## Challenges & Mitigations

- Full `test:mutate` may take 10–30+ minutes: prefer dry-run first for harness health; run full mutate if dry-run passes and time permits; CI Mutation job will gate PRs later
- Unexpected schema/config warnings or errors under v10: fix `stryker.config.json` minimally; do not redesign mutation strategy
- Lockfile pulls unrelated bumps: review `npm install` diff; keep scope to Stryker graph if possible

## Pre-Mortem

- Plan fails because mutate dry-run crashes on vitest-runner options: already covered by Challenge (minimal config fix); add a step to compare against Stryker 10 release notes if needed
- Plan fails because we only bump package.json and skip lockfile install: Step 2 explicitly runs `npm install`
- Plan fails because Node 20 CI matrix exists: already checked — engines `>=22`; if workflow still uses 20, that would be a blocking discovery in preflight/build (unlikely given engines)

## Preflight Findings

- **PASS** — Plan matches deps-only scope; CI Node matrix is 22/24/26 (satisfies Stryker 10).
- **TDD encoding**: No new product executable units; operational verification after install is correct (change-detector version asserts rejected).
- **Advisory**: Prefer full `npm run test:mutate` after dry-run when feasible so local gate matches CI Mutation job.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [ ] Build
- [ ] QA
