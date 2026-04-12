import { describe, expect, it } from 'vitest'
import { gameConfig } from '../config'
import rawConfig from '../config.json'

describe('config.json ↔ Zod schema integrity', () => {
  it('gameConfig parses without throwing', () => {
    expect(gameConfig).toBeDefined()
  })

  it('no top-level keys are silently dropped by Zod', () => {
    const rawKeys = Object.keys(rawConfig).sort()
    const parsedKeys = Object.keys(gameConfig).sort()
    expect(parsedKeys).toEqual(rawKeys)
  })

  it('silo fields are all preserved after parse', () => {
    const rawSilo = (rawConfig as any).silo
    for (const key of Object.keys(rawSilo)) {
      expect((gameConfig.silo as any)[key]).toBeDefined()
    }
  })

  it('audio fields are all preserved after parse', () => {
    const rawAudio = (rawConfig as any).audio
    for (const key of Object.keys(rawAudio)) {
      expect((gameConfig.audio as any)[key]).toBeDefined()
    }
  })

  it('audio.rareSell.oscillators is a non-empty array', () => {
    expect(gameConfig.audio.rareSell.oscillators).toBeInstanceOf(Array)
    expect(gameConfig.audio.rareSell.oscillators.length).toBeGreaterThan(0)
  })

  it('economy values are positive numbers', () => {
    expect(gameConfig.economy.cubeValue).toBeGreaterThan(0)
    expect(gameConfig.economy.rareCubeValue).toBeGreaterThan(0)
    expect(gameConfig.economy.denseCubeValue).toBeGreaterThan(0)
    expect(gameConfig.economy.rareCubeValue).toBeGreaterThan(gameConfig.economy.cubeValue)
  })

  it('heat thresholds are in correct order', () => {
    const { overheatThreshold, meltdownThreshold, coolingSafeThreshold } = gameConfig.mech.heat
    expect(coolingSafeThreshold).toBeLessThan(overheatThreshold)
    expect(overheatThreshold).toBeLessThan(meltdownThreshold)
  })

  it('all upgrade keys in upgrades map have baseCost > 0', () => {
    for (const [, val] of Object.entries(gameConfig.upgrades)) {
      expect(val.baseCost).toBeGreaterThan(0)
    }
  })
})
