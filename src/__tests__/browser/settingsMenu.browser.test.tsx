import { page } from '@vitest/browser/context'
import { beforeEach, describe, expect, it } from 'vitest'
import { loadApp, screenshot, setPhase } from './helpers'

describe('SettingsMenu phase', () => {
  beforeEach(async () => {
    await loadApp()
    await setPhase('settings')
  })

  it('shows settings menu in settings phase', async () => {
    const el = page.getByTestId('settings-menu')
    await expect.element(el).toBeInTheDocument()
    await screenshot('06-settings-menu')
  })

  it('shows MASTER VOLUME label', async () => {
    await expect.element(page.getByText(/MASTER VOLUME/i)).toBeVisible()
  })

  it('shows MOUSE SENSITIVITY label', async () => {
    await expect.element(page.getByText(/MOUSE SENSITIVITY/i)).toBeVisible()
  })

  it('settings hidden during gameplay', async () => {
    await setPhase('gameplay')
    await expect.element(page.getByTestId('settings-menu')).not.toBeInTheDocument()
  })
})
