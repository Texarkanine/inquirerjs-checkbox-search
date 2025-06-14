# VHS Tape File for recording a demo of an example
# vhs documentation: https://github.com/charmbracelet/vhs
Output docs/img/validation-demo.gif

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
Type "node examples/validation.js"
Enter
Sleep 1s
# Wait for the prompt to appear, then interact with it
Show

# Uncheck Alice first to get down to 1 selection
Tab
Sleep 1s

# Now try to submit with only 1 selection (Bob) - should show validation error
Enter
Sleep 2s

# Now add Alice back and one more person to get 3 total
# Check Alice back
Tab
Sleep 1s
# Move to Carol
Down
# Check Carol
Tab
Sleep 1s

# Try to add too many - go down and select more until we have 5
# Move to David
Down
# Check David
Tab
Sleep 1s
# Move to Eve
Down
# Check Eve
Tab
Sleep 1s
# Move to Frank
Down
# Check Frank
Tab
Sleep 1s

# Now we have 5 selected, try to submit - should show validation error
Enter
Sleep 2s

# Fix it by unchecking Frank to get back to 4
# Uncheck Frank
Tab
Sleep 1s

# Now submit with valid selection (Alice, Bob, Carol, David = 4 people)
Enter

# Let people process
Sleep 3s