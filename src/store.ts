import { useTrait } from 'koota/react'
import { GameStateEntity } from './ecs/world'
import { GlobalState, Heat, Contracts, Upgrades, Hopper } from './ecs/traits'
import { gameActions, gameSelectors, loadPersistentState } from './ecs/actions'

export type GamePhase =
  | 'powered_down'
  | 'boot'
  | 'menu'
  | 'gameplay'
  | 'settings'
  | 'upgrades'
  | 'meltdown'
  | 'report'

export type ContractType = 'quota' | 'thermal' | 'survival' | null
export type ContractStatus = 'active' | 'completed' | 'failed' | null

export interface UpgradesType {
  cap: number
  pow: number
  cool: number
}

export interface Settings {
  masterVolume: number
  lookSensitivity: number
  crtOverlays: boolean
}

// Temporary facade bridging the Zustand hook signature to Koota traits!
export const useGameStore = <T = any>(selector?: (state: any) => T): T => {
  const global = useTrait(GameStateEntity, GlobalState)
  const heat = useTrait(GameStateEntity, Heat)
  const hopper = useTrait(GameStateEntity, Hopper)
  const contracts = useTrait(GameStateEntity, Contracts)
  const upgrades = useTrait(GameStateEntity, Upgrades)

  if (!global || !heat || !hopper || !contracts || !upgrades) {
    // This will only happen if GameStateEntity isn't loaded (it's synchronous, so shouldn't happen)
    throw new Error("Missing ECS traits for GameStateEntity")
  }

  const state = {
    ...global,
    settings: {
      masterVolume: global.masterVolume,
      lookSensitivity: global.lookSensitivity,
      crtOverlays: global.crtOverlays,
    },
    heat: heat.value,
    isOverheated: heat.overheated,
    isMelting: heat.melting,
    ...contracts,
    upgrades: {
      cap: upgrades.cap,
      pow: upgrades.pow,
      cool: upgrades.cool,
    },
    rawOre: hopper.current,
    ...gameActions,
    ...gameSelectors
  }

  return (selector ? selector(state) : state) as T
}

useGameStore.setState = (patch: Record<string, any>) => {
  if (patch.phase !== undefined) gameActions.setPhase(patch.phase)
  if (patch.isPaused !== undefined) gameActions.setPaused(patch.isPaused)
  if (patch.isMelting !== undefined) GameStateEntity.set(Heat, { melting: patch.isMelting })
  if (patch.isOverheated !== undefined) GameStateEntity.set(Heat, { overheated: patch.isOverheated })
  if (patch.heat !== undefined) GameStateEntity.set(Heat, { value: patch.heat })
  if (patch.rawOre !== undefined) GameStateEntity.set(Hopper, { current: patch.rawOre })
  if (patch.credits !== undefined) GameStateEntity.set(GlobalState, { credits: patch.credits })
}

useGameStore.getState = () => {
  // Returns raw state snapshot via trait .get() calls so imperatve usage works
  const global = GameStateEntity.get(GlobalState)!
  const heat = GameStateEntity.get(Heat)!
  const hopper = GameStateEntity.get(Hopper)!
  const contracts = GameStateEntity.get(Contracts)!
  const upgrades = GameStateEntity.get(Upgrades)!
  
  return {
    ...global,
    settings: {
      masterVolume: global.masterVolume,
      lookSensitivity: global.lookSensitivity,
      crtOverlays: global.crtOverlays,
    },
    heat: heat.value,
    isOverheated: heat.overheated,
    isMelting: heat.melting,
    ...contracts,
    upgrades: {
      cap: upgrades.cap,
      pow: upgrades.pow,
      cool: upgrades.cool,
    },
    rawOre: hopper.current,
    ...gameActions,
    ...gameSelectors
  }
}

export { gameActions, gameSelectors, loadPersistentState }
