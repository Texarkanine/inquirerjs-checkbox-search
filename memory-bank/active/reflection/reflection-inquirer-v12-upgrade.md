---
task_id: inquirer-v12-upgrade
date: 2026-09-02
complexity_level: 2
---

# Reflection: Inquirer ecosystem v12 upgrade

## Summary

Bumped `@inquirer/core` to ^12.0.1 (plus related Inquirer and tooling deps) and adapted `setActiveItemValue` / `renderItem` typing so build, quality, tests, and mutation gates pass. Delivered as planned; no PR/archive per operator.

## Requirements vs Outcome

All brief requirements met: package bumps, lockfile, type adapts, TDD for callable Values, and all four verification gates. No scope creep beyond Dependabot #167/#168/#171.

## Plan Accuracy

Sequence held. Surprise: after install, typecheck only reported the three `useState` setter errors — `renderItem` already assigned without a hard error, but we still added `index` to the layout type per plan/preflight. Preflight correctly elevated the callable-Value setter issue from "type-only" to observable behavior, which drove the red regression test.

## Build & QA Observations

Build was smooth once the red test proved direct setters invoke function Values as reducers (7 calls). Reducer form at three sites fixed types and runtime. QA passed clean with no trivial fixes.

## Insights

### Technical
- `@inquirer/core` v12 `useState` setters: any function argument is a reducer. Storing a function-typed choice Value requires `setX(() => value)`, not `setX(value)`.

### Process
- Nothing notable beyond preflight correctly catching the under-specified TDD boundary for "type-only" changes that alter setter call shapes.

### Million-Dollar Question

Same shape as shipped: depend on core's reducer overload at the three call sites, with one object-references regression. No foundational redesign warranted for a dep-compat bump.
