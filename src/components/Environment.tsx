import { Stars } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useTrait } from 'koota/react'
import { useRef } from 'react'
import type * as THREE from 'three'
import { gameConfig } from '../config'
import { GlobalState } from '../ecs/traits'
import { GameStateEntity } from '../ecs/world'

export function Environment() {
  const globalState = useTrait(GameStateEntity, GlobalState)
  const phase = globalState?.phase
  const envIndex = globalState?.envIndex ?? 0
  const envCfg = gameConfig.environments[envIndex % gameConfig.environments.length]
  const ambRef = useRef<THREE.AmbientLight>(null)

  useFrame(() => {
    if (!ambRef.current) return
    if (phase === 'powered_down' || phase === 'boot') {
      ambRef.current.intensity = envCfg.bootAmbient
    } else {
      ambRef.current.intensity = envCfg.baseAmbient
    }
  })

  return (
    <>
      <ambientLight ref={ambRef} intensity={envCfg.baseAmbient} color={envCfg.ambientColor} />
      <directionalLight
        position={[-50, 30, -50]}
        intensity={envCfg.directionalLightIntensity}
        color={envCfg.directionalColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <fog attach="fog" args={[envCfg.fogColor, envCfg.fogNear, envCfg.fogFar]} />
      <Stars radius={200} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
    </>
  )
}
