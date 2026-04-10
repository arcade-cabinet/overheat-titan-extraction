import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import gameConfig from '../config.json'

const MAX_SPARKS = gameConfig.sparks.maxLive
const TTL = gameConfig.sparks.ttlMs / 1000
const MIN_IMPULSE = gameConfig.sparks.minImpulse
const MAX_IMPULSE = gameConfig.sparks.maxImpulse

// Module-scope reusable objects — no per-frame allocation
const _dummy = new THREE.Object3D()
const _color = new THREE.Color()

function randVel() {
  return (
    (Math.random() - 0.5) * (MAX_IMPULSE - MIN_IMPULSE) +
    MIN_IMPULSE * Math.sign(Math.random() - 0.5)
  )
}

/**
 * Instanced spark particle system — no physics bodies, pure CPU simulation.
 * Call triggerRef.current(pos) to emit a burst of sparks at a world position.
 */
export function Sparks({ triggerRef }) {
  const meshRef = useRef()
  const sparks = useRef([]) // { pos: THREE.Vector3, vel: THREE.Vector3, ttl: number, life: number }

  // Expose spawn function via ref — called from OreSpawner during grind
  if (triggerRef) {
    triggerRef.current = (pos) => {
      const count = 4 + Math.floor(Math.random() * 5) // 4-8 sparks per burst
      for (let i = 0; i < count; i++) {
        if (sparks.current.length >= MAX_SPARKS) {
          sparks.current.shift() // drop oldest
        }
        sparks.current.push({
          pos: new THREE.Vector3(
            pos.x + (Math.random() - 0.5) * 0.5,
            pos.y + Math.random() * 0.5,
            pos.z + (Math.random() - 0.5) * 0.5
          ),
          vel: new THREE.Vector3(randVel(), Math.random() * MAX_IMPULSE, randVel()),
          ttl: TTL * (0.5 + Math.random() * 0.5),
          life: TTL * (0.5 + Math.random() * 0.5),
        })
      }
    }
  }

  useFrame((_, delta) => {
    if (!meshRef.current) return

    // Age and move sparks
    sparks.current = sparks.current.filter((s) => {
      s.ttl -= delta
      s.vel.y -= 9.81 * delta // gravity
      s.pos.addScaledVector(s.vel, delta)
      return s.ttl > 0
    })

    // Update instanced mesh
    const count = sparks.current.length
    for (let i = 0; i < MAX_SPARKS; i++) {
      if (i < count) {
        const s = sparks.current[i]
        _dummy.position.copy(s.pos)
        const scale = (s.ttl / s.life) * 0.08 + 0.01
        _dummy.scale.setScalar(scale)
        _dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, _dummy.matrix)
        // Hot white → orange fade
        const t = s.ttl / s.life
        _color.setRGB(1, 0.3 + 0.5 * t, 0.05 * t)
        meshRef.current.setColorAt(i, _color)
      } else {
        // Hide unused slots by placing far below scene
        _dummy.position.set(0, -1000, 0)
        _dummy.scale.setScalar(0)
        _dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, _dummy.matrix)
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, MAX_SPARKS]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  )
}
