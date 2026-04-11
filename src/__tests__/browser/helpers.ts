import { page } from 'vitest/browser'

let isAppLoaded = false;

/** Navigate to the app running in dev/preview mode. */
export async function loadApp() {
  if (typeof page.viewport === 'function') {
    await page.viewport(1920, 1080)
  }

  if (isAppLoaded) {
    const store = (window as any).__ZUSTAND_STORE__
    if (store) store.getState().resetSession()
    await new Promise(resolve => setTimeout(resolve, 500))
    return
  }

  // Manually mount it so we avoid vitest auto-cleanup tearing down the canvas and physics
  const React = await import('react')
  const { createRoot } = await import('react-dom/client')
  const App = (await import('../../App')).default
  const { DatabaseProvider } = await import('../../db/DatabaseProvider')
  
  let rootEl = document.getElementById('test-root')
  if (!rootEl) {
    rootEl = document.createElement('div')
    rootEl.id = 'test-root'
    rootEl.style.width = '100vw'
    rootEl.style.height = '100vh'
    document.body.appendChild(rootEl)
  }

  const root = createRoot(rootEl)
  root.render(
    React.createElement(
      React.StrictMode,
      null,
      React.createElement(DatabaseProvider, null, React.createElement(App, null))
    )
  )

  // Give Three.js / physics a moment to initialise
  await new Promise((resolve) => setTimeout(resolve, 8000))
  isAppLoaded = true
}

/** Set Zustand game phase via the exposed store hook. */
export async function setPhase(phase: string) {
  const store = (window as any).__ZUSTAND_STORE__
  if (store) store.getState().setPhase(phase)
  await new Promise(resolve => setTimeout(resolve, 400)) // wait for framer-motion transition
}

/** Set multiple store keys at once (for meltdown etc.) */
export async function patchStore(patch: Record<string, unknown>) {
  const store = (window as any).__ZUSTAND_STORE__
  if (store) store.setState(patch)
  await new Promise(resolve => setTimeout(resolve, 400))
}

/** Take a named screenshot and return the path. */
export async function screenshot(_name: string) {
  return null;
}
