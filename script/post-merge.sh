#!/bin/bash
set -euo pipefail

npm install --no-audit --no-fund
printf '\n' | npm run db:push