# Project Brief

## User Story

As the maintainer of `inquirerjs-checkbox-search`, I want the test suite to exercise the full supported surface with honest, high-kill-power oracles, so that a green suite is real evidence the library works — not a number bought with vacuous or presentation-coupled tests.

## Use-Case(s)

### Use-Case 1: A contributor changes prompt logic

A behavior-changing edit to `src/index.ts` fails the suite, because every load-bearing branch is both covered and asserted on semantically.

### Use-Case 2: The maintainer reads a mutation score

The reported mutation score means something: the denominator contains only mutants that represent the library's contract, and the numerator was earned by real oracles.

## Requirements

Full intent as specified in [issue #147](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/147). Summarized:

1. **Coverage** — branch and line coverage to 100% on the supported surface, closing Stryker `NoCoverage` mutants. Known holes: async `validate()` settle/reject paths, `validate === false`, navigation while `status !== 'idle'`, TTY cursor hide/show cleanup.
2. **SLOBAC** — run audit loops over the suite; fix High smells that destroy kill-power (vacuous-assertion, pseudo-tested, naming-lies, semantic-redundancy).
3. **Mutation** — kill load-bearing logic survivors with stronger assertions; cut junk mutants (equivalent mutants, pure presentation literals) from the denominator via `mutator.excludedMutations` / targeted `// Stryker disable`; re-run; optionally add a `thresholds.break` near the cleaned score.

## Constraints

1. **No spurious score-buying.** Asserting exact UX copy, theme defaults, or empty-string init to kill presentation mutants is forbidden. Prefer semantic oracles.
2. **No keeping weak tests** so that hard mutants stay permanently unkillable.
3. **Coverage % is not success** without kill-power.
4. **TDD** per the workspace rule: tests first for any product-code change.
5. **Tracking:** single issue (#147), three PRs referencing `[#147]`, each merged to `main` before the next begins.
6. Existing quality gate (`npm run quality:check`) must stay green; `npm run format` before every push.

## Acceptance Criteria

1. Branch and line coverage at 100% on the supported surface, or every remaining gap explicitly justified as out-of-surface.
2. SLOBAC audit reports no remaining High smells.
3. Mutation score driven as high as is honest, with every exclusion from the denominator individually justified as an equivalent mutant or pure presentation.
4. Every stage's changes merged to `main` via its own PR referencing `[#147]`.
