import { Html } from '@react-three/drei'
import { motion } from 'framer-motion'
import { audioManager } from '../audio/AudioEngine'
import { useGameStore } from '../store'

export function SettingsMenu() {
  const phase = useGameStore((s) => s.phase)
  const isPaused = useGameStore((s) => s.isPaused)
  const setPhase = useGameStore((s) => s.setPhase)
  const settings = useGameStore((s) => s.settings)
  const updateSetting = useGameStore((s) => s.updateSetting)

  if (phase !== 'settings') return null

  const back = () => {
    audioManager.playBlip()
    if (isPaused) {
      setPhase('gameplay')
      // Re-request pointer lock when returning to active gameplay
      document.body.requestPointerLock?.()
    } else {
      setPhase('menu')
    }
  }

  return (
    <Html fullscreen zIndexRange={[100, 0]}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{ width: '100%', height: '100%' }}
      >
        <div
          data-testid="settings-menu"
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '20px',
            background: 'rgba(0,5,10,0.85)',
            pointerEvents: 'all',
          }}
        >
          <div
            style={{
              color: '#ffaa00',
              fontFamily: 'monospace',
              fontSize: '22px',
              letterSpacing: '0.3em',
              marginBottom: '10px',
            }}
          >
            OS CONFIG
          </div>

          <label style={labelStyle}>
            <span style={{ color: '#00ffcc', fontFamily: 'monospace' }}>MASTER VOLUME</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.masterVolume}
              onChange={(e) => {
                updateSetting('masterVolume', parseFloat(e.target.value))
                audioManager.setVolume(parseFloat(e.target.value))
              }}
              style={{ accentColor: '#00ffcc' }}
            />
          </label>

          <label style={labelStyle}>
            <span style={{ color: '#00ffcc', fontFamily: 'monospace' }}>LOOK SENSITIVITY</span>
            <input
              type="range"
              min="0.2"
              max="3"
              step="0.1"
              value={settings.lookSensitivity}
              onChange={(e) => updateSetting('lookSensitivity', parseFloat(e.target.value))}
              style={{ accentColor: '#00ffcc' }}
            />
          </label>

          <label style={{ ...labelStyle, flexDirection: 'row', gap: '12px' }}>
            <span style={{ color: '#00ffcc', fontFamily: 'monospace' }}>CRT OVERLAYS</span>
            <input
              type="checkbox"
              checked={settings.crtOverlays}
              onChange={(e) => updateSetting('crtOverlays', e.target.checked)}
            />
          </label>

          <button type="button" onClick={back} style={btnStyle}>
            [ BACK ]
          </button>
        </div>
      </motion.div>
    </Html>
  )
}

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  color: '#aaa',
  fontFamily: 'monospace',
  fontSize: '13px',
}

const btnStyle = {
  background: 'transparent',
  border: '1px solid #00ffcc',
  color: '#00ffcc',
  fontFamily: 'monospace',
  fontSize: '15px',
  padding: '10px 28px',
  cursor: 'pointer',
  letterSpacing: '0.15em',
  marginTop: '16px',
}
