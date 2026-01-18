import {
  useFocusable,
  FocusContext,
} from '@noriginmedia/norigin-spatial-navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { VODCategory, VODItem } from '../../core/types/vod'
import type { Source } from '../../core/types/source'
import { useVODContent } from '../../core/hooks/useVODQueries'
import { useVODStore } from '../../core/stores/vodStore'
import { VODCategoryList } from './VODCategoryList'
import { VODGrid } from './VODGrid'
import { VODDetails } from './VODDetails'
import { Skeleton, SkeletonList } from '../../core/components/Skeleton'

export interface VODPageProps {
  /** The current IPTV source */
  source: Source | null
  /** Callback when a movie is selected for playback */
  onMoviePlay?: (movie: VODItem) => void
  /** Callback when back navigation is triggered */
  onBack?: () => void
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * VODPage - Main page for browsing and selecting VOD movies.
 *
 * Features:
 * - Category sidebar with vertical navigation
 * - Movie grid with focusable movie cards
 * - Movie details modal with play option
 * - Loading states with skeletons
 * - Error handling with retry option
 * - TV-optimized navigation with spatial navigation
 */
export function VODPage({
  source,
  onMoviePlay,
  onBack,
  testId,
}: VODPageProps) {
  const { ref, focusKey } = useFocusable({
    focusKey: 'VOD_PAGE',
    isFocusBoundary: true,
  })

  // State for movie details modal
  const [selectedMovie, setSelectedMovie] = useState<VODItem | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Fetch categories and movies
  const { categories, items: movies, isLoading, error } = useVODContent({
    source,
  })

  // VOD store for state management
  const {
    selectedCategoryId,
    selectCategory,
    setCategories,
    setMovies,
    setCurrentMovie,
  } = useVODStore()

  // Update store when data changes
  useEffect(() => {
    if (categories.length > 0) {
      setCategories(categories)
      // Auto-select first category if none selected
      if (!selectedCategoryId) {
        selectCategory(categories[0].id)
      }
    }
  }, [categories, setCategories, selectedCategoryId, selectCategory])

  useEffect(() => {
    if (movies.length > 0) {
      setMovies(movies)
    }
  }, [movies, setMovies])

  // Filter movies by selected category
  const filteredMovies = useMemo(() => {
    if (!selectedCategoryId) {
      return movies
    }
    return movies.filter((movie) => movie.categoryId === selectedCategoryId)
  }, [movies, selectedCategoryId])

  // Handle category selection
  const handleCategorySelect = useCallback(
    (category: VODCategory) => {
      selectCategory(category.id)
    },
    [selectCategory]
  )

  // Handle movie selection (opens details modal)
  const handleMovieSelect = useCallback(
    (movie: VODItem) => {
      setSelectedMovie(movie)
      setIsDetailsOpen(true)
    },
    []
  )

  // Handle movie play from details modal
  const handleMoviePlay = useCallback(
    (movie: VODItem) => {
      setCurrentMovie(movie)
      setIsDetailsOpen(false)
      onMoviePlay?.(movie)
    },
    [setCurrentMovie, onMoviePlay]
  )

  // Handle details modal close
  const handleDetailsClose = useCallback(() => {
    setIsDetailsOpen(false)
    setSelectedMovie(null)
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div
        ref={ref}
        className="flex h-screen bg-tv-bg"
        data-testid={testId}
      >
        {/* Category sidebar skeleton */}
        <aside className="w-64 flex-shrink-0 bg-tv-surface border-r border-tv-border p-4">
          <Skeleton
            variant="text"
            width="60%"
            height="1.5rem"
            className="mb-4"
            testId={testId ? `${testId}-category-title-skeleton` : undefined}
          />
          <SkeletonList
            count={8}
            itemHeight="2.5rem"
            gap="0.5rem"
            testId={testId ? `${testId}-category-skeleton` : undefined}
          />
        </aside>

        {/* Movie grid skeleton */}
        <main className="flex-1 p-6 overflow-hidden">
          <Skeleton
            variant="text"
            width="200px"
            height="2rem"
            className="mb-6"
            testId={testId ? `${testId}-grid-title-skeleton` : undefined}
          />
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 15 }, (_, i) => (
              <div key={i} className="flex flex-col">
                <Skeleton
                  variant="rounded"
                  width="100%"
                  height="200px"
                  testId={testId ? `${testId}-movie-skeleton-${i}` : undefined}
                />
                <Skeleton
                  variant="text"
                  width="80%"
                  height="1rem"
                  className="mt-2"
                />
              </div>
            ))}
          </div>
        </main>
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
              Failed to Load Movies
            </h2>
            <p className="text-tv-text-muted mb-6">
              {error.message || 'An error occurred while loading movies.'}
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-tv-accent text-white rounded-lg font-medium
                hover:bg-tv-accent-hover focus:outline-none focus:ring-2
                focus:ring-tv-accent focus:ring-offset-2 focus:ring-offset-tv-bg"
              data-testid={testId ? `${testId}-back-button` : undefined}
            >
              Go Back
            </button>
          </div>
        </div>
      </FocusContext.Provider>
    )
  }

  // Empty state
  if (categories.length === 0 || movies.length === 0) {
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
              className="w-16 h-16 mx-auto mb-4 text-tv-text-muted"
              aria-hidden="true"
            >
              <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
            </svg>
            <h2 className="text-tv-2xl font-bold text-tv-text mb-2">
              No Movies Available
            </h2>
            <p className="text-tv-text-muted mb-6">
              {!source
                ? 'Please select an IPTV source first.'
                : 'No movies found for this source. VOD content may not be available with M3U playlists.'}
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-tv-accent text-white rounded-lg font-medium
                hover:bg-tv-accent-hover focus:outline-none focus:ring-2
                focus:ring-tv-accent focus:ring-offset-2 focus:ring-offset-tv-bg"
              data-testid={testId ? `${testId}-back-button` : undefined}
            >
              Go Back
            </button>
          </div>
        </div>
      </FocusContext.Provider>
    )
  }

  // Get selected category name for display
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className="flex h-screen bg-tv-bg"
        data-testid={testId}
      >
        {/* Category sidebar */}
        <aside
          className="w-64 flex-shrink-0 bg-tv-surface border-r border-tv-border overflow-y-auto"
          aria-label="Movie categories"
        >
          <div className="p-4">
            <h2 className="text-tv-lg font-semibold text-tv-text mb-4">
              Categories
            </h2>
            <VODCategoryList
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onCategorySelect={handleCategorySelect}
              testId={testId ? `${testId}-category-list` : undefined}
            />
          </div>
        </aside>

        {/* Movie grid */}
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-tv-2xl font-bold text-tv-text mb-6">
            {selectedCategory?.name ?? 'All Movies'}
            <span className="ml-2 text-tv-lg font-normal text-tv-text-muted">
              ({filteredMovies.length} movies)
            </span>
          </h1>
          <VODGrid
            movies={filteredMovies}
            onMovieSelect={handleMovieSelect}
            testId={testId ? `${testId}-movie-grid` : undefined}
          />
        </main>

        {/* Movie details modal */}
        {selectedMovie && (
          <VODDetails
            movie={selectedMovie}
            isOpen={isDetailsOpen}
            onClose={handleDetailsClose}
            onPlay={handleMoviePlay}
            testId={testId ? `${testId}-details-modal` : undefined}
          />
        )}
      </div>
    </FocusContext.Provider>
  )
}
