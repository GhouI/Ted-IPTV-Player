import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SeriesPage } from './SeriesPage'
import type { Source } from '../../core/types/source'
import type { VODCategory, Series } from '../../core/types/vod'
import { useSeriesStore } from '../../core/stores/seriesStore'

// Mock the series queries hook
vi.mock('../../core/hooks/useSeriesQueries', () => ({
  useSeriesContent: vi.fn(),
}))

import { useSeriesContent } from '../../core/hooks/useSeriesQueries'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
  // Reset series store before each test
  useSeriesStore.getState().reset()
})

const mockSource: Source = {
  id: 'source-1',
  name: 'Test Source',
  type: 'xtream',
  serverUrl: 'http://example.com',
  username: 'user',
  password: 'pass',
  createdAt: Date.now(),
}

const mockCategories: VODCategory[] = [
  { id: 'cat-1', name: 'Action' },
  { id: 'cat-2', name: 'Comedy' },
]

const mockSeriesList: Series[] = [
  {
    id: 'series-1',
    title: 'Action Series',
    categoryId: 'cat-1',
    poster: 'http://example.com/poster1.jpg',
    year: 2024,
    score: 8.5,
    seasonCount: 3,
  },
  {
    id: 'series-2',
    title: 'Comedy Show',
    categoryId: 'cat-2',
    poster: 'http://example.com/poster2.jpg',
    year: 2023,
    score: 7.2,
    seasonCount: 2,
  },
  {
    id: 'series-3',
    title: 'Another Action',
    categoryId: 'cat-1',
    year: 2022,
    seasonCount: 1,
  },
]

// Helper to create a query client for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

