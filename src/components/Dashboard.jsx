import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import gameConfig from '../config.json'
import { useGameStore } from '../store'

const HOPPER_BAR = { x: 44, y: 74, width: 392, height: 20 }
const HEAT_BAR = { x: 44, y: 167, width: 392, height: 20 }
// Show full range up to meltdown threshold so players see the overheat danger zone
const DISPLAY_MAX_HEAT = gameConfig.mech.heat.meltdownThreshold
const OVERHEAT_THRESHOLD = gameConfig.mech.heat.overheatThreshold

// Pause button region in canvas pixel space (1024×256)
// Drawn bottom-right: x 620-980, y 155-245
const PAUSE_BTN = { x: 620, y: 155, width: 360, height: 90 }

// UV hit zone for the +Y face of the box mesh — maps PAUSE_BTN to [0,1]²
// BoxGeometry +Y face: U increases left→right, V increases back→front
// Canvas pixel→UV: u = px/1024, v = py/256 (V axis is flipped relative to canvas Y)
const PAUSE_UV = {
  uMin: PAUSE_BTN.x / 1024,
  uMax: (PAUSE_BTN.x + PAUSE_BTN.width) / 1024,
  vMin: 1 - (PAUSE_BTN.y + PAUSE_BTN.height) / 256,
  vMax: 1 - PAUSE_BTN.y / 256,
}

export function Dashboard() {
  const rawOre = useGameStore((s) => s.rawOre)
  const heat = useGameStore((s) => s.heat)
  const credits = useGameStore((s) => s.credits)
  const isOverheated = useGameStore((s) => s.isOverheated)
  const maxOre = useGameStore((s) => 100 * s.upgrades.cap)
  const phase = useGameStore((s) => s.phase)
  const isPaused = useGameStore((s) => s.isPaused)
  const setPaused = useGameStore((s) => s.setPaused)

  const { ctx, texture } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 256
    const cx = c.getContext('2d')
    const tex = new THREE.CanvasTexture(c)
    return { canvas: c, ctx: cx, texture: tex }
  }, [])

  useEffect(() => {
    return () => {
      texture.dispose()
    }
  }, [texture])

  useEffect(() => {
    if (!ctx) return

    ctx.fillStyle = '#050a0f'
    ctx.fillRect(0, 0, 1024, 256)

    const pct = Math.min(100, Math.floor((rawOre / maxOre) * 100))
    ctx.fillStyle = pct >= 100 ? '#ffaa00' : '#00ffcc'
    ctx.font = 'bold 36px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`HOPPER [${pct}%]`, 40, 55)
    ctx.strokeStyle = '#00ffcc'
    ctx.lineWidth = 3
    ctx.strokeRect(40, 70, 400, 28)
    ctx.fillStyle = '#00ffcc'
    ctx.fillRect(HOPPER_BAR.x, HOPPER_BAR.y, HOPPER_BAR.width * (pct / 100), HOPPER_BAR.height)

    ctx.fillStyle = isOverheated ? '#ff0000' : '#ff4400'
    ctx.font = 'bold 36px monospace'
    ctx.fillText(`HEAT [${Math.floor(heat)}°C]`, 40, 148)
    ctx.strokeStyle = isOverheated ? '#ff0000' : '#ff4400'
    ctx.lineWidth = 3
    ctx.strokeRect(40, 163, 400, 28)
    ctx.fillStyle = isOverheated ? '#ff0000' : '#ff4400'
    ctx.fillRect(
      HEAT_BAR.x,
      HEAT_BAR.y,
      HEAT_BAR.width * Math.min(1, heat / DISPLAY_MAX_HEAT),
      HEAT_BAR.height
    )
    // Overheat threshold marker — derived from config so it stays in sync with gameplay
    const overheatMarkerX = HEAT_BAR.x + HEAT_BAR.width * (OVERHEAT_THRESHOLD / DISPLAY_MAX_HEAT)
    ctx.strokeStyle = '#ff8800'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(overheatMarkerX, HEAT_BAR.y - 2)
    ctx.lineTo(overheatMarkerX, HEAT_BAR.y + HEAT_BAR.height + 2)
    ctx.stroke()

    ctx.textAlign = 'right'
    ctx.fillStyle = '#ffaa00'
    ctx.font = 'bold 56px monospace'
    ctx.fillText(`$${credits}`, 980, 90)

    // Diegetic pause button — only visible during gameplay
    if (phase === 'gameplay') {
      const btnColor = isPaused ? '#00ffcc' : '#1a2a2a'
      const borderColor = isPaused ? '#00ffcc' : '#334444'
      ctx.strokeStyle = borderColor
      ctx.lineWidth = 2
      ctx.strokeRect(PAUSE_BTN.x, PAUSE_BTN.y, PAUSE_BTN.width, PAUSE_BTN.height)
      ctx.fillStyle = btnColor
      ctx.globalAlpha = isPaused ? 0.15 : 0.08
      ctx.fillRect(PAUSE_BTN.x, PAUSE_BTN.y, PAUSE_BTN.width, PAUSE_BTN.height)
      ctx.globalAlpha = 1
      ctx.fillStyle = isPaused ? '#00ffcc' : '#446655'
      ctx.font = 'bold 28px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(
        isPaused ? '▶ RESUME' : '⏸ PAUSE',
        PAUSE_BTN.x + PAUSE_BTN.width / 2,
        PAUSE_BTN.y + 56
      )
    }

    if (isOverheated) {
      ctx.fillStyle = 'rgba(255,0,0,0.15)'
      ctx.fillRect(0, 0, 1024, 256)
      ctx.fillStyle = '#ff0000'
      ctx.font = 'bold 32px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('⚠ OVERHEAT ⚠', 512, 230)
    }

    texture.needsUpdate = true
  }, [credits, ctx, heat, isOverheated, isPaused, maxOre, phase, rawOre, texture])

  function handlePointerDown(event) {
    if (!event || phase !== 'gameplay') return
    const uv = event.uv
    if (!uv) return
    if (
      uv.x >= PAUSE_UV.uMin &&
      uv.x <= PAUSE_UV.uMax &&
      uv.y >= PAUSE_UV.vMin &&
      uv.y <= PAUSE_UV.vMax
    ) {
      event.stopPropagation()
      setPaused(!isPaused)
    }
  }

  return (
    <mesh position={[0, -1.3, -1.8]} rotation={[-0.25, 0, 0]} onPointerDown={handlePointerDown}>
      <boxGeometry args={[4, 0.8, 1]} />
      <meshStandardMaterial attach="material-0" color="#0f1418" />
      <meshStandardMaterial attach="material-1" color="#0f1418" />
      <meshBasicMaterial attach="material-2" map={texture} />
      <meshStandardMaterial attach="material-3" color="#0f1418" />
      <meshStandardMaterial attach="material-4" color="#0f1418" />
      <meshStandardMaterial attach="material-5" color="#0f1418" />
    </mesh>
  )
}
