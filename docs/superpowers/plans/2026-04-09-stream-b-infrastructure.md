# Stream B: Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the M1 infrastructure layer: Zod-validated `src/config.json` eliminating all magic numbers, Koota ECS world with full trait + system definitions for simulation state (Heat, Hopper, OreNode, Cube, Debris, Silo), and an adjective-adjective-noun PRNG seed phrase system that generates deterministic run seeds.

**Architecture:** `src/config.json` is the single source of truth for all numeric tunables, validated by `src/config.js` (Zod parse at startup, crashes loudly on invalid config). Koota ECS runs as a sidecar world — existing Zustand store stays authoritative for phase/economy/settings, but all simulation entities (ore nodes, cubes, debris, heat, hopper) migrate to Koota traits. R3F components bind to Koota via `useKootaWorld()` + `useFrame`. The seed phrase system is a pure utility: word pools → deterministic random via a seeded LCG → run variation (ore positions, rare spawn sequence).

**Tech Stack:** koota, zod, @react-three/fiber (useFrame), existing Zustand store (unchanged for phase/economy/settings)

**Branch:** `feat/stream-b-infrastructure` (from `main`, owns its own PR)

**Autonomy:** This subagent owns its PR fully — opens it, addresses all review feedback, squash-merges when CI passes.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/config.json` | **Create** | All numeric tunables — single source of truth |
| `src/config.js` | **Create** | Zod schema + parse at startup, exports `gameConfig` |
| `src/ecs/world.js` | **Create** | Koota world singleton, `createWorld()` |
| `src/ecs/traits.js` | **Create** | All trait definitions: Heat, Hopper, MechStats, OreNode, Cube, Silo, Input |
| `src/ecs/systems.js` | **Create** | HeatSystem, GrindingSystem, CubeEjectionSystem, EconomySystem, MovementSystem |
| `src/ecs/useECS.js` | **Create** | React hook to run ECS systems in useFrame |
| `src/utils/seedPhrase.js` | **Create** | Word pools + adjective-adjective-noun generator + seeded LCG |
| `src/store.js` | **Modify** | Import gameConfig, replace magic numbers with `gameConfig.*` references |
| `src/components/OreSpawner.jsx` | **Modify** | Wire OreNode trait, use gameConfig for thresholds |
| `src/App.jsx` | **Modify** | Mount ECS runner hook |

---

## Task 1: Zod config schema + src/config.json

**Files:**
- Create: `src/config.json`
- Create: `src/config.js`

- [ ] **Step 1.1: Install zod**

```bash
cd /Users/jbogaty/src/arcade-cabinet/overheat-titan-extraction
pnpm add zod
```

Expected: `zod` added to `dependencies` in `package.json`.

- [ ] **Step 1.2: Create `src/config.json`**

```json
{
  "mech": {
    "baseSpeed": 8,
    "dashSpeed": 20,
    "dashFov": 100,
    "normalFov": 75,
    "eyeHeight": 1.6,
    "heat": {
      "perSecondGrinding": 15,
      "rareMultiplier": 3,
      "overheatThreshold": 100,
      "meltdownThreshold": 120,
      "baseCoolingRate": 20,
      "coolingSafeThreshold": 20,
      "coolingRatePerUpgrade": 0.5,
      "cameraShakeMaxScale": 0.03
    },
    "hopper": {
      "baseCapacity": 100,
      "capacityPerUpgrade": 100
    },
    "grind": {
      "baseDps": 50,
      "dpsPerUpgrade": 0.5,
      "radius": 5,
      "soundIntervalMs": 100
    },
    "dash": {
      "fovLerpSpeed": 6,
      "stepIntervalS": 0.4
    }
  },
  "ore": {
    "count": 8,
    "maxHealth": 100,
    "respawnDelayMs": 15000,
    "rareSpawnChance": 0.15,
    "grindRadius": 5
  },
  "economy": {
    "cubeValue": 50,
    "rareCubeValue": 2500
  },
  "upgrades": {
    "cap": { "baseCost": 100 },
    "pow": { "baseCost": 150 },
    "cool": { "baseCost": 200 }
  },
  "sparks": {
    "maxLive": 30,
    "ttlMs": 1200,
    "minImpulse": 4,
    "maxImpulse": 8
  },
  "tractor": {
    "reelSpeed": 8,
    "springStiffness": 60,
    "springDamping": 8,
    "minDepth": 1.5,
    "defaultDepth": 6
  },
  "silo": {
    "position": [0, 0, 0],
    "humBaseFrequency": 58,
    "humLfoFrequency": 0.3,
    "humMaxDistance": 80
  },
  "postFx": {
    "bloom": {
      "luminanceThreshold": 0.6,
      "intensity": 1.5
    },
    "vignette": {
      "darknessCool": 1.1,
      "darknessOverheat": 1.3,
      "darknessMeltdown": 1.5
    },
    "chromAberr": {
      "heatStartPct": 50,
      "maxOffset": 0.005,
      "baseOffset": 0.001
    }
  },
  "audio": {
    "defaultMasterVolume": 0.7,
    "pauseFilterHz": 300,
    "normalFilterHz": 20000
  },
  "hitStop": {
    "durationMs": 50
  },
  "debris": {
    "count": 6,
    "ttlMs": 4000
  }
}
```

- [ ] **Step 1.3: Create `src/config.js`**

```js
import { z } from 'zod'
import rawConfig from './config.json'

