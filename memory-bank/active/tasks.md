# Tasks

## Current Task: issue-190

**Complexity:** Level 1

### What broke

Generate job [37949632608](https://github.com/Texarkanine/inquirerjs-checkbox-search/actions/runs/37949632608/job/113884741326) failed after 5 minutes. The GIF step succeeded. The shadow step recorded all six tapes, then exited 1 because the host frames directory had no `frame-text` PNGs.

### Why

The container command ran `mkdir -p /tmp/vhs-frames` before `vhs`. VHS v0.10.0 renames its temp frame directory onto that path and ignores the error. A directory that already exists makes the rename fail. Cleanup then deletes the real frames, and the precreated directory stays empty. Local vhs v0.10.0 reproduced both sides: precreated directory stays empty; a missing directory receives the PNGs.

### What changed

- The container command no longer creates `/tmp/vhs-frames`.
- `vhs` keeps its own exit status. The frames directory is made readable only when it exists.

### Files

- `scripts/demo-fingerprint.ts`
- `scripts/demo-fingerprint.test.ts`
- `memory-bank/techContext.md`

### Verification

`npm test` passed: format, lint, typecheck, and 169 tests. The local vhs v0.10.0 recording wrote the PNGs when the directory was absent.

### QA Findings

Reviewed the rework diff (`scripts/demo-fingerprint.ts`, `scripts/demo-fingerprint.test.ts`, `memory-bank/techContext.md`) against the task notes above:

- **KISS**: Single inline shell conditional preserving exit status without extra helper scripts or abstractions.
- **DRY**: Reuses existing `containerFramesDir` constant.
- **YAGNI**: Strictly removes the pre-creation `mkdir` that triggers the VHS rename failure; adds no speculative behavior.
- **Completeness**: Command no longer pre-creates `/tmp/vhs-frames`, preserves `vhs` exit status, and guards `chmod` with a directory check.
- **Regression**: Existing container naming, read-only volume mounting, argument forwarding, and fingerprinting untouched; all 169 tests pass.
- **Integrity**: No placeholder strings, magic numbers, or temporary debug scaffolding.
- **Documentation**: `memory-bank/techContext.md` and module comments updated with the VHS rename behavior rationale.

Advisory: Docker is not installed on this machine, so container execution itself is verified via CI Generate job, though the rename behavior was reproduced locally with vhs v0.10.0.

