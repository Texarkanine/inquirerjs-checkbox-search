# Task: Fix SLOBAC audit findings (test smells)

* Task ID: slobac-fix-2026-05-13
* Complexity: Level 2
* Type: Test quality improvement (renames, assertion strengthening, deduplication)

Fix 8 test smells across 4 test files as identified in `slobac/audit.md`.

**Key constraint discovered during planning:** `yoctocolors-cjs` checks `hasColors` at module-load
time via TTY detection; the test environment has `NO_COLOR` set, so ANSI escape-code assertions
are not viable. The cyan-styling test must be fixed via rename + position-based strengthening, not
ANSI inspection.


## Test Plan (TDD)

### Behaviors to Verify

**Finding 1+2 (`descriptions.test.ts` — `naming-lies` + `vacuous-assertion`)**

- Default description rendering: render with one item that has a description → description text
  appears on a line AFTER the last choice line (position check, not just existence check)
- This replaces the vacuous `toBeTruthy()` and the lying name about "cyan/blue styling"

**Finding 3+4 (`navigation.test.ts` — `naming-lies` + `vacuous-assertion`)**

- Loop wrap down: starting at First, pressing up → `❯ ◯ Third` is on screen, `❯ ◯ First` is NOT
- Loop wrap up: starting at Third (after the above), pressing down → `❯ ◯ First` is on screen,
  `❯ ◯ Third` is NOT

**Findings 5, 6, 7 — pure renames (no new behavior to test)**

- `search-filtering.test.ts` j-key: rename to `should add "j" to search term instead of
  triggering down navigation`
- `search-filtering.test.ts` k-key: rename to `should add "k" to search term instead of
  triggering up navigation`
- `selection.test.ts` tab-spaces: rename to `should keep search term clean after tab
  selection (no tab-to-spaces corruption)`

**Finding 8 (`semantic-redundancy` — `navigation.test.ts` + `separators.test.ts`)**

- Migration: string choices + default `Separator()` (no label) skip separator on navigation,
  selections return correct values → add to `navigation.test.ts`
- After migration: `separators.test.ts` must be deleted

### Test Infrastructure

- Framework: Vitest (configured in `vitest.config.ts`)
- Test location: `src/__tests__/`
- Conventions: one `describe` block per file keyed to a behavior slice; `it()` names state
  observable behavior; `render()` from `@inquirer/testing`; `events.keypress / events.type`
  to drive the prompt
- New test files: none (all changes to existing files; `separators.test.ts` is deleted)


## Implementation Plan

1. **Rename three deliverable-fossil tests** (no TDD cycle — pure identifier changes)
   - Files: `src/__tests__/search-filtering.test.ts`, `src/__tests__/selection.test.ts`
   - Changes:
     - `should handle "j" key input properly for search (vim navigation bug fix)`
       → `should add "j" to search term instead of triggering down navigation`
     - `should handle "k" key input properly for search (vim navigation bug fix)`
       → `should add "k" to search term instead of triggering up navigation`
     - `should detect readline tab-to-spaces conversion bug`
       → `should keep search term clean after tab selection (no tab-to-spaces corruption)`
   - Run: `npx vitest run -t "should add"` and `npx vitest run -t "should keep search term
     clean"` — all must pass

2. **Strengthen navigation loop test** (finding 3+4)
   - File: `src/__tests__/navigation.test.ts`
   - Changes: replace `expect(screen).toContain('❯')` with:
     - Initial state: `expect(screen).toContain('❯ ◯ First')`
     - After `up` from First: `expect(screen).toContain('❯ ◯ Third')` +
       `expect(screen).not.toContain('❯ ◯ First')`
     - After `down` from Third: `expect(screen).toContain('❯ ◯ First')` +
       `expect(screen).not.toContain('❯ ◯ Third')`
     - Remove the intermediate 3-down sequence (it obscures intent; replaced by a single down)
   - Run: `npx vitest run -t "should loop navigation when enabled"` — must pass

3. **Fix descriptions cyan test** (finding 1+2)
   - File: `src/__tests__/descriptions.test.ts`
   - Changes:
     - Rename: `should use cyan/blue styling for descriptions at bottom`
       → `should render description text at the bottom by default`
     - Replace weak body: add explicit line-index position assertion (description line index >
       last choice line index), remove the vacuous `toBeTruthy()` call
   - Run: `npx vitest run -t "should render description text at the bottom by default"` —
     must pass

4. **Handle semantic redundancy** (finding 8)
   - Files: `src/__tests__/navigation.test.ts`, `src/__tests__/separators.test.ts`
   - Changes:
     a. In `navigation.test.ts`, add new test at end of describe block:
        `should skip default separator and submit correct values with plain string choices`
        — exercises `['Item 1', new Separator(), 'Item 2', 'Item 3']` with tab-select
        and enter, asserting `answer.resolves.toEqual(['Item 1', 'Item 2'])`
     b. Delete `separators.test.ts`
   - Run: `npx vitest run -t "should skip default separator"` — must pass; then confirm
     full suite for navigation

5. **Full test suite pass**
   - Run: `npm test`
   - All tests must pass; no regressions

6. **Quality gate**
   - Run: `npm run quality`
   - All linting and formatting must pass

7. **Commit**
   - Conventional commit: `test: fix SLOBAC audit findings (renames, assertion strengthening,
     deduplication)`


## Technology Validation

No new technology — validation not required.


## Dependencies

- No production code changes required
- All changes are isolated to `src/__tests__/`


## Challenges & Mitigations

- **ANSI code testing not viable:** `yoctocolors-cjs` disables colors in non-TTY / `NO_COLOR`
  environments. Cyan styling cannot be tested via ANSI escape codes. Mitigation: rename the
  test to its honest behavior (bottom-placement) and strengthen with a position assertion.
- **Loop navigation strengthening might overlap with `should work with loop navigation and
  separators`:** The separator-loop test already has the exact assertions I want to add to
  the plain-loop test. They test different scenarios (with vs without separators) so the
  overlap is intentional and acceptable.
- **separators.test.ts deletion:** Only test in the file. Unique aspect (string choices +
  default separator) is migrated first before deletion to preserve coverage.


## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [ ] Preflight
- [ ] Build
- [ ] QA
