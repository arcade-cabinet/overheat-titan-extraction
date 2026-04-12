import { a, useSprings } from '@react-spring/three'
import { useFrame } from '@react-three/fiber'
import { BallCollider, InstancedRigidBodies, RigidBody } from '@react-three/rapier'
import { useTrait } from 'koota/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import gameConfig from '../config.json'
import { gameActions, gameSelectors } from '../ecs/actions'
import { GlobalState, Heat, Hopper } from '../ecs/traits'
import { GameStateEntity } from '../ecs/world'

const RARE_SPAWN_CHANCE = gameConfig.ore.rareSpawnChance
const DENSE_SPAWN_CHANCE = gameConfig.ore.denseSpawnChance
const MAX_ORE_HEALTH = gameConfig.ore.maxHealth
const DENSE_HEALTH_MULT = gameConfig.ore.denseHealthMultiplier
const ORE_RESPAWN_DELAY_MS = gameConfig.ore.respawnDelayMs
const GRIND_RADIUS = gameConfig.ore.grindRadius
const MAX_DEBRIS = gameConfig.debris.count

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

function makeOreType() {
  const r = Math.random()
  if (r < RARE_SPAWN_CHANCE) return 'rare'
  if (r < RARE_SPAWN_CHANCE + DENSE_SPAWN_CHANCE) return 'dense'
  return 'normal'
}

function buildOreState() {
  const state: any = {}
  for (const { id } of ORE_POSITIONS) {
    const type = makeOreType()
    state[id] = {
      type,
      isRare: type === 'rare',
      health: type === 'dense' ? MAX_ORE_HEALTH * DENSE_HEALTH_MULT : MAX_ORE_HEALTH,
      maxHealth: type === 'dense' ? MAX_ORE_HEALTH * DENSE_HEALTH_MULT : MAX_ORE_HEALTH,
      alive: true,
      isDying: false,
      respawnAt: null,
    }
  }
  return state
}

