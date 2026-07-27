---
task_id: issue-147-m3-mutation-hardening
date: 2026-07-26
complexity_level: 3
---

# Reflection: issue-147-max-test-qa / M3-mutation-hardening

## Summary

M3 raised the post-M1/M2 mutation score from 82.07% to 88.14% by killing load-bearing survivors with semantic oracles, excluding justified junk (`StringLiteral` / `ArrayDeclaration` + site disables), and gating CI at `thresholds.break: 80`. Build and QA both PASS; no product behavior changes.

## Requirements vs Outcome

Delivered as planned: hit-list kills (empty-filter short-circuit, `checked`/`loop` defaults, PageSize boundaries, renderItem checked/disabled via theme injection), exclusion ledger in CONTRIBUTING, cleaned re-run, and an explicit gate decision. Added nothing outside scope. Left PageSize `!== undefined` / `&&`→`||` equivalents visible rather than faking 100% by over-broad disables.

## Plan Accuracy

Baseline → triage → kill → exclude → re-run → gate was the right sequence; #145 line numbers were correctly treated as seeds only. Surprises were analytical, not structural: L512 and `defaultFilter` empty short-circuits are redundant on the default path; several PageSize guard mutants are JS-equivalent under `undefined` relational compare; a non-`next-line` `// Stryker disable LogicalOperator` ignored mutants for the rest of the file until restore (restore did not scope as expected).

## Creative Phase Review

No creative phase — gate criteria were fixed in the plan as a late go/no-go. That held: cleaned score was stable enough for a modest floor (80), not aspirational 100%.

## Build & QA Observations

Range kill-verify with fresh `--incrementalFile` made the inner loop practical. Full mutate ~2 min local after excludes. QA was clean aside from one misleading test comment. Selection-across-filter guard remained green.

## Cross-Phase Analysis

Preflight’s branch-from-L4-tip and CONTRIBUTING-ledger amendments prevented real pain (JSON cannot hold exclude reasons; bare `main` would have dropped memory-bank). The LogicalOperator disable leak was a build-time lesson, not a plan gap — preflight could not have predicted Stryker comment scoping without prior encounter.

## Insights

### Technical
- Empty-search short-circuit is only killable with a custom filter that returns `[]`; defaultFilter mirrors L512, so empty-term oracles through the default path cannot kill either side alone.
- Prefer `// Stryker disable next-line` (or leave accepted survivors) over block disable/restore for a single mutator — a leaked disable silently removes load-bearing LogicalOperator mutants from the score.
- PageSize `x !== undefined && x < n` → `true && x < n` and min/max `&&`→`||` are often equivalent when the other operand is compared with `undefined`.

### Process
- M3’s late gate go/no-go with written criteria beat deciding advisory-vs-gate up front; the cleaned score after kills+excludes is the only honest input to `thresholds.break`.
