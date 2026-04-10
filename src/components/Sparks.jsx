import { RigidBody } from '@react-three/rapier'
import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_SPARKS = 30
const SPARK_TTL_MS = 1200

export function useSparks() {
  const [sparks, setSparks] = useState([])
  const nextIdRef = useRef(0)
  const timerRefs = useRef({})

  const spawnSpark = useCallback((position) => {
    const id = nextIdRef.current++
    const angle = Math.random() * Math.PI * 2
    const spread = 1.5 + Math.random() * 2
    const impulse = [Math.cos(angle) * spread, 4 + Math.random() * 4, Math.sin(angle) * spread]
    setSparks((prev) => {
      const next = [...prev, { id, position: [...position], impulse }]
      return next.length > MAX_SPARKS ? next.slice(next.length - MAX_SPARKS) : next
    })
    timerRefs.current[id] = setTimeout(() => {
      setSparks((prev) => prev.filter((s) => s.id !== id))
      delete timerRefs.current[id]
    }, SPARK_TTL_MS)
  }, [])

  // Clean up all pending TTL timers on unmount
  useEffect(() => {
    return () => {
      for (const id of Object.keys(timerRefs.current)) {
        clearTimeout(timerRefs.current[id])
      }
    }
  }, [])

  return { sparks, spawnSpark }
}

export function Sparks({ sparks }) {
  return (
    <>
      {sparks.map((spark) => (
        <SparkBody key={spark.id} spark={spark} />
      ))}
    </>
  )
}

function SparkBody({ spark }) {
  const bodyRef = useRef()

  // Apply impulse once on mount so sparks actually fly outward
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.applyImpulse(
        { x: spark.impulse[0], y: spark.impulse[1], z: spark.impulse[2] },
        true
      )
    }
  }, [spark.impulse])

  return (
    <RigidBody
      ref={bodyRef}
      colliders="ball"
      position={spark.position}
      gravityScale={1.5}
      onCollisionEnter={() => {
        if (bodyRef.current) {
          bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
        }
      }}
    >
      <mesh>
        <boxGeometry args={[0.06, 0.06, 0.06]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ff6600" emissiveIntensity={2} />
      </mesh>
    </RigidBody>
  )
}
