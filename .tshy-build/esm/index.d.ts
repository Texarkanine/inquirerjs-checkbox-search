import { Separator, type Theme } from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';
/**
 * Theme configuration for the checkbox-search prompt
 */
type CheckboxSearchTheme = {
    icon: {
        checked: string | ((text: string) => string);
        unchecked: string | ((text: string) => string);
        cursor: string | ((text: string) => string);
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
declare const _default: <Value>(config: {
    message: string;
    prefix?: string | undefined;
    pageSize?: number | undefined;
    instructions?: string | boolean | undefined;
    choices?: readonly (string | Separator)[] | readonly (Separator | Choice<Value>)[] | undefined;
    source?: ((term: string | undefined, opt: {
        signal: AbortSignal;
    }) => readonly (string | Separator)[] | readonly (Separator | Choice<Value>)[] | Promise<readonly (string | Separator)[]> | Promise<readonly (Separator | Choice<Value>)[]>) | undefined;
    filter?: ((items: readonly NormalizedChoice<Value>[], term: string) => readonly NormalizedChoice<Value>[]) | undefined;
    loop?: boolean | undefined;
    required?: boolean | undefined;
    validate?: ((choices: readonly NormalizedChoice<Value>[]) => boolean | string | Promise<string | boolean>) | undefined;
    theme?: PartialDeep<Theme<CheckboxSearchTheme>> | undefined;
    default?: readonly Value[] | undefined;
}, context?: import("@inquirer/type").Context) => Promise<Value[]> & {
    cancel: () => void;
};
export default _default;
export { Separator } from '@inquirer/core';
