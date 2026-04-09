import { useEffect, useState } from 'react'
import { Html } from '@react-three/drei'
import { useGameStore } from '../store'
import { audioManager } from '../audio/AudioEngine'

export function BootScreen() {
  const phase = useGameStore((s) => s.phase)
  const setPhase = useGameStore((s) => s.setPhase)
  const [blink, setBlink] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => setBlink((b) => !b), 500)
    return () => clearInterval(interval)
  }, [])

  if (phase !== 'powered_down') return null

  const handleClick = () => {
    audioManager.init()
    audioManager.playPowerUp()
    setPhase('boot')
    setTimeout(() => setPhase('menu'), 2000)
  }

  return (
    <Html fullscreen zIndexRange={[100, 0]}>
      <div
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
        }}
      >
        <div style={{ color: '#00ffcc', fontFamily: 'monospace', fontSize: '14px', letterSpacing: '0.2em', marginBottom: '20px' }}>
          OVERHEAT: TITAN EXTRACTION
        </div>
        <div style={{ color: '#00ffcc', fontFamily: 'monospace', fontSize: '18px', opacity: blink ? 1 : 0 }}>
          ▶ AWAITING PILOT INPUT...
        </div>
        <div style={{ color: '#006655', fontFamily: 'monospace', fontSize: '11px', marginTop: '40px' }}>
          CLICK TO INITIALIZE TITAN SYSTEMS
        </div>
      </div>
    </Html>
  )
}
