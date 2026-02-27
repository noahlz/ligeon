import { describe, test, expect } from 'vitest'
import {
  createChessManager,
  getResultDisplay,
  type ChessManager,
} from '../../src/renderer/utils/chessManager.js'

describe('chessManager', () => {
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

      test('tracks king destination for white kingside castle', () => {
        const manager = createChessManager('1. e4 e5 2. Nf3 Nf6 3. Bc4 Bc5 4. O-O')
        manager.last()
        expect(manager.getLastMove()).toEqual(['e1', 'g1'])
      })

      test('tracks king destination for black kingside castle', () => {
        const manager = createChessManager('1. e4 e5 2. Nf3 Nf6 3. Bc4 Bc5 4. O-O O-O')
        manager.last()
        expect(manager.getLastMove()).toEqual(['e8', 'g8'])
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

    describe('ChessManager extensions', () => {
      describe('getDests', () => {
        test('returns legal destinations from initial position', () => {
          const manager = createChessManager('')
          const dests = manager.getDests()

          // Initial position has 20 legal moves: 16 pawn moves (2 per pawn) + 4 knight moves
          expect(dests.size).toBe(10) // 8 pawns + 2 knights
          const totalMoves = [...dests.values()].reduce((acc, arr) => acc + arr.length, 0)
          expect(totalMoves).toBe(20)

          // e2 pawn can move to e3 or e4
          const e2Dests = dests.get('e2')
          expect(e2Dests).toBeDefined()
          expect(e2Dests).toContain('e3')
          expect(e2Dests).toContain('e4')

          // g1 knight can move to f3 or h3
          const g1Dests = dests.get('g1')
          expect(g1Dests).toBeDefined()
          expect(g1Dests).toContain('f3')
          expect(g1Dests).toContain('h3')
        })

        test('returns empty map at checkmate position', () => {
          // Scholar's mate position
          const manager = createChessManager('1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#')
          manager.last()
          const dests = manager.getDests()

          // Black is checkmated, no legal moves
          expect(dests.size).toBe(0)
        })

        test('updates when ply changes', () => {
          const manager = createChessManager('1. e4 e5')

          // Initial position
          const initialDests = manager.getDests()
          expect(initialDests.get('e2')).toBeDefined()

          // After e4
          manager.next()
          const afterE4Dests = manager.getDests()
          expect(afterE4Dests.get('e2')).toBeUndefined() // e2 pawn moved
          expect(afterE4Dests.get('e7')).toBeDefined() // Black's e7 pawn can move
        })
      })

      describe('getTurnColor', () => {
        test('returns white at ply 0', () => {
          const manager = createChessManager('1. e4 e5')
          expect(manager.getTurnColor()).toBe('white')
        })

        test('returns black after white\'s first move', () => {
          const manager = createChessManager('1. e4 e5')
          manager.next() // After e4
          expect(manager.getTurnColor()).toBe('black')
        })

        test('returns white after black\'s reply', () => {
          const manager = createChessManager('1. e4 e5')
          manager.goto(2) // After e4 e5
          expect(manager.getTurnColor()).toBe('white')
        })

        test('alternates correctly through game', () => {
          const manager = createChessManager('1. e4 e5 2. Nf3 Nc6')

          expect(manager.getTurnColor()).toBe('white') // ply 0
          manager.next()
          expect(manager.getTurnColor()).toBe('black') // ply 1
          manager.next()
          expect(manager.getTurnColor()).toBe('white') // ply 2
          manager.next()
          expect(manager.getTurnColor()).toBe('black') // ply 3
          manager.next()
          expect(manager.getTurnColor()).toBe('white') // ply 4
        })
      })

      describe('tryMove', () => {
        test('returns SAN for legal move', () => {
          const manager = createChessManager('1. e4 e5')
          const san = manager.tryMove('e2', 'e4')
          expect(san).toBe('e4')
        })

        test('returns null for illegal move', () => {
          const manager = createChessManager('')
          const san = manager.tryMove('e2', 'e5') // Can't move 3 squares
          expect(san).toBeNull()
        })

        test('does not change manager state', () => {
          const manager = createChessManager('1. e4 e5')
          const initialPly = manager.getCurrentPly()
          const initialFen = manager.getFen()

          manager.tryMove('e2', 'e4')

          expect(manager.getCurrentPly()).toBe(initialPly)
          expect(manager.getFen()).toBe(initialFen)
        })

        test('handles promotion parameter', () => {
          // Just verify the promotion parameter is accepted and doesn't cause errors
          // Testing actual promotion requires complex game setup
          const manager = createChessManager('')

          // Try a move with promotion parameter (will be invalid from initial position)
          const san = manager.tryMove('e2', 'e8', 'queen')
          expect(san).toBeNull() // Invalid move, but parameter is handled

          // Verify promotion parameter with a legal non-promotion move
          const san2 = manager.tryMove('e2', 'e4', undefined)
          expect(san2).toBe('e4')
        })

        test('returns correct SAN for captures', () => {
          const manager = createChessManager('1. e4 d5')
          manager.last()
          const san = manager.tryMove('e4', 'd5')
          expect(san).toBe('exd5')
        })

        test('validates from/to squares', () => {
          const manager = createChessManager('')
          expect(manager.tryMove('invalid', 'e4')).toBeNull()
          expect(manager.tryMove('e2', 'invalid')).toBeNull()
        })

        test('rejects off-board squares', () => {
          const manager = createChessManager('')
          expect(manager.tryMove('a9', 'a10')).toBeNull()
          expect(manager.tryMove('i1', 'j1')).toBeNull()
          expect(manager.tryMove('e2', 'e9')).toBeNull()
        })

        test('rejects empty/whitespace squares', () => {
          const manager = createChessManager('')
          expect(manager.tryMove('', 'e4')).toBeNull()
          expect(manager.tryMove('e2', '')).toBeNull()
          expect(manager.tryMove(' ', 'e4')).toBeNull()
        })
      })

      describe('getMainlineSan', () => {
        test('returns SAN for valid ply', () => {
          const manager = createChessManager('1. e4 e5 2. Nf3')
          expect(manager.getMainlineSan(1)).toBe('e4')
          expect(manager.getMainlineSan(2)).toBe('e5')
          expect(manager.getMainlineSan(3)).toBe('Nf3')
        })

        test('returns undefined for ply 0', () => {
          const manager = createChessManager('1. e4')
          expect(manager.getMainlineSan(0)).toBeUndefined()
        })

        test('returns undefined for out-of-range ply', () => {
          const manager = createChessManager('1. e4 e5')
          expect(manager.getMainlineSan(-1)).toBeUndefined()
          expect(manager.getMainlineSan(10)).toBeUndefined()
        })

        test('works regardless of current ply', () => {
          const manager = createChessManager('1. e4 e5 2. Nf3')
          manager.last()
          expect(manager.getMainlineSan(1)).toBe('e4')
          expect(manager.getMainlineSan(2)).toBe('e5')
        })

        test('boundary: ply 1 when only initial position exists', () => {
          const manager = createChessManager('')
          expect(manager.getMainlineSan(1)).toBeUndefined()
        })

        test('boundary: negative ply values', () => {
          const manager = createChessManager('1. e4')
          expect(manager.getMainlineSan(-1)).toBeUndefined()
          expect(manager.getMainlineSan(-100)).toBeUndefined()
        })
      })

      describe('getFenAtPly', () => {
        test('returns initial FEN at ply 0', () => {
          const manager = createChessManager('1. e4')
          const fen = manager.getFenAtPly(0)
          expect(fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
        })

        test('returns correct FEN at any valid ply', () => {
          const manager = createChessManager('1. e4 e5')
          const fen1 = manager.getFenAtPly(1)
          const fen2 = manager.getFenAtPly(2)

          expect(fen1).toContain('4P3') // e4 pawn
          expect(fen1).toContain('b KQkq') // Black to move
          expect(fen2).toContain('4p3') // e5 pawn
          expect(fen2).toContain('w KQkq') // White to move
        })

        test('returns undefined for out-of-range ply', () => {
          const manager = createChessManager('1. e4 e5')
          expect(manager.getFenAtPly(-1)).toBeUndefined()
          expect(manager.getFenAtPly(10)).toBeUndefined()
        })

        test('works regardless of current ply', () => {
          const manager = createChessManager('1. e4 e5')
          manager.goto(1)
          const fen0 = manager.getFenAtPly(0)
          expect(fen0).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
        })
      })
    })
  })
})
