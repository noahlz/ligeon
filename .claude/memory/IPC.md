# IPC

## Flow

```
renderer → window.electron.fn() → preload (CJS bridge) → src/main/ipc/ handler → SQLite
```

- Preload is CJS — Electron sandbox forbids ESM in preload
- SQLite is unavailable in the renderer — all DB access must go through IPC
- Validate all IPC handler inputs. See `src/main/ipc/validators.ts` for patterns.
