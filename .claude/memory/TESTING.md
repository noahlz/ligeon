# Testing

## Running Tests

```bash
npm test                 # Run all tests (note; auto-rebuilds better-sqlite3)
npm run test:coverage    # Tests + coverage report (see vitest.coverage.excludes.ts for exclusions with comments)
```

Tests are in `__tests__/` — directory names are self-explanatory (`unit/`, `integration/`, `performance/`).

## SQLite Testing Patterns

No mocking — all DB tests use a real SQLite instance in a temp dir.

- **Integration tests**: `importFlow.test.ts` — canonical pattern for `importAndIndexPgn` + `GameDatabase`
- **Handler unit tests**: `gameHandlers.test.ts`, `annotationHandlers.test.ts` — call IPC handlers directly; pass `tmpDir` as `basePath`; seed FK dependencies via `db.insertGame()` first
- **Teardown**: `db.close()` for direct `GameDatabase` use; `DatabaseManager.closeCollection(id, tmpDir)` when tests invoke handlers