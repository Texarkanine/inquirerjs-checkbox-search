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
  isUpKey,
    isDownKey,
  isEnterKey,
  ValidationError,
  Separator,
  type Theme,
  type Status,
} from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';
import colors from 'yoctocolors-cjs';
import figures from '@inquirer/figures';
import ansiEscapes from 'ansi-escapes';
import { blue, cyan, dim, yellow } from 'yoctocolors-cjs';

/**
 * Theme configuration for the checkbox-search prompt
 */
type CheckboxSearchTheme = {
  icon: {
    checked: string;
    unchecked: string;
    cursor: string;
  };
  style: {
    answer: (text: string) => string;
    message: (text: string) => string;
    error: (text: string) => string;
    help: (text: string) => string;
    highlight: (text: string) => string;
    searchTerm: (text: string) => string;
    description: (text: string) => string;
    disabled: (text: string) => string;
  };
  helpMode: 'always' | 'never' | 'auto';
};

/**
 * Keyboard shortcuts configuration
 */
type CheckboxSearchShortcuts = {
  all?: string | null;
  invert?: string | null;
};

/**
 * Default theme for the checkbox-search prompt
 */
const checkboxSearchTheme: CheckboxSearchTheme = {
  icon: {
    checked: colors.green(figures.circleFilled),
    unchecked: figures.circle,
    cursor: figures.pointer,
  },
  style: {
    answer: colors.cyan,
    message: colors.cyan,
    error: (text: string) => colors.yellow(`> ${text}`),
    help: colors.dim,
    highlight: colors.cyan,
    searchTerm: colors.cyan,
    description: colors.dim,
    disabled: colors.dim,
  },
  helpMode: 'always',
};

/**
 * Choice object for the checkbox-search prompt
 */
