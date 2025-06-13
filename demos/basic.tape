# VHS Tape File for Basic Example Demo
# Records the actual inquirerjs-checkbox-search basic example running

# Output settings
Output docs/img/basic-demo.gif

# Terminal appearance settings
Set FontSize 14
Set Width 1000
Set Height 600
Set TypingSpeed 100ms
Set Theme "Catppuccin Mocha"
Set Padding 20

# Clear terminal and show the command we'll run
Type "clear"
Enter
Sleep 500ms

# Show the command prompt
Type "# Demo: inquirerjs-checkbox-search basic example"
Enter
Type "node examples/basic.js"
Enter
Sleep 1.5s

# Wait for the prompt to appear, then interact with it
# The basic example shows a multi-select with React, Vue, Angular, etc.

# First, let's search for "react" to filter
Type "react"
Sleep 1s

# Select React (should be filtered to show only React)
Space
Sleep 500ms

# Clear the search to show all options again
Backspace 5
Sleep 800ms

# Navigate to Vue and select it
Down Down
Space
Sleep 500ms

# Navigate to Angular and select it  
Down
Space
Sleep 500ms

# Submit the selection
Enter
Sleep 2s

# Show the final result
Sleep 1s 