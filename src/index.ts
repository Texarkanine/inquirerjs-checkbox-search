import {
  createPrompt,
  useState,
  useKeypress,
  usePagination,
  useEffect,
  useRef,
  useMemo,
  usePrefix,
  makeTheme,
  isEnterKey,
  Separator,
  type Theme,
  type Status,
} from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';
import colors from 'yoctocolors-cjs';
import figures from '@inquirer/figures';
import ansiEscapes from 'ansi-escapes';

/**
 * Theme configuration for the checkbox-search prompt
 */
type CheckboxSearchTheme = {
  icon: {
    checked: string | ((text: string) => string);
    unchecked: string | ((text: string) => string);
    cursor: string | ((text: string) => string);
    nocursor?: string | ((text: string) => string); // Space placeholder when cursor is not active
  };
  style: {
    message: (text: string) => string;
    error: (text: string) => string;
    help: (text: string) => string;
    highlight: (text: string) => string;
    searchTerm: (text: string) => string;
    description: (text: string) => string;
    disabled: (text: string) => string;
    checked: (text: string) => string;
  };
  helpMode: 'always' | 'never' | 'auto';
};

/**
 * Default theme for the checkbox-search prompt
 */
const checkboxSearchTheme: CheckboxSearchTheme = {
  icon: {
    checked: colors.green(figures.circleFilled),
    unchecked: figures.circle,
    cursor: figures.pointer,
    nocursor: ' ', // Default: single space when cursor is not active
  },
  style: {
    message: colors.cyan,
    error: (text: string) => colors.yellow(`> ${text}`),
    help: colors.dim,
    highlight: colors.cyan,
    searchTerm: colors.cyan,
    description: colors.cyan,
    disabled: colors.dim,
    checked: colors.green,
  },
  helpMode: 'always',
};

/**
 * Choice object for the checkbox-search prompt
 */
export type Choice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  short?: string;
  disabled?: boolean | string;
  checked?: boolean;
  type?: never;
};

/**
 * Normalized choice object used internally
 */
export type NormalizedChoice<Value> = {
  value: Value;
  name: string;
  description?: string;
  short: string;
  disabled: boolean | string;
  checked: boolean;
};

/**
 * Configuration options for the checkbox-search prompt
 */
export type PageSizeConfig = {
  base?: number;
  max?: number;
  min?: number;
  autoBufferDescriptions?: boolean;
  buffer?: number;
  minBuffer?: number;
  autoBufferCountsLineWidth?: boolean;
};

export type PageSize = number | PageSizeConfig;

type CheckboxSearchConfig<
  Value,
  ChoicesObject =
    | ReadonlyArray<string | Separator>
    | ReadonlyArray<Choice<Value> | Separator>,
> = {
  message: string;
  prefix?: string;
  pageSize?: PageSize;
  instructions?: string | boolean;

  // Either choices or source must be provided
  choices?: ChoicesObject extends ReadonlyArray<string | Separator>
    ? ChoicesObject
    : ReadonlyArray<Choice<Value> | Separator>;
  source?: (
    term: string | undefined,
    opt: { signal: AbortSignal },
  ) => ChoicesObject extends ReadonlyArray<string | Separator>
    ? ChoicesObject | Promise<ChoicesObject>
    :
        | ReadonlyArray<Choice<Value> | Separator>
        | Promise<ReadonlyArray<Choice<Value> | Separator>>;

  // Search and filtering options
  filter?: (
    items: ReadonlyArray<NormalizedChoice<Value>>,
    term: string,
  ) => ReadonlyArray<NormalizedChoice<Value>>;

  // Selection options
  loop?: boolean;
  required?: boolean;
  validate?: (
    choices: ReadonlyArray<NormalizedChoice<Value>>,
  ) => boolean | string | Promise<string | boolean>;

  // UI customization
  theme?: PartialDeep<Theme<CheckboxSearchTheme>>;
  default?: ReadonlyArray<Value>;
};

/**
 * Internal item type (choice or separator)
 */
type Item<Value> = NormalizedChoice<Value> | Separator;

/**
 * Type guard to check if an item is selectable (not separator or disabled)
 * @param item - The item to check
 * @returns True if the item can be selected
 */
function isSelectable<Value>(
  item: Item<Value>,
): item is NormalizedChoice<Value> {
  return !Separator.isSeparator(item) && !item.disabled;
}

