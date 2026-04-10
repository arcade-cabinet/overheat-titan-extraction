---
title: Runtime Systems
doc_type: architecture
status: active
owner: engineering
last_updated: 2026-04-09
---

# Runtime Systems

This document breaks the runtime into operational systems and defines the expected contract for each one.

## Rendering stack

| Layer | Library | Responsibility |
|---|---|---|
| Scene graph | `three` | Meshes, materials, textures, camera, fog |
| React bridge | `@react-three/fiber` | Declarative scene composition |
| Helpers | `@react-three/drei` | `Html`, `Points`, `Stars`, `shaderMaterial`, camera helpers |
| Post-FX | `@react-three/postprocessing` | Bloom, vignette, chromatic aberration |

## State system

### Current (Zustand — interim)

`src/store.js` is the current source of truth for:
- Phase management
- Economy (credits, raw ore)
- Heat and overheat state
- Upgrade multipliers
- Persistent user settings
- Report-screen session totals

#### Persisted slices (localStorage key: `overheat-titan-storage`)
- `credits`
- `upgrades`
- `settings`

#### Session-only slices
- `phase`
- `rawOre`
- `heat`
- `isOverheated`
- `isMelting`
- `sessionCredits`

### Target (Koota ECS — M1+)

After M1, simulation state migrates to Koota traits. Zustand remains for UI/phase/economy (low-frequency). See `docs/architecture/overview.md §Architecture decision: Koota ECS + Zod`.

**Koota traits (target):**
- `MechStats` — speed, dashMultiplier, heat rates
- `Heat` — value, overheated bool
- `Hopper` — current, max
- `Position`, `Velocity`, `Rotation`
- `Input` — abstracted input intents (move, look, grind, dash, tractor)
- `OreNode` — rarity, health, position
- `Debris` — type, TTL
- `Cube` — isRare, value
- `Silo` — trigger zone position
- `AudioEmitter`, `VFXEmitter`, `UIBinding`

**Koota systems (target):**
- `MovementSystem`, `HeatSystem`, `GrindingSystem`, `CubeEjectionSystem`
- `EconomySystem`, `AudioSystem`, `VFXSystem`, `PersistenceSystem`
- `InputSystem` — consumes abstracted `InputState` from the Input Service

## Config system (M1+)

All numeric tunables are validated by Zod at app startup from `src/config.json`. Components reference `gameConfig.*` — never magic numbers.

```ts
import rawConfig from './config.json'
export const gameConfig = GameConfigSchema.parse(rawConfig)

// Example usage in a system:
heat.value += gameConfig.mech.heat.perSecondGrinding * dt
```

See `docs/architecture/overview.md §Zod config pipeline` for the full schema.

## Physics system

| Entity | Body type | Collider strategy |
|---|---|---|
| Terrain | fixed | heightfield |
| Player | dynamic | cuboid with locked rotations |
| Ore veins | fixed | ball collider |
| Ejected cubes | dynamic | cuboid |
| Silo sensor | fixed sensor | cuboid |
| Tractor anchor | kinematicPosition | none / helper body |

### Constraints
- No Cannon.js.
- No convex hulls for ore or large generated geometry.
- Use `InstancedRigidBodies` when debris counts become large.

## Audio system

`src/audio/AudioEngine.js` is a singleton wrapper around Web Audio API primitives.

### Responsibilities
- Initialize audio on first user gesture
- Expose UI / gameplay sound methods
- Centralize volume changes
- Apply the pause low-pass filter
- Expose heat-responsive grind audio

### Contract
See `AGENTS.md §9. Audio engine contract` for the full public API.

### Implementation note
The original prompt referenced `tune.js`, but the runtime uses raw oscillators because `tune.js` is not on npm. The intent (microtonal, procedural, dissonant audio) is preserved.

### Audio routing (Web Audio graph)
```
OscillatorNode → GainNode → masterGain → filterNode (BiquadFilter lowpass) → destination
```

- Master volume: `masterGain.gain`
- Pause muffling: `filterNode.frequency` swept 20kHz → 300Hz

### Planned spatial audio (M4)
```js
// Silo hum: THREE.PositionalAudio on Silo mesh
// Dash thrusters: volume mapped to bodyRef.current.linvel() magnitude
// Hit-stop: 50ms useFrame clock pause on first ore contact
```

## Animation system

**3D transitions:** `react-spring` / `@react-spring/three` — FOV bursts, silo beam intensity, cockpit UI.  
**HTML overlays:** `framer-motion` — menu transitions only.  
**`framer-motion-3d` is banned** — it's not maintained and has no active R3F integration.

### react-spring targets
| Transition | Trigger |
|-----------|---------|
| FOV zoom | DASH activated (75° → 100°) |
| Silo beam intensity | Cube enters sensor |
| Terminal screen | Upgrade terminal open/close |
| Headlamp flicker | Boot sequence |

## UI system

### In-cockpit UI
- Dashboard `THREE.CanvasTexture` — renders heat, hopper, credits in 3D
- MoltenSaw GLSL shader — heat-responsive blade color
- Crosshair mounted in front of the camera

### Overlay UI (Drei `<Html>` only)
| Screen | Phase(s) |
|--------|----------|
| Boot | `powered_down`, `boot` |
| Main menu | `menu` |
| Pause / diagnostics | `paused` |
| Settings | `settings` |
| Report / meltdown | `meltdown`, `report` |
| Upgrade terminal | `gameplay` (user action) |

`<Html>` overlays are allowed **only** for these menu-like surfaces. Never for in-game instrument data.

## Systems planned (incomplete)

| System | Planned milestone |
|---|---|
| Tractor beam spring-joint + throw | M2 |
| Pause grayscale + tactical diagnostic | M2 |
| Meltdown glitch / corruption pass | M2 |
| Spatial audio (silo hum + dash thrusters) | M4 |
| Headlamp boot flicker | M2 |
| react-spring FOV / silo transitions | M2 |
| Koota ECS migration | M1 |
| Zod config pipeline | M1 |
| Mobile Input Service + virtual joysticks | M3 |
| Capacitor shell builds | M3 |
