import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import { useCallback } from 'react'
import type { Season } from '../../core/types/vod'

export interface SeasonListProps {
  /** Array of seasons to display */
  seasons: Season[]
  /** Currently selected season ID */
  selectedSeasonId: string | null
  /** Callback when a season is selected */
  onSeasonSelect: (season: Season) => void
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * SeasonList - A vertical list of seasons with TV navigation support.
 *
 * Features:
 * - Vertical navigation with D-pad
 * - Visual selection indicator
 * - Season number and name display
 * - Episode count badges
 */
export function SeasonList({
  seasons,
  selectedSeasonId,
  onSeasonSelect,
  testId,
}: SeasonListProps) {
  const { ref, focusKey } = useFocusable({
    focusKey: 'SEASON_LIST',
    isFocusBoundary: false,
    focusBoundaryDirections: ['left', 'right'],
  })

  return (
    <FocusContext.Provider value={focusKey}>
      <nav
        ref={ref}
        className="flex flex-col gap-1"
        data-testid={testId}
        role="listbox"
        aria-label="Seasons"
      >
        {seasons.map((season) => (
          <SeasonItem
            key={season.id}
            season={season}
            isSelected={season.id === selectedSeasonId}
            onSelect={() => onSeasonSelect(season)}
            testId={testId ? `${testId}-season-${season.id}` : undefined}
          />
        ))}
      </nav>
    </FocusContext.Provider>
  )
}

export interface SeasonItemProps {
  /** The season to display */
  season: Season
  /** Whether this season is currently selected */
  isSelected: boolean
  /** Callback when this season is selected */
  onSelect: () => void
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * SeasonItem - A single focusable season item in the list.
 */
export function SeasonItem({
  season,
  isSelected,
  onSelect,
  testId,
}: SeasonItemProps) {
  const { ref, focused } = useFocusable({
    focusKey: `SEASON_${season.id}`,
    onEnterPress: onSelect,
  })

  const handleClick = useCallback(() => {
    onSelect()
  }, [onSelect])

  const baseClasses = [
    'flex',
    'flex-col',
    'px-4',
    'py-3',
    'rounded-lg',
    'transition-all',
    'duration-150',
    'outline-none',
    'cursor-pointer',
  ]

  const stateClasses = focused
    ? [
        'bg-tv-accent',
        'text-white',
        'shadow-[0_0_0_2px_var(--color-tv-accent),0_0_20px_var(--color-tv-accent-glow)]',
      ]
    : isSelected
      ? ['bg-tv-accent/20', 'text-tv-text', 'border', 'border-tv-accent/50']
      : ['bg-tv-surface', 'text-tv-text-muted', 'hover:bg-tv-border']

  return (
    <div
      ref={ref}
      className={[...baseClasses, ...stateClasses].join(' ')}
      data-testid={testId}
      data-focused={focused}
      data-selected={isSelected}
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={handleClick}
    >
      <span className="text-tv-base font-medium">
        {season.name || `Season ${season.seasonNumber}`}
      </span>
      {season.episodeCount !== undefined && season.episodeCount > 0 && (
        <span
          className={`text-tv-sm ${focused ? 'text-white/80' : 'text-tv-text-muted'}`}
        >
          {season.episodeCount} {season.episodeCount === 1 ? 'Episode' : 'Episodes'}
        </span>
      )}
    </div>
  )
}
