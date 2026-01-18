import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import { useCallback, useState } from 'react'
import type { Episode } from '../../core/types/vod'

export interface EpisodeListProps {
  /** Array of episodes to display */
  episodes: Episode[]
  /** Callback when an episode is selected for playback */
  onEpisodeSelect: (episode: Episode) => void
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * EpisodeList - A list of episodes with TV navigation support.
 *
 * Features:
 * - Horizontal/vertical navigation with D-pad
 * - Episode thumbnails with fallback
 * - Episode number, title, and duration
 * - TV-optimized focus states
 */
export function EpisodeList({
  episodes,
  onEpisodeSelect,
  testId,
}: EpisodeListProps) {
  const { ref, focusKey } = useFocusable({
    focusKey: 'EPISODE_LIST',
    isFocusBoundary: false,
  })

  if (episodes.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-40 text-tv-text-muted"
        data-testid={testId}
      >
        No episodes available for this season.
      </div>
    )
  }

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className="flex flex-col gap-2"
        data-testid={testId}
        role="list"
        aria-label="Episodes"
      >
        {episodes.map((episode) => (
          <EpisodeCard
            key={episode.id}
            episode={episode}
            onSelect={() => onEpisodeSelect(episode)}
            testId={testId ? `${testId}-episode-${episode.id}` : undefined}
          />
        ))}
      </div>
    </FocusContext.Provider>
  )
}

export interface EpisodeCardProps {
  /** The episode to display */
  episode: Episode
  /** Callback when this episode is selected */
  onSelect: () => void
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * EpisodeCard - A single focusable episode card.
 */
export function EpisodeCard({
  episode,
  onSelect,
  testId,
}: EpisodeCardProps) {
  const [imageError, setImageError] = useState(false)

  const { ref, focused } = useFocusable({
    focusKey: `EPISODE_${episode.id}`,
    onEnterPress: onSelect,
  })

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handleClick = useCallback(() => {
    onSelect()
  }, [onSelect])

  // Format duration from seconds to human readable
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const baseClasses = [
    'flex',
    'gap-4',
    'p-3',
    'rounded-lg',
    'transition-all',
    'duration-150',
    'outline-none',
    'cursor-pointer',
  ]

  const stateClasses = focused
    ? [
        'bg-tv-accent/20',
        'border-2',
        'border-tv-accent',
        'shadow-[0_0_0_2px_var(--color-tv-accent),0_0_20px_var(--color-tv-accent-glow)]',
      ]
    : ['bg-tv-surface', 'border-2', 'border-transparent', 'hover:bg-tv-border']

  return (
    <div
      ref={ref}
      className={[...baseClasses, ...stateClasses].join(' ')}
      data-testid={testId}
      data-focused={focused}
      role="listitem"
      tabIndex={0}
      onClick={handleClick}
    >
      {/* Episode thumbnail */}
      <div className="flex-shrink-0 w-40 rounded overflow-hidden bg-tv-border">
        {episode.thumbnail && !imageError ? (
          <img
            src={episode.thumbnail}
            alt={`${episode.title} thumbnail`}
            className="w-full aspect-video object-cover"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-video flex items-center justify-center bg-tv-border">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8 text-tv-text-muted"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </div>

      {/* Episode info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 text-tv-sm text-tv-text-muted">
          <span>E{episode.episodeNumber}</span>
          {episode.duration !== undefined && episode.duration > 0 && (
            <>
              <span>-</span>
              <span>{formatDuration(episode.duration)}</span>
            </>
          )}
        </div>
        <h3
          className={`text-tv-base font-medium truncate ${focused ? 'text-tv-text' : 'text-tv-text'}`}
        >
          {episode.title}
        </h3>
        {episode.description && (
          <p className="text-tv-sm text-tv-text-muted line-clamp-2 mt-1">
            {episode.description}
          </p>
        )}
      </div>

      {/* Play indicator on focus */}
      {focused && (
        <div className="flex-shrink-0 flex items-center justify-center w-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6 text-tv-accent"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      )}
    </div>
  )
}
