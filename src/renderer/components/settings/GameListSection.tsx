import { AlertTriangle } from 'lucide-react'
import { GAME_LIST_LIMITS, type GameListLimit } from '../../../shared/types/game.js'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.js'

interface GameListSectionProps {
  gameListLimit: GameListLimit
  onGameListLimitChange: (limit: GameListLimit) => void
}

export function GameListSection({ gameListLimit, onGameListLimitChange }: GameListSectionProps) {
  function handleChange(value: string) {
    const parsed = value === 'unlimited' ? 'unlimited' : (parseInt(value, 10) as GameListLimit)
    onGameListLimitChange(parsed)
  }

  return (
    <div className="flex flex-col gap-2">
      <Select value={String(gameListLimit)} onValueChange={handleChange}>
        <SelectTrigger className="w-40 bg-ui-bg-element text-ui-text border-ui-border">
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
      {gameListLimit === 'unlimited' && (
        <p className="flex items-center gap-1.5 text-xs text-ui-accent">
          <AlertTriangle size={12} />
          Warning: large game collections may affect performance
        </p>
      )}
    </div>
  )
}
