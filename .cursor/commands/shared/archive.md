# ARCHIVE Command - Task Archiving & Cleanup

**⛔ COMPLETION GATE:** This command ends with a git commit. Do not report completion until `git log -1` shows `chore: archive <task-id>`.

This command creates comprehensive archive documentation, clears task-specific files from the Memory Bank, and commits all changes in a single git commit.

## Memory Bank Integration

Reads from:
- `memory-bank/tasks.md` - Complete task details and checklists
- `memory-bank/reflection/reflection-<task-id>.md` - Reflection document
- `memory-bank/progress.md` - Implementation status
- `memory-bank/creative/creative-*.md` - Creative phase documents (Level 3-4)

Creates:
- `memory-bank/archive/<kind>/<YYYYMMDD>-<task-id>.md` - Archive document

**Archive Kind Categories:**
- `bug-fixes/` - Bug fixes and quick fixes (Level 1-2)
- `enhancements/` - Simple enhancements and improvements (Level 2)
- `features/` - New features and functionality (Level 3)
- `systems/` - Complex system changes and architecture (Level 4)
- `documentation/` - Documentation updates and improvements

Clears (task-specific, ephemeral):
- `memory-bank/tasks.md` - Reset to initial state
- `memory-bank/progress.md` - Reset to initial state
- `memory-bank/activeContext.md` - Reset to initial state
- `memory-bank/creative/` - Remove all files
- `memory-bank/reflection/` - Remove all files
- `memory-bank/.qa_validation_status` - Remove if exists

Preserves (repository-specific, persistent):
- `memory-bank/projectbrief.md` - Project foundation
- `memory-bank/productContext.md` - Product context
- `memory-bank/systemPatterns.md` - System patterns
- `memory-bank/techContext.md` - Tech context
- `memory-bank/style-guide.md` - Style guide
- `memory-bank/archive/` - All archive documents (including newly created)

## Progressive Rule Loading

### Step 1: Load Core Rules
```
Load: .cursor/rules/shared/niko/main.mdc
Load: .cursor/rules/shared/niko/Core/memory-bank-paths.mdc
```

### Step 2: Load ARCHIVE Mode Map
```
Load: .cursor/rules/shared/niko/visual-maps/archive-mode-map.mdc
```

### Step 3: Load Complexity-Specific Archive Rules
Based on complexity level from `memory-bank/tasks.md`:

**Level 1:**
```
Load: .cursor/rules/shared/niko/Level1/quick-documentation.mdc
```

**Level 2:**
```
Load: .cursor/rules/shared/niko/Level2/archive-basic.mdc
```

**Level 3:**
```
Load: .cursor/rules/shared/niko/Level3/archive-intermediate.mdc
```

**Level 4:**
```
Load: .cursor/rules/shared/niko/Level4/archive-comprehensive.mdc
```

## Workflow

### 1. Verify Reflection Complete
- Check that `memory-bank/reflection/reflection-<task-id>.md` exists
- Verify reflection is complete
- If not complete, return to `/reflect` command

### 2. Create Archive Document

**Level 1:**
- Create quick summary in archive

**Level 2:**
- Create basic archive document
- Document changes made

**Level 3-4:**
- Create comprehensive archive document
- Include: Metadata, Summary, Requirements, Implementation details, Testing, Lessons Learned, References
- Document code changes
- Document testing approach
- Summarize lessons learned

**Archive Document Structure:**
```
# TASK ARCHIVE: [Task Name]

## METADATA
- Task ID, dates, complexity level

## SUMMARY
Brief overview of the task

## REQUIREMENTS
What the task needed to accomplish

## IMPLEMENTATION
How the task was implemented

## TESTING
How the solution was verified

## LESSONS LEARNED
Key takeaways from the task

## REFERENCES
Links to related documents (reflection, creative phases, etc.)
```

### 3. Clear Task-Specific Files

After creating the archive document, clear all task-specific files:

**Remove files in directories:**
- Delete all files in `memory-bank/creative/` directory
- Delete all files in `memory-bank/reflection/` directory

**Remove files:**
- Delete `memory-bank/.qa_validation_status` if it exists

**Reset files to initial state:**
- `memory-bank/tasks.md` - Clear content, reset to empty template
- `memory-bank/progress.md` - Clear content, reset to empty template
- `memory-bank/activeContext.md` - Clear content, reset to empty template

### 4. Git Commit (REQUIRED)

**CRITICAL:** Always make a git commit at the end. This step is mandatory and must not be skipped.

```bash
git add memory-bank/
git commit --no-gpg-sign -m "chore: archive <task-id> and clear memory bank"
```

The commit message should include the task ID being archived. Examples:
- `chore: archive auth-feature and clear memory bank`
- `chore: archive bugfix-login and clear memory bank`

This makes the entire operation revertable via `git revert HEAD`.

### 5. Verification

After committing, verify:
- Archive document exists in `memory-bank/archive/<kind>/`
- Task-specific files are cleared/reset
- Repository-specific files remain untouched
- Git commit was successful (check exit code)

## Usage

Type `/archive` to archive the completed task after reflection is done.

This command will:
1. Create the archive document
2. Clear all task-specific memory bank files
3. Commit everything in a single `chore:` commit

## Verification (REQUIRED before responding)

Before reporting completion, run:
```bash
git log -1 --oneline && git status --short memory-bank/
```

**Expected output:**
- First line: `<hash> chore: archive <task-id> and clear memory bank`
- No unstaged changes in memory-bank/

If verification fails, complete the missing steps before responding.

## Next Steps

After archiving complete, use `/niko` command to start the next task.

The Memory Bank will be ready for new tasks with only repository-specific knowledge preserved.