const HeatSchema = z.object({
  perSecondGrinding: z.number(),
  rareMultiplier: z.number(),
  overheatThreshold: z.number(),
  meltdownThreshold: z.number(),
  baseCoolingRate: z.number(),
  coolingSafeThreshold: z.number(),
  coolingRatePerUpgrade: z.number(),
  cameraShakeMaxScale: z.number(),
})

const HopperSchema = z.object({
  baseCapacity: z.number(),
  capacityPerUpgrade: z.number(),
})

const GrindSchema = z.object({
  baseDps: z.number(),
  dpsPerUpgrade: z.number(),
  radius: z.number(),
  soundIntervalMs: z.number(),
})

const DashSchema = z.object({
  fovLerpSpeed: z.number(),
  stepIntervalS: z.number(),
})

const GameConfigSchema = z.object({
  mech: z.object({
    baseSpeed: z.number(),
    dashSpeed: z.number(),
    dashFov: z.number(),
    normalFov: z.number(),
    eyeHeight: z.number(),
    heat: HeatSchema,
    hopper: HopperSchema,
    grind: GrindSchema,
    dash: DashSchema,
  }),
  ore: z.object({
    count: z.number(),
    maxHealth: z.number(),
    respawnDelayMs: z.number(),
    rareSpawnChance: z.number(),
    grindRadius: z.number(),
  }),
  economy: z.object({
    cubeValue: z.number(),
    rareCubeValue: z.number(),
  }),
  upgrades: z.record(z.string(), z.object({ baseCost: z.number() })),
  sparks: z.object({
    maxLive: z.number(),
    ttlMs: z.number(),
    minImpulse: z.number(),
    maxImpulse: z.number(),
  }),
  tractor: z.object({
    reelSpeed: z.number(),
    springStiffness: z.number(),
    springDamping: z.number(),
    minDepth: z.number(),
    defaultDepth: z.number(),
  }),
  silo: z.object({
    position: z.tuple([z.number(), z.number(), z.number()]),
    humBaseFrequency: z.number(),
    humLfoFrequency: z.number(),
    humMaxDistance: z.number(),
  }),
  postFx: z.object({
    bloom: z.object({ luminanceThreshold: z.number(), intensity: z.number() }),
    vignette: z.object({
      darknessCool: z.number(),
      darknessOverheat: z.number(),
      darknessMeltdown: z.number(),
    }),
    chromAberr: z.object({
      heatStartPct: z.number(),
      maxOffset: z.number(),
      baseOffset: z.number(),
    }),
  }),
  audio: z.object({
    defaultMasterVolume: z.number(),
    pauseFilterHz: z.number(),
    normalFilterHz: z.number(),
  }),
  hitStop: z.object({ durationMs: z.number() }),
  debris: z.object({ count: z.number(), ttlMs: z.number() }),
})

export const gameConfig = GameConfigSchema.parse(rawConfig)
```

- [ ] **Step 1.4: Build check — Zod parse fails loudly at boot if config is invalid**

```bash
pnpm run build 2>&1 | tail -20
```
Expected: clean build.

- [ ] **Step 1.5: Commit**

```bash
git add src/config.json src/config.js package.json pnpm-lock.yaml
git commit -m "feat(config): Zod-validated src/config.json — single source of truth for all tunables"
```

---

## Task 2: Replace magic numbers in store.js with gameConfig

**Files:**
- Modify: `src/store.js`

- [ ] **Step 2.1: Update store.js to import and use gameConfig**

```js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { gameConfig } from './config'

const { mech, upgrades: upgradeConfig } = gameConfig

