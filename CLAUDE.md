# Ligeon

Electron desktop app for viewing chess games. Board UI powered by Lichess Chessground.

> **NOTE: This project is pre-release!**
> - If you change code, don't worry about making it "backwards-compatable"
> - No data migrations. Users will delete and re-import game collections.
> - When in doubt: "Move fast and break things."

## After Changes

1. Use MCP `getDiagnostics` tool to check for issues with edited files.
2. Run `npm run check > .logs/check.log 2>&1 && echo "✓ Tests passed." || echo "✗ Tests failed";`
3. Inspect the log only if it fails (exit code != 0).

## Reference Files

Load these files as needed based on your current task:

Load `.claude/memory/TESTING.md` when:
- Writing or modifying tests
- Investigating test failures

Load `.claude/memory/ARCHITECTURE.md` when:
- Exploring or searching the codebase — ALWAYS consult the project diagram first, narrow exploration accordingly
- Planning or implementing a major refactor or new feature
- Working with `src/shared/` or cross-target imports

Load `.claude/memory/SCHEMA.md` when:
- Adding or modifying database tables, columns, or data models
- Working with game, variation, comment, or annotation data structures
- Debugging data persistence or storage logic

Load `.claude/memory/UX.md` when:
- Changing layout, colors, or Tailwind tokens
- Adding a shadcn/ui component
- Fixing a popover, overlay, or Radix UI bug
- Configuring Chessground board display

Load `.claude/memory/REACT.md` when:
- Adding or modifying renderer components or hooks
- Using or debugging the `@/` import alias
- Fixing React UI behavior bugs

Load `.claude/memory/IPC.md` when:
- Adding or modifying IPC handlers or the preload bridge
- Calling `window.electron.*` from the renderer
- Debugging renderer-to-main communication

Load `.claude/memory/BUILD.md` when:
- Debugging TypeScript or compile errors
- Fixing import errors or module resolution failures
- Rebuilding or troubleshooting `better-sqlite3` native bindings

## Reference Links

- [chessground config](https://raw.githubusercontent.com/lichess-org/chessground/refs/heads/master/src/config.ts) — full display options reference
