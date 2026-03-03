import { AlertTriangle } from 'lucide-react'
import { GAME_LIST_LIMITS, parseGameListLimit, type GameListLimit } from '../../../shared/types/game.js'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.js'

interface GameListSectionProps {
  gameListLimit: GameListLimit
  onGameListLimitChange: (limit: GameListLimit) => void
  triggerClassName?: string
  showWarning?: boolean
}

export function GameListSection({
  gameListLimit,
  onGameListLimitChange,
  triggerClassName = 'w-40 bg-ui-bg-element text-ui-text border-ui-border',
  showWarning = true,
}: GameListSectionProps) {
  function handleChange(value: string) {
    onGameListLimitChange(parseGameListLimit(value))
  }

  return (
    <div className="flex flex-col gap-2">
      <Select value={String(gameListLimit)} onValueChange={handleChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-ui-bg-box border-ui-border">
          {GAME_LIST_LIMITS.map((limit) => (
            <SelectItem key={String(limit)} value={String(limit)}>
              {limit === 'unlimited' ? 'Unlimited' : limit.toLocaleString()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showWarning && gameListLimit === 'unlimited' && (
        <p className="flex items-center gap-1.5 text-xs text-ui-accent">
          <AlertTriangle size={12} />
          Warning: large game collections may affect performance
        </p>
      )}
    </div>
  )
}
