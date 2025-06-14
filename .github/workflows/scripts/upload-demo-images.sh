#!/bin/bash

# Upload Demo Images Script
# Uploads generated demo images to the demo-images orphan branch for PR previews

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Script usage
usage() {
    show_usage "$(basename "$0")" \
        "--pr-number <number>" \
        "--commit-sha <sha>" \
        "--repository <owner/repo>" \
        "[--head-ref <ref>]"
    echo "Options:"
    echo "  --pr-number     PR number for image naming (required)"
    echo "  --commit-sha    Commit SHA for image naming (required)"
    echo "  --repository    GitHub repository (owner/repo format) (required)"
    echo "  --head-ref      PR head reference/branch name (optional)"
    echo "  --help          Show this help message"
    echo
    echo "Output:"
    echo "  Prints demo images list in format: 'demo_name:image_url demo_name2:image_url2'"
    echo
    echo "Examples:"
    echo "  $0 --pr-number=123 --commit-sha=abc123 --repository=owner/repo --head-ref=feature-branch"
}

# Main upload function
upload_demo_images() {
    local pr_number="$ARG_PR_NUMBER"
    local commit_sha="$ARG_COMMIT_SHA"
    local repository="$ARG_REPOSITORY"
    local head_ref="${ARG_HEAD_REF:-}"
    
    log_info "Uploading all demo images to demo-images branch..."
    
    # Configure git
    configure_git
    
    # Save current state
    local current_branch
    if [ -n "$head_ref" ]; then
        current_branch="$head_ref"
    else
        current_branch=$(git rev-parse --abbrev-ref HEAD)
    fi
    
    # Get the user's actual commit SHA (from the PR branch)
    local user_commit_sha
    user_commit_sha=$(git rev-parse HEAD)
    
    # FIRST: Backup all generated demos BEFORE switching branches
    log_step "Backing up generated demos before branch switch..."
    mkdir -p /tmp/demo-backup
    log_info "Looking for *-demo.gif files in current directory:"
    set +e
    ls -la docs/img/*-demo.gif 2>/dev/null || log_info "No *-demo.gif files found"
    set -e
    
    if ls docs/img/*-demo.gif 1> /dev/null 2>&1; then
        cp docs/img/*-demo.gif /tmp/demo-backup/
        local backup_count
        backup_count=$(ls docs/img/*-demo.gif | wc -l)
        log_success "Backed up $backup_count demo files to /tmp/demo-backup/"
        log_info "Backed up files:"
        ls -la /tmp/demo-backup/
    else
        log_error "No demo files found to backup"
        exit 1
    fi
    
    # Stash any uncommitted changes
    set +e
    git add . && git stash || true
    set -e
    
    # Create or switch to demo-images orphan branch
    if branch_exists "demo-images" "remote"; then
        log_step "Switching to existing demo-images branch"
        git fetch origin demo-images
        git checkout demo-images
    else
        log_step "Creating new demo-images orphan branch"
        git checkout --orphan demo-images
        set +e
        git rm -rf . 2>/dev/null || true
        set -e
        echo "# Demo Images Branch" > README.md
        echo "This branch contains demo images for PR previews." >> README.md
        git add README.md
        git commit -m "Initialize demo-images branch"
    fi
    
    # Copy all demo images with PR-specific naming from backup directory
    local demo_images=""
    log_step "Processing backed up demo files:"
    
    for demo_file in /tmp/demo-backup/*-demo.gif; do
        if [ -f "$demo_file" ]; then
            local demo_name
            demo_name=$(basename "$demo_file" | sed 's/-demo\.gif$//')
            local pr_image="pr-${pr_number}-${commit_sha}-${demo_name}.gif"
            
            cp "$demo_file" "$pr_image"
            log_info "Copied: $demo_file -> $pr_image"
            
            # Build the image URL
            local image_url="https://raw.githubusercontent.com/${repository}/demo-images/$pr_image"
            if [ -z "$demo_images" ]; then
                demo_images="$demo_name:$image_url"
            else
                demo_images="$demo_images $demo_name:$image_url"
            fi
            log_info "Added to DEMO_IMAGES: $demo_name -> $image_url"
        else
            log_warning "File not found: $demo_file"
        fi
    done
    
    log_info "Final DEMO_IMAGES: '$demo_images'"
    
    # Add all PR-specific images
    git add pr-${pr_number}-${commit_sha}-*.gif
    
    if git commit -m "Add demo images for PR #${pr_number}"; then
        log_success "Added new demo images"
    else
        log_info "Demo images unchanged"
    fi
    
    # Push to demo-images branch
    if git push origin demo-images; then
        log_success "Uploaded all demos to demo-images branch"
    else
        log_error "Failed to push to demo-images branch"
        demo_images="❌ Failed to upload demo images"
    fi
    
    # Switch back to original branch
    git checkout "$current_branch"
    set +e
    git stash pop 2>/dev/null || true
    set -e
    
    # Output the demo images list for use by other scripts
    echo "$demo_images"
    
    # Also output user commit SHA for downstream use
    echo "USER_COMMIT_SHA=$user_commit_sha" >&2
}

# Main execution
main() {
    # Check required commands
    check_required_commands git cp ls
    
    # Parse arguments
    parse_args "$@"
    
    # Handle help
    if [ "${ARG_HELP:-}" = "true" ]; then
        usage
        exit 0
    fi
    
    # Validate required arguments
    require_args "pr-number" "commit-sha" "repository"
    
    # Validate PR number is numeric
    if ! [[ "$ARG_PR_NUMBER" =~ ^[0-9]+$ ]]; then
        log_error "PR number must be numeric: $ARG_PR_NUMBER"
        exit 1
    fi
    
    # Validate repository format
    if ! [[ "$ARG_REPOSITORY" =~ ^[^/]+/[^/]+$ ]]; then
        log_error "Repository must be in 'owner/repo' format: $ARG_REPOSITORY"
        exit 1
    fi
    
    # Run upload
    upload_demo_images
}

# Only run main if script is executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
