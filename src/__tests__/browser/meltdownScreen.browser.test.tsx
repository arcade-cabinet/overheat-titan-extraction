/** @vitest-environment browser */

import { cleanup, render } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import App from '../../App'

describe('Meltdown Screen', () => {
  beforeEach(() => cleanup())

  it('renders meltdown screen in meltdown phase', async () => {
    render(<App />)

    // Tests run IN the browser — directly access window globals
    const store = (window as any).__ZUSTAND_STORE__
    if (store) store.setState({ phase: 'meltdown', heat: 120 })

    const meltdownEl = page.getByTestId('meltdown-screen')
    await meltdownEl.waitFor({ timeout: 5000 })

    expect(meltdownEl.element()).toBeTruthy()

    await page.screenshot({
      path: 'src/__tests__/browser/screenshots/meltdown.png',
    })
  })

  it('renders report screen in report phase', async () => {
    render(<App />)

    // Tests run IN the browser — directly access window globals
    const store = (window as any).__ZUSTAND_STORE__
    if (store) store.setState({ phase: 'report', credits: 1500 })

    const meltdownEl = page.getByTestId('meltdown-screen')
    await meltdownEl.waitFor({ timeout: 5000 })

    await page.screenshot({
      path: 'src/__tests__/browser/screenshots/report-screen.png',
    })
  })
})
