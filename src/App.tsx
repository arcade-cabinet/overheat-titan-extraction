import React from 'react';
import { Capacitor } from '@capacitor/core'
import { ScreenOrientation } from '@capacitor/screen-orientation'
import { StatusBar } from '@capacitor/status-bar'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { AnimatePresence } from 'framer-motion'
import { Suspense, useEffect, useRef } from 'react'
import { AmbientSpores } from './components/AmbientSpores'
import { BootScreen } from './components/BootScreen'
import { BountyTerminal } from './components/BountyTerminal'
import { Cockpit } from './components/Cockpit'
import { Environment } from './components/Environment'
import { MainMenu } from './components/MainMenu'
import { MeltdownExplosion } from './components/MeltdownExplosion'
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
import { useGameStore, loadPersistentState } from './store'

function FrameResetter() {
  useFrame(() => {
    resetFrameEvents()
  }, 999) // run at end of frame
  return null
}

import { ecsWorld } from './ecs/world'

function Scene() {
  const store = useGameStore()
  const sparkTriggerRef = useRef<((pos: [number, number, number]) => void) | null>(null)

  // ECS setup
  useECSSetup(store.upgrades)

  // Track camera position each frame
  const playerPosRef = useRef({ x: 0, z: 0 })

  useFrame(({ camera }, delta) => {
    playerPosRef.current.x = camera.position.x
    playerPosRef.current.z = camera.position.z

    if (store.phase === 'gameplay' && !store.isPaused && !store.isMelting) {
      store.evaluateContracts(delta)
    }
  })

  // ECS frame runner — bridges Zustand state into ECS systems
  useECSFrame({
    playerPos: playerPosRef.current,
    isOverheated: store.isOverheated,
    isPaused: store.isPaused || store.phase !== 'gameplay',
    upgrades: store.upgrades,
  })

  return (
    <>
      <Environment />
      <AmbientSpores />
      <UpgradeConsole />
      <BountyTerminal />
      <Physics gravity={[0, -9.81, 0]} paused={store.phase !== 'gameplay' || store.isPaused}>
        <Terrain />
        <Silo />
        <MeltdownExplosion />
        {(store.phase === 'gameplay' || store.isMelting) && (
          <>
            <OreSpawner onSparkTrigger={(pos) => sparkTriggerRef.current?.(pos)} />
            <Player />
          </>
        )}
        {store.phase === 'gameplay' && <Cockpit />}
      </Physics>
      <Sparks triggerRef={sparkTriggerRef} />
      <VisualEffects />

      {/* UI Overlays — conditionally rendered so AnimatePresence sees true mount/unmount */}
      <AnimatePresence mode="wait">
        {(store.phase === 'powered_down' || store.phase === 'boot') && <BootScreen key="boot" />}
        {store.phase === 'menu' && <MainMenu key="menu" />}
        {store.phase === 'gameplay' && store.isPaused && <PauseMenu key="pause" />}
        {store.phase === 'settings' && <SettingsMenu key="settings" />}
        {(store.phase === 'meltdown' || store.phase === 'report' || store.isMelting) && (
          <MeltdownScreen key="meltdown" />
        )}
        {store.phase === 'upgrades' && <UpgradesTerminal key="upgrades" />}
      </AnimatePresence>
    </>
  )
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

import { WorldProvider } from 'koota/react'

export default function App() {
  const phase = useGameStore((s) => s.phase)
  const isPaused = useGameStore((s) => s.isPaused)

  useEffect(() => {
    loadPersistentState()
    if (Capacitor.isNativePlatform()) {
      StatusBar.hide().catch(console.warn)
      ScreenOrientation.lock({ orientation: 'landscape' }).catch(console.warn)
    }
    return initDesktopInput()
  }, [])

  return (
    <WorldProvider world={ecsWorld}>
      <ErrorBoundary>
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
      </ErrorBoundary>
      {phase === 'gameplay' && !isPaused && <MobileControls />}
    </WorldProvider>
  )
}
