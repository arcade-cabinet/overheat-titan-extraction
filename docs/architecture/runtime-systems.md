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

`src/store.js` is the single source of truth for:
- phase management
- ore / heat / economy
- upgrade multipliers
- persistent user settings
- report-screen session totals

### Persisted slices
- `credits`
- `upgrades`
- `settings`

### Session-only slices
- `phase`
- `rawOre`
- `heat`
- `isOverheated`
- `isMelting`
- `sessionCredits`

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
- initialize audio on first user gesture
- expose UI / gameplay sound methods
- centralize volume changes
- apply the pause low-pass filter

### Important implementation note
The original prompt references `tune.js`, but the runtime implementation uses raw oscillators because `tune.js` is not available via npm in this project setup.

## UI system

### In-cockpit UI
- Dashboard canvas texture
- Saw blade shader feedback
- Crosshair mounted in front of the camera

### Overlay UI
- Boot
- Main menu
- Pause / diagnostics
- Settings
- Report / meltdown
- Upgrade terminal

`Html` overlays are allowed only for these menu-like surfaces.

## Systems still planned

| System | Planned addition |
|---|---|
| Tractor beam | spring-joint anchor and throw flow |
| Pause visuals | grayscale + tactical diagnostic treatment |
| Meltdown visuals | glitch / corruption pass |
| Spatial audio | silo hum + dash thrusters |
| Headlamp | camera-mounted spotlight with boot flicker |
