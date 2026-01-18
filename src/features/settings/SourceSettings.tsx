import { useCallback } from 'react'
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import type { Source } from '../../core/types/source'

export interface SourceSettingsProps {
  /** List of IPTV sources */
  sources: Source[]
  /** ID of the currently active source */
  activeSourceId?: string | null
  /** Callback when a source is selected */
  onSelectSource?: (source: Source) => void
  /** Callback when a source should be removed */
  onRemoveSource?: (source: Source) => void
  /** Callback when Add Source is clicked */
  onAddSource?: () => void
  /** Test ID for testing purposes */
  testId?: string
}

interface SourceItemProps {
  source: Source
  isActive: boolean
  focusKey: string
  onSelect: () => void
  onRemove: (e: React.MouseEvent) => void
  testId?: string
}

function SourceItem({
  source,
  isActive,
  focusKey,
  onSelect,
  onRemove,
  testId,
}: SourceItemProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onSelect,
  })

  const isXtream = source.type === 'xtream'

  const baseClasses = [
    'flex',
    'items-center',
    'justify-between',
    'p-4',
    'rounded-xl',
    'bg-tv-card',
    'border-2',
    'cursor-pointer',
    'transition-all',
    'duration-150',
  ].join(' ')

  const stateClasses = focused
    ? 'border-tv-accent scale-[1.01] shadow-[0_0_0_2px_var(--color-tv-accent),0_0_20px_var(--color-tv-accent-glow)]'
    : isActive
      ? 'border-tv-accent/50 bg-tv-accent/10'
      : 'border-tv-border hover:border-tv-accent/50'

  return (
    <div
      ref={ref}
      onClick={onSelect}
      className={`${baseClasses} ${stateClasses}`}
      data-testid={testId}
      data-focused={focused}
      data-active={isActive}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-tv-surface flex items-center justify-center">
          {isXtream ? (
            <svg
              className="w-5 h-5 text-tv-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-tv-accent"
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
        <div>
          <div className="text-tv-base font-medium text-tv-text">
            {source.name}
          </div>
          <div className="text-tv-sm text-tv-text-muted">
            {isXtream ? 'Xtream Codes' : 'M3U Playlist'}
            {isActive && ' • Active'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isActive && (
          <span className="px-3 py-1 rounded-full bg-tv-accent/20 text-tv-accent text-tv-sm font-medium">
            Active
          </span>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="w-9 h-9 rounded-lg bg-tv-surface flex items-center justify-center text-tv-text-muted hover:bg-red-500/20 hover:text-red-400 transition-colors"
          aria-label={`Remove ${source.name}`}
          data-testid={testId ? `${testId}-remove-btn` : undefined}
        >
          <svg
            className="w-4 h-4"
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

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-150 ${
        focused
          ? 'bg-tv-accent text-tv-background scale-105 shadow-[0_0_0_2px_var(--color-tv-accent),0_0_20px_var(--color-tv-accent-glow)]'
          : 'bg-tv-accent/80 text-tv-background hover:bg-tv-accent'
      }`}
      data-testid={testId}
      data-focused={focused}
    >
      <svg
        className="w-4 h-4"
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
      Add Source
    </button>
  )
}

// Icon for empty state
const SourcesIcon = () => (
  <svg
    className="w-8 h-8 text-tv-text-muted"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
    />
  </svg>
)

/**
 * SourceSettings - Component for managing IPTV sources in settings.
 *
 * Features:
 * - List of saved IPTV sources with type indicators
 * - Active source highlighting
 * - Add new source button
 * - Remove source functionality
 * - Empty state when no sources configured
 * - TV-optimized controls with spatial navigation support
 */
export function SourceSettings({
  sources,
  activeSourceId,
  onSelectSource,
  onRemoveSource,
  onAddSource,
  testId,
}: SourceSettingsProps) {
  const { ref, focusKey } = useFocusable({
    focusKey: 'SOURCE_SETTINGS',
    isFocusBoundary: false,
  })

  const handleSelectSource = useCallback(
    (source: Source) => {
      onSelectSource?.(source)
    },
    [onSelectSource]
  )

  const handleRemoveSource = useCallback(
    (source: Source, e: React.MouseEvent) => {
      e.stopPropagation()
      onRemoveSource?.(source)
    },
    [onRemoveSource]
  )

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} data-testid={testId}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-tv-xl font-bold text-tv-text">IPTV Sources</h2>
          <AddSourceButton
            onClick={() => onAddSource?.()}
            focusKey="source-settings-add-btn"
            testId={testId ? `${testId}-add-btn` : undefined}
          />
        </div>

        {sources.length === 0 ? (
          <div
            className="bg-tv-card rounded-xl p-8 text-center"
            data-testid={testId ? `${testId}-empty` : undefined}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tv-surface flex items-center justify-center">
              <SourcesIcon />
            </div>
            <h3 className="text-tv-lg font-semibold text-tv-text mb-2">
              No Sources Added
            </h3>
            <p className="text-tv-text-muted">
              Add an IPTV source to start watching
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sources.map((source) => (
              <SourceItem
                key={source.id}
                source={source}
                isActive={source.id === activeSourceId}
                focusKey={`source-settings-${source.id}`}
                onSelect={() => handleSelectSource(source)}
                onRemove={(e) => handleRemoveSource(source, e)}
                testId={testId ? `${testId}-source-${source.id}` : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </FocusContext.Provider>
  )
}
