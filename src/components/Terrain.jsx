import { HeightfieldCollider, RigidBody } from '@react-three/rapier'
import { useMemo } from 'react'
import { createNoise2D } from 'simplex-noise'
import * as THREE from 'three'

export function Terrain() {
  const size = 64
  const scale = 5

  const { heights, geometry } = useMemo(() => {
    const noise2D = createNoise2D()
    const heights = []

    for (let i = 0; i < size; i++) {
      const row = []
      for (let j = 0; j < size; j++) {
        const x = (i - size / 2) * scale
        const z = (j - size / 2) * scale
        const y =
          noise2D(x * 0.025, z * 0.025) * 7 +
          noise2D(x * 0.05, z * 0.05) * 3 +
          noise2D(x * 0.1, z * 0.1) * 1.5
        row.push(y)
      }
      heights.push(row)
    }

    const geo = new THREE.BufferGeometry()
    const positions = []
    const indices = []
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        positions.push((i - size / 2) * scale, heights[i][j], (j - size / 2) * scale)
      }
    }
    for (let i = 0; i < size - 1; i++) {
      for (let j = 0; j < size - 1; j++) {
        const a = i * size + j
        const b = a + 1
        const c = (i + 1) * size + j
        const d = c + 1
        indices.push(a, c, b, b, c, d)
      }
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    return { heights, geometry: geo }
  }, [])

  return (
    <RigidBody type="fixed" colliders={false}>
      <HeightfieldCollider
        args={[
          size - 1,
          size - 1,
          heights.flat(),
          { x: scale * (size - 1), y: 1, z: scale * (size - 1) },
        ]}
        position={[0, 0, 0]}
      />
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color="#1a1f24" roughness={0.9} metalness={0.1} />
      </mesh>
    </RigidBody>
  )
}
