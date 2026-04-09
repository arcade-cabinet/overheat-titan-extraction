# CLAUDE.md — OVERHEAT: Titan Extraction

> This file is the Claude agent entry point.  
> **All substantive instructions live in [`AGENTS.md`](./AGENTS.md).**  
> Read that file completely before reading any code or taking any action.

---

## Entry chain

```
CLAUDE.md  (you are here)
    └── AGENTS.md              ← master instructions, architecture, tech stack, rules
            ├── docs/HANDOFF.md    ← current implementation state + next steps
            └── docs/STANDARDS.md  ← code quality, brand, and design standards
```

## First actions for any Claude session

1. `cat AGENTS.md` — read all sections
2. `cat docs/HANDOFF.md` — understand exactly what is built and what is next
3. `cat docs/STANDARDS.md` — internalize non-negotiable rules
4. `npm install && npm run build` — confirm healthy tree
5. Only then begin work

## Claude-specific reminders

- This is a **browser WebGL game** — no Node.js runtime code.
- Physics is **@react-three/rapier only** — do not suggest Cannon.js alternatives.
- The Zustand store in `src/store.js` is the **single source of truth** — never bypass it.
- All procedural audio goes through `src/audio/AudioEngine.js` singleton.
- When in doubt about a design decision, consult `docs/STANDARDS.md §Color Palette` and `§Visual Design Rules`.
- Update `docs/HANDOFF.md` at the end of every session.
