---
title: Visual and Audio Direction
doc_type: design
status: active
owner: design
last_updated: 2026-04-09
---

# Visual and Audio Direction

## Visual promise

OVERHEAT should feel like an industrial exosuit peering through damaged optics on a hostile moon. The game should be dark, harsh, neon-accented, and mechanically overstressed.

## Visual language

| Motif | Direction |
|---|---|
| Cockpit | dense matte chassis, practical dashboard, no clean sci-fi glass UI |
| Ore | cyan emissive targets that read instantly in darkness |
| Danger | red/orange thermal escalation, aberration, vignette pressure |
| Reward | amber / gold credit cues and cube glow |
| World | black-violet void, dust motes, long orange shadows |

## Color anchors

Use [`../STANDARDS.md`](../STANDARDS.md) as the hard source, but the intended read is:
- **void black** for space and fog
- **neon cyan** for ore, primary UI, and extraction beam
- **amber** for credits and transactional feedback
- **orange/red** for heat and failure
- **dark matte metal** for the mech and world props

## Camera feel

- Slight shake while grinding
- FOV pressure when dashing
- Tight cockpit framing
- Meltdown should feel like the mech is coming apart faster than the pilot can process

## Shader direction

### Molten saw
- cool center mass
- hotter outer edge
- white-hot pulsing near thermal extremes
- should read like stressed industrial metal, not a fantasy energy weapon

### Post-processing
- Bloom should reward bright emissive materials, not wash out the whole frame.
- Chromatic aberration should be coupled to heat, not always on.
- Vignette should support cockpit claustrophobia.

## Audio direction

The audio is not orchestral. It is procedural, dissonant, industrial, and pressure-driven.

| Event | Mood |
|---|---|
| Boot | rising power-on tone, machine waking up |
| Grinding | abrasive sawtooth bite, pitch rising with heat |
| Steps | massive weight, low-frequency thud |
| Sell | brief clean reward tone |
| Alarm | square-wave machine panic |
| Meltdown | harsh collapse / pitch-down failure scream |

## Menu tone

Menus should feel like a rugged industrial operating system:
- terse wording
- monospace typography
- strong brackets / terminal conventions
- no playful UI copy
