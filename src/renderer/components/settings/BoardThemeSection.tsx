import { BOARD_THEMES } from '../../../shared/types/game.js'
import type { BoardTheme } from '../../../shared/types/game.js'
import { capitalizeFirst } from '../../utils/formatters.js'
import { cn } from '@/lib/utils.js'

const THEME_COLORS: Record<BoardTheme, { light: string; dark: string }> = {
  brown:  { light: '#f0d9b5', dark: '#b58863' },
  green:  { light: '#ffffdd', dark: '#86a666' },
  blue:   { light: '#dee3e6', dark: '#8ca2ad' },
  purple: { light: '#e8d8f0', dark: '#9b72b0' },
  grey:   { light: '#c8c8c8', dark: '#7a7a7a' },
}

interface BoardThemeSectionProps {
  boardTheme: BoardTheme
  onThemeChange: (theme: BoardTheme) => void
}

export function BoardThemeSection({ boardTheme, onThemeChange }: BoardThemeSectionProps) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {BOARD_THEMES.map((theme) => {
        const { light, dark } = THEME_COLORS[theme]
        const isActive = boardTheme === theme
        return (
          <button
            key={theme}
            onClick={() => onThemeChange(theme)}
            title={capitalizeFirst(theme)}
            aria-label={`${capitalizeFirst(theme)} board theme`}
            aria-pressed={isActive}
            className={cn(
              'flex items-center justify-center rounded-md p-1.5 transition-colors cursor-pointer hover:bg-ui-bg-hover',
              isActive && 'ring-2 ring-ui-accent bg-ui-bg-element'
            )}
          >
            <div
              className="w-20 h-20 rounded"
              style={{
                backgroundImage: `repeating-conic-gradient(${light} 0% 25%, ${dark} 0% 50%)`,
                backgroundSize: '25% 25%',
              }}
            />
          </button>
        )
      })}
    </div>
  )
}
