import { beforeEach, describe, expect, it } from 'vitest'
import { gameConfig } from '../config'
import { gameActions, gameSelectors } from '../ecs/actions'
import { GlobalState, Heat, Hopper, Upgrades } from '../ecs/traits'
import { GameStateEntity } from '../ecs/world'

describe('ECS game actions', () => {
  beforeEach(() => {
    // Reset to clean state before each test
    GameStateEntity.set(GlobalState, {
      phase: 'powered_down',
      isPaused: false,
      credits: 0,
      sessionCredits: 0,
    })
    GameStateEntity.set(Heat, { value: 0, overheated: false, melting: false })
    GameStateEntity.set(Hopper, { current: 0, max: gameConfig.mech.hopper.baseCapacity })
    GameStateEntity.set(Upgrades, { cap: 1, pow: 1, cool: 1 })
  })

  describe('initial trait state', () => {
    it('GlobalState phase starts as powered_down', () => {
      expect(GameStateEntity.get(GlobalState)!.phase).toBe('powered_down')
    })

    it('Heat starts at 0 with no overheated/melting flags', () => {
      const heat = GameStateEntity.get(Heat)!
      expect(heat.value).toBe(0)
      expect(heat.overheated).toBe(false)
      expect(heat.melting).toBe(false)
    })
  })

  describe('setPhase', () => {
    it('transitions phase correctly', () => {
      gameActions.setPhase('boot')
      expect(GameStateEntity.get(GlobalState)!.phase).toBe('boot')
      gameActions.setPhase('menu')
      expect(GameStateEntity.get(GlobalState)!.phase).toBe('menu')
    })
  })

  describe('addOre', () => {
    it('adds ore up to max capacity at level 1', () => {
      const maxOre = gameConfig.mech.hopper.baseCapacity
      gameActions.addOre(50)
      expect(GameStateEntity.get(Hopper)!.current).toBe(50)
      gameActions.addOre(maxOre)
      expect(GameStateEntity.get(Hopper)!.current).toBe(maxOre)
    })

    it('does not double-count capacity upgrades', () => {
      GameStateEntity.set(Upgrades, { cap: 2 })
      const expectedMax =
        gameConfig.mech.hopper.baseCapacity + gameConfig.mech.hopper.capacityPerUpgrade
      gameActions.addOre(expectedMax + 100)
      expect(GameStateEntity.get(Hopper)!.current).toBe(expectedMax)
    })

    it('capacity at level 3 is base + 2 * perUpgrade', () => {
      GameStateEntity.set(Upgrades, { cap: 3 })
      const expectedMax =
        gameConfig.mech.hopper.baseCapacity + 2 * gameConfig.mech.hopper.capacityPerUpgrade
      gameActions.addOre(99999)
      expect(GameStateEntity.get(Hopper)!.current).toBe(expectedMax)
    })
  })

  describe('addHeat / coolDown', () => {
    it('increases heat', () => {
      gameActions.addHeat(50)
      expect(GameStateEntity.get(Heat)!.value).toBe(50)
    })

    it('sets overheated when crossing threshold', () => {
      gameActions.addHeat(gameConfig.mech.heat.overheatThreshold)
      const heat = GameStateEntity.get(Heat)!
      expect(heat.overheated).toBe(true)
    })

    it('triggers meltdown at meltdown threshold', () => {
      gameActions.addHeat(gameConfig.mech.heat.meltdownThreshold)
      const heat = GameStateEntity.get(Heat)!
      expect(heat.melting).toBe(true)
      expect(GameStateEntity.get(GlobalState)!.phase).toBe('meltdown')
    })

    it('coolDown reduces heat', () => {
      gameActions.addHeat(80)
      gameActions.coolDown(30)
      expect(GameStateEntity.get(Heat)!.value).toBe(50)
    })

    it('coolDown clears overheated flag below safe threshold', () => {
      gameActions.addHeat(gameConfig.mech.heat.overheatThreshold)
      expect(GameStateEntity.get(Heat)!.overheated).toBe(true)
      gameActions.coolDown(gameConfig.mech.heat.overheatThreshold)
      expect(GameStateEntity.get(Heat)!.overheated).toBe(false)
    })
  })

  describe('gameSelectors', () => {
    it('getMaxOre matches expected formula', () => {
      GameStateEntity.set(Upgrades, { cap: 2 })
      const expected =
        gameConfig.mech.hopper.baseCapacity + gameConfig.mech.hopper.capacityPerUpgrade
      expect(gameSelectors.getMaxOre()).toBe(expected)
    })

    it('getGrindDps scales with pow upgrade', () => {
      const base = gameConfig.mech.grind.baseDps
      expect(gameSelectors.getGrindDps()).toBe(base)
      GameStateEntity.set(Upgrades, { pow: 2 })
      expect(gameSelectors.getGrindDps()).toBe(base * (1 + gameConfig.mech.grind.dpsPerUpgrade))
    })

    it('getCoolingRate scales with cool upgrade', () => {
      const base = gameConfig.mech.heat.baseCoolingRate
      expect(gameSelectors.getCoolingRate()).toBe(base)
      GameStateEntity.set(Upgrades, { cool: 2 })
      expect(gameSelectors.getCoolingRate()).toBe(
        base * (1 + gameConfig.mech.heat.coolingRatePerUpgrade)
      )
    })
  })

  describe('buyUpgrade', () => {
    it('deducts credits and increments upgrade level', () => {
      GameStateEntity.set(GlobalState, { credits: 1000 })
      const cost = gameConfig.upgrades.cap.baseCost
      gameActions.buyUpgrade('cap', cost)
      expect(GameStateEntity.get(GlobalState)!.credits).toBe(1000 - cost)
      expect(GameStateEntity.get(Upgrades)!.cap).toBe(2)
    })

    it('does nothing if credits insufficient', () => {
      GameStateEntity.set(GlobalState, { credits: 10 })
      gameActions.buyUpgrade('cap', 100)
      expect(GameStateEntity.get(Upgrades)!.cap).toBe(1)
      expect(GameStateEntity.get(GlobalState)!.credits).toBe(10)
    })
  })

  describe('resetSession', () => {
    it('resets heat, hopper, phase, and contracts', () => {
      gameActions.addHeat(80)
      gameActions.addOre(50)
      gameActions.setPhase('gameplay')
      gameActions.resetSession()

      expect(GameStateEntity.get(GlobalState)!.phase).toBe('menu')
      expect(GameStateEntity.get(Heat)!.value).toBe(0)
      expect(GameStateEntity.get(Hopper)!.current).toBe(0)
    })
  })
})
