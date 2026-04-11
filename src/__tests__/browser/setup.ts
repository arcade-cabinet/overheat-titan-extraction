import { useGameStore } from '../../store'

declare global {
  interface Window {
    __ZUSTAND_STORE__: typeof useGameStore
    VITEST: boolean
  }
}

window.__ZUSTAND_STORE__ = useGameStore
window.VITEST = true
