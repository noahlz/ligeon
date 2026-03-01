import { APP_THEMES, type AppTheme } from '../../../shared/types/game.js'
import { capitalizeFirst } from '../../utils/formatters.js'
import { cn } from '@/lib/utils.js'

interface AppThemeSectionProps {
  appTheme: AppTheme
  onAppThemeChange: (theme: AppTheme) => void
}

export function AppThemeSection({ appTheme, onAppThemeChange }: AppThemeSectionProps) {
  return (
    <div className="flex flex-row gap-2">
      {APP_THEMES.map((theme) => {
        const isActive = appTheme === theme
        return (
          <button
            key={theme}
            onClick={() => onAppThemeChange(theme)}
            aria-label={`${capitalizeFirst(theme)} app theme`}
            aria-pressed={isActive}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer border-2',
              isActive
                ? 'border-ui-accent bg-ui-bg-element text-ui-text'
                : 'border-ui-border-light text-ui-text-dim hover:border-ui-text-dimmer hover:bg-ui-bg-hover hover:text-ui-text'
            )}
          >
            {capitalizeFirst(theme)}
          </button>
        )
      })}
    </div>
  )
}
