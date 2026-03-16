---
id: "010"
title: "createAdminClient uses non-null assertions without validation"
severity: high
category: security
status: open
file: "src/lib/supabase/server.ts"
round_found: 2
---
Add explicit env var checks with descriptive errors.
