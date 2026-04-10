# Docs Extraction — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract every design, architecture, and gameplay decision from `docs/references/strategy_sessions.md` into the canonical domain documentation set — including Koota ECS + Zod as the canonical production architecture.

**Architecture:** Update existing domain docs in-place; create three new files. All docs must be self-contained enough that an agent starting fresh never needs to read `strategy_sessions.md`.

**Tech Stack:** Markdown with YAML frontmatter. No code changes — docs only. Commit after each task.

---

## File map

| Action | File | What changes |
|---|---|---|
| Create | `docs/architecture/decisions.md` | ADR collection for all pivotal choices |
| Create | `docs/design/mobile-controls.md` | Full mobile input spec |
| Create | `docs/gameplay/playtesting-notes.md` | Paper playtesting analysis |
| Update substantially | `docs/architecture/overview.md` | Koota ECS + Zod + Capacitor |
| Update substantially | `docs/architecture/runtime-systems.md` | Zod schema, react-spring, Koota/R3F binding |
| Update substantially | `docs/gameplay/loop-and-progression.md` | Rare isotopes, onboarding missions, contracts layer |
| Update substantially | `docs/design/visual-audio-direction.md` | Full design bible: fontography, cockpit layout, audio mixing |
| Update substantially | `docs/operations/roadmap.md` | M1–M6 milestone structure |
| Update | `AGENTS.md` | Tech stack table: Koota + Zod canonical, Zustand interim |
| Update | `docs/STANDARDS.md` | State management (Koota path), add §14 Zod rules, §15 mobile |
| Update | `docs/README.md` | Add new files to domain map |
| Create | `CHANGELOG.md` | From git log |

---

## Task 1: Create `docs/architecture/decisions.md`

**Files:**
- Create: `docs/architecture/decisions.md`

- [ ] **Step 1: Create the ADR file with all architecture decisions**

Write `docs/architecture/decisions.md` with this exact content:

```markdown
---
title: Architecture Decisions
doc_type: architecture
status: active
owner: engineering
last_updated: 2026-04-09
---

# Architecture Decisions

This file records every pivotal architectural decision made during the design and prototyping of OVERHEAT: Titan Extraction. Future agents must read this before proposing architectural changes.

---

## ADR-001: Physics engine — Rapier over Cannon.js

**Decision:** Use `@react-three/rapier` exclusively. Never use Cannon.js.

**Context:** V1–V3 used Cannon.js 0.6.2. Generating convex hulls for the Silo cylinder and ore debris caused thousands of `faceNormal` calculation errors (`Vec3(0,0,-1) looks like it points into the shape`), resulting in NaN vector propagation and a black WebGL screen crash. The error rate was unbounded — the browser became unresponsive.

**Consequence:** All colliders must use simple primitives (Ball, Cuboid, Heightfield). Convex hull colliders are banned on ore and any generated geometry. Rapier is written in Rust/WASM and is deterministically stable.

---

## ADR-002: Audio — Web Audio API over tune.js

**Decision:** Implement procedural audio using raw Web Audio API oscillators. Do not attempt to install tune.js.

**Context:** The original design prompt specified tune.js for microtonal/procedural soundscapes. tune.js is not available on npm. The `AudioEngine.js` singleton deliberately mirrors the tune.js conceptual API (microtonal pitch mapping, harmonic sell sounds, dissonant alarm sounds) using Web Audio primitives.

**Consequence:** `src/audio/AudioEngine.js` is the single audio authority. All sound design decisions (pitch, waveform, envelope) live there. No other audio library may be added.

---

## ADR-003: State management — Zustand (interim) → Koota ECS (canonical production target)

**Decision:** The canonical production architecture is **Koota ECS + Zod-validated JSON tunables**. The current implementation uses Zustand as an interim solution.

**Context (production audit, 2026):** Zustand works for the prototype but creates structural problems at scale:
- Tunables (heat rates, upgrade costs, ore density) are scattered in component code with no single validation point.
- There is no clear data/behavior separation — actions and state live in the same flat store.
- React re-render pressure from store subscriptions is a risk as game complexity grows.

**Koota ECS benefits:**
- Data-oriented: traits are pure data, systems are pure behavior.
- Easy serialization to/from Zod-validated JSON for tunables.
- Imperative `useFrame` access to world state without React subscription overhead.
- Clear entity lifecycle (spawn, update, destroy) for ore, debris, cubes, and audio emitters.

**Migration path:**
- M1: Koota integrated alongside Zustand. Phase state stays in Zustand (UI-driven).
- M2: Gameplay entities (ore, cubes, debris, heat, hopper) migrated to Koota traits.
- M3+: Zustand reduced to phase/settings/credits only; all simulation in Koota.

**Consequence:** Any new gameplay system (ore, debris, new entity type) is built as a Koota trait + system, not as Zustand state. The Zustand store is not extended beyond its current shape.

---

## ADR-004: 3D UI transitions — react-spring over framer-motion-3d

**Decision:** Use `react-spring` for 3D object transitions (FOV, silo beam intensity, cockpit panel open/close). Use `framer-motion` only for 2D HTML menu transitions.

**Context:** framer-motion-3d was considered but was effectively abandoned as a maintained 3D stack. react-spring integrates cleanly with R3F via `@react-spring/three` and does not conflict with the physics loop.

**Consequence:** `framer-motion` (already installed) handles HTML overlays. `react-spring` handles any 3D animated value. Do not install framer-motion-3d.

---

## ADR-005: UI — Diegetic cockpit over DOM overlays

**Decision:** All in-game information is rendered inside the 3D scene. HTML overlays are permitted only for boot, menus, pause, settings, report, and upgrade terminal screens (which pause the game world).

**Context:** The V4–V5 pivot eliminated floating HTML HUD elements. Dashboard data (heat, hopper, credits) is rendered to a `THREE.CanvasTexture` applied to the physical dashboard mesh. This is non-negotiable for the game's identity ("Diegetic Clarity" pillar).

**Consequence:** Never add `position: fixed` or `position: absolute` HTML elements for in-game state feedback. Crosshair, saw, and dashboard are all 3D objects.

---

## ADR-006: Mobile target — Capacitor shell

**Decision:** The production mobile release uses Capacitor to wrap the web build into native iOS and Android shells.

**Context (production audit, 2026):** The game is a mobile-first product. Capacitor provides:
- Native haptic feedback (`@capacitor/haptics`).
- Access to device filesystem for offline save data.
- `capacitor-sqlite` / `jeep-sqlite` + OPFS for cross-platform persistence.
- iOS App Store and Google Play distribution.

**Consequence:** All UI work must consider touch targets (minimum 44×44pt), safe area insets, and landscape-lock orientation. The web build must remain functional as a standalone browser target.

---

## ADR-007: Persistence — Zod-validated JSON config for all tunables

**Decision:** All gameplay tunables (heat rates, ore yield, upgrade costs, economy values) live in a single `src/config.json` validated at startup by a Zod schema in `src/config.ts`.

**Context (production audit, 2026):** Hardcoded constants scattered in component files prevent iteration on game feel without code changes. A validated config file enables:
- Hot-reload tuning during development.
- A/B testing different economy curves.
- Safe migration between schema versions (Zod parse with `.strict()` catches breaking changes).

**Consequence:** No magic numbers in component files. Constants must reference `gameConfig.*` paths from the validated schema. New tunables require a Zod schema addition before use.
```

