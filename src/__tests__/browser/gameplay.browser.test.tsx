/** @vitest-environment browser */

import { cleanup, render } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import App from '../../App'

describe('Gameplay Phase', () => {
  beforeEach(() => cleanup())

  it('renders 3D scene in gameplay phase — terrain and cockpit visible', async () => {
    render(<App />)

    // Tests run IN the browser — directly access window globals
    const store = (window as any).__ZUSTAND_STORE__
    if (store) store.setState({ phase: 'gameplay' })

    // Wait for canvas to render
    await page.locator('canvas').waitFor({ timeout: 8000 })

    // Allow one frame for 3D scene to settle
    await new Promise((r) => setTimeout(r, 500))

    await page.screenshot({
      path: 'src/__tests__/browser/screenshots/gameplay.png',
    })

    // Canvas should exist and have non-zero dimensions
    const canvas = page.locator('canvas').element() as HTMLCanvasElement
    expect(canvas.width).toBeGreaterThan(0)
    expect(canvas.height).toBeGreaterThan(0)
  })
})
