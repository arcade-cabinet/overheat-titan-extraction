import { page } from '@vitest/browser/context'
import { beforeEach, describe, expect, it } from 'vitest'
import { loadApp, screenshot, setPhase } from './helpers'

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
  })
})