export const useGameStore = create(
  persist(
    (set, get) => ({
      phase: 'powered_down',
      isPaused: false,
      credits: 0,
      rawOre: 0,
      heat: 0,
      isOverheated: false,
      isMelting: false,
      upgrades: { cap: 1, pow: 1, cool: 1 },
      settings: {
        masterVolume: gameConfig.audio.defaultMasterVolume,
        lookSensitivity: 1.0,
        crtOverlays: false,
      },
      sessionCredits: 0,

      getMaxOre: () =>
        mech.hopper.baseCapacity +
        (get().upgrades.cap - 1) * mech.hopper.capacityPerUpgrade,

      getGrindDps: () =>
        mech.grind.baseDps * (1 + (get().upgrades.pow - 1) * mech.grind.dpsPerUpgrade),

      getCoolingRate: () =>
        mech.heat.baseCoolingRate *
        (1 + (get().upgrades.cool - 1) * mech.heat.coolingRatePerUpgrade),

      setPhase: (phase) => set({ phase }),
      setPaused: (isPaused) => set({ isPaused }),

      addOre: (amount) =>
        set((state) => ({ rawOre: Math.min(state.getMaxOre(), state.rawOre + amount) })),

      addHeat: (amount) =>
        set((state) => {
          const newHeat = state.heat + amount
          if (newHeat >= mech.heat.meltdownThreshold) {
            return {
              heat: mech.heat.meltdownThreshold,
              isOverheated: true,
              isMelting: true,
              phase: 'meltdown',
              isPaused: false,
            }
          }
          if (newHeat >= mech.heat.overheatThreshold)
            return { heat: mech.heat.overheatThreshold, isOverheated: true }
          return { heat: newHeat }
        }),

      coolDown: (amount) =>
        set((state) => {
          const newHeat = Math.max(0, state.heat - amount)
          if (newHeat < mech.heat.coolingSafeThreshold && state.isOverheated)
            return { heat: newHeat, isOverheated: false, isMelting: false }
          return { heat: newHeat }
        }),

      ejectCube: () => set({ rawOre: 0 }),

      addCredits: (amount) =>
        set((state) => ({
          credits: state.credits + amount,
          sessionCredits: state.sessionCredits + amount,
        })),

      buyUpgrade: (type, cost) =>
        set((state) => {
          if (!Object.hasOwn(state.upgrades, type)) return state
          if (state.credits < cost) return state
          return {
            credits: state.credits - cost,
            upgrades: { ...state.upgrades, [type]: state.upgrades[type] + 1 },
          }
        }),

      updateSetting: (key, value) =>
        set((state) => ({ settings: { ...state.settings, [key]: value } })),

      triggerMeltdown: () => set({ isMelting: true, phase: 'meltdown' }),

      resetSession: () =>
        set({
          phase: 'menu',
          rawOre: 0,
          heat: 0,
          isOverheated: false,
          isMelting: false,
          sessionCredits: 0,
          isPaused: false,
        }),
    }),
    {
      name: 'overheat-titan-storage',
      partialize: (state) => ({
        credits: state.credits,
        upgrades: state.upgrades,
        settings: state.settings,
      }),
    }
  )
)
```

- [ ] **Step 2.2: Update UpgradesTerminal to use gameConfig upgrade costs**

In `src/components/UpgradesTerminal.jsx`, replace the `UPGRADES` array:

```jsx
import { gameConfig } from '../config'

const UPGRADES = [
  {
    key: 'cap',
    label: 'HOPPER CAPACITY',
    desc: `+${gameConfig.mech.hopper.capacityPerUpgrade} ore cap per level`,
    baseCost: gameConfig.upgrades.cap.baseCost,
  },
  {
    key: 'pow',
    label: 'GRIND POWER',
    desc: `+${gameConfig.mech.grind.dpsPerUpgrade * 100}% DPS per level`,
    baseCost: gameConfig.upgrades.pow.baseCost,
  },
  {
    key: 'cool',
    label: 'COOLING SYSTEM',
    desc: `+${gameConfig.mech.heat.coolingRatePerUpgrade * 100}% cooling rate per level`,
    baseCost: gameConfig.upgrades.cool.baseCost,
  },
]
```

- [ ] **Step 2.3: Build check + commit**

```bash
pnpm run build 2>&1 | tail -10
git add src/store.js src/components/UpgradesTerminal.jsx
git commit -m "refactor: replace magic numbers in store.js with gameConfig references"
```

---

## Task 3: Koota ECS world + traits

**Files:**
- Create: `src/ecs/world.js`
- Create: `src/ecs/traits.js`

- [ ] **Step 3.1: Install koota**

```bash
pnpm add koota
```

Expected: `koota` added to `dependencies`.

- [ ] **Step 3.2: Create `src/ecs/world.js`**

```js
import { createWorld } from 'koota'

// Singleton ECS world — one per app lifetime
export const ecsWorld = createWorld()
```

- [ ] **Step 3.3: Create `src/ecs/traits.js`**

```js
import { trait } from 'koota'
import { gameConfig } from '../config'

