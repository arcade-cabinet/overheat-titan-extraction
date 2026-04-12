import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const DIST = path.resolve(ROOT, 'dist')

/**
 * Verifies the production build output has correct asset paths.
 * CI runs `pnpm build` before tests, so dist/ is always fresh.
 */
describe('production build smoke tests', () => {
  it('dist/index.html exists', () => {
    expect(fs.existsSync(path.resolve(DIST, 'index.html'))).toBe(true)
  })

  it('all script/link src paths use the correct base path', () => {
    const html = fs.readFileSync(path.resolve(DIST, 'index.html'), 'utf-8')
    const basePath = '/overheat-titan-extraction/'

    const srcMatches = html.matchAll(/(?:src|href)="([^"]+)"/g)
    for (const match of srcMatches) {
      const url = match[1]
      if (url.startsWith('http') || url.startsWith('data:')) continue
      expect(url.startsWith(basePath)).toBe(true)
    }
  })

  it('entry point script exists on disk', () => {
    const html = fs.readFileSync(path.resolve(DIST, 'index.html'), 'utf-8')
    const scriptMatch = html.match(/src="\/overheat-titan-extraction\/(assets\/[^"]+\.js)"/)
    expect(scriptMatch).not.toBeNull()
    expect(fs.existsSync(path.resolve(DIST, scriptMatch![1]))).toBe(true)
  })

  it('sql-wasm.wasm exists in public/assets for jeep-sqlite', () => {
    expect(fs.existsSync(path.resolve(ROOT, 'public/assets/sql-wasm.wasm'))).toBe(true)
  })
})
