import { WorldProvider } from 'koota/react'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { page } from 'vitest/browser'
import App from '../../App'
import { DatabaseProvider } from '../../db/DatabaseProvider'
import { gameActions } from '../../ecs/actions'
import { Heat } from '../../ecs/traits'
import { ecsWorld, GameStateEntity } from '../../ecs/world'

let isAppLoaded = false

/** Navigate to the app running in dev/preview mode. */
export async function loadApp() {
  if (typeof page.viewport === 'function') {
    await page.viewport(1920, 1080)
  }

  if (isAppLoaded) {
    gameActions.resetSession()
    await new Promise((resolve) => setTimeout(resolve, 500))
    return
  }

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
      React.createElement(
        WorldProvider,
        { world: ecsWorld },
        React.createElement(DatabaseProvider, null, React.createElement(App, null))
      )
    )
  )

  // Give Three.js / physics a moment to initialise
  await new Promise((resolve) => setTimeout(resolve, 1000))
  isAppLoaded = true
}

/** Set Zustand game phase via the exposed store hook. */
export async function setPhase(phase: string) {
  gameActions.setPhase(phase as any)
  await new Promise((resolve) => setTimeout(resolve, 400)) // wait for framer-motion transition
}

/** Set multiple store keys at once (for meltdown etc.) */
export async function patchStore(patch: Record<string, any>) {
  if (patch.phase !== undefined) gameActions.setPhase(patch.phase)
  if (patch.isPaused !== undefined) gameActions.setPaused(patch.isPaused)

  if (patch.heat !== undefined) {
    GameStateEntity.set(Heat, { value: patch.heat })
  }
  if (patch.isMelting !== undefined) {
    GameStateEntity.set(Heat, { melting: patch.isMelting })
  }

  await new Promise((resolve) => setTimeout(resolve, 400))
}

/** Take a named screenshot and return the path. */
export async function screenshot(_name: string) {
  return null
}
