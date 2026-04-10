---
title: Playtesting Notes
doc_type: gameplay
status: active
owner: design
last_updated: 2026-04-09
---

# Playtesting Notes

This document records paper and live playtesting analysis for OVERHEAT: Titan Extraction. It informs heat curve tuning, economy balance, and UX refinements.

## Paper playtest — April 2026

Conducted against the strategy sessions design spec (see `docs/references/strategy_sessions.md §7`).

### Core loop walk-through

1. **Spawn** in cockpit, dashboard visible, saw idling.
2. **Move** toward glowing cyan ore vein.
3. **Grind**: camera shakes, sparks fly, heat rises, hopper fills.
4. **Overheat tension**: if you push too long, tools lock, alarms blare — forced cool-down.
5. **Cube ejection**: hopper full → compressed cube pops out as a dynamic physics body.
6. **Throw**: player flicks cube into the silo beam with tractor.
7. **Credits**: +50 standard / +2,500 rare.
8. **Upgrade**: return to OS terminal, buy upgrades — repeat at higher stakes.

### Friction points identified

| Issue | Severity | Notes |
|-------|----------|-------|
| Heat pacing | Medium | If heat rises too fast, new players feel punished without learning. Need staged introduction. |
| Throw precision on mobile | High | Flick-based throwing is hard with thumbs. Need aim-assist / silo magnetism. |
| Visual overload | Medium | Sparks + spores + bloom + cockpit on small devices may clutter. Need aggressive LOD on mobile. |
| Economy opacity | Medium | Players won't feel rewarded for rare cubes if they don't understand why they're worth more. Need clear visual/audio differentiation (magenta + $2,500 cue). |
| No tutorial | High | Heat, tractor beam, and upgrades are non-trivial. Onboarding missions are load-bearing. |
| Session structure | Low | Loop feels endless without macro goals. Contracts/missions add urgency. |

### Recommended fixes

- **Heat pacing**: first two onboarding missions should be forgiving (lower rate, or no overheat possible in Mission 1).
- **Silo magnetism**: 15° aim assist zone, applied only during throw momentum.
- **Rare isotope clarity**: larger magenta emissive, distinct audio cue (dissonant interval at spawn), and "+$2,500 VOLATILE CUBE" text on sell.
- **Onboarding missions**: see `docs/gameplay/loop-and-progression.md §Onboarding missions`.
- **Contracts**: timed objectives that give the session urgency — see `docs/gameplay/loop-and-progression.md §Contracts`.

## Opportunities for deeper engagement

### Contracts / missions (M5)
Short-duration objectives that give each run a macro goal:
- "Deliver 5 rare cubes in 5 minutes."
- "Maintain heat below 60% for an entire run."
- "Earn 10,000 credits in a single session."

These prevent the loop from feeling endless and reward skilled play (heat management = more credits per minute).

### Meta progression (M5)
- Permanent mech chassis upgrades (carry over across sessions).
- Cosmetic cockpit skins (visible to the player while playing).

### Environmental variation (M5)
- Different crater layouts per run.
- Weather effects: dust storms reduce visibility, ice patches change movement.
- Lighting conditions: eclipse = lower ambient, alien sun flare = bloom spike.

## Economy balancing targets

| Item | Current value | Notes |
|------|---------------|-------|
| Standard cube | 50 credits | Baseline — feels routine |
| Rare cube | 2,500 credits | 50× multiplier — rare moment |
| Hopper upgrade | TBD | Should require ~3 runs to save up for |
| Grind upgrade | TBD | Should feel like a meaningful DPS increase |
| Cool upgrade | TBD | Should meaningfully extend safe grinding windows |

**Tuning principle:** the player should feel like each upgrade meaningfully extends their capability, not just adds a small percentage. Upgrade cost should require ~3–5 good runs per tier.

## Session length target

**Core loop target:** 5–10 minute sessions feel complete. The risk of meltdown should feel real within that window.

For M6 telemetry, track:
- Average time to first overheat.
- Average time to first cube sold.
- Average session credits at meltdown.
- Upgrade purchase rate per session.
