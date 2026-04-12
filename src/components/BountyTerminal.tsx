import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useTrait } from 'koota/react'
import { useRef, useState } from 'react'
import { audioManager } from '../audio/AudioEngine'
import { gameConfig } from '../config'
import { Contracts, GlobalState } from '../ecs/traits'
import { GameStateEntity } from '../ecs/world'
import { type ContractType, useGameStore } from '../store'

// Console world position — opposite of Upgrade Console
const CONSOLE_POSITION: [number, number, number] = [-6, 0, -3]
const INTERACT_RADIUS = 4

const CONTRACTS: {
  key: NonNullable<ContractType>
  label: string
  desc: string
  reward: number
  timeLimit: number
}[] = [
  {
    key: 'quota',
    label: 'QUOTA RUN',
    desc: `Earn $${gameConfig.contracts.quota.target} in ${Math.floor(gameConfig.contracts.quota.timeLimitS / 60)}m`,
    reward: gameConfig.contracts.quota.reward,
    timeLimit: gameConfig.contracts.quota.timeLimitS,
  },
  {
    key: 'thermal',
    label: 'THERMAL CAP',
    desc: `Stay under ${gameConfig.contracts.thermal.target}°C for ${Math.floor(gameConfig.contracts.thermal.timeLimitS / 60)}m`,
    reward: gameConfig.contracts.thermal.reward,
    timeLimit: gameConfig.contracts.thermal.timeLimitS,
  },
  {
    key: 'survival',
    label: 'ENDURANCE',
    desc: `Survive ${Math.floor(gameConfig.contracts.survival.timeLimitS / 60)}m`,
    reward: gameConfig.contracts.survival.reward,
    timeLimit: gameConfig.contracts.survival.timeLimitS,
  },
]

export function BountyTerminal() {
  const acceptContract = useGameStore((s) => s.acceptContract)

  const globalState = useTrait(GameStateEntity, GlobalState)
  const contractsState = useTrait(GameStateEntity, Contracts)

  const activeContract = contractsState?.activeContract
  const contractStatus = contractsState?.contractStatus
  const phase = globalState?.phase
  const isPaused = globalState?.isPaused

  const { camera } = useThree()

  const inRangeRef = useRef(false)
  const [inRange, setInRange] = useState(false)

  // Track distance from console each frame
  useFrame(() => {
    const dx = camera.position.x - CONSOLE_POSITION[0]
    const dz = camera.position.z - CONSOLE_POSITION[2]
    const nextInRange = Math.sqrt(dx * dx + dz * dz) < INTERACT_RADIUS
    if (inRangeRef.current !== nextInRange) {
      inRangeRef.current = nextInRange
      setInRange(nextInRange)
    }
  })

  function handleAccept(key: NonNullable<ContractType>) {
    if (!inRange || phase !== 'gameplay' || isPaused || activeContract) return
    acceptContract(key)
    audioManager.playBlip()
  }

  return (
    <group position={CONSOLE_POSITION} rotation={[0, 0.4, 0]}>
      {/* Base pedestal */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.8, 1.2, 0.5]} />
        <meshStandardMaterial color="#180a12" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Screen face */}
      <group position={[0, 1.4, 0.26]} rotation={[-0.2, 0, 0]}>
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[1.6, 0.8, 0.04]} />
          <meshStandardMaterial color="#0e0208" />
        </mesh>

        <mesh position={[0, 0, -0.015]}>
          <planeGeometry args={[1.58, 0.78]} />
          <meshBasicMaterial color="#ff00ff" wireframe opacity={0.3} transparent />
        </mesh>

        <Text
          position={[-0.75, 0.3, 0]}
          fontSize={0.06}
          color="#ff00ff"

          anchorX="left"
          anchorY="middle"
        >
          BOUNTY BOARD
        </Text>

        <Text
          position={[-0.75, 0.22, 0]}
          fontSize={0.04}
          color="#ffaa00"

          anchorX="left"
          anchorY="middle"
        >
          {activeContract ? `STATUS: ${contractStatus?.toUpperCase()}` : 'SELECT CONTRACT'}
        </Text>

        <mesh position={[0, 0.15, 0]}>
          <planeGeometry args={[1.5, 0.005]} />
          <meshBasicMaterial color="#3a1a3a" />
        </mesh>

        {CONTRACTS.map((u, i) => {
          const isActive = activeContract === u.key
          const canAccept = !activeContract
          const rowY = 0.05 - i * 0.16

          return (
            <group key={u.key} position={[0, rowY, 0]}>
              <Text
                position={[-0.75, 0, 0]}
                fontSize={0.04}
                color={isActive ? '#ffffff' : '#ff00ff'}
      
                anchorX="left"
                anchorY="middle"
              >
                {`${u.label} [+$${u.reward}]`}
              </Text>

              <Text
                position={[-0.75, -0.05, 0]}
                fontSize={0.03}
                color="#775566"
      
                anchorX="left"
                anchorY="middle"
              >
                {u.desc}
              </Text>

              <group
                position={[0.45, -0.025, 0]}
                onClick={(e) => {
                  e.stopPropagation()
                  handleAccept(u.key)
                }}
                onPointerOver={() => {
                  if (inRange && canAccept) document.body.style.cursor = 'pointer'
                }}
                onPointerOut={() => {
                  document.body.style.cursor = 'auto'
                }}
              >
                <mesh position={[0, 0, -0.001]}>
                  <planeGeometry args={[0.5, 0.09]} />
                  <meshBasicMaterial
                    color={canAccept ? '#ff00ff' : isActive ? '#ffffff' : '#333333'}
                    wireframe
                  />
                </mesh>
                <mesh position={[0, 0, 0]}>
                  <planeGeometry args={[0.5, 0.09]} />
                  <meshBasicMaterial
                    color={canAccept ? '#ff00ff' : isActive ? '#ffffff' : '#000000'}
                    opacity={canAccept || isActive ? 0.1 : 0}
                    transparent
                  />
                </mesh>
                <Text
                  position={[0, 0, 0.001]}
                  fontSize={0.035}
                  color={canAccept ? '#ff00ff' : isActive ? '#ffffff' : '#444444'}
        
                  anchorX="center"
                  anchorY="middle"
                >
                  {isActive ? 'ACTIVE' : 'ACCEPT'}
                </Text>
              </group>
            </group>
          )
        })}

        <Text
          position={[0, -0.35, 0]}
          fontSize={0.03}
          color={inRange ? '#552244' : '#aa3333'}

          anchorX="center"
          anchorY="middle"
        >
          {inRange ? '> TOUCH SCREEN TO INTERACT <' : '> OUT OF RANGE <'}
        </Text>
      </group>

      {/* Accent light strip */}
      <mesh position={[0, 0.06, 0.26]}>
        <boxGeometry args={[1.8, 0.04, 0.04]} />
        <meshBasicMaterial color="#ff00ff" />
      </mesh>
    </group>
  )
}
