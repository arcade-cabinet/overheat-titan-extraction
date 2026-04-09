import { useRef } from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { useGameStore } from '../store'
import { audioManager } from '../audio/AudioEngine'
import * as THREE from 'three'

export function Silo() {
  const addCredits = useGameStore((s) => s.addCredits)

  const handleIntersect = (e) => {
    const other = e.other.rigidBody
    if (!other) return
    addCredits(50)
    audioManager.playSell()
  }

  return (
    <group position={[0, 0, 0]}>
      {/* Base cylinder */}
      <RigidBody type="fixed" colliders="hull">
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[3, 3, 3, 16]} />
          <meshStandardMaterial color="#0f1418" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Extraction beam */}
      <mesh position={[0, 30, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 60, 16, 1, true]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.15} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Sensor for cube collection */}
      <RigidBody type="fixed" sensor onIntersectionEnter={handleIntersect}>
        <CuboidCollider args={[3, 10, 3]} position={[0, 10, 0]} />
      </RigidBody>
    </group>
  )
}
