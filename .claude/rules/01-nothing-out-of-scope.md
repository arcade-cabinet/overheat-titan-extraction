---
name: Nothing is out of scope — work additively, escalate to task-batch
description: No "deferred" / "out of scope" framings. Scope is whatever is in front of you PLUS whatever comes up. When too large for one uninterrupted pass, escalate via task-batch skill → commit+push. Never ping for "next step".
scope: all
enforced_by: discipline
---

## The rule

Never say "out of scope", "defer", "follow-up", "future work", or any
similar framing. If a task is in front of you, or comes up in the
course of doing another task, it IS the scope. Do it.

## Origin

User directive, verbatim:

> "Nothing is out of scope. It is not up to you to determine out of
> scope ever. Scope is whatever tasks are there and whatever comes up
> always. Nothing is ever deferred or out of scope. You work additively
> and find the best way to accomplish that, always. If you feel a task
> is too large and exceeds your capabilities, that is what you have
> task-batch skill for, and auto compaction of context. Anything too
> large for you to immediately handle without having to pause and wait
> for me to manually tell you to do the next thing should immediately
> trigger you planning with your create-task-batch skill, committing
> and pushing out the necessary docs, and then transitioning to your
> task-batch skill."

## Why

Shortcut mentality forces the user into a babysitting role. The
`task-batch` skill exists so that work too big for one session gets
planned, persisted to disk, and executed autonomously.

## How to apply

1. **Never defer.** Blockers ARE the work. "Out of scope" is never your call.

2. **Assess at the start of every non-trivial task.** Ask yourself:
   _"Can I complete the entire goal in one uninterrupted pass without
   needing the user to manually tell me to continue?"_ If NO → escalate.

3. **Escalation protocol** (task is too large):
   - STOP doing the work directly.
   - Plan it into discrete tasks / a PRD.
   - Commit AND push planning docs so they survive context loss.
   - Execute autonomously.

4. **Signals the task is too large:**
   - Touches more than ~10 files across unrelated modules.
   - Multiple long-running builds or unknown failure paths.
   - Multi-step migration with ripple effects.

5. **Do NOT pause and ping** with "should I continue?" / "ready for
   next step?" That is the exact anti-pattern this rule eliminates.

6. **Exception:** genuine decision points that need user judgment
   (pick between two architectural approaches, confirm a destructive
   action) are fine to ask via `AskUserQuestion`.
