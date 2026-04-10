# Copilot Instructions — OVERHEAT: Titan Extraction

You are a GitHub Copilot Coding Agent working on **OVERHEAT: Titan Extraction** — a browser-based
WebGL extraction/physics sandbox game. A mining mech operator extracts ore from a collapsing alien
moon while managing heat buildup. Genre: extraction / resource-management / physics sandbox.
Platform: Browser (WebGL 2) via Vite + React Three Fiber. Perspective: True Diegetic 2.5D Cockpit.

---

## First Actions for Any Session

1. Read `AGENTS.md` completely — architecture, physics rules, audio contract, state machine.
2. Read `docs/README.md` — documentation index by domain.
3. Read `docs/HANDOFF.md` — what is built (`[x]`) and what is next (`[ ]`).
4. Read `docs/STANDARDS.md` — non-negotiable code quality, brand, and design rules.
5. If touching docs, read `docs/AGENTS.md`.
6. Run `pnpm install && pnpm run build` — confirm the tree is healthy before touching anything.
7. Only then implement the next items from `docs/HANDOFF.md`.

---

## Tech Stack (Locked)

| Concern           | Library / Tool                                        |
|-------------------|-------------------------------------------------------|
| Rendering         | `three` + `@react-three/fiber`                        |
| Physics           | `@react-three/rapier` **ONLY** — Cannon.js is banned  |
| State (current)   | `zustand` with persist middleware                     |
| State (M1+ target)| `koota` ECS — traits + systems                        |
| Tunables (M1+)    | `zod`-validated `src/config.json`                     |
| Post-FX           | `@react-three/postprocessing` + `postprocessing`      |
| Helpers           | `@react-three/drei`                                   |
| Noise             | `simplex-noise`                                       |
| Audio             | Custom `AudioEngine` singleton (Web Audio API)        |
| Animation (3D)    | `react-spring` / `@react-spring/three`                |
| Animation (HTML)  | `framer-motion` (HTML overlays ONLY)                  |
| Build             | Vite + Biome (lint/format: `pnpm run check`)          |
| Package manager   | pnpm                                                  |

Do NOT introduce new dependencies without adding them to `docs/STANDARDS.md §Approved Libraries`.

---

## Phase State Machine

```
powered_down → boot → menu → gameplay → paused → meltdown → report
```

Source of truth: `src/store.js` (`phase` key). Settings accessible from menu and pause.

---

## Key Invariants — Never Violate

1. **Zustand store** (`src/store.js`) is the single source of truth for phase, economy, and settings.
2. **New gameplay entity systems** (ore, cubes, debris) go in Koota traits, NOT Zustand.
3. **All per-frame logic** lives in `useFrame`. Never in React state or effects.
4. **Dashboard HUD** is rendered to a `THREE.CanvasTexture` on a 3D mesh — never DOM overlays.
5. **Menus** use `@react-three/drei` `<Html>` — never raw `document.createElement`.
6. **Config values** live in `src/config.json` validated by Zod — never magic numbers.
7. **Physics** uses Rapier only — simple collider shapes (Cuboid, Ball, Heightfield).

---

## Hard Bans (Never Introduce)

| Pattern | Reason |
|---------|--------|
| `Cannon.js` | Replaced by Rapier; Vec3 NaN crashes on convex hulls |
| Convex hull colliders on ore / large geometry | Use Ball or Cuboid |
| `React Context` for game loop state | Use Zustand or Koota |
| `useReducer` for game loop | Zustand only |
| `document.createElement` for in-game HUD | Use R3F `<Html>` |
| `position: fixed/absolute` for game status | Use CanvasTexture on dashboard |
| DOM overlays for heat / hopper / credits | These are physical instruments |
| `tune.js` | Not on npm; use raw Web Audio API via `AudioEngine.js` |
| Hardcoded audio frequencies inline | Route through `audioManager.*` |
| `Math.sin` grids for terrain | Use `simplex-noise` |
| `framer-motion-3d` | Not maintained; use `react-spring` / `@react-spring/three` |
| New Zustand simulation state (M1+) | New entities go in Koota traits |
| Mutating Zustand state directly | Always use action methods |
| `package-lock.json` | pnpm uses `pnpm-lock.yaml` |

