# Project Brief: Inquirer Ecosystem v12 Upgrade

## User Story

As a maintainer, I need `@inquirer/core` and related packages bumped to the Dependabot-requested versions (PRs #167, #168, #171) so the library builds and type-checks against the current Inquirer ecosystem, without leaving consumers on stale major lines.

## Requirements

1. Bump in `package.json`:
   - `@inquirer/core`: `^11.1.2` → `^12.0.1`
   - `@inquirer/type`: `^4.0.2` → `^4.1.0`
   - `@inquirer/figures`: `^2.0.2` → `^2.0.8`
   - `@inquirer/testing`: `^3.0.2` → `^3.3.11`
   - Dev deps (PR #168): `@typescript-eslint/eslint-plugin` / `parser` → `^8.68.0`; `@vitest/coverage-v8` / `@vitest/ui` / `vitest` → `^4.1.11`; `eslint` → `^10.9.1`
2. Run `npm install` so `package-lock.json` reflects the bumps.
3. Adapt `src/index.ts` for type incompatibilities:
   - `renderItem` / `usePagination` layout callback typing (`Prettify<Value>` / layout shape including `index`)
   - `useState` setters for `Value | null` where core now expects `NotFunction<Value> | Reducer | null`
4. TDD for any behavior changes; type-only adaptations may be verified by typecheck/build if no runtime behavior changes.
5. Verify: `npm run build`, `npm run quality:check`, `npm test`, `npm run test:mutate`.
6. Conventional commit prefix: `fix(deps): bump @inquirer/core to 12.0.1 and update inquirer ecosystem`.

## Out of Scope

- Opening a PR (parent orchestrator / operator handles that)
- Archive phase
- Unrelated dependency bumps beyond the listed PRs
