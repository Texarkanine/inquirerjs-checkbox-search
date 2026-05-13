# Project Brief

Resolve [issue #110](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/110) by updating the `@inquirer/core` dependency from `^11.0.2` to `^11.1.2`, where `wrap-ansi` was replaced with `fast-wrap-ansi`, eliminating input lag when navigating large lists (~1,000+ items) with the arrow keys.

A performance test was evaluated and rejected as the correct approach: the lag is caused by `@inquirer/core` internals (not our code), timing-based tests are inherently flaky across CI environments, and tightening the semver range to `>=11.1.2` is a stronger, machine-independent guarantee than any threshold assertion we could write.

## Task ID

`issue-110-perf-dep-bump`
