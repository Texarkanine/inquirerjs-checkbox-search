---
task_id: issue-147-m2-slobac-audit
date: 2026-07-26
complexity_level: 2
---

# Reflection: Audit suite with SLOBAC and remediate High smells

## Summary

M2 remediations landed as a test-only net deletion (−121 lines) on `slobac-me-up`: High kill-power smells from a Grok baseline plus an independent Opus/Sol re-audit were fixed; the re-audit loop was frozen before chasing empty confirmations. Suite green at 128 tests.

## Requirements vs Outcome

Delivered: in-scope High / `naming-lies` remediations, selection-across-filter still guarded (answer-array), no product-code edits, quality gate green. Explicitly deferred Sol’s Phase B dissolve of `edge-cases.test.ts` and further confirmation-audit nits. Plan’s “re-audit until zero High” was reinterpreted as “independent-model pass + clear remediations + freeze,” which matches the kill-power intent of #147 better than an infinite loop.

## Plan Accuracy

Sequence (audit → triage → kill-power first → re-audit) held. Surprises: (1) same-model re-audit after own remediations is weak — Opus found ~16 High leftovers Grok missed; (2) confirmation passes after that slide into diminishing returns within one or two rounds. File list was findings-driven as planned; no new suites created.

## Build & QA Observations

Build was iterative but clean mechanically (tests/quality stayed green). Hard part was knowing when to stop the audit loop — operator correctly called the ghost chase. QA was clean: no substantive fixes; freeze deferrals already documented.

## Insights

### Technical
- For a TUI SUT, mid-prompt selection oracles often need line-anchored glyphs or theme injection; answer-array oracles are the right strengthen for end-of-flow claims (selection-across-filter). Mixing both is fine when each matches when the claim is observable.

### Process
- When remediating SLOBAC findings you just authored, run at least one assessor pass on a different model family (here: Opus batches + Sol cross-suite). Then freeze — do not treat “empty findings on confirm N” as the acceptance bar.

### Million-Dollar Question

If SLOBAC re-audit of own edits had been a foundational assumption, the plan would have scheduled a single independent-model audit as the verification gate (with an explicit freeze rule) instead of an open-ended “re-audit until zero” loop. What we built converges on that; the missing piece was stating the freeze rule up front.
