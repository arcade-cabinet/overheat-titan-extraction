import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { createDbClient, DbClient } from './client';
import { profiles, settings } from './schema';
import { sql } from 'drizzle-orm';

export const DbContext = createContext<DbClient | null>(null);

async function runMigrations(db: DbClient) {
  await db.run(sql`CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    credits INTEGER NOT NULL DEFAULT 0,
    upgrades TEXT NOT NULL DEFAULT '{"cap":1,"pow":1,"cool":1}',
    updated_at INTEGER NOT NULL
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    volume REAL NOT NULL DEFAULT 0.5,
    sensitivity REAL NOT NULL DEFAULT 0.002,
    crt_overlays INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  )`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS run_history (
    id TEXT PRIMARY KEY,
    credits_earned INTEGER NOT NULL DEFAULT 0,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    seed_phrase TEXT NOT NULL,
    result TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`);
}

async function seedDefaults(db: DbClient) {
  const now = new Date();
  await db
    .insert(profiles)
    .values({ id: 'default', credits: 0, updatedAt: now })
    .onConflictDoNothing();
  await db
    .insert(settings)
    .values({ id: 'default', volume: 0.5, sensitivity: 0.002, crtOverlays: false, updatedAt: now })
    .onConflictDoNothing();
}

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [db, setDb] = useState<DbClient | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const client = await createDbClient();
        await runMigrations(client);
        await seedDefaults(client);
        if (!cancelled) setDb(client);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div style={{ color: '#ff3b1f', fontFamily: 'monospace', padding: 20 }}>
        DB INIT FAILED: {error.message}
      </div>
    );
  }

  if (!db) {
    return (
      <div style={{ color: '#00ffcc', fontFamily: 'monospace', padding: 20 }}>
        INITIALIZING DATABASE...
      </div>
    );
  }

  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}
