import { useEffect } from 'react'
import { Html } from '@react-three/drei'
import { useGameStore } from '../store'
import { audioManager } from '../audio/AudioEngine'

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

  if (phase !== 'meltdown' && phase !== 'report') return null

  if (phase === 'meltdown') {
    return (
      <Html fullscreen zIndexRange={[200, 0]}>
        <div style={{
          width: '100vw', height: '100vh',
          background: 'rgba(255,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', pointerEvents: 'none',
        }}>
          <div style={{ color: '#ff0000', fontFamily: 'monospace', fontSize: '48px', textShadow: '0 0 40px #ff0000' }}>
            ⚠ CRITICAL MELTDOWN ⚠
          </div>
        </div>
      </Html>
    )
  }

  return (
    <Html fullscreen zIndexRange={[200, 0]}>
      <div style={{
        width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '20px', pointerEvents: 'all'
      }}>
        <div style={{ color: '#ff4400', fontFamily: 'monospace', fontSize: '36px', letterSpacing: '0.3em' }}>
          TITAN LOST
        </div>
        <div style={{ color: '#ffaa00', fontFamily: 'monospace', fontSize: '20px' }}>
          CREDITS RECOVERED: ${sessionCredits}
        </div>
        <div style={{ color: '#666', fontFamily: 'monospace', fontSize: '13px', marginTop: '10px' }}>
          REBOOTING...
        </div>
        <button onClick={resetSession} style={{
          background: 'transparent', border: '1px solid #ff4400',
          color: '#ff4400', fontFamily: 'monospace', fontSize: '15px',
          padding: '10px 28px', cursor: 'pointer', letterSpacing: '0.15em', marginTop: '20px'
        }}>
          [ RETURN TO BASE ]
        </button>
      </div>
    </Html>
  )
}
