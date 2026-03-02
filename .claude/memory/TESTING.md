# Testing

## SQLite Testing Patterns

No mocking — all DB tests use a real SQLite instance in a temp dir.

- **Integration tests**: `importFlow.test.ts` — canonical pattern for `importAndIndexPgn` + `GameDatabase`
- **Handler unit tests**: `gameHandlers.test.ts`, `annotationHandlers.test.ts` — call IPC handlers directly; pass `tmpDir` as `basePath`; seed FK dependencies via `db.insertGame()` first
- **Teardown**: `db.close()` for direct `GameDatabase` use; `DatabaseManager.closeCollection(id, tmpDir)` when tests invoke handlers

## Handler Sync/Async: Check Before Writing

Many IPC handlers are **synchronous** (not async), even those that use DB. Check the function signature first.
- Sync throws: `expect(() => fn()).toThrow()`
- Async rejects: `await expect(fn()).rejects.toThrow()`

## Assertion Strength

Prefer exact values. `toBeGreaterThan(0)` / `toBeTruthy()` pass even when functionality is broken.
- Assert exact game counts for known PGN fixtures in `resources/`
- Assert exact strings for ECO/opening lookups — check `openings.json` for the value
- After delete: re-fetch and assert the item is gone (don't rely on return value alone)

## Shared Helpers

- `__tests__/helpers/dbTestSetup.ts` — `createTestDb(id)` / `teardownTestDb(id, dir)` for DB setup/teardown
- Use factory functions at module scope (`makeGameData()`, `makeGame()`) rather than repeating literals
- Use `beforeAll` (not `beforeEach`) for expensive operations like large PGN imports — share the result

## Model Test Files

- `chessHelpers.test.ts` — pure functions: named constants, no magic values
- `externalLinks.test.ts` — factory helpers at module scope
- `annotationHandlers.test.ts` — CRUD lifecycle with cross-verification
- `nag.test.ts` — references production constants so new values break the test automatically
