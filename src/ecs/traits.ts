import { trait } from 'koota'
import { gameConfig } from '../config'
import type { GamePhase, ContractType, ContractStatus } from '../store'

const { mech } = gameConfig

// Global Game State (Replaces Zustand)
export const GlobalState = trait({
  phase: 'boot' as GamePhase,
  isPaused: false,
  credits: 0,
  sessionCredits: 0,
  masterVolume: gameConfig.audio.defaultMasterVolume,
  lookSensitivity: 1.0,
  crtOverlays: false,
})

export const Contracts = trait({
  activeContract: null as ContractType,
  contractStatus: null as ContractStatus,
  contractProgress: 0,
  contractTimer: 0,
})

export const Upgrades = trait({
  cap: 1,
  pow: 1,
  cool: 1,
})

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
