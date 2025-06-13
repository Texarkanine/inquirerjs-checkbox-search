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
🟡 **Testing in CI** - Pushed to GitHub, waiting for workflow results

## Next Actions
1. Monitor GitHub Actions workflow execution
2. Debug any issues that arise in CI
3. Verify the generated GIF quality
4. Update README with the demo GIF

## What We've Accomplished
✅ Created VHS tape file for basic example
✅ Set up GitHub Actions workflow with VHS Docker
✅ Added npm scripts for local development
✅ Pushed to GitHub and triggered CI workflow

The workflow is now running at: https://github.com/Texarkanine/inquirerjs-checkbox-search/actions 