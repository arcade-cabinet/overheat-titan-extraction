import { Html } from '@react-three/drei'
import { motion } from 'framer-motion'
import { audioManager } from '../audio/AudioEngine'
import { useGameStore } from '../store'

const UPGRADES = [
  { key: 'cap', label: 'HOPPER CAPACITY', desc: '+100 ore cap per level', baseCost: 100 },
  { key: 'pow', label: 'GRIND POWER', desc: '+50% DPS per level', baseCost: 150 },
  { key: 'cool', label: 'COOLING SYSTEM', desc: '+50% cooling rate per level', baseCost: 200 },
]

export function UpgradesTerminal() {
  const phase = useGameStore((s) => s.phase)
  const credits = useGameStore((s) => s.credits)
  const upgrades = useGameStore((s) => s.upgrades)
  const buyUpgrade = useGameStore((s) => s.buyUpgrade)
  const setPhase = useGameStore((s) => s.setPhase)

  if (phase !== 'upgrades') return null

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
          data-testid="upgrades-terminal"
          style={{
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,5,10,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '16px',
            pointerEvents: 'all',
          }}
        >
          <div
            style={{
              color: '#00ffcc',
              fontFamily: 'monospace',
              fontSize: '22px',
              letterSpacing: '0.3em',
              marginBottom: '10px',
            }}
          >
            TITAN OS TERMINAL
          </div>
          <div
            style={{
              color: '#ffaa00',
              fontFamily: 'monospace',
              fontSize: '16px',
              marginBottom: '16px',
            }}
          >
            CREDITS: ${credits}
          </div>
          {UPGRADES.map((u) => {
            const level = upgrades[u.key]
            const cost = u.baseCost * level
            const canAfford = credits >= cost
            return (
              <div key={u.key} style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ color: '#aaa', fontFamily: 'monospace', width: '200px' }}>
                  <div style={{ color: '#00ffcc' }}>
                    {u.label} [LVL {level}]
                  </div>
                  <div style={{ fontSize: '11px' }}>{u.desc}</div>
                </div>
                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={() => {
                    audioManager.playSell()
                    buyUpgrade(u.key, cost)
                  }}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${canAfford ? '#ffaa00' : '#444'}`,
                    color: canAfford ? '#ffaa00' : '#444',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    padding: '8px 16px',
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    letterSpacing: '0.1em',
                  }}
                >
                  UPGRADE ${cost}
                </button>
              </div>
            )
          })}
          <button
            type="button"
            onClick={() => {
              audioManager.playBlip()
              setPhase('menu')
            }}
            style={{
              background: 'transparent',
              border: '1px solid #00ffcc',
              color: '#00ffcc',
              fontFamily: 'monospace',
              fontSize: '14px',
              padding: '10px 28px',
              cursor: 'pointer',
              letterSpacing: '0.15em',
              marginTop: '20px',
            }}
          >
            [ BACK ]
          </button>
        </div>
      </motion.div>
    </Html>
  )
}
