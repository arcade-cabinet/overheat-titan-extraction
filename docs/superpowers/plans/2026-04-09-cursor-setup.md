# Cursor Agent Setup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `.cursor/` directory with MDC rules that give Cursor agents the same architectural guardrails as Claude Code's `.claude/rules/`, plus an MCP config if applicable.

**Architecture:** Cursor uses `.cursor/rules/` with `.mdc` files. Each rule has YAML frontmatter (`description`, `globs`, `alwaysApply`) and Markdown body. Rules can be Always-on, Auto-attached (by glob), Agent-requested, or Manual.

**Tech Stack:** MDC (Markdown with YAML frontmatter), `.cursor/mcp.json` (same format as `.mcp.json`).

---

## Cursor rules format reference

```
.cursor/rules/
├── rule-name.mdc      # MDC format
```

MDC frontmatter fields:
- `description` — shown in Cursor UI; used by agent to decide whether to load the rule
- `globs` — file patterns for auto-attachment (e.g., `src/**/*.jsx`)
- `alwaysApply` — if `true`, rule is loaded in every context regardless of files open

Rule types by frontmatter:
- `alwaysApply: true` + no globs → **Always** (loaded in every session)
- `alwaysApply: false` + `globs` → **Auto Attached** (loaded when matching files are open)
- `alwaysApply: false` + no globs → **Agent Requested** (Cursor picks it up based on description relevance)

---

## File map

| Action | File | Type |
|---|---|---|
| Create | `.cursor/rules/game-architecture.mdc` | Always |
| Create | `.cursor/rules/coding-standards.mdc` | Auto Attached (`src/**/*.jsx,src/**/*.js`) |
| Create | `.cursor/rules/no-go-list.mdc` | Always |
| Create | `.cursor/rules/docs-authoring.mdc` | Auto Attached (`docs/**/*.md`) |
| Create | `.cursor/mcp.json` | MCP config |

---

## Task 1: Create `.cursor/rules/game-architecture.mdc`

**Files:**
- Create: `.cursor/rules/game-architecture.mdc`

- [ ] **Step 1: Create the file**

```markdown
---
description: Core game architecture rules for OVERHEAT: Titan Extraction. Always active — read before any code change.
globs:
alwaysApply: true
---

# Game Architecture — OVERHEAT: Titan Extraction

## Identity
- Game: OVERHEAT: Titan Extraction
- Genre: Extraction / resource-management / physics sandbox
- Platform: Browser (WebGL 2) via Vite + React Three Fiber
- Perspective: True Diegetic 2.5D Cockpit (first-person, UI inside the 3D scene)

## Tech stack (locked)
- Rendering: `three` + `@react-three/fiber`
- Physics: `@react-three/rapier` ONLY — Cannon.js is banned
- State (current): `zustand` with persist middleware
- State (production target, M1+): `koota` ECS — traits + systems
- Tunables (M1+): `zod`-validated `src/config.json`
- Post-FX: `@react-three/postprocessing` + `postprocessing`
- Helpers: `@react-three/drei`
- Noise: `simplex-noise`
- Audio: custom `AudioEngine` singleton (Web Audio API) — tune.js is NOT on npm
- Animation (2D): `framer-motion` (HTML overlays only)
- Animation (3D): `react-spring` / `@react-spring/three`

## Phase state machine
`powered_down → boot → menu → gameplay → paused → meltdown → report`
Settings accessible from menu and pause. Source of truth: `src/store.js` (`phase` key).

## Key invariants
- The Zustand store in `src/store.js` is the single source of truth for phase, economy, and settings.
- New gameplay entity systems (ore, cubes, debris) go in Koota traits, NOT Zustand.
- All per-frame logic lives in `useFrame`, never in React state.
- Dashboard HUD is rendered to a `THREE.CanvasTexture` — never DOM overlays for in-game info.
- Menus use `@react-three/drei` `<Html>` — never raw `document.createElement`.

## Where to start
Read in order: `AGENTS.md` → `docs/HANDOFF.md` → `docs/STANDARDS.md`
```

- [ ] **Step 2: Commit**

```bash
git add .cursor/rules/game-architecture.mdc
git commit -m "chore(cursor): add always-on game architecture rule"
```

---

## Task 2: Create `.cursor/rules/coding-standards.mdc`

**Files:**
- Create: `.cursor/rules/coding-standards.mdc`

- [ ] **Step 1: Create the file**

```markdown
---
description: Component authoring, useFrame, useMemo, and shader conventions for OVERHEAT. Auto-attached when JSX/JS files are open.
globs: src/**/*.jsx,src/**/*.js
alwaysApply: false
---

# Coding Standards

## Component structure template

```jsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store'

