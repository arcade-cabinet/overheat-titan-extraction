import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { audioManager } from '../audio/AudioEngine'
import { gameConfig } from '../config'
import { useGameStore } from '../store'

// Console world position — near the silo, facing the spawn point
const CONSOLE_POSITION = [6, 0, -3]
const INTERACT_RADIUS = 4 // metres — must be within this range to click

// CanvasTexture is 512×256
const W = 512
const H = 256

// Upgrade tracks (same data as UpgradesTerminal Html overlay)
const UPGRADES = [
  {
    key: 'cap',
    label: 'HOPPER CAP',
    desc: `+${gameConfig.mech.hopper.capacityPerUpgrade} ore/lvl`,
    baseCost: gameConfig.upgrades.cap.baseCost,
  },
  {
    key: 'pow',
    label: 'GRIND POWER',
    desc: `+${gameConfig.mech.grind.dpsPerUpgrade * 100}% DPS/lvl`,
    baseCost: gameConfig.upgrades.pow.baseCost,
  },
  {
    key: 'cool',
    label: 'COOLING SYS',
    desc: `+${gameConfig.mech.heat.coolingRatePerUpgrade * 100}% cool/lvl`,
    baseCost: gameConfig.upgrades.cool.baseCost,
  },
]

// Button hit zones in canvas pixel coords for each upgrade row
// Layout: row 0=cap at y~90, row 1=pow at y~140, row 2=cool at y~190
// Button drawn right-aligned at x:350-490, height 28
function makeButtonZones() {
  return UPGRADES.map((u, i) => ({
    key: u.key,
    px: 350,
    py: 78 + i * 52,
    pw: 148,
    ph: 28,
    uMin: 350 / W,
    uMax: (350 + 148) / W,
    vMin: 1 - (78 + i * 52 + 28) / H,
    vMax: 1 - (78 + i * 52) / H,
  }))
}

const BUTTON_ZONES = makeButtonZones()

export function UpgradeConsole() {
  const credits = useGameStore((s) => s.credits)
  const upgrades = useGameStore((s) => s.upgrades)
  const buyUpgrade = useGameStore((s) => s.buyUpgrade)
  const phase = useGameStore((s) => s.phase)
  const isPaused = useGameStore((s) => s.isPaused)
  const { camera } = useThree()

  const inRangeRef = useRef(false)

  // Track distance from console each frame
  useFrame(() => {
    const dx = camera.position.x - CONSOLE_POSITION[0]
    const dz = camera.position.z - CONSOLE_POSITION[2]
    inRangeRef.current = Math.sqrt(dx * dx + dz * dz) < INTERACT_RADIUS
  })

  const { canvas, ctx, texture } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const cx = c.getContext('2d')
    const tex = new THREE.CanvasTexture(c)
    return { canvas: c, ctx: cx, texture: tex }
  }, [])

  useEffect(() => {
    return () => texture.dispose()
  }, [texture])

  // Redraw canvas when game state changes
  useEffect(() => {
    if (!ctx) return

    ctx.fillStyle = '#02080e'
    ctx.fillRect(0, 0, W, H)

    // Header
    ctx.fillStyle = '#00ffcc'
    ctx.font = 'bold 18px monospace'
    ctx.textAlign = 'left'
    ctx.fillText('TITAN OS TERMINAL', 14, 24)

    ctx.fillStyle = '#ffaa00'
    ctx.font = '13px monospace'
    ctx.fillText(`CREDITS: $${credits}`, 14, 44)

    // Border
    ctx.strokeStyle = '#00ffcc'
    ctx.lineWidth = 1.5
    ctx.strokeRect(2, 2, W - 4, H - 4)

    // Separator
    ctx.strokeStyle = '#1a3a3a'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(14, 54)
    ctx.lineTo(W - 14, 54)
    ctx.stroke()

    // Upgrade rows
    for (let i = 0; i < UPGRADES.length; i++) {
      const u = UPGRADES[i]
      const zone = BUTTON_ZONES[i]
      const level = upgrades[u.key]
      const cost = u.baseCost * level
      const canAfford = credits >= cost
      const rowY = 78 + i * 52

      ctx.fillStyle = '#00ffcc'
      ctx.font = 'bold 13px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`${u.label} [LVL ${level}]`, 14, rowY + 14)

      ctx.fillStyle = '#557766'
      ctx.font = '11px monospace'
      ctx.fillText(u.desc, 14, rowY + 28)

      // Button
      const btnColor = canAfford ? '#ffaa00' : '#333'
      ctx.strokeStyle = btnColor
      ctx.lineWidth = 1.5
      ctx.strokeRect(zone.px, zone.py, zone.pw, zone.ph)
      ctx.fillStyle = canAfford ? 'rgba(255,170,0,0.1)' : 'transparent'
      ctx.fillRect(zone.px, zone.py, zone.pw, zone.ph)
      ctx.fillStyle = canAfford ? '#ffaa00' : '#444'
      ctx.font = 'bold 12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`UPGRADE $${cost}`, zone.px + zone.pw / 2, zone.py + 19)
    }

    // Footer — range hint
    ctx.textAlign = 'center'
    ctx.fillStyle = '#225533'
    ctx.font = '10px monospace'
    ctx.fillText('APPROACH TO INTERACT', W / 2, H - 10)

    texture.needsUpdate = true
  }, [credits, ctx, texture, upgrades])

  function handlePointerDown(event) {
    if (phase !== 'gameplay' || isPaused) return
    if (!inRangeRef.current) return

    const uv = event.uv
    if (!uv) return

    for (const zone of BUTTON_ZONES) {
      if (uv.x >= zone.uMin && uv.x <= zone.uMax && uv.y >= zone.vMin && uv.y <= zone.vMax) {
        const u = UPGRADES.find((u) => u.key === zone.key)
        if (!u) return
        const level = upgrades[u.key]
        const cost = u.baseCost * level
        if (credits >= cost) {
          audioManager.playSell()
          buyUpgrade(u.key, cost)
        } else {
          audioManager.playBlip()
        }
        event.stopPropagation()
        return
      }
    }
  }

  return (
    <group position={CONSOLE_POSITION}>
      {/* Base pedestal */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.8, 1.2, 0.5]} />
        <meshStandardMaterial color="#0a1218" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Screen face — CanvasTexture on front face (+Z) */}
      <mesh position={[0, 1.4, 0.26]} rotation={[-0.2, 0, 0]} onPointerDown={handlePointerDown}>
        <boxGeometry args={[1.6, 0.8, 0.04]} />
        <meshStandardMaterial attach="material-0" color="#0a1218" />
        <meshStandardMaterial attach="material-1" color="#0a1218" />
        <meshStandardMaterial attach="material-2" color="#0a1218" />
        <meshStandardMaterial attach="material-3" color="#0a1218" />
        <meshBasicMaterial attach="material-4" map={texture} />
        <meshStandardMaterial attach="material-5" color="#0a1218" />
      </mesh>

      {/* Accent light strip */}
      <mesh position={[0, 0.06, 0.26]}>
        <boxGeometry args={[1.8, 0.04, 0.04]} />
        <meshBasicMaterial color="#00ffcc" />
      </mesh>
    </group>
  )
}
