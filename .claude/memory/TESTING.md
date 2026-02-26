# Testing

## SQLite Testing Patterns

No mocking — all DB tests use a real SQLite instance in a temp dir.

- **Integration tests**: `importFlow.test.ts` — canonical pattern for `importAndIndexPgn` + `GameDatabase`
- **Handler unit tests**: `gameHandlers.test.ts`, `annotationHandlers.test.ts` — call IPC handlers directly; pass `tmpDir` as `basePath`; seed FK dependencies via `db.insertGame()` first
- **Teardown**: `db.close()` for direct `GameDatabase` use; `DatabaseManager.closeCollection(id, tmpDir)` when tests invoke handlers
