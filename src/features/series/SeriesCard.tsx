import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useState, useCallback } from 'react'
import type { Series } from '../../core/types/vod'

export interface SeriesCardProps {
  /** The series to display */
  series: Series
  /** Callback when the series is selected */
  onSelect?: () => void
  /** Callback when the series receives focus */
  onFocus?: () => void
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * SeriesCard - A TV-optimized card displaying series info.
 *
 * Features:
 * - Series poster with fallback
 * - Title and year display
 * - Rating badge (if available)
 * - Season/episode count badges
 * - TV-optimized focus states
 * - Spatial navigation support
 */
export function SeriesCard({
  series,
  onSelect,
  onFocus,
  testId,
}: SeriesCardProps) {
  const [imageError, setImageError] = useState(false)

  const { ref, focused } = useFocusable({
    focusKey: `SERIES_${series.id}`,
    onEnterPress: onSelect,
    onFocus,
  })

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handleClick = useCallback(() => {
    onSelect?.()
  }, [onSelect])

  const baseClasses = [
    'relative',
    'flex',
    'flex-col',
    'overflow-hidden',
    'rounded-lg',
    'bg-tv-surface',
    'border-2',
    'transition-all',
    'duration-150',
    'outline-none',
    'cursor-pointer',
  ]

  const stateClasses = focused
    ? [
        'border-tv-accent',
        'scale-105',
        'z-10',
        'shadow-[0_0_0_4px_var(--color-tv-accent),0_0_30px_var(--color-tv-accent-glow),0_4px_20px_rgba(0,0,0,0.5)]',
      ]
    : ['border-transparent', 'hover:border-tv-border']

  const combinedClasses = [...baseClasses, ...stateClasses].join(' ')

  // Generate placeholder initials from series title
  const getInitials = (title: string): string => {
    return title
      .split(/[\s-]+/)
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <div
      ref={ref}
      className={combinedClasses}
      data-testid={testId}
      data-focused={focused}
      role="button"
      tabIndex={0}
      aria-label={`${series.title}${series.year ? `, ${series.year}` : ''}${series.score ? `, rated ${series.score}` : ''}${series.seasonCount ? `, ${series.seasonCount} seasons` : ''}`}
      onClick={handleClick}
    >
      {/* Series poster area */}
      <div className="relative aspect-[2/3] bg-tv-bg flex items-center justify-center overflow-hidden">
        {series.poster && !imageError ? (
          <img
            src={series.poster}
            alt={`${series.title} poster`}
            className="w-full h-full object-cover"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-tv-border">
            <span className="text-tv-2xl font-bold text-tv-text-muted">
              {getInitials(series.title)}
            </span>
          </div>
        )}

        {/* Rating badge */}
        {series.score !== undefined && series.score > 0 && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 rounded text-tv-sm font-medium text-yellow-400 flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-3 h-3"
              aria-hidden="true"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {series.score.toFixed(1)}
          </div>
        )}

        {/* Season count badge */}
        {series.seasonCount !== undefined && series.seasonCount > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-tv-sm font-medium text-white">
            {series.seasonCount} {series.seasonCount === 1 ? 'Season' : 'Seasons'}
          </div>
        )}

        {/* Year badge */}
        {series.year !== undefined && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 rounded text-tv-sm font-medium text-white">
            {series.year}
          </div>
        )}
      </div>

      {/* Series info */}
      <div className="p-3">
        <h3 className="text-tv-base font-medium text-tv-text truncate">
          {series.title}
        </h3>
        {series.genres && series.genres.length > 0 && (
          <p className="text-tv-sm text-tv-text-muted truncate mt-1">
            {series.genres.slice(0, 2).join(', ')}
          </p>
        )}
      </div>
    </div>
  )
}
