import { useMemo, useEffect } from 'react'
import { useGameStore } from '../store'
import * as THREE from 'three'

export function Dashboard() {
  const rawOre = useGameStore((s) => s.rawOre)
  const heat = useGameStore((s) => s.heat)
  const credits = useGameStore((s) => s.credits)
  const isOverheated = useGameStore((s) => s.isOverheated)
  const getMaxOre = useGameStore((s) => s.getMaxOre)

  const { canvas, ctx, texture } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 256
    const cx = c.getContext('2d')
    const tex = new THREE.CanvasTexture(c)
    return { canvas: c, ctx: cx, texture: tex }
  }, [])

  useEffect(() => {
    ctx.fillStyle = '#050a0f'
    ctx.fillRect(0, 0, 1024, 256)

    const pct = Math.min(100, Math.floor((rawOre / getMaxOre()) * 100))
    ctx.fillStyle = pct >= 100 ? '#ffaa00' : '#00ffcc'
    ctx.font = 'bold 36px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`HOPPER [${pct}%]`, 40, 55)
    ctx.strokeStyle = '#00ffcc'
    ctx.lineWidth = 3
    ctx.strokeRect(40, 70, 400, 28)
    ctx.fillStyle = '#00ffcc'
    ctx.fillRect(44, 74, 392 * (pct / 100), 20)

    ctx.fillStyle = isOverheated ? '#ff0000' : '#ff4400'
    ctx.font = 'bold 36px monospace'
    ctx.fillText(`HEAT [${Math.floor(heat)}°C]`, 40, 148)
    ctx.strokeStyle = isOverheated ? '#ff0000' : '#ff4400'
    ctx.lineWidth = 3
    ctx.strokeRect(40, 163, 400, 28)
    ctx.fillStyle = isOverheated ? '#ff0000' : '#ff4400'
    ctx.fillRect(44, 167, 392 * (heat / 100), 20)

    ctx.textAlign = 'right'
    ctx.fillStyle = '#ffaa00'
    ctx.font = 'bold 56px monospace'
    ctx.fillText(`$${credits}`, 980, 90)

    if (isOverheated) {
      ctx.fillStyle = 'rgba(255,0,0,0.15)'
      ctx.fillRect(0, 0, 1024, 256)
      ctx.fillStyle = '#ff0000'
      ctx.font = 'bold 32px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('⚠ OVERHEAT ⚠', 512, 230)
    }

    texture.needsUpdate = true
  }, [rawOre, heat, credits, isOverheated])

  return (
    <mesh position={[0, -1.3, -1.8]} rotation={[-0.25, 0, 0]}>
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
