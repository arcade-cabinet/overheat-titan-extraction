import { useFrame } from '@react-three/fiber'
import { BallCollider, RigidBody } from '@react-three/rapier'
import { useRef, useState } from 'react'
import { audioManager } from '../audio/AudioEngine'
import { useGameStore } from '../store'

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

export function OreSpawner() {
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
  const lastGrindSoundAtRef = useRef(0)
  const ejectionPendingRef = useRef(false)

  useFrame(({ camera }, delta) => {
    if (phase !== 'gameplay') return

    // Reset ejection guard once rawOre is cleared by ejectCube()
    if (rawOre === 0) ejectionPendingRef.current = false

    // Count ore veins in grind range — split into two counts so heat
    // keeps rising even when overheated (enabling the meltdown path at 120).
    let grindingOreCount = 0 // ore extraction — blocked when overheated
    let heatOreCount = 0 // heat accumulation — always active near ore

    ORE_POSITIONS.forEach(({ pos: orePos }) => {
      const dx = camera.position.x - orePos[0]
      const dz = camera.position.z - orePos[2]
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < 5) {
        heatOreCount += 1
        if (!isOverheated) grindingOreCount += 1
      }
    })

    if (grindingOreCount > 0) {
      addOre(getGrindDps() * delta * grindingOreCount)
      const now = performance.now()
      if (now - lastGrindSoundAtRef.current >= 100) {
        audioManager.playGrind(Math.min(100, heat))
        lastGrindSoundAtRef.current = now
      }
    }

    if (heatOreCount > 0) {
      addHeat(15 * delta * heatOreCount)
    }

    // Guard against split-frame double-spawn when rawOre hits the cap
    if (rawOre >= getMaxOre() && !ejectionPendingRef.current) {
      ejectionPendingRef.current = true
      const cubePos = [
        camera.position.x + (Math.random() - 0.5) * 4,
        camera.position.y,
        camera.position.z + (Math.random() - 0.5) * 4,
      ]
      setCubes((prev) => [...prev, { id: Date.now(), position: cubePos }])
      ejectCube()
    }
  })

  return (
    <>
      {ORE_POSITIONS.map(({ id, pos }) => (
        <RigidBody key={id} type="fixed" colliders={false} position={pos}>
          <BallCollider args={[1.5]} />
          <mesh>
            <sphereGeometry args={[1.5, 12, 12]} />
            <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={0.4} />
          </mesh>
        </RigidBody>
      ))}
      {cubes.map((cube) => (
        <RigidBody
          key={cube.id}
          colliders="cuboid"
          position={cube.position}
          userData={{
            type: 'cube',
            id: cube.id,
            onSell: () => setCubes((prev) => prev.filter((entry) => entry.id !== cube.id)),
          }}
        >
          <mesh>
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={0.5} />
          </mesh>
        </RigidBody>
      ))}
    </>
  )
}
