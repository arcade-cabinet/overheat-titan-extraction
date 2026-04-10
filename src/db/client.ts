import { Capacitor } from '@capacitor/core'
import { drizzle } from 'drizzle-orm/sqlite-proxy'
import * as schema from './schema'

type SqliteResult = { values: unknown[][] }

// Web: jeep-sqlite (sql.js + OPFS)
async function createWebClient() {
  const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite')
  const sqlitePlugin = CapacitorSQLite as any

  // Initialize jeep-sqlite web element
  const { defineCustomElements } = await import('jeep-sqlite/loader')
  defineCustomElements(window)
  await customElements.whenDefined('jeep-sqlite')

  const jeepEl = document.querySelector('jeep-sqlite')
  if (!jeepEl) {
    const el = document.createElement('jeep-sqlite')
    document.body.appendChild(el)
    await customElements.whenDefined('jeep-sqlite')
  }

  const sqlite = new SQLiteConnection(sqlitePlugin)
  await sqlite.initWebStore()

  const db = await sqlite.createConnection('overheat', false, 'no-encryption', 1, false)
  await db.open()

  return drizzle(
    async (sql, params, method) => {
      const res: SqliteResult = (await db.query(sql, params as unknown[])) as SqliteResult
      if (method === 'run') return { rows: [] }
      return { rows: res.values ?? [] }
    },
    { schema }
  )
}

// Native (iOS/Android): capacitor-sqlite directly
async function createNativeClient() {
  const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite')
  const sqlitePlugin = CapacitorSQLite as any
  const sqlite = new SQLiteConnection(sqlitePlugin)

  const db = await sqlite.createConnection('overheat', false, 'no-encryption', 1, false)
  await db.open()

  return drizzle(
    async (sql, params, method) => {
      const res: SqliteResult = (await db.query(sql, params as unknown[])) as SqliteResult
      if (method === 'run') return { rows: [] }
      return { rows: res.values ?? [] }
    },
    { schema }
  )
}

export async function createDbClient() {
  if (Capacitor.isNativePlatform()) {
    return createNativeClient()
  }
  return createWebClient()
}

export type DbClient = Awaited<ReturnType<typeof createDbClient>>
