---
title: Handoff
doc_type: handoff
status: active
owner: engineering
last_updated: 2026-04-09
---

# HANDOFF.md — OVERHEAT: Titan Extraction
> Implementation state for the current agent session hand-off.  
> Maintained by every agent. Update before every commit.  
> Part of the DRY chain: `AGENTS.md` → **this file** + `docs/STANDARDS.md`

---

## Quick state snapshot

| Area | Status |
|---|---|
| Project scaffold (Vite + React + R3F) | ✅ Complete |
| Zustand store with persist | ✅ Complete |
| Web Audio engine | ✅ Complete (no external audio lib) |
| Terrain (simplex-noise + Rapier heightfield) | ✅ Complete |
| Ambient spores (particle field) | ✅ Complete |
| Environment (lighting, fog, stars) | ✅ Complete |
| Player (physics, WASD, mouse-look, dash, shake) | ✅ Complete |
| Diegetic Dashboard (CanvasTexture HUD) | ✅ Complete |
| MoltenSaw (GLSL shaderMaterial) | ✅ Complete |
| Cockpit assembly | ✅ Complete |
| Ore veins (static RigidBodies, proximity grind) | ✅ Complete |
| Cube ejection on hopper full | ✅ Complete |
| Silo (base + beam + sell sensor) | ✅ Complete |
| Post-processing (Bloom + ChromAberr + Vignette) | ✅ Complete |
| Heat → post-FX mapping | ✅ Complete |
| Boot sequence (powered_down → menu) | ✅ Complete |
| Main menu (Html overlay) | ✅ Complete |
| Pause / Diagnostics mode (ESC) | ✅ Complete |
| Settings menu (volume, sensitivity, CRT) | ✅ Complete |
| Meltdown at heat 120 + report screen | ✅ Complete |
| Upgrades terminal (cap / pow / cool) | ✅ Complete |
| Domain-organized docs directory + index | ✅ Complete |
| Docs-specific `docs/AGENTS.md` guidance | ✅ Complete |
| Tractor Beam (Spring Joint drag + throw) | ❌ Not implemented |
| Debris instancing (InstancedRigidBodies) | ❌ Not implemented |
| Spark emitter on grind contact | ❌ Not implemented |
| Ore shrink animation (framer-motion-3d) | ❌ Not implemented |
| Hit-stop effect (50ms freeze on first contact) | ❌ Not implemented |
| Spatial / positional audio (THREE.PositionalAudio) | ❌ Not implemented |
| Headlamp SpotLight (boot flicker + stable beam) | ❌ Not implemented |
| Grayscale / wireframe pass during pause | ❌ Not implemented |
| Glitch shader pass during meltdown | ❌ Not implemented |
| CRT overlay shader (scanlines + barrel) | ❌ Not implemented |
| maath/random for spores (currently custom impl) | ⚠️ Partial — custom inSphere used |
| framer-motion-3d panel transitions (boot/upgrade) | ❌ Not implemented |
| Diegetic menu raycast (shoot dashboard to select) | ❌ Not implemented |

---

## §1 — What is built (detail)

### Scaffold
- `package.json` — all dependencies locked (see `docs/STANDARDS.md §11`)
- `vite.config.js` — `@vitejs/plugin-react`, optimizeDeps for Three.js ecosystem
- `index.html` — dark background, full-viewport root

### `src/store.js`
Full Zustand store with `persist` middleware. Persists: `credits`, `upgrades`, `settings`.
Phase enum: `powered_down | boot | menu | gameplay | paused | meltdown | report | settings | upgrades`.
Heat thresholds: 100 = overheat (saw lock), 120 = meltdown trigger.
All computed getters (`getMaxOre`, `getGrindDps`, `getCoolingRate`) use `get()` — not stored in state.

### `src/audio/AudioEngine.js`
Singleton Web Audio API engine. BiquadFilter lowpass for pause muffling.
All methods listed in `AGENTS.md §9`. Fire-and-forget oscillator pattern.
`init()` called once on first user gesture to satisfy browser autoplay policy.

### Terrain
`simplex-noise` `createNoise2D()` generating 64×64 height grid at scale=5.
Three-layer octave noise for organic alien dunes. Visual mesh + `HeightfieldCollider` in same component.

