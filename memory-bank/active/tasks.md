# Current Task: Promote demo verdicts out of shadow

**Complexity:** Level 3

## Open Questions

- [x] Which trees decide a release-please GIF amend? Head versus the merge-base reads SAME on a version bump, even when `docs/img/` is stale, because feature pull requests must not commit GIFs. A committed text fingerprint misses color. → Resolved: on a release pull request, compare the commit that last touched `docs/img/` with the release head, and amend only CHANGED, NEW, and REMOVED (see `memory-bank/active/creative/creative-release-gif-amend.md`)
- [x] How does the comment present REMOVED, UNSTABLE, and NOISY? Issue #190 section 4 specifies SAME, CHANGED, and NEW only. Those three verdicts exist in the detector. Calling them SAME would lie. Expanding every non-SAME verdict would open demos that are not a proven behavior change. → Resolved: collapse SAME, NOISY, and UNSTABLE, each with its own verdict word. Open CHANGED, NEW, and REMOVED (see `memory-bank/active/creative/creative-unspecified-verdicts.md`)
