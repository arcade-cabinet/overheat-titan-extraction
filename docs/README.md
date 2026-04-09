---
title: Documentation Index
doc_type: index
status: active
owner: engineering
last_updated: 2026-04-09
---

# Documentation Index

This directory is the long-lived source of project context. It is intentionally organized by domain so future agents can load only the documents relevant to the task at hand without losing the broader architecture, brand, or gameplay intent.

## Reading order

1. [`../AGENTS.md`](../AGENTS.md) — repository-wide source of truth
2. [`./AGENTS.md`](./AGENTS.md) — how to read, update, and expand this docs tree
3. [`./HANDOFF.md`](./HANDOFF.md) — current implementation status and next priorities
4. [`./STANDARDS.md`](./STANDARDS.md) — hard constraints for code, visuals, shaders, and audio

## Domain map

| Domain | File | Purpose |
|---|---|---|
| Architecture | [`architecture/overview.md`](./architecture/overview.md) | High-level structure, phase flow, component topology |
| Architecture | [`architecture/runtime-systems.md`](./architecture/runtime-systems.md) | Runtime contracts for rendering, physics, state, audio, and UI |
| Gameplay | [`gameplay/loop-and-progression.md`](./gameplay/loop-and-progression.md) | Core loop, risk/reward, economy, upgrades, and fail states |
| Design | [`design/visual-audio-direction.md`](./design/visual-audio-direction.md) | Brand palette, lighting, post-FX, cockpit feel, audio mood |
| Lore | [`lore/world-primer.md`](./lore/world-primer.md) | Fictional framing, extraction fantasy, factions, and setting rules |
| Operations | [`operations/roadmap.md`](./operations/roadmap.md) | Delivery roadmap, implementation order, and documentation maintenance |
| Live state | [`HANDOFF.md`](./HANDOFF.md) | What is built now, known issues, and immediate next steps |
| Standards | [`STANDARDS.md`](./STANDARDS.md) | Non-negotiable implementation conventions |

## Source-of-truth rules

- `AGENTS.md` defines the global contract.
- `docs/STANDARDS.md` defines immutable standards.
- `docs/HANDOFF.md` is the live status ledger and must reflect the latest state.
- Domain docs explain intent and structure; they should not contradict the above files.
- When adding a new domain document, update this index and `docs/AGENTS.md` guidance if the pattern changes.

## Suggested reading by task

### If you are implementing gameplay
- `HANDOFF.md`
- `gameplay/loop-and-progression.md`
- `architecture/runtime-systems.md`
- `STANDARDS.md`

### If you are implementing visuals / shaders
- `design/visual-audio-direction.md`
- `STANDARDS.md`
- `architecture/runtime-systems.md`

### If you are implementing new systems
- `architecture/overview.md`
- `architecture/runtime-systems.md`
- `operations/roadmap.md`
- `HANDOFF.md`

### If you are writing or reorganizing docs
- `docs/AGENTS.md`
- `docs/README.md`
- affected domain docs
