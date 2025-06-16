# VHS Tape File for recording a demo of the custom theme example
# vhs documentation: https://github.com/charmbracelet/vhs

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
Type "node examples/custom-theme.js"
Enter
Sleep 1s
# Wait for the prompt to appear, then interact with it
Show

Sleep 1s

# The custom theme example shows fruit options with custom emoji icons

# First, let's search for "apple" to filter
Type "apple"
Sleep 1s

# Select Apple (should be filtered to show only Apple)
Tab
Sleep 1s

# Clear the search to show all options again
Backspace 5
Sleep 1s

# Navigate to Banana and select it
Down
Tab
Sleep 1s

# Navigate to Orange and select it
Down
Tab
Sleep 1s

# Navigate to Grape and select it
Down
Tab
Sleep 1s

# Submit the selection
Enter

# Let people process the results with custom emoji output
Sleep 3s