export function ComponentName() {
  // 1. Store slices (narrow selectors only)
  const phase = useGameStore((s) => s.phase)

  // 2. Refs for imperative R3F/Rapier access
  const bodyRef = useRef()

  // 3. Memoized geometry / materials (build once)
  const geometry = useMemo(() => { /* ... */ }, [])

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

## useFrame rules
- All physics, movement, shader update, and camera logic lives in `useFrame`.
- Always guard: `if (!bodyRef.current) return`
- Always guard: `if (isPaused || phase !== 'gameplay') return`
- Never call `setState` or Zustand `set()` inside `useFrame` — use throttled refs and call store actions at bounded intervals only.

## useMemo for geometry
```js
// ✅ Always memoize procedurally generated geometries
const geometry = useMemo(() => new THREE.BufferGeometry(), [])
```

## Zustand selector rule
```js
// ✅ Correct — narrow selector
const heat = useGameStore((s) => s.heat)

// ❌ Wrong — entire store causes re-renders on every state change
const store = useGameStore()
```

## GLSL shader uniforms
- Prefix uniforms with `u` (uHeat, uTime)
- Prefix varyings with `v` (vUv, vNormal)
- Update uniforms imperatively in `useFrame`: `matRef.current.uHeat = heat / 100`
- Never update uniforms via React state

## File naming
- One component per file
- File name === component name (`Terrain.jsx` exports `Terrain`)
- All components in `src/components/`

## Config rule (M1+)
```js
// ✅ Reference config
import { gameConfig } from '../config'
const rate = gameConfig.mech.heat.perSecondGrinding

// ❌ Magic number
const rate = 15
```
```

- [ ] **Step 2: Commit**

```bash
git add .cursor/rules/coding-standards.mdc
git commit -m "chore(cursor): add coding standards rule (auto-attached to src/)"
```

---

## Task 3: Create `.cursor/rules/no-go-list.mdc`

**Files:**
- Create: `.cursor/rules/no-go-list.mdc`

- [ ] **Step 1: Create the file**

```markdown
---
description: Hard bans and forbidden patterns for OVERHEAT. Always active.
globs:
alwaysApply: true
---

# No-Go List

These patterns are banned. Do not introduce them, even if asked.

## Physics
- ❌ Cannon.js — replaced by Rapier due to Vec3 NaN crashes on convex hulls
- ❌ Convex hull colliders on ore or large generated geometry — use Ball or Cuboid
- ❌ Any physics engine other than `@react-three/rapier`

## State
- ❌ React Context for game loop state — use Zustand or Koota
- ❌ `useReducer` for game loop — Zustand only
- ❌ Adding new libraries to manage state — Zustand + Koota are the approved stack

## UI
- ❌ `document.createElement` for in-game HUD elements — use R3F `<Html>` for overlays
- ❌ `position: fixed` or `position: absolute` for in-game status info — use CanvasTexture on dashboard
- ❌ DOM overlays for heat, hopper, or credits — these are physical instruments

## Audio
- ❌ tune.js — not on npm; use raw Web Audio API via `AudioEngine.js`
- ❌ Hardcoded audio frequencies inline in components — route through `audioManager.*` methods
- ❌ New audio libraries

## Terrain
- ❌ `Math.sin` grids for terrain height — use `simplex-noise`

## Build
- ❌ Committing `node_modules/`, `dist/`, or `.env` files
- ❌ `package-lock.json` — pnpm uses `pnpm-lock.yaml`

## 3D Animation
- ❌ framer-motion-3d — not maintained; use `react-spring` / `@react-spring/three`

## Zustand (M1+ only)
- ❌ Adding new simulation state to Zustand after M1 — new entities go in Koota traits
- ❌ Mutating Zustand state directly — always use action methods
```

- [ ] **Step 2: Commit**

```bash
git add .cursor/rules/no-go-list.mdc
git commit -m "chore(cursor): add no-go-list rule (always-on)"
```

---

## Task 4: Create `.cursor/rules/docs-authoring.mdc`

**Files:**
- Create: `.cursor/rules/docs-authoring.mdc`

- [ ] **Step 1: Create the file**

```markdown
---
description: Documentation authoring rules for OVERHEAT — frontmatter, structure, and update responsibilities. Auto-attached when editing docs/.
globs: docs/**/*.md
alwaysApply: false
---

# Documentation Authoring Rules

## Frontmatter required on all docs

```yaml
---
title: Human-readable title
doc_type: architecture|gameplay|design|lore|operations|handoff|standards|index
status: active|draft|deprecated
owner: engineering|design|narrative
last_updated: YYYY-MM-DD
---
```

## Update responsibilities

| After doing... | Update these files |
|---|---|
| Implementing a feature | `docs/HANDOFF.md` — mark `[x]`, add to session log |
| Establishing a new pattern | `docs/STANDARDS.md` |
| Making a pivotal technical decision | `docs/architecture/decisions.md` |
| Adding a new mechanic | `docs/gameplay/loop-and-progression.md` |
| Changing visual/audio direction | `docs/design/visual-audio-direction.md` |
| Adding a new doc | `docs/README.md` domain map |

## Source-of-truth hierarchy

1. `AGENTS.md` — global contract. Never contradicted by domain docs.
2. `docs/STANDARDS.md` — immutable standards. Domain docs align to this.
3. `docs/HANDOFF.md` — live status. Always current.
4. Domain docs — explain intent. Should not contradict the above.

## DRY rule

Never duplicate information across docs. Cross-reference instead:
- ✅ "See `docs/STANDARDS.md §4` for post-processing settings"
- ❌ Copy-pasting the same code block into multiple docs
```

- [ ] **Step 2: Commit**

```bash
git add .cursor/rules/docs-authoring.mdc
git commit -m "chore(cursor): add docs authoring rule (auto-attached to docs/)"
```

---

## Task 5: Create `.cursor/mcp.json`

**Files:**
- Create: `.cursor/mcp.json`

- [ ] **Step 1: Create MCP config**

Cursor uses the same MCP server format as Claude Code's `.mcp.json`. For this game (no database), a minimal config is appropriate. Add entries if the project adds a backend later.

```json
{
  "mcpServers": {}
}
```

Note: When the Capacitor + SQLite persistence layer (M3) lands, add a local SQLite MCP server here if one becomes useful for inspecting game save data during development.

- [ ] **Step 2: Commit**

```bash
git add .cursor/mcp.json
git commit -m "chore(cursor): add empty mcp.json (extend when backend is added)"
```
