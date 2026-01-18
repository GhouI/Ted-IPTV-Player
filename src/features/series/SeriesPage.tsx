import {
  useFocusable,
  FocusContext,
} from '@noriginmedia/norigin-spatial-navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { VODCategory, Series } from '../../core/types/vod'
import type { Source } from '../../core/types/source'
import { useSeriesContent } from '../../core/hooks/useSeriesQueries'
import { useSeriesStore } from '../../core/stores/seriesStore'
import { SeriesCategoryList } from './SeriesCategoryList'
import { SeriesGrid } from './SeriesGrid'
import { Skeleton, SkeletonList } from '../../core/components/Skeleton'

export interface SeriesPageProps {
  /** The current IPTV source */
  source: Source | null
  /** Callback when a series is selected for viewing details */
  onSeriesSelect?: (series: Series) => void
  /** Callback when back navigation is triggered */
  onBack?: () => void
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * SeriesPage - Main page for browsing and selecting TV series.
 *
 * Features:
 * - Category sidebar with vertical navigation
 * - Series grid with focusable series cards
 * - Loading states with skeletons
 * - Error handling with retry option
 * - TV-optimized navigation with spatial navigation
 */
export function SeriesPage({
  source,
  onSeriesSelect,
  onBack,
  testId,
}: SeriesPageProps) {
  const { ref, focusKey } = useFocusable({
    focusKey: 'SERIES_PAGE',
    isFocusBoundary: true,
  })

  // Fetch categories and series
  const { categories, series: seriesList, isLoading, error } = useSeriesContent({
    source,
  })

  // Series store for state management
  const {
    selectedCategoryId,
    selectCategory,
    setCategories,
    setSeriesList,
    setCurrentSeries,
  } = useSeriesStore()

  // Local state to track if we've set the initial category
  const [initialCategorySet, setInitialCategorySet] = useState(false)

  // Update store when data changes
  useEffect(() => {
    if (categories.length > 0) {
      setCategories(categories)
      // Auto-select first category if none selected
      if (!selectedCategoryId && !initialCategorySet) {
        selectCategory(categories[0].id)
        setInitialCategorySet(true)
      }
    }
  }, [categories, setCategories, selectedCategoryId, selectCategory, initialCategorySet])

  useEffect(() => {
    if (seriesList.length > 0) {
      setSeriesList(seriesList)
    }
  }, [seriesList, setSeriesList])

  // Filter series by selected category
  const filteredSeries = useMemo(() => {
    if (!selectedCategoryId) {
      return seriesList
    }
    return seriesList.filter((series) => series.categoryId === selectedCategoryId)
  }, [seriesList, selectedCategoryId])

  // Handle category selection
  const handleCategorySelect = useCallback(
    (category: VODCategory) => {
      selectCategory(category.id)
    },
    [selectCategory]
  )

  // Handle series selection (opens details view)
  const handleSeriesSelect = useCallback(
    (series: Series) => {
      setCurrentSeries(series)
      onSeriesSelect?.(series)
    },
    [setCurrentSeries, onSeriesSelect]
  )

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

        {/* Series grid skeleton */}
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
                  testId={testId ? `${testId}-series-skeleton-${i}` : undefined}
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
              Failed to Load Series
            </h2>
            <p className="text-tv-text-muted mb-6">
              {error.message || 'An error occurred while loading series.'}
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
  if (categories.length === 0 || seriesList.length === 0) {
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
              <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9 8h2v8H9zm4 0h2v8h-2z" />
            </svg>
            <h2 className="text-tv-2xl font-bold text-tv-text mb-2">
              No Series Available
            </h2>
            <p className="text-tv-text-muted mb-6">
              {!source
                ? 'Please select an IPTV source first.'
                : 'No series found for this source. Series content may not be available with M3U playlists.'}
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
          aria-label="Series categories"
        >
          <div className="p-4">
            <h2 className="text-tv-lg font-semibold text-tv-text mb-4">
              Categories
            </h2>
            <SeriesCategoryList
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onCategorySelect={handleCategorySelect}
              testId={testId ? `${testId}-category-list` : undefined}
            />
          </div>
        </aside>

        {/* Series grid */}
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-tv-2xl font-bold text-tv-text mb-6">
            {selectedCategory?.name ?? 'All Series'}
            <span className="ml-2 text-tv-lg font-normal text-tv-text-muted">
              ({filteredSeries.length} series)
            </span>
          </h1>
          <SeriesGrid
            seriesList={filteredSeries}
            onSeriesSelect={handleSeriesSelect}
            testId={testId ? `${testId}-series-grid` : undefined}
          />
        </main>
      </div>
    </FocusContext.Provider>
  )
}
