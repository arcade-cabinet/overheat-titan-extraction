// Word pools — industrial/alien theming matching game identity
const ADJECTIVES_1 = [
  'molten',
  'frozen',
  'volatile',
  'dense',
  'radiant',
  'toxic',
  'corroded',
  'inert',
  'fused',
  'brittle',
  'glowing',
  'hollow',
  'cracked',
  'charged',
  'buried',
  'jagged',
  'seared',
  'warped',
  'silent',
  'orbital',
]

const ADJECTIVES_2 = [
  'crater',
  'vein',
  'shard',
  'core',
  'node',
  'seam',
  'pulse',
  'mass',
  'rift',
  'cluster',
  'layer',
  'drift',
  'field',
  'peak',
  'trench',
  'shelf',
  'basin',
  'ridge',
  'fault',
  'lode',
]

const NOUNS = [
  'titan',
  'raptor',
  'anvil',
  'forge',
  'silo',
  'mech',
  'drill',
  'vault',
  'beacon',
  'hatch',
  'core',
  'pylon',
  'vent',
  'slag',
  'chassis',
  'turbine',
  'reactor',
  'conduit',
  'hopper',
  'grinder',
]

/**
 * Seeded LCG (Linear Congruential Generator).
 * Deterministic pseudo-random number generator from a numeric seed.
 * Returns a function that yields floats [0, 1).
 */
function lcg(seed: number): () => number {
  let state = seed >>> 0 // uint32
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

/**
 * Hash a string to a uint32.
 * Uses FNV-1a 32-bit hash for good avalanche on short strings.
 */
function hashString(str: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash
}

/**
 * Generate a random adjective-adjective-noun seed phrase.
 * Uses Math.random() — for new run generation only (not seeded).
 */
export function generateSeedPhrase(): string {
  const a1 = ADJECTIVES_1[Math.floor(Math.random() * ADJECTIVES_1.length)]
  const a2 = ADJECTIVES_2[Math.floor(Math.random() * ADJECTIVES_2.length)]
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  return `${a1}-${a2}-${n}`
}

/**
 * Convert a seed phrase string to a seeded PRNG.
 * Returns a rand() function that yields deterministic floats [0, 1).
 */
export function phraseToRng(phrase: string): { rand: () => number; seed: number } {
  const seed = hashString(phrase.toLowerCase().trim())
  const rand = lcg(seed)
  return { rand, seed }
}

/**
 * Generate deterministic ore position offsets from a seed phrase.
 * Returns an array of {dx, dz, isRare} to apply to the base ORE_POSITIONS.
 * Offsets are small (±3 units) so ore stays in valid terrain.
 */
export function oreVariantFromPhrase(
  phrase: string,
  count: number,
  rareChance: number = 0.15
): Array<{ dx: number; dz: number; isRare: boolean }> {
  const { rand } = phraseToRng(phrase)
  const variants = []
  for (let i = 0; i < count; i++) {
    const dx = (rand() - 0.5) * 6
    const dz = (rand() - 0.5) * 6
    const isRare = rand() < rareChance
    variants.push({ dx, dz, isRare })
  }
  return variants
}

/**
 * Validate that a phrase is a valid seed phrase format.
 * word-word-word, all lowercase letters and hyphens only.
 */
export function isValidPhrase(phrase: string): boolean {
  return /^[a-z]+-[a-z]+-[a-z]+$/.test(phrase)
}
