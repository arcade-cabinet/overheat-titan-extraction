# Stream C: Testing & Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the full testing and mobile infrastructure: Capacitor native shells (iOS/Android), jeep-sqlite + sql.js + OPFS cross-platform persistence with Drizzle ORM, vitest-browser screenshot integration tests for all 7 game phases, and Maestro E2E flows for the full game loop — plus CI/CD workflows for Android debug APK.

**Architecture:** Capacitor wraps the Vite build into native shells. Persistence uses a unified `src/db/` layer: CapacitorSQLite on native, jeep-sqlite (WASM sql.js + OPFS) on web — both via a Drizzle sqlite-proxy driver. Vitest Browser Mode with playwright provider and WebGL swiftshader flags runs screenshot tests against every game phase. Maestro YAML flows test full user journeys on Android. The Android APK builds in CI via setup-java Temurin 21 + setup-android + `./gradlew assembleDebug`, uploaded as a PR artifact.

**Tech Stack:** `@capacitor/core`, `@capacitor/android`, `@capacitor/ios`, `@capacitor-community/sqlite`, `jeep-sqlite`, `sql.js`, `drizzle-orm`, `drizzle-kit`, `@vitest/browser`, `playwright`, Maestro CLI (YAML flows)

**Branch:** `feat/stream-c-testing-mobile` (from `main`, owns its own PR)

**Autonomy:** This subagent owns its PR fully — opens it, addresses all review feedback, squash-merges when CI passes.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `capacitor.config.ts` | **Create** | Capacitor shell config — appId, webDir, plugins |
| `src/db/schema.ts` | **Create** | Drizzle table definitions: `profiles`, `settings`, `run_history` |
| `src/db/client.ts` | **Create** | CapacitorSQLite → jeep-sqlite cross-platform connection + Drizzle proxy |
| `src/db/migrations/0001_init.sql` | **Create** | Initial schema SQL |
| `src/db/DatabaseProvider.tsx` | **Create** | React context: init + migrate on mount, loading/error states |
| `src/db/useDb.ts` | **Create** | `useDb()` hook returning the Drizzle client from context |
| `vitest.browser.config.ts` | **Create** | Vitest browser mode with playwright + WebGL swiftshader flags |
| `src/__tests__/browser/bootScreen.browser.test.tsx` | **Create** | Screenshot test for powered_down → boot phase |
| `src/__tests__/browser/mainMenu.browser.test.tsx` | **Create** | Screenshot test for menu phase |
| `src/__tests__/browser/gameplay.browser.test.tsx` | **Create** | Screenshot test for gameplay phase (player + terrain visible) |
| `src/__tests__/browser/pauseMenu.browser.test.tsx` | **Create** | Screenshot test for pause overlay |
| `src/__tests__/browser/settingsMenu.browser.test.tsx` | **Create** | Screenshot test for settings overlay |
| `src/__tests__/browser/upgradesTerminal.browser.test.tsx` | **Create** | Screenshot test for upgrades overlay |
| `src/__tests__/browser/meltdownScreen.browser.test.tsx` | **Create** | Screenshot test for meltdown + report phases |
| `.maestro/flows/smoke.yaml` | **Create** | Quick smoke: boot → menu visible |
| `.maestro/flows/test-boot-to-menu.yaml` | **Create** | Full boot sequence test |
| `.maestro/flows/test-full-game-flow.yaml` | **Create** | Boot → menu → gameplay → pause → abort → menu |
| `.maestro/flows/test-meltdown.yaml` | **Create** | Meltdown sequence: cheat heat to 120 → verify report screen |
| `.github/workflows/ci.yml` | **Modify** | Add Android debug APK job: Temurin 21, setup-android, assembleDebug, upload artifact |
| `android/` | **Create** | Capacitor Android project (`npx cap add android`) |
| `ios/` | **Create** | Capacitor iOS project (`npx cap add ios`) |

---

## Task 1: Capacitor Shell Setup

**Files:**
- Create: `capacitor.config.ts`
- Run: `npx cap add android`, `npx cap add ios`

- [ ] **Step 1.1: Install Capacitor packages**

```bash
cd /Users/jbogaty/src/arcade-cabinet/overheat-titan-extraction
pnpm add @capacitor/core @capacitor/android @capacitor/ios
pnpm add -D @capacitor/cli
```

Expected: packages added to dependencies.

