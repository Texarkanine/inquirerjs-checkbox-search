# VHS Tape File for Basic Example Demo
# This scripts a terminal session showing the basic checkbox search functionality

# Output settings
Output docs/img/basic-demo.gif

# Terminal appearance settings
Set FontSize 14
Set Width 800
Set Height 500
Set TypingSpeed 80ms
Set Theme "Catppuccin Mocha"
Set Padding 20

# Clear terminal and run the basic example
Type "clear"
Enter
Sleep 500ms
Type "node examples/basic.js"
Enter
Sleep 1s

# Show the prompt appearing
Sleep 1s

# Start typing to search for React
Type "react"
Sleep 800ms
Tab
Sleep 500ms

# Navigate down and select Vue
Down
Sleep 500ms
Type "vue"
Sleep 800ms
Tab
Sleep 500ms

# Confirm selection
Enter
Sleep 2s

# Show the final result
Sleep 1s 