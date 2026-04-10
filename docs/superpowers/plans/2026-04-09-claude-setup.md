# Claude Agent Setup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `.claude/` directory that matches the objexiv gold standard — hooks for auto-lint and env protection, standing rules files, and settings.json wiring.

**Architecture:** Mirror objexiv's `.claude/` structure, adapting for this project's Biome/pnpm toolchain and browser WebGL game context.

**Tech Stack:** Bash hook scripts, JSON settings, Markdown rules.

---

## File map

| Action | File | Purpose |
|---|---|---|
| Create | `.claude/settings.json` | Hook wiring and tool permissions |
| Create | `.claude/hooks/biome-check.sh` | Auto-lint JSX/JS after Edit/Write |
| Create | `.claude/hooks/block-env-edit.sh` | Block edits to .env files |
| Create | `.claude/rules/README.md` | Rules index |
| Create | `.claude/rules/01-nothing-out-of-scope.md` | Scope discipline rule |
| Create | `.claude/rules/02-operating-discipline.md` | Codebase hygiene rule |
| Create | `.claude/rules/03-avoid-github-mcp.md` | Token efficiency rule |
| Create | `.claude/agents/` | Placeholder dir for future specialist agents |

---

## Task 1: Create `.claude/settings.json`

**Files:**
- Create: `.claude/settings.json`

- [ ] **Step 1: Create the settings file**

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/biome-check.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/block-env-edit.sh"
          }
        ]
      }
    ]
  },
  "permissions": {
    "allow": [
      "Read(.claude/**)",
      "Write(.claude/**)",
      "Edit(.claude/**)",
      "Bash(bash .claude/hooks/**)",
      "Write(.claude/agents/**)"
    ]
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .claude/settings.json
git commit -m "chore(claude): add settings.json — hook wiring and permissions"
```

---

## Task 2: Create `.claude/hooks/biome-check.sh`

**Files:**
- Create: `.claude/hooks/biome-check.sh`

- [ ] **Step 1: Create the hook**

```bash
#!/usr/bin/env bash
# PostToolUse hook — runs Biome check --fix on edited JS/JSX files.
#
# Reads the tool-use JSON payload from stdin, extracts the edited file path,
# and runs `pnpm biome check --fix` against it.
# Silent on success, logs to stderr on failure but does NOT block the tool call.
#
# Only runs for Edit and Write tools targeting *.js / *.jsx / *.ts / *.tsx
# under the project root. Skips node_modules, dist, build.

set -euo pipefail

payload="$(cat)"

if ! command -v jq >/dev/null 2>&1; then
    exit 0
fi

file_path="$(echo "$payload" | jq -r '.tool_input.file_path // empty')"

if [[ -z "$file_path" ]]; then
    exit 0
fi

# Only lint JS/JSX/TS/TSX source files.
case "$file_path" in
    *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs) ;;
    *) exit 0 ;;
esac

