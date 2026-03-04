import { useState, useEffect, useCallback } from 'react'
import type { PieceSet } from '../../../shared/types/game.js'
import { PIECE_SETS } from '../../../shared/types/game.js'

export interface UsePieceSetReturn {
  pieceSet: PieceSet
  handlePieceSetChange: (set: PieceSet) => void
}

const CG_SELECTORS: Record<string, string> = {
  wP: 'piece.pawn.white',
  wN: 'piece.knight.white',
  wB: 'piece.bishop.white',
  wR: 'piece.rook.white',
  wQ: 'piece.queen.white',
  wK: 'piece.king.white',
  bP: 'piece.pawn.black',
  bN: 'piece.knight.black',
  bB: 'piece.bishop.black',
  bR: 'piece.rook.black',
  bQ: 'piece.queen.black',
  bK: 'piece.king.black',
}

export function getPieceUrl(set: string, file: string): string {
  return new URL(`./pieces/${set}/${file}.svg`, window.location.href).href
}

function applyPieceSetStyles(activeSet: PieceSet): void {
  let el = document.getElementById('piece-set-styles') as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = 'piece-set-styles'
    document.head.appendChild(el)
  }
  const rules: string[] = []
  // Default fallback (no attribute set)
  for (const [file, selector] of Object.entries(CG_SELECTORS)) {
    rules.push(
      `html:not([data-piece-set]) .cg-wrap ${selector} { background-image: url('${getPieceUrl('cburnett', file)}'); }`
    )
  }
  // Per-set rules
  for (const set of PIECE_SETS) {
    for (const [file, selector] of Object.entries(CG_SELECTORS)) {
      rules.push(
        `[data-piece-set="${set}"] .cg-wrap ${selector} { background-image: url('${getPieceUrl(set, file)}'); }`
      )
    }
  }
  el.textContent = rules.join('\n')
  void activeSet // used via data attribute, kept for clarity
}

export function usePieceSet(): UsePieceSetReturn {
  const [pieceSet, setPieceSet] = useState<PieceSet>(() => {
    return (localStorage.getItem('pieceSet') as PieceSet) ?? 'cburnett'
  })

  useEffect(() => {
    const cached = (localStorage.getItem('pieceSet') as PieceSet) ?? 'cburnett'
    document.documentElement.dataset.pieceSet = cached
    applyPieceSetStyles(cached)

    void window.electron.getPieceSet().then((set) => {
      setPieceSet(set)
      localStorage.setItem('pieceSet', set)
      document.documentElement.dataset.pieceSet = set
      applyPieceSetStyles(set)
    })
  }, [])

  const handlePieceSetChange = useCallback((set: PieceSet) => {
    setPieceSet(set)
    localStorage.setItem('pieceSet', set)
    document.documentElement.dataset.pieceSet = set
    applyPieceSetStyles(set)
    void window.electron.setPieceSet(set)
  }, [])

  return { pieceSet, handlePieceSetChange }
}
