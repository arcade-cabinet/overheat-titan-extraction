import { Html } from '@react-three/drei'
import { motion } from 'framer-motion'
import { useTrait } from 'koota/react'
import { useEffect, useRef, useState } from 'react'
import { audioManager } from '../audio/AudioEngine'
import { gameActions } from '../ecs/actions'
import { GlobalState } from '../ecs/traits'
import { GameStateEntity } from '../ecs/world'

export function BootScreen() {
  const phase = useTrait(GameStateEntity, GlobalState)?.phase
  const setPhase = gameActions.setPhase
  const [blink, setBlink] = useState(true)
  const bootTimerRef = useRef<any>(null)

  useEffect(() => {
    if (phase !== 'powered_down') return
    const interval = setInterval(() => setBlink((b) => !b), 500)
    return () => clearInterval(interval)
  }, [phase])

  useEffect(() => () => clearTimeout(bootTimerRef.current), [])

  const handleClick = () => {
    if (phase !== 'powered_down') return
    audioManager.init()
    audioManager.playPowerUp()
    setPhase('boot')
    bootTimerRef.current = setTimeout(() => setPhase('menu'), 2000)
  }

  return (
    <group>
      <mesh data-testid="boot-screen-mesh">
        <boxGeometry />
        <meshBasicMaterial color="red" />
      </mesh>
      <Html fullscreen zIndexRange={[100, 0]}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ width: '100%', height: '100%' }}
        >
          <button
            data-testid="boot-screen"
            type="button"
            onClick={handleClick}
            style={{
              width: '100vw',
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              cursor: 'pointer',
              userSelect: 'none',
              background: 'rgba(0,0,0,0.85)',
              border: 'none',
              padding: 0,
            }}
          >
            <div
              style={{
                color: '#00ffcc',
                fontFamily: 'monospace',
                fontSize: '14px',
                letterSpacing: '0.2em',
                marginBottom: '20px',
              }}
            >
              OVERHEAT: TITAN EXTRACTION
            </div>
            <div
              style={{
                color: '#00ffcc',
                fontFamily: 'monospace',
                fontSize: '18px',
                opacity: blink ? 1 : 0,
              }}
            >
              ▶ AWAITING PILOT INPUT...
            </div>
            <div
              style={{
                color: '#006655',
                fontFamily: 'monospace',
                fontSize: '11px',
                marginTop: '40px',
              }}
            >
              CLICK TO INITIALIZE TITAN SYSTEMS
            </div>
          </button>
        </motion.div>
      </Html>
    </group>
  )
}
