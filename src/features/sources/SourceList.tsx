import { useCallback } from 'react'
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import type { Source } from '../../core/types/source'
import { isXtreamSource } from '../../core/types/source'

export interface SourceListProps {
  /** List of sources to display */
  sources: Source[]
  /** ID of the currently active source */
  activeSourceId?: string | null
  /** Callback when a source is selected to be activated */
  onSelectSource: (source: Source) => void
  /** Callback when a source should be removed */
  onRemoveSource: (source: Source) => void
  /** Callback when Add Source button is clicked */
  onAddSource: () => void
  /** Whether the list is in a loading state */
  isLoading?: boolean
  /** Test ID for testing purposes */
  testId?: string
}

interface SourceItemProps {
  source: Source
  isActive: boolean
  onSelect: (source: Source) => void
  onRemove: (source: Source) => void
  focusKey: string
  testId?: string
}

function SourceItem({
  source,
  isActive,
  onSelect,
  onRemove,
  focusKey,
  testId,
}: SourceItemProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => onSelect(source),
  })

  const handleRemoveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onRemove(source)
    },
    [onRemove, source]
  )

  const baseClasses = [
    'flex',
    'items-center',
    'justify-between',
    'p-4',
    'rounded-xl',
    'bg-tv-card',
    'border-2',
    'transition-all',
    'duration-150',
    'cursor-pointer',
    'min-h-[80px]',
  ].join(' ')

  const focusClasses = focused
    ? 'border-tv-accent scale-[1.02] shadow-[0_0_0_2px_var(--color-tv-accent),0_0_20px_var(--color-tv-accent-glow)]'
    : isActive
      ? 'border-tv-accent/50 bg-tv-accent/10'
      : 'border-tv-border hover:border-tv-accent/50'

  const sourceTypeLabel = isXtreamSource(source) ? 'Xtream' : 'M3U'

  return (
    <div
      ref={ref}
      className={`${baseClasses} ${focusClasses}`}
      onClick={() => onSelect(source)}
      data-testid={testId}
      data-focused={focused}
      data-active={isActive}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-tv-surface">
          {isXtreamSource(source) ? (
            <svg
              className="h-6 w-6 text-tv-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6 text-tv-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-tv-lg font-semibold text-tv-text">{source.name}</span>
          <span className="text-tv-sm text-tv-text-muted">
            {sourceTypeLabel}
            {isActive && ' • Active'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isActive && (
          <div className="flex h-8 items-center rounded-full bg-tv-accent/20 px-3">
            <span className="text-tv-sm font-medium text-tv-accent">Active</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleRemoveClick}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-tv-surface text-tv-text-muted transition-colors hover:bg-red-500/20 hover:text-red-400"
          data-testid={`${testId}-remove-btn`}
          aria-label={`Remove ${source.name}`}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

interface AddSourceButtonProps {
  onClick: () => void
  focusKey: string
  testId?: string
}

function AddSourceButton({ onClick, focusKey, testId }: AddSourceButtonProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onClick,
  })

  const baseClasses = [
    'flex',
    'items-center',
    'justify-center',
    'gap-3',
    'p-4',
    'rounded-xl',
    'bg-tv-card',
    'border-2',
    'border-dashed',
    'transition-all',
    'duration-150',
    'cursor-pointer',
    'min-h-[80px]',
  ].join(' ')

  const focusClasses = focused
    ? 'border-tv-accent scale-[1.02] shadow-[0_0_0_2px_var(--color-tv-accent),0_0_20px_var(--color-tv-accent-glow)]'
    : 'border-tv-border hover:border-tv-accent/50'

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${focusClasses}`}
      data-testid={testId}
      data-focused={focused}
    >
      <svg
        className="h-6 w-6 text-tv-accent"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
      <span className="text-tv-lg font-semibold text-tv-text">Add Source</span>
    </button>
  )
}

function EmptyState({ onAddSource, testId }: { onAddSource: () => void; testId?: string }) {
  const { ref, focused } = useFocusable({
    focusKey: 'empty-add-source',
    onEnterPress: onAddSource,
  })

  return (
    <div
      className="flex flex-col items-center justify-center py-12"
      data-testid={testId}
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-tv-surface">
        <svg
          className="h-10 w-10 text-tv-text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-tv-xl font-semibold text-tv-text">No Sources Added</h3>
      <p className="mb-6 text-center text-tv-base text-tv-text-muted">
        Add an IPTV source to start watching
      </p>
      <button
        ref={ref}
        type="button"
        onClick={onAddSource}
        className={`flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-150 ${
          focused
            ? 'bg-tv-accent text-tv-background scale-105 shadow-[0_0_0_2px_var(--color-tv-accent),0_0_20px_var(--color-tv-accent-glow)]'
            : 'bg-tv-accent/80 text-tv-background hover:bg-tv-accent'
        }`}
        data-testid="empty-add-source-btn"
        data-focused={focused}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Your First Source
      </button>
    </div>
  )
}

function LoadingState({ testId }: { testId?: string }) {
  return (
    <div className="space-y-4" data-testid={testId}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex animate-pulse items-center justify-between rounded-xl bg-tv-card p-4"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-tv-surface" />
            <div className="flex flex-col gap-2">
              <div className="h-5 w-32 rounded bg-tv-surface" />
              <div className="h-4 w-16 rounded bg-tv-surface" />
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-tv-surface" />
        </div>
      ))}
    </div>
  )
}

/**
 * SourceList - A TV-optimized component for managing saved IPTV sources.
 *
 * Features:
 * - List of saved sources with type icons
 * - Active source indicator
 * - Remove source button on each item
 * - Add source button
 * - Empty state with call-to-action
 * - Spatial navigation support
 * - Loading state
 */
export function SourceList({
  sources,
  activeSourceId,
  onSelectSource,
  onRemoveSource,
  onAddSource,
  isLoading = false,
  testId,
}: SourceListProps) {
  const { ref, focusKey } = useFocusable({
    isFocusBoundary: false,
    focusKey: 'source-list',
  })

  if (isLoading) {
    return <LoadingState testId={`${testId}-loading`} />
  }

  if (sources.length === 0) {
    return <EmptyState onAddSource={onAddSource} testId={`${testId}-empty`} />
  }

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} className="space-y-4" data-testid={testId}>
        {sources.map((source) => (
          <SourceItem
            key={source.id}
            source={source}
            isActive={source.id === activeSourceId}
            onSelect={onSelectSource}
            onRemove={onRemoveSource}
            focusKey={`source-${source.id}`}
            testId={`source-item-${source.id}`}
          />
        ))}
        <AddSourceButton
          onClick={onAddSource}
          focusKey="add-source-button"
          testId="add-source-btn"
        />
      </div>
    </FocusContext.Provider>
  )
}
