# Copilot Instructions — OVERHEAT: Titan Extraction

> This file is the GitHub Copilot / Copilot Coding Agent entry point.  
> **All substantive instructions live in [`AGENTS.md`](../AGENTS.md).**  
> Read that file completely before reading any code or taking any action.

---

## Entry chain

```
.github/copilot-instructions.md  (you are here)
    └── AGENTS.md                     ← master instructions, architecture, tech stack, rules
            ├── docs/README.md            ← documentation index by domain
            ├── docs/HANDOFF.md           ← current implementation state + next steps
            ├── docs/STANDARDS.md         ← code quality, brand, and design standards
            └── docs/AGENTS.md            ← documentation-specific guidance
```

## First actions for any Copilot session

1. Read `AGENTS.md` completely — architecture, tech stack, state machine, physics rules, audio contract.
2. Read `docs/README.md` — understand the documentation set by domain.
3. Read `docs/HANDOFF.md` — understand what is built (`[x]`) and what is next (`[ ]`).
4. Read `docs/STANDARDS.md` — color palette, component patterns, shader rules, no-go list.
5. If touching docs, read `docs/AGENTS.md`.
6. Run `pnpm install && pnpm run build` — confirm the tree is healthy before touching anything.
7. Only then implement the next items from `docs/HANDOFF.md`.

## Copilot-specific behaviour

- **Modular files only** — each component in its own file under `src/components/`.
- **useMemo for all procedural geometries** — prevents WebGL memory leaks on re-render.
- **No new dependencies** without checking `docs/STANDARDS.md §Approved libraries`.
- **Physics colliders** — use simple types (Cuboid, Ball, Heightfield). Never convex hull on large meshes.
- **UI overlays** — only `@react-three/drei`'s `<Html>` component, never plain `document.createElement` injected outside React tree.
- Update `docs/HANDOFF.md` and commit before ending the session.

## PR checklist

See `.github/pull_request_template.md`.
