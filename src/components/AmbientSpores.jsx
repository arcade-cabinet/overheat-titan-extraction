import { PointMaterial, Points } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as random from 'maath/random'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../store'

export function AmbientSpores() {
  const [sphere] = useState(() => random.inSphere(new Float32Array(4500), { radius: 120 }))
  const pointsRef = useRef()
  const phase = useGameStore((s) => s.phase)
  const isPaused = useGameStore((s) => s.isPaused)

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    if (isPaused || phase !== 'gameplay') return
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
