import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { useGameStore } from './store'

import { Environment } from './components/Environment'
import { Terrain } from './components/Terrain'
import { Silo } from './components/Silo'
import { OreSpawner } from './components/OreSpawner'
import { Player } from './components/Player'
import { AmbientSpores } from './components/AmbientSpores'
import { VisualEffects } from './components/VisualEffects'
import { Cockpit } from './components/Cockpit'

import { BootScreen } from './components/BootScreen'
import { MainMenu } from './components/MainMenu'
import { PauseMenu } from './components/PauseMenu'
import { SettingsMenu } from './components/SettingsMenu'
import { MeltdownScreen } from './components/MeltdownScreen'
import { UpgradesTerminal } from './components/UpgradesTerminal'

function Scene() {
  const phase = useGameStore((s) => s.phase)
  const isPaused = useGameStore((s) => s.isPaused)
  const isMelting = useGameStore((s) => s.isMelting)

  return (
    <>
      <Environment />
      <AmbientSpores />
      <Physics gravity={[0, -9.81, 0]} paused={phase !== 'gameplay' || isPaused}>
        <Terrain />
        <Silo />
        {(phase === 'gameplay' || isMelting) && (
          <>
            <OreSpawner />
            <Player />
          </>
        )}
      </Physics>
      {phase === 'gameplay' && <Cockpit />}
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
