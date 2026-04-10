import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { AnimatePresence } from 'framer-motion'
import { Suspense } from 'react'
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
import { Sparks, useSparks } from './components/Sparks'
import { Terrain } from './components/Terrain'
import { UpgradesTerminal } from './components/UpgradesTerminal'
import { VisualEffects } from './components/VisualEffects'
import { useGameStore } from './store'

function Scene() {
  const phase = useGameStore((s) => s.phase)
  const isPaused = useGameStore((s) => s.isPaused)
  const isMelting = useGameStore((s) => s.isMelting)
  const { sparks, spawnSpark } = useSparks()

  return (
    <>
      <Environment />
      <AmbientSpores />
      <Physics gravity={[0, -9.81, 0]} paused={phase !== 'gameplay' || isPaused}>
        <Terrain />
        <Silo />
        {(phase === 'gameplay' || isMelting) && (
          <>
            <OreSpawner onSparkTrigger={spawnSpark} />
            <Player />
            <Sparks sparks={sparks} />
          </>
        )}
      </Physics>
      {phase === 'gameplay' && <Cockpit />}
      <VisualEffects />

      {/* UI Overlays with framer-motion transitions */}
      <AnimatePresence mode="wait">
        <BootScreen key="boot" />
        <MainMenu key="menu" />
        <PauseMenu key="pause" />
        <SettingsMenu key="settings" />
        <MeltdownScreen key="meltdown" />
        <UpgradesTerminal key="upgrades" />
      </AnimatePresence>
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
