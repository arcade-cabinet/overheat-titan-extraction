import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'browser',
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [
        {
          browser: 'chromium'
        }
      ],
      providerOptions: {
        launch: {
          headless: false,
          args: [
            '--enable-webgl',
            '--ignore-gpu-blocklist',
          ],
        },
      },
      screenshotFailures: false,
    },
    include: ['src/__tests__/browser/**/*.browser.test.{ts,tsx}'],
    globals: true,
    setupFiles: ['src/__tests__/browser/setup.ts'],
    testTimeout: 30000,
    alias: {
      'jeep-sqlite/loader': '/src/__tests__/browser/mocks/jeep-sqlite-loader.ts',
      '@capacitor-community/sqlite': '/src/__tests__/browser/mocks/capacitor-sqlite.ts'
    }
  },
  optimizeDeps: {
    exclude: ['@capacitor-community/sqlite', 'jeep-sqlite'],
  }
})
