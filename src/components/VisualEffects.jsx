import { useFrame } from '@react-three/fiber'
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Glitch,
  HueSaturation,
  Scanline,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction, GlitchMode } from 'postprocessing'
import { useRef } from 'react'
import { useGameStore } from '../store'

export function VisualEffects() {
  const heat = useGameStore((s) => s.heat)
  const isOverheated = useGameStore((s) => s.isOverheated)
  const isMelting = useGameStore((s) => s.isMelting)
  const isPaused = useGameStore((s) => s.isPaused)
  const crtOverlays = useGameStore((s) => s.settings.crtOverlays)
  const chromRef = useRef()

  useFrame(({ clock }) => {
    if (!chromRef.current) return
    const heatFactor = Math.max(0, (heat - 50) / 50)
    const pulse = isOverheated ? Math.sin(clock.elapsedTime * Math.PI * 20) * 0.005 : 0
    const offset = 0.001 + heatFactor * 0.004 + pulse
    chromRef.current.offset.set(offset, offset)
  })

  const vignetteDarkness = isMelting ? 1.5 : isOverheated ? 1.3 : 1.1

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
        darkness={vignetteDarkness}
        blendFunction={BlendFunction.NORMAL}
      />
      {isPaused && <HueSaturation saturation={-1} blendFunction={BlendFunction.NORMAL} />}
      {isMelting && (
        <Glitch
          delay={[0.05, 0.1]}
          duration={[0.1, 0.3]}
          strength={[0.05, 0.2]}
          mode={GlitchMode.SPORADIC}
          active
          ratio={0.85}
        />
      )}
      {crtOverlays && (
        <Scanline density={1.25} opacity={0.15} blendFunction={BlendFunction.OVERLAY} />
      )}
    </EffectComposer>
  )
}
