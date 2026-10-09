# Tasks

## Current Task: issue-190

**Complexity:** Level 1

### What broke

Generate job [37867082815](https://github.com/Texarkanine/inquirerjs-checkbox-search/actions/runs/37867082815/job/113616261602) was cancelled after 6 hours. The shadow step printed `File:` for the first base `basic` tape and then nothing. The previous shadow run finished in about 3.5 minutes.

### Why

Scratch recordings set process-wide `TMPDIR` on the scratch bind mount. VHS prints `File:` before it starts ttyd and Chromium, and both Chromium's profile and the frame directory come from that temp dir. That was the only change between the three-minute failure and the six-hour hang.

### What changed

- The recording no longer sets `TMPDIR` and no longer uses `--rm`.
- VHS writes frames under container `/tmp/vhs-frames`, on the same filesystem as its temp dir, so the rename succeeds.
- After VHS exits, the frames are copied to the host and the container is removed. The container is removed when the recording fails too.
- Frame PNGs are mode 0600 inside the container, so the recording command makes them readable before the copy.
- The shadow step times out after 20 minutes.

### Files

- `scripts/demo-fingerprint.ts`
- `scripts/demo-fingerprint.test.ts`
- `scripts/generate-demo.js`
- `.github/workflows/generate-demos.yaml`

### Verification

`npm test` passed: format, lint, typecheck, and 169 tests. Docker is not installed here, so the copy itself is unverified until the next Generate job.