- [ ] **Step 2: Commit**

```bash
git add docs/architecture/decisions.md
git commit -m "docs(architecture): add ADR collection — all pivotal design decisions"
```

---

## Task 2: Update `docs/architecture/overview.md` — Koota + Zod + Capacitor

**Files:**
- Modify: `docs/architecture/overview.md`

- [ ] **Step 1: Update the product shape table and add Koota + Capacitor**

Replace the `## Product shape` section with:

```markdown
## Product shape

| Axis | Current (interim) | Production target |
|---|---|---|
| Engine model | Browser WebGL via Vite + React | Capacitor shell (iOS/Android) + web fallback |
| Scene framework | React Three Fiber | React Three Fiber |
| Physics | Rapier only | Rapier only |
| State (simulation) | Zustand flat store | Koota ECS — traits + systems |
| State (UI/phase) | Zustand with persist | Zustand (phase, credits, settings) |
| Tunables | Hardcoded constants | Zod-validated `config.json` |
| UI model | Diegetic HUD in 3D, Html overlays for menus | Same + diegetic dashboard raycast interaction |
| Persistence | localStorage via Zustand persist | capacitor-sqlite (native) / sql.js+OPFS (web) |
| Presentation | First-person industrial mech cockpit on an alien mining world | Same |
```

- [ ] **Step 2: Add Koota ECS architecture section before "Where to go next"**

Append before the final `## Where to go next` section:

```markdown
## Koota ECS entity model (production target)

When Koota is integrated (M1+), the simulation layer uses traits and systems:

### Traits (data components)

| Trait | Fields | Used by |
|---|---|---|
| `MechStats` | `speed`, `dashMultiplier` | MovementSystem |
| `Heat` | `value: number`, `overheated: boolean` | HeatSystem, AudioSystem, VFXSystem |
| `Hopper` | `current: number`, `max: number` | GrindingSystem, CubeEjectionSystem |
| `Position` | `x, y, z` | All spatial systems |
| `Velocity` | `x, y, z` | MovementSystem |
| `Input` | `move: {x,y}`, `look: {x,y}`, `grind`, `dash`, `tractor` | MovementSystem, GrindingSystem |
| `OreNode` | `health`, `isRare`, `worldPos` | GrindingSystem |
| `Debris` | `type: 'ore'\|'cube'` | PhysicsSync |
| `Cube` | `isRare`, `value` | EconomySystem |
| `Silo` | `position` | EconomySystem |
| `AudioEmitter` | `type`, `positional: boolean` | AudioSystem |
| `VFXEmitter` | `type`, `ttl` | VFXSystem |
| `UIBinding` | `surfaceId` | DashboardSystem |

### Systems (behavior)

- `MovementSystem` — reads `Input`, writes `Velocity`, syncs to Rapier kinematic body
- `HeatSystem` — reads `Grinding` state, writes `Heat`, emits `MechOverheated` / `MechRecovered`
- `GrindingSystem` — proximity to `OreNode` → writes `Hopper`, calls `HeatSystem`
- `CubeEjectionSystem` — hopper full → spawns `Cube` entity with Rapier dynamic body
- `EconomySystem` — `Cube` enters silo sensor → awards credits, emits `CubeSold`
- `AudioSystem` — listens to world events, calls `audioManager` methods
- `VFXSystem` — manages particle/spark emitter TTL and spawn
- `PersistenceSystem` — on key events, snapshots non-ephemeral traits to SQLite/OPFS

### R3F binding pattern

R3F components are thin views over Koota entities:

```tsx
function MechRig({ entityId }: { entityId: string }) {
  const ref = useRef<THREE.Group>(null!)
  const world = useKootaWorld()

  useFrame((_, dt) => {
    const pos = world.getTrait(entityId, 'Position')
    if (!pos) return
    ref.current.position.set(pos.x, pos.y, pos.z)
  })

  return <group ref={ref}><Cockpit entityId={entityId} /></group>
}
```
```

- [ ] **Step 3: Commit**

```bash
git add docs/architecture/overview.md
git commit -m "docs(architecture): update overview — Koota ECS, Zod config, Capacitor target"
```

---

## Task 3: Update `docs/architecture/runtime-systems.md` — Zod schema + react-spring

**Files:**
- Modify: `docs/architecture/runtime-systems.md`

- [ ] **Step 1: Add Zod config system section after the State system section**

After `## State system`, insert:

```markdown
## Config system (production target — M1)

All tunables live in a single validated config. No magic numbers in components.

### Zod schema (`src/config.ts`)

```ts
import { z } from 'zod'

export const GameConfigSchema = z.object({
  mech: z.object({
    baseSpeed: z.number().default(8),
    dashMultiplier: z.number().default(2.5),
    heat: z.object({
      perSecondGrinding: z.number().default(15),
      overheatThreshold: z.number().default(100),
      meltdownThreshold: z.number().default(120),
      cooldownPerSecond: z.number().default(20),
      safeThreshold: z.number().default(20),
    }),
    hopper: z.object({
      baseCapacity: z.number().default(100),
      capacityPerUpgrade: z.number().default(100),
    }),
    grind: z.object({
      baseDps: z.number().default(50),
      powerPerUpgrade: z.number().default(0.5),
    }),
  }),
  ore: z.object({
    baseHealth: z.number().default(100),
    rareSpawnChance: z.number().default(0.15),
    rareHeatMultiplier: z.number().default(3),
    rareTimeMultiplier: z.number().default(3),
  }),
  economy: z.object({
    cubeValue: z.number().default(50),
    rareCubeValue: z.number().default(2500),
    upgradeCosts: z.object({
      cap: z.array(z.number()).default([100, 250, 500]),
      pow: z.array(z.number()).default([150, 300, 600]),
      cool: z.array(z.number()).default([200, 400, 800]),
    }),
  }),
  respawn: z.object({
    oreRespawnSeconds: z.number().default(15),
  }),
})

