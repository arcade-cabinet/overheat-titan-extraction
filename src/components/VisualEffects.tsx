import { useFrame } from '@react-three/fiber'
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  HueSaturation,
  Vignette,
} from '@react-three/postprocessing'
import { useTrait } from 'koota/react'
import { BlendFunction } from 'postprocessing'
import { useMemo } from 'react'
import * as THREE from 'three'
import { GlobalState, Heat } from '../ecs/traits'
import { GameStateEntity } from '../ecs/world'

export function VisualEffects() {
  const heat = useTrait(GameStateEntity, Heat)?.value ?? 0
  const isOverheated = useTrait(GameStateEntity, Heat)?.overheated
  const isMelting = useTrait(GameStateEntity, Heat)?.melting
  const isPaused = useTrait(GameStateEntity, GlobalState)?.isPaused

  // Stable offset vector — mutated in useFrame, avoids JSON.stringify issues
  const chromOffset = useMemo(() => new THREE.Vector2(0.001, 0.001), [])

  useFrame(() => {
    const t = performance.now() / 1000
    if (isMelting) {
      const tear = 0.02 + Math.sin(t * 30) * 0.015
      chromOffset.set(tear, tear * 0.7)
      return
    }
    const heatFactor = Math.max(0, (heat - 50) / 50)
    const pulse = isOverheated ? Math.sin(t * Math.PI * 20) * 0.005 : 0
    const offset = 0.001 + heatFactor * 0.004 + pulse
    chromOffset.set(offset, offset)
  })

  return (
    <EffectComposer enableNormalPass={false}>
      <Bloom
        luminanceThreshold={0.6}
        mipmapBlur
        intensity={1.5}
        blendFunction={BlendFunction.ADD}
      />
      <ChromaticAberration offset={chromOffset} blendFunction={BlendFunction.NORMAL} />
      <Vignette
        eskil={false}
        offset={0.1}
        darkness={isMelting ? 1.5 : isOverheated ? 1.3 : 1.1}
        blendFunction={BlendFunction.NORMAL}
      />
      <HueSaturation saturation={isPaused ? -1.0 : 0} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  )
}
