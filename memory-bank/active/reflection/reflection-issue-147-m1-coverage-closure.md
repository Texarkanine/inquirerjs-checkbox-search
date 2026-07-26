---
task_id: issue-147-max-test-qa / M1-coverage-closure
date: 2026-07-26
complexity_level: 2
---

# Reflection: M1 Coverage Closure

## Summary

Closed the supported-surface coverage gap with 13 kill-verified tests in existing suites: lines and functions at 100%, branches at 96.28% with the remainder documented as out-of-surface or defensive. No product-code changes.

## Requirements vs Outcome

Delivered plan behaviors B1–B9 plus triage for nameless choices, non-Error source throws, `columns` fallback, and empty-filter navigation. Did not reach 100% branch; remaining arms justified under invariant 9 rather than exporting internals. PR open/merge is the remaining delivery step for this milestone.

## Plan Accuracy

Placement and sequence were right. Surprises were tooling: shared Stryker incremental reports pollute targeted scores, and `makeTheme` deep-merge makes `nocursor ?? ' '` independently untestable. The plan's "confirm red" wording was already corrected in preflight to kill-verify.

## Build & QA Observations

Validate async paths and TTY show/hide were straightforward once `nextRender` and prompt-completion cleanup were used. QA only needed a small DRY extraction (`expectAnswerPending`). The nocursor theme attempt was correctly discarded after kill-verify proved it was a false coverage claim.

## Insights

### Technical
- Prompt-level short-circuits can make helper early-returns dead (`defaultFilter` empty term vs `filteredItems` trim check) — line coverage on the helper needs an export or a direct unit call that this package does not offer.
- Clean targeted Stryker requires a fresh `--incrementalFile` path; `--force` and the shared report retest out-of-range mutants.

### Process
- For tests against already-correct production code, kill-verify is the real quality gate; coverage % alone still lies when a theme merge masks the branch you thought you hit.

### Million-Dollar Question

If coverage honesty had been a founding constraint, `defaultFilter` and similar pure helpers would be exported (or live in a tiny testable module) so empty-term and other short-circuit arms could be unit-tested without contorting the prompt harness — and theme defaults that exist only to silence `??` fallbacks would be documented as denominator exclusions from day one. What we built (prompt-level semantic tests + explicit out-of-surface list) is the right shape given the current single-file module boundary.
