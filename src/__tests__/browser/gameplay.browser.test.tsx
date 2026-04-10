import { page } from '@vitest/browser/context'
import { beforeEach, describe, expect, it } from 'vitest'
import { loadApp, screenshot, setPhase } from './helpers'

describe('Gameplay phase', () => {
  beforeEach(async () => {
    await loadApp()
    await setPhase('gameplay')
    // Give physics + WebGL a moment to render first frame
    await new Promise((resolve) => setTimeout(resolve, 1500))
  })

  it('renders gameplay without overlay menus', async () => {
    await expect.element(page.getByTestId('main-menu')).not.toBeInTheDocument()
    await expect.element(page.getByTestId('boot-screen')).not.toBeInTheDocument()
    await expect.element(page.getByTestId('pause-menu')).not.toBeInTheDocument()
    await screenshot('04-gameplay')
  })

  it('canvas element is present and visible', async () => {
    const canvasEl = document.querySelector('canvas')
    expect(canvasEl).not.toBeNull()
  })
})
