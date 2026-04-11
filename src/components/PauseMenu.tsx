import { Html } from '@react-three/drei'
import { motion } from 'framer-motion'
import { useTrait } from 'koota/react'
import { useEffect } from 'react'
import { audioManager } from '../audio/AudioEngine'
import { gameActions } from '../ecs/actions'
import { GlobalState } from '../ecs/traits'
import { GameStateEntity } from '../ecs/world'

export function PauseMenu() {
  const phase = useTrait(GameStateEntity, GlobalState)?.phase
  const isPaused = useTrait(GameStateEntity, GlobalState)?.isPaused
  const setPaused = gameActions.setPaused
  const setPhase = gameActions.setPhase

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && phase === 'gameplay' && !e.repeat) {
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
          data-testid="pause-menu"
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
      </motion.div>
    </Html>
  )
}

function btnStyle(color: any) {
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
