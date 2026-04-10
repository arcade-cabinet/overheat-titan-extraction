import { PointMaterial, Points } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as random from 'maath/random/dist/maath-random.esm.js'
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
