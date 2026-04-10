---
title: Visual and Audio Direction
doc_type: design
status: active
owner: design
last_updated: 2026-04-09
---

# Visual and Audio Direction

OVERHEAT should feel like an industrial exosuit peering through damaged optics on a hostile moon. Dark, harsh, neon-accented, and mechanically overstressed.

## Creative pillars

1. **Industrial Gravitas** — everything feels heavy, dangerous, and engineered. Never floaty or delicate.
2. **Diegetic Clarity** — all critical information is physically present in the cockpit. No floating overlays.
3. **Risk Through Heat** — heat is the heartbeat of the game. The visual language escalates with it.
4. **Tactile Physics** — the world is solid. Cubes, debris, and ore behave believably.
5. **Alien Familiarity** — the world feels alien but readable; no visual noise that obscures gameplay.

## Color palette

> Immutable brand colors. See `docs/STANDARDS.md §1` for the canonical hex table.

| Semantic | Hex | Usage |
|---|---|---|
| Background / Fog | `#020406` | Deep void — scene backdrop, fog |
| Primary UI / Ore Glow | `#00FFC8` | Standard ore, UI, silo beam, particles |
| Rare Isotope | `#FF00FF` | Magenta — rare ore, rare cubes, high-value signal |
| Heat / Warning | `#FF3B1F` | Heat bar escalation, alarms, overheat state |
| Mech Chassis | `#0F1418` | Matte dark metal — mech body, dashboard casing |
| Accent Lights | `#FFAA55` | Alien sun (directional), `#4A6FFF` cockpit LEDs |
| Credits | `#FFAA00` | Credit displays, upgrade costs, cube emissive on sell |

**Color semantics:**
- **Cyan** = interactable / safe
- **Magenta** = rare / high value / risky
- **Red/Orange** = danger / heat / failure
- **Amber** = economy / reward

**Rule:** No new inline hex colors in components. Consolidate reused colors into shared constants.

## Typography

All cockpit/dashboard text uses a **monospaced industrial** typeface. IBM Plex Mono is the reference vibe; the in-canvas implementation uses `bold monospace` (system font) for zero web font latency.

| Use | Size | Weight | Case |
|---|---|---|---|
| H1 — Credits, major warnings ("OVERHEAT") | 56–64px | Bold | ALL CAPS |
| H2 — Subsystem labels ("HOPPER", "HEAT", "COOLANT") | 32–36px | Bold | ALL CAPS |
| Body — Upgrade descriptions, tooltips | 14–18px | Regular | Title case |
| HUD readout digits | 56px | Bold | — |

**Typography rules:**
- All labels: ALL CAPS
- Monospaced digits for all readouts (heat %, credits, capacity)
- No italics — use color and size for emphasis
- No serif or sans-serif fonts anywhere in the game

## Cockpit layout

```
┌─────────────────────────────────────────┐
│          CANOPY FRAME + TINTED GLASS    │
│  - subtle reflections                   │
│  - structural pillars left and right    │
├─────────────────────────────────────────┤
│                                         │
│         VIEW OF TERRAIN AND SILO        │
│         (the 3D game world)             │
│                                         │
├──────────┬──────────────┬───────────────┤
│ HOPPER   │     HEAT     │   CREDITS     │
│ fill bar │ (danger zone)│ + mission obj │
└──────────┴──────────────┴───────────────┘
```

- **Left**: Hopper fill bar + label
- **Center**: Heat bar + overheat indicator (most critical readout)
- **Right**: Credits earned + mission objective text

**Dashboard rules:**
- No floating HUD — all instrument data lives on the physical dashboard mesh
- Color + motion for alerts: heat bar pulses and shifts red; cockpit lights flicker during overheat
- Minimal text during action — icons and bars during play; text for terminal screens and upgrade menus

## Visual language

| Motif | Direction |
|---|---|
| Cockpit | Dense matte chassis, practical dashboard, no clean sci-fi glass UI |
| Ore | Cyan emissive targets that read instantly in darkness |
| Rare isotope | Magenta emissive — unmistakable, slightly larger glow |
| Danger | Red/orange thermal escalation, aberration, vignette pressure |
| Reward | Amber/gold credit cues and cube glow on sell |
| World | Black-violet void, dust motes, long orange shadows |

## Camera feel

- **Idle**: minimal movement — the mech is heavy and stable
- **Grinding**: camera shakes; intensity scales with heat percentage
- **Dash**: FOV expands 75° → 100° via react-spring (never immediate snap)
- **Overheat**: vignette darkens, chromatic aberration pulses at 10Hz
- **Meltdown**: rapid camera lerp upward (pilot ejection); chromatic aberration at maximum; glitch pass activates

