# System Patterns

## How This System Works

This package exports a **single Inquirer.js prompt** built on top of `@inquirer/core`'s `createPrompt` hook-based API. Almost all of the prompt's behavior - rendering, key handling, state, async sourcing, filtering, theming, pagination - lives in one file: `src/index.ts` (~900 lines). When modifying behavior, expect to touch that file; the surface area is concentrated, not distributed.

The mental model that matters most:

- **Two orthogonal axes of state coexist**: the _filter term_ (what the user is typing) and the _selection set_ (what the user has checked). The single most load-bearing invariant of this prompt is that **changing the filter must never drop selections**. Selection state is keyed by choice value/identity, not by visible-row index, so filtering only affects what is _rendered_ - not what is _selected_. Any change that touches filtering, source refresh, or choice-list rebuilding must preserve this invariant. The `selection.test.ts` and `search-filtering.test.ts` suites guard it.
- **Choices come from one of two mutually exclusive inputs**: `choices` (static) or `source` (async). The async path uses an `AbortSignal` so in-flight requests are cancelled when the user keeps typing. Treat them as two code paths sharing the same downstream state, not as a single unified pipeline.
- **The prompt is built from `@inquirer/core` hooks** (`useState`, `useKeypress`, `useEffect`, `useMemo`, `usePagination`, `usePrefix`, `useRef`). It is not a class. State updates trigger re-render via the hook system; do not introduce module-level mutable state.
- **Pagination has its own auto-sizing logic** layered on top of `@inquirer/core`'s `usePagination`. Page size can be a number, an object (`PageSizeConfig`), or auto-derived from terminal height. The auto-sizing is non-trivial and has dedicated tests (`page-sizing.test.ts`, `pagesize-config.test.ts`); changing it without reading those tests first will break things.
- **Compatibility with `@inquirer/checkbox` is enforced, not incidental.** `compatibility.test.ts` pins the option shape and behavior of the overlapping API surface to the upstream prompt; any intentional divergence on shared options requires updating that test and is a semver-relevant decision.

## Single-file prompt module

The entire prompt implementation lives in `src/index.ts`. Helpers, types, key-handling, rendering, theming defaults, and the `createPrompt` call are colocated rather than split into submodules. This is deliberate for a small, focused library; do not split it up speculatively. New behavior should be added in-place; only extract a helper file if a piece of logic is genuinely reusable or grows large enough to obscure the main flow.

## Behavior-sliced test suites

Tests in `src/__tests__/` are organized by _user-visible behavior_ (`navigation`, `selection`, `search-filtering`, `validation`, `disabled-choices`, `separators`, `theme-customization`, `page-sizing`, `async-behavior`, `descriptions`, `object-references`, `edge-cases`, `compatibility`, `basic-functionality`, `pagesize-config`), not by code unit. When adding a feature, find the suite whose theme matches and add to it; create a new suite only if the behavior genuinely doesn't fit. Tests use `@inquirer/testing` to drive the prompt as a user would.

## Selection identity preserved across filtering

Selections are tracked by stable choice identity (value/object reference), not by index in the currently-rendered list. This is the architectural reason filtering and selection compose correctly. Any refactor of the choices/filter pipeline must preserve this; see `search-filtering.test.ts` ("should maintain selections across filtering") and `object-references.test.ts`.

## Search term updates via `updateSearchTerm`, not `rl.line` alone

Escape and backspace clear/edit the filter through `updateSearchTerm` (React state + readline rewrite). Syncing only from `rl.line` on keypress is insufficient under `@inquirer/testing`, whose `keypress('backspace')` emits a key event without mutating the readline line. Prefer code-point-aware edits (`Array.from(searchTerm)`) so a backspace never splits a surrogate pair. This is code-point deletion, not grapheme-cluster deletion — the same semantics Node readline applies to `rl.line` — so ZWJ sequences, flag pairs, skin-tone modifiers, and combining marks still take more than one press. Whether to diverge from readline here is open in [#148](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/148).

## Dual ESM/CJS publication via tshy

`tshy` builds both `dist/esm` and `dist/commonjs` from the single TypeScript source. The `exports` map in `package.json` is generated/managed by `tshy` config. Test files are excluded from the build via `tshy.exclude`. Package correctness is validated by `@arethetypeswrong/cli` (`npm run attw`) in `prepublishOnly`. Avoid TypeScript or runtime constructs that don't round-trip cleanly through both outputs.

## Release automation via Conventional Commits

Releases are driven by `release-please` (`release-please-config.json`, `.release-please-manifest.json`) reading Conventional Commit messages on `main`. `feat:` → minor, `fix:` → patch, `feat!:`/`BREAKING CHANGE:` → major. `chore:` is intentionally release-invisible and should be avoided in favor of scoped `feat`/`fix`. This means **commit message type is a release-control mechanism**, not just documentation.
