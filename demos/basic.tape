# VHS Tape File for recording a demo of an example
# vhs documentation: https://github.com/charmbracelet/vhs
Output docs/img/basic-demo.gif

# Terminal appearance settings for deterministic output
Set FontSize 30
Set Width 1500
Set Height 600
Set TypingSpeed 100ms
Set Theme "iTerm2 Smoooooth"
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
Sleep 1s

# Clear the search to show all options again
Backspace 5
Sleep 1s

# Navigate to Vue and select it
Down Down
Tab
Sleep 1s

# Navigate to Angular and select it
Down
Tab
Sleep 1s

# Submit the selection
Enter

# Let people process
Sleep 3s