export type GameConfig = z.infer<typeof GameConfigSchema>

import rawConfig from './config.json'
export const gameConfig = GameConfigSchema.parse(rawConfig)
```

**Rule:** Components import `gameConfig.*` — never use inline numeric literals for tunable values.
```

- [ ] **Step 2: Update animation/transitions section**

Add after `## UI system`:

```markdown
## Animation system

### 2D UI transitions
`framer-motion` handles HTML overlay transitions (boot, menus, pause, settings, report). Use `AnimatePresence` + `motion.div` for phase-gated screens.

### 3D object transitions
`react-spring` (via `@react-spring/three`) handles 3D animated values:
- FOV interpolation during dash
- Silo beam intensity on cube sell
- Cockpit terminal panel open/close
- Headlamp intensity during boot flicker

**Do not use framer-motion-3d** — it is not maintained and conflicts with the R3F render loop.

Example pattern:
```tsx
import { useSpring, animated } from '@react-spring/three'

function SiloBeam({ active }: { active: boolean }) {
  const { intensity } = useSpring({ intensity: active ? 2.0 : 0.5, config: { tension: 120, friction: 14 } })
  return <animated.meshBasicMaterial opacity={intensity} transparent />
}
```
```

- [ ] **Step 3: Commit**

```bash
git add docs/architecture/runtime-systems.md
git commit -m "docs(architecture): add Zod config schema, react-spring animation pattern"
```

---

## Task 4: Update `docs/gameplay/loop-and-progression.md` — rare isotopes, onboarding, contracts

**Files:**
- Modify: `docs/gameplay/loop-and-progression.md`

- [ ] **Step 1: Add rare isotopes section**

After `## Heat model`, insert:

```markdown
## Rare isotope mechanic

15% of ore veins spawn as **Volatile Isotope** nodes (magenta, `color.oreRare = #ff00ff`).

| Property | Standard ore | Rare isotope |
|---|---|---|
| Visual | Cyan emissive | Magenta emissive |
| Grind time | Normal | 3× longer |
| Heat per second | 15 units/s | 45 units/s (3×) |
| Cube value | 50 credits | 2,500 credits |
| Cube appearance | Cyan compressed cube | Magenta volatile cube |

**Design intent:** Rare isotopes are high-risk, high-reward nodes. A skilled pilot manages heat precisely enough to exploit them. A reckless pilot overheats and melts down.

**Risk note:** Isotope cubes that collide with the player while overheated push heat past 120 (meltdown trigger).
```

- [ ] **Step 2: Add onboarding missions section**

After `## Planned flow upgrades`, insert:

```markdown
## Onboarding mission sequence

Staged introduction of mechanics. Each mission is a discrete play session with limited scope.

### Mission 0: Boot Sequence
- Static cockpit, no movement allowed.
- Teaches: how to look around, how to read the dashboard, the heat bar concept.
- No ore, no saw interaction.
- Win: player clicks "INITIATE EXTRACTION" on the dashboard.

### Mission 1: First Grind
- Limited crater area, exactly one standard ore vein.
- No rare isotopes in this mission.
- Overheat threshold is forgiving (heat rises at 50% normal rate).
- Teaches: movement, proximity grind, heat warning, forced cooling.
- Win: fill hopper and eject one cube.

### Mission 2: Cube & Silo
- Standard heat rates, two ore veins (one rare isotope possible).
- Tractor beam is available (tutorial prompt on cube ejection).
- Teaches: tractor beam grab, reel-in, throw, silo interaction.
- Win: sell one cube for credits.

### Mission 3: Upgrades
- Full heat rates, three ore veins.
- Enough credits start-granted for exactly one upgrade.
- Teaches: OS terminal navigation, upgrade selection, capacity/power/cooling tradeoff.
- Win: purchase one upgrade and complete a full harvest cycle with it active.

### Post-onboarding: Free play
All mechanics unlocked. Rare isotopes, full heat model, and economy progression active.
```

- [ ] **Step 3: Add contracts/missions metagame section**

After `## Design note`, insert:

```markdown
## Metagame: Contracts and meta-progression (M5)

The extraction loop gains macro structure via contracts:

### Contract examples
- "Deliver 5 rare cubes in 5 minutes" — rewards patience and heat management
- "Maintain heat below 60% for an entire extraction run" — rewards discipline
- "Sell 10 cubes without a meltdown" — rewards consistency

### Meta-progression layers (planned)
- **Permanent chassis upgrades** — cross-session mech improvements beyond the 3 upgrade tracks
- **Cosmetic cockpit skins** — visual customization via contract rewards
- **Environmental variants** — dust storms, lighting changes, crater layouts

### Playtesting friction points (from paper playtesting analysis)
- **Heat pacing:** if heat rises too fast, new players feel punished; if too slow, the mechanic loses tension. Target: ~90 seconds of normal grinding before first overheat with base stats.
- **Throw precision on mobile:** flick-based throwing needs aim assist / magnetism near the silo beam. Threshold: if cube trajectory passes within 3 units of silo center, apply gentle attraction.
- **Visual overload:** sparks + spores + bloom + cockpit UI can clutter small screens. Solution: reduce particle counts by 50% when `settings.reducedEffects` is enabled.
- **Economy opacity:** players must understand why rare cubes are worth more. The rare isotope's magenta color and the "VOLATILE ISOTOPE DETECTED" dashboard warning must be unmissable.
```

- [ ] **Step 4: Commit**

```bash
git add docs/gameplay/loop-and-progression.md
git commit -m "docs(gameplay): add rare isotopes mechanic, onboarding missions, contracts layer, playtesting notes"
```

---

## Task 5: Create `docs/gameplay/playtesting-notes.md`

**Files:**
- Create: `docs/gameplay/playtesting-notes.md`

- [ ] **Step 1: Create the file**