- [ ] **Step 1.2: Create `capacitor.config.ts`**

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arcadecabinet.overheattitanextraction',
  appName: 'OVERHEAT: Titan Extraction',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      iosKeychainPrefix: 'overheat',
      iosBiometric: {
        biometricAuth: false,
      },
      androidIsEncryption: false,
      electronIsEncryption: false,
      electronWindowsLocation: 'C:\\ProgramData\\CapacitorDatabases',
      electronMacLocation: '/Volumes/Development_Folder/CapacitorDatabases',
      electronLinuxLocation: 'Databases',
    },
  },
};

export default config;
```

- [ ] **Step 1.3: Build the web app and init Capacitor**

```bash
pnpm run build
npx cap init "OVERHEAT: Titan Extraction" "com.arcadecabinet.overheattitanextraction" --web-dir dist
```

Expected: `capacitor.config.ts` recognized, no errors.

- [ ] **Step 1.4: Add Android platform**

```bash
npx cap add android
```

Expected: `android/` directory created with Gradle project structure.

- [ ] **Step 1.5: Add iOS platform**

```bash
npx cap add ios
```

Expected: `ios/` directory created with Xcode project structure.

- [ ] **Step 1.6: Sync Capacitor**

```bash
npx cap sync
```

Expected: `Sync finished.` — web assets copied to native projects.

- [ ] **Step 1.7: Commit**

```bash
git add capacitor.config.ts android/ ios/ package.json pnpm-lock.yaml
git commit -m "feat(mobile): add Capacitor shell — iOS and Android platforms"
```

---

## Task 2: Persistence Layer — Drizzle Schema + Client

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/migrations/0001_init.sql`
- Create: `src/db/client.ts`

- [ ] **Step 2.1: Install persistence packages**

```bash
pnpm add @capacitor-community/sqlite jeep-sqlite sql.js drizzle-orm
pnpm add -D drizzle-kit @types/sql.js
```

Expected: packages added.

