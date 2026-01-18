import {
  useFocusable,
  FocusContext,
} from '@noriginmedia/norigin-spatial-navigation'
import { useCallback, useEffect, useState, useMemo } from 'react'
import type { Series, Season, Episode } from '../../core/types/vod'
import type { Source } from '../../core/types/source'
import { useSeriesInfo } from '../../core/hooks/useSeriesQueries'
import { useSeriesStore } from '../../core/stores/seriesStore'
import { SeasonList } from './SeasonList'
import { EpisodeList } from './EpisodeList'
import { Skeleton, SkeletonList } from '../../core/components/Skeleton'

export interface SeriesDetailsProps {
  /** The series to display details for */
  series: Series
  /** The current IPTV source */
  source: Source | null
  /** Callback when an episode is selected for playback */
  onEpisodePlay: (episode: Episode) => void
  /** Callback when back navigation is triggered */
  onBack: () => void
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * SeriesDetails - A full-screen view showing series information with season/episode selection.
 *
 * Features:
 * - Series poster, backdrop, and metadata
 * - Season list with navigation
 * - Episode list for selected season
 * - TV-optimized navigation
 * - Loading states for seasons/episodes
 */
export function SeriesDetails({
  series,
  source,
  onEpisodePlay,
  onBack,
  testId,
}: SeriesDetailsProps) {
  const [imageError, setImageError] = useState(false)

  const { ref, focusKey, focusSelf } = useFocusable({
    focusKey: 'SERIES_DETAILS',
    isFocusBoundary: true,
  })

  // Fetch series info (seasons and episodes)
  const { data: seriesInfo, isLoading, error } = useSeriesInfo({
    source,
    seriesId: series.id,
  })

  // Series store for state management
  const {
    currentSeason,
    setCurrentSeason,
    setSeasons,
    setEpisodes,
    getSeasonsBySeriesId,
    getEpisodesBySeasonId,
  } = useSeriesStore()

  // Get seasons from store or from fetched data
  const seasons = useMemo(() => {
    const storedSeasons = getSeasonsBySeriesId(series.id)
    if (storedSeasons.length > 0) {
      return storedSeasons
    }
    return seriesInfo?.seasons ?? []
  }, [series.id, getSeasonsBySeriesId, seriesInfo])

  // Get episodes for current season
  const episodes = useMemo(() => {
    if (!currentSeason) {
      return []
    }
    const storedEpisodes = getEpisodesBySeasonId(currentSeason.id)
    if (storedEpisodes.length > 0) {
      return storedEpisodes
    }
    return seriesInfo?.episodes[currentSeason.id] ?? []
  }, [currentSeason, getEpisodesBySeasonId, seriesInfo])

  // Update store when data is fetched
  useEffect(() => {
    if (seriesInfo) {
      setSeasons(series.id, seriesInfo.seasons)
      // Store episodes for each season
      Object.entries(seriesInfo.episodes).forEach(([seasonId, episodeList]) => {
        setEpisodes(seasonId, episodeList)
      })
    }
  }, [seriesInfo, series.id, setSeasons, setEpisodes])

  // Auto-select first season if none selected
  useEffect(() => {
    if (seasons.length > 0 && !currentSeason) {
      setCurrentSeason(seasons[0])
    }
  }, [seasons, currentSeason, setCurrentSeason])

  // Focus the container when mounted
  useEffect(() => {
    focusSelf()
  }, [focusSelf])

  // Handle keyboard events for back navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'XF86Back') {
        e.preventDefault()
        onBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack])

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handleSeasonSelect = useCallback(
    (season: Season) => {
      setCurrentSeason(season)
    },
    [setCurrentSeason]
  )

  const handleEpisodePlay = useCallback(
    (episode: Episode) => {
      onEpisodePlay(episode)
    },
    [onEpisodePlay]
  )

  // Generate placeholder initials from series title
  const getInitials = (title: string): string => {
    return title
      .split(/[\s-]+/)
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        ref={ref}
        className="flex flex-col h-screen bg-tv-bg"
        data-testid={testId}
      >
        {/* Header skeleton */}
        <div className="relative h-64 overflow-hidden bg-tv-surface">
          <Skeleton variant="rectangular" width="100%" height="100%" />
        </div>

        {/* Content skeleton */}
        <div className="flex flex-1 -mt-16 relative z-10 px-6 overflow-hidden">
          {/* Poster skeleton */}
          <div className="flex-shrink-0 mr-6">
            <Skeleton
              variant="rounded"
              width="200px"
              height="300px"
              testId={testId ? `${testId}-poster-skeleton` : undefined}
            />
          </div>

          {/* Info skeleton */}
          <div className="flex-1">
            <Skeleton variant="text" width="60%" height="2rem" className="mb-4" />
            <Skeleton variant="text" width="40%" height="1rem" className="mb-2" />
            <Skeleton variant="text" width="80%" height="1rem" className="mb-2" />
            <Skeleton variant="text" width="70%" height="1rem" className="mb-4" />

            <div className="flex gap-6 mt-6">
              {/* Season list skeleton */}
              <div className="w-48">
                <Skeleton variant="text" width="80%" height="1.5rem" className="mb-4" />
                <SkeletonList count={4} itemHeight="3rem" gap="0.5rem" />
              </div>

              {/* Episode list skeleton */}
              <div className="flex-1">
                <Skeleton variant="text" width="60%" height="1.5rem" className="mb-4" />
                <SkeletonList count={5} itemHeight="5rem" gap="0.5rem" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <FocusContext.Provider value={focusKey}>
        <div
          ref={ref}
          className="flex flex-col items-center justify-center h-screen bg-tv-bg"
          data-testid={testId}
        >
          <div className="text-center p-8 max-w-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-16 h-16 mx-auto mb-4 text-tv-error"
              aria-hidden="true"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <h2 className="text-tv-2xl font-bold text-tv-text mb-2">
              Failed to Load Series Details
            </h2>
            <p className="text-tv-text-muted mb-6">
              {error.message || 'An error occurred while loading series details.'}
            </p>
            <BackButton
              onBack={onBack}
              testId={testId ? `${testId}-back-btn` : undefined}
            />
          </div>
        </div>
      </FocusContext.Provider>
    )
  }

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className="flex flex-col h-screen bg-tv-bg overflow-hidden"
        data-testid={testId}
      >
        {/* Backdrop header */}
        {(series.backdrop || series.poster) && !imageError && (
          <div className="relative h-64 overflow-hidden flex-shrink-0">
            <img
              src={series.backdrop || series.poster}
              alt=""
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-tv-bg via-tv-bg/50 to-transparent" />
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-1 -mt-16 relative z-10 px-6 overflow-hidden">
          {/* Series poster and info */}
          <div className="flex-shrink-0 mr-6">
            <div className="w-48 rounded-lg overflow-hidden shadow-lg">
              {series.poster && !imageError ? (
                <img
                  src={series.poster}
                  alt={`${series.title} poster`}
                  className="w-full aspect-[2/3] object-cover"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-tv-border flex items-center justify-center">
                  <span className="text-tv-2xl font-bold text-tv-text-muted">
                    {getInitials(series.title)}
                  </span>
                </div>
              )}
            </div>

            {/* Back button */}
            <div className="mt-4">
              <BackButton
                onBack={onBack}
                testId={testId ? `${testId}-back-btn` : undefined}
              />
            </div>
          </div>

          {/* Series details and season/episode selection */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Series info header */}
            <div className="mb-4">
              <h1 className="text-tv-2xl font-bold text-tv-text mb-2">
                {series.title}
              </h1>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-3 text-tv-sm text-tv-text-muted mb-3">
                {series.year && <span>{series.year}</span>}
                {series.rating && (
                  <span className="px-2 py-0.5 border border-tv-border rounded">
                    {series.rating}
                  </span>
                )}
                {series.score !== undefined && series.score > 0 && (
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
                    {series.score.toFixed(1)}
                  </span>
                )}
                {series.seasonCount !== undefined && series.seasonCount > 0 && (
                  <span>
                    {series.seasonCount} {series.seasonCount === 1 ? 'Season' : 'Seasons'}
                  </span>
                )}
                {series.episodeCount !== undefined && series.episodeCount > 0 && (
                  <span>
                    {series.episodeCount} {series.episodeCount === 1 ? 'Episode' : 'Episodes'}
                  </span>
                )}
              </div>

              {/* Genres */}
              {series.genres && series.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {series.genres.map((genre) => (
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
              {series.description && (
                <p className="text-tv-base text-tv-text-muted line-clamp-3">
                  {series.description}
                </p>
              )}

              {/* Cast */}
              {series.cast && series.cast.length > 0 && (
                <div className="mt-2">
                  <span className="text-tv-sm text-tv-text-muted">Cast: </span>
                  <span className="text-tv-sm text-tv-text">
                    {series.cast.slice(0, 5).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Season and episode selection */}
            <div className="flex gap-6 flex-1 overflow-hidden">
              {/* Season list */}
              <div className="w-48 flex-shrink-0 flex flex-col">
                <h2 className="text-tv-lg font-semibold text-tv-text mb-3">
                  Seasons
                </h2>
                <div className="flex-1 overflow-y-auto">
                  {seasons.length > 0 ? (
                    <SeasonList
                      seasons={seasons}
                      selectedSeasonId={currentSeason?.id ?? null}
                      onSeasonSelect={handleSeasonSelect}
                      testId={testId ? `${testId}-season-list` : undefined}
                    />
                  ) : (
                    <p className="text-tv-sm text-tv-text-muted">
                      No seasons available.
                    </p>
                  )}
                </div>
              </div>

              {/* Episode list */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <h2 className="text-tv-lg font-semibold text-tv-text mb-3">
                  {currentSeason
                    ? currentSeason.name || `Season ${currentSeason.seasonNumber}`
                    : 'Episodes'}
                  {episodes.length > 0 && (
                    <span className="ml-2 text-tv-base font-normal text-tv-text-muted">
                      ({episodes.length} {episodes.length === 1 ? 'episode' : 'episodes'})
                    </span>
                  )}
                </h2>
                <div className="flex-1 overflow-y-auto">
                  <EpisodeList
                    episodes={episodes}
                    onEpisodeSelect={handleEpisodePlay}
                    testId={testId ? `${testId}-episode-list` : undefined}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FocusContext.Provider>
  )
}

interface BackButtonProps {
  onBack: () => void
  testId?: string
}

function BackButton({ onBack, testId }: BackButtonProps) {
  const { ref, focused } = useFocusable({
    focusKey: 'SERIES_DETAILS_BACK_BTN',
    onEnterPress: onBack,
  })

  const baseClasses = [
    'flex',
    'items-center',
    'gap-2',
    'w-full',
    'px-4',
    'py-2',
    'rounded-lg',
    'font-medium',
    'text-tv-base',
    'transition-all',
    'duration-150',
    'outline-none',
  ]

  const stateClasses = focused
    ? [
        'bg-tv-accent',
        'text-white',
        'shadow-[0_0_0_2px_var(--color-tv-accent),0_0_20px_var(--color-tv-accent-glow)]',
      ]
    : ['bg-tv-border', 'text-tv-text-muted', 'hover:bg-tv-border/80']

  return (
    <button
      ref={ref}
      className={[...baseClasses, ...stateClasses].join(' ')}
      data-testid={testId}
      data-focused={focused}
      onClick={onBack}
      tabIndex={0}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-5 h-5"
        aria-hidden="true"
      >
        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
      </svg>
      Back
    </button>
  )
}
