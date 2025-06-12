# Task List: CodeRabbit Feedback Fixes

**Project**: inquirerjs-checkbox-search  
**Created**: 2025-01-28  
**Status**: In Progress

## Overview

Addressing CodeRabbit's feedback from PR #6, implementing fixes in order of impact.

## Tasks

### 1. **CRITICAL**: Fix Arrow-Key Navigation Bug with Separators

- **Priority**: HIGH - Critical bug affecting core functionality
- **Status**: 🟡 In Progress
- **Description**: Arrow-key navigation selects wrong items when separators exist due to index confusion
- **Steps**:
  - [x] Create example demonstrating the bug with separators
  - [ ] Write failing tests for navigation with separators
  - [ ] Fix index calculation in navigation logic
  - [ ] Verify all tests pass
  - [ ] Git commit the fix

### 1.5. **CRITICAL**: Fix Cursor Visibility Issue

- **Priority**: HIGH - Visual/UX issue affecting all prompts
- **Status**: 🔴 Not Started
- **Description**: Cursor is visible during prompt when it should be hidden (like other inquirer prompts)
- **Steps**:
  - [ ] Import ansi-escapes from @inquirer/core
  - [ ] Add cursor hiding on prompt start
  - [ ] Add cursor showing on prompt end
  - [ ] Test cursor behavior
  - [ ] Git commit the fix

### 2. **ARCHITECTURAL**: Refactor Side-Effect Description Logic

- **Priority**: MEDIUM - Affects maintainability and React best practices
- **Status**: 🔴 Not Started
- **Description**: Replace brittle side-effect based `currentDescription` with proper React patterns
- **Steps**:
  - [ ] Write tests for description display behavior
  - [ ] Refactor to use `useMemo` for active description calculation
  - [ ] Remove side-effect mutations from render logic
  - [ ] Verify all tests pass
  - [ ] Git commit the refactor

### 3. **DESIGN**: Address Primitive Value Assumption

- **Priority**: MEDIUM - Affects API robustness and user experience
- **Status**: 🔴 Not Started
- **Description**: Handle non-primitive values properly or document the constraint
- **Steps**:
  - [ ] Write tests for object values behavior
  - [ ] Decide on approach: document constraint or add support
  - [ ] Implement chosen solution
  - [ ] Update documentation/types as needed
  - [ ] Git commit the changes

### 4. **OPTIMIZATION**: Memoize Dynamic Page Size Calculation

- **Priority**: LOW - Minor performance optimization
- **Status**: 🔴 Not Started
- **Description**: Prevent unnecessary recalculation of page size on every render
- **Steps**:
  - [ ] Write performance tests if needed
  - [ ] Add `useMemo` around page size calculation
  - [ ] Verify behavior remains identical
  - [ ] Git commit the optimization

## Progress Tracking

- **Total Tasks**: 4
- **Completed**: 0
- **In Progress**: 1
- **Not Started**: 3

## Next Steps

1. Create separator example to demonstrate navigation bug
2. Write failing tests for separator navigation
3. Implement the navigation fix
4. Move to next task in priority order
