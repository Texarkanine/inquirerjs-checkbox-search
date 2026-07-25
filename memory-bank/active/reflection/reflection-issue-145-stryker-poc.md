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

---

# Rework Reflection: PR #146 review feedback

**Date:** 2026-07-25

## Summary

Trimmed the advisory CI job down to mutation-only, bounded it with a timeout, unpinned Stryker's worker concurrency, and deleted the scripts and config left orphaned by an earlier commit. Net effect is deletion: 2 npm scripts, 1 CI step, 2 config keys, 1 ignore entry removed; 1 timeout key and 1 ESLint ignore added.

## Requirements vs Outcome

All 6 requirements, 6 constraints, and 5 acceptance criteria delivered. Two additions beyond the brief: an ESLint ignore for `.stryker-tmp/` (a build-phase discovery, described below) and reconciling PR #146's title and body, which a preflight finding surfaced. Nothing was dropped or descoped.

## Plan Accuracy

The sequence held and the file list was right. Preflight earned its keep three times: it caught that the plan was ordered implementation-then-verify, that the plan wrongly said to keep a job name that would become false, and that the PR title feeds release-please's changelog. The one genuine surprise came from a direction the plan never looked — running the full quality gate with a Stryker sandbox on disk.

## Build & QA Observations

Steps 1-6 were mechanical. Step 7 failed immediately with 15 ESLint parsing errors from a leftover `.stryker-tmp/sandbox-*`, which turned out to be a latent defect this branch shipped rather than anything the rework caused. QA found one real DRY defect (two adjacent `CONTRIBUTING.md` bullets both stating the gating contract in different words) and one documentation gap, both trivially fixed.

## Insights

### Technical

- **ESLint flat config does not read `.gitignore`; Prettier 3 does.** Adding a tool that generates a directory means updating each ignore mechanism separately, and the failure is asymmetric: formatting stays green while linting collapses. This branch had shipped a tool whose temp directory broke `npm test`, `npm run quality`, and `test:ci` for any developer who ran it — invisible in CI, because a fresh checkout has no sandbox.
- **Don't pin machine-shaped constants in shared config.** `concurrency: 4` capped a 16-core dev machine at a quarter of its capacity while oversubscribing a 4-vCPU CI runner. Deleting it cut the local full run from 4m1s to 2m6s and let each machine size itself.
- **Verifying an absence needs an experiment, not a diff.** StrykerJS's `thresholds.break` defaults to `null`, so the entire "advisory" property of this job comes from config that isn't there. The only way to demonstrate it was to break a test, watch Stryker exit 1, revert, and watch it exit 0 at 73%.

### Process

- **Size timeouts from CPU cost, not local wall time.** The full run took 2m6s on 16 cores, which would have argued for a 5-10 minute timeout. It consumed ~27 minutes of CPU, which on a 4-vCPU runner projects to 8-15 minutes wall. The local observation and the CI-relevant invariant differ by an order of magnitude.
- **A "do not add X" requirement still needs its own verification step.** Preflight flagged that nothing in the plan could demonstrate the crash-reds contract, because no-change requirements leave no diff to inspect. Budget an experiment for them.
- **Review rework includes PR metadata.** With release-please, the PR title is a shipping artifact, not a label — an inaccurate one lands in the changelog.

### Million-Dollar Question

If "advisory CI check" had been the foundational assumption, the job would have been born as what it is now: install, run the tool, let it exit. The original built a duplicate coverage run, a 112-line summary script, and a `json` reporter to feed that script — and all three were deleted across two commits without losing anything, because the tool already printed the number and already exited zero on a low score. The general principle is that an advisory check's value lies in the *absence* of configuration. The moment you add reporting machinery you are building a gate without the enforcement: all of the cost, none of the signal. Reach for the tool's defaults and add glue only when a default is actually wrong.
