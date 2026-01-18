import {
  useFocusable,
  FocusContext,
} from '@noriginmedia/norigin-spatial-navigation'
import { useCallback } from 'react'
import type { Series } from '../../core/types/vod'
import { SeriesCard } from './SeriesCard'

export interface SeriesGridProps {
  /** Array of series to display */
  seriesList: Series[]
  /** Callback when a series is selected */
  onSeriesSelect?: (series: Series) => void
  /** Number of columns in the grid */
  columns?: 4 | 5 | 6 | 7
  /** Test ID for testing purposes */
  testId?: string
}

const columnClasses = {
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
} as const

/**
 * SeriesGrid - Grid layout of series cards with spatial navigation.
 *
 * Features:
 * - Responsive grid layout with configurable columns
 * - Spatial navigation support for TV remote
 * - Focus context for contained navigation
 * - Smooth scrolling to focused items
 */
export function SeriesGrid({
  seriesList,
  onSeriesSelect,
  columns = 5,
  testId,
}: SeriesGridProps) {
  const { ref, focusKey } = useFocusable({
    focusKey: 'SERIES_GRID',
    isFocusBoundary: true,
    focusBoundaryDirections: ['up', 'down'],
    trackChildren: true,
    saveLastFocusedChild: true,
  })

  const handleSeriesSelect = useCallback(
    (series: Series) => {
      onSeriesSelect?.(series)
    },
    [onSeriesSelect]
  )

  if (seriesList.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center"
        data-testid={testId}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-12 h-12 text-tv-text-muted mb-4"
          aria-hidden="true"
        >
          <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9 8h2v8H9zm4 0h2v8h-2z" />
        </svg>
        <p className="text-tv-text-muted text-tv-lg">
          No series in this category
        </p>
      </div>
    )
  }

  const gridClasses = ['grid', columnClasses[columns], 'gap-4']

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className={gridClasses.join(' ')}
        data-testid={testId}
        role="grid"
        aria-label="Series grid"
      >
        {seriesList.map((series) => (
          <SeriesCard
            key={series.id}
            series={series}
            onSelect={() => handleSeriesSelect(series)}
            testId={testId ? `${testId}-series-${series.id}` : undefined}
          />
        ))}
      </div>
    </FocusContext.Provider>
  )
}
