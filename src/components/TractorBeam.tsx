import { Line } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, useSpringJoint } from '@react-three/rapier'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import gameConfig from '../config.json'
import { inputState } from '../input/InputService'
import { useGameStore } from '../store'

const REEL_SPEED = gameConfig.tractor.reelSpeed
const SPRING_STIFFNESS = gameConfig.tractor.springStiffness
const SPRING_DAMPING = gameConfig.tractor.springDamping
const SPRING_REST = 0
const MIN_DEPTH = gameConfig.tractor.minDepth

function SpringJoint({ anchorRef, targetRef }: any) {
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

  const anchorRef = useRef<any>(null)
  const grabbedRef = useRef(null) // Rapier RigidBody of grabbed cube
  const [grabbed, setGrabbed] = useState(false)
  const depthRef = useRef(gameConfig.tractor.defaultDepth) // current reel depth

  // Beam points updated via ref to avoid state allocation every frame
  const beamStartRef = useRef(new THREE.Vector3())
  const beamEndRef = useRef(new THREE.Vector3())
  const lineRef = useRef<any>(null)
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

  useFrame((_, delta) => {
    if (!anchorRef.current) return
    if (phase !== 'gameplay' || isPaused) return

    // Check inputState for grab/release
    if (inputState.tractorDownThisFrame && !grabbed) {
      raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera)
      const hits = raycaster.current.intersectObjects(scene.children, true)

      for (const hit of hits) {
        let obj: any = hit.object
        let found = false
        while (obj) {
          if (obj.userData?.type === 'cube' && obj.userData?.rigidBodyRef) {
            grabbedRef.current = obj.userData.rigidBodyRef
            depthRef.current = hit.distance
            setGrabbed(true)
            setBeamVisible(true)
            found = true
            break
          }
          if (obj.userData?.type === 'cube' && obj.rigidBody) {
            grabbedRef.current = obj.rigidBody
            depthRef.current = hit.distance
            setGrabbed(true)
            setBeamVisible(true)
            found = true
            break
          }
          obj = obj.parent
        }
        if (found) break
      }
    }

    if (inputState.tractorUpThisFrame && grabbed && grabbedRef.current) {
      // Silo aim assist (magnetism)
      const siloPos = new THREE.Vector3(...gameConfig.silo.position)
      const cubePos = (grabbedRef.current as any).translation()
      const cubeVel = (grabbedRef.current as any).linvel()

      const velVec = new THREE.Vector3(cubeVel.x, cubeVel.y, cubeVel.z)
      const speed = velVec.length()

      if (speed > 2) {
        // Only assist if it's a meaningful throw
        const toSilo = new THREE.Vector3().subVectors(
          siloPos,
          new THREE.Vector3(cubePos.x, cubePos.y, cubePos.z)
        )
        toSilo.y += 2 // Aim slightly above the base of the silo
        const distToSilo = toSilo.length()
        toSilo.normalize()

        const velDir = velVec.clone().normalize()
        const angle = velDir.angleTo(toSilo)

        // 15 degrees = ~0.26 radians
        if (angle < 0.26 && distToSilo < 40) {
          // Adjust velocity to point exactly at silo
          const newVel = toSilo.multiplyScalar(Math.max(speed, distToSilo * 0.8)) // Ensure it reaches
          ;(grabbedRef.current as any).setLinvel({ x: newVel.x, y: newVel.y, z: newVel.z }, true)
        }
      }

      grabbedRef.current = null
      setGrabbed(false)
      setBeamVisible(false)
    }

    if (!grabbed || !grabbedRef.current) return

    // Reel in: reduce depth each frame
    depthRef.current = Math.max(MIN_DEPTH, depthRef.current - REEL_SPEED * delta)

    // Move kinematic anchor to depth along camera look direction
    camera.getWorldDirection(dir.current)
    const anchorPos = camera.position.clone().addScaledVector(dir.current, depthRef.current)
    anchorRef.current.setNextKinematicTranslation(anchorPos)

    // Update beam visual via ref (no state update = no re-render)
    beamStartRef.current.copy(camera.position)
    const cubeT = (grabbedRef.current as any).translation()
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
