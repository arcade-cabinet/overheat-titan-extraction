import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  credits: integer('credits').notNull().default(0),
  upgrades: text('upgrades').notNull().default('{"cap":1,"pow":1,"cool":1}'), // JSON
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey().default('default'),
  volume: real('volume').notNull().default(0.5),
  sensitivity: real('sensitivity').notNull().default(0.002),
  crtOverlays: integer('crt_overlays', { mode: 'boolean' }).notNull().default(false),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const runHistory = sqliteTable('run_history', {
  id: text('id').primaryKey(),
  creditsEarned: integer('credits_earned').notNull().default(0),
  durationMs: integer('duration_ms').notNull().default(0),
  seedPhrase: text('seed_phrase').notNull(),
  result: text('result', { enum: ['completed', 'meltdown', 'aborted'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
