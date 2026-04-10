import { page } from '@vitest/browser/context'

/** Navigate to the app running in dev/preview mode. */
export async function loadApp() {
  await page.goto('http://localhost:5173')
  // Give Three.js / physics a moment to initialise
  await page.waitForTimeout(1000)
}

/** Set Zustand game phase via the exposed store hook. */
export async function setPhase(phase: string) {
  await page.evaluate((p) => {
    const store = (
      window as unknown as {
        __ZUSTAND_STORE__: { getState: () => { setPhase: (phase: string) => void } }
      }
    ).__ZUSTAND_STORE__
    store.getState().setPhase(p)
  }, phase)
  await page.waitForTimeout(400) // wait for framer-motion transition
}

/** Set multiple store keys at once (for meltdown etc.) */
export async function patchStore(patch: Record<string, unknown>) {
  await page.evaluate((p) => {
    const store = (
      window as unknown as {
        __ZUSTAND_STORE__: { setState: (patch: Record<string, unknown>) => void }
      }
    ).__ZUSTAND_STORE__
    store.setState(p)
  }, patch)
  await page.waitForTimeout(400)
}

/** Take a named screenshot and return the path. */
export async function screenshot(name: string) {
  return page.screenshot({ path: `src/__tests__/browser/screenshots/${name}.png` })
}
