---
task_id: issue-190
date: 2026-10-08
complexity_level: 3
---

# Reflection: issue-190

## Summary

Shadow-mode demo fingerprinting is in place. A pull request records the merge-base and the head in one job, compares a normalized text record and a frame-text fingerprint, and prints those verdicts without changing which demos expand. The suite passed, and QA passed.

## Requirements vs Outcome

The build delivers the recording, both fingerprints, the amended retry rule, the `Wait+Screen /Search:/` tapes, and a shadow line in the job summary and the comment. The comment still opens and collapses demos from the GIF diff, and release-please still amends GIFs from that same diff. That is the issue's rollout, not a dropped requirement. The before/after GIF and the release gate on the new verdict wait until dependency-bump pull requests come out SAME.

Two additions were not named as their own plan steps. Scratch mode records one demo at a time without a parallelism flag. The gif Output path is derived as `<demoDir>/<demoName>-demo.gif` because the helper takes the text path and the frames directory.

## Plan Accuracy

The eight-step sequence held. No step was reordered. The challenges that mattered were the ones the plan named: the merge-base copy of the generator has none of the new flags, importing `generate-demo.js` from a test runs `main()`, and a scratch directory inside the repo would be copied by `docker build`.

Preflight failed twice before the pass, and both failures were real. The first caught that the fingerprint command was never built or tested, that the base side cannot run a generator that does not exist yet, and that the checkout is the merge commit. The second caught that `generate-demo.js` runs `main()` at import, that nothing produced the shadow line, and that a Dockerfile path check would mark a comment-only edit CHANGED.

The surprise during build was local, not in the plan: `node_modules` was not installed, so the first Vitest run could not load its config. The VHS text-framing assumption is still unverified against VHS source. Shadow mode is the check, on the first CI run.

## Creative Phase Review

No creative phase was run. The open questions were closed by the issue and by the operator's retry amendment before planning finished.

## Build & QA Observations

Each executable step went red on a throwing stub, then green. `npm test` ended at 164 passing tests, with format, lint, and both TypeScript projects clean. QA passed with no rework. Docker is not installed here, so the workflow's image build and VHS run are unexercised until CI.

The awkward spot was the word "scratch." The generator's `--scratch` is the side directory it writes (`attempt-0/base`). The fingerprint command's `--scratch` is the parent of `attempt-<n>`. Both match the plan, and they are easy to mix up in the workflow.

## Cross-Phase Analysis

The preflight failures were the expensive mistakes, caught before any code. Build did not rediscover them. The parallelism advisory stayed an advisory: the plan's parser has no `--max-parallelism` flag, and the invariant is one demo at a time, so scratch mode is serial instead of gaining a flag. That did not cause a QA finding.

QA's notes match the plan's known limits: no local Docker, and this pull request's own shadow verdicts compare `Wait+Screen` tapes with merge-base tapes that still sleep.

## Insights

### Technical

- The GIF-only path in `scripts/generate-demo.js` must not import `scripts/demo-fingerprint.ts`. Importing it would make today's demo scripts depend on Node's type stripping.
- Generator `--scratch` and fingerprint `--scratch` are different directories. The workflow passes the side directory to the generator and the attempt parent to the fingerprint command.

### Process

- After a passing preflight, `/niko` stops and waits for `/niko-build`. The next work is known, and the extra command is the consent to start writing code.
