import { gameConfig } from '../config'
import { hapticManager } from '../haptics/HapticEngine'
import type { ContractType, GamePhase, Settings } from '../store'
import { Contracts, GlobalState, Heat, Hopper, Upgrades } from './traits'
import { GameStateEntity } from './world'

const { mech } = gameConfig

type UpgradesType = { cap: number; pow: number; cool: number }
type ContractStatus = 'active' | 'completed' | 'failed' | null

export const gameActions = {
  setPhase(phase: GamePhase) {
    GameStateEntity.set(GlobalState, { phase })
  },

  setPaused(isPaused: boolean) {
    GameStateEntity.set(GlobalState, { isPaused })
  },

  addOre(amount: number) {
    const hopper = GameStateEntity.get(Hopper)!
    const upgrades = GameStateEntity.get(Upgrades)!
    const maxCapacity = hopper.max + (upgrades.cap - 1) * gameConfig.mech.hopper.capacityPerUpgrade
    GameStateEntity.set(Hopper, { current: Math.min(maxCapacity, hopper.current + amount) })
  },

  addHeat(amount: number) {
    const heat = GameStateEntity.get(Heat)!
    const newHeat = heat.value + amount
    if (newHeat >= mech.heat.meltdownThreshold) {
      if (!heat.melting) hapticManager.playMeltdown()
      GameStateEntity.set(Heat, {
        value: mech.heat.meltdownThreshold,
        overheated: true,
        melting: true,
      })
      GameStateEntity.set(GlobalState, { phase: 'meltdown', isPaused: false })
    } else if (newHeat >= mech.heat.overheatThreshold) {
      if (!heat.overheated) hapticManager.playOverheat()
      GameStateEntity.set(Heat, { value: mech.heat.overheatThreshold, overheated: true })
    } else {
      GameStateEntity.set(Heat, { value: newHeat })
    }
  },

  coolDown(amount: number) {
    const heat = GameStateEntity.get(Heat)!
    const newHeat = Math.max(0, heat.value - amount)
    if (newHeat < mech.heat.coolingSafeThreshold && heat.overheated) {
      GameStateEntity.set(Heat, { value: newHeat, overheated: false, melting: false })
    } else {
      GameStateEntity.set(Heat, { value: newHeat })
    }
  },

  ejectCube() {
    hapticManager.playCubeEject()
    GameStateEntity.set(Hopper, { current: 0 })
  },

  addCredits(amount: number) {
    hapticManager.playCubeSell()
    const state = GameStateEntity.get(GlobalState)!
    GameStateEntity.set(GlobalState, {
      credits: state.credits + amount,
      sessionCredits: state.sessionCredits + amount,
    })
    savePersistentState()
  },

  buyUpgrade(type: keyof UpgradesType, cost: number) {
    const state = GameStateEntity.get(GlobalState)!
    const upgrades = GameStateEntity.get(Upgrades)!

    if (state.credits < cost) return
    GameStateEntity.set(GlobalState, { credits: state.credits - cost })
    GameStateEntity.set(Upgrades, { [type]: (upgrades as any)[type] + 1 })
    savePersistentState()
  },

  updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    GameStateEntity.set(GlobalState, { [key]: value })
    savePersistentState()
  },

  triggerMeltdown() {
    hapticManager.playMeltdown()
    GameStateEntity.set(Heat, { melting: true })
    GameStateEntity.set(GlobalState, { phase: 'meltdown' })
  },

  resetSession() {
    GameStateEntity.set(GlobalState, {
      phase: 'menu',
      sessionCredits: 0,
      isPaused: false,
    })
    GameStateEntity.set(Hopper, { current: 0 })
    GameStateEntity.set(Heat, { value: 0, overheated: false, melting: false })
    GameStateEntity.set(Contracts, {
      activeContract: null,
      contractStatus: null,
      contractProgress: 0,
      contractTimer: 0,
    })
  },

  acceptContract(type: ContractType) {
    if (!type) {
      GameStateEntity.set(Contracts, {
        activeContract: null,
        contractStatus: null,
        contractProgress: 0,
        contractTimer: 0,
      })
      return
    }
    const cfg = gameConfig.contracts[type]
    GameStateEntity.set(Contracts, {
      activeContract: type,
      contractStatus: 'active',
      contractProgress: 0,
      contractTimer: cfg.timeLimitS,
    })
    GameStateEntity.set(GlobalState, { sessionCredits: 0 })
  },

  evaluateContracts(deltaTime: number) {
    const contract = GameStateEntity.get(Contracts)!
    const state = GameStateEntity.get(GlobalState)!
    const heat = GameStateEntity.get(Heat)!

    if (contract.contractStatus !== 'active' || !contract.activeContract) return

    const cfg = gameConfig.contracts[contract.activeContract]
    const newTimer = contract.contractTimer - deltaTime
    let newStatus: ContractStatus = contract.contractStatus
    let newProgress = contract.contractProgress

    if (contract.activeContract === 'survival') {
      newProgress = cfg.timeLimitS - newTimer
      if (newTimer <= 0) {
        newStatus = 'completed'
        hapticManager.playCubeSell()
      }
    } else if (contract.activeContract === 'thermal') {
      newProgress = heat.value
      if (heat.value >= cfg.target) {
        newStatus = 'failed'
        hapticManager.playMeltdown()
      } else if (newTimer <= 0) {
        newStatus = 'completed'
        hapticManager.playCubeSell()
      }
    } else if (contract.activeContract === 'quota') {
      newProgress = state.sessionCredits
      if (newProgress >= cfg.target) {
        newStatus = 'completed'
        hapticManager.playCubeSell()
      } else if (newTimer <= 0) {
        newStatus = 'failed'
        hapticManager.playMeltdown()
      }
    }

    if (newStatus === 'completed' && contract.contractStatus === 'active') {
      GameStateEntity.set(Contracts, {
        contractTimer: Math.max(0, newTimer),
        contractProgress: newProgress,
        contractStatus: newStatus,
      })
      GameStateEntity.set(GlobalState, { credits: state.credits + cfg.reward })
      savePersistentState()
      return
    }

    GameStateEntity.set(Contracts, {
      contractTimer: Math.max(0, newTimer),
      contractStatus: newStatus,
      contractProgress: newProgress,
    })
  },
}

