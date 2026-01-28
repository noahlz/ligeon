# Ligeon TODOs

# Priority

- Introduce logging library winston and log to both console and file.
- BUG: only white king is ever in check. see ~/Screenshots/check-bug.png
- Filter Games doesn't (by name or otherwise)

## Game Filtering 

- Results game count: {x} games (of [{y max 100})
- Search by Opening: ECO or Name from https://github.com/lichess-org/chess-openings

## Game Import

- Some game got imported as "? / ?" and only had the game result: 1/2-1/2 as the only "move." Track down this bug.
- Import date field values "?" as NULLs, and in game list item only display the values available i.e. only year, or only month year ("Jan 1959")

## Game Replay / Navigation

- "View on Lichess" clicking should brings up mini-menu: Import to Lichess | Analyze Position (Opens FEN in browser)
- Replay speed - no more pop up menu. Have slider under navigation. Replay speed: 1s[    | ]30s

## Style

- Refactor app to use [HeadlessUI](https://headlessui.com/) for components.
  - Plan file: ~/.claude/plans/ligeon-headlessui-refactor.md
- Add "light" theme and add theme picker (light/dark/system) (on control strip)

## Sideline Mode

Allow pieces clickable / draggable / moveable - but do not modify game pgn. Moving a piece enters a "sideline mode" where you can move pieces legally (play chess) - you can either exit that mode or view FEN on lichess.


## Testing

- Improve coverage of React/Electron files.

## Packaging

- Package game with sample-games pre-loaded
- Game import should default to resources/sample-games/ in dev mode, home directory when deployed
- CI/CD: release Mac/Win packages on tag push.
