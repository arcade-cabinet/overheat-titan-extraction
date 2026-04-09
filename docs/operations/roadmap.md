---
title: Delivery Roadmap
doc_type: operations
status: active
owner: engineering
last_updated: 2026-04-09
---

# Delivery Roadmap

This document turns the large prompt set into implementation streams. `HANDOFF.md` remains the live status file; this file groups the work into stable domains and recommended sequencing.

## Workstreams

| Stream | Goal | Primary docs |
|---|---|---|
| Foundations | keep build healthy, preserve architecture constraints | `../HANDOFF.md`, `../STANDARDS.md` |
| Core mechanics | make grinding, cubes, and silo loop fully physical | `../gameplay/loop-and-progression.md` |
| Runtime systems | tractor beam, pause FX, spatial audio | `../architecture/runtime-systems.md` |
| Experience polish | headlamp, sparks, glitch, transitions, CRT | `../design/visual-audio-direction.md` |
| Fiction alignment | keep naming and UI voice coherent | `../lore/world-primer.md` |

## Recommended order

1. Tractor beam
2. Ore health / destruction / debris
3. Cube cleanup on sell
4. Settings back-navigation correctness
5. Headlamp and grind sparks
6. Pause / meltdown visual passes
7. Spatial audio
8. Transition polish and diegetic menu interaction

## Documentation maintenance checklist

- When a workstream lands, update `HANDOFF.md` first.
- If the change introduces a new permanent convention, update `STANDARDS.md`.
- If the change alters intent or structure, update the relevant domain doc and `docs/README.md`.
- Keep domain docs stable; keep `HANDOFF.md` volatile.
