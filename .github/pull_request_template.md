## PR checklist

> See `AGENTS.md` for full context, `docs/README.md` for the documentation map, and `docs/STANDARDS.md` for all standards.

### Before opening a PR

- [ ] `pnpm run build` passes with zero errors
- [ ] No `node_modules/`, `dist/`, or `.env` files committed
- [ ] `docs/HANDOFF.md` updated to reflect what this PR completes
- [ ] `docs/README.md` updated if new docs were added or reorganized
- [ ] New components follow naming conventions in `docs/STANDARDS.md`
- [ ] No new state management added outside `src/store.js`
- [ ] No Cannon.js, no React Context for game loop
- [ ] All audio routed through `src/audio/AudioEngine.js`
- [ ] All in-game UI is 3D (CanvasTexture or `@react-three/drei` `<Html>`) — no raw DOM overlays for HUD

### Describe your changes

**What was implemented:**

**Relevant HANDOFF.md items completed:**
- [ ] (list items by section number)

**Known issues / deferred work:**
