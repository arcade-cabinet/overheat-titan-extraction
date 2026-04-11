import { useFrame } from '@react-three/fiber'
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Glitch,
  HueSaturation,
  Vignette,
  wrapEffect,
} from '@react-three/postprocessing'
import { BlendFunction, Effect, GlitchMode } from 'postprocessing'
import { useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../store'

class CRTEffectImpl extends Effect {
  constructor() {
    super(
      'CRTEffect',
      `
      uniform float uTime;
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        // Barrel distortion
        vec2 st = uv * 2.0 - 1.0;
        float r2 = dot(st, st);
        st *= 1.0 + 0.12 * r2;
        vec2 distortedUv = st * 0.5 + 0.5;

        // Scanlines
        float scanline = 1.0 - 0.12 * mod(gl_FragCoord.y, 2.0);

        // Edge vignette from barrel
        if (distortedUv.x < 0.0 || distortedUv.x > 1.0 || distortedUv.y < 0.0 || distortedUv.y > 1.0) {
          outputColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }

        vec4 color = texture2D(inputBuffer, distortedUv);
        outputColor = vec4(color.rgb * scanline, color.a);
      }
    `,
      {
        uniforms: new Map([['uTime', new THREE.Uniform(0)]]),
      }
    )
  }
}

const CRTEffect = wrapEffect(CRTEffectImpl)

export function VisualEffects() {
  const heat = useGameStore((s) => s.heat)
  const isOverheated = useGameStore((s) => s.isOverheated)
  const isMelting = useGameStore((s) => s.isMelting)
  const isPaused = useGameStore((s) => s.isPaused)
  const crtOverlays = useGameStore((s) => s.settings.crtOverlays)

  // The ChromaticAberration effect component doesn't expose the offset prop in its Ref type properly in all versions
  const chromRef = useRef<any>(null)

  useFrame(() => {
    if (!chromRef.current?.offset) return
    const t = performance.now() / 1000
    if (isMelting) {
      // Extreme aberration during meltdown
      const tear = 0.02 + Math.sin(t * 30) * 0.015
      chromRef.current.offset.set(new THREE.Vector2(tear, tear * 0.7))
      return
    }
    const heatFactor = Math.max(0, (heat - 50) / 50)
    const pulse = isOverheated ? Math.sin(t * Math.PI * 20) * 0.005 : 0
    const offset = 0.001 + heatFactor * 0.004 + pulse
    chromRef.current.offset.set(new THREE.Vector2(offset, offset))
  })

  return (
    <EffectComposer enableNormalPass={false}>
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
        darkness={isMelting ? 1.5 : isOverheated ? 1.3 : 1.1}
        blendFunction={BlendFunction.NORMAL}
      />
      {isPaused ? <HueSaturation saturation={-1.0} blendFunction={BlendFunction.NORMAL} /> : <></>}
      {isMelting ? (
        <Glitch
          delay={new THREE.Vector2(0.0, 0.08) as any}
          duration={new THREE.Vector2(0.1, 0.3) as any}
          strength={new THREE.Vector2(0.3, 1.0) as any}
          mode={GlitchMode.CONSTANT_WILD}
          blendFunction={BlendFunction.NORMAL}
        />
      ) : (
        <></>
      )}
      {crtOverlays ? <CRTEffect /> : <></>}
    </EffectComposer>
  )
}
