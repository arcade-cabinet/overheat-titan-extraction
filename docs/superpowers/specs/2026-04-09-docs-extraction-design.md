---
title: Docs Extraction + Agent Orchestration Design
doc_type: spec
status: approved
owner: engineering
created: 2026-04-09
---

# Design: Complete Docs Extraction + Agent Orchestration

## Goal

Transform the existing documentation set from a partial extraction of `docs/references/strategy_sessions.md` into a complete, canonical, agent-enforced source of truth — and simultaneously bring the repo's agent infrastructure (`.claude/`, `.cursor/`, `.github/`) up to gold-standard level.

## Canonical architecture decision (Option B, user-approved)

Koota ECS + Zod-validated JSON config is the **canonical production architecture**. Zustand is the **current implementation**. All docs are written toward the Koota/Zod target. Where Zustand is the current reality, it is documented as the interim state with explicit migration path.

---

## Workstream 1: Docs Extraction

### What's missing from current docs vs strategy sessions

| Gap | Target doc |
|---|---|
| Koota ECS + Zod config as canonical architecture | `architecture/overview.md`, new `architecture/decisions.md` |
| Design bible: fontography, cockpit layout, UI principles | `design/visual-audio-direction.md` |
| Mobile-first controls: dual joysticks, haptics, dead zones | new `design/mobile-controls.md` |
| Onboarding missions 0–3 | `gameplay/loop-and-progression.md` |
| Rare isotopes as full mechanic (spawn %, heat, value) | `gameplay/loop-and-progression.md` |
| M1–M6 milestone roadmap | `operations/roadmap.md` |
| Audio mixing: ducking, priority hierarchy, soundscape layers | `design/visual-audio-direction.md` |
| Architecture decisions: Koota/Zod, react-spring, Capacitor, ADRs | new `architecture/decisions.md` |
| Zod config schema and tunables system | `architecture/runtime-systems.md` |
| Capacitor mobile shell target | `operations/roadmap.md`, `architecture/overview.md` |
| Contracts/missions as metagame layer | `gameplay/loop-and-progression.md` |
| Paper playtesting friction points | `gameplay/loop-and-progression.md` or new `gameplay/playtesting-notes.md` |
| react-spring for 3D transitions (framer-motion-3d deprecated) | `architecture/runtime-systems.md`, `docs/STANDARDS.md` |

### Files to create

- `docs/architecture/decisions.md` — ADR collection: Cannon→Rapier, tune.js→Web Audio, Zustand→Koota (planned), framer-3d→react-spring, diegetic UI, Capacitor shell
- `docs/design/mobile-controls.md` — dual joystick spec, haptics, dead zones, input abstraction layer
- `docs/gameplay/playtesting-notes.md` — paper playtesting analysis, friction points, economy opacity

### Files to update substantially

- `docs/architecture/overview.md` — add Koota ECS as canonical state layer, Capacitor shell, Zod config
- `docs/architecture/runtime-systems.md` — add Zod tunables system, react-spring note, Koota/R3F binding pattern
- `docs/gameplay/loop-and-progression.md` — add rare isotopes mechanic, onboarding missions 0–3, contracts/missions layer, playtesting friction
- `docs/design/visual-audio-direction.md` — add full fontography spec, cockpit layout, UI principles, audio mixing strategy, motion/game feel with react-spring
- `docs/operations/roadmap.md` — replace vague workstreams with M1–M6 milestone structure
- `AGENTS.md` — update §3 tech stack (add Koota + Zod as canonical, Zustand as interim), §11 handoff notes, add Capacitor reference
- `docs/STANDARDS.md` — update §6 state management (Koota canonical path), add §14 Zod config rules, add §15 mobile/Capacitor section
- `CHANGELOG.md` — create from scratch using git log

---

## Workstream 2: `.claude/` Setup

Mirror objexiv gold standard:

```
.claude/
├── settings.json          — hook wiring (PostToolUse biome-check, PreToolUse block-env-edit, PreCompact flush)
├── hooks/
│   ├── biome-check.sh     — auto-lint .jsx/.js after Edit/Write
│   └── block-env-edit.sh  — block edits to .env files
├── rules/
│   ├── README.md
│   ├── 01-nothing-out-of-scope.md
│   ├── 02-operating-discipline.md
│   └── 03-avoid-github-mcp.md
└── agents/                — empty dir for future specialist agents
```

- `settings.json` wires hooks to correct tool matchers
- Rules are game-project-specific (reference Rapier, Zustand→Koota, browser WebGL context)
- `biome-check.sh` adapted for this project's `pnpm check` command

---

## Workstream 3: `.cursor/` Setup

Research and implement Cursor's agent configuration:

- `.cursor/rules/` — MDC format rules files (equivalent to `.claude/rules/`)
  - `game-architecture.mdc` — R3F, Rapier, Koota, no Cannon.js
  - `coding-standards.mdc` — component structure, useFrame rules, useMemo for geometry
  - `no-go-list.mdc` — forbidden patterns (React Context for game loop, DOM overlays, etc.)
- `.cursor/mcp.json` — MCP server config (if applicable for Cursor)
- Research: Cursor agent mode, background agents, `.cursorrules` vs `.cursor/rules/`, proper MDC frontmatter

---

## Workstream 4: `.github/` Copilot + CI/CD Expansion

### Copilot

- Expand `.github/copilot-instructions.md` — currently just defers to AGENTS.md; add:
  - Copilot Workspace context section
  - Copilot coding agent operating rules
  - Key architectural rules inline (not just a redirect)
- Research `.github/copilot/` — newer Copilot agent YAML config format
- Research GitHub Models integration
- Add `.github/prompts/` — reusable Copilot prompt files for common tasks

### CI/CD + Governance

- `.github/dependabot.yml` — npm ecosystem, weekly schedule
- `.github/ISSUE_TEMPLATE/bug.yml` and `feature.yml`
- `.github/workflows/cd.yml` — GitHub Pages deploy on push to main
- `release-please-config.json` + `.release-please-manifest.json`
- `CHANGELOG.md` — generate from git history

---

## Success criteria

1. Any agent starting fresh from this repo can understand the complete game design (including Koota/Zod production target) without reading `strategy_sessions.md`.
2. `.claude/hooks/` auto-lints every edited JSX/JS file.
3. `.claude/rules/` encodes the three standing operating rules.
4. `.cursor/rules/` gives Cursor agents the same architectural guard rails.
5. `.github/copilot-instructions.md` is self-contained enough to function without a redirect.
6. `CHANGELOG.md` exists and covers full project history.
7. `dependabot.yml` covers npm + github-actions ecosystems.

---

## Execution: parallel subagents

All four workstreams are independent and can run in parallel.
Implementation plan (from writing-plans skill) will sequence steps within each workstream.
