/** @vitest-environment browser */

import { cleanup, render } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import App from '../../App'

describe('Settings Menu', () => {
  beforeEach(() => cleanup())

  it('renders settings menu in settings phase', async () => {
    render(<App />)

    // Tests run IN the browser — directly access window globals
    const store = (window as any).__ZUSTAND_STORE__
    if (store) store.setState({ phase: 'settings' })

    const settingsMenu = page.getByTestId('settings-menu')
    await settingsMenu.waitFor({ timeout: 5000 })

    expect(settingsMenu.element()).toBeTruthy()

    await page.screenshot({
      path: 'src/__tests__/browser/screenshots/settings-menu.png',
    })
  })
})
