---
title: Visual and Audio Direction
doc_type: design
status: active
owner: design
last_updated: 2026-04-12
---

# Visual and Audio Direction

OVERHEAT should feel like an industrial exosuit peering through damaged optics on a hostile moon. Dark, harsh, neon-accented, and mechanically overstressed.

## 1. Creative pillars

1. **Industrial Gravitas** — everything feels heavy, dangerous, and engineered. Never floaty or delicate.
2. **Diegetic Clarity** — all critical information is physically present in the cockpit. No floating overlays.
3. **Risk Through Heat** — heat is the heartbeat of the game. The visual language escalates with it.
4. **Tactile Physics** — the world is solid. Cubes, debris, and ore behave believably.
5. **Alien Familiarity** — the world feels alien but readable; no visual noise that obscures gameplay.

## 2. Color palette

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

## 3. Visual & Audio Game Feel ("Juice")

The core loop requires **Purpose, Feedback, and "Juice"**.

### Procedural Audio Engine (Web Audio API)
Sound is 50% of game feel. The zero-asset synthesizer generates:
- **Mech Footsteps:** Deep sine waves timed to movement.
- **Grinding Buzz Saw:** A continuous `sawtooth` oscillator mixed with a white noise buffer. The pitch dynamically bends upwards as the mech's internal heat climbs.
- **Overdrive:** When the mech crosses 80°C, the grinder synth pushes its signal through a highly resonant random lowpass sweep, sounding strained and on the brink of structural failure.
- **Tractor Latch & Sell:** Satisfying procedural chimes and thunks.

### Procedural Spatial Audio (Tune.js & THREE.js)
To make the world feel alive, oscillators are tied to `THREE.PositionalAudio`.
- **Silo Hum:** A low-frequency, slowly modulating sine wave is attached to the Silo's 3D position. The volume decreases naturally via inverse-square law as the player walks away.
- **Dash Thrusters:** The volume of the white-noise/sawtooth thruster synth maps directly to the player's `linvel()` vector magnitude.
- **The "Hit Stop" Effect:** When the saw first makes contact with an ore vein, the R3F `useFrame` clock and grinder oscillators freeze for exactly 50 milliseconds. This micro-pause creates massive kinesthetic impact, simulating the saw teeth biting into heavy rock.

### Screen Shake & Impacts
Grinding ore violently shakes the camera and spews glowing bouncing sparks (`InstancedRigidBodies` physics debris). Ejecting a cube delivers a heavy recoil kick.

### The Tether Beam & Auto-Reel Tractor
When the player grabs a cube or debris with the gravity tool, a dynamic 3D cylinder (Cyan Tractor Beam Visual) renders exactly between the multi-tool nozzle and the center of mass of the physics object.
- **Auto-Reel:** The physics constraint (Spring Joint) dynamically shortens its depth distance while the user holds the touch/mouse button down, lassoing cubes from afar and reeling them into the air right in front of the cockpit for easy throwing.

### Dash / Thruster Mechanic
Pressing the "THRUST" button fires the thrusters (engine hiss/roar synth). The FOV zooms out dynamically via `react-spring`, speed triples temporarily, and the camera shakes.

### Procedural Environment & Atmosphere
Added a procedural starfield and drifting glowing spores/dust motes to the air (using `maath/random` in a dense sphere). This gives the world a sense of scale and velocity as the mech walks through them.

### Tactical Terrain & Lighting
- **Wireframe Tactical Overlay:** The terrain mesh has an additive wireframe overlay slightly above it to give everything an immersive "Simulated Cockpit" feeling.
- **Mech Headlamp Spotlight:** A volumetric spotlight attached directly to the camera pitch node illuminates the dark alien craters, following the player's gaze.

### The Diegetic UI & Cockpit
- **The Dashboard:** A true diegetic UI rendered directly onto the 3D canvas screen via `@react-three/drei` `Text` components.
- **CRT Overlays:** Toggleable scanlines and barrel distortion shaders add to the retro-industrial feel.
- **Overheat Strobe:** When heat hits 100%, an overheat warning strobe light floods the cockpit.

## 4. Typography (Diegetic UI only)

All text rendered inside the 3D scene (Dashboard canvas) uses:
- Font: `bold monospace` (system font, no web font load)
- Typography rules:
  - All caps for labels.
  - Use monospaced digits for readouts (heat %, credits, capacity).
  - Avoid italics; use color and size for emphasis.