# Skip generated / vendored / build output.
case "$file_path" in
    */node_modules/*|*/dist/*|*/build/*|*/.turbo/*|*/coverage/*) exit 0 ;;
esac

project_root="${CLAUDE_PROJECT_DIR:-$(pwd)}"

case "$file_path" in
    "$project_root"/*) ;;
    *) exit 0 ;;
esac

if ! command -v pnpm >/dev/null 2>&1; then
    exit 0
fi

cd "$project_root"
if ! pnpm -s biome check --fix --no-errors-on-unmatched "$file_path" 2>&1; then
    echo "biome-check: lint issues in $file_path (non-blocking)" >&2
fi

exit 0
```

- [ ] **Step 2: Make executable and commit**

```bash
chmod +x .claude/hooks/biome-check.sh
git add .claude/hooks/biome-check.sh
git commit -m "chore(claude): add biome-check PostToolUse hook"
```

---

## Task 3: Create `.claude/hooks/block-env-edit.sh`

**Files:**
- Create: `.claude/hooks/block-env-edit.sh`

- [ ] **Step 1: Create the hook**

```bash
#!/usr/bin/env bash
# PreToolUse hook — blocks Edit/Write operations on .env files.
#
# Reads the tool-use JSON payload from stdin. If the target file is a .env
# file (any variant: .env, .env.local, .env.production, etc.), prints a
# clear refusal message and exits 2 (blocking the tool call).

set -euo pipefail

payload="$(cat)"

if ! command -v jq >/dev/null 2>&1; then
    exit 0
fi

file_path="$(echo "$payload" | jq -r '.tool_input.file_path // empty')"

if [[ -z "$file_path" ]]; then
    exit 0
fi

# Block any file whose basename starts with .env
basename="$(basename "$file_path")"
case "$basename" in
    .env|.env.*|env.local)
        echo "BLOCKED: Refusing to edit $file_path — .env files contain secrets. Edit .env.example instead, or ask the user to update the .env directly." >&2
        exit 2
        ;;
esac

exit 0
```

- [ ] **Step 2: Make executable and commit**

```bash
chmod +x .claude/hooks/block-env-edit.sh
git add .claude/hooks/block-env-edit.sh
git commit -m "chore(claude): add block-env-edit PreToolUse hook"
```

---

## Task 4: Create `.claude/rules/README.md`

**Files:**
- Create: `.claude/rules/README.md`

- [ ] **Step 1: Create the rules index**

```markdown
# Standing Operating Rules

These rules apply to every Claude Code session on this repository.
Read all three before taking any action.

| # | Rule | Summary |
|---|---|---|
| 01 | [Nothing is out of scope](./01-nothing-out-of-scope.md) | Never defer or call something out of scope. Work additively, always. |
| 02 | [Operating discipline](./02-operating-discipline.md) | Clean up as you go. Improve the codebase and agentic surface continuously. |
| 03 | [Avoid GitHub MCP](./03-avoid-github-mcp.md) | Use `gh` CLI instead — GitHub MCP is massively token-intensive. |

## How to add a new rule

1. Create `NN-rule-name.md` with a clear frontmatter header (name, description, scope, enforced_by).
2. Write: the rule itself, its origin/why, and how to apply it.
3. Add a row to this README table.
4. Commit with `chore(claude): add rule NN — <name>`.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/rules/README.md
git commit -m "chore(claude): add rules directory README"
```

---

## Task 5: Create the three standing rules

**Files:**
- Create: `.claude/rules/01-nothing-out-of-scope.md`
- Create: `.claude/rules/02-operating-discipline.md`
- Create: `.claude/rules/03-avoid-github-mcp.md`

- [ ] **Step 1: Create rule 01**

```markdown
---
name: Nothing is out of scope — work additively, escalate when too large
description: Scope is whatever tasks are in front of you PLUS whatever surfaces. Never defer. When a task exceeds one pass, escalate via task-batch skill.
scope: all
enforced_by: discipline
---

## The rule

Never say "out of scope", "defer", "follow-up", or "future work". If a task is in front of you, it IS the scope. Work additively. Find the best way to accomplish everything, always.

## How to apply

1. **Never defer.** Blockers are the work. "Out of scope" is never your call.
2. **Assess at the start of every non-trivial task.** Can you complete the entire goal in one pass without needing the user to tell you to continue? If NO → escalate.
3. **Escalation protocol:** invoke `create-task-batch` skill, commit and push planning docs, transition to `task-batch` for autonomous execution.
4. **Signals the task is too large:** touches > 10 unrelated files, multi-step migration, unknown failure paths, multiple long-running builds.
5. **Do NOT ping with** "should I continue?" or "ready for next step?" — that forces the user into a babysitting role.

## OVERHEAT-specific note

This is a browser WebGL game. "Out of scope" examples that are ALWAYS in scope:
- A failing build discovered while implementing a feature → fix it before proceeding.
- A missing CHANGELOG.md → create it.
- A Biome lint error in a file you touched → fix it.
- An outdated HANDOFF.md entry → update it.
```

- [ ] **Step 2: Create rule 02**

```markdown
---
name: Operating discipline — clean up, improve continuously
description: Leave the codebase and agentic surface better than you found them. Encode non-obvious patterns in CLAUDE.md or docs/. Build enforcement into hooks and rules.
scope: all
enforced_by: discipline
---

## The rule

Always clean up and improve as you go. Never leave a session with:
- Scratch files, stale state, or half-finished tasks.
- A failing build.
- An outdated HANDOFF.md.
- A non-obvious pattern discovered but not encoded anywhere.

## How to apply

1. **Encode patterns:** if you discover a non-obvious convention or gotcha (e.g., "simplex-noise must be imported as createNoise2D, not a default export"), write it to the relevant CLAUDE.md or docs/ file immediately.
2. **Enforce with automation:** if a rule can be enforced by a hook or rule file, build it — rules in prose are weak, rules in tooling are strong.
3. **Update HANDOFF.md** before every commit that changes implementation state.
4. **Fix build failures first.** Never leave the tree in a failing build state.

## OVERHEAT-specific note

- After implementing a feature, check `docs/HANDOFF.md §2` and mark the item `[x]`.
- After establishing a new architectural pattern, add it to `docs/STANDARDS.md`.
- After making a pivotal decision, record it in `docs/architecture/decisions.md`.
- Always run `pnpm run build` before pushing. CI must pass.
```

- [ ] **Step 3: Create rule 03**

```markdown
---
name: Avoid GitHub MCP — use gh CLI instead
description: GitHub MCP tools are massively token-intensive. Use gh CLI with targeted GraphQL queries for all GitHub operations.
scope: all
enforced_by: hook-reminder
---

## The rule

Never use `mcp__plugin_github_*` tools or any GitHub MCP server tools. They are overbaked and token-expensive.

Use `gh` CLI with scoped GraphQL for every non-trivial GitHub operation:

```bash
# List PRs
gh pr list

# View a PR with rich detail
gh api graphql -f query='
  query($owner:String!, $repo:String!, $number:Int!) {
    repository(owner:$owner, name:$repo) {
      pullRequest(number:$number) {
        title body state
        reviews(last:5) { nodes { state body author { login } } }
      }
    }
  }
' -f owner=arcade-cabinet -f repo=overheat-titan-extract -F number=123

# Search issues
gh search issues "repo:arcade-cabinet/overheat-titan-extract label:bug" --json number,title,state
```

## Why

GitHub MCP tools fetch entire resource graphs — PRs with all comments, issues with full history. A scoped `gh api graphql` call returns exactly the fields you ask for, using a fraction of the tokens.
```

- [ ] **Step 4: Commit all three rules**

```bash
git add .claude/rules/
git commit -m "chore(claude): add three standing operating rules"
```

---

## Task 6: Create placeholder `agents/` directory

**Files:**
- Create: `.claude/agents/.gitkeep`

- [ ] **Step 1: Create placeholder**

```bash
mkdir -p .claude/agents
touch .claude/agents/.gitkeep
git add .claude/agents/.gitkeep
git commit -m "chore(claude): add agents directory for future specialist agent definitions"
```

---

## Task 7: Update `.gitignore` to exclude `.claude/state/` and `.claude/worktrees/`

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add .claude state paths to .gitignore**

Check if `.gitignore` already has `.claude/` exclusions. If not, add:

```
# Claude Code agent state (machine-local, not versioned)
.claude/state/
.claude/worktrees/
.claude/plans/*.prq.md
```

Do NOT ignore `.claude/hooks/`, `.claude/rules/`, `.claude/settings.json`, or `.claude/agents/` — these are versioned and shared.

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore .claude state/worktrees dirs"
```
