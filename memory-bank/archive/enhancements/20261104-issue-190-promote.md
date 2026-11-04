---
task_id: issue-190-promote
complexity_level: 2
date: 2026-11-04
status: completed
---

# TASK ARCHIVE: Promote demo verdicts out of shadow

## SUMMARY

Fingerprint verdicts now drive the pull-request demo comment and the release GIF repair. A feature pull request whose verdict is not SAME gets one `chore: update demo GIFs` commit after the comment, from attempt 0 of a single head recording. SAME leaves `docs/img/` untouched. NOISY and UNSTABLE stay collapsed in the comment and are still committed. The promote was reflected as Level 3 on 2026-11-03. PR #202 review sent a Level 2 rework, which QA passed on 2026-11-04. Branch `shadow-diff`, draft PR [#202](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/202).

## REQUIREMENTS

The contract is issue #190's deferred switch, then the operator's commit-on-PR decision, then the PR #202 rework. The brief replaced the issue's "Feature PRs get no bot commits" line.

1. Expand a demo only when the verdict says it changed. SAME is collapsed and named. CHANGED, NEW, and REMOVED stay open. A text change is a stacked GIF plus a fenced diff. A frame-only change says styling only and omits the diff.
2. A feature pull request whose verdict is not SAME adds one commit. That includes NOISY and UNSTABLE. The commit is not an amend and not a force-push. SAME does not push. The comment tells the author to pull only when a listed path will change `HEAD`.
3. A release pull request amends README GIFs only when `docs/img/` is still wrong compared with the commit that last touched it. No committed frame hash.
4. Release repair must not assess an attempt-1 head that has no repair base yet.
5. The feature commit exits 0 when the index is empty.
6. Tape names ending in `-before` or `-before-after` are rejected. Those suffixes stay valid as preview URL keys.
7. A width change stays CHANGED. Neither GIF is scaled. The narrower one is padded so `vstack` can run.
8. The text-diff fence grows only when a backtick run in the diff would close a three-backtick fence.

## IMPLEMENTATION

Comment shape: SAME, NOISY, and UNSTABLE collapse and name the verdict. CHANGED opens with the stacked GIF and a diff fence, or `styling only` when only the frame differs. NEW opens on the after GIF. REMOVED opens on the before GIF. The shadow disclaimer is gone.

Commit shape: one head recording is both the fingerprint and the GIF. The comment compares with the merge-base. `commit-list` is the list of paths that would change `HEAD`: drop a remove whose head GIF is absent, drop a stage whose bytes already match, throw when a stage's scratch GIF is missing. The comment step reads those bytes from the pull-request head SHA. The commit steps read them after checkout. An empty list, or an empty index after `git add` / `git rm`, exits 0 and does not push. The release amend uses the same list against the repair scratch and still amends only when `docs/img/` is wrong. The follow-up run, whose actor is the demo app, exits without recording again.

The first amend decision staged only CHANGED, NEW, and REMOVED, and its pre-mortem assumed feature pulls do not commit GIFs. The later commit decision and the rework replaced that: every verdict except SAME is eligible, and `commit-list` still drops a GIF whose bytes already match.

Repair: the workflow no longer links `attempt-1/head` before the repair base exists. `attemptsForDemo` still throws on an incomplete later attempt. The retry loop records the missing attempt-1 head after it records the repair base.

Width: `buildDockerFfmpegStackArgs` resolves GIF paths before the Docker mount. When the widths differ it pads both inputs to the wider width with black, sets `setsar=1`, then `vstack`. It does not scale. Equal or omitted widths keep the old filter. The workflow parses sizes from `ffmpeg -i`, which exits 1 after printing them.

Tape names: `assertDemoTapeName` rejects the preview suffixes. `assertSafeDemoName` still accepts upload keys such as `validation-before-after`. Putting the suffix check on the shared function made the comment CLI exit 1 on its own stacked URL.

Key files: `scripts/demo-comment.ts`, `scripts/demo-fingerprint.ts`, `.github/workflows/generate-demos.yaml`, `CONTRIBUTING.md`, `memory-bank/techContext.md`.

## TESTING

Promote: units went red then green. QA failed on a relative Docker mount, an unfenced diff, and detached doc comments, then on a missing `CONTRIBUTING.md` sentence, then passed. `npx vitest run scripts` was 79 passing.

Rework: CommonMark 0.31.2 rendered a diff line of one space plus three backticks as the end of a fence. Local ffmpeg 7.0.2 refused unequal `vstack` and accepted `pad` without stretching. The incomplete-attempt test was already green because the throw existed; the bug was the symlink. QA passed on the first review. Script tests: 97 passing. Format, lint, and `tsc -p tsconfig.scripts.json` were clean.

`npm run typecheck` and the full unit suite still stop on three `setActiveItemValue` errors in `src/index.ts` and 32 prompt failures that were already on the branch. This work does not touch the prompt.

Review replies on PR #202: `__proto__` dismissed because that key needs a tape of that name in this repo; `-i` order dismissed as a future swap of two adjacent arguments the function already passes in order; width threads answered with pad, not scale.

## LESSONS LEARNED

- Docker treats a non-absolute `-v` source as a named volume. Resolve every GIF path before building the mount.
- A test that only checks the payload stays green when the rendering breaks. Assert the fence, and use the path shape the workflow passes, because the workflow itself is not tested.
- `assertSafeDemoName` guards tape names and upload keys. A rule aimed at tapes rejects `<name>-before-after`, which is the stacked GIF's key.
- An unchanged diff line is prefixed with one space. Three backticks on that line close a CommonMark fence.
- A JSDoc block attaches to the next statement. A `const` between the comment and the function takes the comment.
- `commit-list` is the decision the workflow needed from the start: one list of paths that would change `HEAD`, used for the notice and both pushes.

## PROCESS IMPROVEMENTS

Preflight caught the missing tested units for the image-list parse, the template fill, and the CLI. It did not catch the mount or the fence, because the plan described both behaviors without the constraint that makes them correct. Name `CONTRIBUTING.md` in the plan when CI behavior is something a contributor has to pull for. A prose unit that names only `techContext.md` will not update it.

The preflight notes that named a wrong document or a wrong `HEAD` were the ones worth adopting: the supersession line on the amend decision, and materializing head bytes after checkout.

## TECHNICAL IMPROVEMENTS

Left as advisories: a text diff includes every unchanged line and could pass GitHub's comment cap; `runCommentCli` repeats the upload-failure sentence; `--flag=value` is parsed and unused; an upload that finds no GIFs makes the comment step exit 1; three copies of the head-docs materialize loop; the `amend` CLI mode is unused once `commit-list` decides; the width probe stays in the workflow shell.

## NEXT STEPS

None in the memory bank. PR #202 carries the branch.
