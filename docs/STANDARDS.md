---
title: Standards
doc_type: standards
status: active
owner: engineering
last_updated: 2026-04-09
---

# STANDARDS.md — OVERHEAT: Titan Extraction
> Code quality, brand, and design standards.  
> This document is part of the DRY documentation chain:  
> `CLAUDE.md` / `.github/copilot-instructions.md` → `AGENTS.md` → **this file**

---

## 1. Color palette (immutable — brand identity)

| Token | Hex | Usage |
|---|---|---|
| `color.void` | `#020406` | Background, fog, scene backdrop |
| `color.oreNeon` | `#00ffcc` | Standard ore, primary UI, particle spores, Silo beam |
| `color.oreRare` | `#ff00ff` | Rare isotope ore (magenta) |
| `color.heatWarn` | `#ff4400` | Heat bar, normal temperature warning |
| `color.heatCrit` | `#ff0000` | Critical heat, overheat state, alarms |
| `color.chassis` | `#0f1418` | Mech body, dashboard casing, cockpit surfaces |
| `color.sunlight` | `#ffaa55` | Directional alien sun (low angle, long shadows) |
| `color.credit` | `#ffaa00` | Credits display, upgrade cost, ejected cube emissive |
| `color.fog` | `#020406` | THREE.Fog color (matches void) |
| `color.sawCold` | `#1a1a1a` | MoltenSaw blade when cool |
| `color.sawHot` | `#ff3300` | MoltenSaw blade at peak heat |

**Rule:** Avoid introducing new repeated inline hex values in components. The current scaffold still contains some temporary inline colors; when touching those areas, prefer consolidating reused palette values into shared constants instead of adding more one-off literals.

---

## 2. Typography (diegetic UI only)

All text rendered inside the 3D scene (Dashboard canvas) uses:
- Font: `bold monospace` (system font, no web font load)
- Dashboard header labels: `bold 36px monospace`
- Credits display: `bold 56px monospace`
- Warning text: `bold 32px monospace`, centered

All HTML overlay menus (Boot, Main Menu, Pause, Settings, Report) use:
- Font family: `monospace`
- Letter spacing: `0.15em` to `0.3em` (retro terminal aesthetic)
- No serif or sans-serif fonts anywhere in the game

---

## 3. Lighting model

```
ambientLight   color="#220a33"  intensity=0.15   (deep purple alien ambient)
directionalLight  position=[-50,30,-50]  color="#ffaa55"  intensity=0.8
                  castShadow  shadow-mapSize=[2048,2048]
fog  args=["#020406", 60, 200]
```

- Headlamp: `SpotLight` attached to camera (inside `Player.jsx` or `Cockpit.jsx`). Flickers during boot sequence using `Math.random() * intensity` multiplier for ~0.5s.
- Silo beam: Additive blended transparent `meshBasicMaterial` cylinder — NOT an actual light source.
- Stars: `<Stars radius=200 depth=50 count=3000 factor=4 saturation=0 fade speed=1 />`

---

## 4. Post-processing pipeline

All effects batched in a single `EffectComposer` with `disableNormalPass`:

```jsx
<EffectComposer disableNormalPass>
  <Bloom luminanceThreshold={0.6} mipmapBlur intensity={1.5} blendFunction={BlendFunction.ADD} />
  <ChromaticAberration ref={chromRef} blendFunction={BlendFunction.NORMAL} />
  <Vignette eskil={false} offset={0.1} darkness={isOverheated ? 1.3 : 1.1} blendFunction={BlendFunction.NORMAL} />
</EffectComposer>
```

**ChromaticAberration offset mapping** (updated every frame in `useFrame`):
```js
const heatFactor = Math.max(0, (heat - 50) / 50)   // activates past 50% heat only
const pulse = isOverheated ? Math.sin(clock.elapsedTime * 10) * 0.005 : 0
offset = 0.001 + heatFactor * 0.004 + pulse
```

**Planned extensions (see HANDOFF.md §5):**
- Grayscale pass during Pause/Diagnostics mode
- Glitch shader pass during Meltdown sequence
- CRT scanline + barrel distortion (toggleable via `settings.crtOverlays`)

---

## 5. Physics patterns

### Rule table

