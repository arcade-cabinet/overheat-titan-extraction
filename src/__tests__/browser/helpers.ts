import { page } from '@vitest/browser/context'

/** Force the Zustand store to a specific phase for testing */
export async function setPhase(phase: string) {
  await page.evaluate((p) => {
    const win = window as typeof window & { __GAME_STORE_SET__?: (phase: string) => void }
    if (win.__GAME_STORE_SET__) win.__GAME_STORE_SET__(p)
  }, phase)
}

/** Wait for an element with data-testid to appear */
export async function waitForTestId(testId: string, timeout = 5000) {
  await page.getByTestId(testId).waitFor({ timeout })
}

/** Take a screenshot and save it to the screenshots directory */
export async function assertScreenshot(name: string) {
  await page.screenshot({
    path: `src/__tests__/browser/screenshots/${name}.png`,
    fullPage: false,
  })
}