### Player
- Dynamic `RigidBody` + `lockRotations` + `colliders="cuboid"`
- Keyboard via `window` event listeners (not `KeyboardControls` hook — simpler for mouse-look compat)
- Mouse-look via `mousemove` + `document.exitPointerLock` / `requestPointerLock`
- Pitch clamped ±60°; `camera.position` synced to `body.translation()` + 1.6 eye height
- Dash: `ShiftLeft/Right` → `DASH_SPEED=20`, `targetFov=100`; normal: `SPEED=8`, `targetFov=75`
- Camera shake: random offset scaled by `heat/100 * 0.03` per frame

### Ore + Economy loop
- 8 static ore veins at fixed world positions (`ORE_POSITIONS`)
- Proximity grind: distance to camera < 5 units → `addOre(getGrindDps() * delta)` + `addHeat(15 * delta)`
- Ejected cube spawns at camera position when `rawOre >= getMaxOre()`
- Silo `onIntersectionEnter` → `addCredits(50)` + `playSell()`

### Visual effects
- `VisualEffects.jsx` — `EffectComposer disableNormalPass` with all three passes
- `chromRef` updated imperatively in `useFrame` for smooth heat-reactive aberration

### UI overlays
All screens use `@react-three/drei` `<Html fullscreen>`. Phase gating in each component.
- `BootScreen` — blinking cursor, single click initiates `audioManager.init()` + power-up audio
- `MainMenu` — NEW EXCAVATION + OS CONFIG buttons; requests pointer lock on game start
- `PauseMenu` — ESC toggle; RESUME / SETTINGS / ABORT MISSION
- `SettingsMenu` — sliders for volume + sensitivity; checkbox for CRT
- `MeltdownScreen` — red flash (meltdown phase) → TITAN LOST report (report phase)
- `UpgradesTerminal` — three upgrade tracks with credit cost scaling per level

---

## §2 — Next implementation priority

Work through these in order. Each is a discrete, shippable unit.

### Priority 1 — Tractor Beam (most impactful gameplay feature)

**Files to create/modify:**
- `src/components/TractorBeam.jsx` (new)
- `src/components/Player.jsx` (add pointer-down/up handlers)
- `src/components/OreSpawner.jsx` (tag cubes with `userData.type='cube'`)

**Implementation steps:**
1. Add an invisible `RigidBody type="kinematicPosition"` ref (`tractorAnchorRef`) inside the scene — the "cursor hook".
2. On `pointerdown`: cast a ray from `camera` position along `camera.getWorldDirection()`. If it hits a `userData.type === 'cube'` RigidBody, capture the ref.
3. Create a `useSpringJoint(tractorAnchorRef, cubeRef, { stiffness: 40, damping: 0.3, restLength: 0 })`.
4. Each frame while pointer is down: `tractorAnchor.setNextKinematicTranslation(camera.pos + lookDir * depth)`. Reduce `depth -= delta * 10` (reel-in).
5. On `pointerup`: read last-frame velocity of cube body → `cubeBody.applyImpulse(throwVelocity)`. Destroy joint by clearing refs.
6. Visual: a thin cyan `<Line>` from camera center to cube (use `@react-three/drei` `<Line>`).

**Reference:** `AGENTS.md §8 Physics rules`, `AGENTS.md §13`

---

### Priority 2 — Headlamp SpotLight + Boot flicker

**File:** `src/components/Player.jsx` or new `src/components/Headlamp.jsx`

```jsx
// Inside Cockpit or Player camera group:
<spotLight
  ref={headlampRef}
  position={[0, 0, 0]}
  target-position={[0, 0, -1]}
  intensity={2}
  angle={0.4}
  penumbra={0.3}
  color="#ffeecc"
  castShadow
/>
```

Boot flicker: in the `boot` phase, run a `useInterval` or `useFrame` for 0.5s that sets `headlampRef.current.intensity = Math.random() * 3` before stabilizing at 2.

---

### Priority 3 — Spark emitter on grind contact

**File:** `src/components/Sparks.jsx` (new)

- On each grind tick (while distance < 5 and not overheated), call a `spawnSpark()` function.
- Each spark: small `<Box args={[0.05,0.05,0.05]}>` with `meshStandardMaterial emissive="#ffaa00" emissiveIntensity={2}` + dynamic Rapier `RigidBody` with upward + random XZ impulse applied immediately after spawn.
- Each spark has TTL ~1.5s (remove from state after that).
- Limit: max 30 live sparks at once (drop oldest if exceeded).

---

### Priority 4 — Ore destruction + debris

**File:** `src/components/OreSpawner.jsx` (modify)

