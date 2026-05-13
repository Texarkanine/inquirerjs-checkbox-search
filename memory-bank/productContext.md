# Product Context

## Target Audience

Node.js CLI developers building interactive command-line tools with [Inquirer.js](https://github.com/SBoudrias/Inquirer.js). The library targets authors of developer tools, scaffolding utilities, deployment scripts, and any CLI that needs the user to pick multiple items from a list that is too long to scroll comfortably.

## Use Cases

- **Multi-select from large static lists**: choosing several items (frameworks, files, environments, tags) from lists where simple arrow-key navigation through `@inquirer/checkbox` becomes tedious.
- **Multi-select from dynamic/async sources**: filtering and selecting from results returned by an async `source` function (e.g., a remote API), combining `@inquirer/search`-style filtering with checkbox multi-select.
- **Constrained selection workflows**: prompts that require at least one selection, validate the chosen set, or pre-select defaults.
- **Themed/embedded prompts**: prompts that participate in a host CLI's visual theme via the standard Inquirer theme system.

## Key Benefits

- Combines `@inquirer/checkbox` (multi-select) and `@inquirer/search` (filter-as-you-type) capabilities, which the upstream Inquirer.js suite does not offer together in a single prompt.
- Selections are preserved across filter changes - typing to narrow results never silently drops items the user already checked.
- Auto-sizing page height adapts to terminal height, with fine-grained `PageSizeConfig` control for advanced layouts.
- Option shape overlaps with `@inquirer/checkbox` for the features the two prompts share (see `compatibility.test.ts`), reducing friction for projects already using the upstream prompt.

## Success Criteria

- Behaviorally compatible with `@inquirer/checkbox` for the subset of options it shares (verified by `compatibility.test.ts`).
- Correct interaction model: filtering, selection persistence, navigation looping, validation, disabled choices, separators, and async sources all behave as documented in the README.
- Published as a dual ESM/CJS package with correct types (validated via `attw`) so it works in both module systems and TypeScript projects.
- Test suite (Vitest, using `@inquirer/testing`) covers the documented behaviors and passes in CI before any release.

## Key Constraints

- **Inquirer.js peer ecosystem**: built on `@inquirer/core` primitives; behavior must remain consistent with Inquirer.js conventions (key bindings, theme contract, prompt lifecycle).
- **Node.js >= 20** (`engines` in `package.json`).
- **Dual-module distribution**: source is TypeScript ESM; ships both ESM and CJS builds via `tshy`. Code must avoid constructs that break either output.
- **Public API stability**: published to npm under semver; breaking changes require `feat!:` / `BREAKING CHANGE:` and a major bump. Releases are automated via release-please from Conventional Commits.
- **Terminal-only UI**: no DOM, no images; all output must render correctly in a TTY across reasonable terminal widths/heights.
