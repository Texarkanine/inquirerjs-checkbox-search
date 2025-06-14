#!/bin/bash

# Detect Demo Changes Script
# Analyzes which demo files have changed compared to committed history

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Script usage
usage() {
    show_usage "$(basename "$0")" \
        "[--output-format <env|json>]" \
        "[--verbose]"
    echo "Options:"
    echo "  --output-format  Output format: 'env' for environment variables, 'json' for JSON (default: env)"
    echo "  --verbose        Enable verbose debugging output"
    echo "  --help           Show this help message"
    echo
    echo "Environment Output Format:"
    echo "  CHANGED_DEMOS='demo1 demo2 demo3'    # Space-separated list of changed demo names"
    echo "  DEMO_CHANGED='true'|'false'          # Overall change status"
    echo
    echo "JSON Output Format:"
    echo "  {"
    echo "    \"changed_demos\": [\"demo1\", \"demo2\", \"demo3\"],"
    echo "    \"demo_changed\": true"
    echo "  }"
    echo
    echo "Examples:"
    echo "  $0                              # Output as environment variables"
    echo "  $0 --output-format=json         # Output as JSON"
    echo "  $0 --verbose                    # Enable debug output"
}

# Detect which demos have changed
detect_demo_changes() {
    local output_format="${ARG_OUTPUT_FORMAT:-env}"
    local verbose="${ARG_VERBOSE:-false}"
    
    log_step "Checking for demo changes..."
    
    local -a changed_demos=()
    
    # Check each demo file
    shopt -s nullglob
    for demo_file in docs/img/*-demo.gif; do
            local demo_name
            demo_name=$(basename "$demo_file" | sed 's/-demo\.gif$//')
            
            if [ "$verbose" = "true" ]; then
                log_info "Debugging $demo_name:"
                echo "  File path: $demo_file" >&2
                set +e
                git_status=$(git status --porcelain "$demo_file" 2>/dev/null || echo 'not in git status')
                git cat-file -e origin/main:"$demo_file" 2>/dev/null && main_status='exists' || main_status='not in main'
                git diff --quiet origin/main -- "$demo_file" 2>/dev/null && diff_status='no diff' || diff_status='has diff or new'
                set -e
                echo "  Git status: $git_status" >&2
                echo "  In main branch: $main_status" >&2
                echo "  Git diff vs main: $diff_status" >&2
            fi
            
            # Check if file exists in main branch and compare against it
            set +e
            git cat-file -e origin/main:"$demo_file" 2>/dev/null
            local file_in_main=$?
            git diff --quiet origin/main -- "$demo_file" 2>/dev/null
            local file_changed_from_main=$?
            set -e
            
            if [ $file_in_main -ne 0 ]; then
                log_info "New demo (not in main branch): $demo_name"
                changed_demos+=("$demo_name")
            elif [ $file_changed_from_main -ne 0 ]; then
                log_info "Demo changed from main: $demo_name"
                changed_demos+=("$demo_name")
            else
                if [ "$verbose" = "true" ]; then
                    log_info "Demo unchanged from main: $demo_name"
                fi
            fi
    done
    shopt -u nullglob
    
    # Convert array to space-separated string for output
    local changed_demos_string
    if [ ${#changed_demos[@]} -gt 0 ]; then
        printf -v changed_demos_string '%s ' "${changed_demos[@]}"
        changed_demos_string="${changed_demos_string% }"  # trim trailing space
    else
        changed_demos_string=""
    fi
    
    # Determine overall change status
    local demo_changed
    if [ ${#changed_demos[@]} -gt 0 ]; then
        demo_changed="true"
        log_success "Overall: Demo changes detected"
    else
        demo_changed="false"
        log_info "Overall: No demo changes"
    fi
    
    # Output in requested format
    case "$output_format" in
        env)
            echo "CHANGED_DEMOS='$changed_demos_string'"
            echo "DEMO_CHANGED='$demo_changed'"
            ;;
        json)
            # Convert array to JSON array
            local -a json_array=()
            if [ ${#changed_demos[@]} -gt 0 ]; then
                # Build JSON array from changed_demos array
                for demo in "${changed_demos[@]}"; do
                    json_array+=("\"$demo\"")
                done
            fi
            
            # Convert array to comma-separated string for JSON
            local json_array_string=""
            if [ ${#json_array[@]} -gt 0 ]; then
                printf -v json_array_string '%s, ' "${json_array[@]}"
                json_array_string="${json_array_string%, }"  # trim trailing comma and space
            fi
            
            echo "{"
            echo "  \"changed_demos\": [$json_array_string],"
            echo "  \"demo_changed\": $demo_changed"
            echo "}"
            ;;
        *)
            log_error "Invalid output format: $output_format"
            log_error "Must be one of: env, json"
            exit 1
            ;;
    esac
}

# Main execution
main() {
    # Check required commands
    check_required_commands git basename
    
    # Parse arguments
    parse_args "$@"
    
    # Handle help
    if [ "${ARG_HELP:-}" = "true" ]; then
        usage
        exit 0
    fi
    
    # Validate output format if provided
    if [ -n "${ARG_OUTPUT_FORMAT:-}" ]; then
        case "${ARG_OUTPUT_FORMAT}" in
            env|json)
                ;;
            *)
                log_error "Invalid output format: ${ARG_OUTPUT_FORMAT}"
                log_error "Must be one of: env, json"
                exit 1
                ;;
        esac
    fi
    
    # Run detection
    detect_demo_changes
}

# Only run main if script is executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
