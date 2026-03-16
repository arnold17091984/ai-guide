---
id: "001"
title: "setState called synchronously in useEffect"
severity: high
category: bug
status: open
files: "Header.tsx, NotificationBell.tsx, SearchBar.tsx"
round_found: 1
---
## Description
4 instances of setState called directly in useEffect body. React 19 strict mode flags this.
## Fix
Use initialization pattern or move to useLayoutEffect/useSyncExternalStore.
