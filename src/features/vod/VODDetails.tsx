import {
  useFocusable,
  FocusContext,
} from '@noriginmedia/norigin-spatial-navigation'
import { useState, useCallback, useEffect } from 'react'
import type { VODItem } from '../../core/types/vod'

export interface VODDetailsProps {
  /** The VOD item to display details for */
  movie: VODItem
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when the modal should close */
  onClose: () => void
  /** Callback when play is pressed */
  onPlay: (movie: VODItem) => void
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * VODDetails - A modal showing detailed movie information with play option.
 *
 * Features:
 * - Movie poster and backdrop
 * - Full title, description, and metadata
 * - Play button with TV focus
 * - Close on Back button or Escape
 * - Focus trapped within modal
 */
export function VODDetails({
  movie,
  isOpen,
  onClose,
  onPlay,
  testId,
}: VODDetailsProps) {
  const [imageError, setImageError] = useState(false)

  const { ref, focusKey, focusSelf } = useFocusable({
    focusKey: 'VOD_DETAILS_MODAL',
    isFocusBoundary: true,
    preferredChildFocusKey: 'VOD_DETAILS_PLAY_BTN',
  })

  // Focus the modal when it opens
  useEffect(() => {
    if (isOpen) {
      focusSelf()
    }
  }, [isOpen, focusSelf])

  // Handle keyboard events for closing
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'XF86Back') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handlePlay = useCallback(() => {
    onPlay(movie)
  }, [movie, onPlay])

  const handleBackdropClick = useCallback(() => {
    onClose()
  }, [onClose])

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  // Format duration from seconds to human readable
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Generate placeholder initials from movie title
  const getInitials = (title: string): string => {
    return title
      .split(/[\s-]+/)
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  if (!isOpen) {
    return null
  }

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className="fixed inset-0 z-50 flex items-center justify-center"
        data-testid={testId}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vod-details-title"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={handleBackdropClick}
          data-testid={testId ? `${testId}-backdrop` : undefined}
        />

        {/* Modal content */}
        <div
          className="relative z-10 w-full max-w-4xl max-h-[90vh] mx-4 bg-tv-surface rounded-xl overflow-hidden shadow-2xl"
          onClick={handleContentClick}
        >
          {/* Backdrop image header (if available) */}
          {(movie.backdrop || movie.poster) && !imageError && (
            <div className="relative h-64 overflow-hidden">
              <img
                src={movie.backdrop || movie.poster}
                alt=""
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-tv-surface via-tv-surface/50 to-transparent" />
            </div>
          )}

          {/* Content */}
          <div className="p-6 -mt-20 relative">
            <div className="flex gap-6">
              {/* Poster */}
              <div className="flex-shrink-0 w-40 rounded-lg overflow-hidden shadow-lg">
                {movie.poster && !imageError ? (
                  <img
                    src={movie.poster}
                    alt={`${movie.title} poster`}
                    className="w-full aspect-[2/3] object-cover"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-tv-border flex items-center justify-center">
                    <span className="text-tv-2xl font-bold text-tv-text-muted">
                      {getInitials(movie.title)}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2
                  id="vod-details-title"
                  className="text-tv-2xl font-bold text-tv-text mb-2"
                >
                  {movie.title}
                </h2>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-3 text-tv-sm text-tv-text-muted mb-4">
                  {movie.year && (
                    <span>{movie.year}</span>
                  )}
                  {movie.duration !== undefined && movie.duration > 0 && (
                    <span>{formatDuration(movie.duration)}</span>
                  )}
                  {movie.rating && (
                    <span className="px-2 py-0.5 border border-tv-border rounded">
                      {movie.rating}
                    </span>
                  )}
                  {movie.score !== undefined && movie.score > 0 && (
                    <span className="flex items-center gap-1 text-yellow-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4"
                        aria-hidden="true"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      {movie.score.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Genres */}
                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {movie.genres.map((genre) => (
                      <span
                        key={genre}
                        className="px-3 py-1 bg-tv-border rounded-full text-tv-sm text-tv-text"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                {movie.description && (
                  <p className="text-tv-base text-tv-text-muted line-clamp-4 mb-4">
                    {movie.description}
                  </p>
                )}

                {/* Cast */}
                {movie.cast && movie.cast.length > 0 && (
                  <div className="mb-4">
                    <span className="text-tv-sm text-tv-text-muted">Cast: </span>
                    <span className="text-tv-sm text-tv-text">
                      {movie.cast.slice(0, 5).join(', ')}
                    </span>
                  </div>
                )}

                {/* Directors */}
                {movie.directors && movie.directors.length > 0 && (
                  <div className="mb-4">
                    <span className="text-tv-sm text-tv-text-muted">Director: </span>
                    <span className="text-tv-sm text-tv-text">
                      {movie.directors.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 mt-6">
              <PlayButton
                onPlay={handlePlay}
                testId={testId ? `${testId}-play-btn` : undefined}
              />
              <CloseButton
                onClose={onClose}
                testId={testId ? `${testId}-close-btn` : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </FocusContext.Provider>
  )
}

interface PlayButtonProps {
  onPlay: () => void
  testId?: string
}

function PlayButton({ onPlay, testId }: PlayButtonProps) {
  const { ref, focused } = useFocusable({
    focusKey: 'VOD_DETAILS_PLAY_BTN',
    onEnterPress: onPlay,
  })

  const baseClasses = [
    'flex',
    'items-center',
    'gap-2',
    'px-8',
    'py-3',
    'rounded-lg',
    'font-semibold',
    'text-tv-lg',
    'transition-all',
    'duration-150',
    'outline-none',
  ]

  const stateClasses = focused
    ? [
        'bg-tv-accent',
        'text-white',
        'shadow-[0_0_0_4px_var(--color-tv-accent),0_0_30px_var(--color-tv-accent-glow)]',
      ]
    : ['bg-tv-accent/80', 'text-white', 'hover:bg-tv-accent']

  return (
    <button
      ref={ref}
      className={[...baseClasses, ...stateClasses].join(' ')}
      data-testid={testId}
      data-focused={focused}
      onClick={onPlay}
      tabIndex={0}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
        aria-hidden="true"
      >
        <path d="M8 5v14l11-7z" />
      </svg>
      Play
    </button>
  )
}

interface CloseButtonProps {
  onClose: () => void
  testId?: string
}

function CloseButton({ onClose, testId }: CloseButtonProps) {
  const { ref, focused } = useFocusable({
    focusKey: 'VOD_DETAILS_CLOSE_BTN',
    onEnterPress: onClose,
  })

  const baseClasses = [
    'flex',
    'items-center',
    'gap-2',
    'px-8',
    'py-3',
    'rounded-lg',
    'font-semibold',
    'text-tv-lg',
    'transition-all',
    'duration-150',
    'outline-none',
  ]

  const stateClasses = focused
    ? [
        'bg-tv-border',
        'text-tv-text',
        'shadow-[0_0_0_4px_var(--color-tv-accent),0_0_30px_var(--color-tv-accent-glow)]',
      ]
    : ['bg-tv-border/50', 'text-tv-text-muted', 'hover:bg-tv-border']

  return (
    <button
      ref={ref}
      className={[...baseClasses, ...stateClasses].join(' ')}
      data-testid={testId}
      data-focused={focused}
      onClick={onClose}
      tabIndex={0}
    >
      Close
    </button>
  )
}