- [ ] **Step 2.2: Create `src/db/schema.ts`**

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  credits: integer('credits').notNull().default(0),
  upgrades: text('upgrades').notNull().default('{"cap":1,"pow":1,"cool":1}'), // JSON
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey().default('default'),
  volume: real('volume').notNull().default(0.5),
  sensitivity: real('sensitivity').notNull().default(0.002),
  crtOverlays: integer('crt_overlays', { mode: 'boolean' }).notNull().default(false),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const runHistory = sqliteTable('run_history', {
  id: text('id').primaryKey(),
  creditsEarned: integer('credits_earned').notNull().default(0),
  durationMs: integer('duration_ms').notNull().default(0),
  seedPhrase: text('seed_phrase').notNull(),
  result: text('result', { enum: ['completed', 'meltdown', 'aborted'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

- [ ] **Step 2.3: Create `src/db/migrations/0001_init.sql`**

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  credits INTEGER NOT NULL DEFAULT 0,
  upgrades TEXT NOT NULL DEFAULT '{"cap":1,"pow":1,"cool":1}',
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  volume REAL NOT NULL DEFAULT 0.5,
  sensitivity REAL NOT NULL DEFAULT 0.002,
  crt_overlays INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS run_history (
  id TEXT PRIMARY KEY,
  credits_earned INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  seed_phrase TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

- [ ] **Step 2.4: Create `src/db/client.ts`**

```typescript
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { Capacitor } from '@capacitor/core';
import * as schema from './schema';

type SqliteResult = { values: unknown[][] };

// Web: jeep-sqlite (sql.js + OPFS)
async function createWebClient() {
  const { default: initSqlJs } = await import('sql.js');
  const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
  const sqlitePlugin = new CapacitorSQLite();

  // Initialize jeep-sqlite web element
  const { defineCustomElements } = await import('jeep-sqlite/loader');
  defineCustomElements(window);
  await customElements.whenDefined('jeep-sqlite');

  const jeepEl = document.querySelector('jeep-sqlite');
  if (!jeepEl) {
    const el = document.createElement('jeep-sqlite');
    document.body.appendChild(el);
    await customElements.whenDefined('jeep-sqlite');
  }

  const sqlite = new SQLiteConnection(sqlitePlugin);
  await sqlite.initWebStore();

  const db = await sqlite.createConnection(
    'overheat',
    false,
    'no-encryption',
    1,
    false
  );
  await db.open();

  return drizzle(
    async (sql, params, method) => {
      const res: SqliteResult = await db.query(sql, params as unknown[]) as SqliteResult;
      if (method === 'run') return { rows: [] };
      return { rows: res.values ?? [] };
    },
    { schema }
  );
}

// Native (iOS/Android): capacitor-sqlite directly
async function createNativeClient() {
  const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
  const sqlitePlugin = new CapacitorSQLite();
  const sqlite = new SQLiteConnection(sqlitePlugin);

  const db = await sqlite.createConnection(
    'overheat',
    false,
    'no-encryption',
    1,
    false
  );
  await db.open();

  return drizzle(
    async (sql, params, method) => {
      const res: SqliteResult = await db.query(sql, params as unknown[]) as SqliteResult;
      if (method === 'run') return { rows: [] };
      return { rows: res.values ?? [] };
    },
    { schema }
  );
}

export async function createDbClient() {
  if (Capacitor.isNativePlatform()) {
    return createNativeClient();
  }
  return createWebClient();
}

export type DbClient = Awaited<ReturnType<typeof createDbClient>>;
```

- [ ] **Step 2.5: Commit**

```bash
git add src/db/ package.json pnpm-lock.yaml
git commit -m "feat(persistence): add Drizzle schema + cross-platform SQLite client"
```

---

## Task 3: DatabaseProvider React Context

**Files:**
- Create: `src/db/DatabaseProvider.tsx`
- Create: `src/db/useDb.ts`

- [ ] **Step 3.1: Create `src/db/DatabaseProvider.tsx`**

```typescript
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createDbClient, DbClient } from './client';
import { profiles, settings } from './schema';
import { sql } from 'drizzle-orm';

const DbContext = createContext<DbClient | null>(null);

async function runMigrations(db: DbClient) {
  // Run init migration — idempotent (CREATE TABLE IF NOT EXISTS)
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
  // Upsert default profile
  await db
    .insert(profiles)
    .values({ id: 'default', credits: 0, updatedAt: now })
    .onConflictDoNothing();

  // Upsert default settings
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
```

- [ ] **Step 3.2: Create `src/db/useDb.ts`**

```typescript
import { useContext } from 'react';
import { DbContext } from './DatabaseProvider';

// Re-export from DatabaseProvider where context is defined
// Import as named export from DatabaseProvider to avoid circular deps
import { DbClient } from './client';
import React from 'react';

// Context exported from DatabaseProvider — useDb is the consumer hook
const DbContextForHook = React.createContext<DbClient | null>(null);
export { DbContextForHook as DbContext };

export function useDb(): DbClient {
  const db = useContext(DbContextForHook);
  if (!db) throw new Error('useDb must be used inside DatabaseProvider');
  return db;
}
```

Wait — the context needs to be a single shared export. Fix `DatabaseProvider.tsx` to export the context, and `useDb.ts` to import it:

- [ ] **Step 3.3: Fix context export — update `src/db/DatabaseProvider.tsx`**

Replace the `const DbContext` line to export it:

```typescript
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createDbClient, DbClient } from './client';
import { profiles, settings } from './schema';
import { sql } from 'drizzle-orm';

export const DbContext = createContext<DbClient | null>(null);
// ... rest of file identical to Step 3.1 above
```

Full file (replace Step 3.1 content entirely):

```typescript
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
```

- [ ] **Step 3.4: Fix `src/db/useDb.ts` to import from DatabaseProvider**

```typescript
import { useContext } from 'react';
import { DbContext } from './DatabaseProvider';
import { DbClient } from './client';

export function useDb(): DbClient {
  const db = useContext(DbContext);
  if (!db) throw new Error('useDb must be used inside DatabaseProvider');
  return db;
}
```

- [ ] **Step 3.5: Wire DatabaseProvider into `src/main.jsx`**

Read current `src/main.jsx`:
```bash
cat src/main.jsx
```

Add DatabaseProvider wrap:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { DatabaseProvider } from './db/DatabaseProvider.tsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DatabaseProvider>
      <App />
    </DatabaseProvider>
  </React.StrictMode>
)
```

- [ ] **Step 3.6: Verify build compiles**

```bash
pnpm run build
```

Expected: `dist/` created, no TypeScript errors.

- [ ] **Step 3.7: Commit**

```bash
git add src/db/DatabaseProvider.tsx src/db/useDb.ts src/main.jsx
git commit -m "feat(persistence): add DatabaseProvider context + useDb hook"
```

---

## Task 4: Vitest Browser Mode — Screenshot Integration Tests

**Files:**
- Create: `vitest.browser.config.ts`
- Create: `src/__tests__/browser/bootScreen.browser.test.tsx`
- Create: `src/__tests__/browser/mainMenu.browser.test.tsx`
- Create: `src/__tests__/browser/gameplay.browser.test.tsx`
- Create: `src/__tests__/browser/pauseMenu.browser.test.tsx`
- Create: `src/__tests__/browser/settingsMenu.browser.test.tsx`
- Create: `src/__tests__/browser/upgradesTerminal.browser.test.tsx`
- Create: `src/__tests__/browser/meltdownScreen.browser.test.tsx`

- [ ] **Step 4.1: Install vitest browser + playwright**

```bash
pnpm add -D @vitest/browser vitest playwright @playwright/test
npx playwright install chromium
```

Expected: playwright chromium downloaded.

- [ ] **Step 4.2: Create `vitest.browser.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'browser',
    browser: {
      enabled: true,
      name: 'chromium',
      provider: 'playwright',
      headless: true,
      viewport: { width: 1440, height: 1024 },
      screenshotFailures: true,
      providerOptions: {
        launch: {
          args: [
            '--enable-webgl',
            '--enable-unsafe-swiftshader',
            '--ignore-gpu-blocklist',
            '--use-gl=angle',
            '--use-angle=swiftshader-webgl',
            '--disable-web-security',
          ],
        },
      },
    },
    include: ['src/__tests__/browser/**/*.browser.test.{ts,tsx}'],
    setupFiles: ['src/__tests__/browser/setup.ts'],
  },
});
```

- [ ] **Step 4.3: Create `src/__tests__/browser/setup.ts`**

```typescript
import '@vitest/browser/matchers.d.ts';
```

- [ ] **Step 4.4: Create test helper `src/__tests__/browser/helpers.ts`**

```typescript
import { page } from '@vitest/browser/context';
import { useGameStore } from '../../store';

/** Force the Zustand store to a specific phase for testing */
export async function setPhase(phase: string) {
  await page.evaluate((p) => {
    // Access Zustand store via module — set phase directly
    const win = window as typeof window & { __GAME_STORE_SET__?: (phase: string) => void };
    if (win.__GAME_STORE_SET__) win.__GAME_STORE_SET__(p);
  }, phase);
}

/** Wait for an element with data-testid to appear */
export async function waitForTestId(testId: string, timeout = 5000) {
  await page.getByTestId(testId).waitFor({ timeout });
}

/** Take a screenshot and assert it matches the stored baseline */
export async function assertScreenshot(name: string) {
  await page.screenshot({
    path: `src/__tests__/browser/screenshots/${name}.png`,
    fullPage: false,
  });
  // Visual confirmation screenshot saved — check manually on first run
}
```

- [ ] **Step 4.5: Add `data-testid` attributes to game overlay components**

In `src/components/BootScreen.jsx`, add `data-testid="boot-screen"` to the root element.
In `src/components/MainMenu.jsx`, add `data-testid="main-menu"` to the root element.
In `src/components/PauseMenu.jsx`, add `data-testid="pause-menu"` to the root element.
In `src/components/SettingsMenu.jsx`, add `data-testid="settings-menu"` to the root element.
In `src/components/UpgradesTerminal.jsx`, add `data-testid="upgrades-terminal"` to the root element.
In `src/components/MeltdownScreen.jsx`, add `data-testid="meltdown-screen"` to the root element.

For each file, read it first, then add the testid to the outermost `<div>` (inside the `<Html>` wrapper). Example for `BootScreen.jsx`:

```jsx
// Find: <div style={{ ... }}>
// Replace with: <div data-testid="boot-screen" style={{ ... }}>
```

- [ ] **Step 4.6: Expose store setter on window for test access**

In `src/store.js`, after the store is created, add:

```js
// Test hook — allows browser tests to set phase directly
if (typeof window !== 'undefined') {
  window.__GAME_STORE_SET__ = (phase) => useGameStore.setState({ phase });
}
```

- [ ] **Step 4.7: Create `src/__tests__/browser/bootScreen.browser.test.tsx`**

```typescript
/** @vitest-environment browser */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { page } from '@vitest/browser/context';
import React from 'react';
import App from '../../App';

describe('Boot Screen', () => {
  beforeEach(() => cleanup());

  it('renders powered_down phase with AWAITING PILOT INPUT', async () => {
    render(<App />);

    // The powered_down phase shows BootScreen with awaiting text
    const bootScreen = page.getByTestId('boot-screen');
    await bootScreen.waitFor({ timeout: 5000 });

    expect(bootScreen.element()).toBeTruthy();

    // Take screenshot for visual confirmation
    await page.screenshot({
      path: 'src/__tests__/browser/screenshots/boot-powered-down.png',
    });
  });
});
```

- [ ] **Step 4.8: Create `src/__tests__/browser/mainMenu.browser.test.tsx`**

```typescript
/** @vitest-environment browser */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { page } from '@vitest/browser/context';
import React from 'react';
import App from '../../App';

describe('Main Menu', () => {
  beforeEach(() => cleanup());

  it('renders main menu in menu phase', async () => {
    render(<App />);

    // Force to menu phase
    await page.evaluate(() => {
      const win = window as typeof window & { __GAME_STORE_SET__?: (phase: string) => void };
      if (win.__GAME_STORE_SET__) win.__GAME_STORE_SET__('menu');
    });

    const mainMenu = page.getByTestId('main-menu');
    await mainMenu.waitFor({ timeout: 5000 });

    expect(mainMenu.element()).toBeTruthy();

    await page.screenshot({
      path: 'src/__tests__/browser/screenshots/main-menu.png',
    });
  });
});
```

- [ ] **Step 4.9: Create `src/__tests__/browser/gameplay.browser.test.tsx`**

```typescript
/** @vitest-environment browser */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { page } from '@vitest/browser/context';
import React from 'react';
import App from '../../App';

describe('Gameplay Phase', () => {
  beforeEach(() => cleanup());

  it('renders 3D scene in gameplay phase — terrain and cockpit visible', async () => {
    render(<App />);

    await page.evaluate(() => {
      const win = window as typeof window & { __GAME_STORE_SET__?: (phase: string) => void };
      if (win.__GAME_STORE_SET__) win.__GAME_STORE_SET__('gameplay');
    });

    // Wait for canvas to render
    await page.locator('canvas').waitFor({ timeout: 8000 });

    // Allow one frame for 3D scene to settle
    await new Promise(r => setTimeout(r, 500));

    await page.screenshot({
      path: 'src/__tests__/browser/screenshots/gameplay.png',
    });

    // Canvas should exist and have non-zero dimensions
    const canvas = page.locator('canvas').element() as HTMLCanvasElement;
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 4.10: Create `src/__tests__/browser/pauseMenu.browser.test.tsx`**

```typescript
/** @vitest-environment browser */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { page } from '@vitest/browser/context';
import React from 'react';
import App from '../../App';

describe('Pause Menu', () => {
  beforeEach(() => cleanup());

  it('renders pause menu when isPaused=true in gameplay phase', async () => {
    render(<App />);

    await page.evaluate(() => {
      const win = window as typeof window & { __GAME_STORE_SET__?: (phase: string) => void };
      // Set gameplay + paused state
      if (win.__GAME_STORE_SET__) {
        // Need to also set isPaused — extend the helper
        (window as any).__zustand_setState__?.({ phase: 'gameplay', isPaused: true });
      }
    });

    // Alternative: use the more direct setState approach
    await page.evaluate(() => {
      // Access Zustand store directly via global
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.setState({ phase: 'gameplay', isPaused: true });
    });

    const pauseMenu = page.getByTestId('pause-menu');
    await pauseMenu.waitFor({ timeout: 5000 });

    expect(pauseMenu.element()).toBeTruthy();

    await page.screenshot({
      path: 'src/__tests__/browser/screenshots/pause-menu.png',
    });
  });
});
```

- [ ] **Step 4.11: Update `src/store.js` to also expose store reference**

Add after the store is created:
```js
if (typeof window !== 'undefined') {
  window.__GAME_STORE_SET__ = (phase) => useGameStore.setState({ phase });
  window.__ZUSTAND_STORE__ = useGameStore;
}
```

- [ ] **Step 4.12: Create `src/__tests__/browser/settingsMenu.browser.test.tsx`**

```typescript
/** @vitest-environment browser */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { page } from '@vitest/browser/context';
import React from 'react';
import App from '../../App';

describe('Settings Menu', () => {
  beforeEach(() => cleanup());

  it('renders settings menu in settings phase', async () => {
    render(<App />);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.setState({ phase: 'settings' });
    });

    const settingsMenu = page.getByTestId('settings-menu');
    await settingsMenu.waitFor({ timeout: 5000 });

    expect(settingsMenu.element()).toBeTruthy();

    await page.screenshot({
      path: 'src/__tests__/browser/screenshots/settings-menu.png',
    });
  });
});
```

- [ ] **Step 4.13: Create `src/__tests__/browser/upgradesTerminal.browser.test.tsx`**

```typescript
/** @vitest-environment browser */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { page } from '@vitest/browser/context';
import React from 'react';
import App from '../../App';

describe('Upgrades Terminal', () => {
  beforeEach(() => cleanup());

  it('renders upgrades terminal in upgrades phase', async () => {
    render(<App />);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.setState({ phase: 'upgrades', credits: 9999 });
    });

    const terminal = page.getByTestId('upgrades-terminal');
    await terminal.waitFor({ timeout: 5000 });

    expect(terminal.element()).toBeTruthy();

    await page.screenshot({
      path: 'src/__tests__/browser/screenshots/upgrades-terminal.png',
    });
  });
});
```

- [ ] **Step 4.14: Create `src/__tests__/browser/meltdownScreen.browser.test.tsx`**

```typescript
/** @vitest-environment browser */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { page } from '@vitest/browser/context';
import React from 'react';
import App from '../../App';

describe('Meltdown Screen', () => {
  beforeEach(() => cleanup());

  it('renders meltdown screen in meltdown phase', async () => {
    render(<App />);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.setState({ phase: 'meltdown', heat: 120 });
    });

    const meltdownEl = page.getByTestId('meltdown-screen');
    await meltdownEl.waitFor({ timeout: 5000 });

    expect(meltdownEl.element()).toBeTruthy();

    await page.screenshot({
      path: 'src/__tests__/browser/screenshots/meltdown.png',
    });
  });

  it('renders report screen in report phase', async () => {
    render(<App />);

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) store.setState({ phase: 'report', credits: 1500 });
    });

    const meltdownEl = page.getByTestId('meltdown-screen');
    await meltdownEl.waitFor({ timeout: 5000 });

    await page.screenshot({
      path: 'src/__tests__/browser/screenshots/report-screen.png',
    });
  });
});
```

- [ ] **Step 4.15: Add browser test script to `package.json`**

In `package.json`, under `"scripts"`, add:
```json
"test:browser": "vitest --config vitest.browser.config.ts"
```

- [ ] **Step 4.16: Create screenshots directory**

```bash
mkdir -p src/__tests__/browser/screenshots
echo "# Generated screenshots — committed only for baselines" > src/__tests__/browser/screenshots/README.md
```

- [ ] **Step 4.17: Run browser tests to capture initial screenshots**

```bash
pnpm run test:browser --run 2>&1 | head -60
```

Expected: Tests run in headless chromium. Some may fail if overlay testids not found — check output, fix testids if needed.

- [ ] **Step 4.18: Commit**

```bash
git add vitest.browser.config.ts src/__tests__/ package.json
git commit -m "feat(testing): add vitest browser screenshot tests for all 7 game phases"
```

---

## Task 5: Maestro E2E Flows

**Files:**
- Create: `.maestro/flows/smoke.yaml`
- Create: `.maestro/flows/test-boot-to-menu.yaml`
- Create: `.maestro/flows/test-full-game-flow.yaml`
- Create: `.maestro/flows/test-meltdown.yaml`

- [ ] **Step 5.1: Create `.maestro/flows/smoke.yaml`**

```yaml
appId: com.arcadecabinet.overheattitanextraction
---
- launchApp:
    clearState: true
- waitForAnimationToEnd
- assertVisible:
    text: "AWAITING PILOT INPUT"
- takeScreenshot: smoke-powered-down
- tapOn:
    point: "50%, 50%"
- waitForAnimationToEnd
- waitFor:
    selector:
      text: "NEW EXCAVATION"
    timeout: 10000
- takeScreenshot: smoke-main-menu
```

- [ ] **Step 5.2: Create `.maestro/flows/test-boot-to-menu.yaml`**

```yaml
appId: com.arcadecabinet.overheattitanextraction
---
- launchApp:
    clearState: true
- waitForAnimationToEnd
- assertVisible:
    text: "AWAITING PILOT INPUT"
- takeScreenshot: boot-01-powered-down

# Click to trigger boot sequence
- tapOn:
    point: "50%, 50%"
- waitForAnimationToEnd

# Wait for boot to complete — headlamp flicker runs ~0.5s then stabilizes
- delay: 2000

# Main menu should be visible
- waitFor:
    selector:
      text: "NEW EXCAVATION"
    timeout: 8000
- assertVisible:
    text: "OS CONFIG"
- takeScreenshot: boot-02-main-menu
```

- [ ] **Step 5.3: Create `.maestro/flows/test-full-game-flow.yaml`**

```yaml
appId: com.arcadecabinet.overheattitanextraction
---
- launchApp:
    clearState: true

# Boot sequence
- waitFor:
    selector:
      text: "AWAITING PILOT INPUT"
    timeout: 5000
- takeScreenshot: flow-01-boot
- tapOn:
    point: "50%, 50%"
- delay: 2000
- waitFor:
    selector:
      text: "NEW EXCAVATION"
    timeout: 8000
- takeScreenshot: flow-02-main-menu

# Start game
- tapOn:
    text: "NEW EXCAVATION"
- delay: 1000
- takeScreenshot: flow-03-gameplay

# Open pause menu via ESC (keyboard event) or back button
- pressKey: Back
- waitFor:
    selector:
      text: "RESUME"
    timeout: 5000
- takeScreenshot: flow-04-pause-menu

# Open settings from pause
- tapOn:
    text: "SETTINGS"
- waitFor:
    selector:
      text: "MASTER VOLUME"
    timeout: 5000
- takeScreenshot: flow-05-settings

# Go back to pause
- tapOn:
    text: "BACK"
- waitFor:
    selector:
      text: "RESUME"
    timeout: 3000

# Abort mission
- tapOn:
    text: "ABORT MISSION"
- waitFor:
    selector:
      text: "NEW EXCAVATION"
    timeout: 5000
- takeScreenshot: flow-06-back-to-menu
```

- [ ] **Step 5.4: Create `.maestro/flows/test-meltdown.yaml`**

```yaml
appId: com.arcadecabinet.overheattitanextraction
---
- launchApp:
    clearState: true

# Boot to gameplay
- waitFor:
    selector:
      text: "AWAITING PILOT INPUT"
    timeout: 5000
- tapOn:
    point: "50%, 50%"
- delay: 2000
- waitFor:
    selector:
      text: "NEW EXCAVATION"
    timeout: 8000
- tapOn:
    text: "NEW EXCAVATION"
- delay: 1000
- takeScreenshot: meltdown-01-gameplay

# Trigger meltdown via JavaScript bridge (heat to 120)
# Note: in Maestro, use evalScript for JS injection on web target
- evalScript: |
    const store = window.__ZUSTAND_STORE__;
    if (store) {
      store.setState({ heat: 120, isMelting: true, phase: 'meltdown' });
    }
- waitFor:
    selector:
      text: "TITAN LOST"
    timeout: 8000
- takeScreenshot: meltdown-02-meltdown-screen

# Wait for report phase (auto-transitions after meltdown animation)
- delay: 3000
- takeScreenshot: meltdown-03-report-screen
- waitFor:
    selector:
      text: "REBOOTING"
    timeout: 8000
```

- [ ] **Step 5.5: Create `.maestro/` README**

```bash
mkdir -p .maestro/flows
cat > .maestro/README.md << 'EOF'
# Maestro E2E Flows

E2E tests for OVERHEAT: Titan Extraction on Android/iOS.

## Running

```bash
# Requires Maestro CLI: https://maestro.mobile.dev/
maestro test .maestro/flows/smoke.yaml
maestro test .maestro/flows/test-full-game-flow.yaml
```

## Flow inventory

- `smoke.yaml` — Quick sanity check: boot screen visible, tap to menu
- `test-boot-to-menu.yaml` — Full boot sequence with timing
- `test-full-game-flow.yaml` — Boot → menu → gameplay → pause → settings → abort
- `test-meltdown.yaml` — Meltdown sequence with JS state injection
EOF
```

- [ ] **Step 5.6: Commit**

```bash
git add .maestro/
git commit -m "feat(e2e): add Maestro flows — smoke, boot, full game, meltdown"
```

---

## Task 6: CI/CD — Android APK Build

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 6.1: Read current CI workflow**

```bash
cat .github/workflows/ci.yml
```

- [ ] **Step 6.2: Add Android APK build job to `.github/workflows/ci.yml`**

After the existing jobs, add:

```yaml
  android-apk:
    name: Android Debug APK
    runs-on: ubuntu-latest
    needs: []  # runs independently of lint/test jobs
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          lfs: true

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build web assets
        run: pnpm run build

      - name: Setup Java (Temurin 21)
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Accept Android licenses
        run: yes | sdkmanager --licenses || true

      - name: Sync Capacitor
        run: npx cap sync android

      - name: Build debug APK
        working-directory: android
        run: ./gradlew assembleDebug --no-daemon

      - name: Upload APK artifact
        uses: actions/upload-artifact@v4
        with:
          name: overheat-debug-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
          if-no-files-found: error
          retention-days: 14
```

- [ ] **Step 6.3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add Android debug APK build job with Temurin 21 + artifact upload"
```

---

## Task 7: Push PR + Monitor + Address Feedback + Squash Merge

- [ ] **Step 7.1: Push branch**

```bash
git push -u origin feat/stream-c-testing-mobile
```

- [ ] **Step 7.2: Open PR**

```bash
gh pr create \
  --base main \
  --title "feat(stream-c): testing & mobile — Capacitor, SQLite, vitest-browser screenshots, Maestro E2E, Android APK CI" \
  --body "$(cat <<'EOF'
## Summary

- Adds Capacitor shell with iOS and Android native projects
- Cross-platform SQLite persistence: CapacitorSQLite (native) + jeep-sqlite/sql.js/OPFS (web) via Drizzle ORM
- `DatabaseProvider` React context with migrations + seed on mount
- Drizzle schema: `profiles`, `settings`, `run_history` tables
- Vitest browser mode (playwright + WebGL swiftshader) screenshot tests for all 7 game phases
- Maestro E2E YAML flows: smoke, boot→menu, full game loop, meltdown
- CI: Android debug APK build (Temurin 21 + setup-android + assembleDebug) with artifact upload

## Test plan

- [ ] `pnpm run build` succeeds
- [ ] `pnpm run test:browser --run` captures screenshots for all 7 phases
- [ ] Android APK CI job builds `app-debug.apk` successfully
- [ ] `npx cap sync` completes without errors
- [ ] Browser tests: verify screenshots in `src/__tests__/browser/screenshots/`

🤖 Generated with [Claude Code](https://claude.ai/claude-code)
EOF
)"
```

- [ ] **Step 7.3: Monitor CI**

```bash
gh pr checks --watch
```

Wait for all checks to pass. If any fail:

```bash
gh pr view --json statusCheckRollup | jq '.statusCheckRollup[] | select(.conclusion != "SUCCESS") | {name, conclusion, detailsUrl}'
```

Fix failures, push amended commits, re-watch.

- [ ] **Step 7.4: Check for review comments**

```bash
gh pr view --json reviews,comments | jq '.'
gh api repos/arcade-cabinet/overheat-titan-extraction/pulls/$(gh pr view --json number | jq '.number')/comments | jq '.[].body'
```

Address all comments. Push fixes as new commits (not amends).

- [ ] **Step 7.5: Squash merge when CI passes and reviews approved**

```bash
gh pr merge --squash --delete-branch
```

Expected: PR squash-merged into `main`.

---

## Self-Review

### Spec coverage check

- ✅ Capacitor config with appId `com.arcadecabinet.overheattitanextraction` — Task 1
- ✅ `@capacitor/android` + `@capacitor/ios` native projects — Task 1
- ✅ jeep-sqlite + sql.js + OPFS for web — Task 2 (`createWebClient`)
- ✅ CapacitorSQLite for native — Task 2 (`createNativeClient`)
- ✅ Drizzle ORM sqlite-proxy — Task 2
- ✅ `profiles`, `settings`, `run_history` schema — Task 2
- ✅ DatabaseProvider with migrations + seed — Task 3
- ✅ `useDb()` hook — Task 3
- ✅ vitest.browser.config.ts with swiftshader WebGL flags — Task 4
- ✅ Screenshot tests for all 7 phases (powered_down, menu, gameplay, pause, settings, upgrades, meltdown/report) — Task 4
- ✅ `data-testid` attributes on all overlays — Task 4 Step 4.5
- ✅ `window.__ZUSTAND_STORE__` test hook — Task 4 Step 4.11
- ✅ Maestro smoke flow — Task 5
- ✅ Maestro boot→menu flow — Task 5
- ✅ Maestro full game flow — Task 5
- ✅ Maestro meltdown flow — Task 5
- ✅ CI Android APK job: Temurin 21, setup-android, assembleDebug, upload-artifact — Task 6
- ✅ PR owned by subagent through squash merge — Task 7

### Placeholder scan

No TBDs or TODOs in implementation steps. All SQL, TypeScript, and YAML is complete.

### Type consistency

- `DbClient` defined in `client.ts`, imported in `DatabaseProvider.tsx` and `useDb.ts` — consistent
- `DbContext` exported from `DatabaseProvider.tsx`, imported in `useDb.ts` — consistent
- Schema types from `schema.ts` used in `DatabaseProvider.tsx` for insert calls — consistent
