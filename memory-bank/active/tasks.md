# Task: Stable description frame

* Task ID: stable-description-frame
* Complexity: Level 2
* Type: simple enhancement

When `autoBufferDescriptions` is on, count description lines with terminal word wrap (unless `autoBufferCountsLineWidth` is `false`), reserve the session max across choices, and pad the bottom description so the choice list does not grow or squeeze as the highlight moves.

The implementation commit and the pull request use `feat!:` and a `BREAKING CHANGE:` footer. See `memory-bank/active/projectbrief.md` (Release).

## Test Plan (TDD)

### Behaviors to Verify

- [Word wrap beats character ceil]: three 50-character words joined by spaces, `stdout.columns` 80, `calculateDescriptionLines(items, true)` → 3. `Math.ceil(text.length / 80)` for that string is 2.
- [Width fallback]: `stdout.columns` unavailable, same fixture, `calculateDescriptionLines(items, true)` → 3 (width treated as 80, then minus 1).
- [Explicit newline counting]: `calculateDescriptionLines(items, false)` on that fixture → 1.
- [Default width counting]: `resolvePageSize({ base: 20, autoBufferDescriptions: true }, items)` with that fixture and `autoBufferCountsLineWidth` omitted → 17.
- [Opt out of width counting]: the same config plus `autoBufferCountsLineWidth: false` → 19.
- [Floor raises the buffer]: current items need 1 description line, `descriptionLineFloor` 3, `autoBufferDescriptions` on, `base` 20 → 17.
- [Current items beat a lower floor]: current items need 3 lines, floor 1 → buffer uses 3.
- [Floor ignored when auto-buffer is off]: `descriptionLineFloor` 5, no `autoBufferDescriptions`, `base` 20 → 20.
- [Short description stays padded]: prompt with `autoBufferDescriptions: true`, columns 80, one choice whose description is the three-word fixture and one whose description is `Short`. Navigate from the long choice to the short one → the description region has the same line count, and the short screen contains a blank line in that region.
- [Missing description stays padded]: with `autoBufferDescriptions: true`, moving from a choice with the long description onto a choice with no description keeps the same description-region line count.
- [No pad without the flag]: a prompt that does not set `autoBufferDescriptions` still renders one description line and no trailing blank line for a short description (existing description tests).
- [Async peak does not shrink]: `source` first returns the long fixture, then a later call returns only `Short` → the description region does not lose lines.

- [Existing newline max]: descriptions of 1, 2, and 3 newline-separated lines, width counting off → 3 (already in `pagesize-config.test.ts`).
- [Empty and separators]: no descriptions, empty string, separators → existing expectations in `pagesize-config.test.ts`.
- [min, max, buffer, minBuffer]: existing `resolvePageSize` cases stay as they are. Their description strings do not wrap.

### Test Infrastructure

- Framework: Vitest, prompts driven by `@inquirer/testing` `render`
- Test location: `src/__tests__/`
- Conventions: `describe` / `it` by user-visible behavior; page-size math lives in `pagesize-config.test.ts`; rendered description layout lives in `descriptions.test.ts`; async `source` lives in `async-behavior.test.ts`
- New test files: none

## Implementation Plan

### 1. Word-wrap line counting — executable

- Files: `src/__tests__/pagesize-config.test.ts`, `src/index.ts` (`calculateDescriptionLines`), `package.json` / lockfile (`fast-wrap-ansi`)

1. Stub tests: add empty `it` cases for the three-word fixture (width on, width off, columns unavailable). Leave the existing ceil-based width tests in place until step 3 replaces their expected counts.
2. Stub interface: no new export. `calculateDescriptionLines` already exists.
3. Write tests and run red: assert 3 / 1 / 3 for the fixture. Update the existing "terminal width wrapping" and "fallback to width 80" cases to the word-wrap count at width `(columns || 80) - 1`. Run `npx vitest run -t "calculateDescriptionLines"`. New assertions fail.
4. Write code and run green: depend on `fast-wrap-ansi` directly. When `countLineWidth` is true, split on `\n`, wrap each line with `wrapAnsi(line, width, { trim: false, wordWrap: true })`, and sum the wrapped lines. `width` is `(process.stdout.columns || 80) - 1`. Run the same vitest filter, then `npx vitest run src/__tests__/pagesize-config.test.ts`.

### 2. Width-counting default and description-line floor — executable

- Files: `src/__tests__/pagesize-config.test.ts`, `src/index.ts` (`resolvePageSize`)

