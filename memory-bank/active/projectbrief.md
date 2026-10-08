# Project Brief

## User Story

As a CLI author using checkbox-search with long choice descriptions, I want the choice list to keep one frame height for the whole prompt so that moving the highlight does not squeeze, grow, or jitter the list.

## Use-Case(s)

### Stable frame with long wrapped descriptions

The caller passes `pageSize: { autoBufferDescriptions: true }`. The list height is chosen from the longest description among the choices, after terminal word wrap. Shorter descriptions leave blank lines at the bottom. The choice list does not reclaim those lines.

### Explicit width-counting opt-out

A caller who sets `autoBufferCountsLineWidth: false` keeps newline-only counting. Padding still applies when `autoBufferDescriptions` is on, using that newline-based reserved height.

## Requirements

1. When `autoBufferDescriptions` is on, count description lines with terminal word wrap unless the caller sets `autoBufferCountsLineWidth: false`.
2. Size the buffer from the longest description across the choices available when the prompt opens. If later items arrive (async `source`) and a description is longer, raise that peak. Do not shrink it.
3. Pad the rendered description block to the reserved line count whenever `autoBufferDescriptions` is on. No separate pad flag.
4. Tests cover long single-line prose at 80 columns.
5. Document the default, and add a README example that uses the `pageSize` object for rich descriptions.
6. Leave the other CLI's `pull.js` wiring and any local `file:` dependency out of this repository.

## Constraints

1. Behavior lives in this library (`src/index.ts` page sizing and the bottom description render). Consumers cannot fix word-wrap undercount or missing padding with configuration alone.
2. Numeric `pageSize` and prompts that do not set `autoBufferDescriptions` keep today's layout.
3. Issue [#188](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/188) (cursor rides the window edge) may proceed in parallel. It does not depend on this work. Both edits touch `src/index.ts`.

## Acceptance Criteria

1. With `autoBufferDescriptions: true`, a long single-line prose description at 80 columns reserves enough wrapped lines that highlighting it does not shrink the choice list.
2. A shorter description under the same prompt leaves blank lines instead of giving rows back to the list.
3. `autoBufferCountsLineWidth: false` still counts newlines only.
4. The reserved height is the max across choices at open, and it only increases if a later item's description needs more lines.
5. README states that width-aware counting defaults to on when `autoBufferDescriptions` is on, and shows the `pageSize` object.

## Release

**This is a breaking change. The implementation commit and the pull request must use `feat!:` and a `BREAKING CHANGE:` footer so release-please cuts a major (2.1.4 → 3.0.0).**

Published callers of `pageSize: { autoBufferDescriptions: true }` change layout:

- Width-aware counting turns on unless they set `autoBufferCountsLineWidth: false`. Today that flag defaults off (`autoBufferCountsLineWidth || false`).
- Line counts use terminal word wrap, which reserves more rows than `ceil(length / columns)`.
- The description block is padded to the reserved height, so short descriptions no longer shrink the frame.

Callers who never set `autoBufferDescriptions` are unaffected. The TypeScript options do not gain a required field. The break is observable layout for an existing opt-in, which on 2.x is a major bump (`CONTRIBUTING.md`).

## Rework

Operator direction on 2026-10-08, from the PR #189 feedback judgment. The original brief above still holds. This section is the delta.

### Fix

1. The reserved height is the wrap of the styled description, `theme.style.description(text)`, using the same wrap the padded block paints. A style that adds visible columns can paint a row the raw peak did not reserve. The default style is ANSI color and adds no width. `examples/custom-theme.js` prefixes `💬 `, and the description tests wrap with `**`.
2. When `autoBufferCountsLineWidth` is false, the painted block does not word-wrap. Counting and painting stay on newline rows. Padding still holds that reserved height.

### Leave

1. Do not cache or skip the wrap that runs again when a selection toggle replaces `allItems`. Measured `wrapAnsi` at width 79: about 2 ms for 50 items, about 8 ms for 200, about 35 ms for 5,000, and the page-size memo runs that path twice. A description signature would skip it on Tab. A signature that drifts from `calculateDescriptionLines` would freeze the frame when descriptions actually change. That risk sits in the code this rework is correcting, and the payoff is not visible at list sizes this prompt is for.
2. The session peak does not shrink. Widening the terminal leaves the reserved block. This is a product decision: do not reclaim rows, and do not move the frame under the user.
3. The duplicated description-region helper in the tests stays as it is.