const { mech } = gameConfig

export const Heat = trait({
  value: 0,
  overheated: false,
  melting: false,
})

export const Hopper = trait({
  current: 0,
  max: mech.hopper.baseCapacity,
})

export const MechStats = trait({
  speed: mech.baseSpeed,
  dashSpeed: mech.dashSpeed,
  grindDps: mech.grind.baseDps,
  coolingRate: mech.heat.baseCoolingRate,
})

export const Input = trait({
  moveX: 0,
  moveZ: 0,
  lookX: 0,
  lookY: 0,
  dash: false,
  tractor: false,
})

export const OreNode = trait({
  health: gameConfig.ore.maxHealth,
  maxHealth: gameConfig.ore.maxHealth,
  isRare: false,
  alive: true,
  posX: 0,
  posZ: 0,
})

export const Cube = trait({
  isRare: false,
  value: gameConfig.economy.cubeValue,
  bodyHandle: -1, // Rapier body handle
})

export const Debris = trait({
  posX: 0,
  posY: 0,
  posZ: 0,
  spawnedAt: 0,
})

export const SiloMarker = trait({
  posX: 0,
  posY: 0,
  posZ: 0,
})

export const VFXEmitter = trait({
  type: 'spark', // 'spark' | 'steam'
  ttl: 1.2,
  posX: 0,
  posY: 0,
  posZ: 0,
})
```

- [ ] **Step 3.4: Build check + commit**

```bash
pnpm run build 2>&1 | tail -10
git add src/ecs/world.js src/ecs/traits.js package.json pnpm-lock.yaml
git commit -m "feat(ecs): Koota world singleton + full trait definitions (Heat, Hopper, MechStats, OreNode, Cube, Debris)"
```

---

## Task 4: ECS systems

**Files:**
- Create: `src/ecs/systems.js`

- [ ] **Step 4.1: Create `src/ecs/systems.js`**

```js
import { gameConfig } from '../config'
import { Cube, Debris, Heat, Hopper, MechStats, OreNode, VFXEmitter } from './traits'

const { mech, ore, economy } = gameConfig

/**
 * HeatSystem — updates heat value, sets overheated/melting flags.
 * Called from useFrame with delta (seconds).
 * @param {import('koota').World} world
 * @param {number} delta
 * @param {{ isGrinding: boolean, grindIsRare: boolean, upgradeCool: number }} context
 */
export function HeatSystem(world, delta, { isGrinding, grindIsRare, upgradeCool }) {
  const mechEntities = world.query(Heat, MechStats)
  for (const entity of mechEntities) {
    const heat = entity.get(Heat)
    if (!heat) continue

    if (isGrinding && !heat.overheated) {
      const mult = grindIsRare ? mech.heat.rareMultiplier : 1
      heat.value = Math.min(
        mech.heat.meltdownThreshold,
        heat.value + mech.heat.perSecondGrinding * mult * delta
      )
      if (heat.value >= mech.heat.meltdownThreshold) {
        heat.overheated = true
        heat.melting = true
      } else if (heat.value >= mech.heat.overheatThreshold) {
        heat.overheated = true
      }
    } else if (!isGrinding) {
      const coolingRate =
        mech.heat.baseCoolingRate *
        (1 + (upgradeCool - 1) * mech.heat.coolingRatePerUpgrade)
      heat.value = Math.max(0, heat.value - coolingRate * delta)
      if (heat.overheated && heat.value < mech.heat.coolingSafeThreshold) {
        heat.overheated = false
        heat.melting = false
      }
    }
  }
}

/**
 * GrindingSystem — reduces OreNode health when player is in range.
 * Writes to Hopper.current.
 * @param {import('koota').World} world
 * @param {number} delta
 * @param {{ playerPos: {x,z}, upgradePow: number, isOverheated: boolean }} context
 * @returns {{ grindingCount: number, grindingRare: boolean }}
 */
export function GrindingSystem(world, delta, { playerPos, upgradePow, isOverheated }) {
  if (isOverheated) return { grindingCount: 0, grindingRare: false }

  const grindDps =
    mech.grind.baseDps * (1 + (upgradePow - 1) * mech.grind.dpsPerUpgrade)

  let grindingCount = 0
  let grindingRare = false

  const oreEntities = world.query(OreNode)
  for (const entity of oreEntities) {
    const node = entity.get(OreNode)
    if (!node || !node.alive) continue
    const dx = playerPos.x - node.posX
    const dz = playerPos.z - node.posZ
    const distSq = dx * dx + dz * dz
    if (distSq < ore.grindRadius * ore.grindRadius) {
      grindingCount++
      if (node.isRare) grindingRare = true
      node.health -= grindDps * delta
      if (node.health <= 0) {
        node.alive = false
        node.health = 0
      }
    }
  }

  return { grindingCount, grindingRare }
}

