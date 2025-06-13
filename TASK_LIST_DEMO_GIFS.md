# Demo GIF Generation Task List

## Project Context
Creating demo GIF files using **VHS Docker image** (`ghcr.io/charmbracelet/vhs`) to showcase the inquirerjs-checkbox-search examples in the README header. This will be CI-only since we don't have Docker locally.

## Scope Analysis
- **Primary Goal**: Create a header demo GIF for the `basic.js` example
- **Secondary Goal**: Set up infrastructure to generate more demos later
- **Tool**: [VHS](https://github.com/charmbracelet/vhs) via official Docker image
- **Environment**: GitHub Actions CI (no local Docker required)

## Key Examples to Demo
- [x] **basic.js** - Simple multi-select functionality (PRIORITY: README header)
- [ ] **search-filtering.js** - Real-time search filtering (good secondary demo)

## Tasks

### Phase 1: Create VHS Tape Files ⚡
- [x] **1.1** Create `demos/` directory structure
- [x] **1.2** Create `demos/basic.tape` - VHS script for basic example
- [ ] **1.3** Create `demos/search-filtering.tape` - VHS script for search demo
- [x] **1.4** Test tape syntax (review VHS docs for correct commands)

### Phase 2: GitHub Actions CI Workflow ⚡
- [x] **2.1** Create `.github/workflows/generate-demos.yml`
- [x] **2.2** Workflow steps:
  - [x] Checkout code
  - [x] Setup Node.js & install dependencies
  - [x] Build project (`npm run build`)
  - [x] Run VHS Docker container for each tape file
  - [x] Commit generated GIFs back to repo
- [x] **2.3** Test workflow by pushing to GitHub

### Phase 3: Integration & Testing ⚡
- [x] **3.1** Create initial commit with tape files and workflow
- [x] **3.2** Push and test CI generation
- [ ] **3.3** Debug any CI issues (likely will need iteration)
- [ ] **3.4** Verify generated GIFs are usable
- [ ] **3.5** Update README with header demo GIF

### Phase 4: Polish & Documentation 
- [ ] **4.1** Add npm scripts for local development (for future Docker users)
- [ ] **4.2** Document the GIF generation process in README
- [ ] **4.3** Set up automated regeneration on example changes (trigger workflow)

## Technical Implementation

### VHS Tape File Structure (basic.tape)
```tape
# demos/basic.tape
Output docs/img/basic-demo.gif

# Terminal appearance
Set FontSize 14
Set Width 800
Set Height 500
Set TypingSpeed 80ms
Set Theme "Catppuccin Mocha"

# Clear and run example
Type "clear && node examples/basic.js"
Enter
Sleep 1s

# Interact with the prompt - select React and Vue
Type "react"
Tab
Sleep 500ms
Down
Type "vue"  
Tab
Sleep 500ms
Enter
Sleep 2s
```

### GitHub Actions Workflow Structure
```yaml
name: Generate Demo GIFs
on:
  push:
    paths: ['examples/**', 'demos/**']
  workflow_dispatch:

jobs:
  generate-demos:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Generate basic demo
        run: |
          docker run --rm -v $PWD:/vhs ghcr.io/charmbracelet/vhs demos/basic.tape
      - name: Commit GIFs
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add docs/img/*.gif
          git commit -m "Update demo GIFs" || exit 0
          git push
```

## Critical Success Factors
1. **VHS tape syntax must be correct** - review VHS docs carefully
2. **Project must build successfully in CI** - ensure `npm run build` works
3. **Docker container must have access to files** - volume mounting setup
4. **Generated GIFs must be committed back** - git workflow setup

## Risks & Mitigation
- **Risk**: VHS tape syntax errors → **Mitigation**: Start simple, test incrementally
- **Risk**: CI permissions issues → **Mitigation**: Use `GITHUB_TOKEN` for commits  
- **Risk**: Docker container issues → **Mitigation**: Use official VHS image as-is
- **Risk**: File path issues → **Mitigation**: Use absolute paths in tape files

## Current Status
🟢 **Much Better Approach** - Using official VHS Docker image as base, just adding Node.js!

## REVISED PLAN: Custom Docker Image with Node.js + VHS

### The Problem
- Official VHS Docker image (`ghcr.io/charmbracelet/vhs`) is minimal and doesn't include Node.js
- We need Node.js to actually run our examples (`node examples/basic.js`)
- Current approach fails because `node` command doesn't exist in VHS container

### The Solution
**Build a custom Docker image that contains:**
1. ✅ Node.js runtime (base: `node:18`)
2. ✅ VHS installed
3. ✅ Our project code and dependencies
4. ✅ Ability to run actual examples

## Revised Tasks

### Phase 1: Custom Docker Image ⚡
- [x] **1.1** Create `Dockerfile` that extends `node:18`
- [x] **1.2** Install VHS in the Node.js container
- [x] **1.3** Copy project files and install dependencies
- [x] **1.4** Build the project inside the container
- [ ] **1.5** Test the Dockerfile locally (if possible)

### Phase 2: Update VHS Tape Files ⚡
- [x] **2.1** Update `demos/basic.tape` to work with the new setup
- [x] **2.2** Ensure tape file uses correct paths inside container
- [ ] **2.3** Test that `node examples/basic.js` actually works

### Phase 3: Update CI Workflow ⚡
- [x] **3.1** Update `.github/workflows/generate-demos.yml`
- [x] **3.2** Build our custom Docker image in CI
- [x] **3.3** Run VHS recording inside our custom container
- [x] **3.4** Extract generated GIFs from container
- [x] **3.5** Commit results back to repo

### Phase 4: Testing & Validation ⚡
- [ ] **4.1** Push updated changes and test in CI
- [ ] **4.2** Debug any Docker build issues
- [ ] **4.3** Verify actual examples run correctly
- [ ] **4.4** Validate generated GIF quality
- [ ] **4.5** Update README with demo GIF

## Next Actions
1. ✅ **Create Dockerfile** - Node.js base + VHS installation
2. ✅ **Update tape files** - Make sure they work with real examples
3. ✅ **Update CI workflow** - Build custom image and record demos
4. 🔄 **Test in CI** - Pushed commit `d23aafd`, waiting for results

## What We've Built
✅ **Custom Dockerfile** - Extends `node:18-slim` with VHS and our project
✅ **Updated VHS Tape** - Configured to run actual Node.js examples
✅ **Updated CI Workflow** - Builds custom image and records demos
✅ **Updated npm Scripts** - Local development with `npm run demo:generate`

**Commits**: 
- `d23aafd` - "feat: Custom Docker image with Node.js + VHS for real demo recording" 
- `8d91c23` - "fix(docker): Remove ttyd dependency, add ffmpeg and chromium for VHS"
- `13c338a` - "fix(docker): Install VHS from GitHub releases instead of broken install script"
- `d60f5c0` - "refactor: Use official VHS Docker image as base, add npm script pattern" ⭐

**Much Better Solution**: Instead of trying to build VHS from scratch, we now:
- `FROM ghcr.io/charmbracelet/vhs:latest` (official image with all dependencies!)
- Just add Node.js 18 on top of it
- Use proper npm script patterns: `npm run demo:generate:basic`
- CI calls npm scripts instead of raw docker commands

**CI Status**: Monitor at https://github.com/Texarkanine/inquirerjs-checkbox-search/actions 