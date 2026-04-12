import { beforeEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { loadApp, screenshot, setPhase } from './helpers'

describe('UpgradesTerminal phase', () => {
  beforeEach(async () => {
    await loadApp()
    await setPhase('upgrades')
  })

  it('shows upgrades terminal in upgrades phase', async () => {
    const el = page.getByTestId('upgrades-terminal')
    await expect.element(el).toBeInTheDocument()
    await screenshot('07-upgrades-terminal')
  })

  it('shows TITAN OS TERMINAL header', async () => {
    await expect.element(page.getByText(/TITAN OS/i)).toBeVisible()
  })

  it('upgrades terminal hidden during menu phase', async () => {
    await setPhase('menu')
    await expect.element(page.getByTestId('upgrades-terminal')).not.toBeInTheDocument()
  })
})