| Object | RigidBody type | Collider | Notes |
|---|---|---|---|
| Terrain | `fixed` | `HeightfieldCollider` | 64×64 simplex grid, scale=5 |
| Ore vein | `fixed` | `BallCollider` | Never convex hull — Vec3 NaN risk |
| Ejected cube | dynamic (default) | `colliders="cuboid"` | userData `{type:'cube', id}` |
| Player | dynamic | `colliders="cuboid"` + `lockRotations` | Velocity-driven via `setLinvel` |
| Silo base | `fixed` | hull on cylinder mesh | Low polygon count only |
| Silo sensor | `fixed` sensor | `CuboidCollider args=[3,10,3]` | `onIntersectionEnter` → sell |
| Tractor anchor | `kinematicPosition` | none | Follows crosshair world pos |
| Debris chunk | dynamic | `BallCollider` | InstancedRigidBodies if count > 20 |

### Movement pattern (Player)
```js
// Inside useFrame:
bodyRef.current.wakeUp()
bodyRef.current.setLinvel({ x: dir.x * speed, y: vel.y, z: dir.z * speed }, true)
// Camera synced to body translation + 1.6 y offset (eye height)
```

### Tractor Beam (Spring Joint — NOT YET IMPLEMENTED)
```js
// 1. Raycast from screen center against cube RigidBodies
// 2. On hit: create kinematicPosition anchor at hit point
// 3. useSpringJoint(anchorRef, cubeRef, { stiffness: 40, damping: 0.3, restLength: 0 })
// 4. Every frame: update anchor position = camera.position + lookDir * depth
// 5. Reel-in: depth -= delta * 10 (cube floats toward windshield)
// 6. On pointer-up: destroy joint; cube keeps momentum (throw velocity)
```

---

## 6. State management patterns

### The Zustand rule
```
NEVER use React Context, useReducer, or prop-drilling for game loop data.
ALWAYS use useGameStore() with slice selectors.
```

```js
// ✅ Correct — subscribe to a slice
const heat = useGameStore((s) => s.heat)

// ❌ Wrong — subscribes to entire store (re-renders on every state change)
const store = useGameStore()
```

### Action naming convention
- `set*` — simple boolean/string phase changes (`setPhase`, `setPaused`)
- `add*` — additive operations that clamp to limits (`addOre`, `addHeat`, `addCredits`)
- `coolDown` — inverse additive with state transition side-effect
- `buy*` — transactional (debit credits, apply upgrade)
- `trigger*` — initiates a dramatic state transition (`triggerMeltdown`)
- `reset*` — full or partial state reset (`resetSession`)

### Persist middleware
Persisted keys (saved to `localStorage` key `overheat-titan-storage`):
- `credits`, `upgrades`, `settings`

Never persist: `heat`, `rawOre`, `phase`, `isPaused`, `isMelting`, `sessionCredits` — these are session-only.

---

## 7. Component authoring rules

### File structure
- One component per file, named identically to the component (`Terrain.jsx` exports `Terrain`).
- All game components live under `src/components/`.
- Audio engine stays in `src/audio/AudioEngine.js` (singleton, not a React component).
- Store stays in `src/store.js` (flat file, not a directory).

### useMemo for geometry
```js
// ✅ Always memoize procedurally generated geometries
const geometry = useMemo(() => {
  const geo = new THREE.BufferGeometry()
  // ... build geometry
  return geo
}, []) // empty deps = build once
```

### useFrame rules
- All physics/movement/animation logic lives in `useFrame`.
- Always guard: `if (!bodyRef.current) return`.
- Pause guard: `if (isPaused || phase !== 'gameplay') return`.
- Never call `setState` or Zustand `set()` inside `useFrame` — use throttled refs and only call store actions at bounded intervals.

### Component structure template
```jsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store'

export function ComponentName() {
  // 1. Store slices (narrow selectors)
  const phase = useGameStore((s) => s.phase)

  // 2. Refs for imperative R3F/Rapier access
  const bodyRef = useRef()

  // 3. Memoized geometry / materials
  const geometry = useMemo(() => { /* ... */ }, [])

  // 4. useFrame loop
  useFrame((state, delta) => {
    if (!bodyRef.current) return
    // ...
  })

  // 5. JSX — minimal, semantic
  return ( /* ... */ )
}
```

---

## 8. GLSL shader rules (MoltenSaw + future shaders)

