import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['src/**/*.browser.test.*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/utils/**', 'src/ecs/**', 'src/config.js'],
    },
  },
})
