---
id: "007"
title: "Race condition in knowledge entry update"
severity: high
category: security
status: open
file: "src/lib/knowledge/actions.ts"
round_found: 2
---
Wrap updateEntry in single transaction.
