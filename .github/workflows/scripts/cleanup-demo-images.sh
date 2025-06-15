#!/bin/bash

# Cleanup Demo Images Script
# Removes demo images from the demo-images orphan branch for closed PRs

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Script usage
usage() {
    show_usage "$(basename "$0")" \
        "--event-name <pull_request|schedule|workflow_dispatch>" \
        "[--pr-number <number>]" \
        "[--gh-token <token>]"
    echo "Options:"
    echo "  --event-name    GitHub event that triggered this cleanup (required)"
    echo "  --pr-number     PR number for single PR cleanup (required if event-name is pull_request)"
    echo "  --gh-token      GitHub token for API access (required for bulk cleanup)"
    echo "  --help          Show this help message"
    echo
    echo "Examples:"
    echo "  # Cleanup specific PR"
    echo "  $0 --event-name=pull_request --pr-number=123"
    echo
    echo "  # Bulk cleanup using GitHub CLI"
    echo "  $0 --event-name=schedule --gh-token=ghp_xxx"
}

# Main cleanup function
cleanup_demo_images() {
    local event_name="$ARG_EVENT_NAME"
    local pr_number="${ARG_PR_NUMBER:-}"
    local gh_token="${ARG_GH_TOKEN:-}"
    
    # Determine cleanup mode
    local cleanup_mode
    local target_pr
    
    if [ "$event_name" = "pull_request" ]; then
        if [ -z "$pr_number" ]; then
            log_error "PR number is required for pull_request events"
            exit 1
        fi
        log_info "Cleaning up demo images for closed PR #$pr_number"
        cleanup_mode="single_pr"
        target_pr="$pr_number"
    else
        log_info "Cleaning up orphaned demo images for all closed PRs using GitHub CLI"
        cleanup_mode="all_closed"
        
        if [ -z "$gh_token" ]; then
            log_error "GitHub token is required for bulk cleanup"
            exit 1
        fi
        
        # Set up GitHub CLI token
        export GH_TOKEN="$gh_token"
    fi
    
    # Configure git
    configure_git
    
    # Check if demo-images branch exists
    if ! branch_exists "demo-images" "remote"; then
        log_info "demo-images branch does not exist"
        return 0
    fi
    
    log_step "Switching to demo-images branch"
    git fetch origin demo-images
    git checkout demo-images
    
    # Get initial stats
    local initial_size initial_count
    initial_size=$(get_file_size ".")
    initial_count=$(ls -1 pr-*-*.gif 2>/dev/null | wc -l || echo "0")
    
    # Handle cleanup based on mode
    local -a files_to_remove=()
    local remove_count=0
    
    if [ "$cleanup_mode" = "single_pr" ]; then
        # Single PR cleanup - remove all files for this specific PR
        log_info "Looking for files matching: pr-${target_pr}-*.gif"
        shopt -s nullglob
        for file in pr-${target_pr}-*.gif; do
            log_info "Will remove (PR closed): $file"
            files_to_remove+=("$file")
            remove_count=$((remove_count + 1))
        done
        shopt -u nullglob
    else
        # Bulk cleanup - get open PRs and remove files for closed PRs
        log_step "Fetching open PR numbers..."
        if ! command_exists gh; then
            log_error "GitHub CLI (gh) is required for bulk cleanup"
            exit 1
        fi
        
        local open_prs
        open_prs=$(gh pr list --json number --jq '.[].number' --limit 1000 | tr '\n' ' ')
        log_info "Open PRs: $open_prs"
        
        shopt -s nullglob
        for file in pr-*-*.gif; do
            # Extract PR number from filename (pr-123-abc.gif -> 123)
            local pr_num
            pr_num=$(extract_pr_number "$file")
            
            if [ -n "$pr_num" ]; then
                # Check if this PR number is in the open PRs list
                if ! echo " $open_prs " | grep -q " $pr_num "; then
                    log_info "Will remove (PR closed): $file (PR #$pr_num)"
                    files_to_remove+=("$file")
                    remove_count=$((remove_count + 1))
                else
                    log_info "Keeping (PR open): $file (PR #$pr_num)"
                fi
            else
                log_warning "Skipping invalid filename format: $file"
            fi
        done
        shopt -u nullglob
    fi
    
    # Remove files if any found
    if [ "$remove_count" -gt 0 ]; then
        log_step "Rewriting git history to completely remove $remove_count old files..."
        
        # Create a list of files to keep (inverse of files to remove)
        local keep_pattern=""
        shopt -s nullglob
        for file in pr-*-*.gif README.md; do
            # Check if this file should be kept
            local should_keep=true
            for remove_file in "${files_to_remove[@]}"; do
                if [ "$file" = "$remove_file" ]; then
                    should_keep=false
                    break
                fi
            done
            
            if [ "$should_keep" = true ]; then
                if [ -z "$keep_pattern" ]; then
                    keep_pattern="$file"
                else
                    keep_pattern="$keep_pattern|$file"
                fi
            fi
        done
        shopt -u nullglob
        
        # Use git-filter-repo to rewrite history, keeping only desired files
        if [ -n "$keep_pattern" ]; then
            log_info "Keeping files matching: $keep_pattern"
            
            # Create temporary file with files to keep (one per line)
            local paths_file
            paths_file=$(mktemp)
            trap "rm -f \"$paths_file\"" EXIT
            
            # Convert pattern to individual file paths
            echo "$keep_pattern" | tr '|' '\n' > "$paths_file"
            
            log_info "Paths to keep:"
            while IFS= read -r path; do
                if [ -n "$path" ]; then
                    log_info "  - $path"
                fi
            done < "$paths_file"
            
            # Save the original remote URL before git-filter-repo removes it
            local origin_url
            origin_url=$(git remote get-url origin)
            log_info "Saving origin remote URL: $origin_url"
            
            # Use git-filter-repo to rewrite history
            log_step "Rewriting git history with git-filter-repo..."
            if git filter-repo --force --paths-from-file "$paths_file"; then
                log_success "History rewritten successfully with git-filter-repo"
                
                # git-filter-repo removes the origin remote, so we need to restore it
                log_step "Restoring origin remote..."
                git remote add origin "$origin_url"
                log_success "Origin remote restored"
                
                # git-filter-repo automatically handles cleanup, but let's ensure optimal packing
                git gc --prune=now --aggressive
            else
                log_error "git-filter-repo failed"
                exit 1
            fi
        else
            log_warning "No files to keep - this would delete the entire branch"
            log_step "Falling back to regular file deletion..."
            
            # Fallback to regular deletion
            for file in "${files_to_remove[@]}"; do
                if [ -f "$file" ]; then
                    git rm "$file"
                fi
            done
            
            local commit_msg
            if [ "$cleanup_mode" = "single_pr" ]; then
                commit_msg="Remove demo images for closed PR #${target_pr}"
            else
                commit_msg="Cleanup: Remove $remove_count demo images for closed PRs"
            fi
            
            if git commit -m "$commit_msg"; then
                log_success "Files removed with regular commit"
            fi
        fi
        
        # Force push the rewritten history
        log_step "Force pushing rewritten history..."
        git push --force-with-lease origin demo-images
        
    else
        if [ "$cleanup_mode" = "single_pr" ]; then
            log_info "No demo images found for PR #${target_pr}"
        else
            log_info "No orphaned demo images found to remove"
        fi
    fi
    
    # Report final stats (only for bulk cleanup to avoid noise)
    if [ "$cleanup_mode" != "single_pr" ]; then
        local final_size final_count saved_bytes
        final_size=$(get_file_size ".")
        final_count=$(ls -1 pr-*-*.gif 2>/dev/null | wc -l || echo "0")
        saved_bytes=$((initial_size - final_size))
        
        log_success "Cleanup results:"
        echo "- Files before: $initial_count"
        echo "- Files after: $final_count"
        echo "- Files removed: $((initial_count - final_count))"
        echo "- Space saved: $(format_bytes "$saved_bytes")"
        echo "- Current branch size: $(du -sh . 2>/dev/null | cut -f1)"
    fi
}

# Main execution
main() {
    # Check required commands
    check_required_commands git git-filter-repo du ls grep tr sed
    
    # Parse arguments
    parse_args "$@"
    
    # Handle help
    if [ "${ARG_HELP:-}" = "true" ]; then
        usage
        exit 0
    fi
    
    # Validate required arguments
    require_args "event-name"
    
    # Validate event-name
    case "${ARG_EVENT_NAME}" in
        pull_request|schedule|workflow_dispatch)
            ;;
        *)
            log_error "Invalid event-name: ${ARG_EVENT_NAME}"
            log_error "Must be one of: pull_request, schedule, workflow_dispatch"
            exit 1
            ;;
    esac
    
    # Run cleanup
    cleanup_demo_images
    
    log_success "Cleanup completed successfully"
}

# Only run main if script is executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
