# VHS Tape File for Basic Example Demo
# Records the actual inquirerjs-checkbox-search basic example running

# Output settings
Output docs/img/basic-demo.gif

# Terminal appearance settings for deterministic output
Set FontSize 30
Set Width 1500
Set Height 300
Set TypingSpeed 100ms
Set Theme "Catppuccin Mocha"
Set Padding 20
Set PlaybackSpeed 1.0

# Setup
Hide
Type "node examples/basic.js"
Enter
Sleep 1s
# Wait for the prompt to appear, then interact with it
Show

# The basic example shows a multi-select with React, Vue, Angular, etc.

# First, let's search for "react" to filter
Type "react"
Sleep 1s

# Select React (should be filtered to show only React)
Tab
Sleep 500ms

# Clear the search to show all options again
Backspace 5
Sleep 800ms

# Navigate to Vue and select it
Down Down
Tab
Sleep 500ms

# Navigate to Angular and select it  
Down
Tab
Sleep 500ms

# Submit the selection
Enter
Sleep 2s

# Show the final result
Sleep 1s
