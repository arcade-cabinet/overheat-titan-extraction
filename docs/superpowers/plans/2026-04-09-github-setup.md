# GitHub Copilot + CI/CD Setup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand `.github/` to include: a self-contained Copilot instructions file, reusable prompt files, dependabot, issue templates, CD workflow for GitHub Pages, and release-please config. Also create `CHANGELOG.md` if not already present.

**Architecture:** All files are GitHub-native configuration formats. No code changes — CI/CD and agent config only.

**Tech Stack:** GitHub Actions YAML, Markdown, JSON (release-please).

---

## File map

| Action | File | Purpose |
|---|---|---|
| Update | `.github/copilot-instructions.md` | Expand to self-contained (not just a redirect) |
| Create | `.github/prompts/implement-handoff-item.prompt.md` | Copilot reusable prompt |
| Create | `.github/prompts/update-docs-after-feature.prompt.md` | Copilot reusable prompt |
| Create | `.github/dependabot.yml` | Automated dependency updates |
| Create | `.github/ISSUE_TEMPLATE/bug.yml` | Bug report template |
| Create | `.github/ISSUE_TEMPLATE/feature.yml` | Feature request template |
| Create | `.github/ISSUE_TEMPLATE/config.yml` | Issue template chooser config |
| Create | `.github/workflows/cd.yml` | GitHub Pages deploy on push to main |
| Create | `release-please-config.json` | Release-please config |
| Create | `.release-please-manifest.json` | Release-please manifest |

---

## Task 1: Expand `.github/copilot-instructions.md`

**Files:**
- Modify: `.github/copilot-instructions.md`

- [ ] **Step 1: Replace with fully self-contained instructions**

```markdown
# GitHub Copilot Instructions — OVERHEAT: Titan Extraction

These instructions apply to all Copilot interactions: inline completions, Copilot Chat, and Copilot Coding Agent sessions.

> For the full agent protocol, read [`AGENTS.md`](../AGENTS.md). This file is a self-contained subset for quick reference.

---

## Project identity

- **Game:** OVERHEAT: Titan Extraction — extraction / resource-management / physics sandbox
- **Stack:** Vite + React + React Three Fiber + Rapier physics + Zustand (interim) / Koota ECS (production target)
- **Platform:** Browser WebGL 2; mobile via Capacitor (planned M3)
- **Build:** `pnpm run build` — must be green before any PR is merged

---

## Session start checklist

Before writing any code:
1. Read `AGENTS.md` — master architecture, tech stack, physics rules, audio contract
2. Read `docs/HANDOFF.md` — what's done (`[x]`) and what's next (`[ ]`)
3. Read `docs/STANDARDS.md` — color palette, component patterns, no-go list
4. Run `pnpm install && pnpm run build` — confirm healthy tree

---

## Architecture rules (non-negotiable)

### Physics
- `@react-three/rapier` ONLY. Cannon.js is banned — it caused Vec3 NaN crashes on convex hulls that crashed WebGL.
- Collider types: `BallCollider` for ore, `cuboid` for player/cubes, `HeightfieldCollider` for terrain.
- Never use convex hull colliders on ore or large procedurally generated geometry.

### State
- **Current:** Zustand store at `src/store.js` — subscribe with narrow selectors only.
- **Production target (M1+):** Koota ECS. New gameplay entity systems go in Koota traits, not Zustand.
- Never use React Context for game loop state.

### UI
- In-game HUD: rendered to `THREE.CanvasTexture` on the dashboard mesh. Never DOM overlays.
- Menus: `@react-three/drei` `<Html fullscreen>` component. Never raw `document.createElement`.

### Audio
- `src/audio/AudioEngine.js` singleton. tune.js is not on npm — we use Web Audio API.
- Never hardcode frequencies in components — call `audioManager.*` methods.

### Terrain
- Simplex noise via `simplex-noise` library. Never `Math.sin` grids.

---

## Component authoring

```jsx
export function ComponentName() {
  // Narrow Zustand selectors
  const phase = useGameStore((s) => s.phase)
  const bodyRef = useRef()

  // Memoize procedural geometry
  const geometry = useMemo(() => { /* ... */ }, [])

  useFrame((state, delta) => {
    if (!bodyRef.current) return
    if (phase !== 'gameplay') return
    // physics / shader / camera logic only
  })

  return ( /* ... */ )
}
```

## GLSL shaders

- Prefix uniforms: `u` (uHeat, uTime)
- Update imperatively in `useFrame`: `matRef.current.uHeat = heat / 100`
- Never update uniforms via React state

---

## Color palette (brand identity — do not change)

| Token | Hex | Usage |
|---|---|---|
| void | `#020406` | Background, fog |
| oreNeon | `#00ffcc` | Ore, primary UI, silo beam |
| oreRare | `#ff00ff` | Rare isotope (magenta) |
| heatWarn | `#ff4400` | Heat bar warning |
| heatCrit | `#ff0000` | Critical heat, alarms |
| chassis | `#0f1418` | Mech body, dashboard |
| sunlight | `#ffaa55` | Alien directional sun |
| credit | `#ffaa00` | Credits, cube emissive |
| cockpitLED | `#4a6fff` | Cool cockpit accent LEDs |

