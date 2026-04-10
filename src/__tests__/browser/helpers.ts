import { page } from '@vitest/browser/context'
import React from 'react'
import { render } from 'vitest-browser-react'
import App from '../../App'
import { DatabaseProvider } from '../../db/DatabaseProvider'

/** Navigate to the app running in dev/preview mode. */
export async function loadApp() {
  // Render the App directly into the Vitest browser iframe
  render(
    React.createElement(
      React.StrictMode,
      null,
      React.createElement(DatabaseProvider, null, React.createElement(App, null))
    )
  )

  // Give Three.js / physics a moment to initialise
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

/** Set Zustand game phase via the exposed store hook. */
export async function setPhase(phase: string) {
  const store = (window as any).__ZUSTAND_STORE__
  if (store) {
    store.getState().setPhase(phase)
  }
  await new Promise((resolve) => setTimeout(resolve, 400)) // wait for framer-motion transition
}

/** Set multiple store keys at once (for meltdown etc.) */
export async function patchStore(patch: Record<string, unknown>) {
  const store = (window as any).__ZUSTAND_STORE__
  if (store) {
    store.setState(patch)
  }
  await new Promise((resolve) => setTimeout(resolve, 400))
}

/** Take a named screenshot and return the path. */
export async function screenshot(name: string) {
  return page.screenshot({ path: `src/__tests__/browser/screenshots/${name}.png` })
}