```markdown
---
title: Playtesting Notes
doc_type: gameplay
status: active
owner: design
last_updated: 2026-04-09
---

# Playtesting Notes

Paper playtesting analysis from the 2026 production audit. Use these findings when tuning mechanics or making UX decisions.

## Core loop walk-through

1. Spawn in cockpit. See dashboard. Saw idling.
2. Move toward glowing ore vein.
3. Grind: camera shakes, sparks fly, heat rises, hopper fills.
4. Overheat tension: push too long → tools lock, alarms blare, forced retreat and cool-down.
5. Cube ejection: hopper full → compressed cube pops out of mech base.
6. Tractor beam: grab cube, reel in, flick toward silo.
7. Sell: cube enters silo beam → credit chime, credits increment on dashboard.
8. Upgrade: return to OS terminal. Repeat with higher stakes.

## Identified friction points

### Heat pacing
- **Risk:** Too fast → new players feel punished before understanding the mechanic. Too slow → alarm state loses teeth.
- **Target:** ~90 seconds of grinding at base stats before first overheat.
- **Tuning lever:** `config.mech.heat.perSecondGrinding` (default: 15). Start playtests at 10 and increase until the first overheat feels like a close call, not a surprise.

### Throw precision (mobile)
- **Risk:** Flick-based throwing with thumbs is imprecise. Players miss the silo repeatedly → frustration.
- **Solution:** Apply gentle silo-beam magnetic attraction when cube trajectory passes within 3 units of beam center. Do not auto-score; preserve the satisfaction of a good throw.
- **Implementation note:** check post-throw cube linvel and apply a small lateral impulse toward beam center each physics frame while cube is airborne and within attraction range.

### Visual overload
- **Risk:** Sparks + spores + bloom + cockpit UI simultaneously overwhelm small screens, especially during overheat.
- **Solution:** `settings.reducedEffects` (bool) halves particle counts for AmbientSpores and Spark emitter; reduces bloom intensity by 30%.
- **Priority:** Ship with reduced-effects toggle before adding more VFX.

### Economy opacity
- **Risk:** Players don't understand why some cubes are worth 50 credits and others 2,500. They treat all cubes equally → misses the rare isotope risk/reward entirely.
- **Solutions:**
  - Distinct magenta visual on rare ore (already in palette).
  - Dashboard warning text: "VOLATILE ISOTOPE DETECTED" in `color.oreRare` when grinding a rare node.
  - Cube itself should visually differ: rare cube has brighter magenta emissive + faster rotation.
  - Credit chime on sell uses a different note (consonant triad) for rare cubes vs a simple blip for standard.

## Opportunities for deeper engagement

- **Contracts** — give each extraction run a secondary objective with bonus rewards.
- **Environmental variation** — dust storms (reduced visibility), electrical interference (HUD flicker), cold zones (slower heat build).
- **Leaderboards** — credits earned in a session; rarest cube value sold.
```

- [ ] **Step 2: Add to `docs/README.md` domain map**

Add a row to the domain map table in `docs/README.md`:

```markdown
| Gameplay | [`gameplay/playtesting-notes.md`](./gameplay/playtesting-notes.md) | Paper playtesting analysis and friction point catalogue |
```

- [ ] **Step 3: Commit**

```bash
git add docs/gameplay/playtesting-notes.md docs/README.md
git commit -m "docs(gameplay): add playtesting notes — friction points and engagement opportunities"
```

---

## Task 6: Update `docs/design/visual-audio-direction.md` — full design bible

**Files:**
- Modify: `docs/design/visual-audio-direction.md`

- [ ] **Step 1: Add creative pillars section at the top (after frontmatter)**

After the `# Visual and Audio Direction` heading, insert before `## Visual promise`:

```markdown
## Creative pillars

These five pillars define every visual, audio, and UX decision. When in doubt, evaluate against them.

1. **Industrial Gravitas** — everything feels heavy, dangerous, and engineered. Nothing is smooth, clean, or consumer-grade.
2. **Diegetic Clarity** — all critical information is physically present in the cockpit. The pilot reads instruments, not overlays.
3. **Risk Through Heat** — heat is the heartbeat of the game. Every visual and audio cue escalates toward a breaking point.
4. **Tactile Physics** — the world is solid. Cubes, debris, and ore behave believably. The tractor beam feels elastic and heavy.
5. **Alien Familiarity** — the world feels alien but readable. Visual noise must never obscure gameplay-critical information.
```

- [ ] **Step 2: Add full fontography section**

After `## Visual language`, insert:

```markdown
## Fontography

### Typeface direction
Primary cockpit font: a condensed, monospaced or semi-monospaced industrial typeface. Target aesthetic: **IBM Plex Mono** or **JetBrains Mono**. The system `bold monospace` stack is acceptable for the CanvasTexture dashboard and is currently in use.

### Type hierarchy

| Level | Size | Weight | Usage |
|---|---|---|---|
| H1 — Big readouts | 48–64px (scaled to device DPI) | Bold | Credits total, major warnings ("OVERHEAT") |
| H2 — Subsystem labels | 24–32px | Medium | "HOPPER", "HEAT", "COOLANT" |
| Body / Microcopy | 14–18px | Regular | Upgrade descriptions, terminal prompts |

### Typography rules
- **All caps** for all dashboard labels.
- **Monospaced digits** for all readouts (heat %, credits, capacity) to prevent layout shift as values update.
- **No italics** — use color and size for emphasis, never italic weight.
- Letter spacing: `0.15em–0.3em` on HTML overlay menus for retro terminal aesthetic.
- No serif or sans-serif fonts anywhere in the game.

### Dashboard canvas current sizes (in use)
- Header labels: `bold 36px monospace`
- Credits display: `bold 56px monospace`
- Warning text: `bold 32px monospace`, centered
```

- [ ] **Step 3: Add cockpit layout spec section**

After `## Camera feel`, insert:

```markdown
## Cockpit composition

### Spatial layout
- **Top frame:** canopy arch, structural pillars, tinted glass that catches alien sunlight.
- **Center viewport:** primary view of terrain, ore veins, and silo. No UI elements here.
- **Bottom dashboard:** the instrument cluster.

### Dashboard instrument layout

```
┌─────────────────────────────────────────────────────────────┐
│  LEFT ZONE           CENTER ZONE          RIGHT ZONE         │
│  ─────────────       ─────────────────    ─────────────────  │
│  [HOPPER ██████]     [HEAT ██░░░░░░░░]   [$ CREDITS]        │
│  Label + bar         Label + bar + alert  Value + mission    │
└─────────────────────────────────────────────────────────────┘
```

- **Left:** Hopper capacity bar + percentage label. Turns amber at 100% (cube ready to eject).
- **Center:** Heat bar + percentage. Shifts orange → red as heat climbs. "OVERHEAT" warning text blinks at 100.
- **Right:** Credits total (large, amber). Mission objective or contract status below.

### UI principles
- **No floating HUD** — everything anchored to cockpit geometry.
- **Color + motion for alerts** — heat bar pulses and shifts hue; cockpit LEDs flicker during overheat.
- **Minimal text during action** — use bars and icons; reserve text for terminal screens and upgrade menus.
- **Industrial OS voice** — terse, all-caps, bracket-delimited. `[ NEW EXCAVATION ]` not `Start Game`.

### Accent colors
- `#4A6FFF` — cool cockpit LED strips (status lights, idle indicator rings). Complements the cyan ore glow.
```

- [ ] **Step 4: Expand audio section**

Replace `## Audio direction` with:

