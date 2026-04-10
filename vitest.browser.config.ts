import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'browser',
    browser: {
      enabled: true,
      name: 'chromium',
      provider: 'playwright',
      providerOptions: {
        launch: {
          args: [
            '--use-gl=swiftshader',
            '--enable-webgl',
            '--ignore-gpu-blocklist',
            '--disable-gpu-sandbox',
          ],
        },
      },
      screenshotFailures: true,
    },
    include: ['src/__tests__/browser/**/*.browser.test.{ts,tsx}'],
    globals: true,
    setupFiles: ['src/__tests__/browser/setup.ts'],
    testTimeout: 30000,
  },
})
