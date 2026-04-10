import { createWorld } from 'koota'

// Singleton ECS world — one per app lifetime
export const ecsWorld = createWorld()
