import {
  useFocusable,
  FocusContext,
} from '@noriginmedia/norigin-spatial-navigation'
import { useCallback } from 'react'
import type { VODItem } from '../../core/types/vod'
import { VODCard } from './VODCard'

export interface VODGridProps {
  /** Array of movies to display */
  movies: VODItem[]
  /** Callback when a movie is selected */
  onMovieSelect?: (movie: VODItem) => void
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
 * VODGrid - Grid layout of movie cards with spatial navigation.
 *
 * Features:
 * - Responsive grid layout with configurable columns
 * - Spatial navigation support for TV remote
 * - Focus context for contained navigation
 * - Smooth scrolling to focused items
 */
export function VODGrid({
  movies,
  onMovieSelect,
  columns = 5,
  testId,
}: VODGridProps) {
  const { ref, focusKey } = useFocusable({
    focusKey: 'VOD_GRID',
    isFocusBoundary: true,
    focusBoundaryDirections: ['up', 'down'],
    trackChildren: true,
    saveLastFocusedChild: true,
  })

  const handleMovieSelect = useCallback(
    (movie: VODItem) => {
      onMovieSelect?.(movie)
    },
    [onMovieSelect]
  )

  if (movies.length === 0) {
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
          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
        </svg>
        <p className="text-tv-text-muted text-tv-lg">
          No movies in this category
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
        aria-label="Movies grid"
      >
        {movies.map((movie) => (
          <VODCard
            key={movie.id}
            movie={movie}
            onSelect={() => handleMovieSelect(movie)}
            testId={testId ? `${testId}-movie-${movie.id}` : undefined}
          />
        ))}
      </div>
    </FocusContext.Provider>
  )
}
