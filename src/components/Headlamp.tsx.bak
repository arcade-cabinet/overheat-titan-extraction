import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type * as THREE from 'three'
import { useGameStore } from '../store'

export function Headlamp() {
  const phase = useGameStore((s) => s.phase)
  const spotRef = useRef<THREE.SpotLight>(null)
  const flickerEnd = useRef(0)
  const stable = useRef(false)

  useEffect(() => {
    if (phase === 'boot') {
      flickerEnd.current = performance.now() + 500
      stable.current = false
    }
    if (phase === 'menu' || phase === 'gameplay') {
      stable.current = true
    }
  }, [phase])

  useFrame(() => {
    if (!spotRef.current) return
    if (phase === 'powered_down') {
      spotRef.current.intensity = 0
      return
    }
    const now = performance.now()
    if (!stable.current && now < flickerEnd.current) {
      spotRef.current.intensity = Math.random() * 3
    } else {
      stable.current = true
      spotRef.current.intensity = 2
    }
  })

  return (
    <spotLight
      ref={spotRef}
      position={[0, 0.1, -0.5]}
      angle={0.45}
      penumbra={0.4}
      intensity={2}
      color="#ffeecc"
      castShadow={false}
      distance={80}
    />
  )
}
