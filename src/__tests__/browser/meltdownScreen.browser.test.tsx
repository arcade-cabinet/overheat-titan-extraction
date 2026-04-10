import { describe, it, expect, beforeEach } from 'vitest'
import { page } from '@vitest/browser/context'
import { loadApp, patchStore, setPhase, screenshot } from './helpers'

describe('MeltdownScreen phase', () => {
  beforeEach(async () => {
    await loadApp()
    await patchStore({ heat: 120, isMelting: true, phase: 'meltdown' })
  })

  it('shows meltdown screen in meltdown phase', async () => {
    const el = page.getByTestId('meltdown-screen')
    await expect.element(el).toBeInTheDocument()
    await screenshot('08-meltdown-screen')
  })

  it('shows TITAN LOST text', async () => {
    await expect.element(page.getByText(/TITAN LOST/i)).toBeVisible()
  })

  it('shows report screen', async () => {
    await patchStore({ phase: 'report', isMelting: false })
    await page.waitForTimeout(600)
    const el = page.getByTestId('meltdown-screen')
    await expect.element(el).toBeInTheDocument()
    await screenshot('09-report-screen')
  })

  it('meltdown screen hidden during menu', async () => {
    await setPhase('menu')
    await patchStore({ isMelting: false })
    await expect.element(page.getByTestId('meltdown-screen')).not.toBeInTheDocument()
  })
})
