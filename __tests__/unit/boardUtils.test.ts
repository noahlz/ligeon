import { describe, it, expect } from 'vitest'
import { squareToPercentPosition, badgeContainerLayout } from '../../src/renderer/utils/boardUtils.js'

describe('boardUtils', () => {
  describe('squareToPercentPosition', () => {
    describe('white orientation', () => {
      it('a1 is bottom-left corner', () => {
        expect(squareToPercentPosition('a1', 'white')).toEqual({ leftPct: 0, bottomPct: 0 })
      })

      it('h1 is bottom-right corner', () => {
        expect(squareToPercentPosition('h1', 'white')).toEqual({ leftPct: 87.5, bottomPct: 0 })
      })

      it('a8 is top-left corner', () => {
        expect(squareToPercentPosition('a8', 'white')).toEqual({ leftPct: 0, bottomPct: 87.5 })
      })

      it('h8 is top-right corner', () => {
        expect(squareToPercentPosition('h8', 'white')).toEqual({ leftPct: 87.5, bottomPct: 87.5 })
      })

      it('e4 is center-ish', () => {
        expect(squareToPercentPosition('e4', 'white')).toEqual({ leftPct: 50, bottomPct: 37.5 })
      })
    })

    describe('black orientation (board flipped)', () => {
      it('a1 is top-right corner', () => {
        expect(squareToPercentPosition('a1', 'black')).toEqual({ leftPct: 87.5, bottomPct: 87.5 })
      })

      it('h8 is bottom-left corner', () => {
        expect(squareToPercentPosition('h8', 'black')).toEqual({ leftPct: 0, bottomPct: 0 })
      })

      it('h1 is top-left corner', () => {
        expect(squareToPercentPosition('h1', 'black')).toEqual({ leftPct: 0, bottomPct: 87.5 })
      })

      it('a8 is bottom-right corner', () => {
        expect(squareToPercentPosition('a8', 'black')).toEqual({ leftPct: 87.5, bottomPct: 0 })
      })
    })

    describe('invalid input', () => {
      it('returns null for empty string', () => {
        expect(squareToPercentPosition('', 'white')).toBeNull()
      })

      it('returns null for too-long string', () => {
        expect(squareToPercentPosition('e44', 'white')).toBeNull()
      })

      it('returns null for out-of-range file', () => {
        expect(squareToPercentPosition('z4', 'white')).toBeNull()
      })

      it('returns null for out-of-range rank', () => {
        expect(squareToPercentPosition('e9', 'white')).toBeNull()
      })
    })
  })

  describe('badgeContainerLayout', () => {
    it('single badge: container is 5%, badge fills 100%', () => {
      const { containerWidthPct, badgeWidthInContainerPct } = badgeContainerLayout(1)
      expect(containerWidthPct).toBe(5)
      expect(badgeWidthInContainerPct).toBe(100)
    })

    it('two badges: container is 6.5%', () => {
      const { containerWidthPct } = badgeContainerLayout(2)
      expect(containerWidthPct).toBeCloseTo(6.5)
    })

    it('three badges: container is 8%', () => {
      const { containerWidthPct } = badgeContainerLayout(3)
      expect(containerWidthPct).toBeCloseTo(8)
    })

    it('badge width shrinks as count increases', () => {
      const one = badgeContainerLayout(1).badgeWidthInContainerPct
      const two = badgeContainerLayout(2).badgeWidthInContainerPct
      const three = badgeContainerLayout(3).badgeWidthInContainerPct
      expect(one).toBeGreaterThan(two)
      expect(two).toBeGreaterThan(three)
    })

    it('zero count: container defaults to 5%, badge fills 100% (guard)', () => {
      const { containerWidthPct, badgeWidthInContainerPct } = badgeContainerLayout(0)
      expect(containerWidthPct).toBe(5)
      expect(badgeWidthInContainerPct).toBe(100)
    })

    it('negative count: treated same as zero (guard)', () => {
      const { containerWidthPct, badgeWidthInContainerPct } = badgeContainerLayout(-3)
      expect(containerWidthPct).toBe(5)
      expect(badgeWidthInContainerPct).toBe(100)
    })
  })
})
