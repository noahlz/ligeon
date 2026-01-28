# Ligeon TODOs

## Game Filtering 

- Search by Name doesn't work...
- Results game count: {x} games (of [{y max 100})
- Search by Opening: ECO or Name from https://github.com/lichess-org/chess-openings

## Game Replay / Navigation

- BUG: only white king is ever in check. see ~/Screenshots/check-bug.png
- "View on Lichess" clicking should brings up mini-menu: Import to Lichess | Analyze Position (Opens FEN in browser)
- Replay speed - no more pop up menu. Have slider under navigation. Replay speed: 1s[    | ]30s

## Game Import

- Some game got imported as "? / ?" and only had the game result: 1/2-1/2 as the only "move." Track down this bug.
- Import date field values "?" as NULLs, and in game list item only display the values available i.e. only year, or only month year ("Jan 1959")

## Settings

- Allow configuring location of game data (other than ~/.ligeon/collections)
  - Also we need to support Windows location (aka standard App Data location)

## Sideline Mode

Allow pieces clickable / draggable / moveable - but do not modify game pgn. Moving a piece enters a "sideline mode" where you can move pieces legally (play chess) - you can either exit that mode or view FEN on lichess.

## Style

- Refactor app to use [HeadlessUI](https://headlessui.com/) for components.
  - Plan file: ~/.claude/plans/ligeon-headlessui-refactor.md
- Add "light" theme and add theme picker (light/dark/system) (on control strip)

## Misc

- Introduce logging library winston and log to both console and file.
- Get code coverage working.

## Packaging

- Package game with sample-games pre-loaded
- Game import should default to resources/sample-games/ in dev mode, home directory when deployed
