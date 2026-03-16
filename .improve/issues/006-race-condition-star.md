---
id: "006"
title: "Race condition in star toggle (TOCTOU)"
severity: high
category: security
status: open
file: "src/lib/skills/actions.ts"
round_found: 2
---
Wrap star toggle in db.transaction() to prevent duplicate stars.
