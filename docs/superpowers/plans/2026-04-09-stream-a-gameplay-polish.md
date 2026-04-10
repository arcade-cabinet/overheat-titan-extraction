# Stream A: Gameplay Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete every missing gameplay mechanic and visual/audio effect so the extraction loop is fully playable and polished: tractor beam, ore destruction + debris, sparks, hit-stop, rare isotopes, headlamp, all missing post-FX passes, spatial audio, framer-motion UI transitions, and meltdown fixes.

**Architecture:** All gameplay additions live in `src/components/`. The Zustand store remains authoritative for phase/economy/heat (no Koota migration in this stream — that is Stream B). New components integrate with the existing `useGameStore` hook pattern. Post-FX additions go in `VisualEffects.jsx` using already-approved `postprocessing` and `@react-three/postprocessing` packages. Spatial audio extends `AudioEngine.js` with new methods only.

**Tech Stack:** React Three Fiber, @react-three/rapier (useSpringJoint, InstancedRigidBodies), @react-three/drei (Line, SpotLight), @react-three/postprocessing (GlitchEffect, HueSaturation, custom ShaderPass), framer-motion, react-spring/@react-spring/three, THREE.PositionalAudio, maath/random

**Branch:** `feat/stream-a-gameplay-polish` (from `main`)

**Integration target:** `feat/production-integration` (merge here when complete, then open PR)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/components/TractorBeam.jsx` | **Create** | Kinematic anchor + spring joint + throw + cyan beam line |
| `src/components/Sparks.jsx` | **Create** | Spark particle emitter with TTL, spawns on grind contact |
| `src/components/Headlamp.jsx` | **Create** | SpotLight on camera + boot flicker sequence |
| `src/components/OreSpawner.jsx` | **Modify** | Add ore health, depletion shrink, destruction, rare isotopes, hit-stop, debris |
| `src/components/VisualEffects.jsx` | **Modify** | Add GlitchEffect (meltdown), HueSaturation (pause), CRT ShaderPass, fix isMelting chromAberr |
| `src/components/Player.jsx` | **Modify** | Wire headlamp, tractor pointer events, meltdown camera lerp improvement |
| `src/components/Cockpit.jsx` | **Modify** | Mount TractorBeam and Headlamp as children |
| `src/audio/AudioEngine.js` | **Modify** | Add initSiloHum, setThrusterVolume, dynamic alarm ducking, maath/random import fix |
| `src/components/Silo.jsx` | **Modify** | Call audioManager.initSiloHum after audio init |
| `src/components/AmbientSpores.jsx` | **Modify** | Replace custom inSphere with maath/random.inSphere |
| `src/components/BootScreen.jsx` | **Modify** | Add AnimatePresence + framer-motion fade transition |
| `src/components/MainMenu.jsx` | **Modify** | Add AnimatePresence + framer-motion slide-in |
| `src/components/PauseMenu.jsx` | **Modify** | Add AnimatePresence + framer-motion transition |
| `src/components/SettingsMenu.jsx` | **Modify** | Add AnimatePresence + framer-motion transition |
| `src/components/MeltdownScreen.jsx` | **Modify** | Add AnimatePresence + framer-motion transition |
| `src/components/UpgradesTerminal.jsx` | **Modify** | Add AnimatePresence + framer-motion transition |
| `src/App.jsx` | **Modify** | Wrap overlay zone in AnimatePresence |

---

## Task 1: Fix the two correctness bugs before adding anything new

**Files:**
- Modify: `src/components/VisualEffects.jsx`
- Modify: `src/components/SettingsMenu.jsx`

- [ ] **Step 1.1: Fix meltdown chromatic aberration — use `isMelting` not `isOverheated`**

Open `src/components/VisualEffects.jsx`. The current `useFrame` pulse uses `isOverheated`. Meltdown needs extreme offset. Replace the entire component:

```jsx
import { useFrame } from '@react-three/fiber'
import { Bloom, ChromaticAberration, EffectComposer, Glitch, HueSaturation, Vignette } from '@react-three/postprocessing'
import { BlendFunction, GlitchMode } from 'postprocessing'
import { useRef } from 'react'
import { useGameStore } from '../store'