- Add `health` state to each ore vein (start: 100).
- Each grind tick reduces ore health by `getGrindDps() * delta`.
- At health ≤ 0: remove ore vein, spawn 5–8 debris chunks via `InstancedRigidBodies` if count > 20, else individual `RigidBody` balls with radial impulse.
- Debris chunks are `userData.type = 'debris'` (can be tractor-beamed).
- Respawn new ore vein at same position after 15s (configurable).

---

### Priority 5 — Ore shrink (framer-motion-3d)

**File:** `src/components/OreSpawner.jsx`

Replace static ore mesh with `<motion.mesh>` from `framer-motion-3d`:
```jsx
import { motion } from 'framer-motion-3d'
// ...
<motion.mesh animate={{ scale: healthPct }} transition={{ type: 'spring', stiffness: 100 }}>
```
Where `healthPct` goes from `1.0` to `0.0` as ore health drains.

---

### Priority 6 — Hit-stop effect

**File:** `src/components/OreSpawner.jsx` or `src/components/Player.jsx`

On the first frame that grinding begins (transition from not-grinding to grinding):
```js
// In useFrame, detect leading edge of grind state
if (justStartedGrinding) {
  const savedDelta = delta
  // Freeze movement/physics for 50ms by setting a ref flag
  hitStopRef.current = true
  setTimeout(() => { hitStopRef.current = false }, 50)
}
// Guard in useFrame:
if (hitStopRef.current) return
```
This creates the "saw teeth biting into rock" kinesthetic impact.

---

### Priority 7 — Spatial audio (Silo hum + dash)

**File:** `src/components/Silo.jsx`, `src/components/Player.jsx`

Silo hum:
```js
// Inside Silo.jsx, after audio init:
const listener = new THREE.AudioListener()
camera.add(listener)
const sound = new THREE.PositionalAudio(listener)
const analyser = audioManager.ctx.createOscillator()
// low freq ~60Hz sine, connected to positional audio
siloMeshRef.current.add(sound)
```

Dash thruster volume:
```js
const vel = bodyRef.current.linvel()
const speed = Math.sqrt(vel.x**2 + vel.y**2 + vel.z**2)
audioManager.setThrusterVolume(speed / DASH_SPEED)
```

---

### Priority 8 — Pause grayscale/wireframe pass

**File:** `src/components/VisualEffects.jsx`

Add a `HueSaturation` effect from `@react-three/postprocessing` and set `saturation=-1.0` when `isPaused`.
The "glowing cyan wireframe" is harder — deferred to later (requires a custom render pass or outline effect).

---

### Priority 9 — Meltdown glitch shader

**File:** `src/components/VisualEffects.jsx`

Use `GlitchEffect` from `postprocessing` package:
```jsx
import { Glitch } from '@react-three/postprocessing'
import { GlitchMode } from 'postprocessing'

{isMelting && (
  <Glitch delay={[0.0, 0.1]} duration={[0.1, 0.3]} strength={[0.3, 1.0]} mode={GlitchMode.CONSTANT_WILD} />
)}
```

---

### Priority 10 — CRT shader (scanlines + barrel)

**File:** `src/components/VisualEffects.jsx`

Conditionally render when `settings.crtOverlays === true`. Requires a custom `ShaderPass` with:
- Scanline darkening: `color *= 1.0 - 0.15 * mod(vUv.y * screenHeight, 2.0)`
- Barrel distortion: radial uv warping

Can also use `@react-three/postprocessing`'s `PixelationEffect` as a simpler substitute.

---

### Priority 11 — Diegetic menu raycast (dashboard as interactive surface)

**File:** `src/components/Dashboard.jsx`

The AGENTS.md §18 vision: player shoots the 3D dashboard with the crosshair to select menu items.

Implementation:
1. In Dashboard canvas, render clickable regions for `[ NEW EXCAVATION ]` and `[ OS CONFIG ]` during `menu` phase.
2. Add a `onPointerDown` handler to the dashboard mesh.
3. Read UV coordinates from the intersection event (`event.uv`).
4. Map UV → menu option (NEW EXCAVATION: uv.y < 0.5; OS CONFIG: uv.y >= 0.5).
5. Call appropriate action.

---

### Priority 12 — framer-motion UI panel transitions

**File:** All `*Menu.jsx` overlays

Wrap HTML overlay content in `<motion.div>` from `framer-motion`:
```jsx
<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 20 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
```
Requires wrapping the phase-conditional render in `<AnimatePresence>` in `App.jsx` / `Scene`.

---

### Priority 13 — maath/random for spores

**File:** `src/components/AmbientSpores.jsx`

