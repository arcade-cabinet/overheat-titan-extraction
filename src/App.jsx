import { Canvas, useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Suspense, useRef } from 'react'
import { AmbientSpores } from './components/AmbientSpores'
import { BootScreen } from './components/BootScreen'
import { Cockpit } from './components/Cockpit'
import { Environment } from './components/Environment'
import { MainMenu } from './components/MainMenu'
import { MeltdownScreen } from './components/MeltdownScreen'
import { OreSpawner } from './components/OreSpawner'
import { PauseMenu } from './components/PauseMenu'
import { Player } from './components/Player'
import { SettingsMenu } from './components/SettingsMenu'
import { Silo } from './components/Silo'
import { Sparks } from './components/Sparks'
import { Terrain } from './components/Terrain'
import { UpgradesTerminal } from './components/UpgradesTerminal'
import { VisualEffects } from './components/VisualEffects'
import { useECSFrame, useECSSetup } from './ecs/useECS'
import { useGameStore } from './store'

function Scene() {
  const phase = useGameStore((s) => s.phase)
  const isPaused = useGameStore((s) => s.isPaused)
  const isMelting = useGameStore((s) => s.isMelting)
  const isOverheated = useGameStore((s) => s.isOverheated)
  const upgrades = useGameStore((s) => s.upgrades)

  // ECS setup — creates mech + silo entities on mount
  useECSSetup(upgrades)

  // Track camera position each frame for proximity queries (avoids Zustand subscription overhead)
  const playerPosRef = useRef({ x: 0, z: 0 })
  const sparkTriggerRef = useRef(null)

  useFrame(({ camera }) => {
    playerPosRef.current.x = camera.position.x
    playerPosRef.current.z = camera.position.z
  })

  // ECS frame runner — bridges Zustand state into ECS systems
  useECSFrame({
    playerPos: playerPosRef.current,
    isOverheated,
    isPaused: isPaused || phase !== 'gameplay',
    upgrades,
  })

  return (
    <>
      <Environment />
      <AmbientSpores />
      <Physics gravity={[0, -9.81, 0]} paused={phase !== 'gameplay' || isPaused}>
        <Terrain />
        <Silo />
        {(phase === 'gameplay' || isMelting) && (
          <>
            <OreSpawner sparkTriggerRef={sparkTriggerRef} />
            <Player />
          </>
        )}
      </Physics>
      {phase === 'gameplay' && <Cockpit />}
      <Sparks triggerRef={sparkTriggerRef} />
      <VisualEffects />

      {/* UI Overlays */}
      <BootScreen />
      <MainMenu />
      <PauseMenu />
      <SettingsMenu />
      <MeltdownScreen />
      <UpgradesTerminal />
    </>
  )
}

export default function App() {
  return (
    <Canvas
      shadows
      camera={{ fov: 75, near: 0.1, far: 500, position: [0, 5, 10] }}
      style={{ background: '#020406' }}
      gl={{ antialias: true, toneMapping: 0 }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  )
}
