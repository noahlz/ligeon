# Ligeon TODOs

## Game Info / Move List

- Be able to mimimize game info box.
  - When minized, just show "{Player} vs. {Player} with overflow as "..."
  - Use lucide: square-plus and square-minus

## Game Replay / Navigation

- Sound on/off button.
- Mouse scroll should move forward/back like Lichess
- "View on Lichess" clicking should brings up mini-menu: Import to Lichess | Analyze Position (Opens FEN in browser)
- Replay speed - no more pop up menu. Have slider to right of navigation. Replay speed: 1s[    | ]30s

## Style

- Add "light" theme and add theme picker (light/dark/system)

## Game Search

- Hide filtering under Filter icon
- Search by Name doesn't work...
- Search by Opening: ECO or Name from https://github.com/lichess-org/chess-openings
- Results game count: {x} games (of [{y max 100})

## Game Import / Picker

- If no name specified, use the file name (minus .pgn) NOT "Untitled"
- Add delete button next to list button in game picker (can't delete loaded game)
- Picker should default to resources/sample-games/ in dev mode, home directory when deployed
- Package game with sample-games pre-loaded
- Some game got imported as "? / ?" and only had the game result: 1/2-1/2 as the only "move." Track down this bug.
