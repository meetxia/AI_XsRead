#!/bin/bash
set -euo pipefail

cat >&2 <<'EOF'
This legacy database bootstrap script is deprecated.

Use the supported flow instead:
  1. mysql -u <user> -p ai_xsread < backend/database/init_step1.sql
  2. cd backend && npm run dev
  3. cd admin-backend && node scripts/init-admin.js

The old script used archived SQL and fixed credentials, so it is intentionally disabled.
EOF

exit 1
