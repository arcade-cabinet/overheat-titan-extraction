import { page } from '@vitest/browser/context'
import { beforeEach, describe, expect, it } from 'vitest'
import { loadApp, patchStore, screenshot, setPhase } from './helpers'

describe('PauseMenu phase', () => {
  beforeEach(async () => {
    await loadApp()
    await setPhase('gameplay')
    await patchStore({ isPaused: true })
  })

  it('shows pause menu when gameplay is paused', async () => {
    const el = page.getByTestId('pause-menu')
    await expect.element(el).toBeInTheDocument()
    await screenshot('05-pause-menu')
  })

  it('shows RESUME button', async () => {
    await expect.element(page.getByText('[ RESUME ]')).toBeVisible()
  })

  it('pause menu hidden when not paused', async () => {
    await patchStore({ isPaused: false })
    await expect.element(page.getByTestId('pause-menu')).not.toBeInTheDocument()
  })
})