/**
 * HopperSystem — fills hopper based on grinding.
 */
export function HopperSystem(world, delta, { grindingCount, upgradePow, upgradeCap }) {
  const hopperEntities = world.query(Hopper)
  for (const entity of hopperEntities) {
    const hopper = entity.get(Hopper)
    if (!hopper || grindingCount === 0) continue
    const grindDps =
      mech.grind.baseDps * (1 + (upgradePow - 1) * mech.grind.dpsPerUpgrade)
    const maxOre =
      mech.hopper.baseCapacity + (upgradeCap - 1) * mech.hopper.capacityPerUpgrade
    hopper.max = maxOre
    hopper.current = Math.min(maxOre, hopper.current + grindDps * delta * grindingCount)
  }
}

/**
 * DebrisCleanupSystem — removes expired Debris entities.
 */
export function DebrisCleanupSystem(world) {
  const now = performance.now()
  const debrisEntities = world.query(Debris)
  for (const entity of debrisEntities) {
    const d = entity.get(Debris)
    if (d && now - d.spawnedAt > gameConfig.debris.ttlMs) {
      entity.destroy()
    }
  }
}

/**
 * VFXCleanupSystem — removes expired VFX emitter entities.
 */
export function VFXCleanupSystem(world, delta) {
  const vfxEntities = world.query(VFXEmitter)
  for (const entity of vfxEntities) {
    const emitter = entity.get(VFXEmitter)
    if (!emitter) continue
    emitter.ttl -= delta
    if (emitter.ttl <= 0) entity.destroy()
  }
}
```

- [ ] **Step 4.2: Build check + commit**

```bash
pnpm run build 2>&1 | tail -10
git add src/ecs/systems.js
git commit -m "feat(ecs): HeatSystem, GrindingSystem, HopperSystem, DebrisCleanupSystem, VFXCleanupSystem"
```

---

## Task 5: ECS React hook + wire into App

**Files:**
- Create: `src/ecs/useECS.js`
- Modify: `src/App.jsx`

- [ ] **Step 5.1: Create `src/ecs/useECS.js`**

```js
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { ecsWorld } from './world'
import { Heat, Hopper, MechStats, OreNode, SiloMarker } from './traits'
import {
  DebrisCleanupSystem,
  GrindingSystem,
  HeatSystem,
  HopperSystem,
  VFXCleanupSystem,
} from './systems'
import { gameConfig } from '../config'

/**
 * Creates the initial ECS entities on mount — mech, silo.
 * OreNodes are managed by OreSpawner component directly.
 */
export function useECSSetup(upgrades) {
  const mechEntityRef = useRef(null)

  useEffect(() => {
    const mechEntity = ecsWorld.spawn(
      Heat({ value: 0, overheated: false, melting: false }),
      Hopper({
        current: 0,
        max: gameConfig.mech.hopper.baseCapacity,
      }),
      MechStats({
        speed: gameConfig.mech.baseSpeed,
        dashSpeed: gameConfig.mech.dashSpeed,
        grindDps: gameConfig.mech.grind.baseDps,
        coolingRate: gameConfig.mech.heat.baseCoolingRate,
      })
    )
    mechEntityRef.current = mechEntity

    const siloEntity = ecsWorld.spawn(
      SiloMarker({
        posX: gameConfig.silo.position[0],
        posY: gameConfig.silo.position[1],
        posZ: gameConfig.silo.position[2],
      })
    )

    return () => {
      mechEntity.destroy()
      siloEntity.destroy()
    }
  }, [])

  return mechEntityRef
}

/**
 * Runs ECS systems each frame.
 * Accepts Zustand state slices as context (bridge between Zustand and ECS).
 */
export function useECSFrame({ playerPos, isOverheated, isPaused, upgrades }) {
  useFrame((_, delta) => {
    if (isPaused) return

    // Run grinding system
    const { grindingCount, grindingRare } = GrindingSystem(ecsWorld, delta, {
      playerPos,
      upgradePow: upgrades.pow,
      isOverheated,
    })

    // Run heat system
    HeatSystem(ecsWorld, delta, {
      isGrinding: grindingCount > 0,
      grindIsRare: grindingRare,
      upgradeCool: upgrades.cool,
    })

    // Run hopper system
    HopperSystem(ecsWorld, delta, {
      grindingCount,
      upgradePow: upgrades.pow,
      upgradeCap: upgrades.cap,
    })

    // Cleanup
    DebrisCleanupSystem(ecsWorld)
    VFXCleanupSystem(ecsWorld, delta)
  })
}
```

- [ ] **Step 5.2: Mount ECS setup in App.jsx**

Add ECS setup hook to the `Scene` component in `src/App.jsx`:

```jsx
import { useECSFrame, useECSSetup } from './ecs/useECS'

