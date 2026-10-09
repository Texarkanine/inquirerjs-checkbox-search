# Tasks

## Current Task: issue-190

**Complexity:** Level 1

### What broke

The shadow verdict marked `basic` CHANGED when the frame sequence had no visual difference. A passing screen held for a few frames can be missed, and the retry treated any second disagreement between the sides as CHANGED.

### Why

`assessFingerprints` compared every collapsed frame-text image, including states held for one to five frames. On a retry it returned CHANGED whenever base and head disagreed again, without checking that each side matched its own first recording.

### What changed

- Frame runs held for fewer than 8 frames are left out of the compared fingerprint.
- A retry is CHANGED only when each side repeats its first frames and those frames still differ. A disagreement that a side does not repeat is NOISY.
- The fingerprint command prints each side's collapsed runs and hold counts. The shadow step already prints that stdout to the job log.

### Files

- `scripts/demo-fingerprint.ts`
- `scripts/demo-fingerprint.test.ts`
