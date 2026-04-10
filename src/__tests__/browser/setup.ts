// Expose Zustand store on window for Maestro JS injection
import { useGameStore } from '../../store'

declare global {
  interface Window {
    __ZUSTAND_STORE__: typeof useGameStore
  }
}

window.__ZUSTAND_STORE__ = useGameStore
