import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../store'

// Extend JSX namespace for custom shader material
declare module '@react-three/fiber' {
  interface ThreeElements {
    moltenSawMaterial: any
  }
}

const MoltenSawMaterial = shaderMaterial(
  {
    uHeat: 0,
    uTime: 0,
    uColorCold: new THREE.Color('#1a1a1a'),
    uColorHot: new THREE.Color('#ff3300'),
  },
  `varying vec2 vUv;
   void main() {
     vUv = uv;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
  `uniform float uHeat;
   uniform float uTime;
   uniform vec3 uColorCold;
   uniform vec3 uColorHot;
   varying vec2 vUv;
   void main() {
     float edgeGlow = smoothstep(0.3, 1.0, abs(vUv.y - 0.5) * 2.0) * uHeat;
     vec3 finalColor = mix(uColorCold, uColorHot, edgeGlow);
     float pulse = (sin(uTime * 20.0) * 0.5 + 0.5) * smoothstep(0.8, 1.0, uHeat);
     finalColor += vec3(pulse * 0.5);
     gl_FragColor = vec4(finalColor, 1.0);
   }`
)

extend({ MoltenSawMaterial })

export function MoltenSaw() {
  const matRef = useRef<any>(null)
  const meshRef = useRef<any>(null)
  const heat = useGameStore((s) => s.heat)
  const isOverheated = useGameStore((s) => s.isOverheated)

  useFrame((_, delta) => {
    if (!matRef.current) return
    matRef.current.uHeat = Math.min(1, Math.max(0, heat / 100))
    // fallback or simply use performance.now() to avoid the warning if R3F still uses clock under the hood
    matRef.current.uTime = performance.now() / 1000
    if (meshRef.current && !isOverheated) {
      meshRef.current.rotation.z += delta * 8
    }
  })

  return (
    <mesh ref={meshRef} position={[0, -0.6, -2]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.6, 0.6, 0.08, 24]} />
      <moltenSawMaterial ref={matRef} />
    </mesh>
  )
}
