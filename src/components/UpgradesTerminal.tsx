import { Html } from '@react-three/drei'
import { motion } from 'framer-motion'
import { useTrait } from 'koota/react'
import { audioManager } from '../audio/AudioEngine'
import { gameConfig } from '../config'
import { gameActions } from '../ecs/actions'
import { GlobalState, Upgrades } from '../ecs/traits'
import { GameStateEntity } from '../ecs/world'

const UPGRADES = [
  {
    key: 'cap',
    label: 'HOPPER CAPACITY',
    desc: `+${gameConfig.mech.hopper.capacityPerUpgrade} ore cap per level`,
    baseCost: gameConfig.upgrades.cap.baseCost,
  },
  {
    key: 'pow',
    label: 'GRIND POWER',
    desc: `+${gameConfig.mech.grind.dpsPerUpgrade * 100}% DPS per level`,
    baseCost: gameConfig.upgrades.pow.baseCost,
  },
  {
    key: 'cool',
    label: 'COOLING SYSTEM',
    desc: `+${gameConfig.mech.heat.coolingRatePerUpgrade * 100}% cooling rate per level`,
    baseCost: gameConfig.upgrades.cool.baseCost,
  },
]

export function UpgradesTerminal() {
  const credits = useTrait(GameStateEntity, GlobalState)?.credits ?? 0
  const upgrades = useTrait(GameStateEntity, Upgrades)
  const buyUpgrade = gameActions.buyUpgrade
  const setPhase = gameActions.setPhase

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
            const level = upgrades?.[u.key as keyof typeof upgrades] ?? 1
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
                    buyUpgrade(u.key as any, cost)
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
