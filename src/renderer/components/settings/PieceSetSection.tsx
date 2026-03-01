import { PIECE_SETS, type PieceSet } from '../../../shared/types/game.js'
import { capitalizeFirst } from '../../utils/formatters.js'
import { cn } from '@/lib/utils.js'
import { getPieceUrl } from '../../hooks/usePieceSet.js'

interface PieceSetSectionProps {
  pieceSet: PieceSet
  onPieceSetChange: (set: PieceSet) => void
}

export function PieceSetSection({ pieceSet, onPieceSetChange }: PieceSetSectionProps) {
  return (
    <div className="flex flex-row gap-2">
      {PIECE_SETS.map((set) => {
        const isActive = pieceSet === set
        return (
          <button
            key={set}
            onClick={() => onPieceSetChange(set)}
            title={capitalizeFirst(set)}
            aria-label={`${capitalizeFirst(set)} piece set`}
            aria-pressed={isActive}
            className={cn(
              'flex items-center justify-center rounded-md p-2 transition-colors cursor-pointer border-2',
              isActive
                ? 'border-ui-accent bg-ui-bg-element'
                : 'border-ui-border-light hover:border-ui-text-dimmer hover:bg-ui-bg-hover'
            )}
          >
            <img
              src={getPieceUrl(set, 'wN')}
              alt={`${capitalizeFirst(set)} knight`}
              title={capitalizeFirst(set)}
              className="w-20 h-10"
              draggable={false}
              onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden' }}
            />
          </button>
        )
      })}
    </div>
  )
}
