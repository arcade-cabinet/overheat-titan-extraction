import { useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

function inSphere(count, radius) {
  const arr = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = radius * Math.cbrt(Math.random())
    arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    arr[i * 3 + 2] = r * Math.cos(phi)
  }
  return arr
}

export function AmbientSpores() {
  const [sphere] = useState(() => inSphere(1500, 120))
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
