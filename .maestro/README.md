# Maestro E2E Flows

E2E tests for OVERHEAT: Titan Extraction on Android/iOS.

## Running

```bash
# Requires Maestro CLI: https://maestro.mobile.dev/
maestro test .maestro/flows/smoke.yaml
maestro test .maestro/flows/test-boot-to-menu.yaml
maestro test .maestro/flows/test-full-game-flow.yaml
maestro test .maestro/flows/test-meltdown.yaml
```

## Flow inventory

- `smoke.yaml` — Quick sanity check: boot screen visible, tap to menu
- `test-boot-to-menu.yaml` — Full boot sequence with timing
- `test-full-game-flow.yaml` — Boot → menu → gameplay → pause → settings → abort
- `test-meltdown.yaml` — Meltdown sequence with JS state injection

## Screenshots

Each flow produces timestamped PNG screenshots in the Maestro output directory
(default `~/.maestro/tests/<run-id>/`).
