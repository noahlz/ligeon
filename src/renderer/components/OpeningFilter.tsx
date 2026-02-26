import { useState, useEffect } from 'react'
import { searchAvailableOpenings, type Opening } from '../utils/openings.js'
import { Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.js'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command.js'
import { Badge } from '@/components/ui/badge.js'
import { buildOptionFilters } from '../hooks/useGameFilters.js'
import { showErrorToast } from '../utils/errorToast.js'

interface OpeningFilterProps {
  collectionId: string
  value: string[] // Array of ECO codes
  onChange: (ecos: string[]) => void
  player?: string
  results?: number[]
  dateFrom?: number | null
  dateTo?: number | null
}

export default function OpeningFilter({ collectionId, value, onChange, player, results, dateFrom, dateTo }: OpeningFilterProps) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Opening[]>([])
  const [open, setOpen] = useState(false)
  const [availableEcoCodes, setAvailableEcoCodes] = useState<Array<{ eco: string; count: number }>>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch available ECO codes when collection or upstream filters change
  useEffect(() => {
    const fetchAvailableEcoCodes = async () => {
      setIsLoading(true)
      const optionFilters = buildOptionFilters({
        player,
        results,
        dateFrom,
        dateTo,
      })
      try {
        const codes = await window.electron.getAvailableEcoCodes(collectionId, optionFilters)
        setAvailableEcoCodes(codes)

        // Clear selected ECO codes that are no longer available
        const availableSet = new Set(codes.map((c) => c.eco))
        const stillValid = value.filter((eco) => availableSet.has(eco))
        if (stillValid.length !== value.length) {
          onChange(stillValid)
        }
      } catch (error) {
        showErrorToast('Failed to load opening filters', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAvailableEcoCodes()
  }, [collectionId, player, results, dateFrom, dateTo]) // eslint-disable-line react-hooks/exhaustive-deps

  // Search openings as user types
  useEffect(() => {
    if (isLoading) {
      setSearchResults([])
      return
    }

    const matches = searchAvailableOpenings(query, availableEcoCodes)
    setSearchResults(matches)
  }, [query, availableEcoCodes, isLoading])

  const isSelected = (eco: string) => value.includes(eco)

  const handleToggle = (opening: Opening) => {
    if (isSelected(opening.eco)) {
      onChange(value.filter((eco) => eco !== opening.eco))
    } else {
      onChange([...value, opening.eco])
    }
  }

  const handleRemoveTag = (eco: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter((code) => code !== eco))
  }

  return (
    <div className="space-y-2">
      {/* Selected opening tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((eco) => (
            <Badge
              key={eco}
              variant="default"
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-ui-accent text-white text-xs hover:bg-ui-accent/80"
            >
              {eco}
              <button
                onClick={(e) => handleRemoveTag(eco, e)}
                className="hover:opacity-80"
                title="Remove"
              >
                ✕
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search with Command */}
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setQuery('')
        }}
      >
        <PopoverTrigger asChild>
          <div className="w-full border border-ui-border rounded-sm bg-ui-bg-element h-8 flex items-center px-2 cursor-pointer text-sm text-ui-text-dimmer">
            {query || 'Openings...'}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-ui-bg-box border-ui-border" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Openings..."
              value={query}
              onValueChange={setQuery}
              className="h-8 text-sm placeholder-ui-text-dimmer"
            />
            <CommandList>
              <CommandEmpty className="text-ui-text-dim text-sm">
                {isLoading ? 'Loading openings...' : 'No openings found'}
              </CommandEmpty>
              <CommandGroup>
                {searchResults.map((opening) => (
                  <CommandItem
                    key={opening.eco}
                    value={opening.eco}
                    onSelect={() => handleToggle(opening)}
                    className="group cursor-pointer text-sm data-[selected=true]:bg-ui-accent"
                  >
                    <div className="cursor-pointer flex items-center gap-2 w-full" title={`${opening.moves}`}>
                      {isSelected(opening.eco) && <Check className="h-4 w-4 group-data-[selected=true]:text-white" />}
                      <span className="font-semibold text-ui-accent group-data-[selected=true]:text-white">{opening.eco}</span>
                      <span className="text-ui-text-dim group-data-[selected=true]:text-white">{opening.name}</span>
                      <span className="w-2xs truncate text-ui-text-dim group-data-[selected=true]:text-white">{opening.moves && `(${opening.moves})`}</span>
                      <span className="ml-auto text-ui-text-dimmer group-data-[selected=true]:text-white">{opening.count}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
