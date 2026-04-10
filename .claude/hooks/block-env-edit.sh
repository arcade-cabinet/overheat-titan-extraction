#!/usr/bin/env bash
# PreToolUse hook — blocks direct edits to .env secret files.
#
# Reads the tool-use JSON payload from stdin, extracts the target file,
# and exits non-zero (with stderr message) if it's a protected env file.
# Allows .env.example (the hand-edited reference file).
#
# Exit codes:
#   0  — allow the tool call to proceed
#   2  — block the tool call (Claude Code reports the stderr message)

set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
    exit 0
fi

payload="$(cat)"
file_path="$(echo "$payload" | jq -r '.tool_input.file_path // empty')"

if [[ -z "$file_path" ]]; then
    exit 0
fi

basename_file="$(basename "$file_path")"

case "$basename_file" in
    .env|.env.local|.env.production|.env.development|.env.staging)
        cat >&2 <<'EOF'
BLOCKED: Direct .env edit is not allowed.

Edit .env.example to document the variable, then set the actual
value in your local .env file manually. Never commit secret values.

See AGENTS.md §Environment for the full variable reference.
EOF
        exit 2
        ;;
    .env.example)
        # Explicitly allowed — this is the reference file.
        exit 0
        ;;
esac

exit 0
