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

  return (
    <div className="move-list overflow-y-auto flex-1 p-2 bg-ui-bg-element rounded">
      <div className="grid grid-cols-2 gap-1">
        {gameMoves.map((move, plyIndex) => {
          const moveNumber = Math.floor(plyIndex / 2) + 1
          const isWhiteMove = plyIndex % 2 === 0
          const isCurrent = plyIndex === currentPly - 1 // currentPly is 1-based

          return (
            <span
              key={plyIndex}
              ref={isCurrent ? currentMoveRef : null}
              onClick={() => onJump(plyIndex + 1)} // Jump to position after this move
              className={`move-item block text-center px-2 py-0.5 rounded cursor-pointer hover:bg-ui-bg-hover ${
                isCurrent ? 'current' : ''
              }`}
            >
              {isWhiteMove && (
                <span className="move-number text-ui-text-dimmer mr-1">{moveNumber}.</span>
              )}
              {move}
              {!isWhiteMove && ' '}
            </span>
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
