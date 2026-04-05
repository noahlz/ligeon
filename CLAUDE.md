# Ligeon

Electron desktop app for viewing chess games. Board UI powered by Lichess Chessground.

> **Beta Release:** No backward compatibility, no data migrations. Move fast and break things.

## After Changes

1. `getDiagnostics` on edited files.
2. `npm run check > .logs/check.log 2>&1 && echo "✓ Tests passed." || echo "✗ Tests failed";`
3. Inspect log only on failure.

## Reference Files

All paths under `.claude/references/`. Non-obvious knowledge only — workarounds, gotchas, design constraints.

| File | Load when |
|------|-----------|
| `TESTING.md` | Writing/modifying tests, investigating test failures |
| `ARCHITECTURE.md` | Major refactors, new features, state/factory/IPC design questions |
| `SCHEMA.md` | DB schema changes, game/variation/annotation data, persistence bugs |
| `UX.md` | Layout, colors, Tailwind, shadcn components, Radix bugs, Chessground display |
| `IPC.md` | IPC handlers, preload bridge, `window.electron.*`, renderer-main debugging |
| `BUILD.md` | TS/compile errors, import failures, `better-sqlite3` rebuild |

After major changes, review and update the relevant reference file.

## Reference Links

- [chessground config](https://raw.githubusercontent.com/lichess-org/chessground/refs/heads/master/src/config.ts) — full display options reference