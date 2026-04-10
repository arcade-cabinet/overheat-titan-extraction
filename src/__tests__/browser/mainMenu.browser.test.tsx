import { describe, it, expect, beforeEach } from 'vitest'
import { page } from '@vitest/browser/context'
import { loadApp, setPhase, screenshot } from './helpers'

describe('MainMenu phase', () => {
  beforeEach(async () => {
    await loadApp()
    await setPhase('menu')
  })

  it('shows main menu in menu phase', async () => {
    const el = page.getByTestId('main-menu')
    await expect.element(el).toBeInTheDocument()
    await screenshot('03-main-menu')
  })

  it('shows NEW EXCAVATION button', async () => {
    const btn = page.getByText('[ NEW EXCAVATION ]')
    await expect.element(btn).toBeVisible()
  })

  it('shows TITAN OS TERMINAL and OS CONFIG buttons', async () => {
    await expect.element(page.getByText('[ TITAN OS TERMINAL ]')).toBeVisible()
    await expect.element(page.getByText('[ OS CONFIG ]')).toBeVisible()
  })

  it('shows seed phrase', async () => {
    const seedEl = page.getByText(/RUN SEED:/)
    await expect.element(seedEl).toBeVisible()
  })

  it('main menu hidden during gameplay', async () => {
    await setPhase('gameplay')
    const el = page.getByTestId('main-menu')
    await expect.element(el).not.toBeInTheDocument()
  })
})
