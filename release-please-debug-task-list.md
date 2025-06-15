# Release-Please Configuration Debug Task List

## Problem Statement

- `pull-request-header` configuration not working (PR body shows default ":robot:" instead of custom ":service_dog:")
- `pull-request-title-pattern` configuration not working (workflow logs show "undefined")
- Both PR title and body are using default formats instead of configured custom text

## Investigation Tasks

### ✅ Completed

- [x] Initial problem identification
- [x] Added `pull-request-title-pattern` configuration attempt

### ✅ Completed

- [x] Initial problem identification
- [x] Added `pull-request-title-pattern` configuration attempt
- [x] **Current State Analysis**
  - [x] Examine current release-please-config.json
  - [x] Check GitHub workflow configuration
  - [x] Review release-please manifest file
  - [x] Research release-please v4 configuration format

### 🔄 In Progress

- [ ] **Root Cause Analysis & Solution**
  - [x] Identified workflow issue: using `release-type: node` bypasses manifest config
  - [x] Identified configuration issue: wrong location of config options
  - [x] Fix workflow configuration
  - [x] Fix config file structure
  - [x] Test configuration changes - revealed tag format mismatch issue
  - [x] Fix tag format: added `"include-component-in-tag": false`
  - [ ] Final testing after commit and push

### 🎯 Success Criteria

- [ ] PR title shows custom ":service_dog:" pattern
- [ ] PR body shows custom ":service_dog:" header text
- [ ] Workflow logs show configurations are being read correctly

## Notes

- Project uses release-please v4 with node release type
- Current version: 0.4.0 → 0.5.0
- Active release PR #26 shows default formatting
