import { Html } from '@react-three/drei'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { audioManager } from '../audio/AudioEngine'
import { useGameStore } from '../store'
import { generateSeedPhrase } from '../utils/seedPhrase'

export function MainMenu() {
  const phase = useGameStore((s) => s.phase)
  const setPhase = useGameStore((s) => s.setPhase)
  const [seedPhrase, setSeedPhrase] = useState('')

  useEffect(() => {
    setSeedPhrase(generateSeedPhrase())
  }, [])

  if (phase !== 'menu') return null

  const startGame = () => {
    audioManager.playBlip()
    document.body.requestPointerLock?.()
    setPhase('gameplay')
  }

  const openSettings = () => {
    audioManager.playBlip()
    setPhase('settings')
  }

  const openUpgrades = () => {
    audioManager.playBlip()
    setPhase('upgrades')
  }

  return (
    <Html fullscreen zIndexRange={[100, 0]}>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{ width: '100%', height: '100%' }}
      >
        <div
          data-testid="main-menu"
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '20px',
            background: 'rgba(0,0,0,0.6)',
            pointerEvents: 'all',
          }}
        >
          <div
            style={{
              color: '#00ffcc',
              fontFamily: 'monospace',
              fontSize: '28px',
              letterSpacing: '0.3em',
              marginBottom: '4px',
              textShadow: '0 0 20px #00ffcc',
            }}
          >
            OVERHEAT
          </div>
          <div
            style={{
              color: '#006655',
              fontFamily: 'monospace',
              fontSize: '12px',
              letterSpacing: '0.15em',
              marginBottom: '16px',
              opacity: 0.7,
            }}
          >
            RUN SEED: {seedPhrase}
          </div>
          <button type="button" onClick={startGame} style={btnStyle('#00ffcc')}>
            [ NEW EXCAVATION ]
          </button>
          <button type="button" onClick={openUpgrades} style={btnStyle('#ffaa00')}>
            [ TITAN OS TERMINAL ]
          </button>
          <button type="button" onClick={openSettings} style={btnStyle('#ffaa00')}>
            [ OS CONFIG ]
          </button>
        </div>
      </motion.div>
    </Html>
  )
}

function btnStyle(color) {
  return {
    background: 'transparent',
    border: `1px solid ${color}`,
    color,
    fontFamily: 'monospace',
    fontSize: '16px',
    padding: '12px 32px',
    cursor: 'pointer',
    letterSpacing: '0.15em',
    transition: 'background 0.2s',
  }
}
