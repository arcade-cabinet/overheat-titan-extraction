---
title: Gameplay Loop and Progression
doc_type: gameplay
status: active
owner: design
last_updated: 2026-04-09
---

# Gameplay Loop and Progression

## Pillars

1. **Industrial weight** — the mech should feel heavy, dangerous, and mechanical.
2. **Risk for reward** — harvesting faster increases heat stress and failure pressure.
3. **Physical economy** — the player does not instantly bank ore; they convert and throw it.
4. **Cockpit immersion** — status awareness comes through the mech’s own instruments.

## Core loop

```text
Survey → Approach ore → Grind → Build heat → Fill hopper → Eject cube
      → Transport cube to silo → Sell for credits → Upgrade mech → Repeat
```

## Resource model

| Resource | Meaning | Source | Sink |
|---|---|---|---|
| Raw Ore | unbanked run resource | grinding ore veins | ejected into cubes |
| Credits | persistent metagame currency | selling cubes | upgrades |
| Heat | risk meter | grinding, hazards | cooling system |

## Heat model

| Threshold | Effect |
|---|---|
| 0–99 | saw operates normally |
| 100 | overheat lockout, forced cooling, alarm state |
| <20 after overheat | saw becomes available again |
| 120 | critical meltdown and run failure |

## Upgrade tracks

| Upgrade | Store key | Effect |
|---|---|---|
| Hopper Capacity | `cap` | increases `getMaxOre()` |
| Grind Power | `pow` | increases `getGrindDps()` |
| Cooling System | `cool` | increases `getCoolingRate()` |

## Current shipped flow

- Ore is harvested by proximity.
- Hopper auto-ejects a cube when full.
- Silo sensor awards credits when a cube intersects it.
- Credits persist between sessions.
- Meltdown transitions to a report screen showing recovered credits.

## Planned flow upgrades

- Tractor beam drag / throw interaction
- Ore health, destruction, and debris
- Sparks and hit-stop when the saw first bites into rock
- Rare isotope hazards pushing heat toward meltdown
- More explicit report / reboot loop after titan loss

## Design note

The economy should always feel like it passes through physical space. Whenever a feature risks turning credits or ore into abstract UI-only numbers, prefer a world-space solution first.
