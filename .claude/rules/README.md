# Standing Operating Rules for Claude Code

Each file in this directory is a **standing operating rule** for Claude
Code sessions on the OVERHEAT: Titan Extraction repo. These rules are:

- **Checked into the repo** — they survive across sessions, machines,
  and context compactions.
- **Enforced** where possible via hooks (`.claude/hooks/`) and
  agents (`.claude/agents/`).

## Rules

| #   | File                                                       | One-line summary                                                                                                                                                                             |
| --- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | [`01-nothing-out-of-scope.md`](01-nothing-out-of-scope.md) | Nothing is ever out of scope. Work additively. If too large for one pass → task-batch skill. Never ping for "next step".                                                                     |
| 02  | [`02-operating-discipline.md`](02-operating-discipline.md) | Clean up as you go. Improve self/codebase/instructions continuously. Store standing rules in the repo. Work WITH the Claude environment's skills, agents, and MCPs.                          |
| 03  | [`03-avoid-github-mcp.md`](03-avoid-github-mcp.md)         | GitHub MCPs are massively token-intensive. Use `gh api graphql -f query='...'` with scoped field selection instead.                                                                          |

## How to add a new rule

1. Write a new file `NN-<short-slug>.md` in this directory.
2. Use the frontmatter format below.
3. Add a row to the table above.
4. If the rule can be mechanically enforced, add a hook under
   `.claude/hooks/` or an agent under `.claude/agents/` that enforces it.

```yaml
---
name: Short imperative rule
description: One sentence you could paste into any system prompt
scope: all | overheat | <specific area>
enforced_by: hook | reviewer | discipline
---
```

## Why these live in the repo (not `~/.claude`)

Per-session memory at `~/.claude/projects/.../memory/` is machine-local.
Standing rules belong IN the repository so every session automatically
picks them up via `CLAUDE.md` → `AGENTS.md`.