export function OreSpawner({
  onSparkTrigger,
}: {
  onSparkTrigger?: (pos: [number, number, number]) => void
}) {
  const phase = useTrait(GameStateEntity, GlobalState)?.phase
  const isPaused = useTrait(GameStateEntity, GlobalState)?.isPaused
  const isOverheated = useTrait(GameStateEntity, Heat)?.overheated

  const addOre = gameActions.addOre
  const addHeat = gameActions.addHeat
  const rawOre = useTrait(GameStateEntity, Hopper)?.current ?? 0
  const getMaxOre = gameSelectors.getMaxOre
  const getGrindDps = gameSelectors.getGrindDps
  const ejectCube = gameActions.ejectCube

  const [cubes, setCubes] = useState<
    { id: number; position: [number, number, number]; isRare: boolean; value: number }[]
  >([])
  const [debris, setDebris] = useState<
    { id: string; positions: [number, number, number][]; impulses: [number, number, number][] }[]
  >([])
  // Revision counter forces re-render when ore respawns
  const [oreRevision, setOreRevision] = useState(0)

  const [springs, api] = useSprings(ORE_POSITIONS.length, () => ({
    scale: 1,
    config: { tension: 170, friction: 26 },
  }))

  const oreStateRef = useRef<
    Record<
      string,
      {
        type: string
        isRare: boolean
        health: number
        maxHealth: number
        alive: boolean
        isDying: boolean
        respawnAt: number | null
      }
    >
  >(buildOreState())
  const lastGrindSoundAtRef = useRef(0)
  const lastSparkAtRef = useRef(0)
  const nextDebrisIdRef = useRef(0)
  const ejectionPendingRef = useRef(false)
  const hitStopRef = useRef(false)
  const hitStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasGrindingRef = useRef(false)
  const removeDebrisTimeout = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Pending state mutations from useFrame — flushed via setTimeout to stay outside render
  const pendingActionsRef = useRef<Array<() => void>>([])
  const flushScheduledRef = useRef(false)

  // Cleanup all pending timeouts on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (hitStopTimerRef.current) clearTimeout(hitStopTimerRef.current)
      for (const id of Object.keys(removeDebrisTimeout.current)) {
        clearTimeout(removeDebrisTimeout.current[id])
      }
    }
  }, [])

  // Queue a setState action for deferred execution (out of useFrame render cycle)
  const scheduleAction = useCallback((fn: any) => {
    pendingActionsRef.current.push(fn)
    if (!flushScheduledRef.current) {
      flushScheduledRef.current = true
      setTimeout(() => {
        const actions = pendingActionsRef.current.splice(0)
        for (const action of actions) action()
        flushScheduledRef.current = false
      }, 0)
    }
  }, [])

  const spawnDebris = useCallback(
    (pos: [number, number, number], count = MAX_DEBRIS) => {
      const debrisId = `debris-${nextDebrisIdRef.current++}`
      const positions: [number, number, number][] = []
      const impulses: [number, number, number][] = []
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
      scheduleAction(() => {
        setDebris((prev) => [...prev, { id: debrisId, positions, impulses }])
        removeDebrisTimeout.current[debrisId] = setTimeout(() => {
          setDebris((prev) => prev.filter((d) => d.id !== debrisId))
          delete removeDebrisTimeout.current[debrisId]
        }, gameConfig.debris.ttlMs)
      })
    },
    [scheduleAction]
  )

  useFrame(({ camera }, delta) => {
    if (phase !== 'gameplay' || isPaused) return
    if (rawOre === 0) ejectionPendingRef.current = false

    // Hit-stop: freeze this frame
    if (hitStopRef.current) return

    let grindingOreCount = 0
    let heatOreCount = 0
    const now = performance.now()

    for (let index = 0; index < ORE_POSITIONS.length; index++) {
      const { id, pos } = ORE_POSITIONS[index]
      const oreState = oreStateRef.current[id]
      if (!oreState.alive) {
        // Respawn check
        if (oreState.respawnAt && now >= oreState.respawnAt) {
          const type = makeOreType()
          oreStateRef.current[id] = {
            isRare: type === 'rare',
            type,
            health: type === 'dense' ? MAX_ORE_HEALTH * DENSE_HEALTH_MULT : MAX_ORE_HEALTH,
            maxHealth: type === 'dense' ? MAX_ORE_HEALTH * DENSE_HEALTH_MULT : MAX_ORE_HEALTH,
            alive: true,
            isDying: false,
            respawnAt: null,
          }
          api.start((i) => {
            if (i === index)
              return {
                from: { scale: 0 },
                to: { scale: 1 },
                immediate: false,
                config: { tension: 170, friction: 26 },
              }
            return {}
          })
          scheduleAction(() => setOreRevision((r) => r + 1))
        }
        continue
      }

      if (oreState.isDying) continue

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
      if (hitStopTimerRef.current) clearTimeout(hitStopTimerRef.current)
      hitStopTimerRef.current = setTimeout(() => {
        hitStopRef.current = false
        hitStopTimerRef.current = null
      }, 50)
      wasGrindingRef.current = true
    } else if (!isGrinding) {
      wasGrindingRef.current = false
    }

    if (grindingOreCount > 0) {
      addOre(getGrindDps() * delta * grindingOreCount)

      // Drain ore health, trigger sparks, shrink mesh
      for (let index = 0; index < ORE_POSITIONS.length; index++) {
        const { id, pos } = ORE_POSITIONS[index]
        const oreState = oreStateRef.current[id]
        if (!oreState.alive || oreState.isDying) continue
        const dx = camera.position.x - pos[0]
        const dz = camera.position.z - pos[2]
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist < GRIND_RADIUS && !isOverheated) {
          const drain = getGrindDps() * delta
          oreStateRef.current[id].health -= drain

          // Throttle spark spawns — max 5 per second to avoid timer flood
          if (onSparkTrigger && now - lastSparkAtRef.current >= 200) {
            lastSparkAtRef.current = now
            onSparkTrigger([pos[0], pos[1] + 1, pos[2]])
          }

          const healthPct = Math.max(
            0,
            oreStateRef.current[id].health / oreStateRef.current[id].maxHealth
          )

          if (oreStateRef.current[id].health > 0) {
            api.start((i) => {
              if (i === index) return { scale: 0.3 + healthPct * 0.7, immediate: true }
              return {}
            })
          } else {
            oreStateRef.current[id].isDying = true
            api.start((i) => {
              if (i === index) {
                return {
                  scale: 0,
                  immediate: false,
                  config: { tension: 300, friction: 20 },
                  onRest: () => {
                    oreStateRef.current[id].alive = false
                    oreStateRef.current[id].isDying = false
                    oreStateRef.current[id].respawnAt = performance.now() + ORE_RESPAWN_DELAY_MS
                    spawnDebris(pos as [number, number, number])
                    scheduleAction(() => setOreRevision((r) => r + 1))
                  },
                }
              }
              return {}
            })
          }
        }
      }

      if (now - lastGrindSoundAtRef.current >= gameConfig.mech.grind.soundIntervalMs) {
        lastGrindSoundAtRef.current = now
      }
    }

    if (heatOreCount > 0) {
      let heatRate = 0
      for (let index = 0; index < ORE_POSITIONS.length; index++) {
        const { id, pos } = ORE_POSITIONS[index]
        if (!oreStateRef.current[id].alive || oreStateRef.current[id].isDying) continue
        const dx = camera.position.x - pos[0]
        const dz = camera.position.z - pos[2]
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist < GRIND_RADIUS) {
          heatRate += oreStateRef.current[id].isRare
            ? gameConfig.mech.heat.perSecondGrinding * gameConfig.mech.heat.rareMultiplier
            : gameConfig.mech.heat.perSecondGrinding
        }
      }
      addHeat(heatRate * delta)
    }

    if (rawOre >= getMaxOre() && !ejectionPendingRef.current) {
      ejectionPendingRef.current = true
      const hasRare = ORE_POSITIONS.some(({ id, pos }) => {
        if (!oreStateRef.current[id]) return false
        const dx = camera.position.x - pos[0]
        const dz = camera.position.z - pos[2]
        return (
          Math.sqrt(dx * dx + dz * dz) < GRIND_RADIUS && oreStateRef.current[id].type === 'rare'
        )
      })
      const cubePos: [number, number, number] = [
        camera.position.x + (Math.random() - 0.5) * 4,
        camera.position.y,
        camera.position.z + (Math.random() - 0.5) * 4,
      ]
      scheduleAction(() => {
        setCubes((prev) => [
          ...prev,
          {
            id: Date.now(),
            position: cubePos,
            isRare: hasRare,
            value: hasRare ? gameConfig.economy.rareCubeValue : gameConfig.economy.cubeValue,
          },
        ])
        ejectCube()
      })
    }
  })

  return (
    <>
      {ORE_POSITIONS.map(({ id, pos }, index) => {
        const oreState = oreStateRef.current[id]
        if (!oreState?.alive) return null
        return (
          <RigidBody
            key={`${id}-${oreRevision}`}
            type="fixed"
            colliders={false}
            position={pos as [number, number, number]}
          >
            <BallCollider args={[1.5]} />
            <a.mesh scale={springs[index].scale}>
              <sphereGeometry args={[1.5, 12, 12]} />
              <meshStandardMaterial
                color={oreState.isRare ? '#ff00ff' : '#00ffcc'}
                emissive={oreState.isRare ? '#ff00ff' : '#00ffcc'}
                emissiveIntensity={oreState.isRare ? 0.7 : 0.4}
              />
              {oreState.isRare && <pointLight color="#ff00ff" intensity={5} distance={15} />}
            </a.mesh>
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
            // Pass initial linvel via linearVelocity — applied by Rapier on spawn
            linearVelocity: d.impulses[i] ?? [0, 0, 0],
          }))}
          colliders="ball"
        >
          <instancedMesh args={[null as any, null as any, d.positions.length]}>
            <sphereGeometry args={[0.18, 6, 6]} />
            <meshStandardMaterial
              color={new THREE.Color('#555')}
              emissive={new THREE.Color('#333')}
              roughness={0.9}
            />
          </instancedMesh>
        </InstancedRigidBodies>
      ))}
    </>
  )
}
