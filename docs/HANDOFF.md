---
title: Handoff
doc_type: handoff
status: active
owner: engineering
last_updated: 2026-04-10
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
| Tractor Beam (Spring Joint drag + throw) | ✅ Complete |
| Debris instancing (InstancedRigidBodies) | ✅ Complete |
| Spark emitter on grind contact | ✅ Complete |
| Ore shrink animation (scaleRef, direct imperative) | ✅ Complete |
| Hit-stop effect (50ms freeze on first contact) | ✅ Complete |
| Spatial audio (silo hum + thruster volume) | ✅ Complete |
| Headlamp SpotLight (boot flicker + stable beam) | ✅ Complete |
| Grayscale pass during pause (HueSaturation) | ✅ Complete |
| Glitch shader pass during meltdown | ✅ Complete |
| CRT overlay shader (scanlines + barrel) | ✅ Complete |
| maath/random for spores (official inSphere) | ✅ Complete |
| Framer-motion UI transitions (all overlay screens) | ✅ Complete |
| Rare isotopes (15%, magenta, 3× heat, $2500 cube) | ✅ Complete |
| Rare sell audio (dissonant chord + thump) | ✅ Complete (PR #13) |
| Spark emitter — instanced CPU sim, hot-white→orange fade | ✅ Complete (PR #13) |
| Dashboard heat bar 0-120°C + overheat marker | ✅ Complete (PR #13) |
| OreSpawner setState deferred out of useFrame | ✅ Complete (PR #14) |
| Diegetic pause button on dashboard (UV raycast) | ✅ Complete (PR #15) |

---

## §1 — What is built (detail)

### Scaffold
- `package.json` — all dependencies locked (see `docs/STANDARDS.md §11`)
- `vite.config.js` — `@vitejs/plugin-react`, optimizeDeps for Three.js ecosystem
- `index.html` — dark background, full-viewport root

### `src/store.js`
Full Zustand store with `persist` middleware. Persists: `credits`, `upgrades`, `settings`.
Phase enum: `powered_down | boot | menu | gameplay | settings | upgrades | meltdown | report`. Note: the paused state is `isPaused=true` while `phase='gameplay'` — there is no separate `'paused'` phase value.
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

All immediate priorities shipped. Remaining work (deferred or low priority):

### Priority 1 — Meltdown radial impulse (deferred)

**File:** New `MeltdownExplosion.jsx`

At meltdown trigger, apply radial impulse to all nearby rigid bodies. Blocked by lack of stable world-query API in current `@react-three/rapier` version — revisit when Rapier adds `world.intersectionsWithShape`.

### Priority 2 — Ore grind physics contact (low priority)

**File:** `src/components/OreSpawner.jsx`

Currently uses camera proximity (distance < 5) for grind detection. Should use Rapier sensor intersection for physical accuracy. Current approach is stable and unnoticeable to players.

### Priority 3 — Dashboard UV calibration (follow-up)

**File:** `src/components/Dashboard.jsx`

The pause button UV zone was calculated from BoxGeometry +Y face UV theory. Playtest to verify the click zone aligns with the drawn button. If off, adjust `PAUSE_UV` constants — the canvas pixel positions are the source of truth, UV mapping derives from them.

---

## §3 — Known issues

| # | Issue | Severity | File | Notes |
|---|---|---|---|---|
| 1 | Ore grind uses camera proximity (not physics contact) | Medium | `OreSpawner.jsx` | Should use Rapier intersection instead for physical accuracy |
| 2 | No ore health / destruction | High | `OreSpawner.jsx` | Veins never die; hopper fills infinitely |
| 3 | Cube sell cleanup relies on userData callback + body relocation | Medium | `Silo.jsx`, `OreSpawner.jsx` | Works now, but should eventually move to a more explicit world-entity lifecycle |
| 4 | ~~Tractor Beam missing entirely~~ | ~~High~~ | — | **Resolved in Stream A** |
| 5 | ~~`maath` inSphere uses custom impl~~ | ~~Low~~ | `AmbientSpores.jsx` | **Resolved in Stream A** |
| 6 | ~~No headlamp / spotlight~~ | ~~Medium~~ | `Player.jsx` | **Resolved in Stream A** |
| 7 | Meltdown camera eject is basic (just y+) | Low | `Player.jsx` | Should be a lerp to sky with smooth curve |
| 8 | ~~No visual for tractor beam lock~~ | ~~Medium~~ | — | **Resolved in Stream A** — cyan Line drawn |
| 9 | Meltdown radial impulse on nearby rigid bodies | Medium | — | Deferred — no stable world-query API in R3F Rapier |

---

## §4 — Architecture decisions & rationale (context for future agents)

### Why Rapier and not Cannon.js
The V1–V3 prototype used Cannon.js. When generating convex hulls for the Silo and ore debris, Cannon.js threw thousands of `faceNormal calculation errors` (`Vec3(0,0,-1) looks like it points into the shape`), causing NaN vector propagation and a black WebGL screen crash. Rapier (Rust WASM) was chosen as a replacement and is stable.

### Why no tune.js
`tune.js` is referenced in the original design document but is not available on npm. We replicate its microtonal intent using raw Web Audio API oscillators. The `AudioEngine.js` singleton deliberately mirrors the tune.js API surface from the spec (see `AGENTS.md §9`).

### Why diegetic UI (not DOM overlays)
The design decision to render the HUD inside the 3D scene as a `CanvasTexture` on the dashboard mesh was made to maintain immersion. This is non-negotiable. The only HTML overlays allowed are boot, menus, and settings (which pause the game world).

### Why direct window listeners are the authoritative movement input path
`Player.jsx` uses direct `window.addEventListener` key handlers for movement so mouse-look and pointer-lock behavior stay coupled to the same imperative input loop. `KeyboardControls` was removed from `App.jsx` to avoid having two competing input models in the scaffold.

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
- [x] Tractor beam to drag cubes (§4, §13) — TractorBeam.jsx spring joint
- [x] Reel-in mechanic (depth reduction) — mouse wheel adjusts depth
- [x] Throw by flicking cursor — pointer-up velocity applied
- [x] Silo beam sell mechanic

### From §6 Coding Patterns
- [x] Zustand store (§6.1)
- [x] Rapier player movement (§6.2)
- [x] Diegetic CanvasTexture dashboard (§6.3) — pause button via UV raycast (PR #15)
- [x] Tractor beam spring joint (§6.4)
- [x] AudioEngine (§6.5 — Web Audio API equivalent)

### From §7 Visuals
- [x] Color palette applied (§7.1)
- [x] EffectComposer with Bloom + Vignette (§7.2)
- [x] ChromaticAberration heat mapping (added in supplemental §11)
- [x] Simplex-noise terrain (§7.3)
- [x] Silo base + beam + sensor (§7.4)

### From §8 Game Feel
- [x] Camera shake scaled by heat (§8.1)
- [x] Dash FOV burst (§8.2)
- [x] Spark emitter on grind (§8.3) — instanced mesh CPU sim (PR #13), hot-white→orange fade, max 5/s throttle

### From §10 Expanded Tech Stack (Supplemental)
- [x] @react-three/postprocessing (§10)
- [x] framer-motion — all overlays have fade/slide transitions (§10)
- [x] maath — official `random.inSphere` (§10)
- [x] simplex-noise replacing Math.sin for terrain (§10)

### From §11 Advanced Post-Processing (Supplemental)
- [x] ChromaticAberration heat mapping (§11)
- [x] Vignette darkness at overheat (§11)
- [x] Grayscale pass during pause — HueSaturation in VisualEffects (§19)
- [x] Glitch pass during meltdown — GlitchEffect in VisualEffects (§21)

### From §12 GLSL Shaders (Supplemental)
- [x] MoltenSawMaterial with uHeat/uTime uniforms (§12)
- [x] CRT scanline + barrel distortion shader — toggleable via settings (§20)

### From §13 Tractor Beam Spring Joints (Supplemental)
- [x] Kinematic Position anchor RigidBody (§13)
- [x] useSpringJoint on cube grab (§13)
- [x] Reel-in depth reduction (§13)
- [x] Throw velocity from pointer-up delta (§13)

### From §14 Ambient Environment (Supplemental)
- [x] AmbientSpores particle field (§14)
- [x] Official maath/random.inSphere (§14)

### From §15 Spatial Audio (Supplemental)
- [x] Silo hum — OscillatorNode + LFO, distance attenuation (§15)
- [x] Dash thruster volume = linvel magnitude via ScriptProcessor (§15)
- [x] Hit-stop 50ms freeze on first grind contact (§15)

### From §16 Full Component Architecture (Supplemental)
- [x] PostProcessing chain (§16)
- [x] Terrain (§16)
- [x] SiloGroup with mesh + sensor (§16)
- [x] PlayerGroup with camera (§16)
- [x] CockpitGroup with saw + dashboard (§16)
- [x] SpotLight headlamp on camera — Headlamp.jsx with boot flicker (§16)
- [x] TractorAnchor kinematic body — TractorBeam.jsx (§16)

### From §18 Diegetic Main Menu (Supplemental)
- [x] Pitch black scene on load (§18)
- [x] Boot sequence with audio power-up (§18)
- [x] Dashboard displays menu options (Html overlay)
- [ ] Raycast to shoot dashboard options (§18) — deferred, Html overlay works well
- [x] Boot headlamp flicker — Headlamp.jsx flicker animation during boot phase (§18)

### From §19 System Diagnostics / Pause (Supplemental)
- [x] ESC → paused state (§19)
- [x] Physics paused while paused (§19)
- [x] Audio filter muffling (§19)
- [x] Grayscale post-processing pass — HueSaturation(saturation=-1) in VisualEffects (§19)
- [x] CRT-styled pause menu HTML (§19)

### From §20 OS Configuration (Supplemental)
- [x] Settings menu with volume/sensitivity/CRT toggle (§20)
- [x] Settings persisted via Zustand persist (§20)
- [x] CRT shader activates from settings.crtOverlays toggle (§20)

### From §21 Critical Meltdown (Supplemental)
- [x] Heat 120 triggers meltdown state (§21)
- [ ] Radial impulse explosion on nearby rigid bodies (§21) — not yet
- [x] ChromaticAberration extreme offset — isMelting mapped in VisualEffects (§21)
- [x] Glitch shader pass — GlitchEffect active during meltdown (§21)
- [x] Audio death — square wave pitch-down playMeltdown() (§21)
- [x] Camera lerp upward (y+ drift during isMelting) (§21)
- [x] Report screen: TITAN LOST / credits recovered (§21)

### From §22 Metagame State Flow (Supplemental)
- [x] powered_down → boot → menu → gameplay → paused → meltdown → report (§22)
- [x] Settings accessible from both menu AND pause states (§22)

### From §23 Final Architectural Checklist (Supplemental)
- [x] Zustand persist (§23.1)
- [x] InstancedRigidBodies for debris (§23.2) — OreSpawner.jsx
- [x] Html overlays with zIndexRange (§23.3)

---

## §6 — Session log

| Date | Agent | Work completed |
|---|---|---|
| 2026-04-09 | copilot-swe | Initial project scaffold — all core components, store, audio engine, full component tree built and building clean |
| 2026-04-09 | copilot-swe | Documentation infrastructure — AGENTS.md, CLAUDE.md, .github/copilot-instructions.md, .github/pull_request_template.md, docs/HANDOFF.md, docs/STANDARDS.md |
| 2026-04-09 | copilot-swe | Expanded docs set — docs/README.md index, docs/AGENTS.md guidance, and domain docs for architecture, gameplay, design, lore, and operations |
| 2026-04-09 | claude-sonnet | Full docs extraction from strategy_sessions.md: Koota ECS + Zod as canonical target (user confirmed), design bible, M1–M6 roadmap, rare isotopes, onboarding missions, contracts, ADRs, mobile controls spec, playtesting notes |
| 2026-04-09 | claude-sonnet | Agent infrastructure: .cursor/ MDC rules (game-architecture, coding-standards, no-go-list, docs-authoring), .claude/ (settings, hooks, rules), .github/ (copilot-instructions full rewrite, dependabot, issue templates, CD/release/release-please workflows, prompt files), CHANGELOG.md, release-please config |
| 2026-04-09 | claude-sonnet-4-6 | PR #1 review remediation — all 43 threads addressed and replied. Critical: fixed A/D strafing (right-left), made meltdown reachable (split heat from ore-gated grinding in OreSpawner), fixed terrain mesh/collider half-cell offset (size-1)/2. Major: true 10Hz chromatic aberration pulse, ore ejection idempotency guard (ejectionPendingRef), spatial audio routes through AudioEngine singleton, BootScreen blink interval scoped to powered_down phase + boot timeout cleanup. Minor: uHeat uniform clamped [0,1], ESC key-repeat guard, blur key latch clear, CanvasTexture dispose on unmount, phase enum comment fix, pnpm/npm command consistency, repo URL slug fix, MD022 heading spacing in docs, upgrades phase added to architecture diagram, useFrame store rule refined. Squash merged to main. |
| 2026-04-09 | claude-sonnet-4-6 | Stream A gameplay polish — implemented: tractor beam (spring joint + reel-in + throw + cyan Line), ore health + depletion shrink + destruction + InstancedRigidBodies debris + 15s respawn, rare isotopes (15% chance, magenta, 3× heat, $2500 cube value), sparks (physics bodies + TTL), hit-stop (50ms freeze on first grind), headlamp SpotLight with boot flicker, GlitchEffect during meltdown, HueSaturation grayscale during pause, CRT scanline+barrel shader (toggleable), isMelting chromAberr fix, official maath/random.inSphere, spatial audio (silo hum + thruster volume), framer-motion fade/slide on all overlay screens, settings back restores pointer lock. |
| 2026-04-10 | claude-sonnet-4-6 | PR #10 CodeRabbit CHANGES_REQUESTED remediation — AnimatePresence fix (conditional rendering at App.jsx level so exit animations fire), AmbientSpores maath import + pause guard, MeltdownScreen single motion wrapper, Silo useFrame phase guard, AudioEngine LFO ref stored for cleanup, Player thruster silence effect, SettingsMenu/MainMenu/UpgradesTerminal stale phase subscriptions removed. §5 checklist reconciled with §1 snapshot. |
