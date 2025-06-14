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
        "[--output-file <path>]"
    echo "Options:"
    echo "  --template-file   Path to the comment template file (required)"
    echo "  --output-file     Output file path (default: stdout)"
    echo "  --help            Show this help message"
    echo
    echo "Required Environment Variables:"
    echo "  GITHUB_REPOSITORY     Repository in 'owner/repo' format"
    echo "  GITHUB_SHA           GitHub's merge commit SHA"
    echo "  USER_COMMIT_SHA      User's actual commit SHA"
    echo "  DEMO_CHANGED         'true' or 'false' - whether demos changed"
    echo "  DEMO_IMAGES          Space-separated 'name:url' pairs"
    echo "  CHANGED_DEMOS        Space-separated list of changed demo names"
    echo
    echo "Examples:"
    echo "  $0 --template-file=template.md                    # Output to stdout"
    echo "  $0 --template-file=template.md --output-file=out.md   # Output to file"
}

# Build demo list section from environment variables
build_demo_list() {
    local demo_images="$DEMO_IMAGES"
    local changed_demos="$CHANGED_DEMOS"
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
        # Get the URL for this demo
        local demo_url
        demo_url=$(echo "$demo_images" | tr ' ' '\n' | grep "^${demo_name}:" | cut -d':' -f2-)
        
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
            # Check if this is a new demo or changed demo (check committed history, not staging)
            set +e
            git cat-file -e HEAD:"docs/img/${demo_name}-demo.gif" 2>/dev/null
            local demo_is_new=$?
            set -e
            if [ $demo_is_new -ne 0 ]; then
                demo_list="$demo_list
<details open>
<summary>🆕 demos/${demo_name}.gif (NEW)</summary>

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
    if [ "$DEMO_CHANGED" = "true" ]; then
        export CHANGE_STATUS_MESSAGE="⚠️ **Changes detected** - Please review the generated demos to ensure they accurately represent the library."
    else
        export CHANGE_STATUS_MESSAGE="✅ **Demos are stable** - No changes detected in demo output."
    fi
}

# Generate comment from template
generate_demo_comment() {
    local template_file="$ARG_TEMPLATE_FILE"
    local output_file="${ARG_OUTPUT_FILE:-}"
    
    # Validate template file exists
    if [ ! -f "$template_file" ]; then
        log_error "Template file not found: $template_file"
        exit 1
    fi
    
    # Validate required environment variables
    local required_vars=(
        "GITHUB_REPOSITORY"
        "GITHUB_SHA" 
        "USER_COMMIT_SHA"
        "DEMO_CHANGED"
        "DEMO_IMAGES"
        "CHANGED_DEMOS"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi
    
    log_step "Generating demo comment from template: $template_file"
    
    # Debug: Show actual environment variable values
    log_info "Environment variables received:"
    log_info "  DEMO_IMAGES='$DEMO_IMAGES'"
    log_info "  CHANGED_DEMOS='$CHANGED_DEMOS'"
    log_info "  DEMO_CHANGED='$DEMO_CHANGED'"
    
    # Set up additional environment variables for template
    set_change_status_message
    export DEMO_LIST
    DEMO_LIST=$(build_demo_list)
    
    # Debug: Show generated demo list
    log_info "Generated DEMO_LIST length: ${#DEMO_LIST}"
    if [ ${#DEMO_LIST} -lt 200 ]; then
        log_info "DEMO_LIST content: '$DEMO_LIST'"
    else
        log_info "DEMO_LIST content (first 200 chars): '${DEMO_LIST:0:200}...'"
    fi
    
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
    check_required_commands envsubst git
    
    # Parse arguments
    parse_args "$@"
    
    # Handle help
    if [ "${ARG_HELP:-}" = "true" ]; then
        usage
        exit 0
    fi
    
    # Validate required arguments
    require_args "template-file"
    
    # Run generation
    generate_demo_comment
}

# Only run main if script is executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
