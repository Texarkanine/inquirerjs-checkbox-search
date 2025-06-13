# Task List: Revert to GIF Format and Simple Image Tags

## Overview

Revert the demo system from MP4 video format back to GIF format with simple image tags, as the MP4 videos aren't providing better quality and GIF was working well.

## Tasks

### 1. Update GitHub Workflows

- [x] **generate-header-demo.yaml**: Change output format from MP4 to GIF
  - [x] Update file extensions (.mp4 → .gif)
  - [x] Update variable names and references
  - [x] Change video preview content to use img tags
  - [x] Update artifact paths and names
- [x] **cleanup-demo-images.yaml**: Update file patterns and references
  - [x] Change file extensions (.mp4 → .gif)
  - [x] Update image naming patterns

### 2. Update Documentation

- [x] **README.md**: Replace video tag with img tag
  - [x] Change from `<video>` to `<img>` tag
  - [x] Update source path (header.mp4 → header.gif)

### 3. Update Demo Configuration

- [x] **basic.tape**: Change VHS output format
  - [x] Update Output directive (.mp4 → .gif)

### 4. Verification

- [x] Verify all file references are consistent
- [x] Confirm workflow logic still works with GIF format
- [x] Test that image tags display properly

## Status

- **Started**: ✅
- **In Progress**: ✅
- **Completed**: ✅

## Summary of Changes Made

### Files Updated:

1. **`.github/workflows/generate-header-demo.yaml`**:

   - Changed workflow name from "Header Demo MP4" to "Header Demo GIF"
   - Updated all file extensions from `.mp4` to `.gif`
   - Changed video preview content to use `<img>` tags instead of `<video>` tags
   - Updated artifact names and paths
   - Updated all log messages and comments

2. **`.github/workflows/cleanup-demo-images.yaml`**:

   - Updated file patterns from `*-header.mp4` to `*-header.gif`
   - Changed all references to use GIF extension

3. **`README.md`**:

   - Replaced `<video>` tag with `<img>` tag
   - Updated source from `header.mp4` to `header.gif`
   - Added proper alt text for accessibility

4. **`demos/basic.tape`**:
   - Changed output from `basic-demo.mp4` to `basic-demo.gif`

All files have been successfully updated to revert from MP4 video format back to GIF image format with simple image tags.