```markdown
## Audio direction

The audio is not orchestral. It is procedural, dissonant, industrial, and pressure-driven.

### Sound event table

| Event | Waveform | Pitch | Mood |
|---|---|---|---|
| Boot | Sine sweep | 110Hz → 880Hz over 1.5s | Machine waking up |
| Grinding (base) | Sawtooth | 80Hz + heatPct×2 | Abrasive industrial bite |
| Grinding (hot) | Sawtooth + noise | Rising with heat | Danger, urgency |
| Mech step | Sine pulse | ~60Hz, short decay | Massive weight |
| Sell (standard) | Pure sine blip | 1200Hz, very short | Clean reward |
| Sell (rare isotope) | Consonant triad | Major third, 800Hz | Rare success |
| Overheat alarm | Square wave | 880Hz / 660Hz alternating, 250ms | Machine panic |
| Meltdown | Square wave | 440Hz → 0Hz, 2s ramp | Catastrophic failure |
| UI blip | Sine | 600Hz, 50ms | System acknowledge |
| Cube eject | Thud + click | 120Hz + 2kHz transient | Physical ejection |

### Soundscape layers
1. **Player feedback** (highest priority) — grinding, overheat alarm, cube ejection, sell chime.
2. **Mech ambience** — distant metallic mech frame creaks, low mechanical hum.
3. **Environment** — wind through craters, distant alien atmosphere rumble.
4. **Silo** — low positional hum from the silo beam (`THREE.PositionalAudio`, ~60Hz sine).

### Mixing rules
- **Dynamic ducking:** when overheat alarm plays, attenuate ambience layers by -12dB.
- **Grinding masks environment:** once grinding starts, ambient layer fades to -6dB.
- **Pause low-pass filter:** on ESC, animate BiquadFilter cutoff from 20kHz → 300Hz (muffling effect). Reverse on resume.
- **Master gain:** controlled by `settings.masterVolume`. Applied at the AudioEngine's master gain node.

### Spatial audio (planned — M4)
- Silo hum: `THREE.PositionalAudio` on silo mesh. Volume falls off with inverse-square law as player moves away.
- Dash thrusters: volume mapped to `bodyRef.current.linvel()` magnitude / `DASH_SPEED`.
- Hit-stop: on first ore contact, pause `useFrame` delta application for 50ms (kinesthetic impact).
```

- [ ] **Step 5: Add motion and game feel section**

After `## Shader direction`, insert:

```markdown
## Motion and game feel

### Camera
- **Head-bob:** subtle `sin(time * frequency) * amplitude` offset on camera.position.y while moving. Amplitude ≈ 0.015, frequency ≈ 1.8 Hz. Stops immediately when movement stops.
- **Grind shake:** random `(Math.random() - 0.5) * (heat/100) * 0.03` offset on all axes per frame.
- **Dash FOV:** interpolate to `fov=100` during dash, back to `fov=75` at rest. Use `react-spring` or `camera.fov += (target - camera.fov) * delta * 6`.
- **Meltdown ejection:** camera rapidly lerps straight up into the sky (simulating pilot ejection from doomed mech). Use a smooth cubic easing, not linear.

### Saw blade
- **Idle:** slow rotation, low hum. `uHeat = 0.0`.
- **Active grind:** faster spin rate. `uHeat` increases toward 1.0. Sparks emit.
- **Overheat:** saw jitters (random rotation delta noise). `uHeat = 1.0`. Steam VFX emit. Blade visually locked but still glowing.

### Transitions (react-spring)
- FOV changes during dash.
- Cockpit OS terminal panel open/close (y-translate + scale).
- Silo beam intensity on cube sell (brightness spike + fade).
- All transitions: `tension: 120, friction: 14` as default spring config.
```

- [ ] **Step 6: Commit**

```bash
git add docs/design/visual-audio-direction.md
git commit -m "docs(design): full design bible — pillars, fontography, cockpit layout, audio mixing, motion"
```

---

## Task 7: Create `docs/design/mobile-controls.md`

**Files:**
- Create: `docs/design/mobile-controls.md`

- [ ] **Step 1: Create the file**

