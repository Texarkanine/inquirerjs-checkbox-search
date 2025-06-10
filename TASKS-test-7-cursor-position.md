# Test Fix: Cursor Position on Deselection

✅ **FIXED**

## Problem Statement
Test: "should maintain cursor position when toggling selection on non-first items"
**Issue**: When toggling selection on a non-first item (like "Banana"), the cursor jumps back to the first item instead of staying on the toggled item.

## Expected vs Actual
- **Expected**: After selecting and then deselecting "Banana", cursor should remain on "Banana"
- **Actual**: Cursor jumps back to first item after deselection
- **Error**: `expected '  ◯ Banana' to contain '❯'` - cursor indicator is missing from Banana line

## Investigation Steps

### 1. Understand Test Scenario ✅
- [x] Analyze the test setup and navigation sequence
- [x] Identify when cursor position should be maintained vs reset
- [x] Check if this is related to selection toggling or rendering logic

**Analysis**: The test navigates to "Banana" (second item), selects it with tab, then deselects it with tab again. The cursor should stay on "Banana" after deselection, but it's jumping back to the first item ("Apple").

### 2. Debug Selection Toggle Logic ✅
- [x] Examine how `setActive` state is managed during selection changes
- [x] Check if selection toggling inadvertently resets cursor position
- [x] Verify if the issue is in keypress handler or state management

**ISSUE FOUND**: The cursor position is being reset by this useEffect on line 393:
```typescript
// Reset active index when filtered items change
useEffect(() => {
  setActive(0);
}, [filteredItems]);
```

When selection is toggled, `filteredItems` is recalculated (due to state changes in `allItems`), which triggers this effect and resets the cursor to position 0. This is the root cause of the bug!

### 3. Debug Rendering Logic
- [ ] Check if rendering logic incorrectly resets cursor position after selection changes
- [ ] Verify cursor position is preserved across re-renders
- [ ] Examine interaction between selection state and active item state

### 4. Implement Fix ✅
- [x] Ensure cursor position is maintained during selection toggles
- [x] Verify fix doesn't break other navigation behavior
- [x] Test with different item positions (first, middle, last)

**SOLUTION**: Modified the `useEffect` that resets active index to preserve cursor position when the filtered items haven't actually changed, only their selection state has changed. The effect now:
1. Checks if the currently active item is still in the filtered list
2. If so, preserves its position instead of resetting to 0
3. Only resets to 0 when filtering actually changes the set of items

### 5. Verify Fix ✅
- [x] Run specific test to confirm cursor position is maintained
- [x] Run full test suite to ensure no regressions
- [x] Verify navigation still works correctly after selection changes

**SUCCESS**: The test "should maintain cursor position when toggling selection on non-first items" is now PASSING! ✅

## Notes
- This appears to be a UX regression where the cursor position behavior changed
- The issue is specifically with maintaining cursor position after toggling selection
- May be related to how `active` state interacts with selection changes 