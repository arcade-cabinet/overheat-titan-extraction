import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { useTrait } from 'koota/react'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { audioManager } from '../audio/AudioEngine'
import gameConfig from '../config.json'
import { gameActions, gameSelectors } from '../ecs/actions'
import { GlobalState, Heat } from '../ecs/traits'
import { GameStateEntity } from '../ecs/world'
import { inputState } from '../input/InputService'

const SPEED = gameConfig.mech.baseSpeed
const DASH_SPEED = gameConfig.mech.dashSpeed

// Module-scope reusable objects — avoid per-frame allocations (GC pressure)
const _euler = new THREE.Euler(0, 0, 0, 'YXZ')
const _dir = new THREE.Vector3()

export function Player() {
  const bodyRef = useRef<any>(null)
  const { camera } = useThree()
  const phase = useTrait(GameStateEntity, GlobalState)?.phase
  const isPaused = useTrait(GameStateEntity, GlobalState)?.isPaused
  const isOverheated = useTrait(GameStateEntity, Heat)?.overheated
  const heat = useTrait(GameStateEntity, Heat)?.value ?? 0
  const coolDown = gameActions.coolDown
  const getCoolingRate = gameSelectors.getCoolingRate
  const isMelting = useTrait(GameStateEntity, Heat)?.melting
  const lookSensitivity = useTrait(GameStateEntity, GlobalState)?.lookSensitivity ?? 1.0

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

  useFrame(({ clock: _clock }, delta) => {
    if (!bodyRef.current) return

    // Meltdown camera eject
    if (isMelting) {
      camera.position.y += delta * 15
      return
    }

    if (isPaused || phase !== 'gameplay') return

    // Mouse look and touch look
    const sens = 0.002 * lookSensitivity
    if (inputState.pointerLook.x !== 0 || inputState.pointerLook.y !== 0) {
      yawRef.current -= inputState.pointerLook.x * sens
      pitchRef.current -= inputState.pointerLook.y * sens
    }
    // Joystick look (mobile)
    if (inputState.look.x !== 0 || inputState.look.y !== 0) {
      yawRef.current -= inputState.look.x * sens * 20 // scale up for stick
      pitchRef.current -= inputState.look.y * sens * 20
    }
    pitchRef.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitchRef.current))

    // Cooling when overheated
    if (isOverheated) {
      coolDown(getCoolingRate() * delta)
    }

    // Camera rotation — mutate module-scope Euler, no allocation per frame
    _euler.set(pitchRef.current, yawRef.current, 0)
    camera.quaternion.setFromEuler(_euler)

    // Movement
    _dir.set(inputState.move.x, 0, inputState.move.y)
    if (_dir.lengthSq() > 0.01) {
      // Don't normalize here because it might be an analog stick value <= 1
      _dir.applyQuaternion(camera.quaternion)
      _dir.y = 0
      // Normalizing after rotation, then scaling by analog stick magnitude
      const mag = Math.min(1, Math.sqrt(inputState.move.x ** 2 + inputState.move.y ** 2))
      _dir.normalize().multiplyScalar(mag)
    }

    const speed = inputState.dash ? DASH_SPEED : SPEED
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
    const targetFov = inputState.dash ? gameConfig.mech.dashFov : gameConfig.mech.normalFov
    ;(camera as any).fov +=
      (targetFov - (camera as any).fov) * Math.min(1, delta * gameConfig.mech.dash.fovLerpSpeed)
    camera.updateProjectionMatrix()

    // Footstep sounds
    stepTimer.current += delta
    const moving = inputState.move.x !== 0 || inputState.move.y !== 0
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