```markdown
---
title: Mobile Controls
doc_type: design
status: active
owner: design
last_updated: 2026-04-09
---

# Mobile Controls

This document specifies the touch control system for the Capacitor mobile build (M3). All control decisions must work on screens ≥ 5 inches in landscape orientation.

## Input abstraction layer

All platform inputs (touch, keyboard/mouse, gamepad) normalize to a single `InputState`:

```ts
type InputState = {
  move: { x: number; y: number }   // -1 to 1, XZ plane
  look: { x: number; y: number }   // -1 to 1, yaw + pitch
  grind: boolean
  dash: boolean
  tractor: boolean
}
```

The Koota `Input` trait holds this state. Systems consume it — they never read raw touch events directly.

## Virtual joystick layout (landscape)

```
┌──────────────────────────────────────────────────────────────────┐
│   [PAUSE]                                              [PAUSE]   │
│                                                                  │
│                       [ 3D VIEWPORT ]                            │
│                                                                  │
│  ┌─────────┐                               ┌─────────┐          │
│  │  MOVE   │                               │  LOOK   │          │
│  │  LEFT   │                               │  RIGHT  │   [DASH] │
│  │ JOYSTICK│                               │ JOYSTICK│ [TRACTOR] │
│  └─────────┘                               └─────────┘  [GRIND]  │
└──────────────────────────────────────────────────────────────────┘
```

### Left joystick — movement
- Controls `move.x` (strafe) and `move.y` (forward/back).
- Dynamic origin: joystick center snaps to where the thumb first touches the left 40% of screen.
- Dead zone: radius 8px — inputs within this zone produce `0`.
- Max radius: 60px from dynamic origin.

### Right joystick — camera aim
- Controls `look.x` (yaw) and `look.y` (pitch).
- Dynamic origin: snaps to where the right thumb first touches the right 40% of screen.
- Same dead zone and max radius as left joystick.
- Sensitivity: `settings.lookSensitivity` multiplier applied to delta.

### Action buttons (right side)
| Button | Input | Style |
|---|---|---|
| `GRIND` | Hold to activate | Large, circular, bottom-right |
| `TRACTOR` | Hold to activate | Medium, above GRIND |
| `DASH` | Tap (not hold) | Medium, above TRACTOR |

## Haptic feedback triggers

Requires `@capacitor/haptics`. All haptics are `HapticsImpactStyle.Medium` unless noted.

| Event | Haptic style | Notes |
|---|---|---|
| Overheat alarm | `Heavy` + repeat every 500ms while overheated | Most important haptic — danger signal |
| Cube ejection | `Heavy` single pulse | Satisfying physical event |
| Cube sold at silo | `Light` single pulse | Reward feedback |
| Upgrade purchased | `Medium` single pulse | Transaction confirmation |
| Meltdown | `Heavy` vibrate, 1s | Terminal failure signal |

## Touch target sizes

All interactive elements: minimum **44×44pt** (Apple HIG standard, also appropriate for Android).
- Joystick activation zones are large by design (40% of screen width).
- Action buttons: minimum 60×60pt.
- Pause button: 44×44pt, top corner, out of thumb reach during play.

## Silo aim assist

To compensate for imprecise flick throws:
- When a cube is airborne (not held by tractor beam) and within 20 units of the silo:
- Each physics frame, apply a small lateral impulse: `siloDir.sub(cubePos).normalize().multiplyScalar(0.5)`.
- Only apply if cube is moving generally toward the silo (dot product of velocity and siloDir > 0).
- This is gentle attraction, not auto-score.

## Safe area insets

Wrap all overlay UI elements in CSS `env(safe-area-inset-*)` padding on iOS:

```css
.pause-button {
  top: max(12px, env(safe-area-inset-top));
  right: max(12px, env(safe-area-inset-right));
}
```

## Orientation

Lock to landscape. Declare in Capacitor config:
```json
{
  "plugins": {
    "ScreenOrientation": {
      "orientation": "landscape"
    }
  }
}
```
```

- [ ] **Step 2: Add to `docs/README.md` domain map**

Add a row to the domain map table:

```markdown
| Design | [`design/mobile-controls.md`](./design/mobile-controls.md) | Touch input spec: joysticks, haptics, aim assist, safe areas |
```

- [ ] **Step 3: Commit**

```bash
git add docs/design/mobile-controls.md docs/README.md
git commit -m "docs(design): add mobile controls spec — joysticks, haptics, silo aim assist"
```

---

## Task 8: Update `docs/operations/roadmap.md` — M1–M6 milestones

**Files:**
- Modify: `docs/operations/roadmap.md`

- [ ] **Step 1: Replace the file content**

```markdown
---
title: Delivery Roadmap
doc_type: operations
status: active
owner: engineering
last_updated: 2026-04-09
---

# Delivery Roadmap

This document defines the milestone structure for shipping OVERHEAT: Titan Extraction to mobile and browser. `HANDOFF.md` is the live status file; this document defines the stable macro-structure and sequencing rationale.

## Milestone overview

| Milestone | Goal | Key deliverable |
|---|---|---|
| M1 — Core Architecture | Production-grade foundation | Koota ECS integrated, Zod config, stable Rapier, basic scene |
| M2 — Core Loop Complete | The game loop is fully physical | Tractor beam, ore destruction, full economy cycle, upgrades |
| M3 — Mobile + Capacitor | Playable on iOS and Android | Virtual joysticks, Capacitor shell, SQLite/OPFS persistence |
| M4 — Visual & Audio Polish | Feels like a finished game | Final cockpit art, VFX, spatial audio, haptics, a11y |
| M5 — Content & Progression | Sessions have goals | Contracts, meta-progression, difficulty tuning |
| M6 — Telemetry & Balancing | Data-driven iteration | Event logging, A/B tests on tunables, final balance pass |

---

## M1 — Core Architecture

**Goal:** Establish the production-ready simulation foundation before adding more gameplay.

**Work:**
- Integrate Koota ECS alongside current Zustand store.
- Create `src/config.ts` with Zod schema and `src/config.json` with default values.
- Replace all hardcoded numeric constants in components with `gameConfig.*` references.
- Verify Rapier heightfield terrain is stable across devices.
- Implement `react-spring` for dash FOV and boot headlamp flicker.

**Primary docs:** `architecture/overview.md`, `architecture/decisions.md`, `architecture/runtime-systems.md`

---

## M2 — Core Loop Complete

**Goal:** Every element of the designed gameplay loop is physically implemented.

**Work (in priority order):**
1. Tractor beam — spring joint anchor, reel-in, throw velocity
2. Ore health, destruction, and debris chunks
3. Cube cleanup lifecycle (sell → destroy rigid body)
4. Settings back-navigation (settings → correct parent state)
5. Headlamp spotlight + boot flicker
6. Grind sparks emitter
7. Pause grayscale pass (HueSaturation effect)
8. Meltdown glitch shader pass

**Primary docs:** `HANDOFF.md`, `gameplay/loop-and-progression.md`, `STANDARDS.md`

---

## M3 — Mobile + Capacitor

**Goal:** The game runs on iOS and Android phones in landscape orientation.

**Work:**
- Add Capacitor shell (`ionic capacitor add ios`, `ionic capacitor add android`).
- Implement virtual joystick input layer (left move, right look, action buttons).
- Wire `@capacitor/haptics` to overheat, eject, sell, and meltdown events.
- Implement `capacitor-sqlite` (native) + `jeep-sqlite`/OPFS (web) persistence layer.
- Replace Zustand `persist` with new persistence layer for credits, upgrades, settings.
- Apply CSS safe-area insets to all overlays.
- Lock screen orientation to landscape.
- Performance audit: target 60fps on a mid-range phone (Snapdragon 778G class).

**Primary docs:** `design/mobile-controls.md`, `architecture/decisions.md`

---

## M4 — Visual & Audio Polish

**Goal:** The game looks and sounds like a finished product.

**Work:**
- Final cockpit art pass (structural pillar detail, canopy tint, ambient LED strips).
- Complete the rare isotope magenta cube visual + "VOLATILE ISOTOPE DETECTED" dashboard warning.
- Implement `THREE.PositionalAudio` on the silo mesh (low hum).
- Dash thruster volume mapped to `linvel()` magnitude.
- CRT scanline + barrel distortion shader (conditionally on `settings.crtOverlays`).
- framer-motion `AnimatePresence` transitions on all HTML overlay menus.
- Accessibility: confirm all overlay menus are keyboard-navigable.
- Reduced effects mode (`settings.reducedEffects`) for lower-end devices.

**Primary docs:** `design/visual-audio-direction.md`, `STANDARDS.md`

---

## M5 — Content & Progression

**Goal:** Individual sessions have goals beyond pure grinding.

**Work:**
- Design and implement contracts system (3 contract types: delivery, heat discipline, consistency).
- Meta-progression layer: permanent chassis upgrades via contract rewards.
- Implement onboarding missions 0–3 as gated early-game sessions.
- Environmental variation: dust storm event (reduced visibility, camera vignette increase).
- Economy tuning: validate that 5 standard cubes ≈ 1 minor upgrade cost feels rewarding.

**Primary docs:** `gameplay/loop-and-progression.md`, `gameplay/playtesting-notes.md`

---

## M6 — Telemetry & Balancing

**Goal:** Use data to remove friction and improve retention.

**Work:**
- Implement event logging: heat spike events, meltdown triggers, session length, credits earned/spent.
- Export events to a lightweight analytics endpoint (or local file for personal builds).
- Run A/B test on heat rate (12 vs 15 units/s) across 10+ sessions.
- Run A/B test on cube sell value (50 vs 75 credits standard) for pacing feel.
- Final economy balance pass: ensure upgrade cost curve produces interesting decisions at each level.

**Primary docs:** `operations/roadmap.md` (this file), `gameplay/playtesting-notes.md`

---

## Documentation maintenance

- When a milestone lands, update `HANDOFF.md` first (mark items complete, update known issues).
- If the change introduces a new permanent convention, update `STANDARDS.md`.
- If intent or structure changes, update the relevant domain doc and `docs/README.md`.
- Keep domain docs stable; keep `HANDOFF.md` volatile.
- After each M-level milestone ships, update this roadmap to reflect actual vs planned.
```

