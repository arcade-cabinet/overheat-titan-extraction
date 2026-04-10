import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useGameStore = create(
  persist(
    (set, get) => ({
      // Game Phase
      phase: 'powered_down', // powered_down | boot | menu | gameplay | paused | meltdown | report | settings | upgrades
      isPaused: false,

      // Economy & Inventory
      credits: 0,
      rawOre: 0,
      heat: 0,
      isOverheated: false,
      isMelting: false,

      // Upgrades
      upgrades: { cap: 1, pow: 1, cool: 1 },

      // Settings
      settings: {
        masterVolume: 0.7,
        lookSensitivity: 1.0,
        crtOverlays: false,
      },

      // Session stats
      sessionCredits: 0,

      // Computed
      getMaxOre: () => 100 * get().upgrades.cap,
      getGrindDps: () => 50 * (1 + (get().upgrades.pow - 1) * 0.5),
      getCoolingRate: () => 20 * (1 + (get().upgrades.cool - 1) * 0.5),

      // Phase transitions
      setPhase: (phase) => set({ phase }),
      setPaused: (isPaused) => set({ isPaused }),

      // Ore & Heat
      addOre: (amount) =>
        set((state) => ({ rawOre: Math.min(state.getMaxOre(), state.rawOre + amount) })),
      addHeat: (amount) =>
        set((state) => {
          const newHeat = state.heat + amount
          if (newHeat >= 120) {
            return {
              heat: 120,
              isOverheated: true,
              isMelting: true,
              phase: 'meltdown',
              isPaused: false,
            }
          }
          if (newHeat >= 100) return { heat: 100, isOverheated: true }
          return { heat: newHeat }
        }),
      coolDown: (amount) =>
        set((state) => {
          const newHeat = Math.max(0, state.heat - amount)
          if (newHeat < 20 && state.isOverheated)
            return { heat: newHeat, isOverheated: false, isMelting: false }
          return { heat: newHeat }
        }),
      ejectCube: () => set({ rawOre: 0 }),
      addCredits: (amount) =>
        set((state) => ({
          credits: state.credits + amount,
          sessionCredits: state.sessionCredits + amount,
        })),
      buyUpgrade: (type, cost) =>
        set((state) => {
          if (!Object.hasOwn(state.upgrades, type)) {
            return state
          }

          if (state.credits < cost) {
            return state
          }

          return {
            credits: state.credits - cost,
            upgrades: { ...state.upgrades, [type]: state.upgrades[type] + 1 },
          }
        }),

      // Settings
      updateSetting: (key, value) =>
        set((state) => ({ settings: { ...state.settings, [key]: value } })),

      // Meltdown & reset
      triggerMeltdown: () => set({ isMelting: true, phase: 'meltdown' }),
      resetSession: () =>
        set({
          phase: 'menu',
          rawOre: 0,
          heat: 0,
          isOverheated: false,
          isMelting: false,
          sessionCredits: 0,
          isPaused: false,
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