---

## Do NOT introduce

- Cannon.js
- React Context for game loop state
- HTML DOM overlays for in-game HUD (heat/hopper/credits)
- `Math.sin` terrain grids
- Convex hull colliders on ore
- tune.js
- framer-motion-3d
- Redux, MobX, or any additional state library
- `node_modules/`, `dist/`, or `.env` in commits

---

## Session end checklist

Before ending any Copilot Coding Agent session:
1. Update `docs/HANDOFF.md` — mark completed items `[x]`, update session log
2. If new pattern established → update `docs/STANDARDS.md`
3. If pivotal decision made → record in `docs/architecture/decisions.md`
4. Run `pnpm run build` — zero errors required
5. Commit with Conventional Commits format: `feat(component): description`

---

## Conventional commit format

```
feat(terrain): add simplex octave layering
fix(player): clamp pitch to ±60 degrees
docs(handoff): mark tractor beam as complete
chore(deps): update rapier to 2.3.0
```

---

## Copilot Coding Agent — additional rules

When operating as an autonomous Copilot Coding Agent (not inline completion):

- Read all four session-start files before writing any code (checklist above).
- Work through `docs/HANDOFF.md §2` in priority order — do not skip priorities.
- Each PR must: pass `pnpm run check` (Biome), pass `pnpm run build`, and update `docs/HANDOFF.md`.
- PR title follows Conventional Commits. Body references the HANDOFF.md item completed.
- See `.github/pull_request_template.md` for the required PR checklist.
```

- [ ] **Step 2: Commit**

```bash
git add .github/copilot-instructions.md
git commit -m "docs(github): expand copilot-instructions to self-contained agent guide"
```

---

## Task 2: Create Copilot reusable prompt files

**Files:**
- Create: `.github/prompts/implement-handoff-item.prompt.md`
- Create: `.github/prompts/update-docs-after-feature.prompt.md`

- [ ] **Step 1: Create implement-handoff-item prompt**

```markdown
---
mode: agent
description: Implement the next highest-priority item from docs/HANDOFF.md. Reads context, implements, updates docs, builds.
---

You are implementing a feature for OVERHEAT: Titan Extraction.

## Pre-flight (do this first, output nothing until done)
1. Read `AGENTS.md` completely.
2. Read `docs/HANDOFF.md` — identify the highest-priority unchecked item in §2.
3. Read `docs/STANDARDS.md` — internalize color palette, component patterns, physics rules.
4. Run `pnpm install && pnpm run build` — confirm the tree is healthy.

## Implementation
Implement the identified HANDOFF.md priority item following all AGENTS.md and STANDARDS.md rules.

