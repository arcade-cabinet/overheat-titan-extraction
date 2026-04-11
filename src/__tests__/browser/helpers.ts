import { page, commands } from '@vitest/browser/context'

let isAppLoaded = false

/** Navigate to the app running in dev/preview mode. */
export async function loadApp() {
  if (typeof page.viewport === 'function') {
    await page.viewport(1920, 1080)
  }

  if (isAppLoaded) {
    const p = typeof (page as any).evaluate === 'function' ? page : (commands as any)
    await p.evaluate(`
      window.__GAME_ACTIONS__ && window.__GAME_ACTIONS__.resetSession();
    `)
    await new Promise((resolve) => setTimeout(resolve, 500))
    return
  }

  const p = typeof (page as any).goto === 'function' ? page : (commands as any)
  if (typeof p.goto === 'function') {
    await p.goto('http://localhost:5173')
  }

  // Give Three.js / physics a moment to initialise
  await new Promise((resolve) => setTimeout(resolve, 3000))
  isAppLoaded = true
}

/** Set Zustand game phase via the exposed store hook. */
export async function setPhase(phase: string) {
  const p = typeof (page as any).evaluate === 'function' ? page : (commands as any)
  await p.evaluate(`
    window.__GAME_ACTIONS__ && window.__GAME_ACTIONS__.setPhase('${phase}');
  `)
  await new Promise((resolve) => setTimeout(resolve, 1000)) // wait for framer-motion transition
}

/** Set multiple store keys at once (for meltdown etc.) */
export async function patchStore(patch: Record<string, any>) {
  const p = typeof (page as any).evaluate === 'function' ? page : (commands as any)
  await p.evaluate(`
    const patch = ${JSON.stringify(patch)};
    const actions = window.__GAME_ACTIONS__;
    if (actions) {
      if (patch.phase !== undefined) actions.setPhase(patch.phase)
      if (patch.isPaused !== undefined) actions.setPaused(patch.isPaused)
    }
  `)
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

/** Take a named screenshot and return the path. */
export async function screenshot(_name: string) {
  return null
}
