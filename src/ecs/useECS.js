import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { gameConfig } from '../config'
import {
  DebrisCleanupSystem,
  GrindingSystem,
  HeatSystem,
  HopperSystem,
  VFXCleanupSystem,
} from './systems'
import { Heat, Hopper, MechStats, SiloMarker } from './traits'
import { ecsWorld } from './world'

/**
 * Creates the initial ECS entities on mount — mech, silo.
 * OreNodes are managed by OreSpawner component directly.
 * @param {object} upgrades - current upgrade levels from Zustand store
 * @returns {React.RefObject} ref to the mech entity
 */
export function useECSSetup(upgrades) {
  const mechEntityRef = useRef(null)

  useEffect(() => {
    const mechEntity = ecsWorld.spawn(
      Heat({ value: 0, overheated: false, melting: false }),
      Hopper({
        current: 0,
        max: gameConfig.mech.hopper.baseCapacity,
      }),
      MechStats({
        speed: gameConfig.mech.baseSpeed,
        dashSpeed: gameConfig.mech.dashSpeed,
        grindDps: gameConfig.mech.grind.baseDps,
        coolingRate: gameConfig.mech.heat.baseCoolingRate,
      })
    )
    mechEntityRef.current = mechEntity

    const siloEntity = ecsWorld.spawn(
      SiloMarker({
        posX: gameConfig.silo.position[0],
        posY: gameConfig.silo.position[1],
        posZ: gameConfig.silo.position[2],
      })
    )

    return () => {
      mechEntity.destroy()
      siloEntity.destroy()
    }
  }, [])

  return mechEntityRef
}

/**
 * Runs ECS systems each frame.
 * Accepts Zustand state slices as context (bridge between Zustand and ECS).
 * @param {{ playerPos: React.RefObject, isOverheated: boolean, isPaused: boolean, upgrades: object }} params
 */
export function useECSFrame({ playerPos, isOverheated, isPaused, upgrades }) {
  useFrame((_, delta) => {
    if (isPaused) return

    // Run grinding system
    const { grindingCount, grindingRare } = GrindingSystem(ecsWorld, delta, {
      playerPos,
      upgradePow: upgrades.pow,
      isOverheated,
    })

    // Run heat system
    HeatSystem(ecsWorld, delta, {
      isGrinding: grindingCount > 0,
      grindIsRare: grindingRare,
      upgradeCool: upgrades.cool,
    })

    // Run hopper system
    HopperSystem(ecsWorld, delta, {
      grindingCount,
      upgradePow: upgrades.pow,
      upgradeCap: upgrades.cap,
    })

    // Cleanup systems
    DebrisCleanupSystem(ecsWorld)
    VFXCleanupSystem(ecsWorld, delta)
  })
}