- [ ] **Step 2: Commit**

```bash
git add docs/operations/roadmap.md
git commit -m "docs(operations): replace vague workstreams with M1–M6 milestone structure"
```

---

## Task 9: Update `AGENTS.md` — tech stack, Koota canonical

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Update §3 tech stack table**

Replace the table in `## 3. Tech stack (locked — do not change)` with:

```markdown
## 3. Tech stack

| Concern | Library | Status | Why it was chosen |
|---|---|---|---|
| Rendering | `three` + `@react-three/fiber` | Locked | Industry standard R3F |
| Physics | `@react-three/rapier` | Locked | Rapier (Rust) — Cannon.js was abandoned after Vec3 NaN crashes |
| State (UI/phase) | `zustand` + `persist` | Interim | Zero re-render spam; components subscribe to slices only |
| State (simulation) | `koota` (ECS) | Canonical target (M1+) | Data-oriented; traits + systems separate data from behavior |
| Tunables | `zod` + `src/config.json` | Canonical target (M1) | Single validated config for all numeric game constants |
| Post-FX | `@react-three/postprocessing` + `postprocessing` | Locked | Batches all passes into one shader |
| Helpers | `@react-three/drei` | Locked | Cameras, shaderMaterial, Html, Points, Stars |
| Noise | `simplex-noise` | Locked | Organic alien terrain; replaces Math.sin grid ripples |
| Particles | `maath` | Locked | `maath/random` for Float32Array sphere distributions |
| Animation (2D) | `framer-motion` | Locked | HTML overlay transitions; menu AnimatePresence |
| Animation (3D) | `react-spring` / `@react-spring/three` | Canonical target (M1+) | FOV, silo beam, terminal transitions — framer-motion-3d is abandoned |
| Audio | Custom `AudioEngine` (Web Audio API) | Locked | tune.js is not on npm; we replicate its microtonal intent procedurally |
| Mobile shell | Capacitor (M3) | Planned | iOS/Android; haptics, filesystem, SQLite persistence |
| Persistence | capacitor-sqlite + jeep-sqlite/OPFS | Planned M3 | Cross-platform save data beyond localStorage |

> **Never introduce:** Cannon.js, React Context for the game loop, HTML DOM overlays for in-game HUD, Redux, MobX, framer-motion-3d, or any additional physics engine.
>
> **Zustand note:** The current implementation uses Zustand exclusively. New gameplay entity systems (ore, cubes, debris, audio emitters) should be designed as Koota traits, not Zustand state, to align with the M1+ migration target. See `docs/architecture/decisions.md ADR-003`.
```

- [ ] **Step 2: Update §11 handoff notes to reference new docs**

In `## 11. Session handoff protocol`, after the existing list, add:

```markdown
5. If you added a new architectural pattern or made a tech decision, record it in `docs/architecture/decisions.md`.
6. If you touched gameplay tuning values, confirm they are in `src/config.json` (not hardcoded) — or create the config if M1 is underway.
```

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs(agents): update tech stack — Koota canonical, Zustand interim, react-spring, Capacitor"
```

---

## Task 10: Update `docs/STANDARDS.md` — Koota section, Zod rules, mobile section

**Files:**
- Modify: `docs/STANDARDS.md`

- [ ] **Step 1: Update §6 state management**

Replace the content under `## 6. State management patterns`:

```markdown
## 6. State management patterns

### Current implementation: Zustand
`src/store.js` is the single source of truth for phase, economy, settings, and upgrades. Components subscribe to narrow slices:

```js
// ✅ Correct — subscribe to a slice
const heat = useGameStore((s) => s.heat)

// ❌ Wrong — subscribes to entire store
const store = useGameStore()
```

### Production target: Koota ECS (M1+)
New gameplay entity systems (ore, cubes, debris) are built as Koota traits + systems, not as Zustand state.

```ts
// ✅ Koota pattern — query entities with matching traits
const grinding = world.query(['Heat', 'Grinding'])
grinding.forEach(entity => {
  const heat = entity.get<Heat>('Heat')
  heat.value += gameConfig.mech.heat.perSecondGrinding * dt
})

