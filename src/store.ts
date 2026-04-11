import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { gameConfig } from './config'
import { hapticManager } from './haptics/HapticEngine'

const { mech } = gameConfig

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

export interface Upgrades {
  cap: number
  pow: number
  cool: number
}

export interface Settings {
  masterVolume: number
  lookSensitivity: number
  crtOverlays: boolean
}

export interface GameState {
  phase: GamePhase
  isPaused: boolean
  credits: number
  rawOre: number
  heat: number
  isOverheated: boolean
  isMelting: boolean
  upgrades: Upgrades
  settings: Settings
  sessionCredits: number

  activeContract: ContractType
  contractStatus: ContractStatus
  contractProgress: number
  contractTimer: number

  getMaxOre: () => number
  getGrindDps: () => number
  getCoolingRate: () => number

  setPhase: (phase: GamePhase) => void
  setPaused: (isPaused: boolean) => void
  addOre: (amount: number) => void
  addHeat: (amount: number) => void
  coolDown: (amount: number) => void
  ejectCube: () => void
  addCredits: (amount: number) => void
  buyUpgrade: (type: keyof Upgrades, cost: number) => void
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  triggerMeltdown: () => void
  resetSession: () => void

  acceptContract: (type: ContractType) => void
  evaluateContracts: (deltaTime: number) => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      phase: 'powered_down',
      isPaused: false,
      credits: 0,
      rawOre: 0,
      heat: 0,
      isOverheated: false,
      isMelting: false,
      upgrades: { cap: 1, pow: 1, cool: 1 },
      settings: {
        masterVolume: gameConfig.audio.defaultMasterVolume,
        lookSensitivity: 1.0,
        crtOverlays: false,
      },
      sessionCredits: 0,
      
      activeContract: null,
      contractStatus: null,
      contractProgress: 0,
      contractTimer: 0,

      getMaxOre: () =>
        mech.hopper.baseCapacity + (get().upgrades.cap - 1) * mech.hopper.capacityPerUpgrade,

      getGrindDps: () =>
        mech.grind.baseDps * (1 + (get().upgrades.pow - 1) * mech.grind.dpsPerUpgrade),

      getCoolingRate: () =>
        mech.heat.baseCoolingRate *
        (1 + (get().upgrades.cool - 1) * mech.heat.coolingRatePerUpgrade),

      setPhase: (phase) => set({ phase }),
      setPaused: (isPaused) => set({ isPaused }),

      acceptContract: (type) => {
        if (!type) {
          set({ activeContract: null, contractStatus: null, contractProgress: 0, contractTimer: 0 })
          return
        }
        const cfg = gameConfig.contracts[type]
        set({
          activeContract: type,
          contractStatus: 'active',
          contractProgress: 0,
          contractTimer: cfg.timeLimitS,
          sessionCredits: 0, // Reset session credits for quota tracking
        })
      },

      evaluateContracts: (deltaTime) => {
        set((state) => {
          if (state.contractStatus !== 'active' || !state.activeContract) return state
          
          const cfg = gameConfig.contracts[state.activeContract]
          let newTimer = state.contractTimer - deltaTime
          let newStatus: ContractStatus = state.contractStatus
          let newProgress = state.contractProgress

          if (state.activeContract === 'survival') {
            newProgress = cfg.timeLimitS - newTimer
            if (newTimer <= 0) {
              newStatus = 'completed'
              hapticManager.playCubeSell() // Reward haptic
            }
          } else if (state.activeContract === 'thermal') {
            newProgress = state.heat
            if (state.heat >= cfg.target) {
              newStatus = 'failed'
              hapticManager.playMeltdown()
            } else if (newTimer <= 0) {
              newStatus = 'completed'
              hapticManager.playCubeSell()
            }
          } else if (state.activeContract === 'quota') {
            newProgress = state.sessionCredits
            if (newProgress >= cfg.target) {
              newStatus = 'completed'
              hapticManager.playCubeSell()
            } else if (newTimer <= 0) {
              newStatus = 'failed'
              hapticManager.playMeltdown()
            }
          }

          if (newStatus === 'completed' && state.contractStatus === 'active') {
            // Payout reward
            return {
              contractTimer: Math.max(0, newTimer),
              contractProgress: newProgress,
              contractStatus: newStatus,
              credits: state.credits + cfg.reward,
            }
          }

          return { contractTimer: Math.max(0, newTimer), contractStatus: newStatus, contractProgress: newProgress }
        })
      },

      addOre: (amount) =>
        set((state) => ({ rawOre: Math.min(state.getMaxOre(), state.rawOre + amount) })),

      addHeat: (amount) =>
        set((state) => {
          const newHeat = state.heat + amount
          if (newHeat >= mech.heat.meltdownThreshold) {
            if (!state.isMelting) hapticManager.playMeltdown()
            return {
              heat: mech.heat.meltdownThreshold,
              isOverheated: true,
              isMelting: true,
              phase: 'meltdown',
              isPaused: false,
            }
          }
          if (newHeat >= mech.heat.overheatThreshold) {
            if (!state.isOverheated) hapticManager.playOverheat()
            return { heat: mech.heat.overheatThreshold, isOverheated: true }
          }
          return { heat: newHeat }
        }),

      coolDown: (amount) =>
        set((state) => {
          const newHeat = Math.max(0, state.heat - amount)
          if (newHeat < mech.heat.coolingSafeThreshold && state.isOverheated)
            return { heat: newHeat, isOverheated: false, isMelting: false }
          return { heat: newHeat }
        }),

      ejectCube: () => {
        hapticManager.playCubeEject()
        set({ rawOre: 0 })
      },

      addCredits: (amount) => {
        hapticManager.playCubeSell()
        set((state) => ({
          credits: state.credits + amount,
          sessionCredits: state.sessionCredits + amount,
        }))
      },

      buyUpgrade: (type, cost) =>
        set((state) => {
          if (!Object.hasOwn(state.upgrades, type)) return state
          if (state.credits < cost) return state
          return {
            credits: state.credits - cost,
            upgrades: { ...state.upgrades, [type]: state.upgrades[type] + 1 },
          }
        }),

      updateSetting: (key, value) =>
        set((state) => ({ settings: { ...state.settings, [key]: value } })),

      triggerMeltdown: () => {
        hapticManager.playMeltdown()
        set({ isMelting: true, phase: 'meltdown' })
      },

      resetSession: () =>
        set({
          phase: 'menu',
          rawOre: 0,
          heat: 0,
          isOverheated: false,
          isMelting: false,
          sessionCredits: 0,
          isPaused: false,
          activeContract: null,
          contractStatus: null,
          contractProgress: 0,
          contractTimer: 0,
        }),
    }),
    {
      name: 'overheat-titan-storage',
      partialize: (state) => ({
        credits: state.credits,
        upgrades: state.upgrades,
        settings: state.settings,
      }),
    }
  )
)
