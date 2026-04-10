import { describe, expect, it } from 'vitest'
import { generateSeedPhrase, isValidPhrase, oreVariantFromPhrase, phraseToRng } from './seedPhrase'

describe('generateSeedPhrase', () => {
  it('generates a valid adjective-adjective-noun phrase', () => {
    const phrase = generateSeedPhrase()
    expect(isValidPhrase(phrase)).toBe(true)
    expect(phrase.split('-')).toHaveLength(3)
  })

  it('generates different phrases on subsequent calls', () => {
    const phrases = new Set(Array.from({ length: 20 }, generateSeedPhrase))
    expect(phrases.size).toBeGreaterThan(1)
  })
})

describe('phraseToRng', () => {
  it('produces the same sequence for the same phrase', () => {
    const { rand: r1 } = phraseToRng('molten-crater-titan')
    const { rand: r2 } = phraseToRng('molten-crater-titan')
    for (let i = 0; i < 20; i++) {
      expect(r1()).toBeCloseTo(r2(), 10)
    }
  })

  it('produces different sequences for different phrases', () => {
    const { rand: r1 } = phraseToRng('molten-crater-titan')
    const { rand: r2 } = phraseToRng('frozen-vein-silo')
    const vals1 = Array.from({ length: 5 }, r1)
    const vals2 = Array.from({ length: 5 }, r2)
    expect(vals1).not.toEqual(vals2)
  })

  it('rand() values are in [0, 1)', () => {
    const { rand } = phraseToRng('volatile-rift-reactor')
    for (let i = 0; i < 100; i++) {
      const v = rand()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('oreVariantFromPhrase', () => {
  it('returns the requested count of variants', () => {
    const variants = oreVariantFromPhrase('molten-crater-titan', 8)
    expect(variants).toHaveLength(8)
  })

  it('offsets are within ±3 units', () => {
    const variants = oreVariantFromPhrase('frozen-seam-anvil', 8)
    for (const v of variants) {
      expect(Math.abs(v.dx)).toBeLessThanOrEqual(3)
      expect(Math.abs(v.dz)).toBeLessThanOrEqual(3)
    }
  })

  it('is deterministic — same phrase, same result', () => {
    const a = oreVariantFromPhrase('charged-ridge-drill', 8)
    const b = oreVariantFromPhrase('charged-ridge-drill', 8)
    expect(a).toEqual(b)
  })

  it('produces different results for different phrases', () => {
    const a = oreVariantFromPhrase('molten-crater-titan', 8)
    const b = oreVariantFromPhrase('frozen-vein-silo', 8)
    expect(a).not.toEqual(b)
  })
})

describe('isValidPhrase', () => {
  it('accepts valid phrases', () => {
    expect(isValidPhrase('molten-crater-titan')).toBe(true)
    expect(isValidPhrase('a-b-c')).toBe(true)
  })

  it('rejects invalid phrases', () => {
    expect(isValidPhrase('molten crater titan')).toBe(false)
    expect(isValidPhrase('molten-crater')).toBe(false)
    expect(isValidPhrase('MOLTEN-CRATER-TITAN')).toBe(false)
    expect(isValidPhrase('molten-crater-titan-extra')).toBe(false)
    expect(isValidPhrase('')).toBe(false)
  })
})