## Post-flight (required before finishing)
1. Run `pnpm run check` (Biome lint) — fix any errors.
2. Run `pnpm run build` — must be zero errors.
3. Update `docs/HANDOFF.md` — mark the item `[x]`, add a session log entry.
4. If you established a new architectural pattern, update `docs/STANDARDS.md`.
5. Commit with message: `feat(<component>): <description of what was implemented>`
```

- [ ] **Step 2: Create update-docs-after-feature prompt**

```markdown
---
mode: agent
description: Update all relevant documentation after a feature has been implemented. Ensures HANDOFF, STANDARDS, and domain docs are accurate.
---

A feature has just been implemented in OVERHEAT: Titan Extraction. Your job is documentation — not code.

## What to update

1. **`docs/HANDOFF.md`**
   - Mark completed items `[x]` in the quick state snapshot table.
   - Add a session log entry: `| YYYY-MM-DD | agent | <what was built> |`
   - Update §3 Known Issues if any were fixed or discovered.

2. **`docs/STANDARDS.md`**
   - If any new permanent convention was established (a new collider type, a new shader pattern, a new store action naming rule), add it.

3. **`docs/architecture/decisions.md`**
   - If a pivotal technical decision was made (choosing a library, abandoning an approach, establishing a physics contract), add an ADR.

4. **Domain docs** (update the relevant one)
   - Gameplay change → `docs/gameplay/loop-and-progression.md`
   - Visual/audio change → `docs/design/visual-audio-direction.md`
   - Architecture change → `docs/architecture/overview.md` or `runtime-systems.md`

5. **`docs/README.md`** — if a new doc file was created, add it to the domain map.

## After updating
Commit: `docs(<domain>): update <doc-name> after <feature>`
```

- [ ] **Step 3: Commit**

```bash
git add .github/prompts/
git commit -m "chore(github): add Copilot reusable prompt files"
```

---

## Task 3: Create `.github/dependabot.yml`

**Files:**
- Create: `.github/dependabot.yml`

- [ ] **Step 1: Create the file**

```yaml
version: 2

updates:
  # npm/pnpm dependencies
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
      day: 'monday'
      time: '06:00'
      timezone: 'America/New_York'
    open-pull-requests-limit: 5
    labels:
      - 'dependencies'
    groups:
      r3f-ecosystem:
        patterns:
          - '@react-three/*'
          - 'three'
          - 'postprocessing'
        update-types:
          - 'minor'
          - 'patch'
      react:
        patterns:
          - 'react'
          - 'react-dom'
        update-types:
          - 'minor'
          - 'patch'
      dev-deps:
        patterns:
          - '@biomejs/*'
          - 'vite'
          - '@vitejs/*'
        update-types:
          - 'minor'
          - 'patch'

  # GitHub Actions
  - package-ecosystem: 'github-actions'
    directory: '/'
    schedule:
      interval: 'weekly'
      day: 'monday'
      time: '06:00'
      timezone: 'America/New_York'
    open-pull-requests-limit: 3
    labels:
      - 'dependencies'
      - 'ci'
```

- [ ] **Step 2: Commit**

```bash
git add .github/dependabot.yml
git commit -m "ci: add dependabot.yml — npm and github-actions weekly updates"
```

---

## Task 4: Create issue templates

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug.yml`
- Create: `.github/ISSUE_TEMPLATE/feature.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`

- [ ] **Step 1: Create bug template**

```yaml
name: Bug Report
description: Something is broken in OVERHEAT
labels: ['bug']
body:
  - type: markdown
    attributes:
      value: |
        Before filing: check `docs/HANDOFF.md §3 Known Issues` — it may already be tracked.

  - type: textarea
    id: description
    attributes:
      label: What happened?
      description: Clear description of the bug.
    validations:
      required: true

  - type: textarea
    id: repro
    attributes:
      label: Steps to reproduce
      placeholder: |
        1. Start the game
        2. Drive into ore vein
        3. ...
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected behavior
    validations:
      required: true

  - type: dropdown
    id: area
    attributes:
      label: Affected area
      options:
        - Physics / Rapier
        - Audio engine
        - Player movement
        - Ore / grinding
        - Silo / economy
        - Tractor beam
        - Post-processing / visuals
        - Menus / overlays
        - Other
    validations:
      required: true

  - type: textarea
    id: console
    attributes:
      label: Browser console errors (if any)
      render: shell
```

