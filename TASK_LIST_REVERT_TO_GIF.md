# Task List: Revert to GIF Format and Simple Image Tags

## Overview
Revert the demo system from MP4 video format back to GIF format with simple image tags, as the MP4 videos aren't providing better quality and GIF was working well.

## Tasks

### 1. Update GitHub Workflows
- [ ] **generate-header-demo.yaml**: Change output format from MP4 to GIF
  - [ ] Update file extensions (.mp4 → .gif)
  - [ ] Update variable names and references
  - [ ] Change video preview content to use img tags
  - [ ] Update artifact paths and names
- [ ] **cleanup-demo-images.yaml**: Update file patterns and references
  - [ ] Change file extensions (.mp4 → .gif)
  - [ ] Update image naming patterns

### 2. Update Documentation
- [ ] **README.md**: Replace video tag with img tag
  - [ ] Change from `<video>` to `<img>` tag
  - [ ] Update source path (header.mp4 → header.gif)

### 3. Update Demo Configuration
- [ ] **basic.tape**: Change VHS output format
  - [ ] Update Output directive (.mp4 → .gif)

### 4. Verification
- [ ] Verify all file references are consistent
- [ ] Confirm workflow logic still works with GIF format
- [ ] Test that image tags display properly

## Status
- **Started**: ✅
- **In Progress**: ��
- **Completed**: ⏳ 