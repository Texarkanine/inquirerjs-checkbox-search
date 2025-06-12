# Task List: CodeRabbit Fixes Implementation

## Overview

Implementing three critical fixes identified by CodeRabbit review:

1. TTY detection for cursor hide/show (prevents crashes)
2. Instructions: false logic fix (functional bug)
3. Process.stdout.rows test mocking (Node.js compatibility)

## Progress Tracking

- [x] **1. TTY Detection Fix**
  - [x] 1.1 Determine scope & test locations
  - [x] 1.2 Preparation (stub tests & interface)
  - [x] 1.3 Write tests
  - [x] 1.4 Write implementation
- [x] **2. Instructions: false Logic Fix**
  - [x] 2.1 Determine scope & test locations
  - [x] 2.2 Preparation (stub tests & interface)
  - [x] 2.3 Write tests
  - [x] 2.4 Write implementation
- [x] **3. Test Mocking Compatibility Fix**

  - [x] 3.1 Determine scope & test locations
  - [x] 3.2 Preparation (stub tests & interface)
  - [x] 3.3 Write tests
  - [x] 3.4 Write implementation

- [ ] **4. Final Validation**
  - [x] 4.1 Run full test suite
  - [x] 4.2 Verify all fixes work together
  - [x] 4.3 Test in non-TTY environment  
  - [ ] 4.4 Commit changes

## Implementation Details

### 1. TTY Detection Fix

**Problem:** `process.stdout.write(ansiEscapes.cursorHide/Show)` crashes when stdout isn't a TTY
**Location:** `src/index.ts` lines 427-433 (useEffect hook)
**Solution:** Wrap cursor operations in `if (process.stdout.isTTY)` checks
**Tests needed:** Mock non-TTY environment, verify no crashes

### 2. Instructions: false Logic Fix

**Problem:** `instructions: false` shows default help instead of hiding it
**Location:** `src/index.ts` lines 712-721 (help tip rendering)
**Solution:** Check `config.instructions !== false` before rendering help
**Tests needed:** Verify `instructions: false` hides help, `instructions: string` shows custom, `instructions: true` shows default

### 3. Test Mocking Compatibility Fix

**Problem:** `Object.defineProperty(process.stdout, 'rows')` fails on Node.js ≥20
**Location:** `src/index.test.ts` lines 1576-1603 and similar tests
**Solution:** Use `vi.spyOn(process.stdout, 'rows', 'get').mockReturnValue()` instead
**Tests needed:** Ensure mocking works across Node versions

## Success Criteria

- [ ] All existing tests pass
- [ ] New regression tests pass
- [ ] No crashes in non-TTY environments
- [ ] `instructions: false` properly hides help
- [ ] Tests work on Node.js 18, 20, and 22
- [ ] Clean, maintainable code following project patterns

## Notes

- Following strict TDD: tests written first for each fix
- Each fix is independent and can be implemented separately
- Focus on backward compatibility and defensive programming
