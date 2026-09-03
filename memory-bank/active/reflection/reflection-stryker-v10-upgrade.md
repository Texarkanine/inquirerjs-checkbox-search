---
task_id: stryker-v10-upgrade
date: 2026-09-02
complexity_level: 2
---

# Reflection: Stryker v10 upgrade

## Summary

Bumped `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` to `^10.0.0`, refreshed the lockfile, and verified quality, Vitest, and full mutation testing under Stryker 10. All gates passed; no config changes were required.

## Requirements vs Outcome

Delivered as specified: both packages at 10.0.0, lockfile updated, quality/test/mutate dry-run and full mutate green. No PR opened; stopped at Reflect per operator. Dependabot #169/#170 consolidation is ready for a parent PR.

## Plan Accuracy

Plan was accurate. Expected risk (Node 20 / config breakage) did not materialize — engines and CI already require Node ≥22, and existing `stryker.config.json` worked unchanged. Full mutate was fast locally (~48s), not the multi-minute concern the plan flagged for CI history.

## Build & QA Observations

Build was mechanical: version bump → install → verify. QA found no debris; docs already speak of Stryker generically. No rework loops.

## Insights

### Technical
- Stryker 10’s sole breaking change (drop Node 20) was already satisfied by this repo’s engines/CI matrix; major bumps that look scary can be no-ops when the floor was raised earlier.

### Process
- For deps-only majors with operational verification (not new product tests), Level 2 Reflect is still valuable for the archive trail, but Plan/Preflight can stay thin.

### Million-Dollar Question

If Stryker 10 had been the starting assumption, the same `stryker.config.json` and scripts would still be the right shape — the elegant solution is what shipped: bump both packages together, leave config alone, trust the existing mutate gate.
