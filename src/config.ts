import { z } from 'zod'
import rawConfig from './config.json'

const HeatSchema = z.object({
  perSecondGrinding: z.number(),
  rareMultiplier: z.number(),
  denseMultiplier: z.number(),
  overheatThreshold: z.number(),
  meltdownThreshold: z.number(),
  baseCoolingRate: z.number(),
  coolingSafeThreshold: z.number(),
  coolingRatePerUpgrade: z.number(),
  cameraShakeMaxScale: z.number(),
})

const HopperSchema = z.object({
  baseCapacity: z.number(),
  capacityPerUpgrade: z.number(),
})

const GrindSchema = z.object({
  baseDps: z.number(),
  dpsPerUpgrade: z.number(),
  radius: z.number(),
  soundIntervalMs: z.number(),
})

const DashSchema = z.object({
  fovLerpSpeed: z.number(),
  stepIntervalS: z.number(),
})

const ContractSchema = z.object({
  target: z.number(),
  reward: z.number(),
  desc: z.string(),
  timeLimitS: z.number(),
})

const EnvironmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  baseAmbient: z.number(),
  bootAmbient: z.number(),
  ambientColor: z.string(),
  directionalLightIntensity: z.number(),
  directionalColor: z.string(),
  fogColor: z.string(),
  fogNear: z.number(),
  fogFar: z.number(),
  sporeColor: z.string(),
})

const GameConfigSchema = z.object({
  mech: z.object({
    baseSpeed: z.number(),
    dashSpeed: z.number(),
    dashFov: z.number(),
    normalFov: z.number(),
    eyeHeight: z.number(),
    heat: HeatSchema,
    hopper: HopperSchema,
    grind: GrindSchema,
    dash: DashSchema,
  }),
  environments: z.array(EnvironmentSchema),
  ore: z.object({
    count: z.number(),
    maxHealth: z.number(),
    respawnDelayMs: z.number(),
    rareSpawnChance: z.number(),
    denseSpawnChance: z.number(),
    denseHealthMultiplier: z.number(),
    grindRadius: z.number(),
  }),
  economy: z.object({
    cubeValue: z.number(),
    rareCubeValue: z.number(),
    denseCubeValue: z.number(),
  }),
  contracts: z.object({
    quota: ContractSchema,
    thermal: ContractSchema,
    survival: ContractSchema,
  }),
  upgrades: z.record(z.string(), z.object({ baseCost: z.number() })),
  sparks: z.object({
    maxLive: z.number(),
    ttlMs: z.number(),
    minImpulse: z.number(),
    maxImpulse: z.number(),
  }),
  tractor: z.object({
    reelSpeed: z.number(),
    springStiffness: z.number(),
    springDamping: z.number(),
    minDepth: z.number(),
    defaultDepth: z.number(),
  }),
  silo: z.object({
    position: z.tuple([z.number(), z.number(), z.number()]),
    humBaseFrequency: z.number(),
    humLfoFrequency: z.number(),
    humMaxDistance: z.number(),
  }),
  postFx: z.object({
    bloom: z.object({ luminanceThreshold: z.number(), intensity: z.number() }),
    vignette: z.object({
      darknessCool: z.number(),
      darknessOverheat: z.number(),
      darknessMeltdown: z.number(),
    }),
    chromAberr: z.object({
      heatStartPct: z.number(),
      maxOffset: z.number(),
      baseOffset: z.number(),
    }),
  }),
  audio: z.object({
    defaultMasterVolume: z.number(),
    pauseFilterHz: z.number(),
    normalFilterHz: z.number(),
  }),
  hitStop: z.object({ durationMs: z.number() }),
  debris: z.object({ count: z.number(), ttlMs: z.number() }),
})

export const gameConfig = GameConfigSchema.parse(rawConfig)