function Scene() {
  const phase = useGameStore((s) => s.phase)
  const isPaused = useGameStore((s) => s.isPaused)
  const isMelting = useGameStore((s) => s.isMelting)
  const isOverheated = useGameStore((s) => s.isOverheated)
  const upgrades = useGameStore((s) => s.upgrades)
  const { sparks, spawnSpark } = useSparks()

  // ECS setup — creates mech + silo entities on mount
  useECSSetup(upgrades)

  // ECS frame runner — needs camera position for proximity queries
  // We use a ref updated each frame to avoid Zustand subscription overhead
  const playerPosRef = useRef({ x: 0, z: 0 })

  useFrame(({ camera }) => {
    playerPosRef.current.x = camera.position.x
    playerPosRef.current.z = camera.position.z
  })

  useECSFrame({
    playerPos: playerPosRef.current,
    isOverheated,
    isPaused: isPaused || phase !== 'gameplay',
    upgrades,
  })

  // ... rest of Scene return unchanged
}
```

Add `import { useRef } from 'react'` to App.jsx if not already present.

- [ ] **Step 5.3: Build check + commit**

```bash
pnpm run build 2>&1 | tail -10
git add src/ecs/useECS.js src/App.jsx
git commit -m "feat(ecs): useECSSetup + useECSFrame hooks, mount ECS runner in Scene"
```

---

## Task 6: PRNG seed phrase system

**Files:**
- Create: `src/utils/seedPhrase.js`
- Create: `src/utils/seedPhrase.test.js`

The seed phrase system generates adjective-adjective-noun phrases (e.g. "molten-frozen-crater") that can be used as human-readable run seeds. A seeded LCG converts the phrase to a deterministic number sequence for ore position offsets, rare spawn order, and future procedural variation.

- [ ] **Step 6.1: Create `src/utils/seedPhrase.js`**

```js
// Word pools — industrial/alien theming matching game identity
const ADJECTIVES_1 = [
  'molten', 'frozen', 'volatile', 'dense', 'radiant', 'toxic', 'corroded',
  'inert', 'fused', 'brittle', 'glowing', 'hollow', 'cracked', 'charged',
  'buried', 'jagged', 'seared', 'warped', 'silent', 'orbital',
]

const ADJECTIVES_2 = [
  'crater', 'vein', 'shard', 'core', 'node', 'seam', 'pulse', 'mass',
  'rift', 'cluster', 'layer', 'drift', 'field', 'peak', 'trench',
  'shelf', 'basin', 'ridge', 'fault', 'lode',
]

const NOUNS = [
  'titan', 'raptor', 'anvil', 'forge', 'silo', 'mech', 'drill', 'vault',
  'beacon', 'hatch', 'core', 'pylon', 'vent', 'slag', 'chassis',
  'turbine', 'reactor', 'conduit', 'hopper', 'grinder',
]

/**
 * Seeded LCG (Linear Congruential Generator).
 * Deterministic pseudo-random number generator from a numeric seed.
 * Returns a function that yields floats [0, 1).
 */
function lcg(seed) {
  let state = seed >>> 0 // uint32
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

/**
 * Hash a string to a uint32.
 * Uses FNV-1a 32-bit hash for good avalanche on short strings.
 */
function hashString(str) {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = (Math.imul(hash, 0x01000193)) >>> 0
  }
  return hash
}

/**
 * Generate a random adjective-adjective-noun seed phrase.
 * Uses Math.random() — for new run generation only (not seeded).
 * @returns {string} e.g. "molten-crater-titan"
 */
export function generateSeedPhrase() {
  const a1 = ADJECTIVES_1[Math.floor(Math.random() * ADJECTIVES_1.length)]
  const a2 = ADJECTIVES_2[Math.floor(Math.random() * ADJECTIVES_2.length)]
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  return `${a1}-${a2}-${n}`
}

/**
 * Convert a seed phrase string to a seeded PRNG.
 * Returns a rand() function that yields deterministic floats [0, 1).
 * @param {string} phrase e.g. "molten-crater-titan"
 * @returns {{ rand: () => number, seed: number }}
 */
export function phraseToRng(phrase) {
  const seed = hashString(phrase.toLowerCase().trim())
  const rand = lcg(seed)
  return { rand, seed }
}

