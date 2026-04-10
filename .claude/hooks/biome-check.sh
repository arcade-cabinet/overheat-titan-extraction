#!/usr/bin/env bash
# PostToolUse hook — runs Biome check --fix on edited JS/JSX/TS/TSX files.
#
# Reads the tool-use JSON payload from stdin (Claude hook protocol), pulls
# the edited file path, and runs `pnpm exec biome check --fix` on it.
# Silent on success, logs to stderr on failure but does NOT block the
# tool call — Claude will see lint output in the next turn and can act on it.
#
# Only runs for Edit/Write/MultiEdit targeting *.js / *.jsx files under src/.

set -euo pipefail

# Require jq — fail open rather than blocking every edit.
if ! command -v jq >/dev/null 2>&1; then
    exit 0
fi

payload="$(cat)"
file_path="$(echo "$payload" | jq -r '.tool_input.file_path // empty')"

if [[ -z "$file_path" ]]; then
    exit 0
fi

# Only lint JS/JSX source files.
case "$file_path" in
    *.js|*.jsx|*.mjs|*.cjs) ;;
    *) exit 0 ;;
esac

# Skip generated / vendored / build output.
case "$file_path" in
    */node_modules/*|*/dist/*|*/.vite/*|*/coverage/*) exit 0 ;;
esac

project_root="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Only act on files inside the project.
case "$file_path" in
    "$project_root"/*) ;;
    *) exit 0 ;;
esac

if ! command -v pnpm >/dev/null 2>&1; then
    exit 0
fi

cd "$project_root"

if ! pnpm exec biome check --fix --no-errors-on-unmatched "$file_path" 2>&1; then
    echo "biome-check: lint issues found in $file_path (non-blocking)" >&2
fi

exit 0
