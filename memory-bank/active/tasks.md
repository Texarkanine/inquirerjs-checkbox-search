# Task: Rework demo verdict commit and repair

* Task ID: issue-190-promote
* Complexity: Level 2
* Type: bug fix

PR #202 rework. Release repair must not assess an attempt-1 head that has no repair base. The feature GIF commit must not fail on an empty index, and the pull notice appears only when a path will change `HEAD`. Tape names ending in `-before` or `-before-after` are rejected. A text diff whose unchanged line is a backtick run uses a longer fence, because that line closes a three-backtick fence in CommonMark. A width change stays CHANGED and neither GIF is scaled: the narrower one is padded to the wider one's width so `vstack` can run. SAME is the only verdict that leaves `docs/img/` untouched. NOISY and UNSTABLE are staged like CHANGED.

Checked against the code at `14a3a3a`. CommonMark 0.31.2 renders a diff line of one space plus three backticks as the end of the fence, so the rest of the comment is ordinary Markdown. Local ffmpeg 7.0.2 refuses `vstack` when the widths differ (`Input 1 width 12 does not match input 0 width 8`) and accepts `pad=w=12:h=ih:x=(ow-iw)/2` without stretching the 8px image.

## Test Plan (TDD)

### Behaviors to Verify

- `assertSafeDemoName('basic-before')` and `assertSafeDemoName('basic-before-after')` throw. `assertSafeDemoName('before')` and `assertSafeDemoName('basic')` do not.
- `selectReleaseAmend`: NOISY and UNSTABLE are in `stage` as `docs/img/<name>-demo.gif`. SAME and NEED_FRAME_RETRY are in neither list. CHANGED and NEW stay in `stage`. REMOVED stays in `remove`. Preview names stay absent.
- `commitPathsAgainstHead`: a remove whose head GIF is absent is dropped. A remove whose head GIF exists is kept. A stage whose head GIF is absent is kept. A stage whose head bytes equal the attempt-0 head GIF is dropped. A stage whose bytes differ is kept. A stage whose scratch GIF is missing throws.
- A CHANGED text diff that contains a line of one space plus three backticks is wrapped in a fence longer than that run, and longer than three. A diff with no backticks stays `` ```diff ``.
- `buildDockerFfmpegStackArgs` with widths omitted, or with equal widths, keeps the current `vstack` filter and does not contain `pad=`. With widths 8 and 12, the filter pads both inputs to width 12, stacks them, and does not contain `scale`.
- `parseFfmpegStreamSize` on a `Video: gif, bgra, 1500x800` line returns `{ width: 1500, height: 800 }`. Text with no size throws.
- `runCommentCli` `commit-list` mode, on a REMOVED demo whose head GIF is absent, prints no `remove` line. On a CHANGED demo whose scratch GIF differs from the head file, it prints `stage docs/img/<name>-demo.gif`.
- `assessScratch` on a complete attempt 0 plus an attempt-1 head and no attempt-1 base exits 1. The throw already exists. This test locks it so the repair step cannot start linking that shape.

### Test Infrastructure

- Framework: Vitest
- Test location: `scripts/demo-fingerprint.test.ts`, `scripts/demo-comment.test.ts`
- Conventions: `describe` per function, `it` names the observable behavior, fixtures under `mkdtempSync`
- New test files: none

## Implementation Plan

### 1. Preview-name rejection — executable

- Files: `scripts/demo-fingerprint.ts`, `scripts/demo-fingerprint.test.ts`

1. Stub tests: in `describe('assertSafeDemoName')`, an empty case for the two suffixes and an empty case for `before` and `basic`.
2. Stub interface: none. `assertSafeDemoName` already exists.
3. Write tests and run red: `basic-before` and `basic-before-after` throw `/demo name/`. `before` and `basic` do not.
4. Write code and run green: after the existing character check, reject a name that ends with `-before-after` or `-before`.

### 2. Commit NOISY and UNSTABLE — executable

- Files: `scripts/demo-comment.ts`, `scripts/demo-comment.test.ts`

1. Stub tests: none new. The existing `selectReleaseAmend` case is the test.
2. Stub interface: none.
3. Write tests and run red: change that case so `docs/img/noisy-demo.gif` and `docs/img/unstable-demo.gif` are in `stage` with the CHANGED and NEW paths, sorted by path. SAME and NEED_FRAME_RETRY stay out. The preview-name assertion stays.
4. Write code and run green: `selectReleaseAmend` stages NOISY and UNSTABLE the same way it stages CHANGED and NEW. Update its doc comment. Do not change `renderDemoBlock`. Collapsed NOISY and UNSTABLE summaries stay.

### 3. Head comparison for the commit list — executable

- Files: `scripts/demo-comment.ts`, `scripts/demo-comment.test.ts`

1. Stub tests: empty cases for an absent remove, a present remove, an absent stage, an equal stage, a different stage, and a missing scratch GIF.
2. Stub interface: `export function commitPathsAgainstHead(options: { selection: { stage: string[]; remove: string[] }; headDocsImg: string; scratchRoot: string }): { stage: string[]; remove: string[] }`. Body throws. Doc comment: drop a remove with no head file, drop a stage whose bytes match the attempt-0 head GIF, keep every other listed path, throw when a stage's scratch GIF is missing.
3. Write tests and run red: the six outcomes above. Paths stay `docs/img/<name>-demo.gif`.
4. Write code and run green: read the head file and `scratchRoot/attempt-0/head/<name>/<name>-demo.gif`. Compare with `Buffer.equals`. Do not call git.

### 4. commit-list CLI — executable

- Files: `scripts/demo-comment.ts`, `scripts/demo-comment.test.ts`

1. Stub tests: an empty case for `commit-list` flags, an empty case for a missing `--head-docs`, an empty case whose stdout has no `remove` when the head GIF is absent, and an empty case whose stdout has `stage` when the bytes differ.
2. Stub interface: add `'commit-list'` to the `parseCommentArgs` mode union and a `headDocsImg` field. `--head-docs` is required for that mode and rejected for the others. Body of the new branch throws until the green step.
3. Write tests and run red: missing `--head-docs` throws. An unknown mode still throws. The absent-remove fixture prints no `remove`. The different-bytes fixture prints `stage docs/img/<name>-demo.gif`.
4. Write code and run green: `commit-list` loads entries with `requireImageUrls: false`, runs `selectReleaseAmend`, then `commitPathsAgainstHead`, then `formatAmendList`.

### 5. Text-diff fence — executable

- Files: `scripts/demo-comment.ts`, `scripts/demo-comment.test.ts`

1. Stub tests: an empty case for a diff that contains a backtick run, next to the existing CHANGED diff case.
2. Stub interface: none. `renderDemoBlock` already fences the diff.
3. Write tests and run red: build a CHANGED entry whose `textDiff` contains a line that is one space followed by three backticks. The rendered block's opening fence is longer than three backticks and longer than every backtick run in the diff. The existing `-old line` / `+new line` case still expects `` ```diff ``.
4. Write code and run green: choose the fence length from the diff. A diff with no backtick run keeps `` ```diff ``.

### 6. Unequal-width stack — executable

- Files: `scripts/demo-fingerprint.ts`, `scripts/demo-fingerprint.test.ts`

1. Stub tests: an empty case for equal widths, an empty case for widths 8 and 12, and an empty case for `parseFfmpegStreamSize`.
2. Stub interface: add optional `beforeWidth` and `afterWidth` to `buildDockerFfmpegStackArgs`. Add `export function parseFfmpegStreamSize(ffmpegText: string): { width: number; height: number }`. Bodies throw where they are new. Doc comment: when the widths differ, pad each input to the wider width and do not scale. When they are omitted or equal, keep the current filter. One width without the other throws.
3. Write tests and run red: omitted widths and equal widths keep the current filter string and do not contain `pad=`. Widths 8 and 12 contain `pad=w=12`, contain `vstack`, and do not contain `scale`. `Video: gif, bgra, 1500x800` parses to `{ width: 1500, height: 800 }`. Text with no size throws. A single width throws.
4. Write code and run green: implement the pad filter and the parser. The pad color is black. Each padded input sets `setsar=1` before `vstack`. The palette step stays.

### 7. Incomplete repair attempt — executable

- Files: `scripts/demo-fingerprint.test.ts`, `.github/workflows/generate-demos.yaml`

1. Stub tests: an empty case in the `assessScratch` describe for an attempt-1 head with no attempt-1 base.
2. Stub interface: none.
3. Write tests and run red: attempt 0 has both sides, attempt 1 has only head, both tapes exist. `assessScratch` exits 1. The current throw makes this green. That is the contract. Do not change `attemptsForDemo` to skip the incomplete attempt.
4. Write code and run green: in the release repair step, stop linking `attempt-1/head` before the first fingerprint CLI call. Keep the attempt-0 head link. The retry loop already records a missing attempt-1 head after it records the repair base. Do not add a test that the workflow file contains a string.

### 8. Wire the commit list and the width probe — executable

- Files: `.github/workflows/generate-demos.yaml`
- Behavior tests: steps 3, 4, and 6. No test locks a YAML string.

1. Stub tests: none.
2. Stub interface: none. The CLI and the stack helper already exist.
3. Write tests and run red: none.
4. Write code and run green:
    1. In the comment step and both commit steps, materialize `HEAD`'s `docs/img/*.gif` into a temp directory with `git cat-file -e` and `git show`. A missing blob is an absent file.
    2. Replace the `amend` invocation that decides the pull notice and the files to commit with `commit-list` and `--head-docs`. Pass `--gif-commit-added` only when that output is non-empty and the pull request is not release-please.
    3. On the feature commit step, exit 0 when `commit-list` is empty. After `git add` / `git rm`, exit 0 when `git diff --cached --quiet`. Do not commit and do not push in that case.
    4. On the release amend step, use the same `commit-list` against the repair scratch. Keep the existing empty-index exit.
    5. Before `buildDockerFfmpegStackArgs`, run `ffmpeg -hide_banner -i` on each GIF inside the demo image, parse both sizes with `parseFfmpegStreamSize`, and pass `beforeWidth` and `afterWidth`. `ffmpeg -i` with no output exits 1 after it prints the size. Treat a parsed size as success. Do not scale.

### 9. Docs and review replies — prose/policy

- Files: `CONTRIBUTING.md`, `memory-bank/techContext.md`, `memory-bank/active/projectbrief.md`, `memory-bank/active/creative/creative-commit-demos-on-merge.md`
- No tests: prose/policy artifact

1. In the original brief requirement 7, say SAME does not push and NOISY and UNSTABLE do. Leave the rework section in place.
2. In `creative-commit-demos-on-merge.md`, add the same supersession line the release decision already uses: NOISY and UNSTABLE are committed. Only SAME skips the GIF.
3. In `techContext.md` and `CONTRIBUTING.md` "Demo Generation", say the bot commits when the verdict is not SAME.
4. Reply on the PR threads:
    - [discussion_r4469775592](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/202#discussion_r4469775592): dismiss. A `__proto__` key requires a tape of that name in this repo. The upload map is not a boundary someone outside the repo can cross.
    - [discussion_r4462399788](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/202#discussion_r4462399788) and [discussion_r4469775617](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/202#discussion_r4469775617): a width change is already CHANGED. We do not scale. The narrower GIF is padded so `vstack` can run, and the committed GIF stays the head recording at its own width.
    - [pullrequestreview-5771329231](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/202#pullrequestreview-5771329231): dismiss the `-i` order nit. The function already passes before, then after. The test gap is a future swap of two adjacent arguments.
    - [discussion_r4469775612](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/202#discussion_r4469775612): same fix as the suffix rejection. Not a separate dismissal.
    - [discussion_r4462366088](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/202#discussion_r4462366088), [discussion_r4462399782](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/202#discussion_r4462399782), [discussion_r4462399796](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/202#discussion_r4462399796), [discussion_r4469775579](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/202#discussion_r4469775579), and the baseline finding on [pullrequestreview-5761748717](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/202#pullrequestreview-5761748717): short replies that the repair link, the empty commit, the suffix, the fence, and the NOISY/UNSTABLE commit are in this update. The baseline finding is answered by committing those two verdicts, not by a per-demo producer SHA.

## Technology Validation

No new technology - validation not required. The fence check used the already-installed CommonMark 0.31.2 package in `/tmp`, not a project dependency. The pad check used the local ffmpeg binary. Neither is added to the package.

## Dependencies

- `selectReleaseAmend` feeds `commitPathsAgainstHead`. The workflow calls `commit-list`, not the unfiltered `amend` output, wherever a commit or the pull notice is decided.
- `planDocsImgCopies` already copies a non-REMOVED head GIF, including NOISY and UNSTABLE, into `docs/img/` for upload. The commit list is what changes.
- `attemptsForDemo` keeps throwing on an incomplete later attempt. The repair step stops creating that shape before the first assessment.
- The comment renderer does not open NOISY or UNSTABLE. The pull notice can appear on a comment whose banner says there is no proven change.

## Challenges & Mitigations

- The comment step runs after the upload script may have replaced `docs/img/`: the head bytes come from `git show HEAD:docs/img/...`, not from the worktree.
- `ffmpeg -i` exits 1: the workflow parses a size from the text and continues. A docker failure that prints no size still fails the step.
- An equal-byte NOISY GIF drops out of `commit-list`, so the pull notice stays off and the commit step exits 0. That is the empty-index case, not a skipped verdict.
- The feature step's quiet-index exit can disagree with a notice that was already posted if the copy fails after the comment. The check stays red only when the copy or the push fails. An empty index is a green exit.
- Padding uses `pad`, which the local ffmpeg accepts without stretching pixels. The unit test forbids a `scale` filter. The VHS image's ffmpeg is older and still has `pad`.
- Duplicating the head-docs materialize in three steps can drift: each step's only decision command is `commit-list`.

## Pre-Mortem

- The workflow still reads `amend` for the pull notice, so a missing GIF removal stays red and the comment still claims a commit: steps 4 and 8 switch every decision site to `commit-list`, and the feature step keeps the quiet-index exit.
- Padding is implemented with `scale` and the width change is hidden: step 6's test fails if the filter contains `scale`. The committed file stays the untouched head GIF from `planDocsImgCopies` / the commit copy.
- NOISY blocks are opened because they are now committed: step 2 says not to change `renderDemoBlock`. Commit and comment openness stay separate.
- The repair step still links attempt-1 and the first CLI throws: step 7 names that symlink as the deletion. The new `assessScratch` case is the contract that makes the deletion necessary.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [ ] Preflight
- [ ] Build
- [ ] QA
