import { describe, test, expect } from 'vitest'
import {
  createChessManager,
  isGameResult,
  getResultDisplay,
  type ChessManager,
} from '../../src/utils/chessManager.js'

describe('chessManager', () => {
  describe('isGameResult', () => {
    test('identifies valid game results', () => {
      expect(isGameResult('1-0')).toBe(true)
      expect(isGameResult('0-1')).toBe(true)
      expect(isGameResult('1/2-1/2')).toBe(true)
      expect(isGameResult('*')).toBe(true)
    })

    test('rejects invalid strings', () => {
      expect(isGameResult('e4')).toBe(false)
      expect(isGameResult('Nf3')).toBe(false)
      expect(isGameResult('1-1')).toBe(false)
      expect(isGameResult('')).toBe(false)
      expect(isGameResult('draw')).toBe(false)
    })
  })

  describe('getResultDisplay', () => {
    test('formats white win', () => {
      expect(getResultDisplay('1-0')).toBe('1-0 (White Wins)')
    })

    test('formats black win', () => {
      expect(getResultDisplay('0-1')).toBe('0-1 (Black Wins)')
    })

    test('formats draw', () => {
      expect(getResultDisplay('1/2-1/2')).toBe('1/2-1/2 (Draw)')
    })

    test('formats unfinished game', () => {
      expect(getResultDisplay('*')).toBe('* (Unfinished)')
    })

    test('returns unknown results as-is', () => {
      expect(getResultDisplay('unknown')).toBe('unknown')
      expect(getResultDisplay('1-1')).toBe('1-1')
    })
  })

  describe('createChessManager', () => {
    describe('basic navigation', () => {
      let manager: ChessManager

      test('creates manager for empty game', () => {
        manager = createChessManager('')
        expect(manager.getCurrentPly()).toBe(0)
        expect(manager.getTotalPlies()).toBe(0)
        expect(manager.getFen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
      })

      test('creates manager for simple game', () => {
        manager = createChessManager('1. e4 e5')
        expect(manager.getTotalPlies()).toBe(2)
        expect(manager.getCurrentPly()).toBe(0)
      })

      test('navigates to next move', () => {
        manager = createChessManager('1. e4 e5')
        expect(manager.next()).toBe(true)
        expect(manager.getCurrentPly()).toBe(1)
        expect(manager.next()).toBe(true)
        expect(manager.getCurrentPly()).toBe(2)
      })

      test('returns false when at end', () => {
        manager = createChessManager('1. e4 e5')
        manager.last()
        expect(manager.next()).toBe(false)
        expect(manager.getCurrentPly()).toBe(2)
      })

      test('navigates to previous move', () => {
        manager = createChessManager('1. e4 e5')
        manager.last()
        expect(manager.prev()).toBe(true)
        expect(manager.getCurrentPly()).toBe(1)
        expect(manager.prev()).toBe(true)
        expect(manager.getCurrentPly()).toBe(0)
      })

      test('returns false when at beginning', () => {
        manager = createChessManager('1. e4 e5')
        expect(manager.prev()).toBe(false)
        expect(manager.getCurrentPly()).toBe(0)
      })

      test('jumps to first position', () => {
        manager = createChessManager('1. e4 e5 2. Nf3')
        manager.last()
        manager.first()
        expect(manager.getCurrentPly()).toBe(0)
        expect(manager.getFen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
      })

      test('jumps to last position', () => {
        manager = createChessManager('1. e4 e5 2. Nf3')
        manager.last()
        expect(manager.getCurrentPly()).toBe(3)
      })

      test('jumps to specific ply', () => {
        manager = createChessManager('1. e4 e5 2. Nf3 Nc6')
        manager.goto(2)
        expect(manager.getCurrentPly()).toBe(2)
      })

      test('ignores invalid ply in goto', () => {
        manager = createChessManager('1. e4 e5')
        manager.goto(10)
        expect(manager.getCurrentPly()).toBe(0)
        manager.goto(-1)
        expect(manager.getCurrentPly()).toBe(0)
      })
    })

    describe('FEN generation', () => {
      test('returns initial FEN at start', () => {
        const manager = createChessManager('1. e4 e5')
        expect(manager.getFen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
      })

      test('returns valid FEN after e4', () => {
        const manager = createChessManager('1. e4 e5')
        manager.next()
        const fen = manager.getFen()
        // Should have pawn on e4, black to move
        expect(fen).toContain('4P3/8/PPPP1PPP/RNBQKBNR b KQkq')
      })

      test('returns valid FEN after e4 e5', () => {
        const manager = createChessManager('1. e4 e5')
        manager.last()
        const fen = manager.getFen()
        // Should have pawns on e4 and e5, white to move
        expect(fen).toContain('4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq')
      })
    })

    describe('last move tracking', () => {
      test('has no last move at initial position', () => {
        const manager = createChessManager('1. e4 e5')
        expect(manager.getLastMove()).toBeUndefined()
      })

      test('tracks last move after e4', () => {
        const manager = createChessManager('1. e4 e5')
        manager.next()
        expect(manager.getLastMove()).toEqual(['e2', 'e4'])
      })

      test('tracks last move after e5', () => {
        const manager = createChessManager('1. e4 e5')
        manager.goto(2)
        expect(manager.getLastMove()).toEqual(['e7', 'e5'])
      })

      test('tracks knight move', () => {
        const manager = createChessManager('1. e4 e5 2. Nf3')
        manager.last()
        expect(manager.getLastMove()).toEqual(['g1', 'f3'])
      })
    })

    describe('move type detection', () => {
      test('detects normal moves', () => {
        const manager = createChessManager('1. e4 e5')
        expect(manager.getMoveType(1)).toBe('move')
        expect(manager.getMoveType(2)).toBe('move')
      })

      test('detects captures', () => {
        const manager = createChessManager('1. e4 d5 2. exd5')
        expect(manager.getMoveType(3)).toBe('capture')
      })

      test('detects checks', () => {
        const manager = createChessManager('1. f3 e5 2. g4 Qh4+')
        // Qh4+ is ply 4 and contains check symbol
        expect(manager.getMoveType(4)).toBe('check')
      })

      test('detects castling', () => {
        const manager = createChessManager('1. e4 e5 2. Nf3 Nf6 3. Bc4 Bc5 4. O-O')
        expect(manager.getMoveType(7)).toBe('castle')
      })

      test('returns undefined for invalid ply', () => {
        const manager = createChessManager('1. e4 e5')
        expect(manager.getMoveType(-1)).toBeUndefined()
        expect(manager.getMoveType(10)).toBeUndefined()
      })

      test('detects check in capture notation', () => {
        const manager = createChessManager('1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. exd5 Bxc3+')
        // Bxc3+ is ply 8 and should be detected as check (check takes priority)
        expect(manager.getMoveType(8)).toBe('check')
      })
    })

    describe('complex games', () => {
      test('handles Scholar\'s Mate', () => {
        const manager = createChessManager('1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#')
        expect(manager.getTotalPlies()).toBe(7)
        manager.last()
        expect(manager.getMoveType(7)).toBe('check') // Checkmate contains #
      })

      test('handles castling both sides', () => {
        const manager = createChessManager('1. e4 e5 2. Nf3 Nf6 3. Bc4 Bc5 4. O-O O-O')
        expect(manager.getTotalPlies()).toBe(8)
        expect(manager.getMoveType(7)).toBe('castle')
        expect(manager.getMoveType(8)).toBe('castle')
      })

      test('handles long algebraic notation game', () => {
        const manager = createChessManager(
          '1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7'
        )
        expect(manager.getTotalPlies()).toBe(16)
        manager.last()
        expect(manager.getCurrentPly()).toBe(16)
      })

      test('handles games with move numbers in various formats', () => {
        const manager1 = createChessManager('1.e4 e5 2.Nf3')
        const manager2 = createChessManager('1. e4 e5 2. Nf3')
        const manager3 = createChessManager('1.e4 e5\n2.Nf3')

        expect(manager1.getTotalPlies()).toBe(3)
        expect(manager2.getTotalPlies()).toBe(3)
        expect(manager3.getTotalPlies()).toBe(3)
      })

      test('stops parsing on invalid move', () => {
        // Invalid move should cause parsing to stop
        const manager = createChessManager('1. e4 e5 2. Nf3 Xyz')
        // Should parse up to Nf3
        expect(manager.getTotalPlies()).toBe(3)
      })
    })

    describe('edge cases', () => {
      test('handles move string without move numbers', () => {
        const manager = createChessManager('e4 e5 Nf3 Nc6')
        expect(manager.getTotalPlies()).toBe(4)
      })

      test('handles move string with extra whitespace', () => {
        const manager = createChessManager('  1.  e4   e5  2.  Nf3  ')
        expect(manager.getTotalPlies()).toBe(3)
      })

      test('handles single move', () => {
        const manager = createChessManager('1. e4')
        expect(manager.getTotalPlies()).toBe(1)
        manager.next()
        expect(manager.getCurrentPly()).toBe(1)
        expect(manager.getLastMove()).toEqual(['e2', 'e4'])
      })

      test('handles moves with annotations stripped', () => {
        // Real PGN may have annotations, but they should be stripped before calling this
        const manager = createChessManager('1. e4 e5 2. Nf3 Nc6 3. Bb5')
        expect(manager.getTotalPlies()).toBe(5)
      })

      test('initial position has correct properties', () => {
        const manager = createChessManager('1. e4')
        expect(manager.getCurrentPly()).toBe(0)
        expect(manager.getLastMove()).toBeUndefined()
        expect(manager.getFen()).toContain('rnbqkbnr/pppppppp')
      })
    })

    describe('ply counting', () => {
      test('counts plies correctly', () => {
        expect(createChessManager('').getTotalPlies()).toBe(0)
        expect(createChessManager('1. e4').getTotalPlies()).toBe(1)
        expect(createChessManager('1. e4 e5').getTotalPlies()).toBe(2)
        expect(createChessManager('1. e4 e5 2. Nf3').getTotalPlies()).toBe(3)
        expect(createChessManager('1. e4 e5 2. Nf3 Nc6').getTotalPlies()).toBe(4)
      })

      test('ply count matches position array', () => {
        const manager = createChessManager('1. e4 e5 2. Nf3 Nc6 3. Bb5')
        const totalPlies = manager.getTotalPlies()

        // Should be able to goto each ply
        for (let i = 0; i <= totalPlies; i++) {
          manager.goto(i)
          expect(manager.getCurrentPly()).toBe(i)
        }
      })
    })
  })
})
