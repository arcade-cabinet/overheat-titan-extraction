import { trait } from 'koota'
import { gameConfig } from '../config'

const { mech } = gameConfig

export const Heat = trait({
  value: 0,
  overheated: false,
  melting: false,
})

export const Hopper = trait({
  current: 0,
  max: mech.hopper.baseCapacity,
})

export const MechStats = trait({
  speed: mech.baseSpeed,
  dashSpeed: mech.dashSpeed,
  grindDps: mech.grind.baseDps,
  coolingRate: mech.heat.baseCoolingRate,
})

export const Input = trait({
  moveX: 0,
  moveZ: 0,
  lookX: 0,
  lookY: 0,
  dash: false,
  tractor: false,
})

export const OreNode = trait({
  health: gameConfig.ore.maxHealth,
  maxHealth: gameConfig.ore.maxHealth,
  isRare: false,
  alive: true,
  posX: 0,
  posZ: 0,
})

export const Cube = trait({
  isRare: false,
  value: gameConfig.economy.cubeValue,
  bodyHandle: -1, // Rapier body handle
})

export const Debris = trait({
  posX: 0,
  posY: 0,
  posZ: 0,
  spawnedAt: 0,
})

export const SiloMarker = trait({
  posX: 0,
  posY: 0,
  posZ: 0,
})

export const VFXEmitter = trait({
  type: 'spark', // 'spark' | 'steam'
  ttl: 1.2,
  posX: 0,
  posY: 0,
  posZ: 0,
})
