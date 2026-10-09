# Tasks

## Current Task: issue-190-rework

### What broke

The Generate job on pull request #191 exited 1 in the shadow step after all six recordings finished. The fingerprint CLI found no `frame-text-*.png` files. Its message was on stdout, and `CLI_OUT="$(run_cli)"` under `set -e` discarded it.

### Why

VHS v0.10 writes frames in its temp directory and `os.Rename`s that directory onto the frames Output path. The rename error is ignored. Container `/tmp` and the scratch bind mount are different filesystems, so the frames directory stayed empty.

### What changed

- `buildDockerRunArgs` sets `TMPDIR=/workspace/scratch/.vhs-tmp`, which is on the scratch mount.
- Scratch mode creates that directory on the host before `docker run`.
- A non-zero CLI result is written to stderr, so the job log keeps the message.

### Files

- `scripts/demo-fingerprint.ts`
- `scripts/demo-fingerprint.test.ts`
- `scripts/generate-demo.js`

### QA

PASS. The change is limited to the three planned files. Each behavior has a unit test: the `TMPDIR` argument, the host temp path, and stderr routing of a structural error. `npm test` passed with 167 tests. Advisories: the rename fix is unverified until the next Generate job, and a structural CLI error still fails the shadow step, now with a visible message.

### Follow-up CI

The next Generate job, [run 37867082815](https://github.com/Texarkanine/inquirerjs-checkbox-search/actions/runs/37867082815/job/113616261602), was cancelled. The shadow step sat from 00:55:59Z to 06:54:12Z on the first base `basic` recording and never printed VHS's `File:` line. Process-wide `TMPDIR` on the bind mount is what changed between the fast exit 1 and this hang.
