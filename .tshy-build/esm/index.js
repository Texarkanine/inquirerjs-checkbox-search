import { createPrompt, useState, useKeypress, usePagination, useEffect, useRef, useMemo, usePrefix, makeTheme, isEnterKey, Separator, } from '@inquirer/core';
import colors from 'yoctocolors-cjs';
import figures from '@inquirer/figures';
import ansiEscapes from 'ansi-escapes';
/**
 * Default theme for the checkbox-search prompt
 */
const checkboxSearchTheme = {
    icon: {
        checked: colors.green(figures.circleFilled),
        unchecked: figures.circle,
        cursor: figures.pointer,
    },
    style: {
        answer: colors.cyan,
        message: colors.cyan,
        error: (text) => colors.yellow(`> ${text}`),
        help: colors.dim,
        highlight: colors.cyan,
        searchTerm: colors.cyan,
        description: colors.cyan,
        disabled: colors.dim,
    },
    helpMode: 'always',
};
/**
 * Type guard to check if an item is selectable (not separator or disabled)
 * @param item - The item to check
 * @returns True if the item can be selected
 */
function isSelectable(item) {
    return !Separator.isSeparator(item) && !item.disabled;
}
/**
 * Type guard to check if an item is checked/selected
 * @param item - The item to check
 * @returns True if the item is selected
 */
function isChecked(item) {
    return isSelectable(item) && Boolean(item.checked);
}
/**
 * Toggle the selection state of an item
 * @param item - The item to toggle
 * @returns The item with toggled selection state
 */
function toggle(item) {
    return isSelectable(item) ? { ...item, checked: !item.checked } : item;
}
/**
 * Normalize choice inputs into consistent format
 * @param choices - Raw choices array (strings, choice objects, separators)
 * @returns Normalized array of items
 */
function normalizeChoices(choices) {
    return choices.map((choice) => {
        if (Separator.isSeparator(choice))
            return choice;
        if (typeof choice === 'string') {
            return {
                value: choice,
                name: choice,
                short: choice,
                disabled: false,
                checked: false,
            };
        }
        const name = choice.name ?? String(choice.value);
        const normalizedChoice = {
            value: choice.value,
            name,
            short: choice.short ?? name,
            disabled: choice.disabled ?? false,
            checked: choice.checked ?? false,
        };
        if (choice.description) {
            normalizedChoice.description = choice.description;
        }
        return normalizedChoice;
    });
}
/**
 * Default filter function for static choices
 * @param items - Array of normalized choices
 * @param term - Search term
 * @returns Filtered array of choices
 */
function defaultFilter(items, term) {
    if (!term.trim())
        return items;
    const searchTerm = term.toLowerCase().normalize('NFD');
    return items.filter((item) => {
        const name = item.name.toLowerCase().normalize('NFD');
        const description = (item.description ?? '').toLowerCase().normalize('NFD');
        const value = String(item.value).toLowerCase().normalize('NFD');
        return (name.includes(searchTerm) ||
            description.includes(searchTerm) ||
            value.includes(searchTerm));
    });
}
/**
 * Calculate dynamic page size based on terminal height
 * @param fallbackPageSize - Default page size to use if terminal height is not available
 * @returns Calculated page size
 */
function calculateDynamicPageSize(fallbackPageSize) {
    try {
        // Get terminal height from process.stdout.rows
        const terminalHeight = process.stdout.rows;
        if (!terminalHeight || terminalHeight < 1) {
            // Fallback to static page size if terminal height is not available
            return fallbackPageSize;
        }
        // Reserve space for UI elements:
        // - 1 line for the prompt message
        // - 1 line for help instructions
        // - 1 line for search input (if present)
        // - 1 line for error messages (if present)
        // - 1 line for description (if present)
        // - 1 line for buffer/spacing
        const reservedLines = 6;
        // Calculate available lines for choices
        const availableLines = Math.max(terminalHeight - reservedLines, 2);
        // Cap the maximum page size to prevent overwhelming display
        const maxPageSize = Math.min(availableLines, 50);
        // Ensure minimum page size for usability
        const minPageSize = 2;
        return Math.max(minPageSize, Math.min(maxPageSize, availableLines));
    }
    catch {
        // If there's any error accessing terminal dimensions, fallback gracefully
        return fallbackPageSize;
    }
}
/**
 * Main checkbox-search prompt implementation
 *
 * A multi-select prompt with text filtering/search capability that combines
 * the functionality of checkbox and search prompts from inquirer.js.
 *
 * Features:
 * - Real-time search/filtering of options
 * - Multi-selection with checkboxes
 * - Keyboard navigation and shortcuts
 * - Support for both static and async data sources
 * - Customizable themes and validation
 *
 * @param config - Configuration options for the prompt
 * @param done - Callback function called when prompt completes
 */