Replace current custom `inSphere()` with official maath:
```js
import * as random from 'maath/random/dist/maath-random.esm'
const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 150 }))
```
(Currently using a custom equivalent because of ESM import complexity — fix once maath import is confirmed working in the build.)

---

## §3 — Known issues

| # | Issue | Severity | File | Notes |
|---|---|---|---|---|
| 1 | Ore grind uses camera proximity (not physics contact) | Medium | `OreSpawner.jsx` | Should use Rapier intersection instead for physical accuracy |
| 2 | No ore health / destruction | High | `OreSpawner.jsx` | Veins never die; hopper fills infinitely |
| 3 | Cube sell doesn't remove RigidBody | High | `Silo.jsx` | `onIntersectionEnter` triggers credits but cube body persists |
| 4 | Tractor Beam missing entirely | High | — | Core gameplay mechanic not yet implemented |
| 5 | No pointer-lock on resume from pause | Low | `PauseMenu.jsx` | `requestPointerLock()` may need user gesture |
| 6 | Settings "back" always goes to 'menu' | Medium | `SettingsMenu.jsx` | Should return to 'paused' if accessed from pause |
| 7 | `maath` inSphere uses custom impl | Low | `AmbientSpores.jsx` | Functional but not using official maath API |
| 8 | No headlamp / spotlight | Medium | `Player.jsx` | Cockpit is dark; only ambient + directional light |
| 9 | Meltdown camera eject is basic (just y+) | Low | `Player.jsx` | Should be a lerp to sky with smooth curve |
| 10 | No visual for tractor beam lock | Medium | — | No line/beam rendered when cube is grabbed |

---

## §4 — Architecture decisions & rationale (context for future agents)

### Why Rapier and not Cannon.js
The V1–V3 prototype used Cannon.js. When generating convex hulls for the Silo and ore debris, Cannon.js threw thousands of `faceNormal calculation errors` (`Vec3(0,0,-1) looks like it points into the shape`), causing NaN vector propagation and a black WebGL screen crash. Rapier (Rust WASM) was chosen as a replacement and is stable.

### Why no tune.js
`tune.js` is referenced in the original design document but is not available on npm. We replicate its microtonal intent using raw Web Audio API oscillators. The `AudioEngine.js` singleton deliberately mirrors the tune.js API surface from the spec (see `AGENTS.md §9`).

### Why diegetic UI (not DOM overlays)
The design decision to render the HUD inside the 3D scene as a `CanvasTexture` on the dashboard mesh was made to maintain immersion. This is non-negotiable. The only HTML overlays allowed are boot, menus, and settings (which pause the game world).

### Why KeyboardControls not used for movement
The `@react-three/drei` `KeyboardControls` hook was set up in `App.jsx` but the `Player.jsx` implementation uses direct `window.addEventListener` for keys. This is intentional — it avoids a known timing issue with `useKeyboardControls` hook and pointer lock camera. Both approaches can coexist.

### Why `useFrame` for cooling (not a timeout/interval)
Cooling needs to be delta-time accurate and pause-aware. A `setInterval` would continue cooling even when paused. `useFrame` with the `isPaused` guard ensures cooling only happens during active gameplay.

---

## §5 — Full feature checklist (from original spec)

Cross-reference with the master problem statement sections.

### From §3 Core Gameplay Loop
- [x] Drive into ore veins to harvest
- [x] Heat generation while grinding
- [x] Saw disables at 100% heat
- [x] Forced cooling after overheat
- [x] Hopper fills up
- [x] Ejected compressed cube on hopper full
- [ ] Tractor beam to drag cubes (§4, §13)
- [ ] Reel-in mechanic (depth reduction)
- [ ] Throw by flicking cursor
- [x] Silo beam sell mechanic

### From §6 Coding Patterns
- [x] Zustand store (§6.1)
- [x] Rapier player movement (§6.2)
- [x] Diegetic CanvasTexture dashboard (§6.3)
- [ ] Tractor beam spring joint (§6.4)
- [x] AudioEngine (§6.5 — Web Audio API equivalent)

### From §7 Visuals
- [x] Color palette applied (§7.1)
- [x] EffectComposer with Bloom + Vignette (§7.2)
- [ ] ChromaticAberration missing from original spec items (added in supplemental §11)
- [x] Simplex-noise terrain (§7.3)
- [x] Silo base + beam + sensor (§7.4)

