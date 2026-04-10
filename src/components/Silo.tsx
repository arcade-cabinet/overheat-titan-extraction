import { useFrame, useThree } from '@react-three/fiber'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { audioManager } from '../audio/AudioEngine'
import gameConfig from '../config.json'
import { useGameStore } from '../store'

const SILO_POSITION = new THREE.Vector3(0, 0, 0)

export function Silo() {
  const addCredits = useGameStore((s) => s.addCredits)
  const phase = useGameStore((s) => s.phase)
  const soldBodiesRef = useRef(new Set())
  const { camera } = useThree()

  useEffect(() => {
    if (phase === 'gameplay' && audioManager._initialized) {
      audioManager.initSiloHum()
      audioManager.initThruster()
    }
    return () => {
      audioManager.stopSiloHum()
    }
  }, [phase])

  useFrame(() => {
    if (!audioManager._initialized || phase !== 'gameplay') return
    const dist = camera.position.distanceTo(SILO_POSITION)
    audioManager.setSiloHumDistance(dist)
  })

  const handleIntersect = (e: any) => {
    const other = e.other.rigidBody
    if (!other) return

    const otherObject = e.other.rigidBodyObject
    const otherUserData = other.userData || otherObject?.userData || {}
    if (otherUserData.type !== 'cube') return

    const deduplicationKey = other.handle ?? otherUserData.id
    if (otherUserData.sold || soldBodiesRef.current.has(deduplicationKey)) return

    soldBodiesRef.current.add(deduplicationKey)
    other.userData = { ...otherUserData, sold: true }
    if (otherObject) {
      otherObject.userData = { ...otherObject.userData, sold: true }
    }

    const value = otherUserData.value ?? gameConfig.economy.cubeValue
    addCredits(value)
    if (otherUserData.isRare) {
      audioManager.playRareSell()
    } else {
      audioManager.playSell()
    }

    if (typeof otherUserData.onSell === 'function') {
      otherUserData.onSell()
    }

    if (typeof other.setLinvel === 'function') {
      other.setLinvel({ x: 0, y: 0, z: 0 }, true)
    }
    if (typeof other.setAngvel === 'function') {
      other.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }
    if (typeof other.setTranslation === 'function') {
      other.setTranslation({ x: 0, y: -1000, z: 0 }, true)
    }
    if (typeof other.sleep === 'function') {
      other.sleep()
    }
  }

  return (
    <group position={[0, 0, 0]}>
      {/* Base cylinder */}
      <RigidBody type="fixed" colliders="hull">
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[3, 3, 3, 16]} />
          <meshStandardMaterial color="#0f1418" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Extraction beam */}
      <mesh position={[0, 30, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 60, 16, 1, true]} />
        <meshBasicMaterial
          color="#00ffcc"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Sensor for cube collection */}
      <RigidBody type="fixed" sensor onIntersectionEnter={handleIntersect}>
        <CuboidCollider args={[3, 10, 3]} position={[0, 10, 0]} />
      </RigidBody>
    </group>
  )
}
