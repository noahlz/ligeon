import { useRef, useEffect } from 'react'
import { getResultDisplay } from '../utils/chessManager.js'
import { groupMovesIntoPairs } from '../utils/moveFormatter.js'
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table.js'

interface MoveListProps {
  moves: string[]
  result: string | null
  currentPly: number
  onJump: (ply: number) => void
}

export default function MoveList({ moves, result, currentPly, onJump }: MoveListProps) {
  const currentMoveRef = useRef<HTMLTableCellElement>(null)

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
    <div className="overflow-y-auto flex-1 p-2 bg-ui-bg-element rounded-sm font-mono">
      <Table>
        <TableBody>
          {movePairs.map((pair, pairIndex) => {
            const whitePly = pairIndex * 2
            const blackPly = pairIndex * 2 + 1
            const isWhiteCurrent = currentPly - 1 === whitePly
            const isBlackCurrent = currentPly - 1 === blackPly

            return (
              <TableRow key={pairIndex} className="border-0 hover:bg-transparent">
                {/* Move number */}
                <TableCell className="text-ui-text-dimmer text-right pr-2 w-8 py-0.75 border-0">
                  {pair.moveNumber}.
                </TableCell>

                {/* White move */}
                <TableCell
                  ref={isWhiteCurrent ? currentMoveRef : null}
                  onClick={() => onJump(whitePly + 1)}
                  className={`px-2 py-0.5 rounded cursor-pointer hover:bg-ui-bg-hover border-0 text-lg ${
                    isWhiteCurrent ? 'bg-ui-accent text-white font-bold' : ''
                  }`}
                >
                  {pair.white}
                </TableCell>

                {/* Black move */}
                <TableCell
                  ref={isBlackCurrent ? currentMoveRef : null}
                  onClick={pair.black ? () => onJump(blackPly + 1) : undefined}
                  className={`px-2 py-0.5 rounded border-0 text-lg ${
                    pair.black ? 'cursor-pointer hover:bg-ui-bg-hover' : ''
                  } ${isBlackCurrent ? 'bg-ui-accent text-white font-bold' : ''}`}
                >
                  {pair.black || ''}
                </TableCell>
              </TableRow>
            )
          })}

          {result && (
            <TableRow className="border-0 hover:bg-transparent">
              <TableCell colSpan={3} className="text-center py-2 text-sm font-bold border-0">
                Result: {getResultDisplay(result)}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
