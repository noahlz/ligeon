# Ligeon TODOs

## Sideline Mode / Analysis

### Features 

**PGN Export**
- Extend buildFullPgn to export sidelines as PGN variations
- Add tests for PGN export with sidelines
- Verify exported PGN opens correctly in Lichess

**Error Reporting**
- If user tries to create one more sideline but max reached, show toast error "Max sidelines reached (1 per 6 moves)"
- Any error that originates from a user action should have a toast in addition to a console log.

### Bugs

- When deleting a sideline:
  - If you are in the sideline, navigate to the move that was the branch point of the sideline.
  - If you are not in the sideline, just delete it and remain at the current move in the mainline.

## Code Quality

- Extract business logic out of React components.
- Make sure all errors and warnings are surfaced to the user as toasts
- Full code review / refactoring / delete unused code.

## Style / UI

- Add "light" theme and add theme picker (light/dark/system) (on control strip)

## Testing

- Improve coverage of React/Electron files.
- Coverage for UI components? 
- Exclude ShadCN copy/pasted components from coverage.

## Packaging

- Package game with sample-games pre-loaded
- Game import should default to resources/sample-games/ in dev mode, home directory when deployed
- CI/CD: release Mac/Win packages on tag push.
