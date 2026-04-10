---
title: Documentation Index
doc_type: index
status: active
owner: engineering
last_updated: 2026-04-09
---

# Documentation Index

This directory is the long-lived source of project context. Organized by domain so future agents can load only the documents relevant to the task at hand.

## Reading order

1. [`../AGENTS.md`](../AGENTS.md) — repository-wide source of truth
2. [`./AGENTS.md`](./AGENTS.md) — how to read, update, and expand this docs tree
3. [`./HANDOFF.md`](./HANDOFF.md) — current implementation status and next priorities
4. [`./STANDARDS.md`](./STANDARDS.md) — hard constraints for code, visuals, shaders, and audio

## Domain map

| Domain | File | Purpose |
|---|---|---|
| Architecture | [`architecture/overview.md`](./architecture/overview.md) | High-level structure, phase flow, Koota ECS + Zod architecture |
| Architecture | [`architecture/runtime-systems.md`](./architecture/runtime-systems.md) | Runtime contracts for rendering, physics, state, animation, audio, and UI |
| Architecture | [`architecture/decisions.md`](./architecture/decisions.md) | ADRs — why we chose Rapier, Koota, diegetic cockpit, Capacitor |
| Gameplay | [`gameplay/loop-and-progression.md`](./gameplay/loop-and-progression.md) | Core loop, heat model, rare isotopes, onboarding missions 0–3, contracts |
| Gameplay | [`gameplay/playtesting-notes.md`](./gameplay/playtesting-notes.md) | Paper playtest analysis, friction points, economy targets, session length |
| Design | [`design/visual-audio-direction.md`](./design/visual-audio-direction.md) | Design bible — palette, typography, cockpit layout, motion, audio identity |
| Design | [`design/mobile-controls.md`](./design/mobile-controls.md) | Mobile control spec — virtual joysticks, input abstraction, haptics |
| Lore | [`lore/world-primer.md`](./lore/world-primer.md) | Fictional framing, extraction fantasy, setting rules |
| Operations | [`operations/roadmap.md`](./operations/roadmap.md) | M1–M6 milestone roadmap and documentation maintenance rules |
| Live state | [`HANDOFF.md`](./HANDOFF.md) | What is built now, known issues, immediate next steps |
| Standards | [`STANDARDS.md`](./STANDARDS.md) | Non-negotiable implementation conventions |
| References | [`references/strategy_sessions.md`](./references/strategy_sessions.md) | Full design history — Gemini prototype chat → production audit |

## Source-of-truth hierarchy

1. `AGENTS.md` — global contract. Never contradicted by domain docs.
2. `docs/STANDARDS.md` — immutable standards. Domain docs align to this.
3. `docs/HANDOFF.md` — live status. Always current.
4. Domain docs — explain intent. Should not contradict the above.

## Suggested reading by task

### Implementing gameplay
- `HANDOFF.md`
- `gameplay/loop-and-progression.md`
- `architecture/runtime-systems.md`
- `STANDARDS.md`

### Implementing visuals / shaders
- `design/visual-audio-direction.md`
- `STANDARDS.md`
- `architecture/runtime-systems.md`

### Implementing new systems (M1+ Koota)
- `architecture/overview.md`
- `architecture/runtime-systems.md`
- `architecture/decisions.md`
- `operations/roadmap.md`
- `HANDOFF.md`

### Writing or reorganizing docs
- `docs/AGENTS.md`
- `docs/README.md`
- Affected domain docs

### Mobile / Capacitor work (M3)
- `design/mobile-controls.md`
- `architecture/decisions.md §ADR-004`
- `operations/roadmap.md §M3`
