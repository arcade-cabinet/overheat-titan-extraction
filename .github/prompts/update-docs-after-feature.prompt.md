---
mode: agent
description: Update all relevant docs after implementing a feature in OVERHEAT: Titan Extraction.
---

A feature has just been implemented. Your job is to update the documentation to reflect it.

## Read before touching docs

1. `docs/AGENTS.md` — documentation-specific guidance and source-of-truth hierarchy.
2. `docs/README.md` — the domain map; add any new doc here.
3. `docs/HANDOFF.md` — mark completed items `[x]`, add session log entry.

## Required updates (check each)

| Trigger | Update |
|---------|--------|
| Feature implemented | `docs/HANDOFF.md` — mark `[x]`, add to session log |
| New pattern established | `docs/STANDARDS.md` — add to relevant section |
| Pivotal technical decision | `docs/architecture/decisions.md` — new ADR |
| New mechanic added | `docs/gameplay/loop-and-progression.md` |
| Visual/audio direction changed | `docs/design/visual-audio-direction.md` |
| New doc file created | `docs/README.md` — add to domain map |

## Documentation rules

- **DRY:** Never duplicate information. Cross-reference instead.
  - ✅ "See `docs/STANDARDS.md §4` for post-processing settings"
  - ❌ Copy-pasting the same code block into multiple docs
- **Frontmatter required** on all docs:
  ```yaml
  ---
  title: Human-readable title
  doc_type: architecture|gameplay|design|lore|operations|handoff|standards|index
  status: active|draft|deprecated
  owner: engineering|design|narrative
  last_updated: YYYY-MM-DD
  ---
  ```
- **Source-of-truth hierarchy:** `AGENTS.md` > `docs/STANDARDS.md` > `docs/HANDOFF.md` > domain docs.
  Never contradict higher-priority sources in domain docs.

## After updating docs

Commit with: `docs: update [area] after [feature name]`
