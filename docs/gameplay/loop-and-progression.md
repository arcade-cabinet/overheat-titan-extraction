---
title: Gameplay Loop and Progression
doc_type: gameplay
status: active
owner: design
last_updated: 2026-04-09
---

# Gameplay Loop and Progression

## Creative pillars

1. **Industrial Gravitas** — everything feels heavy, dangerous, and engineered.
2. **Diegetic Clarity** — all critical information is physically present in the cockpit.
3. **Risk Through Heat** — heat is the heartbeat of the game; overheating is the primary tension driver, not health bars.
4. **Tactile Physics** — the world is solid; cubes, debris, and ore behave believably.
5. **Alien Familiarity** — the world feels alien but readable; no visual noise that obscures gameplay.

## Core loop

> **Current implementation status:** See [`docs/HANDOFF.md`](../HANDOFF.md) for what is built and what remains.

```text
Survey → Approach ore → Grind → Build heat → Fill hopper → Eject cube
      → Transport cube to silo → Sell for credits → Upgrade mech → Repeat
```

The economy always passes through physical space. Credits are never just UI numbers — the player converts ore into a physics object and physically throws it into the silo.

## Resource model

| Resource | Meaning | Source | Sink |
|---|---|---|---|
| Raw Ore | unbanked run resource | grinding ore veins | ejected into cubes |
| Credits | persistent metagame currency | selling cubes at silo | upgrades |
| Heat | risk meter | grinding, rare isotope collision | cooling system |

## Heat model

| Threshold | Effect |
|---|---|
| 0–99 | saw operates normally |
| 100 | overheat lockout, forced cooling, alarm state |
| < 20 (after overheat) | saw becomes available again |
| 120 | critical meltdown — run failure |

**Heat escalation:** Heat rises at `gameConfig.mech.heat.perSecondGrinding` (default 15 units/s) while grinding. It cools at `getCoolingRate()` units/s. Grinding while overheated, or colliding with a rare isotope, can push heat past 100 toward 120.

## Rare isotopes

15% of all ore deposits spawn as **Rare Isotopes** (magenta — `#ff00ff`).

| Property | Standard ore | Rare isotope |
|----------|-------------|--------------|
| Visual | Cyan emissive | Magenta emissive — distinct at a glance |
| Cube value | 50 credits | **2,500 credits** |
| Heat multiplier | 1× | **3× heat per second** |
| Grind time | 1× | **3× longer** |
| Risk | Low | High — can push heat toward meltdown |

**Rare isotope rules:**
- Spawn chance: `gameConfig.ore.rareSpawnChance` (default 0.15 = 15%)
- Distinct audio cue at spawn (dissonant interval)
- Ejected rare cube shows "+$2,500 VOLATILE CUBE" text on sell event
- Rare cube has a distinct magenta emissive glow

## Upgrade tracks

| Upgrade | Store key | Effect |
|---|---|---|
| Hopper Capacity | `cap` | Increases `getMaxOre()` = `100 * upgrades.cap` |
| Grind Power | `pow` | Increases `getGrindDps()` = `50 * (1 + (upgrades.pow - 1) * 0.5)` |
| Cooling System | `cool` | Increases `getCoolingRate()` = `20 * (1 + (upgrades.cool - 1) * 0.5)` |

**Tuning target:** Each upgrade tier should require approximately 3–5 good runs to save up for. The player should feel a meaningful capability shift, not just a small percentage increase.

## Onboarding missions

The game's mechanics (heat, tractor beam, upgrades) are non-trivial. Staged missions introduce them safely:

### Mission 0 — Boot Sequence
- Static cockpit, no movement.
- Teach: look around, read the dashboard, understand the heat bar concept.
- Constraint: no heat buildup possible.

### Mission 1 — First Grind
- Limited area with one ore vein.
- **No rare isotopes** in this mission.
- Teach: move + grind. Overheat warning shows but is forgiving (heat rate reduced).
- Success condition: fill hopper to 100%, eject one cube.

### Mission 2 — Cube and Silo
- Introduce hopper capacity and cube ejection mechanics.
- Teach: tractor beam grab → throw into silo.
- First experience of credit reward ("CUBE SOLD: +50").

### Mission 3 — Upgrades
- Introduce the Titan OS Terminal.
- Player is given enough starting credits for exactly one upgrade.
- Teach: upgrade selection and how it immediately changes capability (read dashboard to see new max).
- First appearance of a rare isotope — optional, but rewards curious players.

After Mission 3, the full game loop is unlocked with no restrictions.

## Contracts (M5)

Timed objectives that give each session a macro goal and prevent the loop from feeling endless:

| Contract type | Example |
|---|---|
| Delivery quota | "Sell 5 rare cubes within 5 minutes" |
| Thermal discipline | "Complete a full run keeping heat below 60%" |
| Economy target | "Earn 10,000 credits in a single session" |
| Speed run | "Fill hopper and sell cube in under 2 minutes" |

Contracts provide bonus credits on completion and appear as an overlay in the cockpit (diegetic — printed on a mission screen in the OS terminal).

## Current shipped flow

- Ore is harvested by proximity (distance < 5 units triggers grinding).
- Hopper auto-ejects a cube when full.
- Silo sensor awards credits when a cube intersects it (`onIntersectionEnter`).
- Credits persist between sessions via Zustand `persist` middleware.
- Meltdown transitions to a report screen showing recovered credits.

## Planned flow upgrades

| Feature | Milestone |
|---|---|
| Tractor beam drag / throw interaction | M2 |
| Ore health, destruction, and debris chunks | M2 |
| Sparks and hit-stop when saw bites rock | M2 |
| Rare isotope hazard (3× heat) | M2 |
| Onboarding missions 0–3 | M2 |
| Contracts / timed objectives | M5 |
| Meta progression (permanent upgrades, cosmetics) | M5 |
| Environmental variation (crater layouts, weather) | M5 |

## Design note

The economy should always feel like it passes through physical space. Whenever a feature risks turning credits or ore into abstract UI-only numbers, prefer a world-space solution first.