1. Stub tests: empty `it` cases for omitted flag, explicit `false`, floor above the current items, floor below the current items, and floor while auto-buffer is off.
2. Stub interface: add an optional third parameter `descriptionLineFloor = 0` to `resolvePageSize`. Do not use it yet.
3. Write tests and run red: assertions listed above. Run `npx vitest run -t "autoBufferDescriptions"`.
4. Write code and run green: when `autoBufferDescriptions` is true, pass `pageSize.autoBufferCountsLineWidth !== false` into `calculateDescriptionLines`. Description lines used for the buffer are `Math.max(calculated, descriptionLineFloor)`. Run `npx vitest run src/__tests__/pagesize-config.test.ts`.

### 3. Session peak and padded description — executable

- Files: `src/__tests__/descriptions.test.ts`, `src/__tests__/async-behavior.test.ts`, `src/index.ts` (page-size memo and the `descriptionLine` render)

1. Stub tests: empty `it` cases for stable line count on a shorter description, stable line count on a missing description, and an async `source` whose second result is shorter.
2. Stub interface: none. Peak state and padding land in the green step.
3. Write tests and run red: render through `@inquirer/testing` with `pageSize: { autoBufferDescriptions: true }` and `stdout.columns` pinned to 80. Count lines in the description region (after the last choice line). Run `npx vitest run -t "description region"`.
4. Write code and run green: `useRef` holds the peak description-line count and only increases. Compute it from `allItems` (not `filteredItems`) with the same width-counting flag `resolvePageSize` uses. Pass the peak as `descriptionLineFloor`. When `autoBufferDescriptions` is on, wrap `theme.style.description(activeDescription ?? '')` with the same `wrapAnsi` settings, then append blank lines until that block is `peak` lines. A missing description still emits the blank block. Run `npx vitest run src/__tests__/descriptions.test.ts src/__tests__/async-behavior.test.ts src/__tests__/pagesize-config.test.ts`.

### 4. README — prose/policy

- Files: `README.md`
- No tests: prose/policy artifact

1. State that `autoBufferCountsLineWidth` defaults to true when `autoBufferDescriptions` is true, and that `false` keeps newline counting.
2. Add a `pageSize: { autoBufferDescriptions: true }` example for prompts whose choices have long descriptions.
3. Say the description block is padded to the longest description, so shorter ones leave blank lines.

## Technology Validation

`fast-wrap-ansi` 0.2.2 installs and runs under Node in this environment. A temp package imported `wrapAnsi` and wrapped three 50-character words at width 79 with `{ trim: false, wordWrap: true }`: 3 lines. `Math.ceil(text.length / 80)` for that string is 2. `@inquirer/core` 12.0.3 already uses this package inside `breakLines` (`wordWrap: false`). It does not export `breakLines`, so this package takes a direct dependency. No other new technology.

## Dependencies

- `fast-wrap-ansi` (direct dependency, added in step 1)
- `@inquirer/core` `ScreenManager.render` runs `breakLines` on the whole prompt string before paint
- `@inquirer/testing` `render` / `getScreen` for the prompt-level cases

## Challenges & Mitigations

- Screen hard-wraps with `wordWrap: false` at `cli-width`, which can disagree with a word-wrap count and reflow lines we already wrapped. Wrap at `(columns || 80) - 1` and insert those newlines into the description before return, so each emitted line is narrower than the screen width `breakLines` uses.
- Existing width-counting tests expect `ceil(length / columns)`. Step 1 replaces those expectations with the word-wrap count. Do not keep a ceil special case to make them pass.
- `theme.style.description` adds ANSI color. Wrap the styled string. `wrapAnsi` ignores invisible codes, so the color does not add a line.
- A peak taken from `filteredItems`, or recomputed only from the current `source` result, shrinks the frame when the user searches or the source returns a shorter list. Hold the peak on `allItems` in a ref and only increase it.
- Issue #188 can edit `src/index.ts` at the same time. This work stays in `calculateDescriptionLines`, `resolvePageSize`, the page-size memo, and the bottom description string.

## Pre-Mortem

- Counting with `wordWrap: false` to match `breakLines` would bring back the one-line-short squeeze on terminals that word-wrap. The plan keeps `wordWrap: true`, which is the behavior in `.scratch/scroll-btter.md`.
- Shipping the smaller page size without padding the description would still let the bottom block grow. Step 3 is required before the task is done.
- Treating the layout change as a patch would ship a breaking 2.x change as 2.1.x. The implementation commit stays `feat!:` with a `BREAKING CHANGE:` footer, as written in the project brief.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [x] Build
- [ ] QA
