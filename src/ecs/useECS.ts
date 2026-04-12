import { useFrame } from '@react-three/fiber'
import { useEffect } from 'react'
import { audioManager } from '../audio/AudioEngine'
import { gameConfig } from '../config'
import { useGameStore } from '../store'
import {
  DebrisCleanupSystem,
  GrindingSystem,
  HeatSystem,
  HopperSystem,
  VFXCleanupSystem,
} from './systems'
import { SiloMarker } from './traits'
import { ecsWorld } from './world'

/**
 * Creates the initial ECS entities on mount — mech, silo.
 * OreNodes are managed by OreSpawner component directly.
 * @param {object} upgrades - current upgrade levels from Zustand store
 * @returns {React.RefObject} ref to the mech entity
 */
export function useECSSetup(_upgrades: any) {
  useEffect(() => {
    const siloEntity = ecsWorld.spawn(
      SiloMarker({
        posX: gameConfig.silo.position[0],
        posY: gameConfig.silo.position[1],
        posZ: gameConfig.silo.position[2],
      })
    )

    return () => {
      siloEntity.destroy()
    }
  }, [])
}

/**
 * Runs ECS systems each frame.
 * Accepts Zustand state slices as context (bridge between Zustand and ECS).
 * @param {{ playerPos: React.RefObject, isOverheated: boolean, isPaused: boolean, upgrades: object }} params
 */
export function useECSFrame({ playerPos, isOverheated, isPaused, upgrades }: any) {
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

    // Update continuous audio
    const heat = useGameStore.getState().heat
    audioManager.setGrinding(grindingCount > 0, heat)

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