/**
 * Generate deterministic ore position offsets from a seed phrase.
 * Returns an array of {dx, dz} offsets to apply to the base ORE_POSITIONS.
 * Offsets are small (±3 units) so ore stays in valid terrain.
 * @param {string} phrase
 * @param {number} count — number of ore nodes
 * @returns {Array<{dx: number, dz: number, isRare: boolean}>}
 */
export function oreVariantFromPhrase(phrase, count, rareChance = 0.15) {
  const { rand } = phraseToRng(phrase)
  const variants = []
  for (let i = 0; i < count; i++) {
    const dx = (rand() - 0.5) * 6
    const dz = (rand() - 0.5) * 6
    const isRare = rand() < rareChance
    variants.push({ dx, dz, isRare })
  }
  return variants
}

/**
 * Validate that a phrase is a valid seed phrase format.
 * word-word-word, all lowercase letters and hyphens only.
 * @param {string} phrase
 * @returns {boolean}
 */
export function isValidPhrase(phrase) {
  return /^[a-z]+-[a-z]+-[a-z]+$/.test(phrase)
}
```

- [ ] **Step 6.2: Write tests for the seed phrase system**

Create `src/utils/seedPhrase.test.js`:

```js
import { describe, expect, it } from 'vitest'
import {
  generateSeedPhrase,
  isValidPhrase,
  oreVariantFromPhrase,
  phraseToRng,
} from './seedPhrase'

describe('generateSeedPhrase', () => {
  it('generates a valid adjective-adjective-noun phrase', () => {
    const phrase = generateSeedPhrase()
    expect(isValidPhrase(phrase)).toBe(true)
    expect(phrase.split('-')).toHaveLength(3)
  })

  it('generates different phrases on subsequent calls', () => {
    const phrases = new Set(Array.from({ length: 20 }, generateSeedPhrase))
    expect(phrases.size).toBeGreaterThan(1)
  })
})

