import { gameActions } from '../../ecs/actions'

declare global {
  interface Window {
    __GAME_ACTIONS__: typeof gameActions
    VITEST: boolean
  }
}

window.__GAME_ACTIONS__ = gameActions
window.VITEST = true
