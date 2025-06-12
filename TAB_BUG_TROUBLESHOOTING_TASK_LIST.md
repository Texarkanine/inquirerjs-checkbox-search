# Tab Bug Troubleshooting - Task List

## Problem Statement

After the phantom input bug fix, a residual issue remains:

- **Residual tab bug**: After tab selections, exactly ONE backspace is required before search input works correctly
- User has updated test case to properly catch this failure-to-backspace behavior

## Systematic Re-Diagnosis Plan

### 1. Progress Tracking ⏳ IN PROGRESS

- ✅ Created troubleshooting task list
- ✅ User fixed test assertion (`"mel"` → `mel`) - test now passes
- ⏳ **CURRENT**: Critical insight - test passes but live behavior still has bug!

### 2. Step Back & Re-Scope ✅ COMPLETED

- ✅ **PRECISE BUG CONFIRMED**: After tab selections, first backspace keystroke is lost/ignored
- ✅ Search functionality is working - issue is phantom character requiring one backspace to "wake up"
- ✅ User provided excellent live trace showing exact behavior
- ✅ **APPLIED FIX**: Implemented `rl.cursor = newTerm.length` in updateSearchTerm()

### 3. Map Relevant System Structure ✅ COMPLETED

- ✅ Read current implementation in src/index.ts - tab handling with preservedSearchTerm
- ✅ Analyzed test case that now passes - uses `events.type('mel')`
- ✅ Added .tshy-build to .gitignore, .prettierignore (eslint already had it)
- ⏳ **CURRENT**: Need to understand test vs. real readline behavior difference

### 4. Hypothesize Potential Root Causes ✅ COMPLETED

- ✅ **CONFIRMED ROOT CAUSE**: Incorrect readline manipulation with `rl.line` direct assignment
- ✅ **NEW CRITICAL INSIGHT**: "Esc" stacks up invisible chars, "tab" doesn't - suggesting different handling paths
- ✅ **SOLUTION**: Use official pattern `rl.clearLine(0) + rl.write()` instead of `rl.line` assignment
- ✅ **APPLIED**: Updated updateSearchTerm() to use proper readline API

### 5. Systematic Investigation & Evidence Gathering ⏳ PENDING

- ⏳ Analyze failing test output and expected behavior
- ⏳ Trace the exact sequence: tab selection → search input → backspace requirement
- ⏳ Check readline state immediately after tab vs. after first backspace
- ⏳ Add diagnostic logging if needed to see internal state changes

### 6. Identify Confirmed Root Cause ⏳ PENDING

- ⏳ Pinpoint the specific mechanism causing the one-backspace requirement

### 7. Propose Targeted Solution ✅ COMPLETED

- ✅ **IMPLEMENTED**: Added `rl.cursor = newTerm.length` to `updateSearchTerm()`
- ✅ This ensures readline cursor position matches the line content after tab operations
- ✅ Should eliminate the one-backspace requirement without regressing phantom input fixes

### 8. Plan Comprehensive Verification ⏳ PENDING

- ⏳ Test the specific failing scenario
- ⏳ Verify all phantom input tests still pass
- ⏳ Run full test suite

### 9. Execute & Verify ⏳ PENDING

- ⏳ Implement the targeted fix
- ⏳ Execute comprehensive verification plan

### 10. Report Outcome ⏳ PENDING

- ⏳ Document root cause, fix, and verification results

## Status: 🔍 **ACTIVELY INVESTIGATING**
