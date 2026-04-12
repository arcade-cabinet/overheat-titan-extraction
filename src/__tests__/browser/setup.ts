import { gameActions } from '../../ecs/actions'

declare global {
  interface Window {
    __GAME_ACTIONS__: typeof gameActions
    VITEST: boolean
  }
}

window.__GAME_ACTIONS__ = gameActions
window.VITEST = true

const originalWarn = console.warn
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('using deprecated parameters for the initialization function')
  ) {
    return
  }
  originalWarn(...args)
}
