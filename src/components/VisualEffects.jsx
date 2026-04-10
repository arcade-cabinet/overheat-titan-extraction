import { useFrame } from '@react-three/fiber'
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useRef } from 'react'
import { useGameStore } from '../store'

export function VisualEffects() {
  const heat = useGameStore((s) => s.heat)
  const isOverheated = useGameStore((s) => s.isOverheated)
  const chromRef = useRef()

  useFrame(({ clock }) => {
    if (!chromRef.current) return
    const heatFactor = Math.max(0, (heat - 50) / 50)
    const pulse = isOverheated ? Math.sin(clock.elapsedTime * 10) * 0.005 : 0
    const offset = 0.001 + heatFactor * 0.004 + pulse
    chromRef.current.offset.set(offset, offset)
  })

  return (
    <EffectComposer disableNormalPass>
      <Bloom
        luminanceThreshold={0.6}
        mipmapBlur
        intensity={1.5}
        blendFunction={BlendFunction.ADD}
      />
      <ChromaticAberration ref={chromRef} blendFunction={BlendFunction.NORMAL} />
      <Vignette
        eskil={false}
        offset={0.1}
        darkness={isOverheated ? 1.3 : 1.1}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}
