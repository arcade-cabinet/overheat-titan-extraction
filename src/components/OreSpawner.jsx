import { useFrame } from '@react-three/fiber'
import { BallCollider, RigidBody } from '@react-three/rapier'
import { useRef, useState } from 'react'
import { audioManager } from '../audio/AudioEngine'
import gameConfig from '../config.json'
import { useGameStore } from '../store'

const { rareSpawnChance, grindRadius } = gameConfig.ore
const { perSecondGrinding, rareMultiplier } = gameConfig.mech.heat
const { cubeValue, rareCubeValue } = gameConfig.economy

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

function makeRarity() {
  return Math.random() < rareSpawnChance
}

function buildOreState() {
  const state = {}
  for (const { id } of ORE_POSITIONS) {
    state[id] = { isRare: makeRarity() }
  }
  return state
}

export function OreSpawner({ sparkTriggerRef }) {
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
  const lastGrindSoundAtRef = useRef(0)
  const lastSparkAtRef = useRef(0)
  const ejectionPendingRef = useRef(false)
  // Rare ore state — re-randomised each session (module-level buildOreState call)
  const oreStateRef = useRef(buildOreState())

  useFrame(({ camera }, delta) => {
    if (phase !== 'gameplay' || isPaused) return

    // Reset ejection guard once rawOre is cleared by ejectCube()
    if (rawOre === 0) ejectionPendingRef.current = false

    // Count ore veins in grind range — split into two counts so heat
    // keeps rising even when overheated (enabling the meltdown path at 120).
    let grindingOreCount = 0 // ore extraction — blocked when overheated
    let heatGeneration = 0 // heat accumulation — always active near ore
    let anyRare = false // tracks whether currently grinding any rare ore

    for (const { id, pos: orePos } of ORE_POSITIONS) {
      const dx = camera.position.x - orePos[0]
      const dz = camera.position.z - orePos[2]
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < grindRadius) {
        const isRare = oreStateRef.current[id].isRare
        const heatRate = isRare ? perSecondGrinding * rareMultiplier : perSecondGrinding
        heatGeneration += heatRate
        if (!isOverheated) {
          grindingOreCount += 1
          if (isRare) anyRare = true
        }
      }
    }

    if (grindingOreCount > 0) {
      addOre(getGrindDps() * delta * grindingOreCount)
      const now = performance.now()
      if (now - lastGrindSoundAtRef.current >= 100) {
        audioManager.playGrind(Math.min(100, heat))
        lastGrindSoundAtRef.current = now
      }
      // Fire spark burst every ~80ms while grinding
      if (sparkTriggerRef?.current && now - lastSparkAtRef.current >= 80) {
        lastSparkAtRef.current = now
        sparkTriggerRef.current(camera.position)
      }
    }

    if (heatGeneration > 0) {
      addHeat(heatGeneration * delta)
    }

    // Guard against split-frame double-spawn when rawOre hits the cap
    if (rawOre >= getMaxOre() && !ejectionPendingRef.current) {
      ejectionPendingRef.current = true
      const cubePos = [
        camera.position.x + (Math.random() - 0.5) * 4,
        camera.position.y,
        camera.position.z + (Math.random() - 0.5) * 4,
      ]
      setCubes((prev) => [...prev, { id: Date.now(), position: cubePos, isRare: anyRare }])
      ejectCube()
    }
  })

  return (
    <>
      {ORE_POSITIONS.map(({ id, pos }) => {
        const isRare = oreStateRef.current[id].isRare
        const color = isRare ? '#ff6600' : '#00ffcc'
        const emissiveIntensity = isRare ? 0.8 : 0.4
        return (
          <RigidBody key={id} type="fixed" colliders={false} position={pos}>
            <BallCollider args={[1.5]} />
            <mesh>
              <sphereGeometry args={[1.5, 12, 12]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={emissiveIntensity}
              />
            </mesh>
          </RigidBody>
        )
      })}
      {cubes.map((cube) => {
        const cubeColor = cube.isRare ? '#ff6600' : '#ffaa00'
        const cubeEmissive = cube.isRare ? '#ff3300' : '#ffaa00'
        const sellValue = cube.isRare ? rareCubeValue : cubeValue
        return (
          <RigidBody
            key={cube.id}
            colliders="cuboid"
            position={cube.position}
            userData={{
              type: 'cube',
              id: cube.id,
              isRare: cube.isRare,
              sellValue,
              onSell: () => setCubes((prev) => prev.filter((entry) => entry.id !== cube.id)),
            }}
          >
            <mesh>
              <boxGeometry args={[1.5, 1.5, 1.5]} />
              <meshStandardMaterial
                color={cubeColor}
                emissive={cubeEmissive}
                emissiveIntensity={cube.isRare ? 1.2 : 0.5}
              />
            </mesh>
          </RigidBody>
        )
      })}
    </>
  )
}
