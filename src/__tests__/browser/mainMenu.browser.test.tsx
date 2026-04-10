/** @vitest-environment browser */

import { cleanup, render } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import App from '../../App'

describe('Main Menu', () => {
  beforeEach(() => cleanup())

  it('renders main menu in menu phase', async () => {
    render(<App />)

    // Tests run IN the browser — directly access window globals
    const store = (window as any).__ZUSTAND_STORE__
    if (store) store.setState({ phase: 'menu' })

    const mainMenu = page.getByTestId('main-menu')
    await mainMenu.waitFor({ timeout: 5000 })

    expect(mainMenu.element()).toBeTruthy()

    await page.screenshot({
      path: 'src/__tests__/browser/screenshots/main-menu.png',
    })
  })
})