- Always use `@react-three/drei`'s `shaderMaterial()` helper + `extend()`.
- Uniforms: prefix with `u` (e.g., `uHeat`, `uTime`).
- Varyings: prefix with `v` (e.g., `vUv`, `vNormal`).
- Update uniforms imperatively in `useFrame` via `matRef.current.uHeat = value` — never via React state.
- Fragment shader color output: always `gl_FragColor = vec4(color, 1.0)` unless transparency is intentional.
- Avoid `discard` in fragment shaders for performance.

### MoltenSaw uniform contract
| Uniform | Range | Driven by |
|---|---|---|
| `uHeat` | 0.0–1.0 | `heat / 100` from store |
| `uTime` | seconds | `clock.elapsedTime` from useFrame |
| `uColorCold` | THREE.Color | `#1a1a1a` (saw cold) |
| `uColorHot` | THREE.Color | `#ff3300` (saw at max heat) |

---

## 9. Audio standards

### Web Audio graph
```
OscillatorNode → GainNode → masterGain → filterNode (BiquadFilter lowpass) → destination
```

- Master volume: controlled by `masterGain.gain`.
- Pause muffling: `filterNode.frequency` swept 20kHz → 300Hz smoothly.
- All `OscillatorNode` instances are fire-and-forget (created, started, stopped inline).

### Sound design intent (microtonal / alien)
Inspired by the tune.js Just Intonation specification in the original brief:
- **Grinding**: sawtooth wave, pitch rises with heat percentage (80Hz + heatPct×2).
- **Mech steps**: low sine pulse, ~60Hz, short decay.
- **Sell/credit**: bright pure sine, 1200Hz, very short.
- **Power up**: sine sweep 110Hz → 880Hz over 1.5s.
- **Alarm**: square wave alternating 880Hz / 660Hz at 250ms interval.
- **Meltdown**: square wave 440Hz → ~0Hz exponential ramp, 2s, high gain.

### Spatial audio (planned — not yet implemented)
```js
// Silo hum: THREE.PositionalAudio on Silo mesh
// Dash thrusters: volume mapped to bodyRef.current.linvel() magnitude
// Hit-stop: 50ms useFrame clock pause on first ore contact
```

---

## 10. Game feel ("juice") standards

### Camera shake
When grinding: apply random offset to `camera.position` each frame:
```js
const shakeScale = (heat / 100) * 0.03
camera.position.x += (Math.random() - 0.5) * shakeScale
camera.position.y += (Math.random() - 0.5) * shakeScale
camera.position.z += (Math.random() - 0.5) * shakeScale
```

### Dash FOV burst
```js
const targetFov = dash ? 100 : 75
camera.fov += (targetFov - camera.fov) * Math.min(1, delta * 6)
camera.updateProjectionMatrix()
```

### Hit-stop (planned)
On first ore contact: freeze `useFrame` delta application and Tune oscillator for exactly 50ms. Massive perceived impact.

### Ore shrink (planned)
As ore health drains, animate ore mesh scale from `[1,1,1]` toward `[0,0,0]` via a compatible 3D motion solution once one is selected for the current React Three Fiber version.

### Sparks (planned)
On grind contact: emit 5–10 small emissive box meshes with upward + random velocity. Apply gravity via Rapier dynamic RigidBodies. TTL ~1.5s.

---

## 11. Approved libraries

Only the following libraries are in `package.json` and approved for use:

```
react, react-dom
three, @react-three/fiber, @react-three/drei, @react-three/rapier
@react-three/postprocessing, postprocessing
zustand
simplex-noise
maath
framer-motion
```

**To add a new library:** Document the reason in the PR description and update this section.  
**Never add:** Cannon.js, Redux, MobX, any additional physics engine.

---

## 12. Build & tooling

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build (outputs to `dist/`) |
| `npm run preview` | Preview production build locally |

`dist/` is gitignored. Never commit build artifacts.

Vite config (`vite.config.js`) uses `@vitejs/plugin-react` with optimizeDeps for Three.js ecosystem packages.

---

## 13. Accessibility & performance floor

- Target: 60fps on a mid-range gaming laptop (GTX 1060 class).
- `InstancedRigidBodies` required when debris chunk count exceeds 20.
- `frustumCulled={false}` only on particle systems (`AmbientSpores`) — all other meshes use default culling.
- `depthWrite={false}` on all additive-blended transparent materials (Silo beam, spores).
- Shadow maps: only the directional sun light casts shadows, `shadow-mapSize=[2048,2048]`.
