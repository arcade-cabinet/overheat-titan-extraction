---
title: Delivery Roadmap
doc_type: operations
status: active
owner: engineering
last_updated: 2026-04-09
---

# Delivery Roadmap

This document maps OVERHEAT: Titan Extraction's production path to a store-ready mobile game. `HANDOFF.md` is the live status; this file groups work into stable milestone phases.

## Milestone overview

| Milestone | Focus | Goal |
|---|---|---|
| **M1** | Core Architecture | Koota ECS + Zod config + Rapier cleanup |
| **M2** | Core Loop Complete | Full heat/hopper/cube/silo/throw + onboarding |
| **M3** | Mobile / Capacitor | Touch controls + iOS/Android builds |
| **M4** | Visual / Audio Polish | Post-FX, cockpit art, audio mixing |
| **M5** | Content / Progression | Missions, upgrades, biome variety |
| **M6** | Telemetry / Balancing | Analytics, A/B tests, live config |

---

## M1 — Core Architecture

**Goal:** Replace magic numbers with Zod config, integrate Koota ECS for simulation state, and stabilize Rapier physics.

### Tasks
- [ ] Implement `src/config.json` with Zod schema validation at startup
- [ ] Replace all magic numbers in components with `gameConfig.*` references
- [ ] Integrate Koota ECS — set up `World`, `Heat`, `Hopper`, `MechStats`, `OreNode`, `Debris`, `Cube`, `Silo` traits
- [ ] Implement `HeatSystem`, `GrindingSystem`, `CubeEjectionSystem`, `EconomySystem` as Koota systems
- [ ] Bind Koota entities to R3F components via entity IDs in `useFrame`
- [ ] Stabilize Rapier physics — audit all collider types, remove any convex hulls
- [ ] Write `MovementSystem` — Koota `Input` trait → Rapier `setLinvel()`
- [ ] Set up `PersistenceSystem` — snapshot ECS state to Zustand persist on key events

---

## M2 — Core Loop Complete

**Goal:** The full extraction loop — mine, overheat, eject, throw, sell, upgrade — is physically complete and playable.

### Tasks
- [ ] Tractor beam — spring-joint anchor, reel-in, momentum-throw
- [ ] Ore health — ore mesh scales down as it depletes, debris spawns on destruction
- [ ] Sparks — 5–10 emissive box meshes on grind contact (Rapier dynamic, 1.5s TTL)
- [ ] Hit-stop — 50ms `useFrame` delta pause on first ore contact
- [ ] Rare isotopes — 15% spawn chance, magenta emissive, 3× heat/time multipliers, $2,500 cube value
- [ ] Onboarding missions 0–3 (staged introduction of mechanics)
- [ ] react-spring FOV dash transition + silo beam pulse
- [ ] Pause grayscale + tactical diagnostic visual pass
- [ ] Meltdown glitch / corruption shader pass
- [ ] Headlamp boot flicker sequence
- [ ] Report screen with recovered credits and mission summary

---

## M3 — Mobile / Capacitor

**Goal:** Touch-native, ships to iOS and Android.

### Tasks
- [x] Input Service — normalizes touch, gamepad, and keyboard into `InputState`
- [x] Virtual joystick overlay — dynamic origin, dead zones, left=move, right=look
- [x] Action buttons — GRIND (hold), TRACTOR (hold), DASH (tap)
- [x] Haptic feedback — overheat pulse, cube ejection pop, silo sell triple-tick
- [x] Silo aim assist — 15° magnetism during tractor throw
- [x] Capacitor shell — iOS and Android debug builds in CI
- [x] capacitor-sqlite + jeep-sqlite/OPFS persistence layer
- [x] Mobile performance budget — 60fps on iPhone 13 / mid-range Android 2023
- [x] Landscape lock + safe area insets

See `docs/design/mobile-controls.md` for the full control spec.

---

## M4 — Visual / Audio Polish

**Goal:** Every visual and audio moment feels deliberate. The cockpit is a finished piece of art.

### Tasks
- [ ] Final cockpit dashboard art pass — material detail, instrument bezels, LED strip lighting
- [ ] Spatial audio — silo hum (`THREE.PositionalAudio`), dash thruster volume mapped to velocity magnitude
- [ ] CRT scanlines + barrel distortion shader (toggleable via `settings.crtOverlays`)
- [ ] Ore shrink animation via react-spring — smooth depletion instead of toggle-off
- [ ] Ambient spore density and drift tuning
- [ ] AudioEngine mixing pass — dynamic ducking on alarm, proper envelope on all sounds
- [ ] Rare isotope visual distinction — larger glow radius, particle spawn on approach

---

## M5 — Content / Progression

**Goal:** Sessions have macro goals; players have reasons to return.

### Tasks
- [ ] Contracts / timed objectives (delivery quotas, thermal discipline, economy targets)
- [ ] Meta progression — permanent chassis upgrades, cosmetic cockpit skins
- [ ] Additional ore variety — new vein types with unique heat/value profiles
- [ ] Environmental variation — crater layout seeds, dust storm weather, eclipse lighting
- [ ] Economy tuning pass based on M6 telemetry (if M6 is available), otherwise paper estimates

---

## M6 — Telemetry / Balancing

**Goal:** Data-driven balancing. The Zod config becomes a live tuning surface.

### Tasks
- [ ] Event logging — first overheat time, first cube sold, session credits at meltdown, upgrade purchase rate
- [ ] A/B test infrastructure — variant configs validated by Zod, selected at session start
- [ ] Heat curve balance pass (informed by telemetry)
- [ ] Economy balance pass (upgrade cost vs session length)
- [ ] Session length target validation: core loop should feel complete in 5–10 minutes

---

## Documentation maintenance

| Trigger | Update |
|---|---|
| Feature implemented | `HANDOFF.md` — mark `[x]`, add session log |
| New pattern established | `STANDARDS.md` |
| Pivotal technical decision | `architecture/decisions.md` |
| New mechanic added | `gameplay/loop-and-progression.md` |
| Visual/audio change | `design/visual-audio-direction.md` |
| New doc file | `README.md` domain map |

## Workstreams

| Stream | Goal | Primary docs |
|---|---|---|
| Foundations | keep build healthy, preserve architecture constraints | `HANDOFF.md`, `STANDARDS.md` |
| Core mechanics | complete the physical extraction loop | `gameplay/loop-and-progression.md` |
| Runtime systems | Koota ECS, Zod config, tractor beam, pause/meltdown FX | `architecture/runtime-systems.md` |
| Experience polish | cockpit art, spatial audio, transitions | `design/visual-audio-direction.md` |
| Mobile | touch controls, Capacitor, persistence | `design/mobile-controls.md` |
| Fiction alignment | keep naming and UI voice coherent | `lore/world-primer.md` |
