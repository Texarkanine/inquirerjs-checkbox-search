#!/bin/bash

# Generate Demo Comment Script
# Generates PR comments from templates using environment variable substitution

set -uo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Script usage
usage() {
    show_usage "$(basename "$0")" \
        "--template-file <path>" \
        "--github-repository <owner/repo>" \
        "--github-sha <sha>" \
        "--user-commit-sha <sha>" \
        "--demo-images <images>" \
        "[--changed-demos <demos>]" \
        "[--new-demos <demos>]" \
        "[--output-file <path>]"
    echo "Options:"
    echo "  --template-file       Path to the comment template file (required)"
    echo "  --github-repository   Repository in 'owner/repo' format (required)"
    echo "  --github-sha         GitHub's merge commit SHA (required)"
    echo "  --user-commit-sha    User's actual commit SHA (required)"
    echo "  --demo-images        Space-separated 'name:url' pairs (required)"
    echo "  --changed-demos      Space-separated list of changed demo names (optional)"
    echo "  --new-demos          Space-separated list of new demo names (optional)"
    echo "  --output-file        Output file path (default: stdout)"
    echo "  --help               Show this help message"
    echo
    echo "Examples:"
    echo "  $0 --template-file=template.md --github-repository=owner/repo --github-sha=abc123 --user-commit-sha=def456 --demo-images='basic:https://example.com/basic.gif'"
    echo "  $0 --template-file=template.md --github-repository=owner/repo --github-sha=abc123 --user-commit-sha=def456 --demo-images='basic:https://example.com/basic.gif' --changed-demos='basic' --new-demos='validation'"
}

# Build demo list section from provided arguments
build_demo_list() {
    local demo_images="$1"
    local changed_demos="${2:-}"
    local new_demos="${3:-}"
    local demo_list=""
    
    if [ "$demo_images" = "❌ Failed to upload demo images" ]; then
        echo "❌ Failed to upload demo images for preview."
        return
    fi
    
    if [ -z "$demo_images" ]; then
        echo "No demo images available."
        return
    fi
    
    # Parse demo images and create alphabetical list
    local sorted_demos
    sorted_demos=$(echo "$demo_images" | tr ' ' '\n' | grep ':' | cut -d':' -f1 | sort)
    
    for demo_name in $sorted_demos; do
        # Validate demo name (should be alphanumeric + hyphens/underscores only)
        if [[ ! "$demo_name" =~ ^[a-zA-Z0-9_-]+$ ]]; then
            continue
        fi
        
        # Skip empty demo names
        if [ -z "$demo_name" ]; then
            continue
        fi
        
        # Get the URL for this demo
        local demo_url
        demo_url=$(echo "$demo_images" | tr ' ' '\n' | grep "^${demo_name}:" | cut -d':' -f2-)
        
        # Validate URL format (should start with https://)
        if [[ ! "$demo_url" =~ ^https://.*\.gif$ ]]; then
            continue
        fi
        
        # Check if this demo changed
        local is_changed=false
        for changed_demo in $changed_demos; do
            if [ "$demo_name" = "$changed_demo" ]; then
                is_changed=true
                break
            fi
        done
        
        # Use <details open> for changed demos, <details> for unchanged
        if [ "$is_changed" = true ]; then
            # Check if this demo is in the new_demos list (pre-computed)
            local demo_is_new=false
            for new_demo in $new_demos; do
                if [ "$new_demo" = "$demo_name" ]; then
                    demo_is_new=true
                    break
                fi
            done
            
            if [ "$demo_is_new" = true ]; then
                demo_list="$demo_list
<details open>
<summary>✨ demos/${demo_name}.gif (NEW)</summary>

![${demo_name}-demo]($demo_url)
</details>
"
            else
                demo_list="$demo_list
<details open>
<summary>🔥 demos/${demo_name}.gif (CHANGED)</summary>

![${demo_name}-demo]($demo_url)
</details>
"
            fi
        else
            demo_list="$demo_list
<details>
<summary>📷 demos/${demo_name}.gif</summary>

![${demo_name}-demo]($demo_url)
</details>
"
        fi
    done
    
    echo "$demo_list"
}

# Set change status message based on demo changes
set_change_status_message() {
    local changed_demos="${1:-}"
    local new_demos="${2:-}"
    
    # Compute demo_changed from the lists (true if either list is non-empty)
    local demo_changed="false"
    if [ -n "$changed_demos" ] || [ -n "$new_demos" ]; then
        demo_changed="true"
    fi
    
    if [ "$demo_changed" = "true" ]; then
        export CHANGE_STATUS_MESSAGE="⚠️ **Changes detected** - Please review the generated demos to ensure they accurately represent the library."
    else
        export CHANGE_STATUS_MESSAGE="✅ **Demos are stable** - No changes detected in demo output."
    fi
}

# Generate comment from template
generate_demo_comment() {
    local template_file="$ARG_TEMPLATE_FILE"
    local output_file="${ARG_OUTPUT_FILE:-}"
    local github_repository="$ARG_GITHUB_REPOSITORY"
    local github_sha="$ARG_GITHUB_SHA"
    local user_commit_sha="$ARG_USER_COMMIT_SHA"
    local demo_images="$ARG_DEMO_IMAGES"
    local changed_demos="${ARG_CHANGED_DEMOS:-}"
    local new_demos="${ARG_NEW_DEMOS:-}"
    
    # Validate template file exists
    if [ ! -f "$template_file" ]; then
        log_error "Template file not found: $template_file"
        exit 1
    fi
    
    log_step "Generating demo comment from template: $template_file"
    
    # Debug: Show raw data if DEBUG is set
    if [ "${DEBUG:-}" = "true" ]; then
        log_info "🐛 DEBUG MODE: Raw input data:"
        log_info "  DEMO_IMAGES length: ${#demo_images}"
        log_info "  DEMO_IMAGES content: '$demo_images'"
        log_info "  CHANGED_DEMOS: '$changed_demos'"
        log_info "  NEW_DEMOS: '$new_demos'"
    fi
    
    # Set up environment variables for template substitution
    export GITHUB_REPOSITORY="$github_repository"
    export GITHUB_SHA="$github_sha"
    export USER_COMMIT_SHA="$user_commit_sha"
    
    # Set up computed environment variables for template
    set_change_status_message "$changed_demos" "$new_demos"
    export DEMO_LIST
    DEMO_LIST=$(build_demo_list "$demo_images" "$changed_demos" "$new_demos")
    
    # Generate comment using envsubst
    if [ -n "$output_file" ]; then
        log_info "Writing comment to: $output_file"
        envsubst < "$template_file" > "$output_file"
        log_success "Comment generated successfully"
    else
        log_info "Writing comment to stdout"
        envsubst < "$template_file"
    fi
}

# Main execution
main() {
    # Check required commands
    check_required_commands envsubst
    
    # Parse arguments
    parse_args "$@"
    
    # Handle help
    if [ "${ARG_HELP:-}" = "true" ]; then
        usage
        exit 0
    fi
    
    # Validate required arguments
    require_args "template-file" "github-repository" "github-sha" "user-commit-sha" "demo-images"
    
    # Run generation
    generate_demo_comment
}

# Only run main if script is executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
