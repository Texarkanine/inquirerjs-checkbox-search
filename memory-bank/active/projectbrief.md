# Project Brief

Fix the 8 test smells identified in `slobac/audit.md` across 4 test files.

## Findings to Fix

1. **`descriptions.test.ts`** — `should use cyan/blue styling for descriptions at bottom`
   - Smells: `naming-lies` + `vacuous-assertion`
   - Remediation: Rename to match currently-tested behavior (description text placement/visibility), or strengthen assertions to verify explicit styling output.

2. **`navigation.test.ts`** — `should loop navigation when enabled`
   - Smells: `naming-lies` + `vacuous-assertion`
   - Remediation: Add boundary-wrap assertions (first→up→last, last→down→first), or rename to a weaker claim matching current checks.

3. **`search-filtering.test.ts`** — `should handle "j" key input properly for search (vim navigation bug fix)`
   - Smell: `deliverable-fossils`
   - Remediation: Rename to behavior-focused wording, e.g. "adds `j` to search term instead of navigating".

4. **`search-filtering.test.ts`** — `should handle "k" key input properly for search (vim navigation bug fix)`
   - Smell: `deliverable-fossils`
   - Remediation: Rename to behavior-focused wording, e.g. "adds `k` to search term instead of navigating".

5. **`selection.test.ts`** — `should detect readline tab-to-spaces conversion bug`
   - Smell: `deliverable-fossils`
   - Remediation: Rename to a durable behavior claim, e.g. "keeps search token contiguous after tab selection and subsequent typing".

6. **`navigation.test.ts` + `separators.test.ts`** — semantic redundancy between the two separator tests
   - Smell: `semantic-redundancy`
   - Remediation: Keep `navigation.test.ts` as canonical, migrate any unique intent from `separators.test.ts`, then delete the duplicate.
