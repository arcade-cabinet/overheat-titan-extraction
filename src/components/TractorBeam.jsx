import { Line } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, useSpringJoint } from '@react-three/rapier'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

  // Beam points updated via ref to avoid state allocation every frame
  const beamStartRef = useRef(new THREE.Vector3())
  const beamEndRef = useRef(new THREE.Vector3())
  const lineRef = useRef()
  const [beamVisible, setBeamVisible] = useState(false)

  const raycaster = useRef(new THREE.Raycaster())
  const dir = useRef(new THREE.Vector3())
  const beamPoints = useMemo(() => [new THREE.Vector3(), new THREE.Vector3()], [])

  // Auto-release when game is paused or phase leaves gameplay
  useEffect(() => {
    if (!grabbed) return
    if (phase === 'gameplay' && !isPaused) return
    // Release cube
    grabbedRef.current = null
    setGrabbed(false)
    setBeamVisible(false)
  }, [grabbed, phase, isPaused])

  // Grab on pointer-down — raycast along camera forward direction
  const onPointerDown = useCallback(() => {
    if (phase !== 'gameplay' || isPaused || grabbed) return

    raycaster.current.setFromCamera({ x: 0, y: 0 }, camera)
    const hits = raycaster.current.intersectObjects(scene.children, true)

    for (const hit of hits) {
      let obj = hit.object
      while (obj) {
        if (obj.userData?.type === 'cube' && obj.userData?.rigidBodyRef) {
          // Prefer explicit ref stored in userData by the cube component
          grabbedRef.current = obj.userData.rigidBodyRef
          depthRef.current = hit.distance
          setGrabbed(true)
          setBeamVisible(true)
          return
        }
        // Fallback: walk parent chain for userData.type === 'cube'
        // and grab the THREE.Group's rigid body via rapier
        if (obj.userData?.type === 'cube' && obj.rigidBody) {
          grabbedRef.current = obj.rigidBody
          depthRef.current = hit.distance
          setGrabbed(true)
          setBeamVisible(true)
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
    setBeamVisible(false)
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
    if (phase !== 'gameplay' || isPaused) return
    if (!grabbed || !grabbedRef.current) return

    // Reel in: reduce depth each frame
    depthRef.current = Math.max(MIN_DEPTH, depthRef.current - REEL_SPEED * delta)

    // Move kinematic anchor to depth along camera look direction
    camera.getWorldDirection(dir.current)
    const anchorPos = camera.position.clone().addScaledVector(dir.current, depthRef.current)
    anchorRef.current.setNextKinematicTranslation(anchorPos)

    // Update beam visual via ref (no state update = no re-render)
    beamStartRef.current.copy(camera.position)
    const cubeT = grabbedRef.current.translation()
    beamEndRef.current.set(cubeT.x, cubeT.y, cubeT.z)
    beamPoints[0].copy(beamStartRef.current)
    beamPoints[1].copy(beamEndRef.current)
    if (lineRef.current) {
      lineRef.current.geometry.setFromPoints(beamPoints)
    }
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

      {/* Beam visual — updated via geometry ref, no state each frame */}
      {beamVisible && (
        <Line
          ref={lineRef}
          points={beamPoints}
          color="#00ffcc"
          lineWidth={1.5}
          transparent
          opacity={0.7}
        />
      )}
    </>
  )
}
