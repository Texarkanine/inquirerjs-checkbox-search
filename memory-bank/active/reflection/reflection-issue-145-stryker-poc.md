---
task_id: issue-145-stryker-poc
date: 2026-07-25
complexity_level: 2
---

# Reflection: PoC mutation testing with StrykerJS (#145)

## Summary

StrykerJS is proven on this repo (602 mutants, **73.09%** score, ~4m run). Deliverable is advisory tooling plus a written go/no-go: keep Stryker locally, do not hard-gate `pr.yaml` yet.

## Requirements vs Outcome

All acceptance criteria met: recorded score, triaged survivors, written decision. Extra (in-scope): fixed backspace filter clearing so dry-run and four Vitest cases pass—preferable to excluding those tests from mutation runs. CI wiring correctly deferred.

## Plan Accuracy

Plan sequence held. Main surprise: dry-run was blocked by pre-existing backspace test failures, not by Stryker↔Vitest incompatibility. Tech validation correctly surfaced that before build. Incremental mode was a useful plan amendment.

## Build & QA Observations

Full run was smooth (0 timeouts). Triage confirmed the expected render-string long tail. QA only caught missing CONTRIBUTING docs for the new scripts.

## Insights

### Technical
- `@inquirer/testing` `keypress('backspace')` does not update `rl.line`; prompts that treat `rl.line` as sole search source will fail under that harness even when TTY behavior is fine.
- First mutation score (~73%) is informative for filter/defaults/pageSize gaps; chasing UI string literals is low value—prefer excludes later.

### Process
- For tooling PoCs, treat dry-run failure as a first-class plan risk and budget an unblock step (fix vs scoped exclude) before the full mutation run.

### Million-Dollar Question

If mutation testing had been assumed from day one, assertions would pin empty-filter short-circuits, default `checked`/`loop`/`validate`, and pageSize boundaries more directly—and render labels would be treated as non-contractual (theme/disable) rather than assertion targets. The Stryker setup we landed is still the right lightweight foundation; the deeper change is assertion strategy, not a different mutator stack.