### From §8 Game Feel
- [x] Camera shake scaled by heat (§8.1)
- [x] Dash FOV burst (§8.2)
- [ ] Spark emitter on grind (§8.3)

### From §10 Expanded Tech Stack (Supplemental)
- [x] @react-three/postprocessing (§10)
- [x] framer-motion installed, not yet used for transitions (§10)
- [x] maath installed, custom inSphere in place (§10)
- [x] simplex-noise replacing Math.sin for terrain (§10)

### From §11 Advanced Post-Processing (Supplemental)
- [x] ChromaticAberration heat mapping (§11)
- [x] Vignette darkness at overheat (§11)
- [ ] Grayscale pass during pause (§19)
- [ ] Glitch pass during meltdown (§21)

### From §12 GLSL Shaders (Supplemental)
- [x] MoltenSawMaterial with uHeat/uTime uniforms (§12)
- [ ] CRT scanline + barrel distortion shader (§20)

### From §13 Tractor Beam Spring Joints (Supplemental)
- [ ] Kinematic Position anchor RigidBody (§13)
- [ ] useSpringJoint on cube grab (§13)
- [ ] Reel-in depth reduction (§13)
- [ ] Throw velocity from pointer-up delta (§13)

### From §14 Ambient Environment (Supplemental)
- [x] AmbientSpores particle field (§14)
- [ ] Official maath/random.inSphere (currently custom impl)

### From §15 Spatial Audio (Supplemental)
- [ ] Silo hum PositionalAudio (§15)
- [ ] Dash thruster volume = linvel magnitude (§15)
- [ ] Hit-stop 50ms freeze on first contact (§15)

### From §16 Full Component Architecture (Supplemental)
- [x] PostProcessing chain (§16)
- [x] Terrain (§16)
- [x] SiloGroup with mesh + sensor (§16)
- [x] PlayerGroup with camera (§16)
- [x] CockpitGroup with saw + dashboard (§16)
- [ ] SpotLight headlamp on camera (§16)
- [ ] TractorAnchor kinematic body (§16)

### From §18 Diegetic Main Menu (Supplemental)
- [x] Pitch black scene on load (§18)
- [x] Boot sequence with audio power-up (§18)
- [x] Dashboard displays menu options (partial — Html overlay only)
- [ ] Raycast to shoot dashboard options (§18)
- [ ] Boot headlamp flicker (§18)

### From §19 System Diagnostics / Pause (Supplemental)
- [x] ESC → paused state (§19)
- [x] Physics paused while paused (§19)
- [x] Audio filter muffling (§19)
- [ ] Grayscale + cyan wireframe post-processing pass (§19)
- [x] CRT-styled pause menu HTML (§19)

### From §20 OS Configuration (Supplemental)
- [x] Settings menu with volume/sensitivity/CRT toggle (§20)
- [x] Settings persisted via Zustand persist (§20)
- [ ] CRT shader actually activates from toggle (§20)

### From §21 Critical Meltdown (Supplemental)
- [x] Heat 120 triggers meltdown state (§21)
- [ ] Radial impulse explosion on nearby rigid bodies (§21)
- [ ] ChromaticAberration extreme offset during meltdown (§21 — VisualEffects uses isOverheated not isMelting)
- [ ] Glitch shader pass (§21)
- [x] Tune.js/audio death (square wave pitch-down) (§21)
- [x] Camera lerp upward (basic y+ drift) (§21)
- [x] Report screen: TITAN LOST / credits recovered (§21)

### From §22 Metagame State Flow (Supplemental)
- [x] powered_down → boot → menu → gameplay → paused → meltdown → report (§22)
- [ ] settings accessible from both menu AND pause states (§22 — currently settings always returns to menu)

### From §23 Final Architectural Checklist (Supplemental)
- [x] Zustand persist (§23.1)
- [ ] InstancedRigidBodies for debris > 20 chunks (§23.2)
- [x] Html overlays with zIndexRange (§23.3)

---

## §6 — Session log

| Date | Agent | Work completed |
|---|---|---|
| 2026-04-09 | copilot-swe | Initial project scaffold — all core components, store, audio engine, full component tree built and building clean |
| 2026-04-09 | copilot-swe | Documentation infrastructure — AGENTS.md, CLAUDE.md, .github/copilot-instructions.md, .github/pull_request_template.md, docs/HANDOFF.md, docs/STANDARDS.md |
| 2026-04-09 | copilot-swe | Expanded docs set — docs/README.md index, docs/AGENTS.md guidance, and domain docs for architecture, gameplay, design, lore, and operations |
