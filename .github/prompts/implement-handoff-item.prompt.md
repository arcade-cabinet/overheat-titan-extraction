---
mode: agent
description: Implement the next unchecked item from docs/HANDOFF.md following OVERHEAT architecture rules.
---

You are implementing the next unchecked item from `docs/HANDOFF.md` in OVERHEAT: Titan Extraction.

## Pre-flight checklist (complete before writing any code)

1. Read `AGENTS.md` completely.
2. Read `docs/HANDOFF.md` — identify the specific `[ ]` item to implement.
3. Read `docs/STANDARDS.md` — internalize all non-negotiable rules.
4. Read the relevant domain doc (architecture, gameplay, design) for this item.
5. Run `pnpm install && pnpm run build` — confirm tree is healthy.

## Architecture constraints

- **State:** Zustand store (`src/store.js`) is the source of truth for phase/economy/settings.
  New gameplay entities → Koota traits (M1+).
- **Physics:** `@react-three/rapier` only. Simple colliders (Cuboid, Ball).
- **Per-frame logic:** `useFrame` only — never React state or effects.
- **HUD:** `THREE.CanvasTexture` on a 3D mesh — no DOM overlays.
- **Config:** `src/config.json` via Zod — no magic numbers.
- **Audio:** `AudioEngine.js` singleton — no inline frequencies or new audio libraries.

## Banned patterns

Cannon.js · convex hull colliders on ore · React Context for game loop ·
`useReducer` for game loop · DOM overlays for heat/hopper/credits ·
`tune.js` · `Math.sin` terrain · `framer-motion-3d` · direct Zustand mutation

## Component template

```jsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store'

export function ComponentName() {
  const phase = useGameStore((s) => s.phase)
  const bodyRef = useRef()
  const geometry = useMemo(() => new THREE.BufferGeometry(), [])

  useFrame((state, delta) => {
    if (!bodyRef.current) return
    if (phase !== 'gameplay') return
    // logic
  })

  return ( /* JSX */ )
}
```

## After implementing

1. Run `pnpm run check` — fix any lint errors.
2. Run `pnpm run build` — confirm build passes.
3. Update `docs/HANDOFF.md` — mark the item `[x]`, add a session log entry.
4. If establishing a new pattern → update `docs/STANDARDS.md`.
5. If making a pivotal technical decision → add an ADR to `docs/architecture/decisions.md`.
6. Commit with a conventional commit message.
