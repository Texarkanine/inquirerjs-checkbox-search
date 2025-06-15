#!/bin/bash

# Common utilities for GitHub workflow scripts
# This script provides shared functions used across multiple workflow scripts.

set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $*${NC}" >&2
}

log_success() {
    echo -e "${GREEN}✅ $*${NC}" >&2
}

log_warning() {
    echo -e "${YELLOW}⚠️  $*${NC}" >&2
}

log_error() {
    echo -e "${RED}❌ $*${NC}" >&2
}

log_step() {
    echo -e "${BLUE}🔄 $*${NC}" >&2
}

# Configure git for GitHub Actions
configure_git() {
    log_step "Configuring git..."
    git config --local user.email "action@github.com"
    git config --local user.name "GitHub Action"
    log_success "Git configured"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validate required commands
check_required_commands() {
    local missing_commands=()
    
    for cmd in "$@"; do
        if ! command_exists "$cmd"; then
            missing_commands+=("$cmd")
        fi
    done
    
    if [ ${#missing_commands[@]} -gt 0 ]; then
        log_error "Missing required commands: ${missing_commands[*]}"
        exit 1
    fi
}

# Parse command line arguments into variables
# Usage: parse_args "$@"
# Sets global variables based on --flag=value or --flag value patterns
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --*=*)
                # Handle --flag=value format
                key="${1%%=*}"
                value="${1#*=}"
                key="${key#--}"
                key="${key//-/_}"  # Convert dashes to underscores
                key="${key^^}"     # Convert to uppercase
                printf -v "ARG_${key}" '%s' "$value"
                ;;
            --*)
                # Handle --flag value format
                key="${1#--}"
                key="${key//-/_}"  # Convert dashes to underscores  
                key="${key^^}"     # Convert to uppercase
                if [[ $# -gt 1 && ! $2 =~ ^-- ]]; then
                    printf -v "ARG_${key}" '%s' "$2"
                    shift
                else
                    printf -v "ARG_${key}" '%s' "true"
                fi
                ;;
            *)
                log_warning "Unknown argument: $1"
                ;;
        esac
        shift
    done
}

# Check if required arguments are provided
require_args() {
    local missing_args=()
    
    for arg in "$@"; do
        local var_name="ARG_${arg^^}"
        var_name="${var_name//-/_}"  # Convert dashes to underscores
        if [ -z "${!var_name:-}" ]; then
            missing_args+=("--${arg,,}")
        fi
    done
    
    if [ ${#missing_args[@]} -gt 0 ]; then
        log_error "Missing required arguments: ${missing_args[*]}"
        exit 1
    fi
}

# Get file size in bytes
get_file_size() {
    if [ -f "$1" ]; then
        du -sb "$1" 2>/dev/null | cut -f1 || echo "0"
    else
        echo "0"
    fi
}

# Format bytes to human readable
format_bytes() {
    local bytes="$1"
    if command_exists numfmt; then
        numfmt --to=iec "$bytes" 2>/dev/null || echo "${bytes} bytes"
    else
        echo "${bytes} bytes"
    fi
}

# Check if git branch exists (local or remote)
branch_exists() {
    local branch="$1"
    local location="${2:-both}" # local, remote, or both
    
    case "$location" in
        local)
            git show-ref --verify --quiet "refs/heads/$branch"
            ;;
        remote)
            git ls-remote --heads origin "$branch" | grep -q "$branch"
            ;;
        both)
            git show-ref --verify --quiet "refs/heads/$branch" || \
            git ls-remote --heads origin "$branch" | grep -q "$branch"
            ;;
        *)
            log_error "Invalid branch location: $location"
            return 1
            ;;
    esac
}

# Extract PR number from filename (pr-123-abc.gif -> 123)
extract_pr_number() {
    local filename="$1"
    echo "$filename" | sed -n 's/^pr-\([0-9]\+\)-.*\.gif$/\1/p'
}

# Show usage information
show_usage() {
    local script_name="$1"
    shift
    echo "Usage: $script_name $*"
    echo
    echo "This script is part of the GitHub workflow automation system."
    echo "It should be called from GitHub Actions with appropriate arguments."
    echo
}
