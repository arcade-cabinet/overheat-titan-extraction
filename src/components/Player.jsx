import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { audioManager } from '../audio/AudioEngine'
import gameConfig from '../config.json'
import { useGameStore } from '../store'

const SPEED = gameConfig.mech.baseSpeed
const DASH_SPEED = gameConfig.mech.dashSpeed
const keys = {}

// Module-scope reusable objects — avoid per-frame allocations (GC pressure)
const _euler = new THREE.Euler(0, 0, 0, 'YXZ')
const _dir = new THREE.Vector3()

function useKeys() {
  useEffect(() => {
    const down = (e) => (keys[e.code] = true)
    const up = (e) => (keys[e.code] = false)
    const blur = () =>
      Object.keys(keys).forEach((k) => {
        delete keys[k]
      })
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
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

  // Stop thruster audio node on unmount to prevent resource leak
  useEffect(() => {
    return () => {
      audioManager.stopThruster()
    }
  }, [])

  // Silence thruster when paused or outside gameplay
  useEffect(() => {
    if (isPaused || phase !== 'gameplay') {
      audioManager.setThrusterVolume(0)
    }
  }, [isPaused, phase])

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

  useFrame(({ clock: _clock }, delta) => {
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

    // Camera rotation — mutate module-scope Euler, no allocation per frame
    _euler.set(pitchRef.current, yawRef.current, 0)
    camera.quaternion.setFromEuler(_euler)

    // Movement
    const forward = keys.KeyW || keys.ArrowUp ? 1 : 0
    const backward = keys.KeyS || keys.ArrowDown ? 1 : 0
    const left = keys.KeyA || keys.ArrowLeft ? 1 : 0
    const right = keys.KeyD || keys.ArrowRight ? 1 : 0
    const dash = !!(keys.ShiftLeft || keys.ShiftRight)

    _dir.set(right - left, 0, backward - forward)
    if (_dir.length() > 0.01) _dir.normalize()
    _dir.applyQuaternion(camera.quaternion)
    _dir.y = 0

    const speed = dash ? DASH_SPEED : SPEED
    const vel = bodyRef.current.linvel()
    bodyRef.current.wakeUp()
    bodyRef.current.setLinvel({ x: _dir.x * speed, y: vel.y, z: _dir.z * speed }, true)

    // Sync camera to body
    const pos = bodyRef.current.translation()
    camera.position.set(pos.x, pos.y + gameConfig.mech.eyeHeight, pos.z)

    // Camera shake when grinding close to ore
    if (!isOverheated) {
      const shakeScale =
        (heat / gameConfig.mech.heat.overheatThreshold) * gameConfig.mech.heat.cameraShakeMaxScale
      camera.position.x += (Math.random() - 0.5) * shakeScale
      camera.position.y += (Math.random() - 0.5) * shakeScale
      camera.position.z += (Math.random() - 0.5) * shakeScale
    }

    // FOV transitions
    const targetFov = dash ? gameConfig.mech.dashFov : gameConfig.mech.normalFov
    camera.fov += (targetFov - camera.fov) * Math.min(1, delta * gameConfig.mech.dash.fovLerpSpeed)
    camera.updateProjectionMatrix()

    // Footstep sounds
    stepTimer.current += delta
    const moving = forward || backward || left || right
    if (moving && stepTimer.current > gameConfig.mech.dash.stepIntervalS) {
      stepTimer.current = 0
      audioManager.playMechStep()
    }

    // Thruster spatial audio — volume proportional to horizontal speed
    const linvel = bodyRef.current.linvel()
    const horzSpeed = Math.sqrt(linvel.x ** 2 + linvel.z ** 2)
    audioManager.setThrusterVolume(Math.min(1, horzSpeed / 20))
  })

  return (
    <RigidBody ref={bodyRef} colliders="cuboid" lockRotations mass={100} position={[0, 5, 10]}>
      <mesh visible={false}>
        <capsuleGeometry args={[0.4, 1.2]} />
      </mesh>
    </RigidBody>
  )
}
