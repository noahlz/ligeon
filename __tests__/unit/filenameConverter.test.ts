import { describe, it, expect } from 'vitest'
import { deriveSuggestedName } from '../../src/renderer/utils/filenameConverter.js'

describe('filenameConverter', () => {
  describe('deriveSuggestedName', () => {
    it('converts basic filename to title case', () => {
      expect(deriveSuggestedName('/path/to/kasparov-karpov.pgn')).toBe('Kasparov Karpov')
    })

    it('handles uppercase PGN extension', () => {
      expect(deriveSuggestedName('/path/to/games.PGN')).toBe('Games')
    })

    it('normalizes underscores to spaces', () => {
      expect(deriveSuggestedName('fischer_spassky_1972.pgn')).toBe('Fischer Spassky 1972')
    })

    it('normalizes dots to spaces', () => {
      expect(deriveSuggestedName('world.chess.championship.pgn')).toBe('World Chess Championship')
    })

    it('handles multiple separators in a row', () => {
      expect(deriveSuggestedName('my---games___collection.pgn')).toBe('My Games Collection')
    })

    it('trims whitespace', () => {
      expect(deriveSuggestedName('  spaced-file.pgn  ')).toBe('Spaced File')
    })

    it('handles filename without path', () => {
      expect(deriveSuggestedName('local.pgn')).toBe('Local')
    })

    it('handles Windows path with backslash separators', () => {
      expect(deriveSuggestedName('C:\\Users\\josh\\Downloads\\my-60-memorable-games.pgn')).toBe('My 60 Memorable Games')
    })

    it('handles empty filename parts', () => {
      expect(deriveSuggestedName('   .pgn')).toBe('')
    })

    it('converts mixed case to title case', () => {
      expect(deriveSuggestedName('WORLD_CHAMPIONSHIP.pgn')).toBe('World Championship')
    })

    it('preserves single word', () => {
      expect(deriveSuggestedName('games.pgn')).toBe('Games')
    })

    it('handles minor words', () => {
      expect(deriveSuggestedName('tal-a-complete-life-and-games')).toBe("Tal a Complete Life and Games")
    })

    it('handles empty filenames', () => {
      expect(deriveSuggestedName('    ')).toBe("")
    })

    it('handles null', () => {
      expect(deriveSuggestedName(null as unknown as string)).toBe("")
    })

    it('handles undefined', () => {
      expect(deriveSuggestedName(undefined as any)).toBe("")
    })
  })
})
