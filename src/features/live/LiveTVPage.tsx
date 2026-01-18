import {
  useFocusable,
  FocusContext,
} from '@noriginmedia/norigin-spatial-navigation'
import { useCallback, useEffect, useMemo } from 'react'
import type { Category, Channel } from '../../core/types/channel'
import type { Source } from '../../core/types/source'
import { useLiveContent } from '../../core/hooks/useChannelQueries'
import { useChannelStore } from '../../core/stores/channelStore'
import { CategoryList } from './CategoryList'
import { ChannelGrid } from './ChannelGrid'
import { Skeleton, SkeletonList } from '../../core/components/Skeleton'

export interface LiveTVPageProps {
  /** The current IPTV source */
  source: Source | null
  /** Callback when a channel is selected for playback */
  onChannelSelect?: (channel: Channel) => void
  /** Callback when back navigation is triggered */
  onBack?: () => void
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * LiveTVPage - Main page for browsing and selecting live TV channels.
 *
 * Features:
 * - Category sidebar with vertical navigation
 * - Channel grid with focusable channel cards
 * - Loading states with skeletons
 * - Error handling with retry option
 * - TV-optimized navigation with spatial navigation
 */
export function LiveTVPage({
  source,
  onChannelSelect,
  onBack,
  testId,
}: LiveTVPageProps) {
  const { ref, focusKey } = useFocusable({
    focusKey: 'LIVE_TV_PAGE',
    isFocusBoundary: true,
  })

  // Fetch categories and channels
  const { categories, channels, isLoading, error } = useLiveContent({
    source,
  })

  // Channel store for state management
  const {
    selectedCategoryId,
    selectCategory,
    setCategories,
    setChannels,
    setCurrentChannel,
  } = useChannelStore()

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
    if (channels.length > 0) {
      setChannels(channels)
    }
  }, [channels, setChannels])

  // Filter channels by selected category
  const filteredChannels = useMemo(() => {
    if (!selectedCategoryId) {
      return channels
    }
    return channels.filter((channel) => channel.categoryId === selectedCategoryId)
  }, [channels, selectedCategoryId])

  // Handle category selection
  const handleCategorySelect = useCallback(
    (category: Category) => {
      selectCategory(category.id)
    },
    [selectCategory]
  )

  // Handle channel selection
  const handleChannelSelect = useCallback(
    (channel: Channel) => {
      setCurrentChannel(channel)
      onChannelSelect?.(channel)
    },
    [setCurrentChannel, onChannelSelect]
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

        {/* Channel grid skeleton */}
        <main className="flex-1 p-6 overflow-hidden">
          <Skeleton
            variant="text"
            width="200px"
            height="2rem"
            className="mb-6"
            testId={testId ? `${testId}-grid-title-skeleton` : undefined}
          />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="flex flex-col">
                <Skeleton
                  variant="rounded"
                  width="100%"
                  height="120px"
                  testId={testId ? `${testId}-channel-skeleton-${i}` : undefined}
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
              Failed to Load Channels
            </h2>
            <p className="text-tv-text-muted mb-6">
              {error.message || 'An error occurred while loading channels.'}
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
  if (categories.length === 0 || channels.length === 0) {
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
              <path d="M4 6h16v12H4V6zm0-2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4zm9.5 11l-5-3v6l5-3z" />
            </svg>
            <h2 className="text-tv-2xl font-bold text-tv-text mb-2">
              No Channels Available
            </h2>
            <p className="text-tv-text-muted mb-6">
              {!source
                ? 'Please select an IPTV source first.'
                : 'No channels found for this source.'}
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
          aria-label="Channel categories"
        >
          <div className="p-4">
            <h2 className="text-tv-lg font-semibold text-tv-text mb-4">
              Categories
            </h2>
            <CategoryList
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onCategorySelect={handleCategorySelect}
              testId={testId ? `${testId}-category-list` : undefined}
            />
          </div>
        </aside>

        {/* Channel grid */}
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-tv-2xl font-bold text-tv-text mb-6">
            {selectedCategory?.name ?? 'All Channels'}
            <span className="ml-2 text-tv-lg font-normal text-tv-text-muted">
              ({filteredChannels.length} channels)
            </span>
          </h1>
          <ChannelGrid
            channels={filteredChannels}
            onChannelSelect={handleChannelSelect}
            testId={testId ? `${testId}-channel-grid` : undefined}
          />
        </main>
      </div>
    </FocusContext.Provider>
  )
}
