# Task: Update supported Node versions (issue #129)

- Task ID: issue-129-node-versions
- Complexity: Level 2
- Type: simple enhancement (platform / release hygiene)

Raise the minimum supported Node.js version to 22, remove Node 20 from CI and support claims, add Node 26 to the PR matrix, align workflows and demo tooling, and update docs.

## Test Plan (TDD)

No new unit tests required. This task contains **zero production-code changes** — all changes are to configuration files (package.json, workflow YAML, Docker, vitest config) and documentation. There is no behavior to exercise in a test suite.

The existing test suite serves as a regression guard: after all config changes are applied, `npm test` must pass clean (no failures, no lint errors).

## Implementation Plan

1. **`package.json` engines and types alignment**

   - Files: `package.json`
   - Changes: Set `engines.node` to `>=22`. Set `peerDependencies["@types/node"]` to `>=22`. Bump `devDependencies["@types/node"]` to `^22.0.0`.

2. **Lockfile refresh**

   - Files: `package-lock.json`
   - Changes: Run `npm install` after step 1 to regenerate lockfile with updated `@types/node`.

3. **PR workflow matrix and conditionals**

   - Files: `.github/workflows/pr.yaml`
   - Changes: Matrix `node-version: [22, 24, 26]`. Change Codecov and `attw` `if:` guards from `matrix.node-version == 20` to `== 22`.

4. **Release and publish workflow Node version**

   - Files: `.github/workflows/release-please.yaml`
   - Changes: Both `setup-node` steps: `node-version: '22'` (was `'20'`).

5. **Demo generation workflow Node version**

   - Files: `.github/workflows/generate-demos.yaml`
   - Changes: `setup-node` `node-version: '22'` (was `'20'`).

6. **`.nvmrc`**

   - Files: `.nvmrc` (create new)
   - Changes: Single line `22`.

7. **Demo Docker image**

   - Files: `demos/Dockerfile`
   - Changes: `setup_20.x` → `setup_22.x` in the NodeSource install script.

8. **Vitest esbuild target**

   - Files: `vitest.config.ts`
   - Changes: `esbuild.target: 'node22'` (was `'node18'`).

9. **User-facing and memory-bank docs**

   - Files: `README.md`, `CONTRIBUTING.md`, `memory-bank/productContext.md`, `memory-bank/techContext.md`
   - Changes: Replace stale Node 18+/20+ wording with Node 22+.

10. **Verify**

    - Run `npm test` (full suite + quality gate). Must pass with no errors.

## Technology Validation

No new technology — validation not required.

## Dependencies

- GitHub Actions `actions/setup-node` v6 supports Node 26 on `ubuntu-latest`.

## Challenges & Mitigations

- **Lockfile noise**: Run a single `npm install` after `package.json` edits (step 2); no other changes affect the lockfile.

## Status

- [x] Initialization complete
- [x] Test planning complete (no tests needed — no code changes)
- [x] Implementation plan complete
- [x] Technology validation complete
- [ ] Preflight
- [ ] Build
- [ ] QA

## Implementation checklist (Build)

- [ ] Step 1 — package.json
- [ ] Step 2 — lockfile
- [ ] Step 3 — pr.yaml
- [ ] Step 4 — release-please.yaml
- [ ] Step 5 — generate-demos.yaml
- [ ] Step 6 — .nvmrc
- [ ] Step 7 — demos/Dockerfile
- [ ] Step 8 — vitest.config.ts
- [ ] Step 9 — README, CONTRIBUTING, memory-bank
- [ ] Step 10 — full verification
