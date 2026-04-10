# Changelog

All notable changes to OVERHEAT: Titan Extraction are documented here.

Format: [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/).
Versioning: [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

## [1.0.0] — 2026-04-09

### Features

- Scaffold and implement core OVERHEAT: Titan Extraction game loop — React Three Fiber cockpit,
  Rapier physics, Zustand store, heat management, ore extraction, meltdown sequence, and report
  screen ([`1109bd0`](https://github.com/arcade-cabinet/overheat-titan-extract/commit/1109bd0))
- Wire `lookSensitivity` setting to mouse movement in Player
  ([`0e1f433`](https://github.com/arcade-cabinet/overheat-titan-extract/commit/0e1f433))

### Documentation

- Add documentation infrastructure: `AGENTS.md`, `CLAUDE.md`, `copilot-instructions.md`,
  `HANDOFF.md`, `STANDARDS.md`
  ([`58b4da0`](https://github.com/arcade-cabinet/overheat-titan-extract/commit/58b4da0))
- Expand docs into domain-organized documentation map — architecture, gameplay, design, lore,
  operations ([`be652d4`](https://github.com/arcade-cabinet/overheat-titan-extract/commit/be652d4))
- Add `.cursor/` agent config — MDC rules for architecture, coding standards, no-go list, docs
  authoring ([`cae87fa`](https://github.com/arcade-cabinet/overheat-titan-extract/commit/cae87fa))

### Build System

- Migrate to pnpm, add Biome 2.4.11, create CI workflow with pinned SHA actions
  ([`b39bda5`](https://github.com/arcade-cabinet/overheat-titan-extract/commit/b39bda5))

### Bug Fixes

- Address code review feedback: stable key IDs for ores, CI permissions, Zustand stable dep cleanup
  ([`903e8c6`](https://github.com/arcade-cabinet/overheat-titan-extract/commit/903e8c6))
- Address PR review thread fixes and polish
  ([`9037c74`](https://github.com/arcade-cabinet/overheat-titan-extract/commit/9037c74),
  [`2f5fe8a`](https://github.com/arcade-cabinet/overheat-titan-extract/commit/2f5fe8a))

---

[Unreleased]: https://github.com/arcade-cabinet/overheat-titan-extract/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/arcade-cabinet/overheat-titan-extract/releases/tag/v1.0.0
