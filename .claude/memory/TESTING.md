# Testing

## Running Tests

```bash
npm test                 # Run all tests (note; auto-rebuilds better-sqlite3)
npm run test:coverage    # Tests + coverage report (see vitest.coverage.excludes.ts for exclusions with comments)
```

Tests are in `__tests__/` — directory names are self-explanatory (`unit/`, `integration/`, `performance/`).