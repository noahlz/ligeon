# Ligeon TODOs

## PGN Import/Export
- Support parsing game annotations, variations and comments (i.e. ! good move) in parsing
- Extend buildFullPgn to export game to PGN with all variations
- Add tests for PGN export with variations 
- Verify exported PGN opens correctly in Lichess

## Error Reporting
- Any error or warning that originates from a user action should have a toast in addition to a console log.

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
