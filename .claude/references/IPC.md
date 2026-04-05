# IPC

## ICP Call Flow

```
renderer → window.electron.fn() → preload (CJS bridge) → src/main/ipc/ handler → SQLite
```

## Validation

Validate all IPC handler inputs. See `src/main/ipc/validators.ts` for patterns.

## IPC Gotchas

- Preload is CJS — see BUILD.md for details