- [ ] **Step 2: Create feature template**

```yaml
name: Feature Request
description: Propose a new feature or improvement
labels: ['enhancement']
body:
  - type: markdown
    attributes:
      value: |
        Check `docs/HANDOFF.md §2` and `docs/operations/roadmap.md` first — your idea may already be planned.

  - type: textarea
    id: problem
    attributes:
      label: What problem does this solve?
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Proposed solution
    validations:
      required: true

  - type: dropdown
    id: milestone
    attributes:
      label: Which milestone does this belong to?
      options:
        - M1 — Core Architecture
        - M2 — Core Loop Complete
        - M3 — Mobile + Capacitor
        - M4 — Visual & Audio Polish
        - M5 — Content & Progression
        - M6 — Telemetry & Balancing
        - Not sure
```

- [ ] **Step 3: Create config**

```yaml
blank_issues_enabled: false
contact_links:
  - name: HANDOFF.md — current known issues
    url: https://github.com/arcade-cabinet/overheat-titan-extract/blob/main/docs/HANDOFF.md
    about: Check here before filing — the issue may already be tracked.
```

- [ ] **Step 4: Commit**

```bash
git add .github/ISSUE_TEMPLATE/
git commit -m "chore(github): add bug and feature issue templates"
```

---

## Task 5: Create `.github/workflows/cd.yml` — GitHub Pages deploy

**Files:**
- Create: `.github/workflows/cd.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: CD

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    name: Deploy to GitHub Pages
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Checkout
        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd  # actions/checkout v6.0.2

      - name: Setup pnpm
        uses: pnpm/action-setup@fc06bc1257f339d1d5d8b3a19a8cae5388b55320  # pnpm/action-setup v5.0.0
        with:
          version: 10.33.0

      - name: Setup Node.js
        uses: actions/setup-node@53b83947a5a98c8d113130e565377fae1a50d02f  # actions/setup-node v6.3.0
        with:
          node-version: 24
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm run build

      - name: Setup Pages
        uses: actions/configure-pages@983d7736d9b0ae728b81ab479565c72886d7745  # actions/configure-pages v5.0.0

      - name: Upload artifact
        uses: actions/upload-pages-artifact@56afc609e74202658d3ffba0e8f6dda462b719fa  # actions/upload-pages-artifact v3.0.1
        with:
          path: dist/

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e  # actions/deploy-pages v4.0.5
```

**Note:** After creating this workflow, enable GitHub Pages in the repo settings: Settings → Pages → Source: GitHub Actions.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/cd.yml
git commit -m "ci: add CD workflow — GitHub Pages deploy on push to main"
```

---

## Task 6: Create release-please config

**Files:**
- Create: `release-please-config.json`
- Create: `.release-please-manifest.json`

- [ ] **Step 1: Create release-please config**

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "release-type": "simple",
  "bump-minor-pre-major": true,
  "bump-patch-for-minor-pre-major": true,
  "changelog-sections": [
    { "type": "feat", "section": "Features" },
    { "type": "fix", "section": "Bug Fixes" },
    { "type": "perf", "section": "Performance Improvements" },
    { "type": "docs", "section": "Documentation" },
    { "type": "chore", "section": "Miscellaneous", "hidden": true },
    { "type": "ci", "section": "CI/CD", "hidden": true }
  ]
}
```

- [ ] **Step 2: Create manifest**

```json
{
  ".": "1.0.0"
}
```

- [ ] **Step 3: Commit**

```bash
git add release-please-config.json .release-please-manifest.json
git commit -m "chore: add release-please config for automated changelog and releases"
```
