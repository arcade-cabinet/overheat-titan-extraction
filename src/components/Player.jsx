import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { useGameStore } from '../store'
import { audioManager } from '../audio/AudioEngine'
import { Cockpit } from './Cockpit'
import * as THREE from 'three'

const SPEED = 8
const DASH_SPEED = 20
const keys = {}

function useKeys() {
  useEffect(() => {
    const down = (e) => (keys[e.code] = true)
    const up = (e) => (keys[e.code] = false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])
  return keys
}

export function Player() {
  const bodyRef = useRef()
  useKeys()
  const { camera } = useThree()
  const phase = useGameStore((s) => s.phase)
  const isPaused = useGameStore((s) => s.isPaused)
  const isOverheated = useGameStore((s) => s.isOverheated)
  const heat = useGameStore((s) => s.heat)
  const coolDown = useGameStore((s) => s.coolDown)
  const getCoolingRate = useGameStore((s) => s.getCoolingRate)
  const isMelting = useGameStore((s) => s.isMelting)
  const lookSensitivity = useGameStore((s) => s.settings.lookSensitivity)

  const yawRef = useRef(0)
  const pitchRef = useRef(0)
  const stepTimer = useRef(0)

  useEffect(() => {
    const onMove = (e) => {
      if (phase !== 'gameplay' || isPaused) return
      const sens = 0.002 * lookSensitivity
      yawRef.current -= e.movementX * sens
      pitchRef.current -= e.movementY * sens
      pitchRef.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitchRef.current))
    }
    document.addEventListener('mousemove', onMove)
    return () => document.removeEventListener('mousemove', onMove)
  }, [phase, isPaused, lookSensitivity])

  useFrame(({ clock }, delta) => {
    if (!bodyRef.current) return

    // Meltdown camera eject
    if (isMelting) {
      camera.position.y += delta * 15
      return
    }

    if (isPaused || phase !== 'gameplay') return

    // Cooling when overheated
    if (isOverheated) {
      coolDown(getCoolingRate() * delta)
    }

    // Camera rotation
    const euler = new THREE.Euler(pitchRef.current, yawRef.current, 0, 'YXZ')
    camera.quaternion.setFromEuler(euler)

    // Movement
    const forward = keys['KeyW'] || keys['ArrowUp'] ? 1 : 0
    const backward = keys['KeyS'] || keys['ArrowDown'] ? 1 : 0
    const left = keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0
    const right = keys['KeyD'] || keys['ArrowRight'] ? 1 : 0
    const dash = keys['ShiftLeft'] || keys['ShiftRight'] ? true : false

    const dir = new THREE.Vector3(left - right, 0, backward - forward)
    if (dir.length() > 0.01) dir.normalize()
    dir.applyQuaternion(camera.quaternion)
    dir.y = 0

    const speed = dash ? DASH_SPEED : SPEED
    const vel = bodyRef.current.linvel()
    bodyRef.current.wakeUp()
    bodyRef.current.setLinvel({ x: dir.x * speed, y: vel.y, z: dir.z * speed }, true)

    // Sync camera to body
    const pos = bodyRef.current.translation()
    camera.position.set(pos.x, pos.y + 1.6, pos.z)

    // Camera shake when grinding close to ore
    if (!isOverheated) {
      const shakeScale = heat / 100 * 0.03
      camera.position.x += (Math.random() - 0.5) * shakeScale
      camera.position.y += (Math.random() - 0.5) * shakeScale
      camera.position.z += (Math.random() - 0.5) * shakeScale
    }

    // FOV transitions
    const targetFov = dash ? 100 : 75
    camera.fov += (targetFov - camera.fov) * Math.min(1, delta * 6)
    camera.updateProjectionMatrix()

    // Footstep sounds
    stepTimer.current += delta
    const moving = (forward || backward || left || right)
    if (moving && stepTimer.current > 0.4) {
      stepTimer.current = 0
      audioManager.playMechStep()
    }
  })

  return (
    <RigidBody ref={bodyRef} colliders="cuboid" lockRotations mass={100} position={[0, 5, 10]}>
      <mesh visible={false}>
        <capsuleGeometry args={[0.4, 1.2]} />
      </mesh>
    </RigidBody>
  )
}
