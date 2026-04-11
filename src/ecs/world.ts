import { createWorld } from 'koota'
import { GlobalState, Contracts, Upgrades, Heat, Hopper, MechStats } from './traits'
import { gameConfig } from '../config'

// Singleton ECS world — one per app lifetime
export const ecsWorld = createWorld()

// Create the global game state entity
export const GameStateEntity = ecsWorld.spawn(
  GlobalState,
  Contracts,
  Upgrades,
  Heat,
  Hopper({
    current: 0,
    max: gameConfig.mech.hopper.baseCapacity,
  }),
  MechStats({
    speed: gameConfig.mech.baseSpeed,
    dashSpeed: gameConfig.mech.dashSpeed,
    grindDps: gameConfig.mech.grind.baseDps,
    coolingRate: gameConfig.mech.heat.baseCoolingRate,
  })
)
