# Task: Update supported Node versions (issue #129)

- Task ID: issue-129-node-versions
- Complexity: Level 2
- Type: simple enhancement (platform / release hygiene)

Raise the minimum supported Node.js version to 22, remove Node 20 from CI and support claims, add Node 26 to the PR matrix, align workflows and demo tooling, and lock the policy in with an automated test.

## Test Plan (TDD)

### Behaviors to Verify

- **Engines contract**: `package.json` declares `engines.node` compatible with a minimum of 22 (expected string `>=22`).
- **Types peer floor**: `package.json` declares optional peer `@types/node` with a floor of `>=22`.
- **Local default**: `.nvmrc` exists and pins major line **22** (trimmed single line).
- **PR CI matrix**: `.github/workflows/pr.yaml` lists `node-version: [22, 24, 26]` and does not list `20` in that matrix; Codecov and `attw` conditional steps target the lowest matrix version (`22`), not 20.
- **Release and demo workflows**: `.github/workflows/release-please.yaml` and `.github/workflows/generate-demos.yaml` use Node **22** (not 20) for `setup-node`.
- **Vitest transpile target**: `vitest.config.ts` `esbuild.target` is at least `node22` so test transpilation matches supported runtime.

### Test Infrastructure

- Framework: Vitest (existing).
- Test location: `src/__tests__/*.test.ts` per `vitest.config.ts`.
- Conventions: behavior-oriented filename; use `node:fs` / `node:path` / `node:url` to read repo-root files relative to the test module.
- New test files: `src/__tests__/node-support-policy.test.ts`

## Implementation Plan

1. **Policy tests (TDD — tests first, expect RED)**

   - Files: `src/__tests__/node-support-policy.test.ts`
   - Changes: Implement tests that read `package.json`, `.nvmrc`, `.github/workflows/pr.yaml`, `.github/workflows/release-please.yaml`, `.github/workflows/generate-demos.yaml`, and `vitest.config.ts` from the repository root and assert the behaviors above. Run `npx vitest run src/__tests__/node-support-policy.test.ts` and confirm failures until steps 2–8 are done.

2. **`package.json` engines and types alignment**

   - Files: `package.json`, `package-lock.json` (via `npm install` after editing)
   - Changes: Set `engines.node` to `>=22`. Set `peerDependencies["@types/node"]` to `>=22`. Bump `devDependencies["@types/node"]` to `^22.0.0` (or current compatible caret). Run `npm install` to refresh the lockfile.

3. **PR workflow matrix and conditionals**

   - Files: `.github/workflows/pr.yaml`
   - Changes: Matrix `node-version: [22, 24, 26]`. Change Codecov and `attw` `if:` checks from `matrix.node-version == 20` to `== 22`.

4. **Release and publish workflow Node version**

   - Files: `.github/workflows/release-please.yaml`
   - Changes: Both `setup-node` steps: `node-version: '22'` (replacing `'20'`).

5. **Demo generation workflow Node version**

   - Files: `.github/workflows/generate-demos.yaml`
   - Changes: `setup-node` `node-version: '22'`.

6. **`.nvmrc`**

   - Files: `.nvmrc` (new)
   - Changes: Single line `22` (major pin per issue; matches local default).

7. **Demo Docker image**

   - Files: `demos/Dockerfile`
   - Changes: Replace NodeSource setup script from `setup_20.x` to `setup_22.x`.

8. **Vitest esbuild target**

   - Files: `vitest.config.ts`
   - Changes: Set `esbuild.target` to `'node22'`.

9. **User-facing and memory-bank docs**

   - Files: `README.md`, `CONTRIBUTING.md`, `memory-bank/productContext.md`, `memory-bank/techContext.md`
   - Changes: Replace stale Node 18+/20+ wording with Node 22+ where it describes runtime requirements; point to `engines` / `.nvmrc` where appropriate per `techContext` indirection rules.

10. **Verify**

    - Run `npx vitest run src/__tests__/node-support-policy.test.ts` (green), then `npm test` (full suite + quality).

## Technology Validation

No new technology - validation not required.

## Dependencies

- GitHub Actions `actions/setup-node` availability for Node 26 on `ubuntu-latest` (expected for this repo’s CI timeframe).

## Challenges & Mitigations

- **Node 26 not yet on runner images**: If CI fails to resolve Node 26, confirm `setup-node` supports it or temporarily document blocker; mitigation is to verify with a CI dry run and adjust matrix only if the runner cannot provision 26.
- **Lockfile noise**: Run a single `npm install` after `package.json` edits to keep `package-lock.json` consistent.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [ ] Preflight
- [ ] Build
- [ ] QA

## Implementation checklist (Build)

- [ ] Step 1 — policy tests added and failing
- [ ] Step 2 — package.json + lockfile
- [ ] Step 3 — pr.yaml
- [ ] Step 4 — release-please.yaml
- [ ] Step 5 — generate-demos.yaml
- [ ] Step 6 — .nvmrc
- [ ] Step 7 — demos/Dockerfile
- [ ] Step 8 — vitest.config.ts
- [ ] Step 9 — README, CONTRIBUTING, memory-bank
- [ ] Step 10 — full verification
