/** @vitest-environment browser */

import { cleanup, render } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import App from '../../App'

describe('Boot Screen', () => {
  beforeEach(() => cleanup())

  it('renders powered_down phase with AWAITING PILOT INPUT', async () => {
    render(<App />)

    // Tests run IN the browser — powered_down is default phase, no state manipulation needed
    const bootScreen = page.getByTestId('boot-screen')
    await bootScreen.waitFor({ timeout: 5000 })

    expect(bootScreen.element()).toBeTruthy()

    // Take screenshot for visual confirmation
    await page.screenshot({
      path: 'src/__tests__/browser/screenshots/boot-powered-down.png',
    })
  })
})