export default createPrompt((config, done) => {
    // Stable reference for empty array to prevent unnecessary recalculations
    const emptyArray = useMemo(() => [], []);
    // Configuration with defaults
    const { pageSize: configPageSize, loop = true, required, validate = () => true, default: defaultValues = emptyArray, } = config;
    // Calculate effective page size
    // If pageSize is specified, use it as fixed size
    // If not specified, use auto-sizing with fallback 7
    const pageSize = configPageSize !== undefined
        ? configPageSize // Fixed page size
        : calculateDynamicPageSize(7); // Auto page size with fallback 7
    const theme = makeTheme(checkboxSearchTheme, config.theme);
    // State management hooks
    const [status, setStatus] = useState('idle');
    const prefix = usePrefix({ status, theme });
    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [searchError, setSearchError] = useState();
    const allItemsRef = useRef([]);
    // Initialize choices directly like the original checkbox prompt
    const [allItems, setAllItems] = useState(() => {
        if (config.choices) {
            const normalized = normalizeChoices(config.choices);
            // Apply default selections
            return normalized.map((item) => {
                if (isSelectable(item) && defaultValues.includes(item.value)) {
                    return { ...item, checked: true };
                }
                return item;
            });
        }
        return [];
    });
    // Store the active item value instead of active index
    const [activeItemValue, setActiveItemValue] = useState(null);
    // Compute filtered items based on search term and filtering logic
    const filteredItems = useMemo(() => {
        // Async source mode - use allItems directly (source handles filtering)
        if (config.source) {
            return allItems;
        }
        // Static mode - filter allItems based on search term
        if (!searchTerm.trim()) {
            return allItems;
        }
        // Filter using provided filter function or default case-insensitive filter
        const filterFn = config.filter || defaultFilter;
        const selectableItems = allItems.filter((item) => !Separator.isSeparator(item));
        const filtered = filterFn(selectableItems, searchTerm);
        // Create a set of filtered values for efficient lookup
        const filteredValues = new Set(filtered.map((item) => item.value));
        // Rebuild preserving current allItems state (including checked status)
        const result = [];
        for (const item of allItems) {
            if (Separator.isSeparator(item)) {
                result.push(item);
            }
            else if (filteredValues.has(item.value)) {
                result.push(item); // This preserves the current checked state from allItems
            }
        }
        return result;
    }, [allItems, searchTerm, config.source, config.filter]);
    // Compute active index from activeItemValue
    const active = useMemo(() => {
        if (activeItemValue === null) {
            // No active item set, default to first selectable
            const firstSelectableIndex = filteredItems.findIndex((item) => isSelectable(item));
            return firstSelectableIndex !== -1 ? firstSelectableIndex : 0;
        }
        // Find the item with the active value
        const activeIndex = filteredItems.findIndex((item) => !Separator.isSeparator(item) &&
            item.value === activeItemValue);
        if (activeIndex !== -1) {
            return activeIndex;
        }
        // Active item not found in filtered list, default to first selectable
        const firstSelectableIndex = filteredItems.findIndex((item) => isSelectable(item));
        return firstSelectableIndex !== -1 ? firstSelectableIndex : 0;
    }, [filteredItems, activeItemValue]);
    // Update activeItemValue when active index changes (e.g., when filtering results in auto-focus)
    useEffect(() => {
        const activeItem = filteredItems[active];
        if (activeItem && !Separator.isSeparator(activeItem)) {
            const currentActiveValue = activeItem
                .value;
            if (activeItemValue !== currentActiveValue) {
                setActiveItemValue(currentActiveValue);
            }
        }
    }, [active, filteredItems, activeItemValue]);
    const [errorMsg, setError] = useState();
    // Handle async source - load data based on search term
    useEffect(() => {
        if (!config.source) {
            return;
        }
        const controller = new AbortController();
        // Set loading state and clear previous errors
        setStatus('loading');
        setSearchError(undefined);
        const result = config.source(searchTerm || undefined, {
            signal: controller.signal,
        });
        // Handle both Promise and non-Promise returns
        Promise.resolve(result)
            .then((choices) => {
            if (controller.signal.aborted)
                return;
            const normalizedChoices = normalizeChoices(choices);
            setAllItems(normalizedChoices);
            setStatus('idle');
        })
            .catch((error) => {
            if (controller.signal.aborted)
                return;
            console.error('Source function error:', error);
            setSearchError(error instanceof Error ? error.message : 'Failed to load choices');
            setStatus('idle');
        });
        return () => {
            controller.abort();
        };
    }, [config.source, searchTerm]);
    // Update ref whenever allItems changes
    useEffect(() => {
        allItemsRef.current = allItems;
    }, [allItems]);
    // Keyboard event handling
    useKeypress((key, rl) => {
        // Helper function to update search term in both readline and React state
        const updateSearchTerm = (newTerm) => {
            rl.line = newTerm;
            setSearchTerm(newTerm);
        };
        // Allow search input even during loading, but block other actions
        const isNavigationOrAction = key.name === 'up' ||
            key.name === 'down' ||
            key.name === 'tab' ||
            key.name === 'enter' ||
            key.name === 'escape';
        if (status !== 'idle' && isNavigationOrAction) {
            return;
        }
        // Clear any existing errors
        setError(undefined);
        // Handle Escape key - clear search term quickly
        if (key.name === 'escape') {
            updateSearchTerm(''); // Clear both readline and React state
            return;
        }
        // Handle navigation - ONLY actual arrow keys (not vim j/k keys)
        // This follows the official inquirer.js search approach
        if (key.name === 'up' || key.name === 'down') {
            rl.clearLine(0); // Clean readline state before navigation
            const direction = key.name === 'up' ? -1 : 1;
            const selectableIndexes = filteredItems
                .map((item, index) => ({ item, index }))
                .filter(({ item }) => isSelectable(item))
                .map(({ index }) => index);
            if (selectableIndexes.length === 0)
                return;
            const currentSelectableIndex = selectableIndexes.findIndex((index) => index >= active);
            let nextSelectableIndex = currentSelectableIndex + direction;
            if (loop) {
                if (nextSelectableIndex < 0)
                    nextSelectableIndex = selectableIndexes.length - 1;
                if (nextSelectableIndex >= selectableIndexes.length)
                    nextSelectableIndex = 0;
            }
            else {
                nextSelectableIndex = Math.max(0, Math.min(nextSelectableIndex, selectableIndexes.length - 1));
            }
            const nextSelectableItem = filteredItems[nextSelectableIndex];
            if (nextSelectableItem && isSelectable(nextSelectableItem)) {
                setActiveItemValue(nextSelectableItem.value);
            }
            return;
        }
        // Handle selection toggle with tab key
        if (key.name === 'tab') {
            const preservedSearchTerm = searchTerm;
            const activeItem = filteredItems[active];
            if (activeItem && isSelectable(activeItem)) {
                const activeValue = activeItem.value;
                // Set this as the active item value so cursor position is preserved
                setActiveItemValue(activeValue);
                setAllItems(allItems.map((item) => {
                    // Compare by value only for robust matching
                    if (!Separator.isSeparator(item) && item.value === activeValue) {
                        const toggled = toggle(item);
                        return toggled;
                    }
                    return item;
                }));
            }
            updateSearchTerm(preservedSearchTerm);
            // return to prevent tab from affecting search text:
            // Readline's tab completion in @inquirer/core can modify rl.line, adding spaces to the search text
            return;
        }
        // Handle submission
        if (isEnterKey(key)) {
            const selectedChoices = allItems.filter(isChecked);
            if (required && selectedChoices.length === 0) {
                setError('At least one choice must be selected');
                return;
            }
            const result = validate(selectedChoices);
            if (typeof result === 'string') {
                setError(result);
                return;
            }
            if (result === false) {
                setError('Invalid selection');
                return;
            }
            if (typeof result === 'object' && 'then' in result) {
                result
                    .then((isValid) => {
                    if (typeof isValid === 'string') {
                        setError(isValid);
                    }
                    else if (isValid === false) {
                        setError('Invalid selection');
                    }
                    else {
                        setStatus('done');
                        done(selectedChoices.map((choice) => choice.value));
                    }
                })
                    .catch(() => {
                    setError('Validation failed');
                });
                return;
            }
            setStatus('done');
            done(selectedChoices.map((choice) => choice.value));
            return;
        }
        // Handle all other input as search term updates EXCEPT tab
        // Only update search term for actual typing, not navigation keys
        if (!isNavigationOrAction) {
            // For general input, only update React state since rl.line is already current
            setSearchTerm(rl.line);
        }
    });
    // Track the current description for the active item
    let currentDescription;
    // Create renderItem function that's reactive to current state
    const renderItem = useMemo(() => {
        return ({ item, isActive }) => {
            const line = [];
            if (Separator.isSeparator(item)) {
                return colors.dim(item.separator);
            }
            // Look up checked state directly from allItems to get the current state
            const currentItem = allItems.find((allItem) => !Separator.isSeparator(allItem) &&
                allItem.value === item.value);
            const isChecked = currentItem?.checked || false;
            // Helper function to resolve icon (string or function)
            const resolveIcon = (icon, choiceText) => {
                return typeof icon === 'function' ? icon(choiceText) : icon;
            };
            const choiceName = item.name;
            const checkbox = resolveIcon(isChecked ? theme.icon.checked : theme.icon.unchecked, choiceName);
            const cursor = isActive
                ? resolveIcon(theme.icon.cursor, choiceName)
                : ' ';
            line.push(cursor, checkbox);
            let text = item.name;
            if (isActive) {
                text = theme.style.highlight(text);
                // Capture the description of the active item to display at bottom
                currentDescription = item.description;
            }
            else if (item.disabled) {
                text = theme.style.disabled(text);
            }
            line.push(text);
            // Show disabled reason if item is disabled (but no descriptions inline anymore)
            if (item.disabled) {
                const disabledReason = typeof item.disabled === 'string'
                    ? item.disabled
                    : 'disabled';
                line.push(theme.style.disabled(`(${disabledReason})`));
            }
            // NOTE: Removed the inline description display - descriptions now appear at bottom
            return line.join(' ');
        };
    }, [allItems, theme, config.theme]);
    // Setup pagination
    const page = usePagination({
        items: filteredItems,
        active,
        renderItem,
        pageSize,
        loop,
    });
    // Render the prompt
    const message = theme.style.message(config.message, status);
    let helpTip = '';
    if (theme.helpMode === 'always') {
        if (config.instructions) {
            helpTip = `\n${theme.style.help(`(${config.instructions})`)}`;
        }
        else {
            const tips = ['Tab to select', 'Enter to submit'];
            helpTip = `\n${theme.style.help(`(${tips.join(', ')})`)}`;
        }
    }
    let searchLine = '';
    // Always show search line when search functionality is available (static choices or async source)
    if (config.source || config.choices || searchTerm || status === 'loading') {
        const searchPrefix = status === 'loading' ? 'Loading...' : 'Search:';
        const styledTerm = searchTerm ? theme.style.searchTerm(searchTerm) : '';
        searchLine = `\n${searchPrefix} ${styledTerm}`;
    }
    let errorLine = '';
    if (errorMsg) {
        errorLine = `\n${theme.style.error(errorMsg)}`;
    }
    if (searchError) {
        errorLine = `\n${theme.style.error(`Error: ${searchError}`)}`;
    }
    let content = '';
    if (status === 'loading') {
        content = '\nLoading choices...';
    }
    else if (filteredItems.length === 0) {
        content = '\nNo choices available';
    }
    else {
        content = `\n${page}`;
    }
    // Add description of active item at the bottom (like original inquirer.js)
    let descriptionLine = '';
    if (currentDescription) {
        descriptionLine = `\n${theme.style.description(currentDescription)}`;
    }
    return `${prefix} ${message}${helpTip}${searchLine}${errorLine}${content}${descriptionLine}${ansiEscapes.cursorHide}`;
});
// Re-export Separator for convenience
export { Separator } from '@inquirer/core';
