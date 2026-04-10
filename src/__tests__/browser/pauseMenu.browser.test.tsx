/** @vitest-environment browser */

import { cleanup, render } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import App from '../../App'

describe('Pause Menu', () => {
  beforeEach(() => cleanup())

  it('renders pause menu when isPaused=true in gameplay phase', async () => {
    render(<App />)

    // Tests run IN the browser — directly access window globals
    const store = (window as any).__ZUSTAND_STORE__
    if (store) store.setState({ phase: 'gameplay', isPaused: true })

    const pauseMenu = page.getByTestId('pause-menu')
    await pauseMenu.waitFor({ timeout: 5000 })

    expect(pauseMenu.element()).toBeTruthy()

    await page.screenshot({
      path: 'src/__tests__/browser/screenshots/pause-menu.png',
    })
  })
})
