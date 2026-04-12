import { PointMaterial, Points } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useTrait } from 'koota/react'
import * as random from 'maath/random'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { gameConfig } from '../config'
import { GlobalState } from '../ecs/traits'
import { GameStateEntity } from '../ecs/world'

export function AmbientSpores() {
  const [sphere] = useState(
    () => random.inSphere(new Float32Array(4500), { radius: 120 }) as Float32Array
  )
  const pointsRef = useRef<THREE.Points>(null)

  const globalState = useTrait(GameStateEntity, GlobalState)
  const phase = globalState?.phase
  const isPaused = globalState?.isPaused
  const envIndex = globalState?.envIndex ?? 0
  const sporeColor = gameConfig.environments[envIndex % gameConfig.environments.length].sporeColor

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
          color={sporeColor}
          size={0.25}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  )
}
