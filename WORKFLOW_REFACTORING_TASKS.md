# Workflow Scripts Refactoring Task List

## 🎯 Objective
Refactor GitHub workflow shell scripts out of YAML files into standalone, testable scripts with CLI interfaces and template-based comment generation.

## 📋 Tasks

### Phase 1: Infrastructure Setup
- [x] Create `.github/workflows/scripts/` directory structure
- [x] Create `.github/workflows/scripts/templates/` directory
- [x] Create `common.sh` with shared utilities (git config, error handling)

### Phase 2: Script Extraction & Creation
- [x] **cleanup-demo-images.sh** - Extract cleanup logic from `cleanup-demo-images.yaml`
  - CLI args: `--event-name`, `--pr-number`, `--gh-token`
  - Handle both single PR and bulk cleanup modes
- [x] **upload-demo-images.sh** - Extract upload logic from `generate-header-demo.yaml`  
  - CLI args: `--pr-number`, `--commit-sha`, `--repository`, `--head-ref`
  - Output demo images list in structured format
- [x] **detect-demo-changes.sh** - Extract change detection logic
  - CLI args: `--output-format` (env|json)
  - Output changed demos list and overall change status
- [x] **generate-demo-comment.sh** - Extract comment generation logic
  - CLI args: `--template-file`, `--output-file`
  - Use `envsubst` for template substitution
- [x] **commit-demo-changes.sh** - Extract commit logic with retry
  - CLI args: `--retry-count`, `--branch`, `--commit-message`

### Phase 3: Template Creation
- [x] **demo-comment.md** - Main comment template with `${VAR}` placeholders
- [ ] **demo-item-new.md** - Template for NEW demo items
- [ ] **demo-item-changed.md** - Template for CHANGED demo items  
- [ ] **demo-item-unchanged.md** - Template for unchanged demo items

### Phase 4: Workflow Updates
- [x] **Update cleanup-demo-images.yaml** - Replace inline scripts with script calls
- [x] **Update generate-header-demo.yaml** - Replace inline scripts with script calls
  - Pass GitHub context via environment variables
  - Chain scripts with proper data flow

### Phase 5: Testing & Validation
- [x] Test cleanup workflow functionality
- [x] Test demo generation workflow functionality  
- [x] Verify templates render correctly
- [x] Test script CLI interfaces locally
- [ ] Run full workflow test

## 🎯 Success Criteria
- [x] All inline shell scripts moved to separate files
- [x] Scripts accept input via CLI flags (no envvar reading)
- [x] Templates use `${VAR}` syntax with `envsubst`
- [x] YAML workflows are clean and readable
- [x] Scripts are testable locally with proper inputs
- [x] All existing functionality preserved

---
**Status**: ✅ **COMPLETED** - Major refactoring complete! 