/**
 * Type guard to check if an item is checked/selected
 * @param item - The item to check
 * @returns True if the item is selected
 */
function isChecked<Value>(item: Item<Value>): item is NormalizedChoice<Value> {
  return isSelectable(item) && Boolean(item.checked);
}

/**
 * Toggle the selection state of an item
 * @param item - The item to toggle
 * @returns The item with toggled selection state
 */
function toggle<Value>(item: Item<Value>): Item<Value> {
  return isSelectable(item) ? { ...item, checked: !item.checked } : item;
}

/**
 * Normalize choice inputs into consistent format
 * @param choices - Raw choices array (strings, choice objects, separators)
 * @returns Normalized array of items
 */
function normalizeChoices<Value>(
  choices:
    | ReadonlyArray<string | Separator>
    | ReadonlyArray<Choice<Value> | Separator>,
): Item<Value>[] {
  return choices.map((choice) => {
    if (Separator.isSeparator(choice)) return choice;

    if (typeof choice === 'string') {
      return {
        value: choice as Value,
        name: choice,
        short: choice,
        disabled: false,
        checked: false,
      };
    }

    const name = choice.name ?? String(choice.value);
    const normalizedChoice: NormalizedChoice<Value> = {
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
function defaultFilter<Value>(
  items: ReadonlyArray<NormalizedChoice<Value>>,
  term: string,
): ReadonlyArray<NormalizedChoice<Value>> {
  if (!term.trim()) return items;

  const searchTerm = term.toLowerCase().normalize('NFD');
  return items.filter((item) => {
    const name = item.name.toLowerCase().normalize('NFD');
    const description = (item.description ?? '').toLowerCase().normalize('NFD');
    const value = String(item.value).toLowerCase().normalize('NFD');
    return (
      name.includes(searchTerm) ||
      description.includes(searchTerm) ||
      value.includes(searchTerm)
    );
  });
}

/**
 * Validate PageSizeConfig object for correctness
 * @param config - PageSizeConfig to validate
 * @throws Error if validation fails
 */
export function validatePageSizeConfig(config: PageSizeConfig): void {
  if (config.min !== undefined && config.min < 1) {
    throw new Error('PageSize min cannot be less than 1');
  }

  if (config.base !== undefined && config.base < 1) {
    throw new Error('PageSize base cannot be less than 1');
  }

  if (config.buffer !== undefined && config.buffer < 0) {
    throw new Error('PageSize buffer cannot be negative');
  }

  if (config.minBuffer !== undefined && config.minBuffer < 0) {
    throw new Error('PageSize minBuffer cannot be negative');
  }

  if (
    config.min !== undefined &&
    config.max !== undefined &&
    config.min > config.max
  ) {
    throw new Error(
      `PageSize min (${config.min}) cannot be greater than max (${config.max})`,
    );
  }
}

/**
 * Calculate the maximum number of lines needed for descriptions across all items
 * @param items - Array of items to analyze
 * @param countLineWidth - Whether to consider terminal width for line wrapping
 * @returns Maximum lines needed by any description
 */
export function calculateDescriptionLines<Value>(
  items: readonly Item<Value>[],
  countLineWidth: boolean,
): number {
  let maxLines = 0;

  for (const item of items) {
    if (Separator.isSeparator(item) || !item.description) {
      continue;
    }

    let lines: number;
    if (countLineWidth) {
      // Consider terminal width for wrapping
      const terminalWidth = process.stdout.columns || 80;
      const descriptionLines = item.description.split('\n');
      lines = descriptionLines.reduce((total, line) => {
        return total + (Math.ceil(line.length / terminalWidth) || 1);
      }, 0);
    } else {
      // Simple newline counting
      lines = item.description.split('\n').length;
    }

    maxLines = Math.max(maxLines, lines);
  }

  return maxLines;
}

/**
 * Resolve PageSize configuration to a final numeric page size
 * @param pageSize - PageSize configuration (number or PageSizeConfig)
 * @param items - Current items to consider for auto-buffering
 * @returns Final resolved page size
 */
export function resolvePageSize<Value>(
  pageSize: PageSize,
  items: readonly Item<Value>[],
): number {
  // Handle simple number case (backward compatibility)
  if (typeof pageSize === 'number') {
    return pageSize;
  }

  // Validate the configuration
  validatePageSizeConfig(pageSize);

  // Step 1: Determine base page size
  let basePageSize: number;
  if (pageSize.base !== undefined) {
    basePageSize = pageSize.base;
  } else {
    // Auto-calculate using existing logic
    basePageSize = calculateDynamicPageSize(7);
  }

  // Step 2: Calculate buffer reduction
  let buffer = 0;

  // 2a: Start at 0 ✓

  // 2b: If autoBufferDescriptions, add max description lines
  if (pageSize.autoBufferDescriptions) {
    buffer += calculateDescriptionLines(
      items,
      pageSize.autoBufferCountsLineWidth || false,
    );
  } else {
    // 2c: Add buffer value (only if not auto-buffering)
    buffer += pageSize.buffer || 0;
  }

  // 2d: Ensure at least minBuffer
  if (pageSize.minBuffer !== undefined) {
    buffer = Math.max(buffer, pageSize.minBuffer);
  }

  // Step 3: Subtract buffer from base
  let finalPageSize = basePageSize - buffer;

  // Step 4: Apply min/max constraints
  if (pageSize.min !== undefined) {
    finalPageSize = Math.max(finalPageSize, pageSize.min);
  }

  if (pageSize.max !== undefined) {
    finalPageSize = Math.min(finalPageSize, pageSize.max);
  }

  // Ensure minimum of 1
  return Math.max(1, finalPageSize);
}

/**
 * Calculate dynamic page size based on terminal height
 * @param fallbackPageSize - Default page size to use if terminal height is not available
 * @returns Calculated page size
 */
export function calculateDynamicPageSize(fallbackPageSize: number): number {
  let rawPageSize: number;

  try {
    // Get terminal height from process.stdout.rows
    const terminalHeight = process.stdout.rows;

    if (!terminalHeight || terminalHeight < 1) {
      // Fallback to static page size if terminal height is not available
      rawPageSize = fallbackPageSize;
    } else {
      // Reserve space for UI elements:
      // - 1 line for the prompt message
      // - 1 line for help instructions
      // - 1 line for search input (if present)
      // - 1 line for error messages (if present)
      // - 1 line for description (if present)
      // - 1 line for buffer/spacing
      const reservedLines = 6;

      // Calculate available lines for choices
      rawPageSize = terminalHeight - reservedLines;
    }
  } catch {
    // If there's any error accessing terminal dimensions, fallback gracefully
    rawPageSize = fallbackPageSize;
  }

  // Ensure minimum page size for usability and cap maximum to prevent overwhelming display
  return Math.max(2, Math.min(rawPageSize, 50));
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
export default createPrompt(
  <Value>(
    config: CheckboxSearchConfig<Value>,
    done: (value: Array<Value>) => void,
  ) => {
    // Stable reference for empty array to prevent unnecessary recalculations
    const emptyArray: ReadonlyArray<Value> = useMemo(() => [], []);

    // Configuration with defaults
    const {
      pageSize: configPageSize,
      loop = true,
      required,
      validate = () => true,
      default: defaultValues = emptyArray,
    } = config;

    const theme = makeTheme<CheckboxSearchTheme>(
      checkboxSearchTheme,
      config.theme,
    );

    // State management hooks
    const [status, setStatus] = useState<Status>('idle');
    const prefix = usePrefix({ status, theme });

    // Search state
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchError, setSearchError] = useState<string>();

    const allItemsRef = useRef<ReadonlyArray<Item<Value>>>([]);

    // Initialize choices directly like the original checkbox prompt
    const [allItems, setAllItems] = useState<ReadonlyArray<Item<Value>>>(() => {
      if (config.choices) {
        const normalized = normalizeChoices<Value>(config.choices);
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

    // Calculate effective page size (memoized with terminal size tracking)
    // Use new resolvePageSize function to handle both number and PageSizeConfig
    const terminalHeight = process.stdout.rows; // Track terminal size for memoization
    const pageSize = useMemo(
      () => {
        if (configPageSize !== undefined) {
          return resolvePageSize(configPageSize, allItems);
        } else {
          // Default behavior - auto-calculate
          return calculateDynamicPageSize(7);
        }
      },
      [configPageSize, terminalHeight, allItems], // Recalculate when config, terminal, OR items change
    );

    // Store the active item value instead of active index
    const [activeItemValue, setActiveItemValue] = useState<Value | null>(null);

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
      const selectableItems = allItems.filter(
        (item) => !Separator.isSeparator(item),
      ) as ReadonlyArray<NormalizedChoice<Value>>;
      const filtered = filterFn(selectableItems, searchTerm);

      // Create a set of filtered values for efficient lookup
      const filteredValues = new Set(filtered.map((item) => item.value));

      // Rebuild preserving current allItems state (including checked status)
      const result: Item<Value>[] = [];

      for (const item of allItems) {
        if (Separator.isSeparator(item)) {
          result.push(item);
        } else if (filteredValues.has(item.value)) {
          result.push(item); // This preserves the current checked state from allItems
        }
      }

      return result;
    }, [allItems, searchTerm, config.source, config.filter]);

    // Compute active index from activeItemValue
    const active = useMemo(() => {
      if (activeItemValue === null) {
        // No active item set, default to first selectable
        const firstSelectableIndex = filteredItems.findIndex((item) =>
          isSelectable(item),
        );
        return firstSelectableIndex !== -1 ? firstSelectableIndex : 0;
      }

      // Find the item with the active value
      const activeIndex = filteredItems.findIndex(
        (item) =>
          !Separator.isSeparator(item) &&
          (item as NormalizedChoice<Value>).value === activeItemValue,
      );

      if (activeIndex !== -1) {
        return activeIndex;
      }

      // Active item not found in filtered list, default to first selectable
      const firstSelectableIndex = filteredItems.findIndex((item) =>
        isSelectable(item),
      );
      return firstSelectableIndex !== -1 ? firstSelectableIndex : 0;
    }, [filteredItems, activeItemValue]);

    // Update activeItemValue when active index changes (e.g., when filtering results in auto-focus)
    useEffect(() => {
      const activeItem = filteredItems[active];
      if (activeItem && !Separator.isSeparator(activeItem)) {
        const currentActiveValue = (activeItem as NormalizedChoice<Value>)
          .value;
        if (activeItemValue !== currentActiveValue) {
          setActiveItemValue(currentActiveValue);
        }
      }
    }, [active, filteredItems, activeItemValue]);

    const [errorMsg, setError] = useState<string>();

    // Hide cursor on mount, show on unmount (like other inquirer prompts)
    useEffect(() => {
      // Hide cursor when prompt starts (only in TTY environments)
      if (process.stdout.isTTY) {
        process.stdout.write(ansiEscapes.cursorHide);
      }

      // Show cursor when prompt ends (cleanup function)
      return () => {
        if (process.stdout.isTTY) {
          process.stdout.write(ansiEscapes.cursorShow);
        }
      };
    }, []);

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
        .then((choices: readonly (string | Separator | Choice<Value>)[]) => {
          if (controller.signal.aborted) return;

          const normalizedChoices = normalizeChoices<Value>(
            choices as ReadonlyArray<Choice<Value> | Separator>,
          );
          setAllItems(normalizedChoices);
          setStatus('idle');
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          console.error('Source function error:', error);
          setSearchError(
            error instanceof Error ? error.message : 'Failed to load choices',
          );
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
      const updateSearchTerm = (newTerm: string) => {
        rl.clearLine(0);
        rl.write(newTerm);
        setSearchTerm(newTerm);
      };
      // Allow search input even during loading, but block other actions
      const isNavigationOrAction =
        key.name === 'up' ||
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

        if (selectableIndexes.length === 0) return;

        const currentSelectableIndex = selectableIndexes.findIndex(
          (index) => index >= active,
        );
        let nextSelectableIndex = currentSelectableIndex + direction;

        if (loop) {
          if (nextSelectableIndex < 0)
            nextSelectableIndex = selectableIndexes.length - 1;
          if (nextSelectableIndex >= selectableIndexes.length)
            nextSelectableIndex = 0;
        } else {
          nextSelectableIndex = Math.max(
            0,
            Math.min(nextSelectableIndex, selectableIndexes.length - 1),
          );
        }

        // Translate from position inside `selectableIndexes` to the real index
        const nextFilteredIndex = selectableIndexes[nextSelectableIndex];
        const nextSelectableItem = filteredItems[nextFilteredIndex];
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
          const activeValue = (activeItem as NormalizedChoice<Value>).value;

          // Set this as the active item value so cursor position is preserved
          setActiveItemValue(activeValue);

          setAllItems(
            allItems.map((item) => {
              // Compare by value only for robust matching
              if (!Separator.isSeparator(item) && item.value === activeValue) {
                const toggled = toggle(item);
                return toggled;
              }
              return item;
            }),
          );
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
              } else if (isValid === false) {
                setError('Invalid selection');
              } else {
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

    // Calculate the active item's description using useMemo for better React patterns
    const activeDescription = useMemo(() => {
      const activeItem = filteredItems[active];
      if (activeItem && !Separator.isSeparator(activeItem)) {
        return (activeItem as NormalizedChoice<Value>).description;
      }
      return undefined;
    }, [active, filteredItems]);

    // Create renderItem function that's reactive to current state
    const renderItem = useMemo(() => {
      // Helper function to resolve icon (string or function)
      const resolveIcon = (
        icon: string | ((text: string) => string),
        choiceText: string,
      ): string => {
        return typeof icon === 'function' ? icon(choiceText) : icon;
      };

      // Use the theme's nocursor property when cursor is not active
      const noCursorIcon = theme.icon.nocursor || ' ';

      return ({ item, isActive }: { item: Item<Value>; isActive: boolean }) => {
        const line: string[] = [];

        if (Separator.isSeparator(item)) {
          return colors.dim(item.separator);
        }

        // Look up checked state directly from allItems to get the current state
        const currentItem = allItems.find(
          (allItem) =>
            !Separator.isSeparator(allItem) &&
            allItem.value === (item as NormalizedChoice<Value>).value,
        ) as NormalizedChoice<Value> | undefined;

        const isChecked = currentItem?.checked || false;

        const choiceName = (item as NormalizedChoice<Value>).name;
        const checkbox = resolveIcon(
          isChecked ? theme.icon.checked : theme.icon.unchecked,
          choiceName,
        );
        // If active, use the cursor icon, otherwise use appropriate spacing to align items
        const cursor = isActive
          ? resolveIcon(theme.icon.cursor, choiceName)
          : resolveIcon(noCursorIcon, choiceName);

        // Keep cursor and checkbox as separate elements so join(' ') adds the proper space between them
        line.push(cursor, checkbox);

        let text = (item as NormalizedChoice<Value>).name;
        if (isActive) {
          text = theme.style.highlight(text);
          // NOTE: Description is now calculated via useMemo, not side-effect mutation
        } else if ((item as NormalizedChoice<Value>).disabled) {
          text = theme.style.disabled(text);
        } else if (isChecked) {
          text = theme.style.checked(text);
        }

        line.push(text);

        // Show disabled reason if item is disabled (but no descriptions inline anymore)
        if ((item as NormalizedChoice<Value>).disabled) {
          const disabledReason =
            typeof (item as NormalizedChoice<Value>).disabled === 'string'
              ? ((item as NormalizedChoice<Value>).disabled as string)
              : 'disabled';
          line.push(theme.style.disabled(`(${disabledReason})`));
        }
        // NOTE: Removed the inline description display - descriptions now appear at bottom

        return line.join(' ');
      };
    }, [allItems, theme, config.theme]);

    // Setup pagination
    const page = usePagination<Item<Value>>({
      items: filteredItems,
      active,
      renderItem,
      pageSize,
      loop,
    });

    // Render the prompt
    const message = theme.style.message(config.message, status);
    let helpTip = '';

    if (theme.helpMode === 'always' && config.instructions !== false) {
      if (typeof config.instructions === 'string') {
        helpTip = `\n${theme.style.help(`(${config.instructions})`)}`;
      } else {
        const tips: string[] = ['Tab to select', 'Enter to submit'];
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
    } else if (filteredItems.length === 0) {
      content = '\nNo choices available';
    } else {
      content = `\n${page}`;
    }

    // Add description of active item at the bottom (like original inquirer.js)
    let descriptionLine = '';
    if (activeDescription) {
      descriptionLine = `\n${theme.style.description(activeDescription)}`;
    }

    return `${prefix} ${message}${helpTip}${searchLine}${errorLine}${content}${descriptionLine}`;
  },
);

// Re-export Separator for convenience
export { Separator } from '@inquirer/core';
