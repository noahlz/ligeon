import { useRef, useEffect } from 'react'

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

  return (
    <div className="move-list overflow-y-auto flex-1 p-4 bg-slate-700 rounded">
      <div className="grid grid-cols-2 gap-2">
        {moves.map((move, plyIndex) => {
          const moveNumber = Math.floor(plyIndex / 2) + 1
          const isWhiteMove = plyIndex % 2 === 0
          const isCurrent = plyIndex === currentPly - 1 // currentPly is 1-based

          return (
            <span
              key={plyIndex}
              ref={isCurrent ? currentMoveRef : null}
              onClick={() => onJump(plyIndex + 1)} // Jump to position after this move
              className={`move-item block text-center px-2 py-1 rounded cursor-pointer hover:bg-slate-600 ${
                isCurrent ? 'current bg-blue-600 font-bold' : ''
              }`}
            >
              {isWhiteMove && (
                <span className="move-number text-gray-400 mr-1">{moveNumber}.</span>
              )}
              {move}
              {!isWhiteMove && ' '}
            </span>
          )
        })}
      </div>
    </div>
  )
}