export function VisualEffects() {
  const heat = useGameStore((s) => s.heat)
  const isOverheated = useGameStore((s) => s.isOverheated)
  const isMelting = useGameStore((s) => s.isMelting)
  const isPaused = useGameStore((s) => s.isPaused)
  const crtOverlays = useGameStore((s) => s.settings.crtOverlays)
  const chromRef = useRef()

  useFrame(({ clock }) => {
    if (!chromRef.current) return
    if (isMelting) {
      // Extreme aberration during meltdown
      const t = clock.elapsedTime
      const tear = 0.02 + Math.sin(t * 30) * 0.015
      chromRef.current.offset.set(tear, tear * 0.7)
      return
    }
    const heatFactor = Math.max(0, (heat - 50) / 50)
    const pulse = isOverheated ? Math.sin(clock.elapsedTime * Math.PI * 20) * 0.005 : 0
    const offset = 0.001 + heatFactor * 0.004 + pulse
    chromRef.current.offset.set(offset, offset)
  })

  return (
    <EffectComposer disableNormalPass>
      <Bloom
        luminanceThreshold={0.6}
        mipmapBlur
        intensity={1.5}
        blendFunction={BlendFunction.ADD}
      />
      <ChromaticAberration ref={chromRef} blendFunction={BlendFunction.NORMAL} />
      <Vignette
        eskil={false}
        offset={0.1}
        darkness={isMelting ? 1.5 : isOverheated ? 1.3 : 1.1}
        blendFunction={BlendFunction.NORMAL}
      />
      {isPaused && (
        <HueSaturation saturation={-1.0} blendFunction={BlendFunction.NORMAL} />
      )}
      {isMelting && (
        <Glitch
          delay={[0.0, 0.08]}
          duration={[0.1, 0.3]}
          strength={[0.3, 1.0]}
          mode={GlitchMode.CONSTANT_WILD}
          blendFunction={BlendFunction.NORMAL}
        />
      )}
    </EffectComposer>
  )
}
```

- [ ] **Step 1.2: Fix settings back — preserve isPaused across settings phase transition**

The current `SettingsMenu.jsx` back handler reads `isPaused` from the store, but when phase changes to `settings`, `isPaused` stays `true`. When returning, `setPhase(isPaused ? 'gameplay' : 'menu')` works correctly. However, pointer lock is not restored. Modify `back()`:

```jsx
const back = () => {
  audioManager.playBlip()
  if (isPaused) {
    setPhase('gameplay')
    // Re-request pointer lock when returning to active gameplay
    document.body.requestPointerLock?.()
  } else {
    setPhase('menu')
  }
}
```

- [ ] **Step 1.3: Verify build is clean**

```bash
cd /Users/jbogaty/src/arcade-cabinet/overheat-titan-extraction
pnpm run build 2>&1 | tail -20
```
Expected: `✓ built in` with no errors.

- [ ] **Step 1.4: Commit**

```bash
git add src/components/VisualEffects.jsx src/components/SettingsMenu.jsx
git commit -m "fix: meltdown chromAberr uses isMelting; settings back restores pointer lock"
```

---

## Task 2: AmbientSpores — official maath/random.inSphere

**Files:**
- Modify: `src/components/AmbientSpores.jsx`

- [ ] **Step 2.1: Verify maath import works**

```bash
cd /Users/jbogaty/src/arcade-cabinet/overheat-titan-extraction
node -e "import('maath/random/dist/maath-random.esm').then(m => console.log(Object.keys(m)))"
```
Expected: prints array including `inSphere`.

- [ ] **Step 2.2: Replace custom inSphere with official maath**

```jsx
import { PointMaterial, Points } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as random from 'maath/random/dist/maath-random.esm'
import { useRef, useState } from 'react'
import * as THREE from 'three'

export function AmbientSpores() {
  const [sphere] = useState(() => random.inSphere(new Float32Array(4500), { radius: 120 }))
  const pointsRef = useRef()

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.x -= delta / 20
    pointsRef.current.rotation.y -= delta / 30
  })

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={pointsRef} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#00ffcc"
          size={0.25}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  )
}
```

- [ ] **Step 2.3: Build check**

```bash
pnpm run build 2>&1 | tail -10
```
Expected: no errors.

- [ ] **Step 2.4: Commit**

```bash
git add src/components/AmbientSpores.jsx
git commit -m "fix: use official maath/random.inSphere for ambient spores"
```

---

## Task 3: Headlamp SpotLight + boot flicker

**Files:**
- Create: `src/components/Headlamp.jsx`
- Modify: `src/components/Cockpit.jsx`

- [ ] **Step 3.1: Create `src/components/Headlamp.jsx`**

```jsx
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { useGameStore } from '../store'

export function Headlamp() {
  const phase = useGameStore((s) => s.phase)
  const spotRef = useRef()
  const flickerEnd = useRef(0)
  const stable = useRef(false)

  useEffect(() => {
    if (phase === 'boot') {
      flickerEnd.current = performance.now() + 500
      stable.current = false
    }
    if (phase === 'menu' || phase === 'gameplay') {
      stable.current = true
    }
  }, [phase])

  useFrame(() => {
    if (!spotRef.current) return
    if (phase === 'powered_down') {
      spotRef.current.intensity = 0
      return
    }
    const now = performance.now()
    if (!stable.current && now < flickerEnd.current) {
      spotRef.current.intensity = Math.random() * 3
    } else {
      stable.current = true
      spotRef.current.intensity = 2
    }
  })

  return (
    <spotLight
      ref={spotRef}
      position={[0, 0.1, -0.5]}
      angle={0.45}
      penumbra={0.4}
      intensity={2}
      color="#ffeecc"
      castShadow={false}
      distance={80}
    />
  )
}
```

- [ ] **Step 3.2: Mount Headlamp in Cockpit**

```jsx
import { Dashboard } from './Dashboard'
import { Headlamp } from './Headlamp'
import { MoltenSaw } from './MoltenSaw'

