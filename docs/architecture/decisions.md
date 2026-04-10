---
title: Architecture Decision Records
doc_type: architecture
status: active
owner: engineering
last_updated: 2026-04-09
---

# Architecture Decision Records

This file collects significant technical decisions for OVERHEAT: Titan Extraction. Each ADR explains the context, the options considered, and the chosen direction.

---

## ADR-001: Replace Cannon.js with @react-three/rapier

**Date:** 2026 (project inception)  
**Status:** Implemented

### Context

The V1–V3 prototype used Cannon.js for physics. When generating convex hulls for the central Silo cylinder and dynamic asteroid debris, Cannon.js threw thousands of `faceNormal` calculation errors (e.g., `Vec3(0,0,-1) looks like it points into the shape`), causing NaN vector propagation that crashed the WebGL renderer, producing a black screen.

### Decision

Replace Cannon.js with `@react-three/rapier` exclusively. Rapier is written in Rust, compiled to WASM, and provides stable, performant physics for React Three Fiber projects.

### Constraints added

- No convex hull colliders on ore deposits or large generated geometry — use `Ball` or `Cuboid`.
- Silo physics uses a simple `Cuboid` sensor, not a cylinder.
- Terrain uses `HeightfieldCollider` generated from a simplex-noise 64×64 grid.

### Consequence

All physics in the game is Rapier-only. Cannon.js is permanently banned. This is enforced in `.cursor/rules/no-go-list.mdc` and `AGENTS.md §What NOT to do`.

---

## ADR-002: Koota ECS + Zod as canonical production state layer

**Date:** 2026-04-09  
**Status:** Planned (target: M1)  
**User confirmation:** Explicit user choice — "Option B"

### Context

The initial scaffold used Zustand for all game state. The production audit (see `docs/references/strategy_sessions.md §3.2`) identified two problems:

1. Zustand is React-centric and causes re-renders when game simulation state changes at 60fps.
2. Numeric tunables (heat rates, ore spawn chances, upgrade costs) are scattered as magic numbers in component code, making balancing and A/B testing difficult.

Two options were considered:

**Option A:** Keep Zustand for all state, add a constants file for tunables.  
**Option B:** Migrate simulation state to Koota ECS + traits; validate all tunables via a Zod schema at startup.

### Decision

**Option B selected.** Koota ECS + Zod is the canonical production target.

- **Zustand** remains interim for: `phase`, `credits`, `upgrades`, `settings` (UI/phase/economy — low-frequency).
- **Koota** is the target for: ore nodes, debris, cubes, silo triggers, mech simulation — high-frequency, data-oriented.
- **Zod + `src/config.json`** is the single source of truth for all numeric tunables.

### Consequences

- New gameplay entities (M1+) go in Koota traits, NOT Zustand.
- The Zod schema is the contract for all A/B testing (M6) — change a config value, the whole game updates.
- `framer-motion-3d` is banned; `react-spring` / `@react-spring/three` is the 3D animation tool.
- See `docs/STANDARDS.md §14` for Zod config rules.

---

## ADR-003: Diegetic cockpit — CanvasTexture dashboard, no DOM overlays

**Date:** 2026 (prototype evolution)  
**Status:** Implemented

### Context

The V1–V4 prototypes used floating HTML `position: fixed` overlays for heat, hopper capacity, and credits. These broke immersion and caused perspective errors (the dashboard appeared at the wrong depth).

### Decision

All in-game HUD elements (heat gauge, hopper fill, credits) are rendered to a `THREE.CanvasTexture` and applied as a `MeshStandardMaterial` on the mech's physical dashboard mesh. This places the HUD inside the 3D world.

Menus (boot, main menu, pause, settings, report) use `@react-three/drei`'s `<Html>` component, which is tied to the React Three Fiber lifecycle — not raw `document.createElement`.

### Consequences

- Dashboard canvas renders at 60fps via `useFrame`.
- No `position: fixed` or `position: absolute` for any game-status information.
- Menus can use `<Html>` with `zIndexRange` to appear above the WebGL canvas.
- This is enforced in `.cursor/rules/no-go-list.mdc`.

---

## ADR-004: Capacitor for mobile shell (planned — M3)

**Date:** 2026-04-09  
**Status:** Planned (target: M3)

### Context

The game targets mobile (iOS/Android) in addition to the browser. A native shell is needed for haptics, file system access, and App Store distribution.

### Decision

Use **Capacitor** to wrap the web build into native shells. Persistence strategy:
- **Native:** `capacitor-sqlite`
- **Web/PWA:** `jeep-sqlite` or `sql.js` backed by OPFS

Persistence snapshots: key events (upgrade purchase, mission complete, every N minutes) → serialize non-ephemeral Koota ECS state + player profile + settings.

### Consequences

- The build pipeline must produce both a web target (GitHub Pages) and a Capacitor iOS/Android target.
- Input must be abstracted: `moveVector`, `lookVector`, `dashPressed`, `grindPressed`, `tractorPressed` — consumed by Koota `InputSystem`.
- See `docs/design/mobile-controls.md` for the full mobile control spec.
