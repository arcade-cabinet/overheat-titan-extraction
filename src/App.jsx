import { Canvas, useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { AnimatePresence } from 'framer-motion'
import { Suspense, useEffect, useRef } from 'react'
import { AmbientSpores } from './components/AmbientSpores'
import { BootScreen } from './components/BootScreen'
import { Cockpit } from './components/Cockpit'
import { Environment } from './components/Environment'
import { MainMenu } from './components/MainMenu'
import { MeltdownScreen } from './components/MeltdownScreen'
import { MobileControls } from './components/MobileControls'
import { OreSpawner } from './components/OreSpawner'
import { PauseMenu } from './components/PauseMenu'
import { Player } from './components/Player'
import { SettingsMenu } from './components/SettingsMenu'
import { Silo } from './components/Silo'
import { Sparks } from './components/Sparks'
import { Terrain } from './components/Terrain'
import { UpgradeConsole } from './components/UpgradeConsole'
import { UpgradesTerminal } from './components/UpgradesTerminal'
import { VisualEffects } from './components/VisualEffects'
import { useECSFrame, useECSSetup } from './ecs/useECS'
import { initDesktopInput, resetFrameEvents } from './input/InputService'
import { useGameStore } from './store'

function FrameResetter() {
  useFrame(() => {
    resetFrameEvents()
  }, 999) // run at end of frame
  return null
}

function Scene() {
  const phase = useGameStore((s) => s.phase)
  const isPaused = useGameStore((s) => s.isPaused)
  const isMelting = useGameStore((s) => s.isMelting)
  const isOverheated = useGameStore((s) => s.isOverheated)
  const upgrades = useGameStore((s) => s.upgrades)
  const sparkTriggerRef = useRef(null)

  // ECS setup — creates mech + silo entities on mount
  useECSSetup(upgrades)

  // Track camera position each frame for proximity queries (avoids Zustand subscription overhead)
  const playerPosRef = useRef({ x: 0, z: 0 })

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
      <UpgradeConsole />
      <Physics gravity={[0, -9.81, 0]} paused={phase !== 'gameplay' || isPaused}>
        <Terrain />
        <Silo />
        <MeltdownExplosion />
        {(phase === 'gameplay' || isMelting) && (
          <>
            <OreSpawner onSparkTrigger={(pos) => sparkTriggerRef.current?.(pos)} />
            <Player />
          </>
        )}
      </Physics>
      {phase === 'gameplay' && <Cockpit />}
      <Sparks triggerRef={sparkTriggerRef} />
      <VisualEffects />

      {/* UI Overlays — conditionally rendered so AnimatePresence sees true mount/unmount */}
      <AnimatePresence mode="wait">
        {(phase === 'powered_down' || phase === 'boot') && <BootScreen key="boot" />}
        {phase === 'menu' && <MainMenu key="menu" />}
        {phase === 'gameplay' && isPaused && <PauseMenu key="pause" />}
        {phase === 'settings' && <SettingsMenu key="settings" />}
        {(phase === 'meltdown' || phase === 'report' || isMelting) && (
          <MeltdownScreen key="meltdown" />
        )}
        {phase === 'upgrades' && <UpgradesTerminal key="upgrades" />}
      </AnimatePresence>
    </>
  )
}

export default function App() {
  const phase = useGameStore((s) => s.phase)
  const isPaused = useGameStore((s) => s.isPaused)

  useEffect(() => {
    return initDesktopInput()
  }, [])

  return (
    <>
      <Canvas
        shadows
        camera={{ fov: 75, near: 0.1, far: 500, position: [0, 5, 10] }}
        style={{ background: '#020406', touchAction: 'none' }}
        gl={{ antialias: true, toneMapping: 0 }}
      >
        <FrameResetter />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      {phase === 'gameplay' && !isPaused && <MobileControls />}
    </>
  )
}
