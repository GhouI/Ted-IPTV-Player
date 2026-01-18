import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useState, useCallback } from 'react'
import type { VODItem } from '../../core/types/vod'

export interface VODCardProps {
  /** The VOD item to display */
  movie: VODItem
  /** Callback when the movie is selected */
  onSelect?: () => void
  /** Callback when the movie receives focus */
  onFocus?: () => void
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * VODCard - A TV-optimized card displaying movie/VOD info.
 *
 * Features:
 * - Movie poster with fallback
 * - Title and year display
 * - Rating badge (if available)
 * - TV-optimized focus states
 * - Spatial navigation support
 */
export function VODCard({
  movie,
  onSelect,
  onFocus,
  testId,
}: VODCardProps) {
  const [imageError, setImageError] = useState(false)

  const { ref, focused } = useFocusable({
    focusKey: `VOD_${movie.id}`,
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

  // Generate placeholder initials from movie title
  const getInitials = (title: string): string => {
    return title
      .split(/[\s-]+/)
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  // Format duration from seconds to human readable
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div
      ref={ref}
      className={combinedClasses}
      data-testid={testId}
      data-focused={focused}
      role="button"
      tabIndex={0}
      aria-label={`${movie.title}${movie.year ? `, ${movie.year}` : ''}${movie.score ? `, rated ${movie.score}` : ''}`}
      onClick={handleClick}
    >
      {/* Movie poster area */}
      <div className="relative aspect-[2/3] bg-tv-bg flex items-center justify-center overflow-hidden">
        {movie.poster && !imageError ? (
          <img
            src={movie.poster}
            alt={`${movie.title} poster`}
            className="w-full h-full object-cover"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-tv-border">
            <span className="text-tv-2xl font-bold text-tv-text-muted">
              {getInitials(movie.title)}
            </span>
          </div>
        )}

        {/* Rating badge */}
        {movie.score !== undefined && movie.score > 0 && (
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
            {movie.score.toFixed(1)}
          </div>
        )}

        {/* Duration badge */}
        {movie.duration !== undefined && movie.duration > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-tv-sm font-medium text-white">
            {formatDuration(movie.duration)}
          </div>
        )}

        {/* Year badge */}
        {movie.year !== undefined && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 rounded text-tv-sm font-medium text-white">
            {movie.year}
          </div>
        )}
      </div>

      {/* Movie info */}
      <div className="p-3">
        <h3 className="text-tv-base font-medium text-tv-text truncate">
          {movie.title}
        </h3>
        {movie.genres && movie.genres.length > 0 && (
          <p className="text-tv-sm text-tv-text-muted truncate mt-1">
            {movie.genres.slice(0, 2).join(', ')}
          </p>
        )}
      </div>
    </div>
  )
}
