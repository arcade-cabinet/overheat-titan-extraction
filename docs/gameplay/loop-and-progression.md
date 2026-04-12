---
title: Gameplay Loop and Progression
doc_type: gameplay
status: active
owner: design
last_updated: 2026-04-12
---

# Gameplay Loop and Progression

This document defines the core mechanical loop, progression systems, and meta-game flow for **OVERHEAT: Titan Extraction**.

## 1. Core Loop: Extraction

The economy always passes through physical space. Credits are never just UI numbers — the player converts ore into a physics object and physically throws it into the silo.

```text
Survey → Approach ore → Grind → Build heat → Fill hopper → Eject cube
      → Transport cube to silo → Sell for credits → Upgrade mech → Repeat
```

1. **Harvest:** Drive your mech directly into procedurally spawned Ore veins. The massive industrial saw protruding from your dashboard automatically spins up, grinding the ore and generating **Heat**.
2. **Compress:** When your hopper hits 100%, the mech ejects a **Compressed Physics Cube** from the hopper.
3. **Transport:** You use a pointer-based Tractor Beam to drag these cubes, reel them in, and physically *throw* them by flicking the cursor. 
4. **Economy:** Throw the cubes into the central glowing Silo beam to earn Credits. 
5. **Progression:** Spend credits at the OS Terminal to upgrade Hopper Capacity, Grind Power, and Cooling Systems.

## 2. Resource Model

| Resource | Meaning | Source | Sink |
|---|---|---|---|
| Raw Ore | unbanked run resource | grinding ore veins | ejected into cubes |
| Credits | persistent metagame currency | selling cubes at silo | upgrades |
| Heat | risk meter | grinding, rare isotope collision | cooling system |

## 3. The Heat System (Risk/Reward)

You can no longer hold the grinder down forever. A **Heat Gauge** dominates the right holographic HUD. As you grind, heat builds up and the saw blade visibly glows red-hot.

| Threshold | Effect |
|---|---|
| 0–99% | Saw operates normally. |
| 100% | **Overheat:** The system overheats, disables the tool, vents steam, and triggers a warning siren until it cools down below the safe threshold. |
| 120% | **Critical Meltdown:** Triggered by grinding while overheated or volatile damage. Results in immediate run failure. |

## 4. Rare Isotopes

15% of all ore deposits spawn as highly volatile **Magenta Isotopes**. 

| Property | Standard ore | Rare isotope |
|----------|-------------|--------------|
| Visual | Cyan emissive | Magenta emissive — distinct at a glance |
| Cube value | 50 credits | **2,500 credits** (Volatile Isotope Cube) |
| Heat multiplier | 1× | **3× heat per second** |
| Grind time | 1× | **3× longer** |

*Risk:* They take 3x longer to mine and generate massive heat, pushing you much closer to meltdown for the payout.

## 5. Metagame State Flow

The complete user journey wraps the core loop in an immersive meta-game structure with a functional main menu, pause state, and a high-stakes "Game Over" condition.

### The Diegetic Main Menu (Boot Sequence)

The Main Menu is an integrated part of the 3D scene to maintain unbroken immersion.
When the app loads, the 3D canvas renders pitch black. The headlamp is off, ambient light is 0.01, and the vignette is at maximum darkness. A blinking retro terminal cursor displays: `AWAITING PILOT INPUT...`

When the user clicks:
1. Audio plays a low, rising sine wave (powering up).
2. The headlamp flickers on (rapid intensity multiplier) before stabilizing.
3. The Diegetic Dashboard boots up, displaying options: `[ NEW EXCAVATION ]` and `[ OS CONFIG ]`.

### System Diagnostics (Pause Menu)

Pressing `ESC` or the pause button triggers **Diagnostics Mode**. The game does not simply stop:
- **Time Freeze:** Physics step and player movement logic halt.
- **Audio Filter:** A BiquadFilterNode smoothly muffles all game sounds down to 300Hz.
- **Shader Shift:** The scene desaturates entirely (Grayscale) and a glowing cyan wireframe renders over all meshes to simulate a tactical freeze-frame.
- **UI Overlay:** An HTML CRT-styled menu appears: `[ RESUME ]`, `[ SETTINGS ]`, `[ ABORT MISSION ]`.

### Critical Meltdown (Game Over State)

If the player hits 120% heat:
1. **Physics Explosion:** A massive radial impulse is applied to all rigid bodies near the player, scattering ore and cubes.
2. **Visual Corruption:** ChromaticAberration offset shoots to extreme levels. The screen tears using a Glitch shader pass.
3. **Audio Death:** The synth generates a harsh, clipping square wave that violently pitches down to 0Hz.
4. **Ejection:** The camera rapidly lerps straight up into the sky (simulating the pilot ejecting).
5. **Report Screen:** An HTML screen fades in: `TITAN LOST. ORE RECOVERED: $X. REBOOTING...`

## 6. Progression & Upgrades

Tap the "SYS UPGRD" button to open the OS terminal. If you've sold enough cubes, you can permanently upgrade your mech chassis:

| Upgrade | Store key | Effect |
|---|---|---|
| Hopper Capacity | `cap` | Increases `getMaxOre()` = `100 * upgrades.cap` |
| Grind Power | `pow` | Increases `getGrindDps()` = `50 * (1 + (upgrades.pow - 1) * 0.5)` |
| Cooling System | `cool` | Increases `getCoolingRate()` = `20 * (1 + (upgrades.cool - 1) * 0.5)` |

**Contracts (M5):** Timed objectives that give each session a macro goal, accepted via the Bounty Board.
- **Quota Run:** Earn $X within a time limit.
- **Thermal Cap:** Keep heat below X°C for a duration.
- **Endurance:** Survive for X minutes without melting down.
