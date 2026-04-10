<<<<<<< HEAD
import { describe, it, expect, beforeEach } from 'vitest'
import { page } from '@vitest/browser/context'
import { loadApp, setPhase, screenshot } from './helpers'

describe('BootScreen phase', () => {
  beforeEach(async () => {
    await loadApp()
    await setPhase('powered_down')
  })

  it('shows boot screen in powered_down phase', async () => {
    await setPhase('powered_down')
    const el = page.getByTestId('boot-screen')
    await expect.element(el).toBeInTheDocument()
    await screenshot('01-powered-down')
  })

  it('shows boot screen in boot phase', async () => {
    await setPhase('boot')
    const el = page.getByTestId('boot-screen')
    await expect.element(el).toBeInTheDocument()
    await screenshot('02-boot')
  })

  it('boot screen not visible during gameplay', async () => {
    await setPhase('gameplay')
    const el = page.getByTestId('boot-screen')
    await expect.element(el).not.toBeInTheDocument()
=======
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
>>>>>>> origin/main
  })
})