// ❌ Do not add new gameplay simulation to Zustand
set((s) => ({ someNewSimState: ... }))  // wrong for M1+
```

### Action naming convention (Zustand — current)
- `set*` — simple boolean/string phase changes (`setPhase`, `setPaused`)
- `add*` — additive operations that clamp to limits (`addOre`, `addHeat`, `addCredits`)
- `coolDown` — inverse additive with state transition side-effect
- `buy*` — transactional (debit credits, apply upgrade)
- `trigger*` — initiates a dramatic state transition (`triggerMeltdown`)
- `reset*` — full or partial state reset (`resetSession`)

### Persist middleware (Zustand — current)
Persisted keys (saved to `localStorage` key `overheat-titan-storage`):
- `credits`, `upgrades`, `settings`

Never persist: `heat`, `rawOre`, `phase`, `isPaused`, `isMelting`, `sessionCredits` — session-only.

> **M3 note:** When Capacitor persistence lands, Zustand persist is replaced by the `capacitor-sqlite` / `jeep-sqlite` + OPFS layer. Credits, upgrades, and settings snapshot to SQLite on key events.
```

- [ ] **Step 2: Add §14 Zod config rules**

Append at end of file:

```markdown
---

## 14. Config and tunables

All numeric gameplay constants belong in `src/config.json`. No magic numbers in component files.

### Config access pattern
```ts
import { gameConfig } from '../config'

// ✅ Reference config
const heatPerFrame = gameConfig.mech.heat.perSecondGrinding * delta

// ❌ Inline constant
const heatPerFrame = 15 * delta
```

### Adding a new tunable
1. Add the field to the Zod schema in `src/config.ts`.
2. Add the default value to `src/config.json`.
3. Reference it via `gameConfig.*` in component code.
4. Never hardcode the value anywhere else.

### Config schema enforcement
The `GameConfigSchema` uses `.strict()` — any unrecognized key in `config.json` throws at startup. This prevents silent config drift.

---

## 15. Mobile and Capacitor

### Touch targets
All interactive touch elements: minimum **44×44pt**. Do not rely on hover states.

### Safe area insets
All HTML overlay elements use `env(safe-area-inset-*)` padding:
```css
.menu-panel { padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }
```

### Haptics
All haptic triggers go through `@capacitor/haptics`. Never vibrate the device directly. Guard with a platform check:
```ts
import { Haptics, ImpactStyle } from '@capacitor/haptics'
await Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}) // noop on web
```

### Performance floor (mobile)
- Target: 60fps on Snapdragon 778G class device.
- `InstancedRigidBodies` required when debris chunk count > 20.
- `settings.reducedEffects` halves particle counts and reduces bloom intensity.
- Never add `castShadow` to dynamic objects on mobile builds.
```

- [ ] **Step 3: Commit**

```bash
git add docs/STANDARDS.md
git commit -m "docs(standards): Koota ECS pattern, Zod config rules, mobile/Capacitor section"
```

---

## Task 11: Create `CHANGELOG.md`

**Files:**
- Create: `CHANGELOG.md`

- [ ] **Step 1: Generate from git log**

```bash
cd /path/to/overheat-titan-extract
git log --oneline --reverse
```

- [ ] **Step 2: Write `CHANGELOG.md` from the log output**

Use Keep a Changelog 1.1.0 format. Example structure (fill in from actual log):

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Comprehensive documentation set: AGENTS.md, CLAUDE.md, HANDOFF.md, STANDARDS.md
- Domain-organized docs directory with architecture, gameplay, design, lore, and operations
- Architecture Decision Records (decisions.md)
- Mobile controls specification
- Playtesting notes
- M1–M6 milestone roadmap
- .claude/ agent infrastructure (hooks, rules, settings)
- .cursor/ rules for Cursor agent
- GitHub Copilot expanded configuration

## [1.0.0] - 2026-04-09

### Added
- Initial project scaffold: Vite + React + React Three Fiber
- Zustand store with persist middleware (credits, upgrades, settings)
- Web Audio API engine (AudioEngine.js singleton)
- Simplex-noise terrain with Rapier HeightfieldCollider
- Ambient spores particle system
- Environment: lighting, fog, stars
- Player: dynamic RigidBody, WASD movement, mouse-look, dash, camera shake
- Diegetic dashboard (CanvasTexture HUD)
- MoltenSaw custom GLSL shaderMaterial with uHeat/uTime uniforms
- Cockpit assembly
- Ore veins: static RigidBodies with proximity grind
- Cube ejection on hopper full
- Silo: base mesh + beam + sell sensor (onIntersectionEnter)
- Post-processing: Bloom + ChromaticAberration + Vignette (heat-reactive)
- Boot sequence (powered_down → boot → menu phase flow)
- Main menu (Html overlay)
- Pause / Diagnostics mode (ESC)
- Settings menu (volume, sensitivity, CRT toggle)
- Meltdown at heat 120 + report screen
- Upgrades terminal (cap / pow / cool tracks)
- GitHub Actions CI (Biome lint + Vite build)

### Fixed
- Physics engine: migrated from Cannon.js to Rapier — eliminated Vec3 NaN crash
- Perspective: corrected cockpit/saw placement for true 2.5D diegetic view
```

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: add CHANGELOG.md from project history"
```

---

## Task 12: Update `docs/README.md` — finalize domain map

**Files:**
- Modify: `docs/README.md`

- [ ] **Step 1: Add all new files to the domain map**

Ensure the table includes:

```markdown
| Architecture | [`architecture/decisions.md`](./architecture/decisions.md) | Architecture Decision Records — pivotal choices and rationale |
| Design | [`design/mobile-controls.md`](./design/mobile-controls.md) | Touch input spec: joysticks, haptics, aim assist, safe areas |
| Gameplay | [`gameplay/playtesting-notes.md`](./gameplay/playtesting-notes.md) | Paper playtesting analysis and friction point catalogue |
```

- [ ] **Step 2: Add reading paths for new task types**

Add to `## Suggested reading by task`:

```markdown
### If you are implementing mobile/Capacitor features
- `design/mobile-controls.md`
- `architecture/decisions.md` (ADR-006)
- `HANDOFF.md`

### If you are implementing the Koota ECS migration
- `architecture/decisions.md` (ADR-003, ADR-007)
- `architecture/overview.md`
- `architecture/runtime-systems.md`
```

- [ ] **Step 3: Final commit**

```bash
git add docs/README.md
git commit -m "docs(index): add new domain docs to map, expand suggested reading paths"
```
