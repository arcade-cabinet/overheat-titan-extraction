import { Stars } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { useGameStore } from '../store'

export function Environment() {
  const phase = useGameStore((s) => s.phase)
  const ambRef = useRef()

  useFrame(() => {
    if (!ambRef.current) return
    if (phase === 'powered_down' || phase === 'boot') {
      ambRef.current.intensity = 0.01
    } else {
      ambRef.current.intensity = 0.15
    }
  })

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.15} color="#220a33" />
      <directionalLight
        position={[-50, 30, -50]}
        intensity={0.8}
        color="#ffaa55"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <fog attach="fog" args={['#020406', 60, 200]} />
      <Stars radius={200} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
    </>
  )
}
