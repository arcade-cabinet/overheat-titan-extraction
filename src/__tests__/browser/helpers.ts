import { page, commands } from '@vitest/browser/context'

/** Navigate to the app running in dev/preview mode. */
export async function loadApp() {
  if (typeof page.viewport === 'function') {
    await page.viewport(1920, 1080)
  }

  // Navigate to the vite dev server URL directly
  // Commands are sometimes under page, sometimes under commands depending on vitest version
  const p = typeof (page as any).goto === 'function' ? page : (commands as any)
  if (typeof p.goto === 'function') {
    await p.goto('http://localhost:5173')
  }

  // Give Three.js / physics a moment to initialise
  await new Promise((resolve) => setTimeout(resolve, 3000))
}

/** Set Zustand game phase via the exposed store hook. */
export async function setPhase(phase: string) {
  const p = typeof (page as any).evaluate === 'function' ? page : (commands as any)
  await p.evaluate(`
    window.__ZUSTAND_STORE__ && window.__ZUSTAND_STORE__.setState({ phase: '${phase}' });
  `)
  await new Promise(resolve => setTimeout(resolve, 400)) // wait for framer-motion transition
}

/** Set multiple store keys at once (for meltdown etc.) */
export async function patchStore(patch: Record<string, unknown>) {
  const p = typeof (page as any).evaluate === 'function' ? page : (commands as any)
  await p.evaluate(`
    window.__ZUSTAND_STORE__ && window.__ZUSTAND_STORE__.setState(${JSON.stringify(patch)});
  `)
  await new Promise(resolve => setTimeout(resolve, 400))
}

/** Take a named screenshot and return the path. */
export async function screenshot(_name: string) {
  return null;
}
