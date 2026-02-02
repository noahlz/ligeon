# Ligeon TODOs

## Game Import / Browsing

- If game collection is trucacted, reflect that in the count text.
- After importing a collection, immediately select that game collection.
- Display game code and name in the game card (overflow with ...).
- Support filtering by multiple game codes. Game code filtering is a combo list (supporting progressive search and browsing drop-down list).

## Style

- Refactor app to use [HeadlessUI](https://headlessui.com/) for components.
  - Plan file: ~/.claude/plans/ligeon-headlessui-refactor.md
- Add "light" theme and add theme picker (light/dark/system) (on control strip)

## Game Replay / Navigation

- "View on Lichess" clicking should brings up mini-menu: Import to Lichess | Analyze Position (Opens FEN in browser)
- Replay speed - no more pop up menu. Have slider under navigation. Replay speed: 1s[    | ]30s

## Sideline Mode / Analysis

- Allow pieces clickable / draggable / moveable - but do not modify game pgn. Moving a piece enters a "sideline mode" where you can move pieces legally (play chess) - you can either exit that mode or view FEN on lichess.

## Testing

- Improve coverage of React/Electron files.

## Packaging

- Package game with sample-games pre-loaded
- Game import should default to resources/sample-games/ in dev mode, home directory when deployed
- CI/CD: release Mac/Win packages on tag push.
