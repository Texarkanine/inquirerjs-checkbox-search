# Project Brief

## User Story

As a maintainer and consumer of this library, I want supported Node.js versions aligned with current LTS and release lines so that we do not claim support for EOL runtimes and we validate the package on upcoming Node releases.

## Use-Case(s)

### Use-Case 1

Developers on Node 22+ install and run the package with a clear `engines` contract.

### Use-Case 2

CI and release automation exercise the library on Node 22, 24, and 26 so regressions surface before publish.

## Requirements

1. Drop Node.js 20 from supported/test matrices (Node 20 is EOL per [issue #129](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/129)).
2. Set minimum supported Node to **22** (`.nvmrc`, `package.json` `engines`, related metadata).
3. Add **Node 26** to the PR test matrix and ensure release/publish paths are consistent with supported versions.
4. Update developer-facing docs (README, CONTRIBUTING, memory bank) where they state the old floor.

## Constraints

1. Follow project TDD and quality gates (`npm test`, `npm run quality:check`).
2. Prefer conventional commits; removing Node 20 support is semver-breaking (`feat!:` or `BREAKING CHANGE:`).

## Acceptance Criteria

1. `engines.node` and optional `@types/node` peer floor reflect `>=22`.
2. CI matrix includes 22, 24, and 26 and no longer includes 20; conditional steps (Codecov, `attw`) run on the lowest supported matrix version.
3. `.nvmrc` exists and pins the documented local default (22).
4. Demo Docker image and any workflow `setup-node` versions use a supported baseline (22+), not 20.
5. Automated tests encode the policy so future drift fails the suite.