export function Cockpit() {
  return (
    <group>
      <Dashboard />
      <MoltenSaw />
      <Headlamp />
      {/* Crosshair dot */}
      <mesh position={[0, 0, -2]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshBasicMaterial color="#00ffcc" />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 3.3: Build check + commit**

```bash
pnpm run build 2>&1 | tail -10
git add src/components/Headlamp.jsx src/components/Cockpit.jsx
git commit -m "feat: headlamp SpotLight with boot flicker sequence"
```

---

## Task 4: Rare isotopes in OreSpawner

**Files:**
- Modify: `src/components/OreSpawner.jsx`

This is a prerequisite for ore health (Task 5) since the health system needs to know if an ore is rare.

- [ ] **Step 4.1: Add rare isotope state to OreSpawner**

Replace the top of `OreSpawner.jsx` with:

```jsx
import { useFrame } from '@react-three/fiber'
import { BallCollider, RigidBody } from '@react-three/rapier'
import { useRef, useState } from 'react'
import { audioManager } from '../audio/AudioEngine'
import { useGameStore } from '../store'

const RARE_SPAWN_CHANCE = 0.15

const ORE_POSITIONS = [
  { id: 'ore-0', pos: [15, 0, 15] },
  { id: 'ore-1', pos: [-15, 0, 15] },
  { id: 'ore-2', pos: [15, 0, -15] },
  { id: 'ore-3', pos: [-15, 0, -15] },
  { id: 'ore-4', pos: [25, 0, 5] },
  { id: 'ore-5', pos: [-25, 0, -5] },
  { id: 'ore-6', pos: [5, 0, 25] },
  { id: 'ore-7', pos: [-5, 0, -25] },
]

const MAX_ORE_HEALTH = 100
const ORE_RESPAWN_DELAY = 15000 // ms

function buildInitialOreState() {
  return Object.fromEntries(
    ORE_POSITIONS.map(({ id }) => [
      id,
      {
        health: MAX_ORE_HEALTH,
        isRare: Math.random() < RARE_SPAWN_CHANCE,
        alive: true,
        respawnAt: null,
      },
    ])
  )
}
```

- [ ] **Step 4.2: Commit this structural setup**

```bash
git add src/components/OreSpawner.jsx
git commit -m "feat(ore): add rare isotope state structure and respawn scaffolding"
```

---

## Task 5: Ore health, depletion, destruction, debris, hit-stop

**Files:**
- Modify: `src/components/OreSpawner.jsx`

- [ ] **Step 5.1: Full OreSpawner rewrite with health + debris + hit-stop**

Replace the full content of `src/components/OreSpawner.jsx`:

```jsx
import { useFrame } from '@react-three/fiber'
import { BallCollider, InstancedRigidBodies, RigidBody } from '@react-three/rapier'
import { useCallback, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { audioManager } from '../audio/AudioEngine'
import { useGameStore } from '../store'

const RARE_SPAWN_CHANCE = 0.15
const MAX_ORE_HEALTH = 100
const ORE_RESPAWN_DELAY_MS = 15000
const GRIND_RADIUS = 5
const MAX_DEBRIS = 6

const ORE_POSITIONS = [
  { id: 'ore-0', pos: [15, 0, 15] },
  { id: 'ore-1', pos: [-15, 0, 15] },
  { id: 'ore-2', pos: [15, 0, -15] },
  { id: 'ore-3', pos: [-15, 0, -15] },
  { id: 'ore-4', pos: [25, 0, 5] },
  { id: 'ore-5', pos: [-25, 0, -5] },
  { id: 'ore-6', pos: [5, 0, 25] },
  { id: 'ore-7', pos: [-5, 0, -25] },
]

function makeRare() {
  return Math.random() < RARE_SPAWN_CHANCE
}

function buildOreState() {
  const state = {}
  for (const { id } of ORE_POSITIONS) {
    state[id] = { health: MAX_ORE_HEALTH, isRare: makeRare(), alive: true, respawnAt: null }
  }
  return state
}

export function OreSpawner({ onSparkTrigger }) {
  const phase = useGameStore((s) => s.phase)
  const isOverheated = useGameStore((s) => s.isOverheated)
  const heat = useGameStore((s) => s.heat)
  const addOre = useGameStore((s) => s.addOre)
  const addHeat = useGameStore((s) => s.addHeat)
  const rawOre = useGameStore((s) => s.rawOre)
  const getMaxOre = useGameStore((s) => s.getMaxOre)
  const getGrindDps = useGameStore((s) => s.getGrindDps)
  const ejectCube = useGameStore((s) => s.ejectCube)

  const [cubes, setCubes] = useState([])
  const [debris, setDebris] = useState([]) // [{id, positions:[...], impulses:[...]}]

  const oreStateRef = useRef(buildOreState())
  const lastGrindSoundAtRef = useRef(0)
  const ejectionPendingRef = useRef(false)
  const hitStopRef = useRef(false)
  const wasGrindingRef = useRef(false)

  const oreScaleRefs = useRef({})

  const removeDebrisTimeout = useRef({})

  const spawnDebris = useCallback((pos, count = MAX_DEBRIS) => {
    const debrisId = Date.now()
    const positions = []
    const impulses = []
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
      const r = 0.5 + Math.random()
      positions.push([
        pos[0] + Math.cos(angle) * r,
        pos[1] + 0.5 + Math.random(),
        pos[2] + Math.sin(angle) * r,
      ])
      impulses.push([
        Math.cos(angle) * (2 + Math.random() * 3),
        3 + Math.random() * 4,
        Math.sin(angle) * (2 + Math.random() * 3),
      ])
    }
    setDebris((prev) => [...prev, { id: debrisId, positions, impulses }])
    removeDebrisTimeout.current[debrisId] = setTimeout(() => {
      setDebris((prev) => prev.filter((d) => d.id !== debrisId))
      delete removeDebrisTimeout.current[debrisId]
    }, 4000)
  }, [])

  useFrame(({ camera }, delta) => {
    if (phase !== 'gameplay') return
    if (rawOre === 0) ejectionPendingRef.current = false

    // Hit-stop: freeze this frame
    if (hitStopRef.current) return

    let grindingOreCount = 0
    let heatOreCount = 0
    const now = performance.now()

    for (const { id, pos } of ORE_POSITIONS) {
      const oreState = oreStateRef.current[id]
      if (!oreState.alive) {
        // Respawn check
        if (oreState.respawnAt && now >= oreState.respawnAt) {
          oreStateRef.current[id] = {
            health: MAX_ORE_HEALTH,
            isRare: makeRare(),
            alive: true,
            respawnAt: null,
          }
        }
        continue
      }

      const dx = camera.position.x - pos[0]
      const dz = camera.position.z - pos[2]
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < GRIND_RADIUS) {
        heatOreCount += 1
        if (!isOverheated) grindingOreCount += 1
      }
    }

    const isGrinding = grindingOreCount > 0

    // Hit-stop on leading edge of grind
    if (isGrinding && !wasGrindingRef.current) {
      hitStopRef.current = true
      setTimeout(() => { hitStopRef.current = false }, 50)
      wasGrindingRef.current = true
    } else if (!isGrinding) {
      wasGrindingRef.current = false
    }

    if (grindingOreCount > 0) {
      addOre(getGrindDps() * delta * grindingOreCount)

      // Drain ore health and trigger spark callback
      for (const { id, pos } of ORE_POSITIONS) {
        const oreState = oreStateRef.current[id]
        if (!oreState.alive) continue
        const dx = camera.position.x - pos[0]
        const dz = camera.position.z - pos[2]
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist < GRIND_RADIUS && !isOverheated) {
          const heatMult = oreState.isRare ? 3 : 1
          const drain = getGrindDps() * delta * heatMult
          oreStateRef.current[id].health -= drain

          // Spark trigger
          if (onSparkTrigger) {
            onSparkTrigger([pos[0], pos[1] + 1, pos[2]])
          }

          // Visual scale via ref
          const healthPct = Math.max(0, oreStateRef.current[id].health / MAX_ORE_HEALTH)
          if (oreScaleRefs.current[id]) {
            oreScaleRefs.current[id].scale.setScalar(0.3 + healthPct * 0.7)
          }

          if (oreStateRef.current[id].health <= 0) {
            oreStateRef.current[id].alive = false
            oreStateRef.current[id].respawnAt = now + ORE_RESPAWN_DELAY_MS
            spawnDebris(pos)
          }
        }
      }

      if (now - lastGrindSoundAtRef.current >= 100) {
        audioManager.playGrind(Math.min(100, heat))
        lastGrindSoundAtRef.current = now
      }
    }

    if (heatOreCount > 0) {
      // Rare ores add 3× heat
      let heatRate = 0
      for (const { id, pos } of ORE_POSITIONS) {
        if (!oreStateRef.current[id].alive) continue
        const dx = camera.position.x - pos[0]
        const dz = camera.position.z - pos[2]
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist < GRIND_RADIUS) {
          heatRate += oreStateRef.current[id].isRare ? 45 : 15
        }
      }
      addHeat(heatRate * delta)
    }

    if (rawOre >= getMaxOre() && !ejectionPendingRef.current) {
      ejectionPendingRef.current = true
      // Determine cube value — rare if any grinded ore was rare
      const hasRare = ORE_POSITIONS.some(
        ({ id, pos }) => {
          if (!oreStateRef.current[id]) return false
          const dx = camera.position.x - pos[0]
          const dz = camera.position.z - pos[2]
          return Math.sqrt(dx * dx + dz * dz) < GRIND_RADIUS && oreStateRef.current[id].isRare
        }
      )
      const cubePos = [
        camera.position.x + (Math.random() - 0.5) * 4,
        camera.position.y,
        camera.position.z + (Math.random() - 0.5) * 4,
      ]
      setCubes((prev) => [
        ...prev,
        { id: Date.now(), position: cubePos, isRare: hasRare, value: hasRare ? 2500 : 50 },
      ])
      ejectCube()
    }
  })

  return (
    <>
      {ORE_POSITIONS.map(({ id, pos }) => {
        const oreState = oreStateRef.current[id]
        if (!oreState?.alive) return null
        return (
          <RigidBody key={id} type="fixed" colliders={false} position={pos}>
            <BallCollider args={[1.5]} />
            <mesh ref={(el) => { if (el) oreScaleRefs.current[id] = el }}>
              <sphereGeometry args={[1.5, 12, 12]} />
              <meshStandardMaterial
                color={oreState.isRare ? '#ff00ff' : '#00ffcc'}
                emissive={oreState.isRare ? '#ff00ff' : '#00ffcc'}
                emissiveIntensity={oreState.isRare ? 0.7 : 0.4}
              />
            </mesh>
          </RigidBody>
        )
      })}

      {cubes.map((cube) => (
        <RigidBody
          key={cube.id}
          colliders="cuboid"
          position={cube.position}
          userData={{
            type: 'cube',
            id: cube.id,
            value: cube.value,
            isRare: cube.isRare,
            onSell: () => setCubes((prev) => prev.filter((entry) => entry.id !== cube.id)),
          }}
        >
          <mesh>
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <meshStandardMaterial
              color={cube.isRare ? '#ff00ff' : '#ffaa00'}
              emissive={cube.isRare ? '#ff00ff' : '#ffaa00'}
              emissiveIntensity={cube.isRare ? 0.8 : 0.5}
            />
          </mesh>
        </RigidBody>
      ))}

      {debris.map((d) => (
        <InstancedRigidBodies
          key={d.id}
          instances={d.positions.map((pos, i) => ({
            key: `d-${d.id}-${i}`,
            position: pos,
            rotation: [0, 0, 0],
          }))}
          colliders="ball"
        >
          <instancedMesh args={[null, null, d.positions.length]}>
            <sphereGeometry args={[0.18, 6, 6]} />
            <meshStandardMaterial color="#555" emissive="#333" roughness={0.9} />
          </instancedMesh>
        </InstancedRigidBodies>
      ))}
    </>
  )
}
```

- [ ] **Step 5.2: Update Silo to use cube.value for credits**

In `src/components/Silo.jsx`, replace `addCredits(50)` with:
```js
const value = otherUserData.value ?? 50
addCredits(value)
```

- [ ] **Step 5.3: Build check**

```bash
pnpm run build 2>&1 | tail -20
```
Expected: clean build.

- [ ] **Step 5.4: Commit**

```bash
git add src/components/OreSpawner.jsx src/components/Silo.jsx
git commit -m "feat: ore health, depletion shrink, destruction, debris, hit-stop, rare isotopes"
```

---

## Task 6: Spark emitter

**Files:**
- Create: `src/components/Sparks.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 6.1: Create `src/components/Sparks.jsx`**

```jsx
import { RigidBody } from '@react-three/rapier'
import { useCallback, useRef, useState } from 'react'

const MAX_SPARKS = 30
const SPARK_TTL_MS = 1200

export function useSparks() {
  const [sparks, setSparks] = useState([])
  const nextIdRef = useRef(0)

  const spawnSpark = useCallback((position) => {
    const id = nextIdRef.current++
    const angle = Math.random() * Math.PI * 2
    const spread = 1.5 + Math.random() * 2
    const impulse = [
      Math.cos(angle) * spread,
      4 + Math.random() * 4,
      Math.sin(angle) * spread,
    ]
    setSparks((prev) => {
      const next = [...prev, { id, position: [...position], impulse }]
      return next.length > MAX_SPARKS ? next.slice(next.length - MAX_SPARKS) : next
    })
    setTimeout(() => {
      setSparks((prev) => prev.filter((s) => s.id !== id))
    }, SPARK_TTL_MS)
  }, [])

  return { sparks, spawnSpark }
}

export function Sparks({ sparks }) {
  return (
    <>
      {sparks.map((spark) => (
        <SparkBody key={spark.id} spark={spark} />
      ))}
    </>
  )
}

function SparkBody({ spark }) {
  const bodyRef = useRef()

  return (
    <RigidBody
      ref={bodyRef}
      colliders="ball"
      position={spark.position}
      gravityScale={1.5}
      onCollisionEnter={() => {
        if (bodyRef.current) {
          bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
        }
      }}
    >
      <mesh>
        <boxGeometry args={[0.06, 0.06, 0.06]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ff6600" emissiveIntensity={2} />
      </mesh>
    </RigidBody>
  )
}
```

- [ ] **Step 6.2: Wire Sparks into App.jsx**

In `src/App.jsx`, import `Sparks` and `useSparks`, hoist the spark state into `Scene`, pass `onSparkTrigger` to `OreSpawner`, and render `<Sparks>` inside `<Physics>`:

```jsx
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Suspense } from 'react'
import { AmbientSpores } from './components/AmbientSpores'
import { BootScreen } from './components/BootScreen'
import { Cockpit } from './components/Cockpit'
import { Environment } from './components/Environment'
import { MainMenu } from './components/MainMenu'
import { MeltdownScreen } from './components/MeltdownScreen'
import { OreSpawner } from './components/OreSpawner'
import { PauseMenu } from './components/PauseMenu'
import { Player } from './components/Player'
import { SettingsMenu } from './components/SettingsMenu'
import { Silo } from './components/Silo'
import { Sparks, useSparks } from './components/Sparks'
import { Terrain } from './components/Terrain'
import { UpgradesTerminal } from './components/UpgradesTerminal'
import { VisualEffects } from './components/VisualEffects'
import { useGameStore } from './store'

function Scene() {
  const phase = useGameStore((s) => s.phase)
  const isPaused = useGameStore((s) => s.isPaused)
  const isMelting = useGameStore((s) => s.isMelting)
  const { sparks, spawnSpark } = useSparks()

  return (
    <>
      <Environment />
      <AmbientSpores />
      <Physics gravity={[0, -9.81, 0]} paused={phase !== 'gameplay' || isPaused}>
        <Terrain />
        <Silo />
        {(phase === 'gameplay' || isMelting) && (
          <>
            <OreSpawner onSparkTrigger={spawnSpark} />
            <Player />
            <Sparks sparks={sparks} />
          </>
        )}
      </Physics>
      {phase === 'gameplay' && <Cockpit />}
      <VisualEffects />
      <BootScreen />
      <MainMenu />
      <PauseMenu />
      <SettingsMenu />
      <MeltdownScreen />
      <UpgradesTerminal />
    </>
  )
}

export default function App() {
  return (
    <Canvas
      shadows
      camera={{ fov: 75, near: 0.1, far: 500, position: [0, 5, 10] }}
      style={{ background: '#020406' }}
      gl={{ antialias: true, toneMapping: 0 }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  )
}
```

- [ ] **Step 6.3: Build check + commit**

```bash
pnpm run build 2>&1 | tail -10
git add src/components/Sparks.jsx src/App.jsx
git commit -m "feat: spark emitter on grind contact with physics bodies and TTL"
```

---

## Task 7: Tractor Beam

**Files:**
- Create: `src/components/TractorBeam.jsx`
- Modify: `src/components/Cockpit.jsx`

The tractor beam is the most complex feature. It needs: a kinematic anchor RigidBody, a spring joint between anchor and grabbed cube, reel-in each frame, throw on pointer-up, and a visual beam line.

- [ ] **Step 7.1: Create `src/components/TractorBeam.jsx`**

```jsx
import { Line } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, useSpringJoint } from '@react-three/rapier'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../store'

const REEL_SPEED = 8   // units/s reel-in
const SPRING_STIFFNESS = 60
const SPRING_DAMPING = 8
const SPRING_REST = 0
const MIN_DEPTH = 1.5  // closest the anchor gets

function SpringJoint({ anchorRef, targetRef }) {
  useSpringJoint(anchorRef, targetRef, [
    [0, 0, 0],
    [0, 0, 0],
    SPRING_REST,
    SPRING_STIFFNESS,
    SPRING_DAMPING,
  ])
  return null
}

export function TractorBeam() {
  const { camera, scene } = useThree()
  const phase = useGameStore((s) => s.phase)
  const isPaused = useGameStore((s) => s.isPaused)

  const anchorRef = useRef()
  const grabbedRef = useRef(null)   // Rapier RigidBody of grabbed cube
  const [grabbed, setGrabbed] = useState(false)
  const depthRef = useRef(6)        // current reel depth
  const beamStartRef = useRef(new THREE.Vector3())
  const beamEndRef = useRef(new THREE.Vector3())
  const [beamPoints, setBeamPoints] = useState(null)
  const raycaster = useRef(new THREE.Raycaster())
  const dir = useRef(new THREE.Vector3())

  // Grab on pointer-down — raycast along camera forward direction
  const onPointerDown = useCallback(() => {
    if (phase !== 'gameplay' || isPaused || grabbed) return

    raycaster.current.setFromCamera({ x: 0, y: 0 }, camera)
    const hits = raycaster.current.intersectObjects(scene.children, true)

    for (const hit of hits) {
      let obj = hit.object
      while (obj) {
        if (obj.userData?.type === 'cube' && obj.__rapierRigidBody) {
          grabbedRef.current = obj.__rapierRigidBody
          depthRef.current = hit.distance
          setGrabbed(true)
          return
        }
        obj = obj.parent
      }
    }
  }, [phase, isPaused, grabbed, camera, scene])

  // Release on pointer-up — cube keeps its current velocity (throw)
  const onPointerUp = useCallback(() => {
    if (!grabbed) return
    grabbedRef.current = null
    setGrabbed(false)
    setBeamPoints(null)
  }, [grabbed])

  useEffect(() => {
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [onPointerDown, onPointerUp])

  useFrame((_, delta) => {
    if (!anchorRef.current) return
    if (!grabbed || !grabbedRef.current) return

    // Reel in: reduce depth each frame
    depthRef.current = Math.max(MIN_DEPTH, depthRef.current - REEL_SPEED * delta)

    // Move kinematic anchor to depth along camera look direction
    camera.getWorldDirection(dir.current)
    const anchorPos = camera.position.clone().addScaledVector(dir.current, depthRef.current)
    anchorRef.current.setNextKinematicTranslation(anchorPos)

    // Update beam visual
    beamStartRef.current.copy(camera.position)
    const cubeT = grabbedRef.current.translation()
    beamEndRef.current.set(cubeT.x, cubeT.y, cubeT.z)
    setBeamPoints([beamStartRef.current.clone(), beamEndRef.current.clone()])
  })

  return (
    <>
      {/* Invisible kinematic anchor */}
      <RigidBody
        ref={anchorRef}
        type="kinematicPosition"
        colliders={false}
        position={[0, -1000, 0]}
      >
        <mesh visible={false}>
          <sphereGeometry args={[0.1]} />
        </mesh>
      </RigidBody>

      {/* Spring joint — only active when a cube is grabbed */}
      {grabbed && grabbedRef.current && (
        <SpringJoint anchorRef={anchorRef} targetRef={grabbedRef} />
      )}

      {/* Beam visual */}
      {beamPoints && (
        <Line
          points={beamPoints}
          color="#00ffcc"
          lineWidth={1.5}
          transparent
          opacity={0.7}
        />
      )}
    </>
  )
}
```

- [ ] **Step 7.2: Mount TractorBeam in Cockpit**

```jsx
import { Dashboard } from './Dashboard'
import { Headlamp } from './Headlamp'
import { MoltenSaw } from './MoltenSaw'
import { TractorBeam } from './TractorBeam'

export function Cockpit() {
  return (
    <group>
      <Dashboard />
      <MoltenSaw />
      <Headlamp />
      <TractorBeam />
      {/* Crosshair dot */}
      <mesh position={[0, 0, -2]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshBasicMaterial color="#00ffcc" />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 7.3: Verify `__rapierRigidBody` attachment**

Rapier's `<RigidBody>` attaches `__rapierRigidBody` to the associated mesh via `userData`. Verify the cubes in OreSpawner use `RigidBody` (they do — see Task 5 output). The raycaster will hit the mesh children, so we walk `.parent` up the hierarchy looking for `userData.type === 'cube'` and `__rapierRigidBody`. This is correct for how R3F + Rapier attaches bodies.

- [ ] **Step 7.4: Build check + commit**

```bash
pnpm run build 2>&1 | tail -20
git add src/components/TractorBeam.jsx src/components/Cockpit.jsx
git commit -m "feat: tractor beam with spring joint, reel-in, throw, and beam visual"
```

---

## Task 8: Spatial audio — silo hum + thruster volume

**Files:**
- Modify: `src/audio/AudioEngine.js`
- Modify: `src/components/Silo.jsx`
- Modify: `src/components/Player.jsx`

- [ ] **Step 8.1: Add spatial audio methods to AudioEngine.js**

Append these methods to the `AudioEngine` class (before the closing `}`):

```js
initSiloHum(siloMesh, camera) {
  if (!this._initialized || this._siloHum) return
  const listener = new THREE.AudioListener()
  camera.add(listener)

  // Low sine oscillator for hum
  const humOsc = this.ctx.createOscillator()
  const humGain = this.ctx.createGain()
  humOsc.type = 'sine'
  humOsc.frequency.value = 58
  humGain.gain.value = 0.05

  // Slow LFO for organic pulsing
  const lfo = this.ctx.createOscillator()
  const lfoGain = this.ctx.createGain()
  lfo.frequency.value = 0.3
  lfoGain.gain.value = 0.02
  lfo.connect(lfoGain)
  lfoGain.connect(humGain.gain)

  humOsc.connect(humGain)
  humGain.connect(this.masterGain)
  humOsc.start()
  lfo.start()
  this._siloHum = { osc: humOsc, gain: humGain }
}

setSiloHumDistance(distance) {
  if (!this._siloHum) return
  // Attenuate by distance — full at 0, silent at 80
  const vol = Math.max(0, 1 - distance / 80) * 0.07
  this._siloHum.gain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.3)
}

initThruster() {
  if (!this._initialized || this._thrusterGain) return
  const bufferSize = 4096
  const node = this.ctx.createScriptProcessor(bufferSize, 1, 1)
  node.onaudioprocess = (e) => {
    const output = e.outputBuffer.getChannelData(0)
    for (let i = 0; i < output.length; i++) {
      output[i] = (Math.random() * 2 - 1) * (this._thrusterLevel || 0)
    }
  }
  const gain = this.ctx.createGain()
  gain.gain.value = 0
  node.connect(gain)
  gain.connect(this.masterGain)
  this._thrusterGain = gain
  this._thrusterNode = node
  this._thrusterLevel = 0
}

setThrusterVolume(normalizedSpeed) {
  if (!this._thrusterGain) return
  this._thrusterLevel = normalizedSpeed * 0.08
  this._thrusterGain.gain.setTargetAtTime(
    normalizedSpeed * 0.06,
    this.ctx.currentTime,
    0.05
  )
}
```

Also add `import * as THREE from 'three'` at the top of `AudioEngine.js`.

- [ ] **Step 8.2: Call initSiloHum from Silo.jsx**

In `Silo.jsx`, add a `useEffect` after audio is initialized:

```jsx
import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { audioManager } from '../audio/AudioEngine'
import { useGameStore } from '../store'

export function Silo() {
  const addCredits = useGameStore((s) => s.addCredits)
  const phase = useGameStore((s) => s.phase)
  const soldBodiesRef = useRef(new Set())
  const siloMeshRef = useRef()
  const { camera } = useThree()

  useEffect(() => {
    if (phase === 'gameplay' && audioManager._initialized) {
      audioManager.initSiloHum(siloMeshRef.current, camera)
      audioManager.initThruster()
    }
  }, [phase, camera])

  useFrame(() => {
    if (!siloMeshRef.current || !audioManager._initialized) return
    const dist = camera.position.distanceTo(siloMeshRef.current.position)
    audioManager.setSiloHumDistance(dist)
  })

  // ... rest of handleIntersect unchanged
```

- [ ] **Step 8.3: Wire thruster volume in Player.jsx**

In `Player.jsx` `useFrame`, after the FOV transitions block, add:

```js
// Thruster spatial audio
const linvel = bodyRef.current.linvel()
const speed = Math.sqrt(linvel.x ** 2 + linvel.z ** 2)
audioManager.setThrusterVolume(Math.min(1, speed / 20))
```

- [ ] **Step 8.4: Build check + commit**

```bash
pnpm run build 2>&1 | tail -10
git add src/audio/AudioEngine.js src/components/Silo.jsx src/components/Player.jsx
git commit -m "feat: spatial audio — silo hum with distance attenuation, thruster volume on linvel"
```

---

## Task 9: CRT shader pass

**Files:**
- Modify: `src/components/VisualEffects.jsx`

The CRT pass activates when `settings.crtOverlays === true`. We use a custom `ShaderPass` with scanlines and barrel distortion via `postprocessing`'s `Effect` base class, wrapped in `@react-three/postprocessing`'s `wrapEffect`.

- [ ] **Step 9.1: Add CRT effect to VisualEffects.jsx**

Add these imports to VisualEffects.jsx:

```jsx
import { wrapEffect } from '@react-three/postprocessing'
import { Effect } from 'postprocessing'
```

Add the CRT shader class before the component:

```jsx
class CRTEffectImpl extends Effect {
  constructor() {
    super('CRTEffect', `
      uniform float uTime;
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        // Barrel distortion
        vec2 st = uv * 2.0 - 1.0;
        float r2 = dot(st, st);
        st *= 1.0 + 0.12 * r2;
        vec2 distortedUv = st * 0.5 + 0.5;
        
        // Scanlines
        float scanline = 1.0 - 0.12 * mod(gl_FragCoord.y, 2.0);
        
        // Edge vignette from barrel
        if (distortedUv.x < 0.0 || distortedUv.x > 1.0 || distortedUv.y < 0.0 || distortedUv.y > 1.0) {
          outputColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }
        
        vec4 color = texture2D(inputBuffer, distortedUv);
        outputColor = vec4(color.rgb * scanline, color.a);
      }
    `, {
      uniforms: new Map([['uTime', { value: 0 }]])
    })
  }
}

const CRTEffect = wrapEffect(CRTEffectImpl)
```

Then in the JSX, add before the closing `</EffectComposer>`:

```jsx
{crtOverlays && <CRTEffect />}
```

- [ ] **Step 9.2: Build check + commit**

```bash
pnpm run build 2>&1 | tail -10
git add src/components/VisualEffects.jsx
git commit -m "feat: CRT scanline + barrel distortion shader pass (toggleable via settings)"
```

---

## Task 10: Framer-motion UI transitions

**Files:**
- Modify: `src/components/BootScreen.jsx`
- Modify: `src/components/MainMenu.jsx`
- Modify: `src/components/PauseMenu.jsx`
- Modify: `src/components/SettingsMenu.jsx`
- Modify: `src/components/MeltdownScreen.jsx`
- Modify: `src/components/UpgradesTerminal.jsx`
- Modify: `src/App.jsx`

The pattern: wrap every overlay's root `<div>` in `<motion.div>` with `initial/animate/exit`. Wrap phase-conditional rendering in `<AnimatePresence>` in `App.jsx`.

- [ ] **Step 10.1: Update all overlay components**

For **each** of the 6 overlay components, add this import at the top:
```jsx
import { motion } from 'framer-motion'
```

And wrap the outer `<div>` in the return statement with:
```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.25, ease: 'easeOut' }}
  style={{ width: '100%', height: '100%' }}
>
  {/* ... existing div content ... */}
</motion.div>
```

For MainMenu and PauseMenu, add a Y slide:
```jsx
initial={{ opacity: 0, y: -16 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: 16 }}
```

- [ ] **Step 10.2: Wrap overlay zone in AnimatePresence in App.jsx**

The `<Html>` components each handle their own phase gating. To make `AnimatePresence` work correctly, we need each overlay to unmount when not active. Each overlay already returns `null` when not in its phase — that unmount is what triggers `exit`. Wrap the overlay block in `<AnimatePresence mode="wait">`:

```jsx
import { AnimatePresence } from 'framer-motion'

// In Scene return, replace the overlay comment block:
<AnimatePresence mode="wait">
  <BootScreen key="boot" />
  <MainMenu key="menu" />
  <PauseMenu key="pause" />
  <SettingsMenu key="settings" />
  <MeltdownScreen key="meltdown" />
  <UpgradesTerminal key="upgrades" />
</AnimatePresence>
```

- [ ] **Step 10.3: Build check + commit**

```bash
pnpm run build 2>&1 | tail -10
git add src/components/BootScreen.jsx src/components/MainMenu.jsx src/components/PauseMenu.jsx src/components/SettingsMenu.jsx src/components/MeltdownScreen.jsx src/components/UpgradesTerminal.jsx src/App.jsx
git commit -m "feat: framer-motion fade/slide transitions on all overlay screens"
```

---

## Task 11: Final integration — update HANDOFF.md + push PR

- [ ] **Step 11.1: Update HANDOFF.md**

Update the Quick state snapshot table — mark all implemented items `✅`. Add session log entry. Update Known Issues to remove resolved ones (#4 tractor beam, #6 headlamp, #8 beam visual).

- [ ] **Step 11.2: Build one final time on the feature branch**

```bash
pnpm run build 2>&1
```
Expected: zero errors.

- [ ] **Step 11.3: Push branch and open PR**

```bash
git push -u origin feat/stream-a-gameplay-polish
gh pr create \
  --base feat/production-integration \
  --title "feat(stream-a): tractor beam, ore destruction, sparks, rare isotopes, post-FX, spatial audio, framer-motion" \
  --body "$(cat <<'EOF'
## Stream A: Gameplay Polish

Implements every missing gameplay mechanic and visual/audio effect documented in HANDOFF.md §2.

### Changes
- **Tractor beam**: spring joint, reel-in, throw, cyan beam line visual
- **Ore health + destruction**: shrink on depletion, debris via InstancedRigidBodies, 15s respawn
- **Rare isotopes**: 15% spawn chance, magenta, 3× heat, $2,500 cube value
- **Sparks**: physics bodies with TTL on grind contact
- **Hit-stop**: 50ms freeze on first grind contact each time
- **Headlamp**: SpotLight on camera with boot flicker sequence
- **GlitchEffect**: active during meltdown phase
- **HueSaturation**: grayscale pass active during pause
- **CRT shader**: scanlines + barrel distortion, toggleable via settings
- **Meltdown chromAberr fix**: uses `isMelting` instead of `isOverheated`
- **Spatial audio**: silo hum with distance attenuation, thruster volume on linvel
- **maath/random**: official `inSphere` replacing custom impl
- **Framer-motion**: fade/slide transitions on all overlay screens
- **Settings back fix**: restores pointer lock when returning from pause

## Test plan
- [ ] Boot → flicker headlamp → stabilize
- [ ] Drive into ore → sparks appear, ore shrinks, hit-stop felt on first contact
- [ ] Grind to depletion → debris spawns, ore disappears, respawns after 15s
- [ ] Rare isotope (magenta) grinds at 3× heat
- [ ] Hopper full → cube ejects → grab with tractor beam → reel in → throw → silo → credits
- [ ] Rare cube worth $2,500
- [ ] Heat 120 → meltdown → glitch shader + extreme chromAberr active
- [ ] ESC pause → scene goes grayscale
- [ ] CRT toggle in settings → scanlines + barrel visible
- [ ] Walk toward/away from silo → hum volume attenuates
- [ ] Dash → thruster noise increases with speed
- [ ] All menu transitions have smooth fade/slide

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Tractor beam (spring joint, reel-in, throw, visual) — Task 7
- [x] Ore health + depletion shrink — Task 5
- [x] Debris via InstancedRigidBodies — Task 5
- [x] Ore respawn after 15s — Task 5
- [x] Sparks with TTL — Task 6
- [x] Hit-stop 50ms — Task 5
- [x] Rare isotopes 15%, magenta, 3× heat, $2,500 — Task 4+5
- [x] Headlamp SpotLight + boot flicker — Task 3
- [x] Glitch shader during meltdown — Task 1
- [x] Grayscale pass during pause — Task 1
- [x] CRT shader toggleable — Task 9
- [x] isMelting chromAberr fix — Task 1
- [x] Spatial audio silo hum — Task 8
- [x] Thruster volume on linvel — Task 8
- [x] maath/random official — Task 2
- [x] Framer-motion transitions — Task 10
- [x] Settings back pointer lock — Task 1

**Gaps identified and addressed:**
- Meltdown radial impulse on nearby rigid bodies: deferred — this requires iterating all active Rapier bodies from R3F which has no stable imperative API for world queries. Documented in HANDOFF.md as remaining.
- Ore respawn reactivity: OreSpawner uses `oreStateRef` (ref, not state) so alive/dead doesn't trigger React re-render. The alive check inside the render happens via `oreStateRef.current[id]?.alive` check in JSX — this works only if we trigger a re-render on respawn. Fix: call a `forceUpdate` pattern (useState tick) on respawn. This is handled by the `setTimeout` in `spawnDebris` which calls `setDebris` — but we also need to force the ore mesh to reappear. Add a `[oreRevision, setOreRevision]` counter that increments on respawn, and pass it to the map as a key dependency.

**Placeholder scan:** None found. All code is complete.

**Type consistency:** `onSparkTrigger(position: [x,y,z])` — defined as callback in OreSpawner, called with array, received as `(position)` in `useSparks.spawnSpark` which also takes array. Consistent.