// Helper to render with QueryClientProvider
function renderWithProvider(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('SeriesPage', () => {
  const defaultProps = {
    source: mockSource,
    onSeriesSelect: vi.fn(),
    onBack: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('shows loading skeletons while loading', () => {
      vi.mocked(useSeriesContent).mockReturnValue({
        categories: [],
        series: [],
        isLoading: true,
        isFetching: true,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useSeriesContent>['categoriesQuery'],
        seriesQuery: {} as ReturnType<typeof useSeriesContent>['seriesQuery'],
      })

      renderWithProvider(<SeriesPage {...defaultProps} testId="series-page" />)

      expect(screen.getByTestId('series-page')).toBeInTheDocument()
      expect(screen.getByTestId('series-page-category-skeleton')).toBeInTheDocument()
      expect(screen.getByTestId('series-page-grid-title-skeleton')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows error message when loading fails', () => {
      vi.mocked(useSeriesContent).mockReturnValue({
        categories: [],
        series: [],
        isLoading: false,
        isFetching: false,
        error: new Error('Failed to fetch series'),
        categoriesQuery: {} as ReturnType<typeof useSeriesContent>['categoriesQuery'],
        seriesQuery: {} as ReturnType<typeof useSeriesContent>['seriesQuery'],
      })

      renderWithProvider(<SeriesPage {...defaultProps} testId="series-page" />)

      expect(screen.getByText('Failed to Load Series')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch series')).toBeInTheDocument()
    })

    it('shows back button in error state', () => {
      vi.mocked(useSeriesContent).mockReturnValue({
        categories: [],
        series: [],
        isLoading: false,
        isFetching: false,
        error: new Error('Error'),
        categoriesQuery: {} as ReturnType<typeof useSeriesContent>['categoriesQuery'],
        seriesQuery: {} as ReturnType<typeof useSeriesContent>['seriesQuery'],
      })

      renderWithProvider(<SeriesPage {...defaultProps} testId="series-page" />)

      expect(screen.getByTestId('series-page-back-button')).toBeInTheDocument()
    })

    it('calls onBack when back button clicked in error state', async () => {
      const user = userEvent.setup()
      vi.mocked(useSeriesContent).mockReturnValue({
        categories: [],
        series: [],
        isLoading: false,
        isFetching: false,
        error: new Error('Error'),
        categoriesQuery: {} as ReturnType<typeof useSeriesContent>['categoriesQuery'],
        seriesQuery: {} as ReturnType<typeof useSeriesContent>['seriesQuery'],
      })

      renderWithProvider(<SeriesPage {...defaultProps} testId="series-page" />)

      await user.click(screen.getByTestId('series-page-back-button'))
      expect(defaultProps.onBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('empty state', () => {
    it('shows empty state when no series', () => {
      vi.mocked(useSeriesContent).mockReturnValue({
        categories: mockCategories,
        series: [],
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useSeriesContent>['categoriesQuery'],
        seriesQuery: {} as ReturnType<typeof useSeriesContent>['seriesQuery'],
      })

      renderWithProvider(<SeriesPage {...defaultProps} />)

      expect(screen.getByText('No Series Available')).toBeInTheDocument()
    })

    it('shows empty state when no categories', () => {
      vi.mocked(useSeriesContent).mockReturnValue({
        categories: [],
        series: mockSeriesList,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useSeriesContent>['categoriesQuery'],
        seriesQuery: {} as ReturnType<typeof useSeriesContent>['seriesQuery'],
      })

      renderWithProvider(<SeriesPage {...defaultProps} />)

      expect(screen.getByText('No Series Available')).toBeInTheDocument()
    })

    it('shows message about no source when source is null', () => {
      vi.mocked(useSeriesContent).mockReturnValue({
        categories: [],
        series: [],
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useSeriesContent>['categoriesQuery'],
        seriesQuery: {} as ReturnType<typeof useSeriesContent>['seriesQuery'],
      })

      renderWithProvider(<SeriesPage {...defaultProps} source={null} />)

      expect(screen.getByText('Please select an IPTV source first.')).toBeInTheDocument()
    })
  })

  describe('loaded state', () => {
    beforeEach(() => {
      vi.mocked(useSeriesContent).mockReturnValue({
        categories: mockCategories,
        series: mockSeriesList,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useSeriesContent>['categoriesQuery'],
        seriesQuery: {} as ReturnType<typeof useSeriesContent>['seriesQuery'],
      })
    })

    it('renders category list', () => {
      renderWithProvider(<SeriesPage {...defaultProps} testId="series-page" />)

      expect(screen.getByText('Categories')).toBeInTheDocument()
      expect(screen.getByTestId('series-page-category-list')).toBeInTheDocument()
      expect(screen.getByTestId('series-page-category-list-item-cat-1')).toBeInTheDocument()
      expect(screen.getByTestId('series-page-category-list-item-cat-2')).toBeInTheDocument()
    })

    it('renders series grid', () => {
      renderWithProvider(<SeriesPage {...defaultProps} testId="series-page" />)

      expect(screen.getByTestId('series-page-series-grid')).toBeInTheDocument()
    })

    it('displays series count', async () => {
      renderWithProvider(<SeriesPage {...defaultProps} testId="series-page" />)

      await waitFor(() => {
        expect(screen.getByText(/\(\d+ series\)/)).toBeInTheDocument()
      })
    })

    it('auto-selects first category', async () => {
      renderWithProvider(<SeriesPage {...defaultProps} testId="series-page" />)

      await waitFor(() => {
        const firstCategory = screen.getByTestId('series-page-category-list-item-cat-1')
        expect(firstCategory).toHaveAttribute('aria-selected', 'true')
      })
    })

    it('filters series by selected category', async () => {
      renderWithProvider(<SeriesPage {...defaultProps} testId="series-page" />)

      await waitFor(() => {
        // Should show Action category series (2 series)
        expect(screen.getByText('(2 series)')).toBeInTheDocument()
      })
    })
  })

  describe('interaction', () => {
    beforeEach(() => {
      vi.mocked(useSeriesContent).mockReturnValue({
        categories: mockCategories,
        series: mockSeriesList,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useSeriesContent>['categoriesQuery'],
        seriesQuery: {} as ReturnType<typeof useSeriesContent>['seriesQuery'],
      })
    })

    it('renders focusable category items', () => {
      renderWithProvider(<SeriesPage {...defaultProps} testId="series-page" />)

      const category1 = screen.getByTestId('series-page-category-list-item-cat-1')
      const category2 = screen.getByTestId('series-page-category-list-item-cat-2')

      expect(category1).toHaveAttribute('data-focused')
      expect(category2).toHaveAttribute('data-focused')
      expect(category1).toHaveAttribute('tabindex', '0')
      expect(category2).toHaveAttribute('tabindex', '0')
    })

    it('renders focusable series cards', () => {
      renderWithProvider(<SeriesPage {...defaultProps} testId="series-page" />)

      const series1 = screen.getByTestId('series-page-series-grid-series-series-1')
      expect(series1).toHaveAttribute('role', 'button')
      expect(series1).toHaveAttribute('tabindex', '0')
    })

    it('first category starts selected', () => {
      renderWithProvider(<SeriesPage {...defaultProps} testId="series-page" />)

      const firstCategory = screen.getByTestId('series-page-category-list-item-cat-1')
      expect(firstCategory).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('accessibility', () => {
    beforeEach(() => {
      vi.mocked(useSeriesContent).mockReturnValue({
        categories: mockCategories,
        series: mockSeriesList,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useSeriesContent>['categoriesQuery'],
        seriesQuery: {} as ReturnType<typeof useSeriesContent>['seriesQuery'],
      })
    })

    it('has accessible category sidebar', () => {
      renderWithProvider(<SeriesPage {...defaultProps} />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveAttribute('aria-label', 'Series categories')
    })

    it('has main content area', () => {
      renderWithProvider(<SeriesPage {...defaultProps} />)

      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has heading for categories section', () => {
      renderWithProvider(<SeriesPage {...defaultProps} />)

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Categories')
    })

    it('has heading showing selected category', () => {
      renderWithProvider(<SeriesPage {...defaultProps} />)

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })
  })

  describe('testId', () => {
    it('applies testId to container', () => {
      vi.mocked(useSeriesContent).mockReturnValue({
        categories: mockCategories,
        series: mockSeriesList,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useSeriesContent>['categoriesQuery'],
        seriesQuery: {} as ReturnType<typeof useSeriesContent>['seriesQuery'],
      })

      renderWithProvider(<SeriesPage {...defaultProps} testId="series-page" />)

      expect(screen.getByTestId('series-page')).toBeInTheDocument()
    })

    it('applies testId to category list', () => {
      vi.mocked(useSeriesContent).mockReturnValue({
        categories: mockCategories,
        series: mockSeriesList,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useSeriesContent>['categoriesQuery'],
        seriesQuery: {} as ReturnType<typeof useSeriesContent>['seriesQuery'],
      })

      renderWithProvider(<SeriesPage {...defaultProps} testId="series-page" />)

      expect(screen.getByTestId('series-page-category-list')).toBeInTheDocument()
    })

    it('applies testId to series grid', () => {
      vi.mocked(useSeriesContent).mockReturnValue({
        categories: mockCategories,
        series: mockSeriesList,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useSeriesContent>['categoriesQuery'],
        seriesQuery: {} as ReturnType<typeof useSeriesContent>['seriesQuery'],
      })

      renderWithProvider(<SeriesPage {...defaultProps} testId="series-page" />)

      expect(screen.getByTestId('series-page-series-grid')).toBeInTheDocument()
    })
  })
})
