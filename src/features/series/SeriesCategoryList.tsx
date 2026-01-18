import {
  useFocusable,
  FocusContext,
} from '@noriginmedia/norigin-spatial-navigation'
import { useCallback } from 'react'
import type { VODCategory } from '../../core/types/vod'

export interface SeriesCategoryListProps {
  /** Array of categories to display */
  categories: VODCategory[]
  /** Currently selected category ID */
  selectedCategoryId: string | null
  /** Callback when a category is selected */
  onCategorySelect?: (category: VODCategory) => void
  /** Test ID for testing purposes */
  testId?: string
}

export interface SeriesCategoryItemProps {
  /** The category to display */
  category: VODCategory
  /** Whether this category is selected */
  isSelected: boolean
  /** Callback when the category is selected */
  onSelect?: () => void
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * SeriesCategoryItem - A single focusable category item in the list.
 */
function SeriesCategoryItem({
  category,
  isSelected,
  onSelect,
  testId,
}: SeriesCategoryItemProps) {
  const { ref, focused } = useFocusable({
    focusKey: `SERIES_CATEGORY_${category.id}`,
    onEnterPress: onSelect,
  })

  const handleClick = () => {
    onSelect?.()
  }

  const baseClasses = [
    'w-full',
    'px-4',
    'py-3',
    'text-left',
    'rounded-lg',
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
    : isSelected
      ? ['bg-tv-accent/20', 'text-tv-accent', 'border', 'border-tv-accent/50']
      : ['bg-transparent', 'text-tv-text', 'hover:bg-tv-border']

  const combinedClasses = [...baseClasses, ...stateClasses].join(' ')

  return (
    <button
      ref={ref}
      className={combinedClasses}
      data-testid={testId}
      data-focused={focused}
      data-selected={isSelected}
      tabIndex={0}
      aria-selected={isSelected}
      onClick={handleClick}
    >
      <span className="block truncate text-tv-base font-medium">
        {category.name}
      </span>
    </button>
  )
}

/**
 * SeriesCategoryList - Vertical list of series categories with spatial navigation.
 *
 * Features:
 * - Vertical navigation with TV remote
 * - Visual indication of selected and focused states
 * - Focus context for contained navigation
 * - Scrollable when categories exceed viewport
 */
export function SeriesCategoryList({
  categories,
  selectedCategoryId,
  onCategorySelect,
  testId,
}: SeriesCategoryListProps) {
  const { ref, focusKey } = useFocusable({
    focusKey: 'SERIES_CATEGORY_LIST',
    isFocusBoundary: true,
    focusBoundaryDirections: ['left', 'right'],
    trackChildren: true,
    saveLastFocusedChild: true,
  })

  const handleCategorySelect = useCallback(
    (category: VODCategory) => {
      onCategorySelect?.(category)
    },
    [onCategorySelect]
  )

  if (categories.length === 0) {
    return (
      <div
        className="text-tv-text-muted text-tv-sm p-4 text-center"
        data-testid={testId}
      >
        No categories available
      </div>
    )
  }

  return (
    <FocusContext.Provider value={focusKey}>
      <nav
        ref={ref}
        className="flex flex-col gap-1"
        data-testid={testId}
        role="listbox"
        aria-label="Series categories"
      >
        {categories.map((category) => (
          <SeriesCategoryItem
            key={category.id}
            category={category}
            isSelected={category.id === selectedCategoryId}
            onSelect={() => handleCategorySelect(category)}
            testId={testId ? `${testId}-item-${category.id}` : undefined}
          />
        ))}
      </nav>
    </FocusContext.Provider>
  )
}
