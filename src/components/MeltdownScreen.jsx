import { Html } from '@react-three/drei'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { audioManager } from '../audio/AudioEngine'
import { useGameStore } from '../store'

export function MeltdownScreen() {
  const phase = useGameStore((s) => s.phase)
  const sessionCredits = useGameStore((s) => s.sessionCredits)
  const resetSession = useGameStore((s) => s.resetSession)

  useEffect(() => {
    if (phase === 'meltdown') {
      audioManager.playMeltdown()
      document.exitPointerLock?.()
      // Auto-advance to report after meltdown animation
      const timer = setTimeout(() => {
        useGameStore.getState().setPhase('report')
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [phase])

  const isMeltdownPhase = phase === 'meltdown'

  return (
    <Html fullscreen zIndexRange={[200, 0]}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{ width: '100%', height: '100%' }}
      >
        {isMeltdownPhase ? (
          <div
            data-testid="meltdown-screen"
            style={{
              width: '100vw',
              height: '100vh',
              background: 'rgba(255,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                color: '#ff0000',
                fontFamily: 'monospace',
                fontSize: '48px',
                textShadow: '0 0 40px #ff0000',
              }}
            >
              ⚠ CRITICAL MELTDOWN ⚠
            </div>
          </div>
        ) : (
          <div
            data-testid="meltdown-screen"
            style={{
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '20px',
              pointerEvents: 'all',
            }}
          >
            <div
              style={{
                color: '#ff4400',
                fontFamily: 'monospace',
                fontSize: '36px',
                letterSpacing: '0.3em',
              }}
            >
              TITAN LOST
            </div>
            <div style={{ color: '#ffaa00', fontFamily: 'monospace', fontSize: '20px' }}>
              CREDITS RECOVERED: ${sessionCredits}
            </div>
            <div
              style={{
                color: '#666',
                fontFamily: 'monospace',
                fontSize: '13px',
                marginTop: '10px',
              }}
            >
              REBOOTING...
            </div>
            <button
              type="button"
              onClick={resetSession}
              style={{
                background: 'transparent',
                border: '1px solid #ff4400',
                color: '#ff4400',
                fontFamily: 'monospace',
                fontSize: '15px',
                padding: '10px 28px',
                cursor: 'pointer',
                letterSpacing: '0.15em',
                marginTop: '20px',
              }}
            >
              [ RETURN TO BASE ]
            </button>
          </div>
        )}
      </motion.div>
    </Html>
  )
}
