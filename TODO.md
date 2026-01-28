# Ligeon TODOs

## ChessGround Featuers

Read config documentation and figure out what we could reuse / add toggles for:
- https://github.com/lichess-org/chessground/blob/master/src/config.ts

## Game Replay / Navigation

- "View on Lichess" clicking should brings up mini-menu: Import to Lichess | Analyze Position (Opens FEN in browser)
- Replay speed - no more pop up menu. Have slider under navigation. Replay speed: 1s[    | ]30s

## Game Import

- Some game got imported as "? / ?" and only had the game result: 1/2-1/2 as the only "move." Track down this bug.
- Import date field values "?" as NULLs, and in game list item only display the values available i.e. only year, or only month year ("Jan 1959")

## Game Filtering 

- Minimize / show with lucide Filter icon button.
- Search by Name doesn't work...
- Search by Opening: ECO or Name from https://github.com/lichess-org/chess-openings
- Results game count: {x} games (of [{y max 100})

## Sideline Mode

Allow pieces clickable / draggable / moveable - but do not modify game pgn. Moving a piece enters a "sideline mode" where you can move pieces legally (play chess) - you can either exit that mode or view FEN on lichess.

## Style

- Add "light" theme and add theme picker (light/dark/system) (on control strip)
- Maybe revise entire app to use an OSS free widget library?

## Packaging

- Package game with sample-games pre-loaded
- Game import should default to resources/sample-games/ in dev mode, home directory when deployed
