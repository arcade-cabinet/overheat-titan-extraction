/** @vitest-environment browser */

import { cleanup, render } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import App from '../../App'

describe('Upgrades Terminal', () => {
  beforeEach(() => cleanup())

  it('renders upgrades terminal in upgrades phase', async () => {
    render(<App />)

    // Tests run IN the browser — directly access window globals
    const store = (window as any).__ZUSTAND_STORE__
    if (store) store.setState({ phase: 'upgrades', credits: 9999 })

    const terminal = page.getByTestId('upgrades-terminal')
    await terminal.waitFor({ timeout: 5000 })

    expect(terminal.element()).toBeTruthy()

    await page.screenshot({
      path: 'src/__tests__/browser/screenshots/upgrades-terminal.png',
    })
  })
})