## Shader direction

### Molten saw

```glsl
// uHeat: 0.0 → 1.0 (heat / 100)
// Cool center mass, hotter outer edge
float edgeGlow = smoothstep(0.3, 1.0, vUv.y) * uHeat;
vec3 finalColor = mix(uColorCold, uColorHot, edgeGlow);
// White-hot pulse near extremes
float pulse = sin(uTime * 20.0) * 0.5 * smoothstep(0.8, 1.0, uHeat);
finalColor += vec3(pulse);
```
Reads like stressed industrial metal, not a fantasy energy weapon.

### Post-processing

```jsx
<EffectComposer disableNormalPass>
  <Bloom luminanceThreshold={0.6} mipmapBlur intensity={1.5} blendFunction={BlendFunction.ADD} />
  <ChromaticAberration ref={chromRef} blendFunction={BlendFunction.NORMAL} />
  <Vignette eskil={false} offset={0.1} darkness={isOverheated ? 1.3 : 1.1} />
</EffectComposer>
```

- **Bloom**: rewards bright emissives, does NOT wash out the frame
- **Chromatic aberration**: coupled to heat, not always on; pulses at overheat
- **Vignette**: supports cockpit claustrophobia

**Planned extensions (M4):**
- Grayscale pass during Pause/Diagnostics mode
- Glitch shader pass during Meltdown
- CRT scanlines + barrel distortion (toggleable via `settings.crtOverlays`)

## Motion and game feel (react-spring)

Use `react-spring` / `@react-spring/three` for all 3D transitions:

| Transition | Trigger | Feel |
|---|---|---|
| FOV 75° → 100° | DASH activated | Hyperspace punch |
| FOV 100° → 75° | DASH released | Settling back to weight |
| Silo beam intensity | Cube enters sensor | Reward pulse |
| Cockpit terminal open | Upgrades accessed | Mechanical reveal |
| Headlamp flicker | Boot sequence | Machine waking up |

**Never use immediate state jumps for visual transitions.** Everything smooths through react-spring or `useFrame` lerp. The mech is heavy; the UI responds like hardware.

## Ore shrink animation (M2)
As ore health drains, animate ore mesh scale `[1,1,1]` → `[0,0,0]` using react-spring. This makes the ore feel like it's being consumed, not toggled off.

## Audio direction

The audio is not orchestral. It is procedural, dissonant, industrial, and pressure-driven.

### Soundscape

- Low, distant rumbles — the planet is dying
- Occasional metallic creaks of the mech frame
- Wind and dust in craters
- Silo hum: low-frequency positional audio — louder as you approach

### Event sounds

| Event | Mood | Implementation |
|---|---|---|
| Boot | Rising power-on tone, machine waking up | Sine sweep 110Hz → 880Hz / 1.5s |
| Grinding | Abrasive sawtooth bite, pitch rises with heat | Sawtooth 80Hz + heatPct×2, continuous |
| Mech steps | Massive weight, low-frequency thud | Sine pulse ~60Hz, short decay |
| Sell | Brief clean reward tone | Pure sine 1200Hz, very short |
| Alarm | Square-wave machine panic | Square 880Hz/660Hz alt, 250ms |
| Meltdown | Harsh collapse / pitch-down failure scream | Square 440Hz → 0Hz / 2s ramp |
| Rare spawn | Dissonant interval — something is different | Two-tone dissonant chord |

### Mixing hierarchy

Priority (highest to lowest):
1. **Player feedback**: grind, overheat, cube ejection, sell — player must always hear these
2. **Alarm states**: overheat alarm, meltdown warning
3. **Environment**: silo hum, ambient wind
4. **Ambient**: mech frame creaks, spore drift

**Dynamic ducking:** When alarm plays, slightly duck ambient (BiquadFilter frequency reduced).

### Audio routing

All sound goes through `AudioEngine.js` singleton. No hardcoded frequencies in components. No new audio libraries.

See `docs/STANDARDS.md §9` for the full Web Audio graph and sound design spec.

## Menu tone

Menus should feel like a rugged industrial operating system:
- Terse wording — no flavor text or UI copy
- Monospace typography with strong bracket convention: `[ NEW EXCAVATION ]` not "Start Game"
- No playful UI copy
- Blinking cursor / terminal aesthetic on boot
- Options selected by raycast (crosshair) into the 3D dashboard, not by mouse click
