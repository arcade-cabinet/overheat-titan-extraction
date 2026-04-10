import { useFrame } from '@react-three/fiber'
import { BallCollider, InstancedRigidBodies, RigidBody } from '@react-three/rapier'
import { useCallback, useRef, useState } from 'react'
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
  const isPaused = useGameStore((s) => s.isPaused)
  const isOverheated = useGameStore((s) => s.isOverheated)
  const heat = useGameStore((s) => s.heat)
  const addOre = useGameStore((s) => s.addOre)
  const addHeat = useGameStore((s) => s.addHeat)
  const rawOre = useGameStore((s) => s.rawOre)
  const getMaxOre = useGameStore((s) => s.getMaxOre)
  const getGrindDps = useGameStore((s) => s.getGrindDps)
  const ejectCube = useGameStore((s) => s.ejectCube)

  const [cubes, setCubes] = useState([])
  const [debris, setDebris] = useState([])
  // Revision counter forces re-render when ore respawns
  const [oreRevision, setOreRevision] = useState(0)

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
    if (phase !== 'gameplay' || isPaused) return
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
          setOreRevision((r) => r + 1)
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
      setTimeout(() => {
        hitStopRef.current = false
      }, 50)
      wasGrindingRef.current = true
    } else if (!isGrinding) {
      wasGrindingRef.current = false
    }

    if (grindingOreCount > 0) {
      addOre(getGrindDps() * delta * grindingOreCount)

      // Drain ore health, trigger sparks, shrink mesh
      for (const { id, pos } of ORE_POSITIONS) {
        const oreState = oreStateRef.current[id]
        if (!oreState.alive) continue
        const dx = camera.position.x - pos[0]
        const dz = camera.position.z - pos[2]
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist < GRIND_RADIUS && !isOverheated) {
          const drain = getGrindDps() * delta
          oreStateRef.current[id].health -= drain

          if (onSparkTrigger) {
            onSparkTrigger([pos[0], pos[1] + 1, pos[2]])
          }

          const healthPct = Math.max(0, oreStateRef.current[id].health / MAX_ORE_HEALTH)
          if (oreScaleRefs.current[id]) {
            oreScaleRefs.current[id].scale.setScalar(0.3 + healthPct * 0.7)
          }

          if (oreStateRef.current[id].health <= 0) {
            oreStateRef.current[id].alive = false
            oreStateRef.current[id].respawnAt = now + ORE_RESPAWN_DELAY_MS
            spawnDebris(pos)
            setOreRevision((r) => r + 1)
          }
        }
      }

      if (now - lastGrindSoundAtRef.current >= 100) {
        audioManager.playGrind(Math.min(100, heat))
        lastGrindSoundAtRef.current = now
      }
    }

    if (heatOreCount > 0) {
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
      const hasRare = ORE_POSITIONS.some(({ id, pos }) => {
        if (!oreStateRef.current[id]) return false
        const dx = camera.position.x - pos[0]
        const dz = camera.position.z - pos[2]
        return Math.sqrt(dx * dx + dz * dz) < GRIND_RADIUS && oreStateRef.current[id].isRare
      })
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

  // oreRevision used as a dependency to force re-render of ore meshes
  void oreRevision

  return (
    <>
      {ORE_POSITIONS.map(({ id, pos }) => {
        const oreState = oreStateRef.current[id]
        if (!oreState?.alive) return null
        return (
          <RigidBody key={`${id}-${oreRevision}`} type="fixed" colliders={false} position={pos}>
            <BallCollider args={[1.5]} />
            <mesh
              ref={(el) => {
                if (el) oreScaleRefs.current[id] = el
              }}
            >
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
