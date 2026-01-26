import { useRef, useEffect } from 'react'
import { isGameResult, getResultDisplay } from '../utils/chessManager.js'

interface MoveListProps {
  moves: string[]
  currentPly: number
  onJump: (ply: number) => void
}

export default function MoveList({ moves, currentPly, onJump }: MoveListProps) {
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

  // Separate game result from moves
  const lastElement = moves[moves.length - 1]
  const hasResult = lastElement && isGameResult(lastElement)
  const gameMoves = hasResult ? moves.slice(0, -1) : moves
  const result = hasResult ? lastElement : null

  // Group moves into pairs (white, black)
  const movePairs: Array<{ white: string; black?: string; moveNumber: number }> = []
  for (let i = 0; i < gameMoves.length; i += 2) {
    movePairs.push({
      white: gameMoves[i],
      black: gameMoves[i + 1],
      moveNumber: Math.floor(i / 2) + 1,
    })
  }

  return (
    <div className="move-list overflow-y-auto flex-1 p-2 bg-ui-bg-element rounded">
      <div className="grid gap-1" style={{ gridTemplateColumns: 'auto 1fr 1fr' }}>
        {movePairs.map((pair, pairIndex) => {
          const whitePly = pairIndex * 2
          const blackPly = pairIndex * 2 + 1
          const isWhiteCurrent = currentPly - 1 === whitePly
          const isBlackCurrent = currentPly - 1 === blackPly

          return (
            <>
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
            </>
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
