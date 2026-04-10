---
title: Documentation Agent Guide
doc_type: instructions
status: active
owner: engineering
last_updated: 2026-04-09
---

# Documentation Agent Guide

Use this file when your task touches any markdown under `docs/`.

## Objectives

1. Preserve context from large prompt history in durable markdown.
2. Keep information organized by logical domain.
3. Minimize duplication while still making the repo navigable for future agents.
4. Make status, standards, and intent discoverable in under five file opens.

## Required reading before editing docs

1. [`../AGENTS.md`](../AGENTS.md)
2. [`README.md`](./README.md)
3. [`HANDOFF.md`](./HANDOFF.md)
4. [`STANDARDS.md`](./STANDARDS.md)

## Documentation structure rules

- `docs/README.md` is the index for all domain docs.
- `docs/HANDOFF.md` is the live status ledger.
- `docs/STANDARDS.md` contains hard constraints and conventions.
- Domain docs belong in one of the following folders unless there is a strong reason otherwise:
  - `docs/architecture/`
  - `docs/gameplay/`
  - `docs/design/`
  - `docs/lore/`
  - `docs/operations/`

## Frontmatter rules

Every markdown file in `docs/` should begin with YAML frontmatter:

```yaml
---
title: Short descriptive title
doc_type: index | instructions | architecture | gameplay | design | lore | operations | handoff | standards
status: active | draft | archived
owner: engineering | design | narrative
last_updated: YYYY-MM-DD
---
```

## Writing rules

- Prefer concise sections with stable headings.
- Use tables for inventories, mappings, and status snapshots.
- Use mermaid diagrams only where they materially improve understanding.
- Use relative links only.
- Keep speculative content clearly labeled as `planned`, `deferred`, or `not implemented`.
- Do not duplicate live status across multiple docs unless one document links back to `HANDOFF.md` as the single source.

## Update rules

When you add or materially change a domain doc:

1. Update `docs/README.md`.
2. Update `docs/HANDOFF.md` if implementation state or priorities changed.
3. Update `docs/STANDARDS.md` if you introduced a new durable convention.
4. Update `../AGENTS.md` only if the repository-wide reading order or contract changed.

## Recommended doc split

- **Architecture** = how the game is structured and why
- **Gameplay** = what the player does, wins, loses, upgrades, and feels
- **Design** = visual language, audio direction, UI tone, cinematic intent
- **Lore** = fiction and narrative framing that shapes assets and wording
- **Operations** = roadmap, implementation sequencing, maintenance guidance

## Anti-patterns

- Dumping all new context into `HANDOFF.md`
- Repeating the exact same checklist in multiple files
- Mixing fiction and engineering constraints into a single unstructured document
- Adding a new markdown file without linking it from `docs/README.md`
