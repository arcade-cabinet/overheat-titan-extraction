import { Text } from '@react-three/drei'
import { useTrait } from 'koota/react'
import gameConfig from '../config.json'
import { Contracts, GlobalState, Heat, Hopper, Upgrades } from '../ecs/traits'
import { GameStateEntity } from '../ecs/world'
import { useGameStore } from '../store'

const DISPLAY_MAX_HEAT = gameConfig.mech.heat.meltdownThreshold
const OVERHEAT_THRESHOLD = gameConfig.mech.heat.overheatThreshold

export function Dashboard() {
  const setPaused = useGameStore((s) => s.setPaused)

  const globalState = useTrait(GameStateEntity, GlobalState)
  const heatState = useTrait(GameStateEntity, Heat)
  const contractsState = useTrait(GameStateEntity, Contracts)
  const upgradesState = useTrait(GameStateEntity, Upgrades)
  const hopperState = useTrait(GameStateEntity, Hopper)

  if (!globalState || !heatState || !contractsState || !upgradesState || !hopperState) return null

  const rawOre = hopperState.current
  const maxOre = hopperState.max
  const heat = heatState.value
  const credits = globalState.credits
  const isOverheated = heatState.overheated
  const phase = globalState.phase
  const isPaused = globalState.isPaused

  const activeContract = contractsState.activeContract
  const contractStatus = contractsState.contractStatus
  const contractTimer = contractsState.contractTimer

  const hopperPct = Math.min(1, rawOre / maxOre)
  const heatPct = Math.min(1, heat / DISPLAY_MAX_HEAT)

  return (
    <group position={[0, -1.3, -1.8]} rotation={[-0.25, 0, 0]}>
      {/* Main Screen Base */}
      <mesh>
        <boxGeometry args={[4, 0.8, 1]} />
        <meshStandardMaterial attach="material-0" color="#0a0f14" roughness={0.8} />
        <meshStandardMaterial attach="material-1" color="#0a0f14" roughness={0.8} />
        <meshStandardMaterial attach="material-2" color={isOverheated ? '#3a0f14' : '#050a0f'} />
        <meshStandardMaterial attach="material-3" color="#0a0f14" roughness={0.8} />
        <meshStandardMaterial attach="material-4" color="#0a0f14" roughness={0.8} />
        <meshStandardMaterial attach="material-5" color="#0a0f14" roughness={0.8} />
      </mesh>

      {/* Screen contents - shifted slightly forward on Z to avoid z-fighting with screen face (+Y) */}
      <group position={[0, 0.401, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Hopper UI */}
        <Text
          position={[-1.8, 0.25, 0]}
          fontSize={0.15}
          color={hopperPct >= 1 ? '#ffaa00' : '#00ffcc'}
          anchorX="left"
          anchorY="middle"
        >
          {`HOPPER [${Math.floor(hopperPct * 100)}%]\n`}
        </Text>
        <mesh position={[-1.0, 0.1, 0]}>
          <planeGeometry args={[1.6, 0.1]} />
          <meshBasicMaterial color="#00ffcc" wireframe />
        </mesh>
        <mesh position={[-1.8 + (1.6 * hopperPct) / 2, 0.1, 0]}>
          <planeGeometry args={[1.6 * hopperPct, 0.1]} />
          <meshBasicMaterial color="#00ffcc" />
        </mesh>

        {/* Heat UI */}
        <Text
          position={[-1.8, -0.1, 0]}
          fontSize={0.15}
          color={isOverheated ? '#ff0000' : '#ff4400'}
          anchorX="left"
          anchorY="middle"
        >
          {`HEAT [${Math.floor(heat)}°C]\n`}
        </Text>
        <mesh position={[-1.0, -0.25, 0]}>
          <planeGeometry args={[1.6, 0.1]} />
          <meshBasicMaterial color={isOverheated ? '#ff0000' : '#ff4400'} wireframe />
        </mesh>
        <mesh position={[-1.8 + (1.6 * heatPct) / 2, -0.25, 0]}>
          <planeGeometry args={[1.6 * heatPct, 0.1]} />
          <meshBasicMaterial color={isOverheated ? '#ff0000' : '#ff4400'} />
        </mesh>
        {/* Overheat marker line */}
        <mesh position={[-1.8 + 1.6 * (OVERHEAT_THRESHOLD / DISPLAY_MAX_HEAT), -0.25, 0.001]}>
          <planeGeometry args={[0.02, 0.15]} />
          <meshBasicMaterial color="#ff8800" />
        </mesh>

        {/* Credits UI */}
        <Text
          position={[1.8, 0.25, 0]}
          fontSize={0.25}
          color="#ffaa00"
          anchorX="right"
          anchorY="middle"
        >
          {`$${credits}`}
        </Text>

        {/* Active Contract Info */}
        {activeContract && contractStatus === 'active' && (
          <Text
            position={[1.8, 0.05, 0]}
            fontSize={0.1}
            color="#ff00ff"
            anchorX="right"
            anchorY="middle"
          >
            {`CONTRACT: ${Math.ceil(contractTimer)}s`}
          </Text>
        )}

        {/* Pause Button - Diegetic 3D intersection */}
        {phase === 'gameplay' && (
          <group
            position={[1.1, -0.2, 0]}
            onClick={(e) => {
              e.stopPropagation()
              setPaused(!isPaused)
            }}
            onPointerOver={() => {
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto'
            }}
          >
            <mesh>
              <planeGeometry args={[1.4, 0.35]} />
              <meshBasicMaterial
                color={isPaused ? '#00ffcc' : '#1a2a2a'}
                opacity={0.15}
                transparent
                wireframe
              />
            </mesh>
            <mesh position={[0, 0, -0.001]}>
              <planeGeometry args={[1.4, 0.35]} />
              <meshBasicMaterial
                color={isPaused ? '#00ffcc' : '#1a2a2a'}
                opacity={isPaused ? 0.3 : 0.8}
                transparent
              />
            </mesh>
            <Text
              position={[0, 0, 0.001]}
              fontSize={0.12}
              color={isPaused ? '#00ffcc' : '#446655'}
              anchorX="center"
              anchorY="middle"
            >
              {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
            </Text>
          </group>
        )}

        {/* Overheat Warning */}
        {isOverheated && (
          <Text
            position={[0, -0.3, 0.01]}
            fontSize={0.15}
            color="#ff0000"
            anchorX="center"
            anchorY="middle"
          >
            ⚠ OVERHEAT ⚠
          </Text>
        )}
      </group>

      {/* Top Bezel (Back edge of screen, z = -0.5) */}
      <mesh position={[0, 0.45, -0.55]}>
        <boxGeometry args={[4.2, 0.1, 0.1]} />
        <meshStandardMaterial color="#111820" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Bottom Bezel (Front edge of screen, z = 0.5) */}
      <mesh position={[0, 0.45, 0.55]}>
        <boxGeometry args={[4.2, 0.1, 0.1]} />
        <meshStandardMaterial color="#111820" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Left Bezel */}
      <mesh position={[-2.05, 0.45, 0]}>
        <boxGeometry args={[0.1, 0.1, 1.2]} />
        <meshStandardMaterial color="#111820" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Right Bezel */}
      <mesh position={[2.05, 0.45, 0]}>
        <boxGeometry args={[0.1, 0.1, 1.2]} />
        <meshStandardMaterial color="#111820" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* LED Strip Indicator (Top Bezel) */}
      <mesh position={[0, 0.51, -0.52]}>
        <boxGeometry args={[3.8, 0.02, 0.04]} />
        <meshBasicMaterial color={isOverheated ? '#ff0000' : '#00ffcc'} />
      </mesh>

      {/* Hardware Screws */}
      {[-2.05, 2.05].map((x) =>
        [-0.55, 0.55].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.51, z]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.01, 8]} />
            <meshStandardMaterial color="#444" metalness={0.9} roughness={0.2} />
          </mesh>
        ))
      )}
    </group>
  )
}
