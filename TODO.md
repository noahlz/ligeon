# Ligeon TODOs

## Chess Manager

- Revise chessManager to use chessops for interpreting PGN content (instead of bespoke code)

## Style / UI

- Upgrade to Tailwind 4
- Refactor app to use [HeadlessUI](https://headlessui.com/) for components.
  - Plan file: ~/.claude/plans/ligeon-headlessui-refactor.md
- Add "light" theme and add theme picker (light/dark/system) (on control strip)

## Game Replay / Navigation

- "View on Lichess" clicking should brings up mini-menu: Import to Lichess | Analyze Position (Opens FEN in browser)
- Replay:
  - No more pop up menu for speed. Put slider under navigation. Replay speed: 1s[    | ]30s
  - Allow changing replay speed during play
  - Any manual navigation stops "play"

## Sideline Mode / Analysis

- Allow pieces clickable / draggable / moveable - but do not modify game pgn. Moving a piece enters a "sideline mode" where you can move pieces legally (play chess) - you can either exit that mode or view FEN on lichess.

## Testing

- Improve coverage of React/Electron files.

## Packaging

- Package game with sample-games pre-loaded
- Game import should default to resources/sample-games/ in dev mode, home directory when deployed
- CI/CD: release Mac/Win packages on tag push.
