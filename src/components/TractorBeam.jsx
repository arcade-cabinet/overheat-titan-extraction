import { Line } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, useSpringJoint } from '@react-three/rapier'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../store'

const REEL_SPEED = 8 // units/s reel-in
const SPRING_STIFFNESS = 60
const SPRING_DAMPING = 8
const SPRING_REST = 0
const MIN_DEPTH = 1.5 // closest the anchor gets

function SpringJoint({ anchorRef, targetRef }) {
  useSpringJoint(anchorRef, targetRef, [
    [0, 0, 0],
    [0, 0, 0],
    SPRING_REST,
    SPRING_STIFFNESS,
    SPRING_DAMPING,
  ])
  return null
}

export function TractorBeam() {
  const { camera, scene } = useThree()
  const phase = useGameStore((s) => s.phase)
  const isPaused = useGameStore((s) => s.isPaused)

  const anchorRef = useRef()
  const grabbedRef = useRef(null) // Rapier RigidBody of grabbed cube
  const [grabbed, setGrabbed] = useState(false)
  const depthRef = useRef(6) // current reel depth
  const beamStartRef = useRef(new THREE.Vector3())
  const beamEndRef = useRef(new THREE.Vector3())
  const [beamPoints, setBeamPoints] = useState(null)
  const raycaster = useRef(new THREE.Raycaster())
  const dir = useRef(new THREE.Vector3())

  // Grab on pointer-down — raycast along camera forward direction
  const onPointerDown = useCallback(() => {
    if (phase !== 'gameplay' || isPaused || grabbed) return

    raycaster.current.setFromCamera({ x: 0, y: 0 }, camera)
    const hits = raycaster.current.intersectObjects(scene.children, true)

    for (const hit of hits) {
      let obj = hit.object
      while (obj) {
        if (obj.userData?.type === 'cube' && obj.__rapierRigidBody) {
          grabbedRef.current = obj.__rapierRigidBody
          depthRef.current = hit.distance
          setGrabbed(true)
          return
        }
        obj = obj.parent
      }
    }
  }, [phase, isPaused, grabbed, camera, scene])

  // Release on pointer-up — cube keeps its current velocity (throw)
  const onPointerUp = useCallback(() => {
    if (!grabbed) return
    grabbedRef.current = null
    setGrabbed(false)
    setBeamPoints(null)
  }, [grabbed])

  useEffect(() => {
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [onPointerDown, onPointerUp])

  useFrame((_, delta) => {
    if (!anchorRef.current) return
    if (!grabbed || !grabbedRef.current) return

    // Reel in: reduce depth each frame
    depthRef.current = Math.max(MIN_DEPTH, depthRef.current - REEL_SPEED * delta)

    // Move kinematic anchor to depth along camera look direction
    camera.getWorldDirection(dir.current)
    const anchorPos = camera.position.clone().addScaledVector(dir.current, depthRef.current)
    anchorRef.current.setNextKinematicTranslation(anchorPos)

    // Update beam visual
    beamStartRef.current.copy(camera.position)
    const cubeT = grabbedRef.current.translation()
    beamEndRef.current.set(cubeT.x, cubeT.y, cubeT.z)
    setBeamPoints([beamStartRef.current.clone(), beamEndRef.current.clone()])
  })

  return (
    <>
      {/* Invisible kinematic anchor */}
      <RigidBody
        ref={anchorRef}
        type="kinematicPosition"
        colliders={false}
        position={[0, -1000, 0]}
      >
        <mesh visible={false}>
          <sphereGeometry args={[0.1]} />
        </mesh>
      </RigidBody>

      {/* Spring joint — only active when a cube is grabbed */}
      {grabbed && grabbedRef.current && (
        <SpringJoint anchorRef={anchorRef} targetRef={grabbedRef} />
      )}

      {/* Beam visual */}
      {beamPoints && (
        <Line points={beamPoints} color="#00ffcc" lineWidth={1.5} transparent opacity={0.7} />
      )}
    </>
  )
}
