import { gameConfig } from '../config'
import { Debris, Heat, Hopper, MechStats, OreNode, VFXEmitter } from './traits'

const { mech, ore, economy } = gameConfig

/**
 * HeatSystem — updates heat value, sets overheated/melting flags.
 * Called from useFrame with delta (seconds).
 * @param {import('koota').World} world
 * @param {number} delta
 * @param {{ isGrinding: boolean, grindIsRare: boolean, upgradeCool: number }} context
 */
export function HeatSystem(world, delta, { isGrinding, grindIsRare, upgradeCool }) {
  const mechEntities = world.query(Heat, MechStats)
  for (const entity of mechEntities) {
    const heat = entity.get(Heat)
    if (!heat) continue

    if (isGrinding && !heat.overheated) {
      const mult = grindIsRare ? mech.heat.rareMultiplier : 1
      heat.value = Math.min(
        mech.heat.meltdownThreshold,
        heat.value + mech.heat.perSecondGrinding * mult * delta
      )
      if (heat.value >= mech.heat.meltdownThreshold) {
        heat.overheated = true
        heat.melting = true
      } else if (heat.value >= mech.heat.overheatThreshold) {
        heat.overheated = true
      }
    } else if (!isGrinding) {
      const coolingRate =
        mech.heat.baseCoolingRate *
        (1 + (upgradeCool - 1) * mech.heat.coolingRatePerUpgrade)
      heat.value = Math.max(0, heat.value - coolingRate * delta)
      if (heat.overheated && heat.value < mech.heat.coolingSafeThreshold) {
        heat.overheated = false
        heat.melting = false
      }
    }
  }
}

/**
 * GrindingSystem — reduces OreNode health when player is in range.
 * Writes to Hopper.current.
 * @param {import('koota').World} world
 * @param {number} delta
 * @param {{ playerPos: {x: number, z: number}, upgradePow: number, isOverheated: boolean }} context
 * @returns {{ grindingCount: number, grindingRare: boolean }}
 */
export function GrindingSystem(world, delta, { playerPos, upgradePow, isOverheated }) {
  if (isOverheated) return { grindingCount: 0, grindingRare: false }

  const grindDps =
    mech.grind.baseDps * (1 + (upgradePow - 1) * mech.grind.dpsPerUpgrade)

  let grindingCount = 0
  let grindingRare = false

  const oreEntities = world.query(OreNode)
  for (const entity of oreEntities) {
    const node = entity.get(OreNode)
    if (!node || !node.alive) continue
    const dx = playerPos.x - node.posX
    const dz = playerPos.z - node.posZ
    const distSq = dx * dx + dz * dz
    if (distSq < ore.grindRadius * ore.grindRadius) {
      grindingCount++
      if (node.isRare) grindingRare = true
      node.health -= grindDps * delta
      if (node.health <= 0) {
        node.alive = false
        node.health = 0
      }
    }
  }

  return { grindingCount, grindingRare }
}

/**
 * HopperSystem — fills hopper based on grinding.
 * @param {import('koota').World} world
 * @param {number} delta
 * @param {{ grindingCount: number, upgradePow: number, upgradeCap: number }} context
 */
export function HopperSystem(world, delta, { grindingCount, upgradePow, upgradeCap }) {
  const hopperEntities = world.query(Hopper)
  for (const entity of hopperEntities) {
    const hopper = entity.get(Hopper)
    if (!hopper || grindingCount === 0) continue
    const grindDps =
      mech.grind.baseDps * (1 + (upgradePow - 1) * mech.grind.dpsPerUpgrade)
    const maxOre =
      mech.hopper.baseCapacity + (upgradeCap - 1) * mech.hopper.capacityPerUpgrade
    hopper.max = maxOre
    hopper.current = Math.min(maxOre, hopper.current + grindDps * delta * grindingCount)
  }
}

/**
 * DebrisCleanupSystem — removes expired Debris entities.
 * @param {import('koota').World} world
 */
export function DebrisCleanupSystem(world) {
  const now = performance.now()
  const debrisEntities = world.query(Debris)
  for (const entity of debrisEntities) {
    const d = entity.get(Debris)
    if (d && now - d.spawnedAt > gameConfig.debris.ttlMs) {
      entity.destroy()
    }
  }
}

/**
 * VFXCleanupSystem — removes expired VFX emitter entities.
 * @param {import('koota').World} world
 * @param {number} delta
 */
export function VFXCleanupSystem(world, delta) {
  const vfxEntities = world.query(VFXEmitter)
  for (const entity of vfxEntities) {
    const emitter = entity.get(VFXEmitter)
    if (!emitter) continue
    emitter.ttl -= delta
    if (emitter.ttl <= 0) entity.destroy()
  }
}
