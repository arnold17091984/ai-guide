# Round 4 Summary
- Fixed: 5 medium/low-severity issues
- ThemeToggle: classList.replace → remove/add for reliability
- updateEntry: wrapped in transaction
- resolveTagIds: inArray() optimization (no longer fetches all tags)
- CommentSection: defensive Date wrapping
- NotificationBell: pause polling on hidden tab
