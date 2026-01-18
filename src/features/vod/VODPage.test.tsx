import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { VODPage } from './VODPage'
import type { Source } from '../../core/types/source'
import type { VODCategory, VODItem } from '../../core/types/vod'
import { useVODStore } from '../../core/stores/vodStore'

// Mock the VOD queries hook
vi.mock('../../core/hooks/useVODQueries', () => ({
  useVODContent: vi.fn(),
}))

import { useVODContent } from '../../core/hooks/useVODQueries'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
  // Reset VOD store before each test
  useVODStore.getState().reset()
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

const mockMovies: VODItem[] = [
  {
    id: 'movie-1',
    title: 'Action Movie',
    categoryId: 'cat-1',
    streamUrl: 'http://example.com/movie1.mp4',
    poster: 'http://example.com/poster1.jpg',
    year: 2024,
    score: 8.5,
  },
  {
    id: 'movie-2',
    title: 'Comedy Film',
    categoryId: 'cat-2',
    streamUrl: 'http://example.com/movie2.mp4',
    poster: 'http://example.com/poster2.jpg',
    year: 2023,
    score: 7.2,
  },
  {
    id: 'movie-3',
    title: 'Another Action',
    categoryId: 'cat-1',
    streamUrl: 'http://example.com/movie3.mp4',
    year: 2022,
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

describe('VODPage', () => {
  const defaultProps = {
    source: mockSource,
    onMoviePlay: vi.fn(),
    onBack: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('shows loading skeletons while loading', () => {
      vi.mocked(useVODContent).mockReturnValue({
        categories: [],
        items: [],
        isLoading: true,
        isFetching: true,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useVODContent>['categoriesQuery'],
        itemsQuery: {} as ReturnType<typeof useVODContent>['itemsQuery'],
      })

      renderWithProvider(<VODPage {...defaultProps} testId="vod-page" />)

      expect(screen.getByTestId('vod-page')).toBeInTheDocument()
      expect(screen.getByTestId('vod-page-category-skeleton')).toBeInTheDocument()
      expect(screen.getByTestId('vod-page-grid-title-skeleton')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows error message when loading fails', () => {
      vi.mocked(useVODContent).mockReturnValue({
        categories: [],
        items: [],
        isLoading: false,
        isFetching: false,
        error: new Error('Failed to fetch movies'),
        categoriesQuery: {} as ReturnType<typeof useVODContent>['categoriesQuery'],
        itemsQuery: {} as ReturnType<typeof useVODContent>['itemsQuery'],
      })

      renderWithProvider(<VODPage {...defaultProps} testId="vod-page" />)

      expect(screen.getByText('Failed to Load Movies')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch movies')).toBeInTheDocument()
    })

    it('shows back button in error state', () => {
      vi.mocked(useVODContent).mockReturnValue({
        categories: [],
        items: [],
        isLoading: false,
        isFetching: false,
        error: new Error('Error'),
        categoriesQuery: {} as ReturnType<typeof useVODContent>['categoriesQuery'],
        itemsQuery: {} as ReturnType<typeof useVODContent>['itemsQuery'],
      })

      renderWithProvider(<VODPage {...defaultProps} testId="vod-page" />)

      expect(screen.getByTestId('vod-page-back-button')).toBeInTheDocument()
    })

    it('calls onBack when back button clicked in error state', async () => {
      const user = userEvent.setup()
      vi.mocked(useVODContent).mockReturnValue({
        categories: [],
        items: [],
        isLoading: false,
        isFetching: false,
        error: new Error('Error'),
        categoriesQuery: {} as ReturnType<typeof useVODContent>['categoriesQuery'],
        itemsQuery: {} as ReturnType<typeof useVODContent>['itemsQuery'],
      })

      renderWithProvider(<VODPage {...defaultProps} testId="vod-page" />)

      await user.click(screen.getByTestId('vod-page-back-button'))
      expect(defaultProps.onBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('empty state', () => {
    it('shows empty state when no movies', () => {
      vi.mocked(useVODContent).mockReturnValue({
        categories: mockCategories,
        items: [],
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useVODContent>['categoriesQuery'],
        itemsQuery: {} as ReturnType<typeof useVODContent>['itemsQuery'],
      })

      renderWithProvider(<VODPage {...defaultProps} />)

      expect(screen.getByText('No Movies Available')).toBeInTheDocument()
    })

    it('shows empty state when no categories', () => {
      vi.mocked(useVODContent).mockReturnValue({
        categories: [],
        items: mockMovies,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useVODContent>['categoriesQuery'],
        itemsQuery: {} as ReturnType<typeof useVODContent>['itemsQuery'],
      })

      renderWithProvider(<VODPage {...defaultProps} />)

      expect(screen.getByText('No Movies Available')).toBeInTheDocument()
    })

    it('shows message about no source when source is null', () => {
      vi.mocked(useVODContent).mockReturnValue({
        categories: [],
        items: [],
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useVODContent>['categoriesQuery'],
        itemsQuery: {} as ReturnType<typeof useVODContent>['itemsQuery'],
      })

      renderWithProvider(<VODPage {...defaultProps} source={null} />)

      expect(screen.getByText('Please select an IPTV source first.')).toBeInTheDocument()
    })
  })

  describe('loaded state', () => {
    beforeEach(() => {
      vi.mocked(useVODContent).mockReturnValue({
        categories: mockCategories,
        items: mockMovies,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useVODContent>['categoriesQuery'],
        itemsQuery: {} as ReturnType<typeof useVODContent>['itemsQuery'],
      })
    })

    it('renders category list', () => {
      renderWithProvider(<VODPage {...defaultProps} testId="vod-page" />)

      expect(screen.getByText('Categories')).toBeInTheDocument()
      expect(screen.getByTestId('vod-page-category-list')).toBeInTheDocument()
      expect(screen.getByTestId('vod-page-category-list-item-cat-1')).toBeInTheDocument()
      expect(screen.getByTestId('vod-page-category-list-item-cat-2')).toBeInTheDocument()
    })

    it('renders movie grid', () => {
      renderWithProvider(<VODPage {...defaultProps} testId="vod-page" />)

      expect(screen.getByTestId('vod-page-movie-grid')).toBeInTheDocument()
    })

    it('displays movie count', async () => {
      renderWithProvider(<VODPage {...defaultProps} testId="vod-page" />)

      await waitFor(() => {
        expect(screen.getByText(/\(\d+ movies\)/)).toBeInTheDocument()
      })
    })

    it('auto-selects first category', async () => {
      renderWithProvider(<VODPage {...defaultProps} testId="vod-page" />)

      await waitFor(() => {
        const firstCategory = screen.getByTestId('vod-page-category-list-item-cat-1')
        expect(firstCategory).toHaveAttribute('aria-selected', 'true')
      })
    })

    it('filters movies by selected category', async () => {
      renderWithProvider(<VODPage {...defaultProps} testId="vod-page" />)

      await waitFor(() => {
        // Should show Action category movies (2 movies)
        expect(screen.getByText('(2 movies)')).toBeInTheDocument()
      })
    })
  })

  describe('interaction', () => {
    beforeEach(() => {
      vi.mocked(useVODContent).mockReturnValue({
        categories: mockCategories,
        items: mockMovies,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useVODContent>['categoriesQuery'],
        itemsQuery: {} as ReturnType<typeof useVODContent>['itemsQuery'],
      })
    })

    it('renders focusable category items', () => {
      renderWithProvider(<VODPage {...defaultProps} testId="vod-page" />)

      const category1 = screen.getByTestId('vod-page-category-list-item-cat-1')
      const category2 = screen.getByTestId('vod-page-category-list-item-cat-2')

      expect(category1).toHaveAttribute('data-focused')
      expect(category2).toHaveAttribute('data-focused')
      expect(category1).toHaveAttribute('tabindex', '0')
      expect(category2).toHaveAttribute('tabindex', '0')
    })

    it('renders focusable movie cards', () => {
      renderWithProvider(<VODPage {...defaultProps} testId="vod-page" />)

      const movie1 = screen.getByTestId('vod-page-movie-grid-movie-movie-1')
      expect(movie1).toHaveAttribute('role', 'button')
      expect(movie1).toHaveAttribute('tabindex', '0')
    })

    it('first category starts selected', () => {
      renderWithProvider(<VODPage {...defaultProps} testId="vod-page" />)

      const firstCategory = screen.getByTestId('vod-page-category-list-item-cat-1')
      expect(firstCategory).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('accessibility', () => {
    beforeEach(() => {
      vi.mocked(useVODContent).mockReturnValue({
        categories: mockCategories,
        items: mockMovies,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useVODContent>['categoriesQuery'],
        itemsQuery: {} as ReturnType<typeof useVODContent>['itemsQuery'],
      })
    })

    it('has accessible category sidebar', () => {
      renderWithProvider(<VODPage {...defaultProps} />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveAttribute('aria-label', 'Movie categories')
    })

    it('has main content area', () => {
      renderWithProvider(<VODPage {...defaultProps} />)

      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has heading for categories section', () => {
      renderWithProvider(<VODPage {...defaultProps} />)

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Categories')
    })

    it('has heading showing selected category', () => {
      renderWithProvider(<VODPage {...defaultProps} />)

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })
  })

  describe('testId', () => {
    it('applies testId to container', () => {
      vi.mocked(useVODContent).mockReturnValue({
        categories: mockCategories,
        items: mockMovies,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useVODContent>['categoriesQuery'],
        itemsQuery: {} as ReturnType<typeof useVODContent>['itemsQuery'],
      })

      renderWithProvider(<VODPage {...defaultProps} testId="vod-page" />)

      expect(screen.getByTestId('vod-page')).toBeInTheDocument()
    })

    it('applies testId to category list', () => {
      vi.mocked(useVODContent).mockReturnValue({
        categories: mockCategories,
        items: mockMovies,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useVODContent>['categoriesQuery'],
        itemsQuery: {} as ReturnType<typeof useVODContent>['itemsQuery'],
      })

      renderWithProvider(<VODPage {...defaultProps} testId="vod-page" />)

      expect(screen.getByTestId('vod-page-category-list')).toBeInTheDocument()
    })

    it('applies testId to movie grid', () => {
      vi.mocked(useVODContent).mockReturnValue({
        categories: mockCategories,
        items: mockMovies,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useVODContent>['categoriesQuery'],
        itemsQuery: {} as ReturnType<typeof useVODContent>['itemsQuery'],
      })

      renderWithProvider(<VODPage {...defaultProps} testId="vod-page" />)

      expect(screen.getByTestId('vod-page-movie-grid')).toBeInTheDocument()
    })
  })
})
