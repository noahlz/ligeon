# Testing

## SQLite Testing Patterns

No mocking — all DB tests use a real SQLite instance in a temp dir.

- **Integration tests**: `importFlow.test.ts` — canonical pattern for `importAndIndexPgn` + `GameDatabase`
- **Handler unit tests**: `gameHandlers.test.ts`, `annotationHandlers.test.ts` — call IPC handlers directly; pass `tmpDir` as `basePath`; seed FK dependencies via `db.insertGame()` first
- **Teardown**: `db.close()` for direct `GameDatabase` use; `DatabaseManager.closeCollection(id, tmpDir)` when tests invoke handlers

## Handler Sync/Async: Check Before Writing

Many IPC handlers are synchronous despite using DB. Check signature first.
- Sync throws: `expect(() => fn()).toThrow()`
- Async rejects: `await expect(fn()).rejects.toThrow()`

## Assertion Strength

Prefer exact values — `toBeGreaterThan(0)` / `toBeTruthy()` pass even when functionality is broken.
- Assert exact game counts for known PGN fixtures in `resources/`
- Assert exact strings for ECO/opening lookups — check `openings.json` for the value
- After delete: re-fetch and assert the item is gone (don't rely on return value alone)