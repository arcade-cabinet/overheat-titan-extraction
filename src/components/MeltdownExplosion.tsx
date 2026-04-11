import { useFrame } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import { useTrait } from 'koota/react'
import { useRef } from 'react'
import * as THREE from 'three'
import { Heat } from '../ecs/traits'
import { GameStateEntity } from '../ecs/world'

export function MeltdownExplosion() {
  const isMelting = useTrait(GameStateEntity, Heat)?.melting
  const { rapier, world } = useRapier()
  const explodedRef = useRef(false)

  useFrame(({ camera }) => {
    if (isMelting && !explodedRef.current) {
      explodedRef.current = true

      const center = camera.position.clone()
      center.y = 0 // Apply impulse mostly outwards from ground level

      world.forEachRigidBody((body) => {
        if (body.bodyType() === rapier.RigidBodyType.Dynamic) {
          const pos = body.translation()
          const dx = pos.x - center.x
          const dy = pos.y - center.y
          const dz = pos.z - center.z
          const distSq = dx * dx + dy * dy + dz * dz

          if (distSq < 900 && distSq > 0.01) {
            // 30 units radius
            const dist = Math.sqrt(distSq)
            const force = (1 - dist / 30) * 150 // Strong radial impulse
            const dir = new THREE.Vector3(dx, dy, dz).normalize()
            body.applyImpulse(
              {
                x: dir.x * force,
                y: Math.max(2, dir.y * force + force * 0.5), // Upward bias
                z: dir.z * force,
              },
              true
            )
          }
        }
      })
    } else if (!isMelting) {
      explodedRef.current = false
    }
  })

  return null
}