describe('phraseToRng', () => {
  it('produces the same sequence for the same phrase', () => {
    const { rand: r1 } = phraseToRng('molten-crater-titan')
    const { rand: r2 } = phraseToRng('molten-crater-titan')
    for (let i = 0; i < 20; i++) {
      expect(r1()).toBeCloseTo(r2(), 10)
    }
  })

  it('produces different sequences for different phrases', () => {
    const { rand: r1 } = phraseToRng('molten-crater-titan')
    const { rand: r2 } = phraseToRng('frozen-vein-silo')
    const vals1 = Array.from({ length: 5 }, r1)
    const vals2 = Array.from({ length: 5 }, r2)
    expect(vals1).not.toEqual(vals2)
  })

  it('rand() values are in [0, 1)', () => {
    const { rand } = phraseToRng('volatile-rift-reactor')
    for (let i = 0; i < 100; i++) {
      const v = rand()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('oreVariantFromPhrase', () => {
  it('returns the requested count of variants', () => {
    const variants = oreVariantFromPhrase('molten-crater-titan', 8)
    expect(variants).toHaveLength(8)
  })

  it('offsets are within ±3 units', () => {
    const variants = oreVariantFromPhrase('frozen-seam-anvil', 8)
    for (const v of variants) {
      expect(Math.abs(v.dx)).toBeLessThanOrEqual(3)
      expect(Math.abs(v.dz)).toBeLessThanOrEqual(3)
    }
  })

  it('is deterministic — same phrase, same result', () => {
    const a = oreVariantFromPhrase('charged-ridge-drill', 8)
    const b = oreVariantFromPhrase('charged-ridge-drill', 8)
    expect(a).toEqual(b)
  })

  it('produces different results for different phrases', () => {
    const a = oreVariantFromPhrase('molten-crater-titan', 8)
    const b = oreVariantFromPhrase('frozen-vein-silo', 8)
    expect(a).not.toEqual(b)
  })
})

describe('isValidPhrase', () => {
  it('accepts valid phrases', () => {
    expect(isValidPhrase('molten-crater-titan')).toBe(true)
    expect(isValidPhrase('a-b-c')).toBe(true)
  })

  it('rejects invalid phrases', () => {
    expect(isValidPhrase('molten crater titan')).toBe(false)
    expect(isValidPhrase('molten-crater')).toBe(false)
    expect(isValidPhrase('MOLTEN-CRATER-TITAN')).toBe(false)
    expect(isValidPhrase('molten-crater-titan-extra')).toBe(false)
    expect(isValidPhrase('')).toBe(false)
  })
})
```

- [ ] **Step 6.3: Run tests**

```bash
pnpm exec vitest run src/utils/seedPhrase.test.js
```
Expected: all 9 tests pass.

- [ ] **Step 6.4: Expose seed phrase in MainMenu (run seed display)**

In `src/components/MainMenu.jsx`, add a seed display below the game title:

```jsx
import { useEffect, useState } from 'react'
import { generateSeedPhrase } from '../utils/seedPhrase'

// Inside MainMenu component, before the return:
const [seedPhrase, setSeedPhrase] = useState('')
useEffect(() => {
  setSeedPhrase(generateSeedPhrase())
}, [])

// In the JSX, below the OVERHEAT title div:
<div
  style={{
    color: '#006655',
    fontFamily: 'monospace',
    fontSize: '12px',
    letterSpacing: '0.15em',
    marginBottom: '10px',
    opacity: 0.7,
  }}
>
  RUN SEED: {seedPhrase}
</div>
```

- [ ] **Step 6.5: Build check + commit**

```bash
pnpm run build 2>&1 | tail -10
git add src/utils/seedPhrase.js src/utils/seedPhrase.test.js src/components/MainMenu.jsx
git commit -m "feat: PRNG adjective-adjective-noun seed phrase system with deterministic LCG + tests"
```

---

## Task 7: Vitest setup for unit tests

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`

- [ ] **Step 7.1: Add vitest**

```bash
pnpm add -D vitest @vitest/coverage-v8 jsdom
```

- [ ] **Step 7.2: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['src/**/*.browser.test.*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/utils/**', 'src/ecs/**', 'src/config.js'],
    },
  },
})
```

- [ ] **Step 7.3: Add test script to package.json**

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 7.4: Run all unit tests**

```bash
pnpm test
```
Expected: seed phrase tests pass.

- [ ] **Step 7.5: Build check + commit**

```bash
pnpm run build 2>&1 | tail -10
git add vitest.config.js package.json pnpm-lock.yaml
git commit -m "test: add vitest unit test runner + coverage config"
```

---

## Task 8: Final — push PR + own it to merge

- [ ] **Step 8.1: Final build**

```bash
pnpm run build 2>&1
pnpm test
```
Both must be clean.

- [ ] **Step 8.2: Push and open PR**

```bash
git push -u origin feat/stream-b-infrastructure
gh pr create \
  --base main \
  --title "feat(stream-b): Zod config, Koota ECS, PRNG seed phrases, vitest unit tests" \
  --body "$(cat <<'EOF'
## Stream B: Infrastructure

Implements M1 infrastructure layer: Zod-validated config, Koota ECS world, and PRNG seed phrase system.

### Changes
- **`src/config.json`**: all 40+ numeric tunables in one place (heat rates, hopper capacity, upgrade costs, tractor spring constants, post-FX values, audio frequencies)
- **`src/config.js`**: Zod schema validates config at startup — invalid config crashes loudly
- **`src/store.js`**: all magic numbers replaced with `gameConfig.*` references
- **Koota ECS**: `src/ecs/world.js` singleton, `src/ecs/traits.js` (Heat, Hopper, MechStats, OreNode, Cube, Debris, SiloMarker, VFXEmitter), `src/ecs/systems.js` (5 systems), `src/ecs/useECS.js` React hook
- **PRNG seed phrase**: adjective-adjective-noun word pools, FNV-1a hash, LCG RNG, deterministic ore variant generation
- **Vitest**: unit test runner with jsdom environment, coverage for utils/ecs/config

## Test plan
- [ ] `pnpm run build` — clean, Zod parse succeeds
- [ ] `pnpm test` — all seed phrase unit tests pass (determinism, validity, range)
- [ ] Main menu shows `RUN SEED: [phrase]` in small text below title
- [ ] UpgradesTerminal shows costs derived from gameConfig (100, 150, 200)
- [ ] Changing `economy.cubeValue` in config.json and rebuilding changes the reported value

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 8.3: Monitor PR and address all review feedback**

```bash
# Poll for review comments:
gh pr view --json reviews,comments
```

For each comment: fix the issue, commit, push. When all checks pass and feedback is addressed, squash-merge:

```bash
gh pr merge --squash --delete-branch
```

---

## Self-Review

**Spec coverage:**
- [x] Zod config — Task 1
- [x] Magic number elimination in store — Task 2
- [x] Koota world + traits — Task 3
- [x] ECS systems (Heat, Grinding, Hopper, Debris, VFX cleanup) — Task 4
- [x] ECS React hook + App mount — Task 5
- [x] PRNG adjective-adjective-noun seed phrases — Task 6
- [x] Tests for seed phrase (determinism, validity, range) — Task 6
- [x] Vitest unit test runner — Task 7

**Placeholders:** None. All code is complete.

**Type consistency:** `ecsWorld.spawn(Heat(...))` — `Heat` is a trait factory, `.get(Heat)` returns the trait data object. This is Koota's API. `entity.destroy()` is Koota's standard entity removal.