// Handle LocalStorage Persistence
const STORAGE_KEY = 'overheat-titan-storage'

export function loadPersistentState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    const parsed = JSON.parse(saved)
    const state = parsed.state || {}

    if (state.credits !== undefined) {
      GameStateEntity.set(GlobalState, { credits: state.credits })
    }
    if (state.settings) {
      GameStateEntity.set(GlobalState, {
        masterVolume: state.settings.masterVolume ?? gameConfig.audio.defaultMasterVolume,
        lookSensitivity: state.settings.lookSensitivity ?? 1.0,
        crtOverlays: state.settings.crtOverlays ?? false,
      })
    }
    if (state.upgrades) {
      GameStateEntity.set(Upgrades, {
        cap: state.upgrades.cap ?? 1,
        pow: state.upgrades.pow ?? 1,
        cool: state.upgrades.cool ?? 1,
      })
    }
  } catch (e) {
    console.error('Failed to load save state:', e)
  }
}

function savePersistentState() {
  const globalState = GameStateEntity.get(GlobalState)!
  const upgrades = GameStateEntity.get(Upgrades)!

  const payload = {
    state: {
      credits: globalState.credits,
      settings: {
        masterVolume: globalState.masterVolume,
        lookSensitivity: globalState.lookSensitivity,
        crtOverlays: globalState.crtOverlays,
      },
      upgrades: {
        cap: upgrades.cap,
        pow: upgrades.pow,
        cool: upgrades.cool,
      },
    },
    version: 0,
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

// Accessors
export const gameSelectors = {
  getMaxOre: () => {
    const upgrades = GameStateEntity.get(Upgrades)!
    return mech.hopper.baseCapacity + (upgrades.cap - 1) * mech.hopper.capacityPerUpgrade
  },
  getGrindDps: () => {
    const upgrades = GameStateEntity.get(Upgrades)!
    return mech.grind.baseDps * (1 + (upgrades.pow - 1) * mech.grind.dpsPerUpgrade)
  },
  getCoolingRate: () => {
    const upgrades = GameStateEntity.get(Upgrades)!
    return mech.heat.baseCoolingRate * (1 + (upgrades.cool - 1) * mech.heat.coolingRatePerUpgrade)
  },
}
