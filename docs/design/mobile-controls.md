---
title: Mobile Controls Design
doc_type: design
status: draft
owner: design
last_updated: 2026-04-09
---

# Mobile Controls Design

OVERHEAT: Titan Extraction targets mobile (iOS/Android) via Capacitor (M3). This document defines the mobile control scheme, input abstraction layer, and UX principles for touch play.

## Target: M3 milestone

Mobile controls are scheduled for **M3 — Mobile Controls & Capacitor**. This document captures the design intent so that M3 implementation has a clear spec.

## Input abstraction layer

The game uses an **Input Service** that normalizes all input sources and produces abstracted intents consumed by the Koota `InputSystem`:

```ts
type InputState = {
  move: { x: number; y: number }   // normalized -1 to 1
  look: { x: number; y: number }   // normalized -1 to 1
  grind: boolean
  dash: boolean
  tractor: boolean
}
```

Source adapters:
- **Touch**: virtual joysticks + button overlays
- **Gamepad**: standard gamepad API mapping
- **Keyboard/mouse**: existing WASD + pointer-lock (desktop/web)

The `InputSystem` consumes `InputState` and updates the `Input` trait on the mech entity. R3F components never read raw input directly.

## Virtual joystick layout (landscape)

```
┌─────────────────────────────────────────────────────────┐
│                   [⏸ PAUSE]                             │
│                                                         │
│                  [ 3D COCKPIT VIEW ]                    │
│                                                         │
│  [LEFT STICK]                        [GRIND] [TRACTOR]  │
│   Movement                  [LOOK]           [DASH]     │
│  (forward/back/strafe)   (camera/aim)                   │
└─────────────────────────────────────────────────────────┘
```

### Left thumb: movement joystick
- Controls: forward/back/strafe (XZ plane movement)
- **Dynamic origin**: joystick anchor spawns where the thumb first touches (not fixed position)
- **Dead zone**: 0.15 normalized — avoids accidental drift

### Right thumb: look joystick
- Controls: camera pitch and yaw
- **Dynamic origin**: same dynamic touch-origin behavior
- **Dead zone**: 0.15 normalized

### Action buttons (right side)
| Button | Interaction | Action |
|--------|-------------|--------|
| GRIND | Hold | Engages the saw (proximity activates heat gain) |
| TRACTOR | Hold | Activates tractor beam for grabbing/throwing cubes |
| DASH | Tap | Short thruster burst — 3× speed, FOV zoom, short cooldown |

### Top center
- Minimal **PAUSE** button — tiny, out of the way during play

## UX principles

### Dynamic joystick origin
Players don't need to place thumbs on a fixed circle. The joystick spawns under whatever touch starts on the left/right half of the screen. This reduces muscle memory requirements and works across phone sizes.

### Dead zones
- Movement: 0.15 — prevents slow drift from resting thumbs
- Look: 0.15 — prevents camera wobble when stationary

### Haptic feedback events
| Game event | Haptic pattern |
|------------|----------------|
| Overheat lockout | Heavy pulse (3 × 200ms) |
| Cube ejected | Medium pop (1 × 80ms) |
| Cube sold in silo | Satisfying triple tick (3 × 30ms, 50ms apart) |
| Meltdown | Continuous heavy rumble → fade out |

### Aim assist (silo magnetism)
When a cube's trajectory is within 15° of the silo beam, apply gentle magnetism (lerp toward silo center). This compensates for the precision loss of flick-throwing on a touch screen. The magnetism is applied in world space by the tractor-throw physics integration — invisible to the player.

## Mobile performance targets

| Metric | Target |
|--------|--------|
| Render FPS | 60fps on iPhone 13 / mid-range Android 2023 |
| Physics FPS | 60fps (Rapier deterministic step) |
| Input latency | < 16ms (one frame) |
| Touch sampling | Minimum 60Hz (native iOS/Android guaranteed) |

## Accessibility

- Font size on dashboard canvas: scaled for device DPI (`window.devicePixelRatio`)
- All action buttons reachable in landscape with normal thumb reach
- Pause always accessible with one tap
- No time-critical menus that require precision tapping

## Implementation notes (for M3)

See `docs/architecture/decisions.md §ADR-004` for the Capacitor + SQLite persistence decision.

The touch input layer should be built as an **HTML overlay** (not inside the R3F canvas) using absolute-positioned React elements with `touch-action: none`. Touch events are converted to `InputState` and passed to the Koota `InputSystem` each frame.

Virtual joystick library candidates:
- Build custom with `useRef` + `onTouchStart/Move/End` — keeps bundle small
- `nipplejs` — well-tested, small, framework-agnostic

Do NOT use any library that writes to DOM outside the React tree.
