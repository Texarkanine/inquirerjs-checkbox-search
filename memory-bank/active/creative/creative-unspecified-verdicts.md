# UI/UX Decision: Unspecified Demo Verdicts

## User & Context

Reviewers read the demo comment on a pull request. Their task is to see which demos this pull request actually changed, and to ignore the rest. The comment already uses collapsed `<details>` for an unchanged demo and open `<details>` for CHANGED and NEW.

The operator's bar: a demo that has not meaningfully changed stays collapsed and is indicated as the same. SAME, CHANGED, and NEW are specified in issue #190 section 4. REMOVED, UNSTABLE, and NOISY are detector verdicts with no specified block.

## Design System

`memory-bank/techContext.md` has no Design System section. This repository has no Figma, Storybook, or token files. The authority for this comment is the existing demo comment: one `<details>` block per demo, an emoji and a verdict word in the summary, and the GIF inside the block.

## Options Evaluated

- **Call them SAME**: UNSTABLE, NOISY, and a missing REMOVED tape use the collapsed SAME block. The summary lies whenever the detector could not prove a match, and a removed tape disappears from the list.
- **Open every non-SAME verdict**: CHANGED, NEW, REMOVED, UNSTABLE, and NOISY are expanded. A timing miss opens a demo the way the old byte diff opened every demo.
- **Open only a real set change**: SAME, NOISY, and UNSTABLE stay collapsed, each with its own verdict word. CHANGED, NEW, and REMOVED stay open. REMOVED shows the before GIF, because there is no after.

## Analysis

| Criterion | Call them SAME | Open every non-SAME | Open only a real set change |
|-----------|----------------|---------------------|----------------------------|
| Usability | The open list stays short. A removed tape is easy to miss. | The open list fills up again when a runner is noisy. | The open list is tapes added, changed, or removed. |
| Clarity | SAME stops meaning same. | Open stops meaning a proven change. | The summary word is the verdict. Collapsed does not imply SAME. |
| Accessibility | Text label is missing, so the state is only an emoji and a collapsed box. | The label is visible without opening. | The verdict word is in the summary, which is available without opening the block. |
| Consistency | Matches today's collapsed box, not the operator's "indicated as the same." | Matches today's open CHANGED block and applies it too widely. | SAME, CHANGED, and NEW stay as specified. The new labels use the same summary pattern. |
| Feasibility | No extra upload. | Needs a head GIF for verdicts that have one. REMOVED has only a before GIF. | REMOVED needs the base recording's GIF uploaded. The other two use the head GIF already uploaded. |
| Simplicity | Fewest labels. | One rule, and it recreates the problem this work exists to end. | One rule: open when the tape set or the proven picture changed. |

Key insights:

- The operator's sentence has two parts. Collapsed is not enough. The summary has to say SAME, or a stable dependency bump still looks like an unlabeled preview.
- NOISY and UNSTABLE are not SAME, and they are not a change in the prompt. Opening them trains reviewers to ignore the open state.
- REMOVED is a change in what the project demos. Leaving it out of the comment hides a deleted tape.

## Decision

**Selected**: Open only a real set change
**Rationale**: Reviewers can trust the open list, and a collapsed summary still names the verdict, so SAME is a claim rather than the absence of a label.
**Tradeoff**: A NOISY or UNSTABLE demo does not pop open. The summary word is the notice. A removed demo needs its before GIF uploaded, which the head recording does not produce.

## Implementation Notes

- SAME is collapsed. Summary: `📷 demos/<name>.gif (SAME)`. The body is the head GIF already uploaded today.
- NOISY and UNSTABLE use that same collapsed shape, with `(NOISY)` or `(UNSTABLE)` in place of `(SAME)`. The body is the head GIF.
- CHANGED stays open. Summary: `🔥 demos/<name>.gif (CHANGED)`. Body: the stacked before/after GIF, then a collapsed text diff when the text fingerprints differ. When only the frames differ, the summary adds `styling only` and the text-diff block is omitted.
- NEW stays open. Summary: `✨ demos/<name>.gif (NEW)`. Body: the after GIF only.
- REMOVED is open. Summary: `🗑️ demos/<name>.gif (REMOVED)`. Body: the before GIF only.
- The banner stays the current warning when any demo is CHANGED, NEW, or REMOVED, and the current stable sentence when every demo is SAME. When the rest are only NOISY or UNSTABLE, the banner says no proven demo change and names those verdicts. It does not say the demos are stable.
- The shadow disclaimer line leaves the comment. The per-demo summary is the verdict.
