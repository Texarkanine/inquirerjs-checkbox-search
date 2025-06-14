#!/bin/bash

# Commit Demo Changes Script
# Commits demo changes back to the main branch with retry logic

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Script usage
usage() {
    show_usage "$(basename "$0")" \
        "[--retry-count <number>]" \
        "[--branch <name>]" \
        "[--commit-message <message>]" \
        "[--help]"
    echo "Options:"
    echo "  --retry-count     Maximum number of retry attempts (default: 3)"
    echo "  --branch          Target branch to commit to (default: main)"
    echo "  --commit-message  Custom commit message (default: 'docs: Update demo GIFs [skip ci]')"
    echo "  --help            Show this help message"
    echo
    echo "Examples:"
    echo "  $0                                          # Use defaults"
    echo "  $0 --retry-count=5 --branch=develop        # Custom retry count and branch"
    echo "  $0 --commit-message='Update demos'         # Custom commit message"
}

# Main commit function with retry logic
commit_demo_changes() {
    local retry_count="${ARG_RETRY_COUNT:-3}"
    local branch="${ARG_BRANCH:-main}"
    local commit_message="${ARG_COMMIT_MESSAGE:-docs: Update demo GIFs [skip ci]}"
    
    log_info "Committing demo changes to branch: $branch"
    log_info "Retry count: $retry_count"
    log_info "Commit message: $commit_message"
    
    # Configure git
    configure_git
    
    # Retry logic for potential conflicts
    local current_retry=0
    
    while [ $current_retry -lt $retry_count ]; do
        current_retry=$((current_retry + 1))
        log_step "Attempt $current_retry of $retry_count"
        
        # Fetch latest changes
        log_info "Fetching latest changes from origin/$branch"
        git fetch origin "$branch"
        git reset --hard "origin/$branch"
        
        # Regenerate all demos to ensure we have latest
        log_step "Regenerating all demos to ensure we have latest..."
        if ! npm run demo:generate:all; then
            log_error "Failed to regenerate demos"
            exit 1
        fi
        
        # Add demo files
        git add docs/img/*.gif
        
        # Check if there are any changes to commit
        if git diff --cached --quiet; then
            log_info "No changes to commit after regeneration"
            return 0
        fi
        
        # Attempt to commit
        if git commit --no-gpg-sign -m "$commit_message"; then
            log_success "Successfully created commit"
            
            # Attempt to push
            if git push; then
                log_success "Successfully committed and pushed demo changes"
                return 0
            else
                log_warning "Push failed, retrying..."
                # Calculate exponential backoff delay
                local delay=$((current_retry * 2))
                log_info "Waiting $delay seconds before retry..."
                sleep "$delay"
            fi
        else
            log_error "Commit failed"
            return 1
        fi
    done
    
    # If we get here, all retries failed
    log_error "Failed to commit after $retry_count attempts"
    return 1
}

# Main execution
main() {
    # Check required commands
    check_required_commands git npm
    
    # Parse arguments
    parse_args "$@"
    
    # Handle help
    if [ "${ARG_HELP:-}" = "true" ]; then
        usage
        exit 0
    fi
    
    # Validate retry count if provided
    if [ -n "${ARG_RETRY_COUNT:-}" ]; then
        if ! [[ "$ARG_RETRY_COUNT" =~ ^[0-9]+$ ]]; then
            log_error "Retry count must be a positive integer: $ARG_RETRY_COUNT"
            exit 1
        fi
        
        if [ "$ARG_RETRY_COUNT" -lt 1 ] || [ "$ARG_RETRY_COUNT" -gt 10 ]; then
            log_error "Retry count must be between 1 and 10: $ARG_RETRY_COUNT"
            exit 1
        fi
    fi
    
    # Validate branch name if provided
    if [ -n "${ARG_BRANCH:-}" ]; then
        if [[ "$ARG_BRANCH" =~ [^a-zA-Z0-9._/-] ]]; then
            log_error "Invalid branch name: $ARG_BRANCH"
            exit 1
        fi
    fi
    
    # Run commit
    if commit_demo_changes; then
        log_success "Demo changes committed successfully"
    else
        log_error "Failed to commit demo changes"
        exit 1
    fi
}

# Only run main if script is executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