type Choice<Value> = {
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
type NormalizedChoice<Value> = {
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
type CheckboxSearchConfig<
  Value,
  ChoicesObject =
    | ReadonlyArray<string | Separator>
    | ReadonlyArray<Choice<Value> | Separator>,
> = {
  message: string;
  prefix?: string;
  pageSize?: number;
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
    : ReadonlyArray<Choice<Value> | Separator> | Promise<ReadonlyArray<Choice<Value> | Separator>>;
  
  // Search and filtering options
  filter?: (items: ReadonlyArray<NormalizedChoice<Value>>, term: string) => ReadonlyArray<NormalizedChoice<Value>>;
  
  // Selection options
  loop?: boolean;
  required?: boolean;
  validate?: (
    choices: ReadonlyArray<NormalizedChoice<Value>>,
  ) => boolean | string | Promise<string | boolean>;
  
  // UI customization
  theme?: PartialDeep<Theme<CheckboxSearchTheme>>;
  shortcuts?: CheckboxSearchShortcuts;
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
function isSelectable<Value>(item: Item<Value>): item is NormalizedChoice<Value> {
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
 * Create a function to set the checked state of items
 * @param checked - Whether items should be checked
 * @returns Function to apply the checked state
 */
function check(checked: boolean) {
  return function <Value>(item: Item<Value>): Item<Value> {
    return isSelectable(item) ? { ...item, checked } : item;
  };
}

/**
 * Normalize choice inputs into consistent format
 * @param choices - Raw choices array (strings, choice objects, separators)
 * @returns Normalized array of items
 */
function normalizeChoices<Value>(
  choices: ReadonlyArray<string | Separator> | ReadonlyArray<Choice<Value> | Separator>,
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
  
  const searchTerm = term.toLowerCase();
  return items.filter(item => {
    const name = item.name.toLowerCase();
    const description = (item.description ?? '').toLowerCase();
    return name.includes(searchTerm) || description.includes(searchTerm);
  });
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
    done: (value: Array<Value>) => void
  ) => {
    // Configuration with defaults
    const {
      instructions,
      pageSize = 7,
      loop = true,
      required,
      validate = () => true,
      filter = defaultFilter,
      default: defaultValues = [],
    } = config;
    
    const shortcuts = { all: 'a', invert: 'i', ...config.shortcuts };
    const theme = makeTheme<CheckboxSearchTheme>(checkboxSearchTheme, config.theme);
    
    // State management hooks
    const firstRender = useRef(true);
    const [status, setStatus] = useState<Status>('idle');
    const prefix = usePrefix({ status, theme });
    
    // Search state
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchError, setSearchError] = useState<string>();
    
    // Initialize static choices directly, similar to checkbox prompt
    const initialItems = useMemo(() => {
      if (config.choices) {
        const normalized = normalizeChoices<Value>(config.choices);
        // Apply default selections
        return normalized.map(item => {
          if (isSelectable(item) && defaultValues.includes(item.value)) {
            return { ...item, checked: true };
          }
          return item;
        });
      }
      return [];
    }, [config.choices, defaultValues]);
    
    // Choice and selection state  
    const [allItems, setAllItems] = useState<ReadonlyArray<Item<Value>>>(initialItems);
    const [filteredItems, setFilteredItems] = useState<ReadonlyArray<Item<Value>>>(initialItems);
    const [active, setActive] = useState<number>(0);
    const [showHelpTip, setShowHelpTip] = useState(true);
    const [errorMsg, setError] = useState<string>();
    
    // Calculate bounds for active item - only count selectable items
    const bounds = useMemo(() => {
      const selectableItems = filteredItems.filter(isSelectable);
      return {
        first: 0,
        last: Math.max(0, selectableItems.length - 1),
      };
    }, [filteredItems]);
    
    // Handle async source loading with abort support
    useEffect(() => {
      if (!config.source) return;
      
      const abortController = new AbortController();
      setStatus('loading');
      setSearchError(undefined);
      
      const loadChoices = async () => {
        try {
          const choices = await config.source!(searchTerm, { signal: abortController.signal });
          
          if (!abortController.signal.aborted) {
            const normalized = normalizeChoices<Value>(choices);
            // Apply default selections
            const withDefaults = normalized.map(item => {
              if (isSelectable(item) && defaultValues.includes(item.value)) {
                return { ...item, checked: true };
              }
              return item;
            });
            setAllItems(withDefaults);
            setStatus('idle');
          }
        } catch (error) {
          if (!abortController.signal.aborted) {
            setSearchError(error instanceof Error ? error.message : 'Failed to load choices');
            setStatus('idle');
          }
        }
      };
      
      // Debounce search requests
      const timeoutId = setTimeout(loadChoices, searchTerm ? 200 : 0);
      
      return () => {
        clearTimeout(timeoutId);
        abortController.abort();
      };
    }, [config.source, searchTerm, defaultValues]);
    
    // Apply filtering when search term or items change
    useEffect(() => {

      if (config.source) {
        // For async sources, filtering is handled by the source function
        setFilteredItems(allItems);
      } else {
        // For static choices, apply local filtering
        const selectableItems = allItems.filter(item => !Separator.isSeparator(item)) as ReadonlyArray<NormalizedChoice<Value>>;
        const filtered = filter(selectableItems, searchTerm);
        
        // Create a set of filtered values for efficient lookup
        const filteredValues = new Set(filtered.map(item => item.value));
        
        // Rebuild preserving current allItems state (including checked status)
        const result: Item<Value>[] = [];
        
        for (const item of allItems) {
          if (Separator.isSeparator(item)) {
            result.push(item);
          } else if (filteredValues.has(item.value)) {
            result.push(item); // This preserves the current checked state from allItems
          }
        }
        

        setFilteredItems([...result]); // Force new array reference
      }
    }, [allItems, searchTerm, filter, config.source]);
    
    // Reset active index when filtered items change
    useEffect(() => {
      setActive(0);
    }, [filteredItems]);
    
    // Keyboard event handling
    useKeypress((key, rl) => {
      if (status !== 'idle') return;
      
      // Clear any existing errors
      setError(undefined);
      
      // Handle shortcuts first (single character keys)
      if (key.name === shortcuts.all && shortcuts.all) {
        setAllItems(allItems.map(check(true)));
        return;
      }
      
      if (key.name === shortcuts.invert && shortcuts.invert) {
        setAllItems(allItems.map(toggle));
        return;
      }
      
      // Handle search input - use rl.line for current input
      // Space is always search input, only exclude navigation and action keys
      if (key.name !== 'up' && key.name !== 'down' && key.name !== 'tab' && key.name !== 'enter') {
        setSearchTerm(rl.line);
        return;
      }
      
      // Handle navigation
      if (isUpKey(key) || isDownKey(key)) {
        const direction = isUpKey(key) ? -1 : 1;
        const selectableIndexes = filteredItems
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => isSelectable(item))
          .map(({ index }) => index);
        
        if (selectableIndexes.length === 0) return;
        
        const currentSelectableIndex = selectableIndexes.findIndex(index => index >= active);
        let nextSelectableIndex = currentSelectableIndex + direction;
        
        if (loop) {
          if (nextSelectableIndex < 0) nextSelectableIndex = selectableIndexes.length - 1;
          if (nextSelectableIndex >= selectableIndexes.length) nextSelectableIndex = 0;
        } else {
          nextSelectableIndex = Math.max(0, Math.min(nextSelectableIndex, selectableIndexes.length - 1));
        }
        
        setActive(selectableIndexes[nextSelectableIndex] || 0);
        return;
      }
      
      // Handle selection toggle with tab key ONLY
      if (key.name === 'tab') {
        const activeItem = filteredItems[active];
        console.log('DEBUG: Tab pressed, activeItem:', activeItem);
        if (activeItem && isSelectable(activeItem)) {
          console.log('DEBUG: Updating allItems, current allItems:', allItems);
          setAllItems(allItems.map((item) => {
            // Compare by value and name to be more robust
            if (!Separator.isSeparator(item) && !Separator.isSeparator(activeItem) && 
                item.value === activeItem.value && item.name === activeItem.name) {
              const toggled = toggle(item);
              console.log('DEBUG: Toggling item:', item, '→', toggled);
              return toggled;
            }
            return item;
          }));
        }
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
          result.then((isValid) => {
            if (typeof isValid === 'string') {
              setError(isValid);
            } else if (isValid === false) {
              setError('Invalid selection');
            } else {
              setStatus('done');
              done(selectedChoices.map(choice => choice.value));
            }
          }).catch(() => {
            setError('Validation failed');
          });
          return;
        }
        
        setStatus('done');
        done(selectedChoices.map(choice => choice.value));
        return;
      }
    });
    
    // Create renderItem function that's reactive to current state
    const renderItem = useMemo(() => {
      return ({ item, isActive }: { item: Item<Value>, isActive: boolean }) => {
        const line: string[] = [];
        
        if (Separator.isSeparator(item)) {
          return dim(item.separator);
        }
        
        // Find the current state of this item from allItems
        const currentItem = allItems.find(i => 
          !Separator.isSeparator(i) && !Separator.isSeparator(item) && 
          i.value === item.value && i.name === item.name
        );
        const isChecked = currentItem ? currentItem.checked : (Separator.isSeparator(item) ? false : item.checked);
        

        const checkbox = isChecked ? theme.icon.checked : theme.icon.unchecked;
        const cursor = isActive ? theme.icon.cursor : ' ';
        line.push(cursor, checkbox);
        
        let text = (item as NormalizedChoice<Value>).name;
        if (isActive) {
          text = theme.style.highlight(text);
        } else if ((item as NormalizedChoice<Value>).disabled) {
          text = theme.style.disabled(text);
        }
        
        line.push(text);
        
        if ((item as NormalizedChoice<Value>).description && !isActive) {
          line.push(theme.style.description(`(${(item as NormalizedChoice<Value>).description})`));
        }
        
        return line.join(' ');
      };
    }, [allItems, theme]);

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
    
    if (theme.helpMode === 'always' || (theme.helpMode === 'auto' && showHelpTip)) {
      const tips: string[] = ['Tab to select'];
      if (shortcuts.all) tips.push(`${shortcuts.all} to toggle all`);
      if (shortcuts.invert) tips.push(`${shortcuts.invert} to invert selection`);
      tips.push('Enter to submit');
      helpTip = `\n${theme.style.help(`(${tips.join(', ')})`)}`;
    }
    
    let searchLine = '';
    if (config.source || searchTerm || status === 'loading') {
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
    
    return `${prefix} ${message}${helpTip}${searchLine}${errorLine}${content}${ansiEscapes.cursorHide}`;
  },
);

// Re-export Separator for convenience
export { Separator } from '@inquirer/core'; 