---

## Component Authoring Pattern

```jsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store'

export function ComponentName() {
  // 1. Store slices — narrow selectors only
  const phase = useGameStore((s) => s.phase)

  // 2. Refs for imperative R3F/Rapier access
  const bodyRef = useRef()

  // 3. Memoized geometry / materials (build once)
  const geometry = useMemo(() => new THREE.BufferGeometry(), [])

  // 4. useFrame loop
  useFrame((state, delta) => {
    if (!bodyRef.current) return
    if (phase !== 'gameplay') return
    // physics/shader/camera logic here
  })

  // 5. JSX — minimal, semantic
  return ( /* ... */ )
}
```

**Rules:**
- One component per file, named to match (`Terrain.jsx` exports `Terrain`).
- All components in `src/components/`.
- Always guard `useFrame` with null check AND phase check.
- Never call `setState` or Zustand `set()` inside `useFrame` — throttle and batch.
- `useMemo` for ALL procedural geometries — prevents WebGL memory leaks on re-render.
- Narrow Zustand selectors only: `const heat = useGameStore((s) => s.heat)` ✅

---

## GLSL Shader Conventions

- Prefix uniforms with `u`: `uHeat`, `uTime`
- Prefix varyings with `v`: `vUv`, `vNormal`
- Update uniforms imperatively in `useFrame`: `matRef.current.uHeat = heat / 100`
- Never update uniforms via React state

---

## Config Rule (M1+)

```js
// ✅ Reference config
import { gameConfig } from '../config'
const rate = gameConfig.mech.heat.perSecondGrinding

// ❌ Magic number
const rate = 15
```

---

## Design Bible Summary

**Creative pillars:** Tactile Weight / Diegetic Cockpit / Heat as Drama / Vertical Loop

**Cockpit layout:**
- Left instrument: Hopper fill level
- Center instrument: Heat gauge (critical UI)
- Right instrument: Credits earned

**Typography:** IBM Plex Mono (monospace only — this is an industrial mech)

**Color palette:**
- Background void: `#0a0a12`
- Ambient metal: `#1a1a2e`
- Heat accent: `#ff4500` (cool) → `#ff0000` (critical)
- Ore standard: `#4fc3f7` (cyan)
- Ore rare: `#e040fb` (magenta) — 2,500 credits, 3× heat, 15% spawn
- Credit green: `#00e676`

**Audio:** All through `AudioEngine.js` singleton. No hardcoded frequencies.

---

## Milestones (M1–M6)

| Milestone | Focus |
|-----------|-------|
| M1 | Core Architecture — Koota ECS + Zod config + Rapier cleanup |
| M2 | Core Loop — onboarding missions, contracts, rare isotopes, react-spring |
| M3 | Mobile/Capacitor — touch controls, capacitor-sqlite, iOS/Android shell |
| M4 | Visual/Audio Polish — post-FX, cockpit textures, audio mixing |
| M5 | Content/Progression — upgrade tree, biome variety, meltdown cinematics |
| M6 | Telemetry/Balancing — analytics, A/B heat curves, live config updates |

Current target: **M1**. See `docs/HANDOFF.md` for exact status.

---

## Commit Discipline

Conventional commits only:
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation only
- `chore:` maintenance (deps, config, tooling)
- `refactor:` code change without feature/fix
- `perf:` performance improvement
- `test:` adding/fixing tests
- `ci:` CI/CD changes
- `build:` build system changes

---

## After Implementing Anything

- Update `docs/HANDOFF.md` — mark completed items `[x]`, add session log entry.
- If establishing a new pattern → update `docs/STANDARDS.md`.
- If making a pivotal technical decision → add an ADR to `docs/architecture/decisions.md`.
- Commit with a conventional commit message before ending the session.

See `.github/pull_request_template.md` for the PR checklist.
