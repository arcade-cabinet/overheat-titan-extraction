---
name: Operating discipline — clean up, learn, improve, use the environment
description: Clean up as you go. Continuously improve self/codebase/instructions. Store standing rules in the repo. Work WITH the Claude environment's skills, agents, and MCPs, never alone.
scope: all
enforced_by: discipline
---

## The rule

Five standing behaviors that apply to every session:

### 1. Clean up as you go

Remove temp files, scratch artifacts, unused imports, stale state files,
dead comments as you finish each slice of work. `git status` should be
clean of your leftovers when you stop.

**Checklist at the end of every session or major milestone:**
- Any `.claude/state/<diagnostic>` files you created → delete or promote.
- Any `tmp/` or `/tmp/foo.*` you wrote → delete.
- Any uncommitted TODO comments you introduced → resolve them.
- Any orphan branches or worktrees → clean up.
- Any skill/agent/hook that needs updating based on what you learned → update it.

### 2. Continuous improvement

Every session leaves things slightly better than it found them:

- **Your own operating rules:** learn from mistakes, write them down
  in `.claude/rules/`, and enforce them via hooks or agents.
- **The codebase:** when you touch a file and notice something that
  would benefit from simplification or consistency, fix it in the same
  pass. Don't add "TODO" comments — do the TODO.
- **The agentic surface:** every session, check whether `.claude/agents/`,
  `.claude/hooks/`, and `.claude/rules/` are still correct.

### 3. Add value proactively

Not just "finish the user's request" but "what else in this area is
broken or fragile that I could fix while I'm here?" Scoped to the same
domain — don't range across the whole codebase unprompted.

### 4. Store standing rules in the repository

Standing operating rules that apply to all future sessions must live in:

- **`CLAUDE.md`** at the repo root — primary entry point.
- **`AGENTS.md`** at the repo root — fuller operating protocols.
- **`.claude/rules/*.md`** — one file per standing rule.
- **`.claude/agents/*.md`** — rules belonging to a specific specialist.
- **`.claude/hooks/*.sh`** — rules that can be mechanically enforced.

Per-session memory is fine as a redundant index but never the only home
for a standing rule.

### 5. Work WITH the Claude operating environment

Use available skills, subagents, and MCPs proactively:

- **Skills:** `brainstorming`, `writing-plans`, `executing-plans`, etc.
- **Subagents:** specialist agents for code review, performance, security.
- **MCPs:** `context7`, `assets-library`, and others as configured.
- **Hooks:** `biome-check.sh`, `block-env-edit.sh`.

**Before writing a bespoke script, check whether a skill or agent
already does it.**

## Origin

User directive, verbatim:

> "As you work, clean up after yourself. Ensure you are always learning
> and improving yourself and your operating instructions and the
> codebase, its health, its playability, its polish, that you are
> thinking of ways to add value, and always store operating instructions
> permanently in agentic instructions in the repository and enforce them.
> You have a wide library of available user skills as well as user MCPs
> and should always be working WITH your Claude operating environment,
> not against it or operating on your own."
