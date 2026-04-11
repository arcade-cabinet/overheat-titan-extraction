import { page, commands } from '@vitest/browser/context'

/** Navigate to the app running in dev/preview mode. */
export async function loadApp() {
  if (typeof page.viewport === 'function') {
    await page.viewport(1920, 1080)
  }
  // Try navigating via commands if page.goto is missing
  if (typeof page.goto === 'function') {
    await page.goto('http://localhost:5173')
  } else if (typeof commands?.goto === 'function') {
    await commands.goto('http://localhost:5173')
  } else {
    // If we're using react provider, mount it
    const { render } = await import('vitest-browser-react')
    const React = await import('react')
    const App = (await import('../../App')).default
    const { DatabaseProvider } = await import('../../db/DatabaseProvider')
    render(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(DatabaseProvider, null, React.createElement(App, null))
      )
    )
  }
  // Give Three.js / physics a moment to initialise
  await new Promise((resolve) => setTimeout(resolve, 2000))
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
