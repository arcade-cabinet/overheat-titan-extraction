import { Html } from '@react-three/drei'
import { useEffect } from 'react'
import { audioManager } from '../audio/AudioEngine'
import { useGameStore } from '../store'

export function PauseMenu() {
  const phase = useGameStore((s) => s.phase)
  const isPaused = useGameStore((s) => s.isPaused)
  const setPaused = useGameStore((s) => s.setPaused)
  const setPhase = useGameStore((s) => s.setPhase)

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Escape' && phase === 'gameplay') {
        audioManager.playBlip()
        const pausing = !isPaused
        setPaused(pausing)
        audioManager.setPauseFilter(pausing)
        if (pausing) document.exitPointerLock?.()
        else document.body.requestPointerLock?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, isPaused])

  if (!isPaused || phase !== 'gameplay') return null

  return (
    <Html fullscreen zIndexRange={[100, 0]}>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
          background: 'rgba(0,5,10,0.75)',
          pointerEvents: 'all',
        }}
      >
        <div
          style={{
            color: '#00ffcc',
            fontFamily: 'monospace',
            fontSize: '22px',
            letterSpacing: '0.3em',
            marginBottom: '16px',
          }}
        >
          ⚙ DIAGNOSTICS MODE
        </div>
        <button
          type="button"
          onClick={() => {
            audioManager.playBlip()
            setPaused(false)
            audioManager.setPauseFilter(false)
            document.body.requestPointerLock?.()
          }}
          style={btnStyle('#00ffcc')}
        >
          [ RESUME ]
        </button>
        <button
          type="button"
          onClick={() => {
            audioManager.playBlip()
            setPhase('settings')
          }}
          style={btnStyle('#ffaa00')}
        >
          [ SETTINGS ]
        </button>
        <button
          type="button"
          onClick={() => {
            audioManager.playBlip()
            setPaused(false)
            audioManager.setPauseFilter(false)
            setPhase('menu')
            document.exitPointerLock?.()
          }}
          style={btnStyle('#ff4400')}
        >
          [ ABORT MISSION ]
        </button>
      </div>
    </Html>
  )
}

function btnStyle(color) {
  return {
    background: 'transparent',
    border: `1px solid ${color}`,
    color,
    fontFamily: 'monospace',
    fontSize: '15px',
    padding: '10px 28px',
    cursor: 'pointer',
    letterSpacing: '0.15em',
  }
}
