import React, { useRef, useEffect } from 'react'
import { getResultDisplay } from '../utils/chessManager.js'
import { groupMovesIntoPairs } from '../utils/moveFormatter.js'

interface MoveListProps {
  moves: string[]
  result: string | null
  currentPly: number
  onJump: (ply: number) => void
}

export default function MoveList({ moves, result, currentPly, onJump }: MoveListProps) {
  const currentMoveRef = useRef<HTMLSpanElement>(null)

  // Auto-scroll to current move
  useEffect(() => {
    if (currentMoveRef.current) {
      currentMoveRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [currentPly])

  const movePairs = groupMovesIntoPairs(moves)

  return (
    <div className="move-list overflow-y-auto flex-1 p-2 bg-ui-bg-element rounded-sm">
      <div className="grid gap-1" style={{ gridTemplateColumns: 'auto 1fr 1fr' }}>
        {movePairs.map((pair, pairIndex) => {
          const whitePly = pairIndex * 2
          const blackPly = pairIndex * 2 + 1
          const isWhiteCurrent = currentPly - 1 === whitePly
          const isBlackCurrent = currentPly - 1 === blackPly

          return (
            <React.Fragment key={pairIndex}>
              {/* Move number */}
              <span
                key={`num-${pairIndex}`}
                className="text-ui-text-dimmer text-right pr-2"
              >
                {pair.moveNumber}.
              </span>

              {/* White move */}
              <span
                key={`white-${pairIndex}`}
                ref={isWhiteCurrent ? currentMoveRef : null}
                onClick={() => onJump(whitePly + 1)}
                className={`move-item px-2 py-0.5 rounded cursor-pointer hover:bg-ui-bg-hover ${
                  isWhiteCurrent ? 'current' : ''
                }`}
              >
                {pair.white}
              </span>

              {/* Black move */}
              <span
                key={`black-${pairIndex}`}
                ref={isBlackCurrent ? currentMoveRef : null}
                onClick={pair.black ? () => onJump(blackPly + 1) : undefined}
                className={`move-item px-2 py-0.5 rounded ${
                  pair.black ? 'cursor-pointer hover:bg-ui-bg-hover' : ''
                } ${isBlackCurrent ? 'current' : ''}`}
              >
                {pair.black || ''}
              </span>
            </React.Fragment>
          )
        })}
      </div>
      {result && (
        <div className="game-result">
          Result: {getResultDisplay(result)}
        </div>
      )}
    </div>
  )
}
