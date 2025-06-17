# Buffer Calculation Update Tasks

## Analysis

- [x] Identify the issue (buffer value not always added if autoBufferDescriptions is true)
- [x] Locate affected files (src/index.ts)
- [x] Analyze current implementation
- [x] Identify affected tests

## Changes Required

- [x] Update buffer calculation in `resolvePageSize` function to always add buffer if specified
- [x] Update failing test case "should ignore buffer when autoBufferDescriptions is enabled"
- [x] Fix other test cases if any are affected
- [x] Run all tests to ensure we didn't break anything

## Validation

- [x] Run specific tests for the pagesize configuration
- [x] Run all tests to make sure everything still works
